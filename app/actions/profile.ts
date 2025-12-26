'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProfile(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log('Server-side user:', user)
  console.log('Server-side auth error:', authError)

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if profile already exists for this user
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    return { error: 'Profile already exists for this account' }
  }

  // Extract form data
  const username = formData.get('username') as string
  const displayName = formData.get('display_name') as string
  const bio = formData.get('bio') as string
  const musicalRoles = JSON.parse(formData.get('musical_roles') as string || '[]')
  const genres = JSON.parse(formData.get('genres') as string || '[]')
  const soundcloudUrl = formData.get('soundcloud_url') as string
  const instagramUrl = formData.get('instagram_url') as string
  const twitterUrl = formData.get('twitter_url') as string
  const youtubeUrl = formData.get('youtube_url') as string
  const websiteUrl = formData.get('website_url') as string
  const isPublic = formData.get('is_public') === 'true'
  const avatarFile = formData.get('avatar') as File | null

  let avatarUrl = null

  // Upload avatar if provided
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { error: `Avatar upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profiles').getPublicUrl(filePath)

    avatarUrl = publicUrl
  }

  // Insert profile
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    username: username.toLowerCase().trim(),
    display_name: displayName || null,
    avatar_url: avatarUrl,
    bio: bio || null,
    musical_roles: musicalRoles,
    genres: genres,
    soundcloud_url: soundcloudUrl || null,
    instagram_url: instagramUrl || null,
    twitter_url: twitterUrl || null,
    youtube_url: youtubeUrl || null,
    website_url: websiteUrl || null,
    is_public: isPublic,
  })

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      // Check which constraint was violated
      if (error.message.includes('profiles_pkey') || error.message.includes('duplicate key value violates unique constraint "profiles_pkey"')) {
        return { error: 'Profile already exists for this account' }
      }
      if (error.message.includes('profiles_username_key') || error.message.includes('username')) {
        return { error: 'Username already taken' }
      }
      return { error: 'This username or profile already exists' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract form data
  const displayName = formData.get('display_name') as string
  const bio = formData.get('bio') as string
  const musicalRoles = JSON.parse(formData.get('musical_roles') as string || '[]')
  const genres = JSON.parse(formData.get('genres') as string || '[]')
  const soundcloudUrl = formData.get('soundcloud_url') as string
  const instagramUrl = formData.get('instagram_url') as string
  const twitterUrl = formData.get('twitter_url') as string
  const youtubeUrl = formData.get('youtube_url') as string
  const websiteUrl = formData.get('website_url') as string
  const isPublic = formData.get('is_public') === 'true'
  const avatarFile = formData.get('avatar') as File | null
  const bannerFile = formData.get('banner') as File | null

  let avatarUrl = formData.get('current_avatar_url') as string | null
  let bannerUrl = formData.get('current_banner_url') as string | null

  // Upload new avatar if provided
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { error: `Avatar upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profiles').getPublicUrl(filePath)

    avatarUrl = publicUrl
  }

  // Upload new banner if provided
  if (bannerFile && bannerFile.size > 0) {
    const fileExt = bannerFile.name.split('.').pop()
    const fileName = `${user.id}-banner-${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, bannerFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { error: `Banner upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profiles').getPublicUrl(filePath)

    bannerUrl = publicUrl
  }

  // Update profile (username cannot be changed)
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName || null,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      bio: bio || null,
      musical_roles: musicalRoles,
      genres: genres,
      soundcloud_url: soundcloudUrl || null,
      instagram_url: instagramUrl || null,
      twitter_url: twitterUrl || null,
      youtube_url: youtubeUrl || null,
      website_url: websiteUrl || null,
      is_public: isPublic,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
