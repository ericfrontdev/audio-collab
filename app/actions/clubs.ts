'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createClub(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = formData.get('locale') as string || 'en'

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const clubData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string || null,
    cover_url: formData.get('cover_url') as string || null,
    visibility: formData.get('visibility') as string,
    owner_id: user.id,
  }

  const { error } = await supabase
    .from('clubs')
    .insert(clubData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/admin/clubs`)
  revalidatePath(`/${locale}/clubs`)
  redirect(`/${locale}/admin/clubs`)
}

export async function joinClub(clubId: string, locale: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    return { error: 'Already a member' }
  }

  const { error } = await supabase
    .from('club_members')
    .insert({
      club_id: clubId,
      user_id: user.id,
      role: 'member'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/clubs`)
  return { success: true }
}

export async function leaveClub(clubId: string, locale: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/clubs`)
  return { success: true }
}

export async function addProjectToClub(clubId: string, projectId: string, locale: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Check if user is a member
  const { data: member } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { error: 'You must be a member to add projects' }
  }

  const { error } = await supabase
    .from('club_projects')
    .insert({
      club_id: clubId,
      project_id: projectId,
      added_by: user.id
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/clubs`)
  return { success: true }
}

export async function createDiscussion(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = formData.get('locale') as string || 'en'
  const slug = formData.get('slug') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get club by slug
  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) {
    return { error: 'Club not found' }
  }

  // Check if user is a member
  const { data: member } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { error: 'You must be a member to create discussions' }
  }

  const threadData = {
    club_id: club.id,
    title: formData.get('title') as string || null,
    content: formData.get('content') as string,
    created_by: user.id,
  }

  const { error } = await supabase
    .from('club_threads')
    .insert(threadData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/clubs/${slug}`)
  redirect(`/${locale}/clubs/${slug}?tab=discussions`)
}

export async function replyToDiscussion(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = formData.get('locale') as string || 'en'
  const clubSlug = formData.get('clubSlug') as string
  const threadId = formData.get('threadId') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get thread and club info
  const { data: thread } = await supabase
    .from('club_threads')
    .select('club_id')
    .eq('id', threadId)
    .maybeSingle()

  if (!thread) {
    return { error: 'Discussion not found' }
  }

  // Check if user is a member
  const { data: member } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', thread.club_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { error: 'You must be a member to reply' }
  }

  const replyData = {
    thread_id: threadId,
    content: formData.get('content') as string,
    created_by: user.id,
  }

  const { error } = await supabase
    .from('club_thread_replies')
    .insert(replyData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/clubs/${clubSlug}/discussions/${threadId}`)
  redirect(`/${locale}/clubs/${clubSlug}/discussions/${threadId}`)
}

export async function participateInChallenge(challengeId: string, clubId: string, locale: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Check if user is a member of the club
  const { data: member } = await supabase
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { error: 'You must be a member of the club to participate' }
  }

  // Check if user has already participated
  const { data: existingEntry } = await supabase
    .from('projects')
    .select('id')
    .eq('kind', 'challenge')
    .eq('challenge_id', challengeId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existingEntry) {
    return { error: 'You have already participated in this challenge', projectId: existingEntry.id }
  }

  // Get challenge info for the title
  const { data: challenge } = await supabase
    .from('club_challenges')
    .select('title')
    .eq('id', challengeId)
    .maybeSingle()

  // Create the challenge project
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      kind: 'challenge',
      challenge_id: challengeId,
      club_id: clubId,
      owner_id: user.id,
      title: `Entry for ${challenge?.title || 'Challenge'}`,
      mode: 'public'
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/${locale}/clubs`)
  return { success: true, projectId: project.id }
}
