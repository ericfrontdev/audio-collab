'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SupabaseError } from './helpers'

/**
 * Share a post to a direct message conversation
 */
export async function sharePostToMessage(
  postId: string,
  conversationId: string,
  content?: string
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return { success: false, error: 'Post not found' }
    }

    // Verify user is in the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user_1_id, user_2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return { success: false, error: 'Conversation not found' }
    }

    if (conversation.user_1_id !== user.id && conversation.user_2_id !== user.id) {
      return { success: false, error: 'Not authorized to message in this conversation' }
    }

    // Insert message with shared_post_id
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: content || null,
        shared_post_id: postId,
      })

    if (messageError) {
      console.error('Error sharing post to message:', messageError)
      return { success: false, error: messageError.message }
    }

    // Update conversation's last_message_at
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
    }

    revalidatePath('/messages')
    revalidatePath(`/messages/${conversationId}`)
    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error sharing post to message:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Share a post to a user's feed/profile
 */
export async function sharePostToFeed(
  postId: string,
  targetUserId: string,
  content?: string
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return { success: false, error: 'Post not found' }
    }

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single()

    if (userError || !targetUser) {
      return { success: false, error: 'Target user not found' }
    }

    // Create new post with shared_post_id and profile_user_id
    const { error: shareError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content || null,
        shared_post_id: postId,
        profile_user_id: targetUserId,
      })

    if (shareError) {
      console.error('Error sharing post to feed:', shareError)
      return { success: false, error: shareError.message }
    }

    revalidatePath('/feed')
    revalidatePath(`/profile/${targetUserId}`)
    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error sharing post to feed:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Share a post to a club
 */
export async function sharePostToClub(
  postId: string,
  clubId: string,
  content?: string
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user is a club member
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return { success: false, error: 'You must be a member to share to this club' }
    }

    // Verify the post exists
    const { data: originalPost, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !originalPost) {
      return { success: false, error: 'Post not found' }
    }

    // Create the shared post
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content || '',
        shared_post_id: postId,
        club_id: clubId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error sharing post to club:', insertError)
      return { success: false, error: insertError.message }
    }

    // Increment shares_count on original post
    await supabase.rpc('increment_shares_count', { post_id: postId })

    // Fetch club info
    const { data: club } = await supabase
      .from('clubs')
      .select('slug')
      .eq('id', clubId)
      .single()

    if (club) {
      revalidatePath(`/clubs/${club.slug}`)
    }

    return { success: true, post: newPost }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error sharing post to club:', err)
    return { success: false, error: err.message }
  }
}
