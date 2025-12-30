import { Sidebar } from '@/components/navigation/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { getUnreadMessagesCount } from '@/app/actions/messaging';

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let username = undefined;
  let unreadCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    username = profile?.username;

    // Get unread messages count
    const unreadResult = await getUnreadMessagesCount();
    if (unreadResult.success) {
      unreadCount = unreadResult.count;
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={username} unreadMessagesCount={unreadCount} />
      {/* Main content with left margin to account for sidebar */}
      <main className="lg:ml-64">
        {children}
      </main>
    </div>
  );
}
