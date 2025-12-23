import { Sidebar } from '@/components/navigation/Sidebar';
import { createClient } from '@/lib/supabase/server';

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let username = undefined;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    username = profile?.username;
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={username} />
      {/* Main content with left margin to account for sidebar */}
      <main className="lg:ml-64">
        {children}
      </main>
    </div>
  );
}
