'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Conversation, Message } from '@/lib/types/messaging'

interface SupabaseError {
  message: string
}

// Get or create a conversation between current user and another user
export async function getOrCreateConversation(otherUserId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (user.id === otherUserId) {
      return { success: false, error: 'Cannot create conversation with yourself' }
    }

    // Try to find existing conversation
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
      .or(`user_1_id.eq.${otherUserId},user_2_id.eq.${otherUserId}`)
      .single()

    if (existingConversation && !fetchError) {
      return { success: true, conversation: existingConversation }
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_1_id: user.id < otherUserId ? user.id : otherUserId,
        user_2_id: user.id < otherUserId ? otherUserId : user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError)
      return { success: false, error: createError.message }
    }

    revalidatePath('/messages')
    return { success: true, conversation: newConversation }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Send a message in a conversation
export async function sendMessage(conversationId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { success: false, error: 'Message cannot be empty' }
    }

    if (trimmedContent.length > 2000) {
      return { success: false, error: 'Message is too long (max 2000 characters)' }
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: trimmedContent,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      return { success: false, error: insertError.message }
    }

    // Fetch user profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Combine message with user profile
    const enrichedMessage = {
      ...message,
      user: profile,
    }

    // Update conversation last_message_at
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
    }

    revalidatePath('/messages')
    revalidatePath(`/messages/${conversationId}`)
    return { success: true, message: enrichedMessage }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Get messages for a conversation
export async function getMessages(conversationId: string, limit = 50, offset = 0) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return { success: false, error: error.message }
    }

    // Fetch all unique user profiles
    const userIds = [...new Set(messages.map(m => m.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)

    // Create a map of profiles for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Enrich messages with user profiles
    const enrichedMessages = messages.map(message => ({
      ...message,
      user: profileMap.get(message.user_id),
    }))

    return { success: true, messages: enrichedMessages as Message[] }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Get all conversations for current user
export async function getConversations() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return { success: false, error: error.message }
    }

    // Enrich conversations with other user profile and last message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user_1_id === user.id ? conv.user_2_id : conv.user_1_id

        // Fetch other user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', otherUserId)
          .single()

        // Fetch last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, user_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('user_id', user.id)

        return {
          ...conv,
          other_user: profile || undefined,
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0,
        } as Conversation
      })
    )

    return { success: true, conversations: enrichedConversations }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('user_id', user.id)

    if (error) {
      console.error('Error marking messages as read:', error)
      return { success: false, error: error.message }
    }

    // Revalidate all paths to update unread count in sidebar
    revalidatePath('/', 'layout')
    revalidatePath('/messages')
    revalidatePath(`/messages/${conversationId}`)
    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Edit a message
export async function editMessage(messageId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { success: false, error: 'Message cannot be empty' }
    }

    if (trimmedContent.length > 2000) {
      return { success: false, error: 'Message is too long (max 2000 characters)' }
    }

    const { data: message, error } = await supabase
      .from('messages')
      .update({ content: trimmedContent, is_edited: true })
      .eq('id', messageId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error editing message:', error)
      return { success: false, error: error.message }
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    const enrichedMessage = {
      ...message,
      user: profile,
    }

    revalidatePath('/messages')
    return { success: true, message: enrichedMessage }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Delete a message
export async function deleteMessage(messageId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting message:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/messages')
    return { success: true }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}

// Get unread messages count
export async function getUnreadMessagesCount() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated', count: 0 }
    }

    // Get all conversations for the user (force fresh data)
    const { data: conversations, error: convsError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (convsError) {
      console.error('Error fetching conversations:', convsError)
      return { success: false, error: convsError.message, count: 0 }
    }

    if (!conversations || conversations.length === 0) {
      return { success: true, count: 0 }
    }

    const conversationIds = conversations.map(c => c.id)

    // Count unread messages in those conversations (force fresh data)
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unread count:', error)
      return { success: false, error: error.message, count: 0 }
    }

    return { success: true, count: count || 0 }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message, count: 0 }
  }
}

// Search users for starting a new conversation
export async function searchUsers(query: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!query.trim()) {
      return { success: true, users: [] }
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .neq('id', user.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error('Error searching users:', error)
      return { success: false, error: error.message }
    }

    return { success: true, users }
  } catch (error: unknown) {
    const err = error as SupabaseError
    console.error('Error:', err)
    return { success: false, error: err.message }
  }
}
