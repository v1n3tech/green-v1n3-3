'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Users,
  MessageSquare,
  Calendar,
  Trophy,
  Star,
  ArrowRight,
  Bell,
  Settings,
  Crown,
  Sparkles,
  Radio,
  FileText,
  HelpCircle,
  PlusCircle,
  Heart,
  Share2,
  MoreHorizontal,
  Clock,
  Zap,
  Loader2,
  X,
  Check,
  Sprout,
  AlertCircle,
  Rss,
  Eye,
  Package,
  Megaphone,
  Send,
} from 'lucide-react'
import Link from 'next/link'
import type { AgroCommunityKey } from '@/components/onboarding/data'
import { fetchServices, type CommunityService } from '@/lib/services/actions'
import { joinCommunity } from '@/lib/communities/actions'
import {
  followCommunity,
  unfollowCommunity,
  getCommunityFeed,
  createCommunityPost,
  type CommunityDirectoryEntry,
  type CommunityFeedItem,
  type FollowedUpdate,
  type ViewerRelation,
} from '@/lib/communities/follow-actions'

interface Community {
  key: AgroCommunityKey
  label: string
  hint: string
}

interface DashboardCommunitiesProps {
  userCommunity: Community | null
  allCommunities: Community[]
  role: string | null
  displayName: string | null
  agroId: string | null
  directory: CommunityDirectoryEntry[]
  updates: FollowedUpdate[]
}

const COMMUNITY_EVENTS = [
  { id: '1', title: 'Weekly Community Call', date: 'Today, 4:00 PM', type: 'VIRTUAL' },
  { id: '2', title: 'Field Training Session', date: 'Tomorrow, 9:00 AM', type: 'IN-PERSON' },
  { id: '3', title: 'Investor Pitch Day', date: 'Sat, May 10', type: 'HYBRID' },
]

const LEADERBOARD = [
  { rank: 1, name: 'Yakubu Bello', points: 2450, badge: 'GOLD' },
  { rank: 2, name: 'Grace Emmanuel', points: 2320, badge: 'GOLD' },
  { rank: 3, name: 'David Pam', points: 2180, badge: 'SILVER' },
  { rank: 4, name: 'Fatima Hassan', points: 1950, badge: 'SILVER' },
  { rank: 5, name: 'John Dung', points: 1820, badge: 'BRONZE' },
]

type TabKey = 'feed' | 'services' | 'events' | 'members' | 'resources'

