"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { COMMUNITIES, type AgroCommunityKey } from "@/components/onboarding/data"

const VALID_KEYS = new Set<string>(COMMUNITIES.map((c) => c.key))

export type ViewerRelation = "member" | "staff" | "following" | "none"

export type CommunityDirectoryEntry = {
  key: AgroCommunityKey
  label: string
  hint: string
  memberCount: number
  followerCount: number
  latestBroadcastTitle: string | null
  relation: ViewerRelation
}

export type CommunityFeedItem = {
  id: string
  kind: "post" | "broadcast"
  title: string | null
  content: string
  authorName: string | null
  isPinned: boolean
  createdAt: string
}

export type FollowedUpdate = {
  id: string
  kind: "broadcast" | "post" | "service" | "product"
  community: AgroCommunityKey
  title: string
  body: string | null
  createdAt: string
  href: string
}

/**
 * Resolves the viewer's relation to every community in one pass.
 * member = profiles.community match (exec+), staff = secondary_communities (GCM/LGPA) or admin,
 * following = community_follows row, none = preview tier.
 */
async function getViewerContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: follows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, community, secondary_communities")
      .eq("id", user.id)
      .single(),
    supabase.from("community_follows").select("community").eq("user_id", user.id),
  ])

  if (!profile) return null

  return {
    userId: user.id,
    role: (profile.role ?? "user") as string,
    community: (profile.community ?? null) as AgroCommunityKey | null,
    secondary: (profile.secondary_communities ?? []) as AgroCommunityKey[],
    followed: new Set((follows ?? []).map((f) => f.community as AgroCommunityKey)),
  }
}

function relationFor(
  ctx: NonNullable<Awaited<ReturnType<typeof getViewerContext>>>,
  key: AgroCommunityKey,
): ViewerRelation {
  if (ctx.role === "admin") return "staff"
  if (ctx.community === key) return "member"
  if (ctx.secondary.includes(key)) return "staff"
  if (ctx.followed.has(key)) return "following"
  return "none"
}

