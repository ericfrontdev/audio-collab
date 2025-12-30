'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search, Loader2 } from 'lucide-react'
import { searchUsers, getOrCreateConversation } from '@/app/actions/messaging'
import { useRouter } from '@/i18n/routing'
import { toast } from 'react-toastify'

interface NewMessageButtonProps {
  currentUserId: string
  onClose: () => void
}

export function NewMessageButton({ currentUserId, onClose }: NewMessageButtonProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const result = await searchUsers(query)

    if (result.success) {
      setSearchResults(result.users || [])
    } else {
      toast.error(result.error || 'Failed to search users')
    }

    setIsSearching(false)
  }

  const handleSelectUser = async (userId: string) => {
    setIsCreating(true)

    const result = await getOrCreateConversation(userId)

    if (result.success && result.conversation) {
      router.push(`/messages/${result.conversation.id}`)
      router.refresh()
      onClose()
    } else {
      toast.error(result.error || 'Failed to create conversation')
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
            <div className="text-center text-gray-500 py-8">
              <p>No users found</p>
            </div>
          )}

          {searchResults.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              disabled={isCreating}
              className="w-full p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-primary/50 transition-colors flex items-center gap-3 text-left disabled:opacity-50"
            >
              {/* Avatar */}
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-sm text-gray-400 truncate">@{user.username}</p>
              </div>

              {isCreating && (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
