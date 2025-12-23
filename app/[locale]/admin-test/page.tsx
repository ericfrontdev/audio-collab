import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layouts/AppLayout';

export default async function AdminTestPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .maybeSingle();

  return (
    <AppLayout>
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Test Page</h1>

          <div className="space-y-6">
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">User Info</h2>
              <pre className="text-white text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Profile Info</h2>
              <pre className="text-white text-sm overflow-auto">
                {JSON.stringify({ profile, profileError }, null, 2)}
              </pre>
            </div>

            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Is Admin?</h2>
              <p className="text-2xl font-bold">
                {profile?.is_admin ? (
                  <span className="text-green-500"> YES - You are admin!</span>
                ) : (
                  <span className="text-red-500"> NO - You are NOT admin</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
