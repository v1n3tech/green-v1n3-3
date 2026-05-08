'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { AgroCommunityKey } from "@/components/onboarding/data"

// =============================================
// TYPES
// =============================================

export type ConversationType = 'direct' | 'group'
export type ParticipantRole = 'admin' | 'moderator' | 'member'
export type MessageType = 'text' | 'image' | 'file' | 'system'

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null
  description: string | null
  avatar_url: string | null
  community: string | null
  request_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  last_message_at: string
  is_active: boolean
  // Joined data
  participants?: ConversationParticipant[]
  last_message?: Message
  unread_count?: number
  other_participant?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
    role: string
    community: string | null
  }
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  role: ParticipantRole
  last_read_at: string
  unread_count: number
  is_muted: boolean
  is_pinned: boolean
  joined_at: string
  left_at: string | null
  // Joined data
  user?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
    role: string
    community: string | null
    is_active: boolean
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  reply_to_id: string | null
  type: MessageType
  attachment_url: string | null
  attachment_name: string | null
  attachment_size: number | null
  created_at: string
  updated_at: string
  edited_at: string | null
  is_deleted: boolean
  // Joined data
  sender?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
    role: string
    community: string | null
  }
  reply_to?: {
    id: string
    content: string
    sender_id: string
    sender?: { display_name: string }
  }
  is_read?: boolean
}

// =============================================
// PERMISSION CHECKING HELPERS
// =============================================

type UserRole = 'executive' | 'gcm' | 'lgpa' | 'scc' | 'admin'

interface UserProfile {
  id: string
  role: UserRole
  community: string | null
}

/**
 * Check if user A can message user B based on role hierarchy
 */
export async function canUserMessage(
  fromUser: UserProfile,
  toUser: UserProfile,
  isRequestBased: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  // Request-based messaging bypasses normal rules
  if (isRequestBased) {
    return { allowed: true }
  }

  // Admin can message anyone, anyone can message admin
  if (fromUser.role === 'admin' || toUser.role === 'admin') {
    return { allowed: true }
  }

  // SCC can only be contacted by SCC
  if (toUser.role === 'scc' && fromUser.role !== 'scc') {
    return { allowed: false, reason: 'Only SCC members can contact other SCC members' }
  }

  // SCC can contact anyone
  if (fromUser.role === 'scc') {
    return { allowed: true }
  }

  // GCM can message other GCMs
  if (fromUser.role === 'gcm' && toUser.role === 'gcm') {
    return { allowed: true }
  }

  // GCM can message LGPAs
  if (fromUser.role === 'gcm' && toUser.role === 'lgpa') {
    return { allowed: true }
  }

  // Executive can message their own GCM
  if (fromUser.role === 'executive' && toUser.role === 'gcm') {
    if (fromUser.community === toUser.community) {
      return { allowed: true }
    }
    return { allowed: false, reason: 'Executives can only message their own community GCM' }
  }

  // Executive can message other executives (private, not group)
  if (fromUser.role === 'executive' && toUser.role === 'executive') {
    return { allowed: true }
  }

  // LGPA can message GCMs (reverse of GCM -> LGPA)
  if (fromUser.role === 'lgpa' && toUser.role === 'gcm') {
    return { allowed: true }
  }

  return { allowed: false, reason: 'You do not have permission to message this user' }
}

/**
 * Check if user can join a community group chat
 */
export async function canJoinCommunityGroup(
  user: UserProfile,
  community: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Executives can only join their own community group chat
  if (user.role === 'executive') {
    if (user.community !== community) {
      return { allowed: false, reason: 'You can only join your own community group chat' }
    }
    return { allowed: true }
  }
  
  // GCMs can join their own community group chat
  if (user.role === 'gcm') {
    if (user.community !== community) {
      return { allowed: false, reason: 'You can only join your own community group chat' }
    }
    return { allowed: true }
  }
  
  // Admin and SCC can join any community group chat
  if (user.role === 'admin' || user.role === 'scc') {
    return { allowed: true }
  }
  
  // LGPA can join community groups in their LGA jurisdiction
  if (user.role === 'lgpa') {
    return { allowed: true }
  }

  return { allowed: false, reason: 'You do not have permission to join community group chats' }
}

