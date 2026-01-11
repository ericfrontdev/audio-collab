import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/navigation/Sidebar';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Compass } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('explore');
  const supabase = await createClient();

  // Get current user
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

  // Get all public projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, description, cover_image_url, status, owner_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get owner profiles for all projects
  const ownerIds = projects?.map(p => p.owner_id) || [];
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', ownerIds)
    : { data: null };

  // Format projects with owner data
  const formattedProjects = projects?.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    cover_image_url: p.cover_image_url,
    status: p.status,
    owner_id: p.owner_id,
    created_at: p.created_at,
    owner: ownerProfiles?.find(profile => profile.id === p.owner_id) || null,
  })) || [];

  return (
    <>
      <Sidebar username={userProfile?.username} />
      <main className="flex-1 min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Compass className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
            </div>
            <p className="text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          {/* Projects Grid */}
          {formattedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formattedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Compass className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('noProjectsYet')}
              </h3>
              <p className="text-gray-400">
                {t('noProjectsDescription')}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
