'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createTrack } from '@/app/actions/studio';
import { toast } from 'react-toastify';
import { ProjectTrack, AUDIO_CONSTRAINTS, isAudioFile, isFileSizeValid } from '@/lib/types/studio';

// Generate waveform peaks from audio file
// Generates a fixed number of peaks per second for consistent visual scaling
async function generateWaveformPeaks(file: File, peaksPerSecond: number = 100): Promise<number[]> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const rawData = audioBuffer.getChannelData(0); // Get first channel
    const duration = audioBuffer.duration;

    // Generate peaks based on duration, not sample count
    // This ensures consistent visual scaling regardless of sample rate
    const peaksCount = Math.floor(duration * peaksPerSecond);
    const samplesPerPeak = rawData.length / peaksCount;
    const peaks: number[] = [];

    for (let i = 0; i < peaksCount; i++) {
      const start = Math.floor(i * samplesPerPeak);
      const end = Math.floor((i + 1) * samplesPerPeak);
      let max = 0;

      for (let j = start; j < end && j < rawData.length; j++) {
        const abs = Math.abs(rawData[j]);
        if (abs > max) max = abs;
      }

      peaks.push(max);
    }

    return peaks;
  } finally {
    await audioContext.close();
  }
}

interface UploadTrackModalProps {
  projectId: string;
  existingTracks: ProjectTrack[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trackId: string) => void;
  droppedFile?: File | null;
  targetTrackId?: string | null;
}

