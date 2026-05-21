'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Search,
  Filter,
  X,
  ChevronRight,
  Zap,
  Star,
  ArrowRight,
  User,
  Calendar,
  Tag,
  ExternalLink,
  Loader2,
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
  category: Category | null
  author: Author | null
}

interface FeedClientProps {
  profile: {
    id: string
    role: string | null
    community: string | null
    displayName: string
  }
  initialArticles: Article[]
  categories: Category[]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getAuthorName(author: Author | null): string {
  if (!author) return 'Unknown'
  if (author.display_name) return author.display_name
  if (author.first_name || author.last_name) {
    return `${author.first_name || ''} ${author.last_name || ''}`.trim()
  }
  return 'Unknown'
}

// Breaking News Banner
function BreakingNewsBanner({ articles }: { articles: Article[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (articles.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [articles.length])

  if (articles.length === 0) return null

  const article = articles[currentIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent border border-destructive/30 rounded-[2px] p-4 mb-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-destructive rounded shrink-0">
          <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
          <span className="mono-xs text-[10px] text-white font-medium tracking-wider">BREAKING</span>
        </div>
        <div className="flex-1 min-w-0">
          <Link 
            href={`/dashboard/feed/${article.slug}`}
            className="text-[13px] text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {article.title}
          </Link>
        </div>
        <span className="mono-xs text-[9px] text-muted-foreground shrink-0">
          {formatRelativeTime(article.published_at || article.created_at)}
        </span>
      </div>
    </motion.div>
  )
}

// Featured Article Card
function FeaturedCard({ article }: { article: Article }) {
  return (
    <Link href={`/dashboard/feed/${article.slug}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        className="relative group overflow-hidden rounded-[4px] border border-border bg-card h-[320px]"
      >
        {/* Background Image */}
        {article.featured_image ? (
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Category & Featured Badge */}
          <div className="flex items-center gap-2 mb-3">
            {article.category && (
              <span 
                className="px-2 py-0.5 rounded mono-xs text-[9px] font-medium"
                style={{ 
                  backgroundColor: article.category.color ? `${article.category.color}20` : 'hsl(var(--primary) / 0.1)',
                  color: article.category.color || 'hsl(var(--primary))'
                }}
              >
                {article.category.name.toUpperCase()}
              </span>
            )}
            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange/20 text-orange rounded mono-xs text-[9px]">
              <Star className="w-3 h-3" />
              FEATURED
            </span>
          </div>
          
          {/* Title */}
          <h2 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          
          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          )}
          
          {/* Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="mono-xs text-[10px] text-muted-foreground">
                {getAuthorName(article.author)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground/60">
              <span className="flex items-center gap-1 mono-xs text-[9px]">
                <Eye className="w-3 h-3" />
                {article.views_count}
              </span>
              <span className="flex items-center gap-1 mono-xs text-[9px]">
                <Heart className="w-3 h-3" />
                {article.likes_count}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// Regular Article Card
function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/dashboard/feed/${article.slug}`}>
        <div className="group flex gap-4 p-4 border border-border rounded-[2px] bg-card hover:bg-card/80 hover:border-primary/30 transition-all">
          {/* Thumbnail */}
          <div className="relative w-24 h-24 md:w-32 md:h-24 shrink-0 rounded overflow-hidden bg-secondary">
            {article.featured_image ? (
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Newspaper className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {article.category && (
                  <span 
                    className="px-1.5 py-0.5 rounded mono-xs text-[8px]"
                    style={{ 
                      backgroundColor: article.category.color ? `${article.category.color}20` : 'hsl(var(--secondary))',
                      color: article.category.color || 'hsl(var(--muted-foreground))'
                    }}
                  >
                    {article.category.name.toUpperCase()}
                  </span>
                )}
                <span className="mono-xs text-[9px] text-muted-foreground/60">
                  {formatRelativeTime(article.published_at || article.created_at)}
                </span>
              </div>
              <h3 className="text-[13px] font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
            </div>
            
            {/* Bottom */}
            <div className="flex items-center justify-between mt-2">
              <span className="mono-xs text-[10px] text-muted-foreground">
                by {getAuthorName(article.author)}
              </span>
              <div className="flex items-center gap-3 text-muted-foreground/50">
                <span className="flex items-center gap-1 mono-xs text-[9px]">
                  <Eye className="w-3 h-3" />
                  {article.views_count}
                </span>
                <span className="flex items-center gap-1 mono-xs text-[9px]">
                  <MessageSquare className="w-3 h-3" />
                  {article.comments_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function FeedClient({ profile, initialArticles, categories }: FeedClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(initialArticles)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)

  // Separate breaking, featured, and regular articles
  const breakingArticles = articles.filter(a => a.is_breaking)
  const featuredArticles = articles.filter(a => a.is_featured && !a.is_breaking)
  const regularArticles = filteredArticles.filter(a => !a.is_breaking && !a.is_featured)

  // Filter articles
  useEffect(() => {
    let filtered = articles

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt?.toLowerCase().includes(query) ||
          a.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(a => a.category?.id === selectedCategory)
    }

    setFilteredArticles(filtered)
  }, [articles, searchQuery, selectedCategory])

  // Real-time subscription for new articles
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('feed-articles')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
          filter: 'status=eq.published',
        },
        async (payload) => {
          // Fetch full article data with relations
          const { data } = await supabase
            .from('news_articles')
            .select(`
              id, title, slug, excerpt, content, featured_image, tags, status,
              is_featured, is_breaking, views_count, likes_count, comments_count,
              published_at, created_at,
              category:news_categories(id, name, slug, type, color),
              author:profiles!news_articles_author_id_fkey(id, display_name, first_name, last_name, role)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setArticles(prev => [data as unknown as Article, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full" />
          <div>
            <h1 className="mono text-lg text-foreground">News Feed</h1>
            <p className="mono-xs text-muted-foreground text-[10px]">LATEST UPDATES FROM THE COMMUNITY</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-9 pr-4 py-2 w-64 bg-secondary/50 border border-border rounded text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded transition-colors ${
              showFilters || selectedCategory
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 p-4 bg-secondary/30 border border-border rounded">
              <span className="mono-xs text-[10px] text-muted-foreground mr-2">CATEGORIES:</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded text-[11px] transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded text-[11px] transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breaking News */}
      {breakingArticles.length > 0 && (
        <BreakingNewsBanner articles={breakingArticles} />
      )}

      {/* Featured Articles */}
      {featuredArticles.length > 0 && !searchQuery && !selectedCategory && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-orange" />
            <span className="mono-xs text-[11px] text-foreground">FEATURED STORIES</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredArticles.slice(0, 2).map((article) => (
              <FeaturedCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="mono-xs text-[11px] text-foreground">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name.toUpperCase() 
                : 'LATEST ARTICLES'}
            </span>
          </div>
          <span className="mono-xs text-[10px] text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </span>
        </div>

        {regularArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm text-foreground mb-1">No articles found</h3>
            <p className="text-[12px] text-muted-foreground">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Check back later for new content'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {regularArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
