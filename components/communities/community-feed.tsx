'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  TrendingUp, Clock, Filter, ArrowRight, Lock, ImageIcon
} from 'lucide-react'
import type { CommunityData } from './communities-hub'

interface CommunityFeedProps {
  community: CommunityData
  isAuthenticated: boolean
}

// Mock feed data - in production this would come from Supabase
const MOCK_FEED_POSTS = [
  {
    id: '1',
    author: { name: 'Aisha Musa', handle: '@aisha_agro', avatar: null, isVerified: true },
    content: 'Just harvested our first batch of organic tomatoes this season! The drip irrigation system we installed has increased our yield by 40%. V1n3 community support made this possible.',
    image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=600&h=400&fit=crop',
    likes: 234,
    comments: 45,
    shares: 12,
    timestamp: '2h ago',
    tags: ['harvest', 'organic', 'success'],
  },
  {
    id: '2',
    author: { name: 'Ibrahim Danjuma', handle: '@ibrahim_tech', avatar: null, isVerified: false },
    content: 'Attended the GCM training session in Jos yesterday. The insights on modern farming techniques were invaluable. Looking forward to implementing what I learned on my plot.',
    image: null,
    likes: 156,
    comments: 23,
    shares: 8,
    timestamp: '5h ago',
    tags: ['training', 'learning'],
  },
  {
    id: '3',
    author: { name: 'GreenV1n3 Official', handle: '@greenv1n3', avatar: null, isVerified: true },
    content: 'Phase 01 milestone achieved! Plateau State now has over 2,400 registered Agro Executives. Together, we are transforming Nigerian agriculture.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    likes: 892,
    comments: 134,
    shares: 256,
    timestamp: '1d ago',
    tags: ['milestone', 'plateau', 'growth'],
  },
  {
    id: '4',
    author: { name: 'Fatima Yusuf', handle: '@fatima_farms', avatar: null, isVerified: true },
    content: 'My fish pond expansion project is now complete! Thanks to the Agro Logistics community for the efficient delivery of equipment. 500 catfish fingerlings ready for the new season.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
    likes: 445,
    comments: 67,
    shares: 34,
    timestamp: '2d ago',
    tags: ['fishery', 'expansion'],
  },
]

export function CommunityFeed({ community, isAuthenticated }: CommunityFeedProps) {
  const [filter, setFilter] = useState<'trending' | 'recent'>('trending')
  const accentColor = community.color === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = community.color === 'orange' ? 'bg-orange' : 'bg-primary'

  const filters = [
    { id: 'trending' as const, label: 'TRENDING', icon: TrendingUp },
    { id: 'recent' as const, label: 'RECENT', icon: Clock },
  ]

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
      <div className="space-y-3">
        {MOCK_FEED_POSTS.map((post, index) => (
          <FeedPost 
            key={post.id} 
            post={post} 
            index={index}
            isAuthenticated={isAuthenticated}
            accentColor={community.color}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="pt-4 flex justify-center">
        <button className="flex items-center gap-2 px-6 py-2.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all mono-xs text-[10px]">
          LOAD MORE POSTS
        </button>
      </div>
    </div>
  )
}

function FeedPost({ 
  post, 
  index,
  isAuthenticated,
  accentColor
}: { 
  post: typeof MOCK_FEED_POSTS[0]
  index: number
  isAuthenticated: boolean
  accentColor: 'green' | 'orange'
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-border rounded-[2px] bg-card/50 overflow-hidden"
    >
      {/* Post Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="mono text-sm text-muted-foreground">
              {post.author.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="mono-sm text-foreground text-xs">{post.author.name}</span>
              {post.author.isVerified && (
                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="mono-xs text-[9px] text-muted-foreground">{post.author.handle} / {post.timestamp}</span>
          </div>
        </div>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/85 leading-relaxed">{post.content}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map((tag) => (
            <span 
              key={tag}
              className={`px-2 py-0.5 rounded-[2px] mono-xs text-[8px] ${
                accentColor === 'orange'
                  ? 'bg-orange-soft text-orange'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              #{tag.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="relative aspect-video bg-muted">
          <Image
            src={post.image}
            alt="Post image"
            fill
            className="object-cover"
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
          >
            <Heart className={`w-4 h-4 ${liked && 'fill-current'}`} />
            <span className="mono-xs text-[10px]">{liked ? post.likes + 1 : post.likes}</span>
          </button>
          <button 
            className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${
              !isAuthenticated && 'opacity-50 cursor-not-allowed'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="mono-xs text-[10px]">{post.comments}</span>
          </button>
          <button 
            className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ${
              !isAuthenticated && 'opacity-50 cursor-not-allowed'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span className="mono-xs text-[10px]">{post.shares}</span>
          </button>
        </div>
        <button 
          onClick={() => isAuthenticated && setSaved(!saved)}
          className={`transition-colors ${
            saved 
              ? accentColor === 'orange' ? 'text-orange' : 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          } ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
        >
          <Bookmark className={`w-4 h-4 ${saved && 'fill-current'}`} />
        </button>
      </div>
    </motion.article>
  )
}
