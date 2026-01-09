import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';
import { ProjectHallView } from '@/components/projectHall/ProjectHallView';
import { getProjectHallData } from '@/app/actions/projectHall';

export default async function ProjectHallPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Get current user (optional - Hall is public)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile if authenticated
  const { data: userProfile } = user
    ? await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  // Get project with full details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Get project members with profiles
  const { data: membersData } = await supabase
    .from('project_members')
    .select(`
      id,
      project_id,
      user_id,
      role,
      instrument,
      added_at,
      profiles!project_members_user_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('project_id', id)
    .order('role', { ascending: true }); // owners first

  // Format members - profiles comes as array, take first element
  const members = membersData?.map(m => ({
    ...m,
    profiles: Array.isArray(m.profiles) && m.profiles.length > 0 ? m.profiles[0] : null
  })) || [];

  // Check if current user is a member or owner
  const isMember = user
    ? members?.some((m) => m.user_id === user.id) || user.id === project.owner_id
    : false;

  // Get hall posts
  const { posts: hallPosts } = await getProjectHallData(id);

  // Get version count (optional - for timeline)
  const { count: versionCount } = await supabase
    .from('project_versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id);

  return (
    <>
      <Sidebar username={userProfile?.username} />
      <main className="flex-1">
        <ProjectHallView
          project={project}
          members={members || []}
          hallPosts={hallPosts}
          currentUserId={user?.id}
          isAuthenticated={!!user}
          isMember={isMember}
          versionCount={versionCount || 0}
          locale={locale}
        />
      </main>
    </>
  );
}
