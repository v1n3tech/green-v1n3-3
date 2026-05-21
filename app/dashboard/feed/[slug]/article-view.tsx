'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  User,
  Tag,
  ExternalLink,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check,
  Zap,
  Star,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  color: string | null
}

interface Author {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  role: string | null
  photo_url: string | null
}

interface SocialLinks {
  twitter?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  tiktok?: string
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  tags: string[]
  status: string
  is_featured: boolean
  is_breaking: boolean
  views_count: number
  likes_count: number
  comments_count: number
  published_at: string | null
  created_at: string
  social_links: SocialLinks | null
  category: Category | null
  author: Author | null
}

interface RelatedArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  published_at: string | null
  category: { id: string; name: string; color: string | null } | null
}

interface ArticleViewProps {
  article: Article
  relatedArticles: RelatedArticle[]
  currentUserId: string
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatReadTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

function getAuthorName(author: Author | null): string {
  if (!author) return 'Unknown'
  if (author.display_name) return author.display_name
  if (author.first_name || author.last_name) {
    return `${author.first_name || ''} ${author.last_name || ''}`.trim()
  }
  return 'Unknown'
}

export function ArticleView({ article, relatedArticles, currentUserId }: ArticleViewProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article.likes_count)
  const [bookmarked, setBookmarked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleLike = async () => {
    const supabase = createClient()
    
    if (!liked) {
      setLiked(true)
      setLikeCount(prev => prev + 1)
      // Update in database
      await supabase
        .from('news_articles')
        .update({ likes_count: likeCount + 1 })
        .eq('id', article.id)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = article.title

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard/feed"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="mono-xs text-[11px]">BACK TO FEED</span>
      </Link>

      {/* Article Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {article.is_breaking && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive text-destructive-foreground rounded mono-xs text-[9px]">
              <Zap className="w-3 h-3 animate-pulse" />
              BREAKING
            </span>
          )}
          {article.is_featured && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange/20 text-orange rounded mono-xs text-[9px]">
              <Star className="w-3 h-3" />
              FEATURED
            </span>
          )}
          {article.category && (
            <span
              className="px-2.5 py-1 rounded mono-xs text-[9px]"
              style={{
                backgroundColor: article.category.color ? `${article.category.color}20` : 'hsl(var(--secondary))',
                color: article.category.color || 'hsl(var(--muted-foreground))',
              }}
            >
              {article.category.name.toUpperCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4 text-balance">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-muted-foreground leading-relaxed mb-6">
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              {article.author?.photo_url ? (
                <Image
                  src={article.author.photo_url}
                  alt={getAuthorName(article.author)}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {getAuthorName(article.author)}
                </p>
                <p className="mono-xs text-[10px] text-muted-foreground capitalize">
                  {article.author?.role?.replace(/_/g, ' ') || 'Contributor'}
                </p>
              </div>
            </div>

            {/* Date & Read Time */}
            <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5 mono-xs text-[10px]">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.published_at || article.created_at)}
              </span>
              <span className="flex items-center gap-1.5 mono-xs text-[10px]">
                <Clock className="w-3.5 h-3.5" />
                {formatReadTime(article.content)}
              </span>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 mono-xs text-[10px] text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />
              {article.views_count + 1}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 mono-xs text-[10px] px-2 py-1 rounded transition-colors ${
                liked ? 'text-pink-500 bg-pink-500/10' : 'text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              {likeCount}
            </button>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-1.5 rounded transition-colors ${
                bookmarked ? 'text-orange bg-orange/10' : 'text-muted-foreground hover:text-orange hover:bg-orange/10'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 p-2 bg-popover border border-border rounded shadow-xl z-50 min-w-[160px]">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors w-full"
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Image */}
      {article.featured_image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full aspect-video rounded-[4px] overflow-hidden mb-8"
        >
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      )}

      {/* Article Content */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="prose prose-invert prose-lg max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-8 pb-8 border-b border-border">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-secondary text-muted-foreground rounded mono-xs text-[10px] hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      {article.social_links && Object.values(article.social_links).some(v => v) && (
        <div className="p-4 bg-secondary/30 border border-border rounded mb-8">
          <h3 className="mono-xs text-[11px] text-muted-foreground mb-3">RELATED LINKS</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {article.social_links.twitter && (
              <a
                href={article.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded text-[12px] hover:bg-[#1DA1F2]/20 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Twitter
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {article.social_links.facebook && (
              <a
                href={article.social_links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-[#4267B2]/10 text-[#4267B2] rounded text-[12px] hover:bg-[#4267B2]/20 transition-colors"
              >
                <Facebook className="w-4 h-4" />
                Facebook
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {article.social_links.linkedin && (
              <a
                href={article.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0077B5]/10 text-[#0077B5] rounded text-[12px] hover:bg-[#0077B5]/20 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="mono text-lg text-foreground">Related Articles</h2>
            <Link
              href="/dashboard/feed"
              className="flex items-center gap-1 mono-xs text-[10px] text-primary hover:text-primary/80 transition-colors"
            >
              VIEW ALL
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((related) => (
              <Link key={related.id} href={`/dashboard/feed/${related.slug}`}>
                <div className="group p-4 border border-border rounded bg-card hover:bg-card/80 hover:border-primary/30 transition-all h-full">
                  {related.featured_image && (
                    <div className="relative w-full aspect-video rounded overflow-hidden mb-3">
                      <Image
                        src={related.featured_image}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {related.category && (
                    <span
                      className="inline-block px-1.5 py-0.5 rounded mono-xs text-[8px] mb-2"
                      style={{
                        backgroundColor: related.category.color ? `${related.category.color}20` : 'hsl(var(--secondary))',
                        color: related.category.color || 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {related.category.name.toUpperCase()}
                    </span>
                  )}
                  <h3 className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
