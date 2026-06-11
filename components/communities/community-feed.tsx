'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  TrendingUp, Clock, Filter, ArrowRight, Lock, Loader2, Megaphone
} from 'lucide-react'
import type { CommunityData } from './communities-hub'
import { getPublicCommunityFeed, type CommunityFeedItem } from '@/lib/communities/follow-actions'
import type { AgroCommunityKey } from '@/components/onboarding/data'

interface CommunityFeedProps {
  community: CommunityData
  isAuthenticated: boolean
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function CommunityFeed({ community, isAuthenticated }: CommunityFeedProps) {
  const [filter, setFilter] = useState<'trending' | 'recent'>('recent')
  const [items, setItems] = useState<CommunityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const accentBg = community.color === 'orange' ? 'bg-orange' : 'bg-primary'

  useEffect(() => {
    let active = true
    setLoading(true)
    getPublicCommunityFeed(community.key as AgroCommunityKey)
      .then(({ items }) => {
        if (active) setItems(items)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [community.key])

  const filters = [
    { id: 'trending' as const, label: 'TRENDING', icon: TrendingUp },
    { id: 'recent' as const, label: 'RECENT', icon: Clock },
  ]

  // "Trending" pins broadcasts + pinned posts first; "recent" is pure chronological.
  const ordered =
    filter === 'recent'
      ? items
      : [...items].sort((a, b) => {
          const aw = a.kind === 'broadcast' || a.isPinned ? 1 : 0
          const bw = b.kind === 'broadcast' || b.isPinned ? 1 : 0
          if (aw !== bw) return bw - aw
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {filters.map((f) => {
            const Icon = f.icon
            const isActive = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] transition-all ${
                  isActive
                    ? `${accentBg} text-background`
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="mono-xs text-[9px]">{f.label}</span>
              </button>
            )
          })}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground transition-all">
          <Filter className="w-3 h-3" />
          <span className="mono-xs text-[9px]">FILTER</span>
        </button>
      </div>

      {/* Auth Gate for Creating Posts */}
      {!isAuthenticated && (
        <div className="border border-border rounded-[2px] p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="mono-sm text-foreground/80">Connect to participate in the feed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Share updates, engage with the community, and grow together.</p>
            </div>
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-[2px] ${accentBg} text-background mono-xs text-[10px]`}
            >
              CONNECT <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : ordered.length > 0 ? (
        <div className="space-y-3">
          {ordered.map((post, index) => (
            <FeedPost 
              key={`${post.kind}-${post.id}`} 
              post={post} 
              index={index}
              isAuthenticated={isAuthenticated}
              accentColor={community.color}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-[2px] bg-card/50 p-10 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="mono-sm text-foreground/80">No posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Be the first to share an update in {community.name}.
          </p>
        </div>
      )}
    </div>
  )
}

function FeedPost({ 
  post, 
  index,
  isAuthenticated,
  accentColor
}: { 
  post: CommunityFeedItem
  index: number
  isAuthenticated: boolean
  accentColor: 'green' | 'orange'
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const isBroadcast = post.kind === 'broadcast'
  const authorName = post.authorName ?? 'Member'
  const initials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.3) }}
      className={`border rounded-[2px] bg-card/50 overflow-hidden ${
        post.isPinned || isBroadcast ? 'border-primary/30' : 'border-border'
      }`}
    >
      {/* Pinned / Broadcast ribbon */}
      {(post.isPinned || isBroadcast) && (
        <div className="px-4 pt-3 flex items-center gap-1.5">
          {isBroadcast ? (
            <Megaphone className="w-3 h-3 text-primary" />
          ) : (
            <TrendingUp className="w-3 h-3 text-primary" />
          )}
          <span className="mono-xs text-[8px] text-primary tracking-wider">
            {isBroadcast ? 'OFFICIAL BROADCAST' : 'PINNED'}
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isBroadcast ? 'bg-primary/15' : 'bg-muted'
          }`}>
            {isBroadcast ? (
              <Megaphone className="w-4 h-4 text-primary" />
            ) : (
              <span className="mono text-sm text-muted-foreground">{initials}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="mono-sm text-foreground text-xs">{authorName}</span>
              {isBroadcast && (
                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="mono-xs text-[9px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="More options">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.title && (
          <p className="mono-sm text-sm text-foreground mb-1.5">{post.title}</p>
        )}
        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="relative aspect-video bg-muted">
          <Image
            src={post.imageUrl || "/placeholder.svg"}
            alt="Post attachment"
            fill
            className="object-cover"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => isAuthenticated && setLiked(!liked)}
            className={`flex items-center gap-1.5 transition-colors ${
              liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
            } ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
            aria-label="Like"
          >
            <Heart className={`w-4 h-4 ${liked && 'fill-current'}`} />
          </button>
          <button 
            className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${
              !isAuthenticated && 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Comment"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button 
            className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${
              !isAuthenticated && 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => isAuthenticated && setSaved(!saved)}
          className={`transition-colors ${
            saved 
              ? accentColor === 'orange' ? 'text-orange' : 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          } ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
          aria-label="Save"
        >
          <Bookmark className={`w-4 h-4 ${saved && 'fill-current'}`} />
        </button>
      </div>
    </motion.article>
  )
}
