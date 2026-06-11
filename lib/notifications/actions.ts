'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export type NotificationType = 
  | 'message'
  | 'message_reaction'
  | 'request_received'
  | 'request_approved'
  | 'request_rejected'
  | 'assignment_new'
  | 'assignment_graded'
  | 'assignment_due'
  | 'news_published'
  | 'payment_received'
  | 'payment_sent'
  | 'badge_earned'
  | 'system'
  | 'admin_alert'
  | 'security'
  | 'community_update'

export type ReferenceType = 
  | 'conversation'
  | 'message'
  | 'request'
  | 'assignment'
  | 'news'
  | 'payment'
  | 'badge'
  | 'profile'
  | 'community'
  | 'post'
  | 'service'
  | 'product'
  | 'broadcast'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  reference_type: ReferenceType | null
  reference_id: string | null
  action_url: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
  expires_at: string | null
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  email_frequency: 'instant' | 'daily' | 'weekly' | 'never'
  messages_enabled: boolean
  requests_enabled: boolean
  assignments_enabled: boolean
  news_enabled: boolean
  payments_enabled: boolean
  system_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  created_at: string
  updated_at: string
}

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body?: string
  referenceType?: ReferenceType
  referenceId?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
  expiresAt?: string
}

// ============================================
// FETCH NOTIFICATIONS
// ============================================

export async function fetchNotifications(options?: {
  limit?: number
  offset?: number
  type?: NotificationType
  unreadOnly?: boolean
}): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { notifications: [], total: 0, unreadCount: 0 }
  }

  const limit = options?.limit || 20
  const offset = options?.offset || 0

  // Build query
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data: notifications, count, error } = await query

  if (error) {
    console.error('[Notifications] Fetch error:', error)
    return { notifications: [], total: 0, unreadCount: 0 }
  }

  // Get unread count separately
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return {
    notifications: (notifications || []) as Notification[],
    total: count || 0,
    unreadCount: unreadCount || 0
  }
}

// ============================================
// GET UNREAD COUNT
// ============================================

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('[Notifications] Count error:', error)
    return 0
  }

  return count || 0
}

// ============================================
// MARK AS READ
// ============================================

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[Notifications] Mark read error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// MARK ALL AS READ
// ============================================

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('[Notifications] Mark all read error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// DELETE NOTIFICATION
// ============================================

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[Notifications] Delete error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// DELETE ALL READ NOTIFICATIONS
// ============================================

export async function deleteAllReadNotifications(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('is_read', true)

  if (error) {
    console.error('[Notifications] Delete all read error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// CREATE NOTIFICATION (Admin/System use)
// ============================================

export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body || null,
        reference_type: params.referenceType || null,
        reference_id: params.referenceId || null,
        action_url: params.actionUrl || null,
        metadata: params.metadata || {},
        expires_at: params.expiresAt || null
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Notifications] Create error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, notificationId: data.id }
  } catch (err) {
    console.error('[Notifications] Create error:', err)
    return { success: false, error: 'Failed to create notification' }
  }
}

// ============================================
// BULK CREATE NOTIFICATIONS
// ============================================

export async function createBulkNotifications(
  notifications: CreateNotificationParams[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const adminClient = createAdminClient()

    const records = notifications.map(n => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body || null,
      reference_type: n.referenceType || null,
      reference_id: n.referenceId || null,
      action_url: n.actionUrl || null,
      metadata: n.metadata || {},
      expires_at: n.expiresAt || null
    }))

    const { data, error } = await adminClient
      .from('notifications')
      .insert(records)
      .select('id')

    if (error) {
      console.error('[Notifications] Bulk create error:', error)
      return { success: false, count: 0, error: error.message }
    }

    return { success: true, count: data?.length || 0 }
  } catch (err) {
    console.error('[Notifications] Bulk create error:', err)
    return { success: false, count: 0, error: 'Failed to create notifications' }
  }
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[Notifications] Preferences fetch error:', error)
    return null
  }

  // Create default preferences if none exist
  if (!data) {
    const { data: newPrefs, error: insertError } = await supabase
      .from('notification_preferences')
      .insert({ user_id: user.id })
      .select('*')
      .single()

    if (insertError) {
      console.error('[Notifications] Preferences create error:', insertError)
      return null
    }

    return newPrefs as NotificationPreferences
  }

  return data as NotificationPreferences
}