// =============================================
// CONVERSATION ACTIONS
// =============================================

/**
 * Fetch all conversations for the current user
 */
export async function fetchConversations(options?: {
  type?: ConversationType
  search?: string
  limit?: number
  offset?: number
}): Promise<{ conversations: Conversation[]; total: number; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { conversations: [], total: 0, error: 'Not authenticated' }
  }

  // First get conversation IDs the user participates in
  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, unread_count, is_pinned')
    .eq('user_id', user.id)
    .is('left_at', null)

  if (partError) {
    console.error('Error fetching participations:', partError)
    return { conversations: [], total: 0, error: partError.message }
  }

  if (!participations || participations.length === 0) {
    return { conversations: [], total: 0 }
  }

  const conversationIds = participations.map(p => p.conversation_id)
  const unreadMap = new Map(participations.map(p => [p.conversation_id, p.unread_count]))
  const pinnedMap = new Map(participations.map(p => [p.conversation_id, p.is_pinned]))

  // Fetch conversations
  let query = supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false })

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
  }

  const { data: conversations, error: convError } = await query

  if (convError) {
    console.error('Error fetching conversations:', convError)
    return { conversations: [], total: 0, error: convError.message }
  }

  // For direct messages, get the other participant's info
  const directConvIds = conversations?.filter(c => c.type === 'direct').map(c => c.id) || []
  
  let otherParticipantsMap = new Map()
  if (directConvIds.length > 0) {
    const { data: otherParts } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        user:profiles!conversation_participants_user_id_fkey (
          id, display_name, agro_id, avatar_url, role, community
        )
      `)
      .in('conversation_id', directConvIds)
      .neq('user_id', user.id)
      .is('left_at', null)

    if (otherParts) {
      for (const p of otherParts) {
        otherParticipantsMap.set(p.conversation_id, p.user)
      }
    }
  }

  // Get last message for each conversation
  const { data: lastMessages } = await supabase
    .from('messages')
    .select(`
      id, conversation_id, content, type, created_at,
      sender:profiles!messages_sender_id_fkey (
        id, display_name, agro_id
      )
    `)
    .in('conversation_id', conversationIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const lastMessageMap = new Map()
  if (lastMessages) {
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg)
      }
    }
  }

  // Combine data
  const enrichedConversations: Conversation[] = (conversations || []).map(conv => ({
    ...conv,
    unread_count: unreadMap.get(conv.id) || 0,
    is_pinned: pinnedMap.get(conv.id) || false,
    other_participant: otherParticipantsMap.get(conv.id),
    last_message: lastMessageMap.get(conv.id),
  }))

  // Sort: pinned first, then by last_message_at
  enrichedConversations.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })

  return { conversations: enrichedConversations, total: enrichedConversations.length }
}

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateDirectConversation(
  otherUserId: string,
  requestId?: string
): Promise<{ conversation: Conversation | null; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { conversation: null, error: 'Not authenticated' }
  }

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role, community')
    .eq('id', user.id)
    .single()

  // Get other user's profile
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, role, community, display_name, agro_id, avatar_url')
    .eq('id', otherUserId)
    .single()

  if (!currentProfile || !otherProfile) {
    return { conversation: null, error: 'User not found' }
  }

  // Check permission
  const permCheck = await canUserMessage(
    currentProfile as UserProfile,
    otherProfile as UserProfile,
    !!requestId
  )

  if (!permCheck.allowed) {
    return { conversation: null, error: permCheck.reason }
  }

  // Check if conversation already exists
  const { data: existingConvs } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants!inner(user_id)
    `)
    .eq('type', 'direct')
    .eq('is_active', true)

  // Find conversation that has both users
  const existingConv = existingConvs?.find(conv => {
    const participantIds = conv.participants.map((p: any) => p.user_id)
    return participantIds.includes(user.id) && participantIds.includes(otherUserId)
  })

  if (existingConv) {
    return {
      conversation: {
        ...existingConv,
        other_participant: otherProfile,
      }
    }
  }

  // Use admin client to bypass RLS for conversation creation
  // This is safe because we've already verified permissions above
  const adminClient = createAdminClient()
  
  // Create new conversation
  const { data: newConv, error: convError } = await adminClient
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: user.id,
      request_id: requestId || null,
    })
    .select()
    .single()

  if (convError) {
    return { conversation: null, error: convError.message }
  }

  // Add both participants
  const { error: partError } = await adminClient
    .from('conversation_participants')
    .insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      { conversation_id: newConv.id, user_id: otherUserId, role: 'member' },
    ])

  if (partError) {
    return { conversation: null, error: partError.message }
  }

  revalidatePath('/dashboard/messages')

  return {
    conversation: {
      ...newConv,
      other_participant: otherProfile,
    }
  }
}

