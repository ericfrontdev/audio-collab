import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../globals.css";

export const metadata: Metadata = {
  title: "AudioCollab - Collaborative Music Studio",
  description: "Create, collaborate, and remix music with musicians around the world",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  // Get user for navigation (handle Supabase connection errors)
  let user = null;
  let profile = null;

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    // Get user profile if user exists
    if (user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      profile = userProfile;
    }
  } catch (error) {
    // Supabase not available (e.g., on landing page without DB connection)
    console.log('Supabase not available, rendering without auth');
  }

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider initialUser={user} initialProfile={profile}>
            {children}
            <ToastContainer position="bottom-right" theme="dark" />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
