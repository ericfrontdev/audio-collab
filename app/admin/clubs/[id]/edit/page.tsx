import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { EditClubForm } from '@/components/admin/EditClubForm';

export const dynamic = 'force-dynamic';

export default async function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect('/');
  }

  // Fetch club data
  const { data: club, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !club) {
    redirect('/admin/clubs');
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Edit Club</h1>
            <p className="mt-2 text-gray-400">Update club information</p>
          </div>

          <EditClubForm club={club} />
        </div>
      </div>
    </AppLayout>
  );
}