/**
 * Get or create a community group chat
 */
export async function getOrCreateCommunityGroupChat(
  community: AgroCommunityKey
): Promise<{ conversation: Conversation | null; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { conversation: null, error: 'Not authenticated' }
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, community')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { conversation: null, error: 'Profile not found' }
  }

  // Check permission
  const permCheck = await canJoinCommunityGroup(profile as UserProfile, community)
  if (!permCheck.allowed) {
    return { conversation: null, error: permCheck.reason }
  }

  // Use admin client to bypass RLS for group operations
  const adminClient = createAdminClient()
  
  // Check if community group exists
  const { data: existingGroup } = await adminClient
    .from('conversations')
    .select('*')
    .eq('type', 'group')
    .eq('community', community)
    .eq('is_active', true)
    .single()

  if (existingGroup) {
    // Check if user is already a participant
    const { data: existingPart } = await adminClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', existingGroup.id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    if (!existingPart) {
      // Add user to group
      await adminClient
        .from('conversation_participants')
        .insert({
          conversation_id: existingGroup.id,
          user_id: user.id,
          role: 'member',
        })
    }

    return { conversation: existingGroup }
  }

  // Create new community group
  const communityNames: Record<string, string> = {
    'agro-technology': 'Agro Technology',
    'livestock': 'Livestock',
    'crops': 'Crops',
    'media-branding': 'Media & Branding',
    'health': 'Health',
    'finance-legal': 'Finance & Legal',
    'logistics': 'Logistics',
  }

  const { data: newGroup, error: groupError } = await adminClient
    .from('conversations')
    .insert({
      type: 'group',
      name: `${communityNames[community] || community} Community`,
      description: `Official group chat for ${communityNames[community] || community} community executives`,
      community: community,
      created_by: user.id,
    })
    .select()
    .single()

  if (groupError) {
    return { conversation: null, error: groupError.message }
  }

  // Add creator as admin
  await adminClient
    .from('conversation_participants')
    .insert({
      conversation_id: newGroup.id,
      user_id: user.id,
      role: 'admin',
    })

  revalidatePath('/dashboard/messages')

  return { conversation: newGroup }
}

// =============================================
// MESSAGE ACTIONS
// =============================================

/**
 * Fetch messages for a conversation
 */
