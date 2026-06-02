'use client'

import { useState, useEffect, useTransition } from 'react'
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
  Shield,
  Crown,
  Sparkles,
  Radio,
  FileText,
  HelpCircle,
  PlusCircle,
  Heart,
  Share2,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Zap,
  Loader2,
  X,
  Check,
  Sprout,
  AlertCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { AgroCommunityKey } from '@/components/onboarding/data'
import { fetchServices, type CommunityService } from '@/lib/services/actions'
import { joinCommunity } from '@/lib/communities/actions'

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
}

// Mock data for community feed
const COMMUNITY_POSTS = [
  {
    id: '1',
    author: 'Ibrahim Musa',
    agroId: 'AE-PLT-0234',
    avatar: null,
    role: 'GCM',
    content: 'Just completed the harvest training module. The new techniques for soil preparation are game-changing for our maize yields.',
    timestamp: '2h ago',
    likes: 24,
    comments: 8,
    shares: 3,
  },
  {
    id: '2',
    author: 'Amina Danjuma',
    agroId: 'AE-PLT-0089',
    avatar: null,
    role: 'EXECUTIVE',
    content: 'Looking for partners in Jos South for a joint cassava processing venture. DM if interested.',
    timestamp: '5h ago',
    likes: 45,
    comments: 12,
    shares: 7,
  },
  {
    id: '3',
    author: 'GreenV1n3 Admin',
    agroId: 'SYSTEM',
    avatar: null,
    role: 'ADMIN',
    content: 'Phase 01 milestone achieved: 2,500 Agro Executives registered across all 17 LGAs. Thank you for being part of this journey.',
    timestamp: '1d ago',
    likes: 156,
    comments: 34,
    shares: 28,
    pinned: true,
  },
]

const COMMUNITY_EVENTS = [
  {
    id: '1',
    title: 'Weekly Community Call',
    date: 'Today, 4:00 PM',
    type: 'VIRTUAL',
  },
  {
    id: '2',
    title: 'Field Training Session',
    date: 'Tomorrow, 9:00 AM',
    type: 'IN-PERSON',
  },
  {
    id: '3',
    title: 'Investor Pitch Day',
    date: 'Sat, May 10',
    type: 'HYBRID',
  },
]

const LEADERBOARD = [
  { rank: 1, name: 'Yakubu Bello', points: 2450, badge: 'GOLD' },
  { rank: 2, name: 'Grace Emmanuel', points: 2320, badge: 'GOLD' },
  { rank: 3, name: 'David Pam', points: 2180, badge: 'SILVER' },
  { rank: 4, name: 'Fatima Hassan', points: 1950, badge: 'SILVER' },
  { rank: 5, name: 'John Dung', points: 1820, badge: 'BRONZE' },
]

type TabKey = 'feed' | 'services' | 'events' | 'members' | 'resources'

