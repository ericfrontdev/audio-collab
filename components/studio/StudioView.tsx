'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadTrackModal } from './UploadTrackModal';
import { getProjectStudioData } from '@/app/actions/studio';
import { ProjectTrack } from '@/lib/types/studio';

interface StudioViewProps {
  projectId: string;
}

export function StudioView({ projectId }: StudioViewProps) {
  const [tracks, setTracks] = useState<ProjectTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load studio data
  const loadStudioData = async () => {
    setIsLoading(true);
    const result = await getProjectStudioData(projectId);
    if (result.success && result.tracks) {
      setTracks(result.tracks as any);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudioData();
  }, [projectId]);

  const handleUploadSuccess = () => {
    loadStudioData();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">Project Studio</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={tracks.length === 0}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>

          {/* Upload Track Button */}
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Track
          </Button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading studio...</p>
            </div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-medium text-white mb-2">No tracks yet</h3>
              <p className="text-gray-400 mb-6">
                Get started by uploading your first audio track
              </p>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Track
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{track.name}</h3>
                    <p className="text-sm text-gray-400">
                      {(track as any).takes?.length || 0} take(s)
                    </p>
                  </div>
                </div>

                {/* Track waveform will go here in Phase 3 */}
                <div className="mt-4 h-24 bg-zinc-800/50 rounded flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Waveform visualization (coming in Phase 3)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadTrackModal
        projectId={projectId}
        existingTracks={tracks}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
