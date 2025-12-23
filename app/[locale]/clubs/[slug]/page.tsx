import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ClubHeader } from '@/components/clubs/ClubHeader';
import { ClubTabs } from '@/components/clubs/ClubTabs';
import { UserProfileCard } from '@/components/cards/UserProfileCard';
import { QuickActions } from '@/components/cards/QuickActions';

// Types for club members with profile data
interface ClubMemberProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
}

// Types for projects with owner profile and member count
interface ProjectWithOwner {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'active' | 'archived' | 'completed';
  created_by: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  member_count: number;
}

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
    .maybeSingle();

  if (clubError || !club) {
    notFound();
  }

  // Run multiple queries in parallel
  const [
    { count: memberCount },
    membershipResult,
    profileResult,
    { data: clubMembers },
    { data: projects },
  ] = await Promise.all([
    // Get member count
    supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', club.id),
    // Check if user is member
    user
      ? supabase
          .from('club_members')
          .select('id')
          .eq('club_id', club.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Get user profile if authenticated
    user
      ? supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Get club members
    supabase
      .from('club_members')
      .select('user_id, joined_at')
      .eq('club_id', club.id)
      .order('joined_at', { ascending: false }),
    // Get projects for this club
    supabase
      .from('projects')
      .select('*')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false }),
  ]);

  const isMember = !!membershipResult.data;
  const userProfile = profileResult.data;

  // Run second batch of queries in parallel (depend on first batch)
  const memberProfilesPromise = clubMembers && clubMembers.length > 0
    ? supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', clubMembers.map(m => m.user_id))
    : Promise.resolve({ data: null });

  const ownerProfilesPromise = projects && projects.length > 0
    ? supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', projects.map(p => p.owner_id).filter(Boolean))
    : Promise.resolve({ data: null });

  const memberCountsPromise = projects && projects.length > 0
    ? supabase
        .from('collaborators')
        .select('project_id')
        .in('project_id', projects.map(p => p.id))
    : Promise.resolve({ data: null });

  const [
    { data: memberProfiles },
    { data: ownerProfiles },
    { data: memberCounts },
  ] = await Promise.all([
    memberProfilesPromise,
    ownerProfilesPromise,
    memberCountsPromise,
  ]);

  // Format members with profile data
  const formattedMembers: ClubMemberProfile[] = clubMembers?.map(m => {
    const profile = memberProfiles?.find(p => p.id === m.user_id);
    return {
      id: profile?.id || m.user_id,
      username: profile?.username || 'unknown',
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      joined_at: m.joined_at,
    };
  }) || [];

  // Format projects with owner profiles and member counts
  const projectsWithDetails: ProjectWithOwner[] = projects?.map(p => ({
    ...p,
    owner_profile: ownerProfiles?.find(profile => profile.id === p.owner_id) ?? null,
    member_count: memberCounts?.filter(m => m.project_id === p.id).length || 0,
  })) || [];

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
