import { ProjectCollaborator } from '@/lib/types/multitrack'

interface ProjectCollaboratorsProps {
  projectId: string
  collaborators: ProjectCollaborator[]
  isOwner: boolean
  locale: string
}

export default function ProjectCollaborators({
  projectId,
  collaborators,
  isOwner,
  locale
}: ProjectCollaboratorsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Collaborators ({collaborators.length})
        </h3>
        {isOwner && (
          <button className="text-xs text-primary hover:text-primary/90">
            + Add
          </button>
        )}
      </div>

      <div className="space-y-2">
        {collaborators.map((collab) => (
          <div key={collab.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {collab.profiles?.avatar_url ? (
                <img
                  src={collab.profiles.avatar_url}
                  alt={collab.profiles.display_name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {collab.profiles?.display_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {collab.profiles?.display_name}
                </p>
                {collab.instrument && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {collab.instrument}
                  </p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              collab.role === 'owner'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {collab.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
