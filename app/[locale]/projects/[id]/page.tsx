import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login`);
  }

  // Verify project exists
  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  // Redirect to studio (using Next.js redirect with locale)
  redirect(`/${locale}/projects/${id}/studio`);
}
