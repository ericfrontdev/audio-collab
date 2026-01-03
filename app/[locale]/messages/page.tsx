import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/app/actions/messaging'
import { AppLayout } from '@/components/layouts/AppLayout'
import { ConversationsList } from '@/components/messaging/ConversationsList'
import { RightSidebar } from '@/components/navigation/RightSidebar'
import { MessageCircle } from 'lucide-react'

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch conversations
  const result = await getConversations()
  const conversations = result.success ? result.conversations || [] : []

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="flex">
          {/* Main Content - Center */}
          <div className="flex-1 min-w-0 xl:mr-96">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-gray-400 mt-1">Send private messages to other users</p>
              </div>

              {/* Messages Container */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* Conversations List */}
                <div className="lg:col-span-1">
                  <ConversationsList
                    conversations={conversations}
                    currentUserId={user.id}
                  />
                </div>

                {/* Chat View - Empty State */}
                <div className="hidden lg:block lg:col-span-2">
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Select a conversation to start messaging</p>
                      <p className="text-sm mt-2">or start a new conversation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <RightSidebar profile={profile} showFooter={true}>
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
          </RightSidebar>
        </div>
      </div>
    </AppLayout>
  )
}
