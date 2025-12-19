import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { StudioView } from '@/components/studio/StudioView';

export default async function ProjectStudioPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Fetch project to verify it exists
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, title, owner_id, club_id')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Check if user is project owner or club member (for club projects)
  const isOwner = project.owner_id === user.id;
  let isMember = isOwner;

  if (project.club_id && !isOwner) {
    const { data: clubMembership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', project.club_id)
      .eq('user_id', user.id)
      .single();

    isMember = !!clubMembership;
  }

  if (!isMember) {
    // User doesn't have access
    redirect(`/${locale}/clubs`);
  }

  return <StudioView projectId={id} />;
}
