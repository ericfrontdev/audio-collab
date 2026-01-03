'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Calendar, Folder, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteProject } from '@/app/actions/projects'
import { toast } from 'react-toastify'
import { useRouter } from '@/i18n/routing'

interface ProjectCardProps {
  project: {
    id: string
    title?: string
    name?: string
    description?: string | null
    status?: string
    kind?: string
    cover_url?: string | null
    cover_image_url?: string | null
    created_at: string
    owner_id: string
    owner?: {
      username?: string
      display_name?: string | null
    } | null
  }
  currentUserId?: string
  locale: string
  onDelete?: () => void
}

export function ProjectCard({ project, currentUserId, locale, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    projectId: string
    projectName: string
  }>({ isOpen: false, projectId: '', projectName: '' })

  const projectTitle = project.title || project.name || 'Untitled Project'
  const coverUrl = project.cover_url || project.cover_image_url
  const isOwner = currentUserId === project.owner_id

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteConfirmation({ isOpen: true, projectId: project.id, projectName: projectTitle })
  }

  const confirmDelete = async () => {
    const { projectId, projectName } = deleteConfirmation
    setDeleteConfirmation({ isOpen: false, projectId: '', projectName: '' })

    const result = await deleteProject(projectId)
    if (result.success) {
      toast.success(`Projet "${projectName}" supprimé`)
      onDelete?.()
      router.refresh()
    } else {
      toast.error(result.error || 'Échec de la suppression')
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, projectId: '', projectName: '' })
  }

  return (
    <>
      <div className="group rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden hover:border-primary/50 transition-all duration-300 relative">
        {/* Three-dot menu (only for owner) */}
        {isOwner && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-zinc-900/80 hover:bg-zinc-800"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le projet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Project Cover Image */}
        <Link href={`/projects/${project.id}`}>
          <div className="relative h-40 bg-gradient-to-br from-primary/20 to-purple-600/20">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={projectTitle}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Folder className="w-16 h-16 text-zinc-700" />
              </div>
            )}

            {/* Status Badge */}
            {project.status && (
              <div className="absolute top-3 left-3">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    project.status === 'active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : project.status === 'in_progress'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : project.status === 'completed'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {project.status?.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Kind Badge */}
            {project.kind && (
              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-zinc-900/80 text-white border border-zinc-700">
                  {project.kind === 'club' ? 'Club Project' : 'Personal'}
                </span>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-white hover:text-primary transition-colors line-clamp-1 cursor-pointer flex-1">
                {projectTitle}
              </h3>
              <span className="text-xs text-primary whitespace-nowrap flex-shrink-0">
                Created by {isOwner ? 'me' : (project.owner?.display_name || project.owner?.username || 'Unknown')}
              </span>
            </div>

            {project.description && (
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="⚠️ Supprimer définitivement le projet"
        message={`Êtes-vous absolument certain de vouloir supprimer "${deleteConfirmation.projectName}" ?\n\n⛔ Cette action est IRRÉVERSIBLE et supprimera définitivement :\n• Le projet et toutes ses configurations\n• Tous les fichiers audio et pistes\n• Tous les commentaires et collaborations\n• Tout l'historique du projet\n\n💀 Il n'y a AUCUN moyen de récupérer ces données une fois supprimées.`}
        confirmText="Oui, supprimer définitivement"
        cancelText="Non, annuler"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  )
}
