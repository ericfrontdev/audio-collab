'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Supabase error type
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Project access check result
 */
export interface ProjectAccessResult {
  success: boolean;
  user?: any;
  project?: { id: string; owner_id: string; club_id: string | null };
  error?: string;
}

/**
 * Verify user authentication and project access
 * Returns user and project data if authorized
 */
export async function checkProjectAccess(
  projectId: string
): Promise<ProjectAccessResult> {
  const supabase = await createClient();

  // Verify user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get project and check access
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, club_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) {
    return { success: false, error: 'Project not found' };
  }

  // Check if user is project owner or club member
  const isOwner = project.owner_id === user.id;
  let isMember = isOwner;

  if (project.club_id && !isOwner) {
    const { data: clubMembership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', project.club_id)
      .eq('user_id', user.id)
      .maybeSingle();

    isMember = !!clubMembership;
  }

  if (!isMember) {
    return { success: false, error: 'You are not a member of this project' };
  }

  return { success: true, user, project };
}
