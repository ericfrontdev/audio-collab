'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, User, Search } from 'lucide-react'
import type { Post } from '@/lib/types/feed'
import type { Conversation } from '@/lib/types/messaging'
import type { ShareDestination } from '@/lib/types/share'
import { getConversations, searchUsers } from '@/app/actions/messaging'
import { sharePostToMessage, sharePostToFeed } from '@/app/actions/feed'
import { useRouter } from '@/i18n/routing'
import { toast } from 'react-toastify'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
}

interface UserSearchResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'destination' | 'message' | 'feed'>('destination')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Load conversations when entering message step
  useEffect(() => {
    if (step === 'message' && conversations.length === 0) {
      loadConversations()
    }
  }, [step])

  // Search users when query changes
  useEffect(() => {
    if (step === 'feed' && searchQuery.trim()) {
      handleSearchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, step])

  const loadConversations = async () => {
    setIsLoading(true)
    const result = await getConversations()
    if (result.success && result.conversations) {
      setConversations(result.conversations)
    } else {
      toast.error('Failed to load conversations')
    }
    setIsLoading(false)
  }

  const handleSearchUsers = async () => {
    const result = await searchUsers(searchQuery)
    if (result.success) {
      setSearchResults(result.users || [])
    }
  }

  const handleSelectDestination = (destination: ShareDestination) => {
    setStep(destination === 'message' ? 'message' : 'feed')
  }

  const handleShare = async () => {
    if (step === 'message' && selectedConversation) {
      setIsSharing(true)
      const result = await sharePostToMessage(
        post.id,
        selectedConversation,
        comment || undefined
      )
      setIsSharing(false)

      if (result.success) {
        toast.success('Post partagé dans la conversation')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'Échec du partage')
      }
    } else if (step === 'feed' && selectedUser) {
      setIsSharing(true)
      const result = await sharePostToFeed(
        post.id,
        selectedUser.id,
        comment || undefined
      )
      setIsSharing(false)

      if (result.success) {
        toast.success('Post partagé sur le feed')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'Échec du partage')
      }
    }
  }

  const handleClose = () => {
    setStep('destination')
    setSelectedConversation(null)
    setSelectedUser(null)
    setComment('')
    setSearchQuery('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {step === 'destination' && 'Partager le post'}
            {step === 'message' && 'Partager dans un message'}
            {step === 'feed' && 'Partager sur un feed'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Choose destination */}
          {step === 'destination' && (
            <div className="space-y-3">
              <button
                onClick={() => handleSelectDestination('message')}
                className="w-full p-4 rounded-lg border border-zinc-700 hover:border-primary hover:bg-zinc-800/50 transition-colors flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">Message privé</p>
                  <p className="text-sm text-gray-400">Envoyer dans une conversation</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectDestination('feed')}
                className="w-full p-4 rounded-lg border border-zinc-700 hover:border-primary hover:bg-zinc-800/50 transition-colors flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">Feed personnel</p>
                  <p className="text-sm text-gray-400">Publier sur le profil d&apos;un utilisateur</p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2a: Select conversation */}
          {step === 'message' && (
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-gray-400 text-center py-8">Chargement...</p>
              ) : conversations.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Aucune conversation</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-3 rounded-lg border transition-colors flex items-center gap-3 text-left ${
                        selectedConversation === conv.id
                          ? 'border-primary bg-primary/10'
                          : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      {conv.other_user?.avatar_url ? (
                        <img
                          src={conv.other_user.avatar_url}
                          alt={conv.other_user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {conv.other_user?.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {conv.other_user?.display_name || conv.other_user?.username}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          @{conv.other_user?.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Comment textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ajouter un commentaire (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrivez votre commentaire..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{comment.length}/500</p>
              </div>
            </div>
          )}

          {/* Step 2b: Search user */}
          {step === 'feed' && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 rounded-lg border transition-colors flex items-center gap-3 text-left ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-primary/10'
                          : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <p className="text-gray-400 text-center py-8">Aucun utilisateur trouvé</p>
              )}

              {/* Comment textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ajouter un commentaire (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrivez votre commentaire..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{comment.length}/500</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'destination' && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800">
            <button
              onClick={() => setStep('destination')}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Retour
            </button>
            <button
              onClick={handleShare}
              disabled={
                isSharing ||
                (step === 'message' && !selectedConversation) ||
                (step === 'feed' && !selectedUser)
              }
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? 'Partage...' : 'Partager'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
