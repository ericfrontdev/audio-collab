import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Link } from '@/i18n/routing';
import { Folder, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';

export default async function MyProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Get user's projects (owned or joined)
  // First get all project IDs where user is a member
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id);

  const memberProjectIds = memberships?.map(m => m.project_id) || [];

  // Get all projects where user is owner OR member
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .or(`owner_id.eq.${user.id},id.in.(${memberProjectIds.length > 0 ? memberProjectIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    .order('created_at', { ascending: false });

  // Get owner profiles for all projects
  const ownerIds = projects?.map(p => p.owner_id).filter(Boolean) || [];
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', ownerIds)
    : { data: null };

  // Enrich projects with owner info
  const projectsWithOwners = projects?.map(project => ({
    ...project,
    owner: ownerProfiles?.find(profile => profile.id === project.owner_id) || null,
  })) || [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-3 text-white">My Projects</h1>
              <p className="text-gray-400 text-lg">
                Manage and collaborate on your music projects
              </p>
            </div>
            <Link href={`/projects/new`}>
              <Button className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Debug Info */}
          {projectsError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">Error: {projectsError.message}</p>
              <p className="text-red-400 text-xs mt-2">Code: {projectsError.code}</p>
            </div>
          )}

          {/* Projects Grid */}
          {projectsWithOwners && projectsWithOwners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithOwners.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUserId={user.id}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Folder className="w-20 h-20 text-zinc-700 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3 text-white">No projects yet</h3>
              <p className="text-gray-400 mb-6 text-lg">
                Create your first project to start collaborating
              </p>
              <Link href={`/projects/new`}>
                <Button className="flex items-center gap-2 mx-auto">
                  <PlusCircle className="w-4 h-4" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