/** Follow a community for read-only updates. Never grants membership. */
export async function followCommunity(community: AgroCommunityKey) {
  if (!VALID_KEYS.has(community)) return { error: "Invalid community" }

  const ctx = await getViewerContext()
  if (!ctx) return { error: "Not authenticated" }

  const relation = relationFor(ctx, community)
  if (relation === "member" || relation === "staff") {
    return { error: "You already belong to this community" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("community_follows")
    .upsert({ user_id: ctx.userId, community }, { onConflict: "user_id,community" })

  if (error) return { error: error.message }

  revalidatePath("/dashboard/communities")
  return { success: true }
}

export async function unfollowCommunity(community: AgroCommunityKey) {
  if (!VALID_KEYS.has(community)) return { error: "Invalid community" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("community_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("community", community)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/communities")
  return { success: true }
}

/**
 * Full directory: ALL 14 communities with counts, broadcast teaser, and the
 * viewer's relation. Aggregate counts use the admin client (counts only — no
 * row data is exposed); the relation itself is derived from the viewer's own
 * RLS-scoped rows.
 */
export async function getCommunityDirectory(): Promise<{
  entries: CommunityDirectoryEntry[]
  error?: string
}> {
  const ctx = await getViewerContext()
  if (!ctx) return { entries: [], error: "Not authenticated" }

  const admin = createAdminClient()

  const [membersRes, followersRes, broadcastsRes] = await Promise.all([
    admin.from("profiles").select("community").not("community", "is", null),
    admin.from("community_follows").select("community"),
    admin
      .from("broadcasts")
      .select("title, target_community, sent_at")
      .eq("status", "sent")
      .not("target_community", "is", null)
      .order("sent_at", { ascending: false })
      .limit(100),
  ])

  const memberCounts = new Map<string, number>()
  for (const row of membersRes.data ?? []) {
    memberCounts.set(row.community, (memberCounts.get(row.community) ?? 0) + 1)
  }

  const followerCounts = new Map<string, number>()
  for (const row of followersRes.data ?? []) {
    followerCounts.set(row.community, (followerCounts.get(row.community) ?? 0) + 1)
  }

  const latestBroadcast = new Map<string, string>()
  for (const b of broadcastsRes.data ?? []) {
    if (b.target_community && !latestBroadcast.has(b.target_community)) {
      latestBroadcast.set(b.target_community, b.title)
    }
  }

  const entries: CommunityDirectoryEntry[] = COMMUNITIES.map((c) => ({
    key: c.key,
    label: c.label,
    hint: c.hint,
    memberCount: memberCounts.get(c.key) ?? 0,
    followerCount: followerCounts.get(c.key) ?? 0,
    latestBroadcastTitle: latestBroadcast.get(c.key) ?? null,
    relation: relationFor(ctx, c.key),
  }))

  return { entries }
}

/**
 * Real feed for one community: posts + sent broadcasts, newest first.
 * Server-enforced: only returned when the viewer is member/staff/following.
 */
export async function getCommunityFeed(
  community: AgroCommunityKey,
): Promise<{ items: CommunityFeedItem[]; relation: ViewerRelation; error?: string }> {
  if (!VALID_KEYS.has(community)) return { items: [], relation: "none", error: "Invalid community" }

  const ctx = await getViewerContext()
  if (!ctx) return { items: [], relation: "none", error: "Not authenticated" }

  const relation = relationFor(ctx, community)
  if (relation === "none") {
    return { items: [], relation, error: "Follow this community to see its feed" }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const [postsRes, broadcastsRes] = await Promise.all([
    supabase
      .from("community_posts")
      .select("id, title, content, is_pinned, created_at, author_id, profiles:author_id (display_name)")
      .eq("community", community)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("broadcasts")
      .select("id, title, message, sent_at")
      .eq("status", "sent")
      .eq("target_community", community)
      .order("sent_at", { ascending: false })
      .limit(10),
  ])

  const items: CommunityFeedItem[] = [
    ...(postsRes.data ?? []).map((p) => ({
      id: p.id,
      kind: "post" as const,
      title: p.title,
      content: p.content,
      authorName: (p.profiles as unknown as { display_name: string | null } | null)?.display_name ?? null,
      isPinned: p.is_pinned ?? false,
      createdAt: p.created_at,
    })),
    ...(broadcastsRes.data ?? []).map((b) => ({
      id: b.id,
      kind: "broadcast" as const,
      title: b.title,
      content: b.message,
      authorName: "GREENV1N3 HQ",
      isPinned: false,
      createdAt: b.sent_at,
    })),
  ].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return { items, relation }
}

/** Merged, time-sorted updates across every community the viewer follows. */
export async function getFollowedUpdates(
  limit = 20,
): Promise<{ updates: FollowedUpdate[]; followed: AgroCommunityKey[]; error?: string }> {
  const ctx = await getViewerContext()
  if (!ctx) return { updates: [], followed: [], error: "Not authenticated" }

  const followed = [...ctx.followed]
  if (followed.length === 0) return { updates: [], followed: [] }

  const admin = createAdminClient()

  const [broadcastsRes, postsRes, servicesRes, productsRes] = await Promise.all([
    admin
      .from("broadcasts")
      .select("id, title, message, target_community, sent_at")
      .eq("status", "sent")
      .in("target_community", followed)
      .order("sent_at", { ascending: false })
      .limit(limit),
    admin
      .from("community_posts")
      .select("id, title, content, community, created_at")
      .in("community", followed)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("community_services")
      .select("id, title, description, community, created_at")
      .eq("is_active", true)
      .in("community", followed)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("marketplace_products")
      .select("id, title, description, community, created_at")
      .eq("status", "approved")
      .eq("is_active", true)
      .in("community", followed)
      .order("created_at", { ascending: false })
      .limit(limit),
  ])

  const updates: FollowedUpdate[] = [
    ...(broadcastsRes.data ?? []).map((b) => ({
      id: b.id,
      kind: "broadcast" as const,
      community: b.target_community as AgroCommunityKey,
      title: b.title,
      body: b.message?.slice(0, 160) ?? null,
      createdAt: b.sent_at,
      href: "/dashboard/communities",
    })),
    ...(postsRes.data ?? []).map((p) => ({
      id: p.id,
      kind: "post" as const,
      community: p.community as AgroCommunityKey,
      title: p.title ?? p.content.slice(0, 80),
      body: p.title ? p.content.slice(0, 160) : null,
      createdAt: p.created_at,
      href: "/dashboard/communities",
    })),
    ...(servicesRes.data ?? []).map((s) => ({
      id: s.id,
      kind: "service" as const,
      community: s.community as AgroCommunityKey,
      title: s.title,
      body: s.description?.slice(0, 160) ?? null,
      createdAt: s.created_at,
      href: "/dashboard/communities",
    })),
    ...(productsRes.data ?? []).map((p) => ({
      id: p.id,
      kind: "product" as const,
      community: p.community as AgroCommunityKey,
      title: p.title,
      body: p.description?.slice(0, 160) ?? null,
      createdAt: p.created_at,
      href: "/dashboard/marketplace",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  return { updates, followed }
}

/** Create a real feed post. RLS enforces member/staff/admin only. */
export async function createCommunityPost(input: {
  community: AgroCommunityKey
  title?: string
  content: string
}) {
  if (!VALID_KEYS.has(input.community)) return { error: "Invalid community" }
  const content = input.content?.trim()
  if (!content) return { error: "Post content is required" }
  if (content.length > 4000) return { error: "Post is too long (max 4000 characters)" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("community_posts").insert({
    community: input.community,
    author_id: user.id,
    title: input.title?.trim() || null,
    content,
  })

  if (error) {
    // RLS violation lands here for non-members — surface a friendly message.
    if (error.message.toLowerCase().includes("row-level security")) {
      return { error: "Only members of this community can post" }
    }
    return { error: error.message }
  }

  revalidatePath("/dashboard/communities")
  return { success: true }
}
