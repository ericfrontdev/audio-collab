import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('dashboard');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const handleLogout = logout.bind(null, locale);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {t('logout')}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">{t('profileInformation')}</h2>
            <div className="space-y-2">
              <p><strong>{t('username')}:</strong> {profile?.username}</p>
              <p><strong>{t('displayName')}:</strong> {profile?.display_name}</p>
              <p><strong>{t('email')}:</strong> {user.email}</p>
            </div>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">{t('yourProjects')}</h2>
            <p className="text-muted-foreground">{t('noProjectsYet')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