export async function fetchMessages(
  conversationId: string,
  options?: {
    limit?: number
    before?: string
  }
): Promise<{ messages: Message[]; hasMore: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { messages: [], hasMore: false, error: 'Not authenticated' }
  }

  // Verify user is participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .single()

  if (!participant) {
    return { messages: [], hasMore: false, error: 'Not a participant' }
  }

  const limit = options?.limit || 50

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        id, display_name, agro_id, avatar_url, role, community
      )
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data: messages, error } = await query

  if (error) {
    return { messages: [], hasMore: false, error: error.message }
  }

  const hasMore = (messages?.length || 0) > limit
  let resultMessages = messages?.slice(0, limit).reverse() || []

  // Fetch reply data for messages that have reply_to_id
  const replyToIds = resultMessages
    .filter(m => m.reply_to_id)
    .map(m => m.reply_to_id)
  
  if (replyToIds.length > 0) {
    const { data: replyMessages } = await supabase
      .from('messages')
      .select(`
        id, content, sender_id,
        sender:profiles!messages_sender_id_fkey (display_name)
      `)
      .in('id', replyToIds)
    
    if (replyMessages) {
      const replyMap = new Map(replyMessages.map(r => [r.id, r]))
      resultMessages = resultMessages.map(m => ({
        ...m,
        reply_to: m.reply_to_id ? replyMap.get(m.reply_to_id) : undefined
      }))
    }
  }

  // Mark messages as read
  if (resultMessages.length > 0) {
    const unreadMessageIds = resultMessages
      .filter(m => m.sender_id !== user.id)
      .map(m => m.id)

    if (unreadMessageIds.length > 0) {
      // Insert read records (ignore conflicts)
      await supabase
        .from('message_reads')
        .upsert(
          unreadMessageIds.map(messageId => ({
            message_id: messageId,
            user_id: user.id,
          })),
          { onConflict: 'message_id,user_id' }
        )
    }
  }

  return { messages: resultMessages as Message[], hasMore }
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  options?: {
    replyToId?: string
    type?: MessageType
    attachmentUrl?: string
    attachmentName?: string
    attachmentSize?: number
  }
): Promise<{ message: Message | null; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: null, error: 'Not authenticated' }
  }

  // Verify user is participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .single()

  if (!participant) {
    return { message: null, error: 'Not a participant' }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      reply_to_id: options?.replyToId || null,
      type: options?.type || 'text',
      attachment_url: options?.attachmentUrl || null,
      attachment_name: options?.attachmentName || null,
      attachment_size: options?.attachmentSize || null,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        id, display_name, agro_id, avatar_url, role, community
      )
    `)
    .single()

  if (error) {
    return { message: null, error: error.message }
  }

  revalidatePath('/dashboard/messages')

  return { message: message as Message }
}

/**
 * Get conversation participants
 */
export async function fetchConversationParticipants(
  conversationId: string
): Promise<{ participants: ConversationParticipant[]; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { participants: [], error: 'Not authenticated' }
  }

  const { data: participants, error } = await supabase
    .from('conversation_participants')
    .select(`
      *,
      user:profiles!conversation_participants_user_id_fkey (
        id, display_name, agro_id, avatar_url, role, community, is_active
      )
    `)
    .eq('conversation_id', conversationId)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  if (error) {
    return { participants: [], error: error.message }
  }

  return { participants: participants as ConversationParticipant[] }
}

/**
 * Search users to start a conversation
 */
export async function searchUsersForMessaging(
  search: string,
  limit: number = 10
): Promise<{ users: Array<{
  id: string
  display_name: string
  agro_id: string
  avatar_url: string | null
  role: string
  community: string | null
  can_message: boolean
  reason?: string
}>; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { users: [], error: 'Not authenticated' }
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role, community')
    .eq('id', user.id)
    .single()

  if (!currentProfile) {
    return { users: [], error: 'Profile not found' }
  }

  // Search users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, display_name, agro_id, avatar_url, role, community')
    .neq('id', user.id)
    .or(`display_name.ilike.%${search}%,agro_id.ilike.%${search}%`)
    .limit(limit)

  if (error) {
    return { users: [], error: error.message }
  }

  // Check messaging permissions for each user
  const usersWithPermissions = await Promise.all(
    (users || []).map(async (u) => {
      const permCheck = await canUserMessage(
        currentProfile as UserProfile,
        u as UserProfile,
        false
      )
      return {
        ...u,
        can_message: permCheck.allowed,
        reason: permCheck.reason,
      }
    })
  )

  return { users: usersWithPermissions }
}

/**
 * Pin/unpin a conversation
 */
export async function togglePinConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get current pin status
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id, is_pinned')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return { success: false, error: 'Not a participant' }
  }

  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_pinned: !participant.is_pinned })
    .eq('id', participant.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/messages')
  return { success: true }
}

/**
 * Mute/unmute a conversation
 */
export async function toggleMuteConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get current mute status
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id, is_muted')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return { success: false, error: 'Not a participant' }
  }

  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_muted: !participant.is_muted })
    .eq('id', participant.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/messages')
  return { success: true }
}
