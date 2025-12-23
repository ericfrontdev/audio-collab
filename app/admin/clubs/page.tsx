import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Link } from '@/i18n/routing';
import { Pencil, Trash2, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminClubsPage() {
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

  // Fetch all clubs with member counts
  const { data: clubs } = await supabase
    .from('clubs')
    .select(`
      *,
      club_members (count)
    `)
    .order('created_at', { ascending: false });

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Manage Clubs</h1>
              <p className="mt-2 text-gray-400">Create, edit, and manage all clubs</p>
            </div>
            <Link href="/admin/clubs/new">
              <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium">
                Create New Club
              </button>
            </Link>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs?.map((club) => (
              <div
                key={club.id}
                className="rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden hover:border-primary/50 transition-colors"
              >
                {/* Club Banner */}
                <div className="relative h-32 bg-gradient-to-r from-primary/20 to-purple-600/20">
                  {club.banner_url && (
                    <img
                      src={club.banner_url}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Club Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {club.avatar_url ? (
                        <img
                          src={club.avatar_url}
                          alt={club.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{club.name}</h3>
                        <p className="text-sm text-gray-400">{club.slug}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-primary/10 text-primary">
                      {club.genre}
                    </span>
                  </div>

                  {club.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {club.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{club.club_members?.[0]?.count || 0} members</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/clubs/${club.slug}`}
                        className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/clubs/${club.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-zinc-800 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!clubs || clubs.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No clubs found</p>
              <Link href="/admin/clubs/new">
                <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium">
                  Create Your First Club
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
