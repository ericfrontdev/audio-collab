'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';
import * as Tone from 'tone';

interface WaveformDisplayProps {
  audioUrl: string;
  trackId: string;
  trackColor: string;
  waveformData?: number[] | null;
  onReady?: (duration: number) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onAudioLevel?: (level: number, peak: number) => void;
  height?: number;
}

export interface WaveformDisplayRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setTime: (time: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  isPlaying: () => boolean;
  setVolume: (volume: number) => void;
  setMute: (muted: boolean) => void;
}

export const WaveformDisplay = forwardRef<WaveformDisplayRef, WaveformDisplayProps>(
  function WaveformDisplay(
    {
      audioUrl,
      trackId,
      trackColor,
      waveformData,
      onReady,
      onSeek,
      onTimeUpdate,
      onAudioLevel,
      height = 80,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Store callbacks in refs to avoid recreating WaveSurfer
    const onReadyRef = useRef(onReady);
    const onSeekRef = useRef(onSeek);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
      onReadyRef.current = onReady;
      onSeekRef.current = onSeek;
      onTimeUpdateRef.current = onTimeUpdate;
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      play: () => wavesurferRef.current?.play(),
      pause: () => wavesurferRef.current?.pause(),
      seekTo: (time: number) => wavesurferRef.current?.seekTo(time / (wavesurferRef.current?.getDuration() || 1)),
      setTime: (time: number) => {
        // Directly set time without checking current time to reduce overhead
        wavesurferRef.current?.setTime(time)
      },
      getDuration: () => wavesurferRef.current?.getDuration() || 0,
      getCurrentTime: () => wavesurferRef.current?.getCurrentTime() || 0,
      isPlaying: () => wavesurferRef.current?.isPlaying() || false,
      setVolume: (volume: number) => wavesurferRef.current?.setVolume(volume),
      setMute: (muted: boolean) => wavesurferRef.current?.setMuted(muted),
    }));

  useEffect(() => {
    if (!containerRef.current) return;

    let isCleanedUp = false;

    // Cleanup previous instance synchronously
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.unAll();
        wavesurferRef.current.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
      wavesurferRef.current = null;
    }

    // Clear the container completely
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    setIsLoading(true);
    setError(null);

    // Get Tone.js AudioContext to share with WaveSurfer
    const toneContext = Tone.getContext();

    // Create WaveSurfer instance (visualization only, no audio playback)
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: trackColor,
      progressColor: trackColor,
      cursorColor: 'transparent', // Hide cursor, use global playhead instead
      cursorWidth: 0,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height,
      normalize: true,
      // Share the same AudioContext as Tone.js for precise synchronization
      audioContext: toneContext.rawContext as AudioContext,
      backend: 'WebAudio',
      interact: false, // Disable WaveSurfer's click-to-seek to allow comment overlay to work
      // Mute the audio since Tone.js handles playback
      volume: 0,
    });

    wavesurferRef.current = wavesurfer;

    // Track if component is still mounted
    let isMounted = true;

    // Load audio with pre-computed peaks if available (much faster!)
    if (waveformData && waveformData.length > 0) {
      wavesurfer.load(audioUrl, [waveformData]);
    } else {
      wavesurfer.load(audioUrl);
    }

    // Event listeners
    wavesurfer.on('ready', () => {
      if (isMounted) {
        setIsLoading(false);
        if (onReadyRef.current) {
          onReadyRef.current(wavesurfer.getDuration());
        }
      }
    });

    wavesurfer.on('error', (err) => {
      if (isMounted) {
        console.error('WaveSurfer error:', err);
        setError('Failed to load waveform');
        setIsLoading(false);
      }
    });

    wavesurfer.on('seeking', () => {
      if (onSeekRef.current) {
        onSeekRef.current(wavesurfer.getCurrentTime());
      }
    });

    wavesurfer.on('timeupdate', (time) => {
      if (onTimeUpdateRef.current) {
        onTimeUpdateRef.current(time);
      }
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      isCleanedUp = true;

      // Clear the ref immediately
      wavesurferRef.current = null;

      // Only remove event listeners, don't destroy
      // Destroying during unmount causes AbortError when audio is still loading
      // The browser's garbage collector will handle cleanup
      try {
        wavesurfer.unAll();
      } catch (error) {
        // Silently ignore - component already unmounted
      }
    };
  }, [audioUrl, trackId]);

  // Update colors dynamically without reloading
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setOptions({
        waveColor: trackColor,
        progressColor: trackColor,
      });
    }
  }, [trackColor]);

  // Audio level monitoring
  useEffect(() => {
    if (!onAudioLevel || !wavesurferRef.current) return;

    const wavesurfer = wavesurferRef.current;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number | null = null;
    let peakValue = 0;
    let peakHoldTime = 0;

    const setupAnalyser = () => {
      try {
        // Get the backend (WebAudio)
        const backend = (wavesurfer as any).backend;
        if (!backend || !backend.audioContext) return;

        const audioContext = backend.audioContext as AudioContext;

        // Create analyser node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        // Connect to the audio graph
        if (backend.gainNode) {
          backend.gainNode.connect(analyser);
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!analyser || !wavesurfer?.isPlaying()) {
            // Decay when not playing
            if (peakValue > 0) {
              peakValue *= 0.95;
              onAudioLevel?.(0, (peakValue / 255) * 100);
            }
            animationFrameId = requestAnimationFrame(updateLevel);
            return;
          }

          analyser.getByteFrequencyData(dataArray);

          // Calculate RMS level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const level = (rms / 255) * 100;

          // Update peak with hold time
          const now = Date.now();
          if (rms > peakValue || now - peakHoldTime > 1000) {
            peakValue = rms;
            peakHoldTime = now;
          } else {
            peakValue *= 0.98; // Slow decay
          }

          const peak = (peakValue / 255) * 100;

          onAudioLevel(level, peak);

          animationFrameId = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (error) {
        console.error('Error setting up audio analyser:', error);
      }
    };

    // Setup analyser when audio is ready
    const onReady = () => setupAnalyser();
    wavesurfer.on('ready', onReady);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (analyser) {
        try {
          analyser.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      wavesurfer.un('ready', onReady);
    };
  }, [onAudioLevel]);

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Loading waveform...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded">
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="rounded"
        style={{ minHeight: `${height}px` }}
      />
    </div>
  );
});
