import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layouts/AppLayout'
import { ClubProjectsList } from '@/components/projects/ClubProjectsList'

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get user's clubs
  const { data: userClubs, error: clubsError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id)

  console.log('🔍 User ID:', user.id)
  console.log('🔍 User clubs:', userClubs)
  console.log('🔍 Clubs error:', clubsError)

  const userClubIds = userClubs?.map((c) => c.club_id) || []
  console.log('🔍 User club IDs:', userClubIds)

  // Get available projects from user's clubs
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      mode,
      club_id,
      owner_id,
      clubs(name, slug)
    `)
    .in('club_id', userClubIds.length > 0 ? userClubIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })

  console.log('🔍 Projects:', projects)
  console.log('🔍 Projects error:', projectsError)

  // Get user's project memberships
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  const memberProjectIds = new Set(memberships?.map((m) => m.project_id) || [])

  return (
    <AppLayout>
      <ClubProjectsList
        projects={projects || []}
        memberProjectIds={Array.from(memberProjectIds)}
        locale={locale}
      />
    </AppLayout>
  )
}
