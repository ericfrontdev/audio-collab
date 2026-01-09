import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ProjectWorkspace } from '@/components/project/ProjectWorkspace';
import { checkStudioAccess } from '@/app/actions/projectHall';

export default async function ProjectStudioPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Get current user (optional - public studios don't require auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch project to verify it exists
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, title, owner_id, club_id, studio_visibility')
    .eq('id', id)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  // Check studio access permissions
  const { canAccess, isReadOnly } = await checkStudioAccess(id, user?.id);

  if (!canAccess) {
    // No access - redirect back to project Hall
    redirect(`/${locale}/projects/${id}`);
  }

  return (
    <ProjectWorkspace
      projectId={id}
      currentUserId={user?.id}
      ownerId={project.owner_id}
      locale={locale}
      readOnly={isReadOnly}
    />
  );
}
