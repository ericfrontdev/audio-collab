import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
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
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  // Get user for navigation (handle Supabase connection errors)
  let user = null;
  let isAdmin = false;

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    // Check if user is admin
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'admin';
    }
  } catch (error) {
    // Supabase not available (e.g., on landing page without DB connection)
    console.log('Supabase not available, rendering without auth');
  }

  // Hide navigation on landing page for now
  const isLandingPage = true;

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider messages={messages}>
          {!isLandingPage && <Navigation user={user} isAdmin={isAdmin} />}
          {children}
          <ToastContainer position="bottom-right" theme="dark" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
