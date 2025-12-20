'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformDisplayProps {
  audioUrl: string;
  trackId: string;
  trackColor: string;
  onReady?: (duration: number) => void;
  onSeek?: (time: number) => void;
  height?: number;
}

export function WaveformDisplay({
  audioUrl,
  trackId,
  trackColor,
  onReady,
  onSeek,
  height = 80,
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    setIsLoading(true);
    setError(null);

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: trackColor + '40', // 25% opacity
      progressColor: trackColor,
      cursorColor: '#ffffff',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height,
      normalize: true,
      backend: 'WebAudio',
      interact: true,
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioUrl);

    // Event listeners
    wavesurfer.on('ready', () => {
      setIsLoading(false);
      if (onReady) {
        onReady(wavesurfer.getDuration());
      }
    });

    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setError('Failed to load waveform');
      setIsLoading(false);
    });

    wavesurfer.on('seeking', () => {
      if (onSeek) {
        onSeek(wavesurfer.getCurrentTime());
      }
    });

    // Cleanup on unmount
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, trackId, trackColor, height, onReady, onSeek]);

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
}
