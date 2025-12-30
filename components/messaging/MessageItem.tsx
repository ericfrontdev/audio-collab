'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import type { Message } from '@/lib/types/messaging'
import { editMessage, deleteMessage } from '@/app/actions/messaging'
import { useRouter } from '@/i18n/routing'
import { toast } from 'react-toastify'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface MessageItemProps {
  message: Message
  isOwnMessage: boolean
  otherUser: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export function MessageItem({ message, isOwnMessage, otherUser }: MessageItemProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Message cannot be empty')
      return
    }

    setIsUpdating(true)
    const result = await editMessage(message.id, editContent)

    if (result.success) {
      setIsEditing(false)
      router.refresh()
      toast.success('Message updated')
    } else {
      toast.error(result.error || 'Failed to edit message')
    }

    setIsUpdating(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteMessage(message.id)

    if (result.success) {
      router.refresh()
      toast.success('Message deleted')
    } else {
      toast.error(result.error || 'Failed to delete message')
    }

    setIsDeleting(false)
  }

  const displayUser = isOwnMessage ? null : otherUser

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (only for other user's messages) */}
      {!isOwnMessage && displayUser && (
        <div className="flex-shrink-0">
          {displayUser.avatar_url ? (
            <img
              src={displayUser.avatar_url}
              alt={displayUser.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold text-xs">
                {displayUser.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {isEditing ? (
          <div className="w-full">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-zinc-800 border-zinc-700 text-white resize-none"
              rows={3}
              maxLength={2000}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(message.content)
                }}
                variant="ghost"
                className="text-gray-400"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isUpdating || !editContent.trim()}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div
              className={`rounded-2xl px-4 py-2 ${
                isOwnMessage
                  ? 'bg-primary text-white'
                  : 'bg-zinc-800 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.is_edited && (
                <span className="text-xs opacity-70 italic mt-1 block">
                  (edited)
                </span>
              )}
            </div>

            {/* Menu for own messages */}
            {isOwnMessage && (
              <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-zinc-800 text-gray-500 hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDelete()
                        setShowMenu(false)
                      }}
                      disabled={isDeleting}
                      className="w-full px-3 py-2 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-1 px-1">
          {formatTimeAgo(message.created_at)}
        </span>
      </div>
    </div>
  )
}
