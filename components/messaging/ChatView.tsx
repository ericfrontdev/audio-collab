'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { sendMessage, markMessagesAsRead } from '@/app/actions/messaging'
import { useRouter } from '@/i18n/routing'
import { toast } from 'react-toastify'
import type { Message } from '@/lib/types/messaging'
import { MessageItem } from './MessageItem'

interface ChatViewProps {
  conversationId: string
  otherUser: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  initialMessages: Message[]
  currentUserId: string
}

export function ChatView({ conversationId, otherUser, initialMessages, currentUserId }: ChatViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when viewing conversation
  useEffect(() => {
    markMessagesAsRead(conversationId)
  }, [conversationId])

  const handleSendMessage = async () => {
    if (!content.trim() || isSending) return

    setIsSending(true)
    const result = await sendMessage(conversationId, content)

    if (result.success && result.message) {
      setContent('')
      setMessages((prev) => [...prev, result.message!])
      router.refresh()
      textareaRef.current?.focus()
    } else {
      toast.error(result.error || 'Failed to send message')
    }

    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="rounded-xl bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {otherUser?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}

          {/* User Info */}
          <div>
            <h2 className="font-semibold text-white">
              {otherUser?.display_name || otherUser?.username}
            </h2>
            <p className="text-sm text-gray-400">@{otherUser?.username}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.user_id === currentUserId}
              otherUser={otherUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Ctrl+Enter to send)"
            className="flex-1 bg-zinc-800 border-zinc-700 text-white resize-none focus:ring-primary/50"
            rows={2}
            maxLength={2000}
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!content.trim() || isSending}
            className="bg-primary hover:bg-primary/90 text-white px-6"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {content.length}/2000
          </span>
          <span className="text-xs text-gray-500">
            Ctrl+Enter to send
          </span>
        </div>
      </div>
    </Card>
  )
}
