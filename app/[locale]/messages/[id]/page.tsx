import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMessages, getConversations } from '@/app/actions/messaging'
import { AppLayout } from '@/components/layouts/AppLayout'
import { ChatView } from '@/components/messaging/ChatView'
import { ConversationsList } from '@/components/messaging/ConversationsList'
import { UserProfileCard } from '@/components/cards/UserProfileCard'
import { QuickActions } from '@/components/cards/QuickActions'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/routing'

interface ConversationPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id: conversationId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch conversation to verify access and get other user info
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    redirect('/messages')
  }

  // Verify user is part of this conversation
  if (conversation.user_1_id !== user.id && conversation.user_2_id !== user.id) {
    redirect('/messages')
  }

  // Get other user info
  const otherUserId = conversation.user_1_id === user.id ? conversation.user_2_id : conversation.user_1_id

  const { data: otherUser } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', otherUserId)
    .single()

  // Fetch messages
  const messagesResult = await getMessages(conversationId)
  const messages = messagesResult.success ? messagesResult.messages || [] : []

  // Fetch conversations for sidebar (mobile)
  const conversationsResult = await getConversations()
  const conversations = conversationsResult.success ? conversationsResult.conversations || [] : []

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="flex">
          {/* Main Content - Center */}
          <div className="flex-1 min-w-0">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
              {/* Mobile Header */}
              <div className="lg:hidden mb-4">
                <Link href="/messages" className="inline-flex items-center text-gray-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Messages
                </Link>
              </div>

              {/* Messages Container */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* Conversations List - Hidden on mobile when viewing conversation */}
                <div className="hidden lg:block lg:col-span-1">
                  <ConversationsList
                    conversations={conversations}
                    currentUserId={user.id}
                  />
                </div>

                {/* Chat View */}
                <div className="lg:col-span-2">
                  <ChatView
                    conversationId={conversationId}
                    otherUser={otherUser}
                    initialMessages={messages}
                    currentUserId={user.id}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-96 border-l border-zinc-800 p-6 space-y-6">
            {/* User Profile Card */}
            {profile && <UserProfileCard profile={profile} />}

            {/* Quick Actions */}
            <QuickActions />

            {/* Quick Info */}
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Private Messaging
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Send private messages to other musicians. Start conversations,
                collaborate on projects, and build your network.
              </p>
            </div>

            {/* Footer */}
            <footer className="flex flex-rows">
              <p className="text-xs text-gray-500 leading-relaxed">
                Made by indie musicians for indie musicians <br />
                &copy; 2026 AudioCollab
              </p>
            </footer>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
