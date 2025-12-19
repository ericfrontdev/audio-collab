'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Plus, Share2, Upload as UploadIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadTrackModal } from './UploadTrackModal';
import { getProjectStudioData } from '@/app/actions/studio';
import { ProjectTrack } from '@/lib/types/studio';

interface StudioViewProps {
  projectId: string;
}

export function StudioView({ projectId }: StudioViewProps) {
  const [tracks, setTracks] = useState<ProjectTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Load studio data
  const loadStudioData = async () => {
    setIsLoading(true);
    const result = await getProjectStudioData(projectId);
    if (result.success && result.tracks) {
      setTracks(result.tracks as any);
      if (result.tracks.length > 0 && !selectedTrackId) {
        setSelectedTrackId(result.tracks[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudioData();
  }, [projectId]);

  const handleUploadSuccess = () => {
    loadStudioData();
  };

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header with Transport Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/80">
        {/* Left: Project info */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Audio Track</h1>
          <span className="text-sm text-gray-400">Saved just now</span>
        </div>

        {/* Center: Transport Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => setCurrentTime(0)}
          >
            <SkipBack className="w-4 h-4 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 bg-primary hover:bg-primary/90"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={tracks.length === 0}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
          >
            <SkipForward className="w-4 h-4 text-gray-400" />
          </Button>

          <div className="ml-4 font-mono text-white text-lg">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button size="sm">
            <UploadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Studio Layout: 3 Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Track List */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white mb-3">Tracks</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-3">No tracks yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedTrackId === track.id
                        ? 'bg-zinc-800 text-white'
                        : 'text-gray-400 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="text-sm font-medium truncate">{track.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: '80%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">80%</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800">
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Track
            </Button>
          </div>
        </div>

        {/* Center: Timeline & Waveforms */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {tracks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No tracks yet</h3>
                <p className="text-gray-400 mb-6">
                  Upload your first audio track to get started
                </p>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Track
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Timeline Ruler */}
              <div className="h-12 border-b border-zinc-800 bg-zinc-900/30 px-4">
                <div className="h-full flex items-center">
                  <div className="flex-1 flex justify-between text-xs text-gray-500">
                    <span>00:00</span>
                    <span>00:15</span>
                    <span>00:30</span>
                    <span>00:45</span>
                    <span>01:00</span>
                    <span>01:15</span>
                    <span>01:30</span>
                    <span>01:45</span>
                  </div>
                </div>
              </div>

              {/* Tracks & Waveforms */}
              <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="h-20 rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors"
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      {/* Placeholder waveform */}
                      <div className="h-full flex items-center px-4">
                        <div className="flex-1 h-16 bg-gradient-to-r from-blue-500/20 to-blue-500/5 rounded flex items-center justify-center">
                          <span className="text-gray-600 text-sm">Waveform: {track.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drag & Drop Zone */}
                <div className="p-4">
                  <div
                    className="h-32 border-2 border-dashed border-zinc-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-zinc-700 transition-colors"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <div className="text-center">
                      <UploadIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Drag and Drop here or choose file</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar: Track Controls (only show if track selected) */}
        {selectedTrack && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{selectedTrack.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setSelectedTrackId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Volume */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Volume</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="80"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-12 text-right">80%</span>
                </div>
              </div>

              {/* Amplifier */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Amplifier</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📊</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="0"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-12 text-right">0%</span>
                </div>
              </div>

              {/* Pan */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Pan</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">🎧</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    defaultValue="0"
                    className="flex-1"
                  />
                  <span className="text-gray-400">🎧</span>
                </div>
              </div>

              {/* Update Feature - Placeholder */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">Update Feature</label>
                <div className="p-6 border border-zinc-800 rounded-lg text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <span className="text-2xl">🔇</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">Noise Cancelation</p>
                  <p className="text-xs text-gray-500">You can remove noise from your audio sound</p>
                </div>
              </div>
            </div>
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
