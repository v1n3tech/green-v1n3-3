'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// =============================================
// TYPES
// =============================================

export type BroadcastAudience = 'all' | 'executives' | 'gcm' | 'lgpa' | 'scc' | 'admins'
export type BroadcastStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled'
export type BroadcastPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Broadcast {
  id: string
  title: string
  message: string
  audience: BroadcastAudience
  target_community: string | null
  scheduled_for: string | null
  sent_at: string | null
  status: BroadcastStatus
  created_by: string
  created_at: string
  updated_at: string
  priority: BroadcastPriority
  recipients_count: number
  reads_count: number
  // Joined data
  creator?: {
    display_name: string
    agro_id: string
    avatar_url: string | null
  }
}

// =============================================
// FETCH BROADCASTS
// =============================================

export async function fetchBroadcasts(options?: {
  status?: BroadcastStatus
  limit?: number
  offset?: number
}): Promise<{ broadcasts: Broadcast[]; total: number; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { broadcasts: [], total: 0, error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { broadcasts: [], total: 0, error: 'Unauthorized' }
  }

  let query = supabase
    .from('broadcasts')
    .select(`
      *,
      creator:profiles!broadcasts_created_by_fkey (
        display_name, agro_id, avatar_url
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[Broadcasts] Fetch error:', error)
    return { broadcasts: [], total: 0, error: error.message }
  }

  return { broadcasts: data as Broadcast[], total: count || 0 }
}

// =============================================
// CREATE BROADCAST
// =============================================

export async function createBroadcast(data: {
  title: string
  message: string
  audience: BroadcastAudience
  targetCommunity?: string
  priority?: BroadcastPriority
  scheduledFor?: string
}): Promise<{ broadcast: Broadcast | null; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { broadcast: null, error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { broadcast: null, error: 'Unauthorized - Admin access required' }
  }

  const status: BroadcastStatus = data.scheduledFor ? 'scheduled' : 'draft'

  const { data: broadcast, error } = await supabase
    .from('broadcasts')
    .insert({
      title: data.title,
      message: data.message,
      audience: data.audience,
      target_community: data.targetCommunity || null,
      priority: data.priority || 'normal',
      scheduled_for: data.scheduledFor || null,
      status,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[Broadcasts] Create error:', error)
    return { broadcast: null, error: error.message }
  }

  revalidatePath('/admin')
  return { broadcast }
}

// =============================================
// SEND BROADCAST (IMMEDIATELY)
// =============================================

export async function sendBroadcast(
  broadcastId: string
): Promise<{ recipientsCount: number; error?: string }> {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { recipientsCount: 0, error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { recipientsCount: 0, error: 'Unauthorized' }
  }

  // Get the broadcast
  const { data: broadcast, error: fetchError } = await adminClient
    .from('broadcasts')
    .select('*')
    .eq('id', broadcastId)
    .single()

  if (fetchError || !broadcast) {
    return { recipientsCount: 0, error: 'Broadcast not found' }
  }

  if (broadcast.status === 'sent') {
    return { recipientsCount: 0, error: 'Broadcast already sent' }
  }

  // Build audience query
  let recipientsQuery = adminClient
    .from('profiles')
    .select('id')
    .eq('is_active', true)

  if (broadcast.audience !== 'all') {
    const roleMap: Record<string, string> = {
      'executives': 'agro_executive',
      'gcm': 'gcm',
      'lgpa': 'lgpa',
      'scc': 'scc_member',
      'admins': 'admin',
    }
    recipientsQuery = recipientsQuery.eq('role', roleMap[broadcast.audience])
  }

  if (broadcast.target_community) {
    recipientsQuery = recipientsQuery.eq('community', broadcast.target_community)
  }

  const { data: recipients, error: recipientsError } = await recipientsQuery

  if (recipientsError) {
    console.error('[Broadcasts] Recipients query error:', recipientsError)
    return { recipientsCount: 0, error: 'Failed to find recipients' }
  }

  if (!recipients || recipients.length === 0) {
    return { recipientsCount: 0, error: 'No recipients match the criteria' }
  }

  // Create notifications for all recipients
  const notifications = recipients.map(r => ({
    user_id: r.id,
    type: 'system',
    title: broadcast.title,
    body: broadcast.message,
    reference_type: 'broadcast',
    reference_id: broadcastId,
    action_url: '/dashboard/notifications',
    metadata: { priority: broadcast.priority, broadcast_id: broadcastId },
  }))

  // Insert notifications in batches of 100
  const batchSize = 100
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize)
    const { error: insertError } = await adminClient
      .from('notifications')
      .insert(batch)

    if (insertError) {
      console.error('[Broadcasts] Notification insert error:', insertError)
    }
  }

  // Update broadcast status
  const { error: updateError } = await adminClient
    .from('broadcasts')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipients_count: recipients.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', broadcastId)

  if (updateError) {
    console.error('[Broadcasts] Status update error:', updateError)
    return { recipientsCount: recipients.length, error: 'Sent but failed to update status' }
  }

  revalidatePath('/admin')
  return { recipientsCount: recipients.length }
}

// =============================================
// CREATE AND SEND BROADCAST (ONE STEP)
// =============================================

export async function createAndSendBroadcast(data: {
  title: string
  message: string
  audience: BroadcastAudience
  targetCommunity?: string
  priority?: BroadcastPriority
}): Promise<{ recipientsCount: number; broadcast: Broadcast | null; error?: string }> {
  // Create the broadcast first
  const { broadcast, error: createError } = await createBroadcast(data)

  if (createError || !broadcast) {
    return { recipientsCount: 0, broadcast: null, error: createError || 'Failed to create broadcast' }
  }

  // Send it immediately
  const { recipientsCount, error: sendError } = await sendBroadcast(broadcast.id)

  if (sendError) {
    return { recipientsCount: 0, broadcast, error: sendError }
  }

  return { recipientsCount, broadcast }
}

// =============================================
// DELETE BROADCAST
// =============================================

export async function deleteBroadcast(
  broadcastId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('broadcasts')
    .delete()
    .eq('id', broadcastId)

  if (error) {
    console.error('[Broadcasts] Delete error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// =============================================
// GET BROADCAST STATS
// =============================================

export async function getBroadcastStats(): Promise<{
  total: number
  sent: number
  draft: number
  scheduled: number
  totalRecipients: number
  totalReads: number
}> {
  const supabase = await createClient()

  const { data: stats } = await supabase
    .from('broadcasts')
    .select('status, recipients_count, reads_count')

  if (!stats) {
    return { total: 0, sent: 0, draft: 0, scheduled: 0, totalRecipients: 0, totalReads: 0 }
  }

  return {
    total: stats.length,
    sent: stats.filter(b => b.status === 'sent').length,
    draft: stats.filter(b => b.status === 'draft').length,
    scheduled: stats.filter(b => b.status === 'scheduled').length,
    totalRecipients: stats.reduce((sum, b) => sum + (b.recipients_count || 0), 0),
    totalReads: stats.reduce((sum, b) => sum + (b.reads_count || 0), 0),
  }
}