export async function updateNotificationPreferences(
  updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notification_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) {
    console.error('[Notifications] Preferences update error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ============================================
// HELPER: Notify user about new message
// ============================================

export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  conversationId: string,
  messagePreview?: string
): Promise<void> {
  await createNotification({
    userId: recipientId,
    type: 'message',
    title: `New message from ${senderName}`,
    body: messagePreview ? messagePreview.substring(0, 100) : 'You have a new message',
    referenceType: 'conversation',
    referenceId: conversationId,
    actionUrl: `/dashboard/messages?conversation=${conversationId}`
  })
}

// ============================================
// HELPER: Notify about request status
// ============================================

export async function notifyRequestStatus(
  userId: string,
  status: 'received' | 'approved' | 'rejected',
  requestId: string,
  communityName?: string
): Promise<void> {
  const titles = {
    received: 'New membership request',
    approved: 'Your request has been approved!',
    rejected: 'Your request status update'
  }

  const bodies = {
    received: `A new member has requested to join${communityName ? ` ${communityName}` : ''}`,
    approved: `Welcome! You are now a member${communityName ? ` of ${communityName}` : ''}`,
    rejected: 'Your membership request was not approved at this time'
  }

  await createNotification({
    userId,
    type: status === 'received' ? 'request_received' : status === 'approved' ? 'request_approved' : 'request_rejected',
    title: titles[status],
    body: bodies[status],
    referenceType: 'request',
    referenceId: requestId,
    actionUrl: status === 'received' ? `/dashboard/requests?id=${requestId}` : '/dashboard'
  })
}

// ============================================
// HELPER: Notify about assignment
// ============================================

export async function notifyAssignment(
  userId: string,
  type: 'new' | 'graded' | 'due',
  assignmentId: string,
  assignmentTitle: string,
  extra?: { grade?: string; dueDate?: string }
): Promise<void> {
  const titles = {
    new: 'New assignment',
    graded: 'Assignment graded',
    due: 'Assignment due soon'
  }

  const bodies = {
    new: `You have been assigned: ${assignmentTitle}`,
    graded: `Your assignment "${assignmentTitle}" has been graded${extra?.grade ? `: ${extra.grade}` : ''}`,
    due: `Reminder: "${assignmentTitle}" is due${extra?.dueDate ? ` on ${extra.dueDate}` : ' soon'}`
  }

  await createNotification({
    userId,
    type: type === 'new' ? 'assignment_new' : type === 'graded' ? 'assignment_graded' : 'assignment_due',
    title: titles[type],
    body: bodies[type],
    referenceType: 'assignment',
    referenceId: assignmentId,
    actionUrl: `/dashboard/assignments?id=${assignmentId}`
  })
}

// ============================================
// HELPER: Send system notification to all users
// ============================================

export async function notifyAllUsers(
  title: string,
  body: string,
  actionUrl?: string,
  filterRole?: string
): Promise<{ success: boolean; count: number }> {
  try {
    const adminClient = createAdminClient()

    // Get all user IDs
    let query = adminClient.from('profiles').select('id')
    if (filterRole) {
      query = query.eq('role', filterRole)
    }

    const { data: users, error } = await query

    if (error || !users) {
      return { success: false, count: 0 }
    }

    const notifications = users.map(user => ({
      userId: user.id,
      type: 'system' as NotificationType,
      title,
      body,
      actionUrl
    }))

    const result = await createBulkNotifications(notifications)
    return { success: result.success, count: result.count }
  } catch (err) {
    console.error('[Notifications] Notify all error:', err)
    return { success: false, count: 0 }
  }
}
