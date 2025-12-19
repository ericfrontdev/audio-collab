import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { Music, Users, Calendar, Folder, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default async function MyProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Get club info separately if needed
  let projectsWithClubs = projects || [];
  if (projects && projects.length > 0) {
    const clubIds = projects.map(p => p.club_id).filter(Boolean);
    if (clubIds.length > 0) {
      const { data: clubs } = await supabase
        .from('clubs')
        .select('id, name, slug')
        .in('id', clubIds);

      if (clubs) {
        projectsWithClubs = projects.map(project => ({
          ...project,
          club: clubs.find(c => c.id === project.club_id) || null
        }));
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
            <Link href={`/${locale}/projects/new`}>
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
          {projectsWithClubs && projectsWithClubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsWithClubs.map((project) => (
                <Link key={project.id} href={`/${locale}/projects/${project.id}`}>
                  <div className="group rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden hover:border-primary/50 transition-all duration-300">
                    {/* Project Cover Image */}
                    <div className="relative h-40 bg-gradient-to-br from-primary/20 to-purple-600/20">
                      {project.cover_url ? (
                        <Image
                          src={project.cover_url}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Folder className="w-16 h-16 text-zinc-700" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          project.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : project.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : project.status === 'completed'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {project.status?.replace('_', ' ')}
                        </span>
                      </div>
                      {/* Kind Badge */}
                      {project.kind && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-zinc-900/80 text-white border border-zinc-700">
                            {project.kind === 'club' ? 'Club Project' : 'Personal'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {project.title}
                      </h3>

                      {project.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Club Info */}
                      {project.club && (
                        <div className="mb-3">
                          <Link
                            href={`/${locale}/clubs/${project.club.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary hover:underline"
                          >
                            {project.club.name}
                          </Link>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-zinc-800">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(project.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Folder className="w-20 h-20 text-zinc-700 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3 text-white">No projects yet</h3>
              <p className="text-gray-400 mb-6 text-lg">
                Create your first project to start collaborating
              </p>
              <Link href={`/${locale}/projects/new`}>
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
