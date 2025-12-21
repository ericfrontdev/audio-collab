'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createTrack, uploadTake } from '@/app/actions/studio';
import { toast } from 'react-toastify';
import { ProjectTrack, AUDIO_CONSTRAINTS, isAudioFile, isFileSizeValid } from '@/lib/types/studio';

interface UploadTrackModalProps {
  projectId: string;
  existingTracks: ProjectTrack[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  droppedFile?: File | null;
}

export function UploadTrackModal({
  projectId,
  existingTracks,
  isOpen,
  onClose,
  onSuccess,
  droppedFile,
}: UploadTrackModalProps) {
  const [uploadType, setUploadType] = useState<'new-track' | 'add-take'>('new-track');
  const [trackName, setTrackName] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

      // Upload the audio file
      console.log('Uploading audio file to track:', trackId);
      const formData = new FormData();
      formData.append('audio', selectedFile);

      setUploadProgress(50);
      const uploadResult = await uploadTake(trackId, formData);
      console.log('Upload result:', uploadResult);

      if (!uploadResult.success) {
        console.error('Upload failed with details:', (uploadResult as any).errorDetails);
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
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload audio');
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
          <h2 className="text-xl font-semibold text-white">Upload Audio</h2>
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
          {/* Upload Type Selection */}
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

          {/* Track Selection (for adding takes) */}
          {uploadType === 'add-take' && existingTracks.length > 0 && (
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
