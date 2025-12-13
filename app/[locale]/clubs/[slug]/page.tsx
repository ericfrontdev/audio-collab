import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ClubTabs from '@/components/clubs/ClubTabs'
import JoinLeaveButton from '@/components/clubs/JoinLeaveButton'

export default async function ClubDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale, slug } = await params
  const { tab = 'overview' } = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('clubs')

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Fetch club details
  const { data: club, error } = await supabase
    .from('clubs')
    .select(`
      *,
      club_members!inner(
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !club) {
    notFound()
  }

  // Check if user is a member
  const isMember = club.club_members.some((m: any) => m.user_id === user.id)

  // Fetch tab-specific data based on active tab
  let tabData: any = null

  switch (tab) {
    case 'projects':
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:owner_id (
            display_name,
            avatar_url
          )
        `)
        .eq('kind', 'club')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
      tabData = projects
      break

    case 'challenges':
      const { data: challenges } = await supabase
        .from('club_challenges')
        .select('*')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
      tabData = challenges
      break

    case 'discussions':
      const { data: threads } = await supabase
        .from('club_threads')
        .select(`
          *,
          profiles:created_by (
            display_name,
            avatar_url
          ),
          club_thread_replies!inner(count)
        `)
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
      tabData = threads
      break

    case 'remixes':
      // Fetch all remixes (projects with parent_project_id) from this club
      const { data: remixProjects } = await supabase
        .from('project_remixes')
        .select('*')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
      tabData = remixProjects
      break

    case 'members':
      tabData = club.club_members
      break

    default:
      // Overview - fetch counts
      const [
        { count: projectCount },
        { count: challengeCount },
        { count: threadCount },
        { count: memberCount }
      ] = await Promise.all([
        supabase.from('club_projects').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
        supabase.from('club_challenges').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
        supabase.from('club_threads').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
        supabase.from('club_members').select('*', { count: 'exact', head: true }).eq('club_id', club.id)
      ])
      tabData = { projectCount, challengeCount, threadCount, memberCount }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cover Image */}
          {club.cover_url && (
            <div className="h-64 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 overflow-hidden">
              <img
                src={club.cover_url}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="py-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {club.name}
                </h1>
                {club.description && (
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    {club.description}
                  </p>
                )}
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {club.club_members?.length || 0} {t('members')}
                  </div>
                </div>
              </div>

              <div className="ml-6">
                <JoinLeaveButton clubId={club.id} isMember={isMember} locale={locale} />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-t border-gray-200 dark:border-gray-700 -mb-px">
            <nav className="flex space-x-8">
              <Link
                href={`/${locale}/clubs/${slug}`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  !tab || tab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('tabs.overview')}
              </Link>
              <Link
                href={`/${locale}/clubs/${slug}?tab=discussions`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === 'discussions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('tabs.discussions')}
              </Link>
              <Link
                href={`/${locale}/clubs/${slug}?tab=projects`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === 'projects'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('tabs.projects')}
              </Link>
              <Link
                href={`/${locale}/clubs/${slug}?tab=challenges`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === 'challenges'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('tabs.challenges')}
              </Link>
              <Link
                href={`/${locale}/clubs/${slug}?tab=remixes`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === 'remixes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('tabs.remixes')}
              </Link>
              <Link
                href={`/${locale}/clubs/${slug}?tab=members`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === 'members'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('tabs.members')}
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClubTabs
          tab={tab}
          club={club}
          tabData={tabData}
          isMember={isMember}
          locale={locale}
        />
      </div>
    </div>
  )
}
