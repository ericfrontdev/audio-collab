import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ClubTabs({
  tab,
  club,
  tabData,
  isMember,
  locale
}: {
  tab: string
  club: any
  tabData: any
  isMember: boolean
  locale: string
}) {
  const t = useTranslations('clubs')

  // Overview Tab
  if (!tab || tab === 'overview') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('overview.discussionsCount')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tabData.threadCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('overview.projectsCount')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tabData.projectCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('overview.challengesCount')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tabData.challengeCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('overview.membersCount')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tabData.memberCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Discussions Tab - Discord-like simple forum
  if (tab === 'discussions') {
    return (
      <div className="space-y-3">
        {isMember && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('discussions.emptyMessage')}
            </p>
            <Link
              href={`/${locale}/clubs/${club.slug}/discussions/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('discussions.newDiscussion')}
            </Link>
          </div>
        )}

        {tabData && tabData.length > 0 ? (
          <div className="space-y-2">
            {tabData.map((thread: any) => (
              <Link
                key={thread.id}
                href={`/${locale}/clubs/${club.slug}/discussions/${thread.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-transparent hover:border-primary"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {thread.profiles?.avatar_url ? (
                      <img
                        src={thread.profiles.avatar_url}
                        alt={thread.profiles.display_name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {thread.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {thread.title && (
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {thread.title}
                      </h3>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {thread.content}
                    </p>
                    <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{thread.profiles?.display_name}</span>
                      <span>•</span>
                      <span>{new Date(thread.created_at).toLocaleDateString(locale)}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {thread.club_thread_replies?.[0]?.count || 0} {t('discussions.replies')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('discussions.noDiscussions')}</p>
            {isMember && (
              <p className="mt-2 text-sm text-gray-400">{t('discussions.beFirst')}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Projects Tab
  if (tab === 'projects') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabData && tabData.length > 0 ? (
          tabData.map((project: any) => (
            <Link
              key={project.id}
              href={`/${locale}/projects/${project.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {project.title}
              </h3>
              {project.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span>{project.profiles?.display_name}</span>
                {project.bpm && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{project.bpm} BPM</span>
                  </>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">{t('projects.noProjects')}</p>
          </div>
        )}
      </div>
    )
  }

  // Challenges Tab
  if (tab === 'challenges') {
    return (
      <div className="space-y-4">
        {tabData && tabData.length > 0 ? (
          tabData.map((challenge: any) => (
            <Link
              key={challenge.id}
              href={`/${locale}/clubs/${club.slug}/challenges/${challenge.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {challenge.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      challenge.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : challenge.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {t(`challenges.status.${challenge.status}`)}
                    </span>
                  </div>
                  {challenge.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
                      {challenge.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    {challenge.starts_at && (
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {t('challenges.starts')}: {new Date(challenge.starts_at).toLocaleDateString(locale)}
                      </span>
                    )}
                    {challenge.ends_at && (
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('challenges.ends')}: {new Date(challenge.ends_at).toLocaleDateString(locale)}
                      </span>
                    )}
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('challenges.noChallenges')}</p>
          </div>
        )}
      </div>
    )
  }

  // Remixes Tab
  if (tab === 'remixes') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabData && tabData.length > 0 ? (
          tabData.map((remix: any) => (
            <Link
              key={remix.id}
              href={`/${locale}/projects/${remix.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Cover Image */}
              {remix.cover_url && (
                <div className="h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={remix.cover_url}
                    alt={remix.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                {/* Remix Badge */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('remixes.badge')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {remix.title}
                </h3>

                {/* Parent Project Link */}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('remixes.remixOf')}:{' '}
                  <span className="font-medium text-primary hover:underline">
                    {remix.parent_title}
                  </span>
                </p>

                {/* Description */}
                {remix.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {remix.description}
                  </p>
                )}

                {/* Creator Info */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {remix.creator_avatar && (
                      <img
                        src={remix.creator_avatar}
                        alt={remix.creator_name}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {remix.creator_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(remix.created_at).toLocaleDateString(locale)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('remixes.noRemixes')}</p>
            {isMember && (
              <p className="mt-2 text-sm text-gray-400">
                {t('remixes.emptyMessage')}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Members Tab
  if (tab === 'members') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabData && tabData.length > 0 ? (
          tabData.map((member: any) => (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                {member.profiles?.avatar_url && (
                  <img
                    src={member.profiles.avatar_url}
                    alt={member.profiles.display_name}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {member.profiles?.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`members.role.${member.role}`)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('members.joined')} {new Date(member.joined_at).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">{t('members.noMembers')}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
