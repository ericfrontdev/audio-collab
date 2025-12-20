'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Plus, Share2, Upload as UploadIcon, X, ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UploadTrackModal } from './UploadTrackModal';
import { getProjectStudioData, deleteTrack, addTrackComment } from '@/app/actions/studio';
import { ProjectTrack, ProjectTrackComment } from '@/lib/types/studio';
import { toast } from 'react-toastify';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { WaveformDisplay, WaveformDisplayRef } from './WaveformDisplay';
import { AddCommentModal } from './AddCommentModal';

interface StudioViewProps {
  projectId: string;
}

// Extended track type with comments and takes
interface TrackWithDetails extends ProjectTrack {
  takes?: any[];
  comments?: any[];
  mixer_settings?: any;
}

export function StudioView({ projectId }: StudioViewProps) {
  const router = useRouter();
  const [tracks, setTracks] = useState<TrackWithDetails[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    trackId: string;
    trackName: string;
  }>({ isOpen: false, trackId: '', trackName: '' });
  const waveformRefs = useRef<Map<string, WaveformDisplayRef>>(new Map());
  const [trackVolumes, setTrackVolumes] = useState<Map<string, number>>(new Map());
  const [trackMutes, setTrackMutes] = useState<Set<string>>(new Set());
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    trackId: string;
    timestamp: number;
    position: { x: number; y: number };
  }>({ isOpen: false, trackId: '', timestamp: 0, position: { x: 0, y: 0 } });
  const [currentUser, setCurrentUser] = useState<{ avatar_url?: string | null } | null>(null);
  const primaryColor = '#9363f7'; // Exact primary button color

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

    // Load current user profile
    const loadUserProfile = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    };
    loadUserProfile();
  }, [projectId]);

  const handleUploadSuccess = () => {
    loadStudioData();
  };

  const handleDeleteTrack = (trackId: string, trackName: string) => {
    setDeleteConfirmation({ isOpen: true, trackId, trackName });
  };

  const confirmDeleteTrack = async () => {
    const { trackId, trackName } = deleteConfirmation;
    setDeleteConfirmation({ isOpen: false, trackId: '', trackName: '' });

    const result = await deleteTrack(trackId);
    if (result.success) {
      // Remove track from local state without reloading
      setTracks(prevTracks => prevTracks.filter(t => t.id !== trackId));
      if (selectedTrackId === trackId) {
        setSelectedTrackId(null);
      }
      toast.success(`Track "${trackName}" deleted successfully`);
    } else {
      toast.error(result.error || 'Failed to delete track');
    }
  };

  const cancelDeleteTrack = () => {
    setDeleteConfirmation({ isOpen: false, trackId: '', trackName: '' });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause all waveforms
      waveformRefs.current.forEach((ref) => ref.pause());
      setIsPlaying(false);
    } else {
      // Play all waveforms
      waveformRefs.current.forEach((ref) => ref.play());
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    waveformRefs.current.forEach((ref) => {
      ref.pause();
      ref.seekTo(0);
    });
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    const waveformRef = waveformRefs.current.get(trackId);
    if (waveformRef) {
      waveformRef.setVolume(volume / 100);
      setTrackVolumes(prev => {
        const newMap = new Map(prev);
        newMap.set(trackId, volume);
        return newMap;
      });
    }
  }, []);

  const handleMuteToggle = useCallback((trackId: string) => {
    const waveformRef = waveformRefs.current.get(trackId);
    if (waveformRef) {
      setTrackMutes(prev => {
        const newMutes = new Set(prev);
        if (newMutes.has(trackId)) {
          newMutes.delete(trackId);
          waveformRef.setMute(false);
        } else {
          newMutes.add(trackId);
          waveformRef.setMute(true);
        }
        return newMutes;
      });
    }
  }, []);

  const handleWaveformReady = useCallback((duration: number) => {
    setMaxDuration(prev => Math.max(prev, duration));
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Handle timeline seek (click and drag)
  const handleTimelineSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * maxDuration;

    // Seek all waveforms
    waveformRefs.current.forEach((ref) => {
      ref.seekTo(newTime);
    });

    setCurrentTime(newTime);
  }, [maxDuration]);

  const handleTimelineMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingPlayhead(true);
    handleTimelineSeek(e);
  }, [handleTimelineSeek]);

  // Handle waveform click to add comment
  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>, trackId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const timestamp = percentage * maxDuration;

    setCommentModal({
      isOpen: true,
      trackId,
      timestamp,
      position: { x: e.clientX, y: e.clientY },
    });
  }, [maxDuration]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(async (text: string, timestamp: number) => {
    const result = await addTrackComment(commentModal.trackId, timestamp, text);
    if (result.success && result.comment) {
      toast.success('Comment added!');
      // Add comment to local state instead of reloading everything
      setTracks(prevTracks => prevTracks.map(track => {
        if (track.id === commentModal.trackId) {
          return {
            ...track,
            comments: [...(track.comments || []), result.comment],
          };
        }
        return track;
      }));
    } else {
      toast.error(result.error || 'Failed to add comment');
    }
  }, [commentModal.trackId]);

  // Handle dragging
  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * maxDuration;

      waveformRefs.current.forEach((ref) => {
        ref.seekTo(newTime);
      });

      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, maxDuration]);

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);
  const selectedTrackVolume = selectedTrackId ? (trackVolumes.get(selectedTrackId) || 80) : 80;
  const isSelectedTrackMuted = selectedTrackId ? trackMutes.has(selectedTrackId) : false;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate timeline markers and ticks based on max duration
  const getTimelineData = (duration: number) => {
    if (duration === 0) return { markers: [], ticks: [] };

    // Determine interval for major markers
    let majorInterval: number;
    if (duration <= 60) {
      majorInterval = 10; // Every 10 seconds
    } else if (duration <= 180) {
      majorInterval = 30; // Every 30 seconds
    } else if (duration <= 600) {
      majorInterval = 60; // Every minute
    } else {
      majorInterval = 120; // Every 2 minutes
    }

    const markers: Array<{ time: number; label: string; position: number }> = [];
    const ticks: Array<{ time: number; position: number; major: boolean }> = [];

    // Generate major markers
    for (let time = 0; time <= duration; time += majorInterval) {
      const position = (time / duration) * 100;
      markers.push({ time, label: formatTime(time), position });
    }

    // Generate tick marks every second
    for (let time = 0; time <= duration; time += 1) {
      const position = (time / duration) * 100;
      const major = time % 10 === 0;
      ticks.push({ time, position, major });
    }

    return { markers, ticks };
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
        {/* Left: Back button + Project info */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-zinc-700" />
          <h1 className="text-lg font-semibold text-white">Audio Track</h1>
          <span className="text-sm text-gray-400">Saved just now</span>
        </div>

        {/* Center: Transport Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={handleStop}
            disabled={tracks.length === 0}
          >
            <SkipBack className="w-4 h-4 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 bg-primary hover:bg-primary/90"
            onClick={handlePlayPause}
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
            disabled={tracks.length === 0}
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
                  <div
                    key={track.id}
                    className={`relative group rounded-lg transition-colors ${
                      selectedTrackId === track.id
                        ? 'bg-zinc-800'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedTrackId(track.id)}
                      className="w-full text-left px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: track.color }}
                          />
                          <span className={`text-sm font-medium truncate ${
                            selectedTrackId === track.id ? 'text-white' : 'text-gray-400'
                          }`}>{track.name}</span>
                        </div>
                        {(() => {
                          const activeTake = (track as any).takes?.find((t: any) => t.is_active) || (track as any).takes?.[0];
                          const uploader = activeTake?.uploader;
                          if (uploader) {
                            return (
                              <span className="text-[10px] text-gray-400 bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0 mr-6">
                                @{uploader.username || uploader.display_name || 'unknown'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${trackVolumes.get(track.id) || 80}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{trackVolumes.get(track.id) || 80}%</span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrack(track.id, track.name);
                      }}
                      className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      title="Delete track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
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
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Single unified playhead - spans entire height */}
              <div className="absolute inset-0 pointer-events-none z-40">
                {maxDuration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white"
                    style={{
                      left: `${(currentTime / maxDuration) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Timeline Ruler */}
              <div
                ref={timelineRef}
                className="h-12 border-b border-zinc-800 bg-zinc-900/30 flex-shrink-0 relative cursor-pointer select-none"
                onMouseDown={handleTimelineMouseDown}
                style={{ cursor: isDraggingPlayhead ? 'grabbing' : 'pointer' }}
              >
                <div className="h-full relative">
                  {(() => {
                    const { markers, ticks } = getTimelineData(maxDuration);
                    return (
                      <>
                        {/* Tick marks */}
                        {ticks.map((tick, i) => (
                          <div
                            key={i}
                            className="absolute top-0 w-px bg-zinc-700/50"
                            style={{
                              left: `${tick.position}%`,
                              height: tick.major ? '16px' : '8px',
                              backgroundColor: tick.major ? '#71717a' : '#52525b',
                            }}
                          />
                        ))}
                        {/* Time markers */}
                        {markers.map((marker, i) => (
                          <span
                            key={i}
                            className="absolute top-6 text-xs text-gray-500 -translate-x-1/2"
                            style={{ left: `${marker.position}%` }}
                          >
                            {marker.label}
                          </span>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Tracks & Waveforms */}
              <div className="flex-1 overflow-auto relative">
                <div className="py-4 space-y-3">
                  {tracks.map((track) => {
                    const activeTake = (track as any).takes?.find((t: any) => t.is_active) || (track as any).takes?.[0];

                    return (
                      <div
                        key={track.id}
                        className={`rounded-lg border overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors ${
                          selectedTrackId === track.id ? 'border-primary' : 'border-zinc-800'
                        }`}
                        onClick={() => setSelectedTrackId(track.id)}
                      >
                        <div className="h-20 bg-zinc-900/30 py-2 relative">
                          {activeTake ? (
                            <>
                              <WaveformDisplay
                                ref={(ref) => {
                                  if (ref) {
                                    waveformRefs.current.set(track.id, ref);
                                  } else {
                                    waveformRefs.current.delete(track.id);
                                  }
                                }}
                                audioUrl={activeTake.audio_url}
                                trackId={track.id}
                                trackColor={primaryColor}
                                height={64}
                                onReady={handleWaveformReady}
                                onTimeUpdate={handleTimeUpdate}
                              />
                              {/* Click overlay for adding comments */}
                              <div
                                className="absolute inset-0 cursor-text z-10"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent track selection
                                  handleWaveformClick(e, track.id);
                                }}
                                title="Click to add a comment"
                              />
                              {/* Comment bubbles */}
                              {maxDuration > 0 && (track as any).comments?.map((comment: any) => (
                                <div
                                  key={comment.id}
                                  className="absolute z-20 group"
                                  style={{
                                    left: `${(comment.timestamp / maxDuration) * 100}%`,
                                    bottom: '8px',
                                    transform: 'translateX(-50%)',
                                  }}
                                  onClick={(e) => e.stopPropagation()} // Prevent click from triggering add comment
                                >
                                  {/* Avatar bubble */}
                                  <div className="relative">
                                    {comment.profile?.avatar_url ? (
                                      <Image
                                        src={comment.profile.avatar_url}
                                        alt={comment.profile.username || 'User'}
                                        width={20}
                                        height={20}
                                        className="rounded-full border border-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border border-white shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-semibold hover:scale-110 transition-transform cursor-pointer">
                                        {comment.profile?.username?.[0]?.toUpperCase() || '?'}
                                      </div>
                                    )}

                                    {/* Tooltip */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-30">
                                      <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-zinc-700 whitespace-nowrap max-w-xs">
                                        <div className="font-semibold mb-1">
                                          @{comment.profile?.username || comment.profile?.display_name || 'Unknown'}
                                        </div>
                                        <div className="text-gray-300 max-w-[250px] break-words whitespace-normal">
                                          {comment.text}
                                        </div>
                                        <div className="text-gray-500 text-[10px] mt-1">
                                          {formatTime(comment.timestamp)}
                                        </div>
                                        {/* Arrow pointing down */}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-700" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm">No audio uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            </div>
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
                    value={selectedTrackVolume}
                    onChange={(e) => selectedTrackId && handleVolumeChange(selectedTrackId, Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-12 text-right">{selectedTrackVolume}%</span>
                </div>
                <Button
                  onClick={() => selectedTrackId && handleMuteToggle(selectedTrackId)}
                  variant={isSelectedTrackMuted ? 'default' : 'outline'}
                  size="sm"
                  className="mt-3 w-full"
                >
                  {isSelectedTrackMuted ? 'Unmute Track' : 'Mute Track'}
                </Button>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Track"
        message={`Are you sure you want to delete "${deleteConfirmation.trackName}"? This will permanently delete the track and all its audio files.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTrack}
        onCancel={cancelDeleteTrack}
      />

      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={commentModal.isOpen}
        position={commentModal.position}
        timestamp={commentModal.timestamp}
        userAvatar={currentUser?.avatar_url}
        onSubmit={handleCommentSubmit}
        onClose={() => setCommentModal({ ...commentModal, isOpen: false })}
      />
    </div>
  );
}
