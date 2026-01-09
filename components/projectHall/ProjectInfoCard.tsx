'use client'

import { Music, Activity, Lock, Globe, Radio } from 'lucide-react'

interface ProjectInfoCardProps {
  project: {
    bpm?: number | null
    key?: string | null
    mode?: string
    status?: string
    studio_visibility?: string
  }
}

export function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  const modeInfo = {
    private: { icon: Lock, label: 'Private', color: 'text-gray-400' },
    public: { icon: Globe, label: 'Public', color: 'text-green-400' },
    remixable: { icon: Radio, label: 'Remixable', color: 'text-blue-400' },
  }

  const statusInfo = {
    active: { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    completed: { label: 'Completed', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  }

  const studioVisibilityInfo = {
    members_only: { label: 'Members Only', color: 'text-gray-400' },
    public: { label: 'Public Studio', color: 'text-green-400' },
  }

  const currentMode = project.mode && modeInfo[project.mode as keyof typeof modeInfo]
    ? modeInfo[project.mode as keyof typeof modeInfo]
    : null

  const currentStatus = project.status && statusInfo[project.status as keyof typeof statusInfo]
    ? statusInfo[project.status as keyof typeof statusInfo]
    : statusInfo.active

  const currentStudioVisibility = project.studio_visibility && studioVisibilityInfo[project.studio_visibility as keyof typeof studioVisibilityInfo]
    ? studioVisibilityInfo[project.studio_visibility as keyof typeof studioVisibilityInfo]
    : studioVisibilityInfo.members_only

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>

      <div className="space-y-4">
        {/* BPM */}
        {project.bpm && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">BPM</span>
            </div>
            <span className="text-sm font-medium text-white">{project.bpm}</span>
          </div>
        )}

        {/* Key */}
        {project.key && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Music className="w-4 h-4" />
              <span className="text-sm">Key</span>
            </div>
            <span className="text-sm font-medium text-white">{project.key}</span>
          </div>
        )}

        {/* Mode */}
        {currentMode && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <currentMode.icon className="w-4 h-4" />
              <span className="text-sm">Visibility</span>
            </div>
            <span className={`text-sm font-medium ${currentMode.color}`}>
              {currentMode.label}
            </span>
          </div>
        )}

        {/* Studio Visibility */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Studio Access</span>
          <span className={`text-sm font-medium ${currentStudioVisibility.color}`}>
            {currentStudioVisibility.label}
          </span>
        </div>

        {/* Status Badge */}
        <div className="pt-4 border-t border-zinc-800">
          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-medium border ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>
    </div>
  )
}
