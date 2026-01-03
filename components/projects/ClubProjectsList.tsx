'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { JoinProjectButton } from '@/components/projects/JoinProjectButton'
import { Filter, FilterX } from 'lucide-react'

interface ClubProjectsListProps {
  projects: any[]
  memberProjectIds: string[]
  locale: string
}

export function ClubProjectsList({ projects, memberProjectIds, locale }: ClubProjectsListProps) {
  const [hideNotJoined, setHideNotJoined] = useState(false)

  const memberProjectIdsSet = new Set(memberProjectIds)

  const filteredProjects = hideNotJoined
    ? projects.filter((project) => memberProjectIdsSet.has(project.id))
    : projects

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header with title and filter button */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-bold mb-3 text-white">Club Projects</h1>
          <p className="text-gray-400 text-lg">
            Browse and join projects from your clubs
          </p>
        </div>

        <Button
          variant={hideNotJoined ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHideNotJoined(!hideNotJoined)}
          className="flex items-center gap-2"
        >
          {hideNotJoined ? (
            <>
              <FilterX className="w-4 h-4" />
              Show All
            </>
          ) : (
            <>
              <Filter className="w-4 h-4" />
              Hide Not Joined
            </>
          )}
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No projects available. Join a club to see club projects!</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No joined projects. Join a project to see it here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: any) => {
            const isMember = memberProjectIdsSet.has(project.id)

            return (
              <div
                key={project.id}
                className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>

                {project.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  {project.clubs && (
                    <span className="text-primary">
                      {project.clubs.name}
                    </span>
                  )}
                </div>

                {isMember ? (
                  <Link
                    href={`/${locale}/projects/${project.id}/studio`}
                    className="block w-full px-4 py-2 bg-primary text-white rounded-md text-center font-medium hover:bg-primary/90 transition-colors"
                  >
                    Open Studio
                  </Link>
                ) : (
                  <JoinProjectButton projectId={project.id} locale={locale} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