export function UploadTrackModal({
  projectId,
  existingTracks,
  isOpen,
  onClose,
  onSuccess,
  droppedFile,
  targetTrackId,
}: UploadTrackModalProps) {
  // Find target track if specified
  const targetTrack = targetTrackId ? existingTracks.find((t) => t.id === targetTrackId) : null;

  // If targetTrackId is provided, we're always uploading to that existing track
  const [uploadType, setUploadType] = useState<'new-track' | 'add-take'>(
    targetTrackId ? 'add-take' : 'new-track'
  );
  const [trackName, setTrackName] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(targetTrackId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Reset state when modal opens or targetTrackId changes
  useEffect(() => {
    if (isOpen) {
      // Set upload type based on targetTrackId
      setUploadType(targetTrackId ? 'add-take' : 'new-track');
      // Set selected track ID
      setSelectedTrackId(targetTrackId || '');
    }
  }, [isOpen, targetTrackId]);

  // Handle dropped file from drag & drop
  useEffect(() => {
    if (droppedFile && isOpen) {
      // Validate file type
      if (!isAudioFile(droppedFile)) {
        toast.error('Please select a valid audio file (MP3, WAV, FLAC, M4A, or OGG)');
        return;
      }

      // Validate file size
      if (!isFileSizeValid(droppedFile)) {
        toast.error(`File size must be less than ${AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        return;
      }

      setSelectedFile(droppedFile);
      // Auto-generate track name from file name
      const nameWithoutExtension = droppedFile.name.replace(/\.[^/.]+$/, '');
      setTrackName(nameWithoutExtension);
    }
  }, [droppedFile, isOpen]);

  if (!isOpen) return null;

  // Add error boundary check
  if (!projectId) {
    console.error('UploadTrackModal: projectId is required');
    return null;
  }

  if (!existingTracks) {
    console.error('UploadTrackModal: existingTracks is required');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isAudioFile(file)) {
      toast.error('Please select a valid audio file (MP3, WAV, FLAC, M4A, or OGG)');
      return;
    }

    // Validate file size
    if (!isFileSizeValid(file)) {
      toast.error(`File size must be less than ${AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedFile) {
        toast.error('Please select an audio file');
        return;
      }

      if (uploadType === 'new-track' && !trackName.trim()) {
        toast.error('Please enter a track name');
        return;
      }

      if (uploadType === 'add-take' && !selectedTrackId) {
        toast.error('Please select a track');
        return;
      }

      setIsUploading(true);
      setUploadProgress(10);

      let trackId = selectedTrackId;

      // If creating a new track, create it first
      if (uploadType === 'new-track') {
        console.log('Creating new track:', trackName);
        setUploadProgress(20);
        const trackResult = await createTrack(projectId, trackName.trim());
        console.log('Track creation result:', trackResult);

        if (!trackResult.success || !trackResult.track) {
          throw new Error(trackResult.error || 'Failed to create track');
        }

        trackId = trackResult.track.id;
        setUploadProgress(40);
      } else {
        setUploadProgress(30);
      }

      // Generate waveform peaks before uploading
      console.log('🔧 Generating waveform data...');
      setUploadProgress(40);
      const waveformStartTime = performance.now();
      let waveformPeaks: number[] = [];
      try {
        waveformPeaks = await generateWaveformPeaks(selectedFile);
        const waveformEndTime = performance.now();
        const waveformDuration = ((waveformEndTime - waveformStartTime) / 1000).toFixed(2);
        console.log(`✅ Waveform peaks generated in ${waveformDuration}s:`, waveformPeaks.length, 'samples');
        console.log('📊 First 10 peaks:', waveformPeaks.slice(0, 10));
      } catch (error) {
        console.error('❌ Failed to generate waveform peaks:', error);
        // Continue without peaks if generation fails
      }

      // Double-check file size (should already be validated, but this is a failsafe)
      if (!isFileSizeValid(selectedFile)) {
        throw new Error(
          `File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB. Please compress your audio file.`
        );
      }

      // Step 1: Request a signed upload URL from our API
      console.log('📝 Requesting signed upload URL...');
      setUploadProgress(50);
      const urlResponse = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate upload URL');
      }

      const { uploadUrl, filePath, token } = await urlResponse.json();
      console.log('✅ Got signed URL, uploading file directly to Supabase Storage...');

      // Step 2: Upload file directly to Supabase Storage with real-time progress tracking
      console.log('📤 Uploading file to Supabase Storage with progress tracking...');
      console.log(`📦 File size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      setUploadProgress(60); // Set to 60% before starting upload
      const uploadStartTime = performance.now();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Map upload progress from 60% to 90%
            const uploadPercent = (e.loaded / e.total) * 100;
            const mappedProgress = 60 + (uploadPercent * 0.3); // 60% + (0-100% * 30%)
            const elapsed = ((performance.now() - uploadStartTime) / 1000).toFixed(1);
            const speed = ((e.loaded / 1024 / 1024) / parseFloat(elapsed)).toFixed(2);
            setUploadProgress(Math.round(mappedProgress));
            console.log(`📊 Upload: ${uploadPercent.toFixed(1)}% | ${(e.loaded / 1024 / 1024).toFixed(2)}MB/${(e.total / 1024 / 1024).toFixed(2)}MB | ${speed}MB/s | ${elapsed}s`);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const uploadEndTime = performance.now();
            const uploadDuration = ((uploadEndTime - uploadStartTime) / 1000).toFixed(2);
            console.log(`✅ File uploaded to storage in ${uploadDuration}s`);
            setUploadProgress(90);
            resolve();
          } else {
            reject(new Error(`Storage upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Storage upload failed due to network error'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Storage upload was aborted'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', selectedFile.type);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.send(selectedFile);
      });

      // Step 3: Finalize the upload by creating the take record
      console.log('📝 Creating take record in database...');
      const finalizeStartTime = performance.now();
      const finalizeResponse = await fetch('/api/finalize-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          filePath,
          fileSize: selectedFile.size,
          fileFormat: selectedFile.name.split('.').pop(),
          waveformData: waveformPeaks.length > 0 ? waveformPeaks : null,
        }),
      });

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to finalize upload');
      }

      const uploadResult = await finalizeResponse.json();
      const finalizeDuration = ((performance.now() - finalizeStartTime) / 1000).toFixed(2);
      console.log(`✅ Upload finalized in ${finalizeDuration}s:`, uploadResult);

      if (!uploadResult.success) {
        interface UploadResultWithDetails {
          errorDetails?: {
            code?: string;
            details?: string;
            hint?: string;
            message: string;
          };
        }
        console.error('Upload failed with details:', (uploadResult as UploadResultWithDetails).errorDetails);
        throw new Error(uploadResult.error || 'Failed to upload audio');
      }

      setUploadProgress(100);
      toast.success(
        uploadType === 'new-track'
          ? 'Track created successfully!'
          : 'Take added successfully!'
      );

      // Reset form
      setTrackName('');
      setSelectedFile(null);
      setSelectedTrackId('');
      setUploadProgress(0);

      // Call success callback and close modal
      onSuccess(trackId);
      onClose();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload audio');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const resetAndClose = () => {
    if (!isUploading) {
      setTrackName('');
      setSelectedFile(null);
      setSelectedTrackId('');
      setUploadType('new-track');
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Upload Audio</h2>
            {targetTrack && (
              <p className="text-sm text-zinc-400 mt-1">
                Pour la piste : <span className="text-white font-medium">{targetTrack.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={resetAndClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Upload Type Selection - Only show if no target track specified */}
          {!targetTrackId && (
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Upload Type
              </label>
              <div className="flex gap-4">
                <label className="flex-1">
                  <input
                    type="radio"
                    name="uploadType"
                    value="new-track"
                    checked={uploadType === 'new-track'}
                    onChange={(e) => setUploadType(e.target.value as 'new-track')}
                    disabled={isUploading}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-zinc-700 cursor-pointer peer-checked:border-primary peer-checked:bg-primary/10 hover:border-zinc-600 transition-all">
                    <div className="text-sm font-medium text-white">New Track</div>
                    <div className="text-xs text-gray-400 mt-1">Create a new track</div>
                  </div>
                </label>

                <label className="flex-1">
                  <input
                    type="radio"
                    name="uploadType"
                    value="add-take"
                    checked={uploadType === 'add-take'}
                    onChange={(e) => setUploadType(e.target.value as 'add-take')}
                    disabled={isUploading || existingTracks.length === 0}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-zinc-700 cursor-pointer peer-checked:border-primary peer-checked:bg-primary/10 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed hover:border-zinc-600 transition-all">
                    <div className="text-sm font-medium text-white">Add Take</div>
                    <div className="text-xs text-gray-400 mt-1">Add to existing track</div>
                  </div>
                </label>
              </div>
              {existingTracks.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Create your first track to enable adding takes
                </p>
              )}
            </div>
          )}

          {/* Track Name Input (for new tracks) */}
          {uploadType === 'new-track' && (
            <div>
              <label htmlFor="trackName" className="block text-sm font-medium text-white mb-2">
                Track Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="trackName"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="e.g., Lead Vocals, Bass, Drums"
                disabled={isUploading}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                maxLength={100}
              />
            </div>
          )}

          {/* Track Selection (for adding takes) - Only show if no target track specified */}
          {!targetTrackId && uploadType === 'add-take' && existingTracks.length > 0 && (
            <div>
              <label htmlFor="trackSelect" className="block text-sm font-medium text-white mb-2">
                Select Track <span className="text-red-500">*</span>
              </label>
              <select
                id="trackSelect"
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              >
                <option value="">Choose a track...</option>
                {existingTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Audio File <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-zinc-700 hover:border-primary/50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {selectedFile ? selectedFile.name : 'Choose audio file'}
                </span>
                <input
                  type="file"
                  accept={AUDIO_CONSTRAINTS.SUPPORTED_FORMATS.join(',')}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Supported formats: MP3, WAV, FLAC, M4A, OGG (max {AUDIO_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB)
            </p>
            {selectedFile && (
              <div className="mt-2 text-xs text-gray-400">
                File size: {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Uploading...</span>
                <span className="text-white">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
