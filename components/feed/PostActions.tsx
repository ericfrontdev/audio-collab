'use client'

import { Heart, MessageCircle } from 'lucide-react'

interface PostActionsProps {
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isLiking: boolean
  onLike: () => void
  onToggleComments: () => void
}

export function PostActions({
  likesCount,
  commentsCount,
  isLiked,
  isLiking,
  onLike,
  onToggleComments,
}: PostActionsProps) {
  return (
    <div className="mt-3">
      {/* Counters Section - Like Facebook */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="flex items-center justify-between px-2 py-2 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            {likesCount > 0 && (
              <button className="hover:underline">
                {likesCount} {likesCount === 1 ? 'J\'aime' : 'J\'aime'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {commentsCount > 0 && (
              <button onClick={onToggleComments} className="hover:underline">
                {commentsCount} {commentsCount === 1 ? 'commentaire' : 'commentaires'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons - Full Width Like Facebook */}
      <div className="py-1">
        <div className="flex items-center justify-around">
          <button
            onClick={onLike}
            disabled={isLiking}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-medium ${
              isLiked
                ? 'text-red-500 hover:bg-zinc-800/50'
                : 'text-gray-400 hover:bg-zinc-800/50'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{isLiked ? 'J\'aime' : 'Aimer'}</span>
          </button>

          <button
            onClick={onToggleComments}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:bg-zinc-800/50 transition-colors font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">Commenter</span>
          </button>

          {/* TODO: Activer quand on aura les feeds personnels et/ou messages privés */}
          {/* <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:bg-zinc-800/50 transition-colors font-medium">
            <Share2 className="w-5 h-5" />
            <span className="text-sm">Partager</span>
          </button> */}
        </div>
      </div>
    </div>
  )
}
