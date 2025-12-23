import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Link } from '@/i18n/routing';
import { Users, Music, FolderOpen, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  console.log('Admin check:', { userId: user.id, profile, profileError, is_admin: profile?.is_admin });

  if (profileError) {
    console.log('Profile error:', profileError);
    redirect('/');
  }

  if (!profile || profile.is_admin !== true) {
    console.log('Not admin, redirecting...', { profile });
    redirect('/');
  }

  console.log('Admin check passed! Loading dashboard...');

  interface RecentUser {
    id: string;
    username: string;
    display_name: string | null;
    created_at: string;
    is_admin: boolean;
  }

  interface Club {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
  }

  // Get stats
  let totalUsers = 0, totalProjects = 0, totalClubs = 0, totalMemberships = 0;
  let recentUsers: RecentUser[] = [];
  let clubs: Club[] = [];

  try {
    const results = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('clubs').select('*', { count: 'exact', head: true }),
      supabase.from('club_members').select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id, username, display_name, created_at, is_admin')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    totalUsers = results[0].count || 0;
    totalProjects = results[1].count || 0;
    totalClubs = results[2].count || 0;
    totalMemberships = results[3].count || 0;
    recentUsers = results[4].data || [];
    clubs = results[5].data || [];
  } catch (error) {
    console.error('Error fetching admin stats:', error);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-gray-400">Manage your AudioCollab platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalUsers || 0}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Clubs</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalClubs || 0}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Projects</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalProjects || 0}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Club Members</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalMemberships || 0}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Music className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/clubs">
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold text-white">Manage Clubs</h3>
                  <p className="text-sm text-gray-400 mt-1">Create, edit, and delete clubs</p>
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold text-white">Manage Users</h3>
                  <p className="text-sm text-gray-400 mt-1">View and moderate users</p>
                </div>
              </Link>
              <Link href="/admin/projects">
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-semibold text-white">Manage Projects</h3>
                  <p className="text-sm text-gray-400 mt-1">Moderate projects and content</p>
                </div>
              </Link>
            </div>
          </div>

          {/* All Clubs */}
          <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 mb-8">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">All Clubs</h2>
              <Link href="/admin/clubs/new">
                <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium">
                  Create Club
                </button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {clubs?.map((club) => (
                    <tr key={club.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {club.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-primary/10 text-primary">
                          {club.genre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(club.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/clubs/${club.slug}`}
                          className="text-primary hover:text-primary/90 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/clubs/${club.id}/edit`}
                          className="text-gray-400 hover:text-white"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          <div className="rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white">Recent Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Display Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {recentUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        @{user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {user.display_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_admin
                            ? 'bg-primary/10 text-primary'
                            : 'bg-zinc-800 text-gray-400'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
