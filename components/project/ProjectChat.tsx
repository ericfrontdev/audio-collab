'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MoreHorizontal, Edit, Trash2, Reply, X } from 'lucide-react'
import { toast } from 'react-toastify'
import type { ProjectMessage } from '@/lib/types/projectChat'
import { sendMessage, getMessages, updateMessage, deleteMessage } from '@/app/actions/projectChat'
import { createClient } from '@/lib/supabase/client'

interface ProjectChatProps {
  projectId: string
  currentUserId?: string
}

export function ProjectChat({ projectId, currentUserId }: ProjectChatProps) {
  const [messages, setMessages] = useState<ProjectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<ProjectMessage | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [projectId])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`project_messages:${projectId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessage = payload.payload as ProjectMessage
        if (newMessage && newMessage.user_id !== currentUserId) {
          setMessages((prev) => [...prev, newMessage])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, currentUserId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    setIsLoading(true)
    const result = await getMessages(projectId)
    if (result.success) {
      setMessages(result.messages)
    } else {
      toast.error(result.error || 'Erreur lors du chargement des messages')
    }
    setIsLoading(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsSending(true)

    const result = await sendMessage(
      projectId,
      newMessage.trim(),
      replyingTo?.id
    )

    if (result.success && result.message) {
      setMessages((prev) => [...prev, result.message])
      setNewMessage('')
      setReplyingTo(null)
      inputRef.current?.focus()

      // Broadcast the new message to other users
      const supabase = createClient()
      const channel = supabase.channel(`project_messages:${projectId}`)
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: result.message,
      })
    } else {
      toast.error(result.error || 'Erreur lors de l\'envoi du message')
    }

    setIsSending(false)
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    const result = await updateMessage(messageId, editContent.trim())

    if (result.success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: editContent.trim(), is_edited: true }
            : msg
        )
      )
      setEditingMessageId(null)
      setEditContent('')
      toast.success('Message modifié')
    } else {
      toast.error(result.error || 'Erreur lors de la modification')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteMessage(messageId)

    if (result.success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      toast.success('Message supprimé')
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Chargement des messages...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucun message. Soyez le premier à écrire !
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="flex gap-3 group hover:bg-zinc-900/50 -mx-2 px-2 py-1 rounded"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.user?.avatar_url ? (
                  <img
                    src={message.user.avatar_url}
                    alt={message.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {message.user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white text-sm">
                    {message.user?.display_name || message.user?.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.created_at)}
                    {message.is_edited && <span className="ml-1">(modifié)</span>}
                  </span>
                </div>

                {/* Reply preview */}
                {message.reply_to_message?.content && (
                  <div className="mt-1 pl-2 border-l-2 border-zinc-700 text-xs text-gray-400">
                    <span className="font-semibold">
                      @{message.reply_to_message.user?.display_name || message.reply_to_message.user?.username}
                    </span>
                    : {message.reply_to_message.content}
                  </div>
                )}

                {/* Message text or edit mode */}
                {editingMessageId === message.id ? (
                  <div className="mt-1">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditMessage(message.id)
                        } else if (e.key === 'Escape') {
                          setEditingMessageId(null)
                          setEditContent('')
                        }
                      }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId(null)
                          setEditContent('')
                        }}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-200 mt-1 break-words">
                    {message.content}
                  </p>
                )}
              </div>

              {/* Actions menu (only for own messages) */}
              {currentUserId === message.user_id && !editingMessageId && (
                <div className="flex-shrink-0 relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === message.id ? null : message.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-gray-400 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenuId === message.id && (
                    <div className="absolute right-0 top-6 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10">
                      <button
                        onClick={() => {
                          setReplyingTo(message)
                          setOpenMenuId(null)
                          inputRef.current?.focus()
                        }}
                        className="w-full px-3 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        Répondre
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId(message.id)
                          setEditContent(message.content)
                          setOpenMenuId(null)
                        }}
                        className="w-full px-3 py-2 text-left text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteMessage(message.id)
                          setOpenMenuId(null)
                        }}
                        className="w-full px-3 py-2 text-left text-red-500 hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-white">
              Répondre à @{replyingTo.user?.display_name || replyingTo.user?.username}
            </span>
            : {replyingTo.content.substring(0, 50)}
            {replyingTo.content.length > 50 && '...'}
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              } else if (e.key === 'Escape') {
                setReplyingTo(null)
              }
            }}
            placeholder={`Message #général`}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
