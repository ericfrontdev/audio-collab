import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ProjectWorkspace } from '@/components/project/ProjectWorkspace';

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
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  // Check if user is a project member
  const { data: membership } = await supabase
    .from('project_members')
    .select('id, role')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    // User is not a member of this project
    redirect(`/${locale}/projects`);
  }

  return <ProjectWorkspace projectId={id} currentUserId={user.id} />;
}