export function DashboardCommunities({
  userCommunity,
  allCommunities,
  role,
  displayName,
  agroId,
}: DashboardCommunitiesProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('feed')
  const [services, setServices] = useState<CommunityService[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  // Fetch services when switching to services tab
  useEffect(() => {
    if (activeTab === 'services' && userCommunity) {
      setServicesLoading(true)
      fetchServices({ community: userCommunity.key as any, limit: 20 })
        .then(({ services }) => setServices(services))
        .finally(() => setServicesLoading(false))
    }
  }, [activeTab, userCommunity])

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
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Community Header Card */}
      {userCommunity ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-background border border-border rounded-[2px] overflow-hidden"
        >
          {/* Banner */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background relative">
            <div className="absolute inset-0 grid-pattern opacity-50" />
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 pb-5 -mt-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Community Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2px] bg-background border-2 border-primary flex items-center justify-center">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-mono text-lg sm:text-xl text-foreground">{userCommunity.label}</h2>
                  <span className="mono-xs text-[9px] px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded-[2px]">
                    MEMBER
                  </span>
                  {role === 'lgpa' && (
                    <span className="mono-xs text-[9px] px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent rounded-[2px]">
                      LGPA
                    </span>
                  )}
                  {role === 'gcm' && (
                    <span className="mono-xs text-[9px] px-2 py-0.5 bg-orange/10 border border-orange/30 text-orange rounded-[2px]">
                      GCM
                    </span>
                  )}
                </div>
                <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                  {userCommunity.hint} • C-{String(allCommunities.findIndex(c => c.key === userCommunity.key) + 1).padStart(2, '0')}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="font-mono text-lg sm:text-xl text-foreground">890</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">MEMBERS</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-lg sm:text-xl text-foreground">9</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">GCMS</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-lg sm:text-xl text-primary">B+</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">RATING</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background border border-border rounded-[2px] p-6 text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-mono text-lg text-foreground mb-2">No Community Selected</h2>
          <p className="mono-xs text-[11px] text-muted-foreground mb-4">
            Join a community to access exclusive features and connect with other Agro Executives.
          </p>
          <button
            onClick={() => setJoinOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background mono-sm text-xs rounded-[2px] hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            JOIN COMMUNITY
          </button>
        </motion.div>
      )}

      {/* Tabs */}
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

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {/* Create Post */}
                <div className="bg-background border border-border rounded-[2px] p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder="Share an update with your community..."
                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 min-h-[60px]"
                      />
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex gap-2">
                          <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                            <Image src="/icons/image.svg" alt="Image" width={16} height={16} className="opacity-50" />
                          </button>
                        </div>
                        <button className="px-4 py-1.5 bg-primary text-background mono-xs text-[10px] rounded-[2px]">
                          POST
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts */}
                {COMMUNITY_POSTS.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
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
                      <DashboardServiceCard key={service.id} service={service} isOwnCommunity />
                    ))}
                  </div>
                ) : (
                  <div className="bg-background border border-border rounded-[2px] p-6 text-center">
                    <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-mono text-lg text-foreground mb-2">No Services Yet</h3>
                    <p className="mono-xs text-[11px] text-muted-foreground mb-4">
                      Your community hasn&apos;t listed any services yet. Check back later or browse other communities.
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
                key="events"
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
                key="members"
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
                key="resources"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
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

      <AnimatePresence>
        {joinOpen && (
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
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
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

function PostCard({ post }: { post: typeof COMMUNITY_POSTS[0] }) {
  return (
    <div className={`bg-background border rounded-[2px] p-4 ${post.pinned ? 'border-primary/30' : 'border-border'}`}>
      {post.pinned && (
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="mono-xs text-[9px] text-primary">PINNED</span>
        </div>
      )}
      <div className="flex gap-3">
        <div className={`w-9 h-9 rounded-[2px] flex items-center justify-center flex-shrink-0 ${
          post.role === 'ADMIN' ? 'bg-primary/10 border border-primary/30' :
          post.role === 'GCM' ? 'bg-orange/10 border border-orange/30' :
          'bg-secondary border border-border'
        }`}>
          <Sparkles className={`w-4 h-4 ${
            post.role === 'ADMIN' ? 'text-primary' :
            post.role === 'GCM' ? 'text-orange' :
            'text-muted-foreground'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mono-sm text-xs text-foreground">{post.author}</span>
            <span className="mono-xs text-[9px] text-muted-foreground">{post.agroId}</span>
            {post.role !== 'EXECUTIVE' && (
              <span className={`mono-xs text-[8px] px-1.5 py-0.5 rounded-[2px] ${
                post.role === 'ADMIN' ? 'bg-primary/10 text-primary' :
                'bg-orange/10 text-orange'
              }`}>
                {post.role}
              </span>
            )}
            <span className="mono-xs text-[9px] text-muted-foreground/60">• {post.timestamp}</span>
          </div>
          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Heart className="w-3.5 h-3.5" />
              <span className="mono-xs text-[10px]">{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="mono-xs text-[10px]">{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              <span className="mono-xs text-[10px]">{post.shares}</span>
            </button>
            <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
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
