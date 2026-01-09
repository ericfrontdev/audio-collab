'use client'

import { Calendar, Clock, CheckCircle2 } from 'lucide-react'

interface ProjectTimelineCardProps {
  project: {
    created_at: string
    updated_at: string
    status?: string
  }
  versionCount?: number
}

export function ProjectTimelineCard({ project, versionCount = 0 }: ProjectTimelineCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  const milestones = [
    {
      icon: Calendar,
      label: 'Project Created',
      date: project.created_at,
      relative: formatRelativeTime(project.created_at),
      color: 'text-blue-400',
    },
    {
      icon: Clock,
      label: 'Last Updated',
      date: project.updated_at,
      relative: formatRelativeTime(project.updated_at),
      color: 'text-primary',
    },
  ]

  if (project.status === 'completed') {
    milestones.push({
      icon: CheckCircle2,
      label: 'Completed',
      date: project.updated_at,
      relative: formatRelativeTime(project.updated_at),
      color: 'text-green-400',
    })
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const Icon = milestone.icon
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ${milestone.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {milestone.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {milestone.relative}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(milestone.date)}
                </p>
              </div>
            </div>
          )
        })}

        {/* Version count */}
        {versionCount > 0 && (
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-sm text-gray-400">
              <span className="font-medium text-white">{versionCount}</span> version{versionCount !== 1 ? 's' : ''} saved
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
