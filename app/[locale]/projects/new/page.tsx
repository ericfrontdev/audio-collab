import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layouts/AppLayout';
import { NewProjectForm } from '@/components/projects/NewProjectForm';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // If no club specified, redirect to clubs page
  if (!params.club) {
    redirect('/clubs');
  }

  // Get club info
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', params.club)
    .single();

  if (clubError || !club) {
    redirect('/clubs');
  }

  // Check if user is a member of the club
  const { data: membership } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect(`/clubs/${club.slug}`);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-gray-400">
              Start a new collaborative project in <span className="text-primary font-semibold">{club.name}</span>
            </p>
          </div>

          {/* Form */}
          <NewProjectForm clubId={club.id} clubSlug={club.slug} userId={user.id} />
        </div>
      </div>
    </AppLayout>
  );
}
