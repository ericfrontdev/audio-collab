import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ReplyForm from '@/components/clubs/ReplyForm'

export default async function DiscussionThreadPage({
  params
}: {
  params: Promise<{ locale: string; slug: string; threadId: string }>
}) {
  const { locale, slug, threadId } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Fetch club
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!club) {
    notFound()
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .single()

  const isMember = !!membership

  // Fetch thread with author
  const { data: thread } = await supabase
    .from('club_threads')
    .select(`
      *,
      profiles:created_by (
        display_name,
        avatar_url
      )
    `)
    .eq('id', threadId)
    .single()

  if (!thread) {
    notFound()
  }

  // Fetch replies with authors
  const { data: replies } = await supabase
    .from('club_thread_replies')
    .select(`
      *,
      profiles:created_by (
        display_name,
        avatar_url
      )
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/${locale}/clubs/${slug}?tab=discussions`}
            className="text-sm text-primary hover:text-primary/90 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {club.name} discussions
          </Link>
        </div>

        {/* Original Thread Post */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {thread.profiles?.avatar_url ? (
                  <img
                    src={thread.profiles.avatar_url}
                    alt={thread.profiles.display_name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">
                      {thread.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {thread.profiles?.display_name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(thread.created_at).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {thread.title && (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {thread.title}
                  </h1>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {thread.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies && replies.length > 0 && (
          <div className="mb-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
            {replies.map((reply: any) => (
              <div key={reply.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-5">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {reply.profiles?.avatar_url ? (
                        <img
                          src={reply.profiles.avatar_url}
                          alt={reply.profiles.display_name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {reply.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reply.profiles?.display_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.created_at).toLocaleDateString(locale, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {isMember ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reply to this discussion
            </h3>
            <ReplyForm threadId={threadId} clubSlug={slug} locale={locale} />
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
            <p className="text-yellow-800 dark:text-yellow-200">
              You must be a member of {club.name} to reply to discussions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
