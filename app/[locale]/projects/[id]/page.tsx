import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

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
    redirect(`/${locale}/auth/login`);
  }

  // Verify project exists
  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Redirect to studio
  redirect(`/${locale}/projects/${id}/studio`);
}
