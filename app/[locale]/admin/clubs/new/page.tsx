import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layouts/AppLayout';
import { CreateClubForm } from '@/components/admin/CreateClubForm';

export default async function NewClubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect(`/${locale}/`);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Create New Club</h1>
            <p className="mt-2 text-gray-400">Add a new musical genre club</p>
          </div>

          <CreateClubForm />
        </div>
      </div>
    </AppLayout>
  );
}
