'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Conversation } from '@/lib/types/messaging'
import { NewMessageButton } from './NewMessageButton'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

interface ConversationsListProps {
  conversations: Conversation[]
  currentUserId: string
}

export function ConversationsList({ conversations, currentUserId }: ConversationsListProps) {
  const t = useTranslations('messaging')
  const tTime = useTranslations('feed.timeAgo')
  const [showNewMessage, setShowNewMessage] = useState(false)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return tTime('justNow')
    if (diffInSeconds < 3600) return tTime('minutesAgo', { minutes: Math.floor(diffInSeconds / 60) })
    if (diffInSeconds < 86400) return tTime('hoursAgo', { hours: Math.floor(diffInSeconds / 3600) })
    if (diffInSeconds < 604800) return tTime('daysAgo', { days: Math.floor(diffInSeconds / 86400) })
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col h-full">
      {/* New Message Button */}
      <div className="mb-4">
        <Button
          onClick={() => setShowNewMessage(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('newMessage')}
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>{t('noConversationsYet')}</p>
            <p className="text-sm mt-2">{t('noConversations')}</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="block"
            >
              <Card className="p-4 rounded-xl bg-zinc-900/50 border-zinc-800 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {conversation.other_user?.avatar_url ? (
                    <img
                      src={conversation.other_user.avatar_url}
                      alt={conversation.other_user.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-lg">
                        {conversation.other_user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {conversation.other_user?.display_name || conversation.other_user?.username}
                        </span>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <Badge variant="default" className="bg-primary text-white px-2 py-0.5 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.last_message_at && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTimeAgo(conversation.last_message_at)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 truncate">
                      @{conversation.other_user?.username}
                    </p>

                    {conversation.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.last_message.user_id === currentUserId && `${t('you')}: `}
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageButton
          currentUserId={currentUserId}
          onClose={() => setShowNewMessage(false)}
        />
      )}
    </div>
  )
}
