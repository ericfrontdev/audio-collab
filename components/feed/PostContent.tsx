'use client'

import { Link } from '@/i18n/routing'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { LinkPreview } from './LinkPreview'

interface PostContentProps {
  content: string
  mediaUrl?: string | null
  mediaType?: 'image' | 'audio' | 'video' | null
  project?: {
    id: string
    title: string
  } | null
  linkUrl?: string | null
  linkTitle?: string | null
  linkDescription?: string | null
  linkImage?: string | null
}

export function PostContent({
  content,
  mediaUrl,
  mediaType,
  project,
  linkUrl,
  linkTitle,
  linkDescription,
  linkImage,
}: PostContentProps) {
  return (
    <>
      {/* Post text content */}
      <p className="text-white whitespace-pre-wrap mb-3">{content}</p>

      {/* Post image */}
      {mediaUrl && mediaType === 'image' && (
        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800">
          <img
            src={mediaUrl}
            alt="Post image"
            className="w-full max-h-[500px] object-contain bg-zinc-950"
          />
        </div>
      )}

      {/* Post audio */}
      {mediaUrl && mediaType === 'audio' && (
        <div className="mb-3">
          <AudioPlayer src={mediaUrl} />
        </div>
      )}

      {/* Post video */}
      {mediaUrl && mediaType === 'video' && (
        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800">
          <video
            src={mediaUrl}
            controls
            className="w-full max-h-[500px] bg-zinc-950"
          />
        </div>
      )}

      {/* Link preview */}
      {linkUrl && (
        <LinkPreview
          url={linkUrl}
          title={linkTitle}
          description={linkDescription}
          image={linkImage}
        />
      )}

      {/* Project link if attached */}
      {project && (
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-white mb-3 transition-colors"
        >
          <span>🎵</span>
          <span>{project.title}</span>
        </Link>
      )}
    </>
  )
}
