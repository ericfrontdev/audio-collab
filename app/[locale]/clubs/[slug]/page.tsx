import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ClubHeader } from '@/components/clubs/ClubHeader';
import { ClubTabs } from '@/components/clubs/ClubTabs';
import { UserProfileCard } from '@/components/cards/UserProfileCard';
import { QuickActions } from '@/components/cards/QuickActions';

export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get club data
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (clubError || !club) {
    notFound();
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id);

  // Check if user is member
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .single();

    isMember = !!membership;
  }

  // Get user profile if authenticated
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    userProfile = profile;
  }

  // Get club members
  const { data: clubMembers } = await supabase
    .from('club_members')
    .select('user_id, joined_at')
    .eq('club_id', club.id)
    .order('joined_at', { ascending: false });

  // Get profiles for all members
  let formattedMembers: any[] = [];
  if (clubMembers && clubMembers.length > 0) {
    const userIds = clubMembers.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    formattedMembers = clubMembers.map(m => {
      const profile = profiles?.find(p => p.id === m.user_id);
      return {
        id: profile?.id || m.user_id,
        username: profile?.username || 'unknown',
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
        joined_at: m.joined_at,
      };
    });
  }

  // Get projects for this club
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      owner_profile:profiles!projects_owner_id_fkey(username, display_name, avatar_url)
    `)
    .eq('club_id', club.id)
    .order('created_at', { ascending: false });

  // Get member count for each project
  let projectsWithDetails: any[] = [];
  if (projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    const { data: memberCounts } = await supabase
      .from('project_members')
      .select('project_id')
      .in('project_id', projectIds);

    projectsWithDetails = projects.map(p => ({
      ...p,
      member_count: memberCounts?.filter(m => m.project_id === p.id).length || 0,
    }));
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        {/* 3 Column Layout */}
        <div className="flex">
          {/* Main Content - Center */}
          <div className="flex-1 min-w-0">
            <ClubHeader
              club={club}
              memberCount={memberCount || 0}
              isMember={isMember}
              userId={user?.id}
            />
            <ClubTabs
              clubId={club.id}
              clubSlug={club.slug}
              isMember={isMember}
              club={club}
              members={formattedMembers}
              projects={projectsWithDetails}
            />
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-96 border-l border-zinc-800 p-6 space-y-6">
            {/* User Profile Card */}
            {userProfile && <UserProfileCard profile={userProfile} />}

            {/* Quick Actions */}
            <QuickActions clubId={club.id} isMember={isMember} />

            {/* Club Info Card */}
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">About this club</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {club.description || 'No description available'}
              </p>
              {club.rules && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <h4 className="text-xs font-semibold text-white mb-1">Rules</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{club.rules}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
