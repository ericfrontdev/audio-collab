'use client'

import { ExternalLink } from 'lucide-react'

interface LinkPreviewProps {
  url: string
  title?: string | null
  description?: string | null
  image?: string | null
}

export function LinkPreview({ url, title, description, image }: LinkPreviewProps) {
  const hostname = new URL(url).hostname

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors"
    >
      {image && (
        <div className="w-full h-48 bg-zinc-950">
          <img
            src={image}
            alt={title || 'Link preview'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 bg-zinc-900/50">
        {title && (
          <h4 className="font-semibold text-white text-sm line-clamp-2 mb-1">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-gray-400 text-xs line-clamp-2 mb-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">{hostname}</span>
        </div>
      </div>
    </a>
  )
}
