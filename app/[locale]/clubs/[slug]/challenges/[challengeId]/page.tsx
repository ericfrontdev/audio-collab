import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Link, redirect } from '@/i18n/routing'
import ParticipateButton from '@/components/clubs/ParticipateButton'

export default async function ChallengePage({
  params
}: {
  params: Promise<{ locale: string; slug: string; challengeId: string }>
}) {
  const { locale, slug, challengeId } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login`)
  }

  // Fetch club
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) {
    notFound()
  }

  // Fetch challenge
  const { data: challenge } = await supabase
    .from('club_challenges')
    .select(`
      *,
      profiles:created_by (
        display_name
      )
    `)
    .eq('id', challengeId)
    .eq('club_id', club.id)
    .maybeSingle()

  if (!challenge) {
    notFound()
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isMember = !!membership

  // Fetch challenge entries (projects with kind = 'challenge')
  const { data: entries } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id (
        display_name,
        avatar_url
      )
    `)
    .eq('kind', 'challenge')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true })

  // Check if current user has already participated
  const userEntry = entries?.find(e => e.owner_id === user.id)
  const hasParticipated = !!userEntry

  // Status badge color
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    finished: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/clubs/${slug}?tab=challenges`}
            className="text-sm text-primary hover:text-primary/90 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {club.name} challenges
          </Link>
        </div>

        {/* Challenge Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {challenge.title}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[challenge.status as keyof typeof statusColors]}`}>
                    {challenge.status}
                  </span>
                </div>
                {challenge.description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {challenge.description}
                  </p>
                )}
              </div>

              {/* Participate Button */}
              {isMember && challenge.status === 'active' && (
                <div className="ml-6">
                  <ParticipateButton
                    challengeId={challengeId}
                    clubId={club.id}
                    clubSlug={slug}
                    hasParticipated={hasParticipated}
                    userEntryId={userEntry?.id}
                    locale={locale}
                  />
                </div>
              )}
            </div>

            {/* Challenge Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {challenge.starts_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Starts</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {new Date(challenge.starts_at).toLocaleDateString(locale, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {challenge.ends_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ends</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-white">
                    {new Date(challenge.ends_at).toLocaleDateString(locale, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Participants</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">
                  {entries?.length || 0}
                </p>
              </div>
            </div>

            {/* Rules */}
            {challenge.rules && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Rules</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {challenge.rules}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Entries Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Entries {entries && entries.length > 0 ? `(${entries.length})` : ''}
            </h2>
          </div>

          {entries && entries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map((entry: any, index: number) => (
                <Link
                  key={entry.id}
                  href={`/projects/${entry.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Entry #{index + 1}
                      </span>
                      {entry.owner_id === user.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Your entry
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {entry.title}
                    </h3>

                    {entry.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {entry.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-2">
                      {entry.profiles?.avatar_url ? (
                        <img
                          src={entry.profiles.avatar_url}
                          alt={entry.profiles.display_name}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            {entry.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {entry.profiles?.display_name}
                      </span>
                    </div>

                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Submitted {new Date(entry.created_at).toLocaleDateString(locale)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow py-16 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">No entries yet</p>
              {isMember && challenge.status === 'active' && (
                <p className="mt-2 text-sm text-gray-400">Be the first to participate!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