const UPDATE_KIND_META: Record<FollowedUpdate['kind'], { label: string; icon: React.ReactNode }> = {
  broadcast: { label: 'BROADCAST', icon: <Megaphone className="w-3 h-3" /> },
  post: { label: 'POST', icon: <Radio className="w-3 h-3" /> },
  service: { label: 'SERVICE', icon: <Zap className="w-3 h-3" /> },
  product: { label: 'PRODUCT', icon: <Package className="w-3 h-3" /> },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function DashboardCommunities({
  userCommunity,
  allCommunities,
  role,
  displayName,
  agroId,
  directory,
  updates,
}: DashboardCommunitiesProps) {
  const router = useRouter()
  const isRegularUser = role === 'user' || role === null

  const firstFollowed = directory.find((d) => d.relation === 'following')?.key ?? null
  const [selectedKey, setSelectedKey] = useState<AgroCommunityKey | null>(
    userCommunity?.key ?? firstFollowed,
  )
  const [activeTab, setActiveTab] = useState<TabKey>('feed')
  const [services, setServices] = useState<CommunityService[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const selectedEntry = directory.find((d) => d.key === selectedKey) ?? null
  const relation: ViewerRelation = selectedEntry?.relation ?? 'none'
  const canView = relation !== 'none'
  const canPost = relation === 'member' || relation === 'staff'

  // Fetch services when switching to services tab
  useEffect(() => {
    if (activeTab === 'services' && selectedKey && canView) {
      setServicesLoading(true)
      fetchServices({ community: selectedKey as any, limit: 20 })
        .then(({ services }) => setServices(services))
        .finally(() => setServicesLoading(false))
    }
  }, [activeTab, selectedKey, canView])

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'feed', label: 'Feed', icon: <Radio className="w-3.5 h-3.5" /> },
    { key: 'services', label: 'Services', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'events', label: 'Events', icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'members', label: 'Members', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'resources', label: 'Resources', icon: <FileText className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 02 — COMMUNITIES</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Community Header Card */}
      {selectedEntry ? (
        <CommunityHeaderCard
          key={selectedEntry.key}
          entry={selectedEntry}
          role={role}
          onChanged={() => router.refresh()}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background border border-border rounded-[2px] p-6 text-center"
        >
          <Rss className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-mono text-lg text-foreground mb-2">
            {isRegularUser ? 'Follow Communities' : 'No Community Selected'}
          </h2>
          <p className="mono-xs text-[11px] text-muted-foreground mb-4 text-balance">
            {isRegularUser
              ? 'Follow any of the 14 agro communities below to unlock their feeds, services, and updates — no membership required.'
              : 'Join a community to access exclusive features, or follow communities below for read-only updates.'}
          </p>
          {!isRegularUser && (
            <button
              onClick={() => setJoinOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background mono-sm text-xs rounded-[2px] hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              JOIN COMMUNITY
            </button>
          )}
        </motion.div>
      )}

      {/* All Communities Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-3.5 h-3.5 text-primary" />
            <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ ALL COMMUNITIES</span>
          </div>
          <span className="mono-xs text-[9px] text-primary">{directory.length} CHANNELS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {directory.map((entry) => (
            <DirectoryCard
              key={entry.key}
              entry={entry}
              isSelected={selectedKey === entry.key}
              onSelect={() => {
                setSelectedKey(entry.key)
                setActiveTab('feed')
              }}
              onChanged={() => router.refresh()}
            />
          ))}
        </div>
      </div>

      {/* Tabs + content — only when a community is selected */}
      {selectedEntry && (
        <>
          <div className="border-b border-border">
            <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 mono-xs text-[11px] border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {!canView ? (
                <PreviewLockedPanel entry={selectedEntry} onChanged={() => router.refresh()} />
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === 'feed' && (
                    <motion.div
                      key={`feed-${selectedEntry.key}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <CommunityFeed
                        community={selectedEntry.key}
                        canPost={canPost}
                        relation={relation}
                        onPosted={() => router.refresh()}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'services' && (
                    <motion.div
                      key={`services-${selectedEntry.key}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="mono-xs text-[10px] text-muted-foreground">/ COMMUNITY SERVICES</span>
                        </div>
                        <span className="mono-xs text-[9px] text-primary">{services.length} AVAILABLE</span>
                      </div>

                      {servicesLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                      ) : services.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {services.map((service) => (
                            <DashboardServiceCard key={service.id} service={service} isOwnCommunity={canPost} />
                          ))}
                        </div>
                      ) : (
                        <div className="bg-background border border-border rounded-[2px] p-6 text-center">
                          <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                          <h3 className="font-mono text-lg text-foreground mb-2">No Services Yet</h3>
                          <p className="mono-xs text-[11px] text-muted-foreground mb-4">
                            This community hasn&apos;t listed any services yet. Check back later or browse other communities.
                          </p>
                          <Link
                            href="/dashboard/requests"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background mono-sm text-xs rounded-[2px]"
                          >
                            BROWSE ALL SERVICES
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'events' && (
                    <motion.div
                      key={`events-${selectedEntry.key}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {COMMUNITY_EVENTS.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'members' && (
                    <motion.div
                      key={`members-${selectedEntry.key}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-background border border-border rounded-[2px]"
                    >
                      <div className="border-b border-border px-4 h-10 flex items-center">
                        <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ COMMUNITY MEMBERS</span>
                      </div>
                      <div className="divide-y divide-border">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
                            <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="mono-sm text-xs text-foreground">Member Name {i + 1}</p>
                              <p className="mono-xs text-[9px] text-muted-foreground">AE-PLT-{String(i + 100).padStart(4, '0')}</p>
                            </div>
                            <span className="mono-xs text-[9px] px-2 py-0.5 bg-secondary border border-border text-muted-foreground rounded-[2px]">
                              EXECUTIVE
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'resources' && (
                    <motion.div
                      key={`resources-${selectedEntry.key}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="bg-background border border-border rounded-[2px] p-6 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-mono text-lg text-foreground mb-2">Resources Coming Soon</h3>
                        <p className="mono-xs text-[11px] text-muted-foreground">
                          Training materials, guides, and documents will be available here.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Followed updates */}
              <FollowedUpdatesPanel updates={updates} />

              {/* Leaderboard */}
              <div className="bg-background border border-border rounded-[2px] overflow-hidden">
                <div className="border-b border-border px-4 h-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-accent" />
                    <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ LEADERBOARD</span>
                  </div>
                  <span className="mono-xs text-[9px] text-muted-foreground/60">THIS WEEK</span>
                </div>
                <div className="divide-y divide-border">
                  {LEADERBOARD.map((user) => (
                    <div key={user.rank} className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center mono-xs text-[10px] ${
                        user.rank === 1 ? 'bg-accent/20 text-accent' :
                        user.rank === 2 ? 'bg-foreground/10 text-foreground' :
                        user.rank === 3 ? 'bg-orange/20 text-orange' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {user.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="mono-xs text-[10px] text-foreground truncate">{user.name}</p>
                        <p className="mono-xs text-[9px] text-muted-foreground">{user.points} pts</p>
                      </div>
                      {user.rank <= 3 && (
                        <Crown className={`w-3.5 h-3.5 ${
                          user.rank === 1 ? 'text-accent' :
                          user.rank === 2 ? 'text-foreground/60' :
                          'text-orange'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-background border border-border rounded-[2px] overflow-hidden">
                <div className="border-b border-border px-4 h-10 flex items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ UPCOMING</span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {COMMUNITY_EVENTS.slice(0, 2).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 border border-border rounded-[2px]">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="mono-xs text-[10px] text-foreground truncate">{event.title}</p>
                        <p className="mono-xs text-[9px] text-muted-foreground">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Help */}
              <div className="bg-background border border-border rounded-[2px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span className="mono-xs text-[10px] text-foreground">NEED HELP?</span>
                </div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-3">
                  Connect with your GCM or contact support for assistance.
                </p>
                <button className="w-full py-2 border border-primary/30 text-primary mono-xs text-[10px] rounded-[2px] hover:bg-primary/5 transition-colors">
                  CONTACT SUPPORT
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* When nothing selected, still show updates panel if following */}
      {!selectedEntry && updates.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <FollowedUpdatesPanel updates={updates} expanded />
          </div>
        </div>
      )}

      <AnimatePresence>
        {joinOpen && !isRegularUser && (
          <JoinCommunityModal
            communities={allCommunities}
            currentKey={userCommunity?.key ?? null}
            onClose={() => setJoinOpen(false)}
            onJoined={() => {
              setJoinOpen(false)
              router.refresh()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============ Header card for the selected community ============ */

function CommunityHeaderCard({
  entry,
  role,
  onChanged,
}: {
  entry: CommunityDirectoryEntry
  role: string | null
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const isFollowing = entry.relation === 'following'
  const isMemberOrStaff = entry.relation === 'member' || entry.relation === 'staff'

  function toggleFollow() {
    startTransition(async () => {
      if (isFollowing) await unfollowCommunity(entry.key)
      else await followCommunity(entry.key)
      onChanged()
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-background border border-border rounded-[2px] overflow-hidden"
    >
      <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background relative">
        <div className="absolute inset-0 grid-pattern opacity-50" />
      </div>

      <div className="px-4 sm:px-6 pb-5 -mt-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2px] bg-background border-2 border-primary flex items-center justify-center">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-mono text-lg sm:text-xl text-foreground">{entry.label}</h2>
              {entry.relation === 'member' && (
                <span className="mono-xs text-[9px] px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded-[2px]">
                  MEMBER
                </span>
              )}
              {entry.relation === 'staff' && (
                <span className="mono-xs text-[9px] px-2 py-0.5 bg-orange/10 border border-orange/30 text-orange rounded-[2px]">
                  {role === 'admin' ? 'ADMIN' : role === 'lgpa' ? 'LGPA' : 'GCM'}
                </span>
              )}
              {isFollowing && (
                <span className="mono-xs text-[9px] px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded-[2px] inline-flex items-center gap-1">
                  <Rss className="w-2.5 h-2.5" />
                  FOLLOWING
                </span>
              )}
              {entry.relation === 'none' && (
                <span className="mono-xs text-[9px] px-2 py-0.5 bg-secondary border border-border text-muted-foreground rounded-[2px] inline-flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5" />
                  PREVIEW
                </span>
              )}
            </div>
            <p className="mono-xs text-[10px] text-muted-foreground mt-1">{entry.hint}</p>
          </div>

          <div className="flex items-end gap-4 sm:gap-6">
            <div className="text-center">
              <p className="font-mono text-lg sm:text-xl text-foreground">{entry.memberCount}</p>
              <p className="mono-xs text-[9px] text-muted-foreground">MEMBERS</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg sm:text-xl text-foreground">{entry.followerCount}</p>
              <p className="mono-xs text-[9px] text-muted-foreground">FOLLOWERS</p>
            </div>
            {!isMemberOrStaff && (
              <button
                onClick={toggleFollow}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2 mono-xs text-[10px] rounded-[2px] transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? 'border border-primary/40 text-primary hover:bg-primary/5'
                    : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rss className="w-3.5 h-3.5" />}
                {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ============ Directory card (preview tier) ============ */

function DirectoryCard({
  entry,
  isSelected,
  onSelect,
  onChanged,
}: {
  entry: CommunityDirectoryEntry
  isSelected: boolean
  onSelect: () => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const isFollowing = entry.relation === 'following'
  const isMemberOrStaff = entry.relation === 'member' || entry.relation === 'staff'

  function toggleFollow(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      if (isFollowing) await unfollowCommunity(entry.key)
      else await followCommunity(entry.key)
      onChanged()
    })
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-2 p-3 text-left bg-background border rounded-[2px] transition-colors ${
        isSelected ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <Sprout className={`w-3.5 h-3.5 shrink-0 ${isSelected || isMemberOrStaff ? 'text-primary' : 'text-muted-foreground/60'}`} />
          <span className="mono-xs text-[10px] tracking-wider truncate text-foreground/90">{entry.label}</span>
        </div>
        {isMemberOrStaff ? (
          <span className="mono-xs text-[8px] px-1.5 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded-[2px] shrink-0">
            {entry.relation === 'member' ? 'MEMBER' : 'STAFF'}
          </span>
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={toggleFollow}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleFollow(e as unknown as React.MouseEvent)
            }}
            className={`mono-xs text-[8px] px-1.5 py-0.5 rounded-[2px] shrink-0 cursor-pointer transition-colors inline-flex items-center gap-1 ${
              isFollowing
                ? 'bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20'
                : 'bg-secondary border border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
            } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Rss className="w-2.5 h-2.5" />}
            {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 w-full">
        <span className="mono-xs text-[9px] text-muted-foreground">{entry.memberCount} MEMBERS</span>
        <span className="mono-xs text-[9px] text-muted-foreground">{entry.followerCount} FOLLOWERS</span>
      </div>

      {entry.latestBroadcastTitle && (
        <div className="flex items-center gap-1.5 w-full min-w-0">
          <Megaphone className="w-3 h-3 text-primary/60 shrink-0" />
          <span className="mono-xs text-[9px] text-muted-foreground/80 truncate">{entry.latestBroadcastTitle}</span>
        </div>
      )}
    </button>
  )
}

/* ============ Locked preview panel ============ */

function PreviewLockedPanel({
  entry,
  onChanged,
}: {
  entry: CommunityDirectoryEntry
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="bg-background border border-border rounded-[2px] p-8 text-center">
      <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-mono text-lg text-foreground mb-2">Preview Mode</h3>
      <p className="mono-xs text-[11px] text-muted-foreground mb-1 text-balance">
        Follow {entry.label} to unlock its live feed, services, events, and member updates.
      </p>
      <p className="mono-xs text-[9px] text-muted-foreground/60 mb-5">
        {entry.memberCount} MEMBERS • {entry.followerCount} FOLLOWERS
      </p>
      <button
        onClick={() =>
          startTransition(async () => {
            await followCommunity(entry.key)
            onChanged()
          })
        }
        disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-background mono-sm text-xs rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rss className="w-4 h-4" />}
        FOLLOW COMMUNITY
      </button>
    </div>
  )
}

/* ============ Real community feed ============ */

function CommunityFeed({
  community,
  canPost,
  relation,
  onPosted,
}: {
  community: AgroCommunityKey
  canPost: boolean
  relation: ViewerRelation
  onPosted: () => void
}) {
  const [items, setItems] = useState<CommunityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [postError, setPostError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadFeed = useCallback(() => {
    setLoading(true)
    getCommunityFeed(community)
      .then(({ items }) => setItems(items))
      .finally(() => setLoading(false))
  }, [community])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  function handlePost() {
    const trimmed = content.trim()
    if (!trimmed) return
    setPostError(null)
    startTransition(async () => {
      const result = await createCommunityPost({ community, content: trimmed })
      if (result.error) {
        setPostError(result.error)
      } else {
        setContent('')
        loadFeed()
        onPosted()
      }
    })
  }

  return (
    <div className="space-y-3">
      {canPost ? (
        <div className="bg-background border border-border rounded-[2px] p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share an update with your community..."
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 min-h-[60px]"
              />
              {postError && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-destructive/10 border border-destructive/30 rounded-[2px]">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  <span className="mono-xs text-[10px] text-destructive">{postError}</span>
                </div>
              )}
              <div className="flex items-center justify-end pt-3 border-t border-border">
                <button
                  onClick={handlePost}
                  disabled={isPending || !content.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-background mono-xs text-[10px] rounded-[2px] disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  POST
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        relation === 'following' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border rounded-[2px]">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="mono-xs text-[9px] text-muted-foreground tracking-wider">
              READ-ONLY — YOU FOLLOW THIS COMMUNITY
            </span>
          </div>
        )
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : items.length > 0 ? (
        items.map((item) => <FeedItemCard key={`${item.kind}-${item.id}`} item={item} />)
      ) : (
        <div className="bg-background border border-border rounded-[2px] p-6 text-center">
          <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-mono text-lg text-foreground mb-2">No Updates Yet</h3>
          <p className="mono-xs text-[11px] text-muted-foreground">
            Posts and broadcasts from this community will appear here.
          </p>
        </div>
      )}
    </div>
  )
}

function FeedItemCard({ item }: { item: CommunityFeedItem }) {
  const isBroadcast = item.kind === 'broadcast'
  return (
    <div className={`bg-background border rounded-[2px] p-4 ${item.isPinned || isBroadcast ? 'border-primary/30' : 'border-border'}`}>
      {item.isPinned && (
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="mono-xs text-[9px] text-primary">PINNED</span>
        </div>
      )}
      <div className="flex gap-3">
        <div className={`w-9 h-9 rounded-[2px] flex items-center justify-center flex-shrink-0 ${
          isBroadcast ? 'bg-primary/10 border border-primary/30' : 'bg-secondary border border-border'
        }`}>
          {isBroadcast
            ? <Megaphone className="w-4 h-4 text-primary" />
            : <Sparkles className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mono-sm text-xs text-foreground">{item.authorName ?? 'Member'}</span>
            <span className={`mono-xs text-[8px] px-1.5 py-0.5 rounded-[2px] ${
              isBroadcast ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
            }`}>
              {isBroadcast ? 'BROADCAST' : 'POST'}
            </span>
            <span className="mono-xs text-[9px] text-muted-foreground/60">• {timeAgo(item.createdAt)}</span>
          </div>
          {item.title && <p className="mt-2 mono-sm text-xs text-foreground">{item.title}</p>}
          <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{item.content}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Like">
              <Heart className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Comment">
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors" aria-label="More options">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ Followed updates sidebar panel ============ */

function FollowedUpdatesPanel({ updates, expanded = false }: { updates: FollowedUpdate[]; expanded?: boolean }) {
  if (updates.length === 0) return null

  return (
    <div className="bg-background border border-border rounded-[2px] overflow-hidden">
      <div className="border-b border-border px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="w-3 h-3 text-primary" />
          <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ FOLLOWING — UPDATES</span>
        </div>
        <span className="mono-xs text-[9px] text-primary">{updates.length}</span>
      </div>
      <div className="divide-y divide-border">
        {updates.slice(0, expanded ? updates.length : 6).map((u) => {
          const meta = UPDATE_KIND_META[u.kind]
          return (
            <Link
              key={`${u.kind}-${u.id}`}
              href={u.href}
              className="flex items-start gap-3 p-3 hover:bg-secondary/30 transition-colors"
            >
              <span className="mt-0.5 w-6 h-6 rounded-[2px] bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="mono-xs text-[8px] px-1.5 py-0.5 bg-secondary border border-border text-muted-foreground rounded-[2px]">
                    {meta.label}
                  </span>
                  <span className="mono-xs text-[8px] text-primary/80 tracking-wider uppercase">
                    {u.community.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mono-xs text-[10px] text-foreground mt-1 truncate">{u.title}</p>
                <p className="mono-xs text-[9px] text-muted-foreground/60 mt-0.5">{timeAgo(u.createdAt)}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ============ Join modal (exec-and-above only) ============ */

function JoinCommunityModal({
  communities,
  currentKey,
  onClose,
  onJoined,
}: {
  communities: Community[]
  currentKey: AgroCommunityKey | null
  onClose: () => void
  onJoined: () => void
}) {
  const [selected, setSelected] = useState<AgroCommunityKey | null>(currentKey)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleJoin() {
    if (!selected) {
      setError('Select a community to continue')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await joinCommunity(selected)
      if (result.error) {
        setError(result.error)
      } else {
        onJoined()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-[2px] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="flex items-center gap-2 mono-sm text-sm text-foreground">
            <PlusCircle className="w-4 h-4 text-primary" />
            Join a Community
          </span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-[2px]">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="mono-xs text-xs text-destructive">{error}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Pick the value chain you operate in. This becomes your primary community and unlocks its
            feed, services, and marketplace.
          </p>

          <div className="grid grid-cols-2 gap-1.5 max-h-[42vh] overflow-y-auto pr-0.5">
            {communities.map((c) => {
              const active = selected === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelected(c.key)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-[2px] border transition-colors text-left ${
                    active
                      ? 'bg-primary/10 border-primary/60'
                      : 'bg-secondary/50 border-border hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sprout
                      className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground/60'}`}
                    />
                    <span className="mono-xs text-[10px] tracking-wider truncate text-foreground/85">
                      {c.label}
                    </span>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground mono-xs text-[10px] rounded-[2px] hover:bg-secondary transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleJoin}
            disabled={isPending || !selected}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            JOIN COMMUNITY
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function DashboardServiceCard({ service, isOwnCommunity }: { service: CommunityService; isOwnCommunity?: boolean }) {
  return (
    <div className="bg-background border border-primary/30 rounded-[2px] p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="mono-xs text-[9px] text-primary">COMMUNITY SERVICE</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="mono text-foreground">{service.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-accent fill-accent" />
              <span className="mono-xs text-[10px] text-foreground/80">{service.rating.toFixed(1)}</span>
              <span className="mono-xs text-[9px] text-muted-foreground">({service.reviews_count})</span>
            </div>
            {service.turnaround_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="mono-xs text-[9px] text-muted-foreground">{service.turnaround_time}</span>
              </div>
            )}
            <span className="mono-xs text-[9px] text-muted-foreground">
              {service.completed_count} completed
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="mono text-sm text-primary">{service.price.toLocaleString()} V1N3</p>
          <p className="mono-xs text-[9px] text-muted-foreground">{service.price_unit}</p>
          {isOwnCommunity ? (
            <span className="inline-block mt-2 mono-xs text-[9px] text-muted-foreground px-3 py-1.5 border border-border rounded-[2px]">
              YOUR COMMUNITY
            </span>
          ) : (
            <Link
              href={`/dashboard/requests?service=${service.id}`}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary text-background mono-xs text-[9px] rounded-[2px]"
            >
              REQUEST <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: typeof COMMUNITY_EVENTS[0] }) {
  return (
    <div className="bg-background border border-border rounded-[2px] p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="mono-sm text-xs text-foreground">{event.title}</h3>
            <span className={`mono-xs text-[8px] px-1.5 py-0.5 rounded-[2px] ${
              event.type === 'VIRTUAL' ? 'bg-primary/10 text-primary' :
              event.type === 'IN-PERSON' ? 'bg-orange/10 text-orange' :
              'bg-accent/10 text-accent'
            }`}>
              {event.type}
            </span>
          </div>
          <p className="mono-xs text-[10px] text-muted-foreground mt-1">{event.date}</p>
        </div>
        <button className="px-3 py-1.5 border border-primary/30 text-primary mono-xs text-[10px] rounded-[2px] hover:bg-primary/5 transition-colors">
          RSVP
        </button>
      </div>
    </div>
  )
}
