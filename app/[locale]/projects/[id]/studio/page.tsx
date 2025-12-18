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
    .select('id, name, club_id')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Check if user is a project member (owner or collaborator)
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    // User is not a member, redirect to project detail page
    redirect(`/${locale}/projects/${id}`);
  }

  return <StudioView projectId={id} />;
}
