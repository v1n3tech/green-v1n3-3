'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Leaf,
  Sparkles,
  ChevronRight,
  Search,
  RefreshCw,
  Bookmark,
  Eye,
  MessageSquare,
  Heart,
  FileText,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { createClient } from '@/lib/supabase/client'

// Types for database
interface NewsCategory {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  color: string | null
  is_active: boolean
}

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  thumbnail: string | null
  category_id: string | null
  tags: string[]
  author_id: string
  status: 'draft' | 'pending_review' | 'published' | 'archived'
  is_featured: boolean
  is_breaking: boolean
  is_pinned: boolean
  views_count: number
  likes_count: number
  comments_count: number
  bookmarks_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  category?: NewsCategory | null
  author?: {
    id: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

interface Commodity {
  id: string
  name: string
  slug: string
  symbol: string | null
  type: string
  unit: string
  current_price: number | null
  previous_price: number | null
  price_change_24h: number | null
  is_active: boolean
}

// Mock crypto prices (until real implementation)
const CRYPTO_PRICES = [
  { symbol: 'V1N3', name: 'V1n3 Token', price: 3002.40, change: 2.4, icon: '🌿' },
  { symbol: 'BTC', name: 'Bitcoin', price: 97842.50, change: 1.2, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -0.8, icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', price: 187.32, change: 3.5, icon: '◎' },
  { symbol: 'AGRI', name: 'AgriCoin', price: 12.45, change: 5.2, icon: '🌾' },
]

// Mock trending topics
const TRENDING = [
  { tag: '#V1N3Farming', posts: '2.4K' },
  { tag: '#PlateauAgro', posts: '1.8K' },
  { tag: '#CryptoFarm', posts: '1.2K' },
  { tag: '#AgroExecutive', posts: '980' },
  { tag: '#FarmToTable', posts: '756' },
]

type FilterType = 'all' | 'agriculture' | 'crypto' | 'market'

export default function NewsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [time, setTime] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<NewsArticle[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set())
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())

  const supabase = createClient()

  // Fetch news articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch featured articles
      const { data: featured } = await supabase
        .from('news_articles')
        .select(`
          *,
          category:news_categories(*),
          author:profiles(id, display_name, first_name, last_name, avatar_url)
        `)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(2)

      // Fetch all published articles
      let query = supabase
        .from('news_articles')
        .select(`
          *,
          category:news_categories(*),
          author:profiles(id, display_name, first_name, last_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20)

      const { data: allArticles } = await query

      setFeaturedArticles((featured as NewsArticle[]) || [])
      setArticles((allArticles as NewsArticle[]) || [])
    } catch (error) {
      console.error('[v0] Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('news_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    setCategories((data as NewsCategory[]) || [])
  }, [supabase])

  // Fetch commodities
  const fetchCommodities = useCallback(async () => {
    const { data } = await supabase
      .from('commodities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .limit(8)

    setCommodities((data as Commodity[]) || [])
  }, [supabase])

  // Fetch user bookmarks and likes
  const fetchUserInteractions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: bookmarks }, { data: likes }] = await Promise.all([
      supabase.from('news_bookmarks').select('article_id').eq('user_id', user.id),
      supabase.from('news_likes').select('article_id').eq('user_id', user.id),
    ])

    if (bookmarks) {
      setUserBookmarks(new Set(bookmarks.map(b => b.article_id)))
    }
    if (likes) {
      setUserLikes(new Set(likes.map(l => l.article_id)))
    }
  }, [supabase])

  useEffect(() => {
    fetchArticles()
    fetchCategories()
    fetchCommodities()
    fetchUserInteractions()
  }, [fetchArticles, fetchCategories, fetchCommodities, fetchUserInteractions])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleBookmark = async (articleId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.rpc('toggle_article_bookmark', { p_article_id: articleId })
    
    setUserBookmarks(prev => {
      const next = new Set(prev)
      if (data) {
        next.add(articleId)
      } else {
        next.delete(articleId)
      }
      return next
    })
  }

  const toggleLike = async (articleId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.rpc('toggle_article_like', { p_article_id: articleId })
    
    setUserLikes(prev => {
      const next = new Set(prev)
      if (data) {
        next.add(articleId)
      } else {
        next.delete(articleId)
      }
      return next
    })

    // Refresh to get updated counts
    fetchArticles()
  }

  const getCategoryColor = (category: NewsCategory | null | undefined) => {
    if (!category) return 'text-muted-foreground bg-secondary border-border'
    
    const type = category.type
    switch (type) {
      case 'agriculture':
        return 'text-primary bg-primary/10 border-primary/30'
      case 'crypto':
        return 'text-orange bg-orange/10 border-orange/30'
      case 'market':
        return 'text-accent bg-accent/10 border-accent/30'
      case 'technology':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'policy':
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30'
      case 'community':
        return 'text-pink-400 bg-pink-400/10 border-pink-400/30'
      case 'events':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      default:
        return 'text-muted-foreground bg-secondary border-border'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const getAuthorName = (author: NewsArticle['author']) => {
    if (!author) return 'GreenV1n3'
    if (author.display_name) return author.display_name
    if (author.first_name && author.last_name) return `${author.first_name} ${author.last_name}`
    if (author.first_name) return author.first_name
    return 'GreenV1n3'
  }

  const filteredArticles = articles.filter((article) => {
    // Exclude featured from regular list
    if (featuredArticles.some(f => f.id === article.id)) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = article.title.toLowerCase().includes(query)
      const matchesExcerpt = article.excerpt?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesExcerpt) return false
    }

    // Category filter
    if (filter === 'all') return true
    if (!article.category) return false
    return article.category.type === filter
  })

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Live Ticker */}
      <section className="pt-28 pb-8 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="mono-xs text-muted-foreground hover:text-primary transition-colors">
              HOME
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="mono-xs text-primary">NEWS</span>
          </div>

          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="mono-xs text-primary">LIVE UPDATES</span>
                <span className="mono-xs text-muted-foreground">{time} WAT</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
                Agri & Crypto{' '}
                <span className="text-primary">News</span>
              </h1>
              <p className="mt-3 text-muted-foreground max-w-xl">
                Stay informed with the latest agricultural trends, crypto markets, and economic insights shaping Nigeria&apos;s farming future.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border border-border rounded-[2px] w-full lg:w-72">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
                />
              </div>
              <button 
                onClick={() => fetchArticles()}
                className="p-2.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Live Price Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CRYPTO_PRICES.map((crypto, i) => (
              <motion.div
                key={crypto.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-3 border rounded-[2px] transition-all cursor-pointer ${
                  i === 0
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="mono-xs text-muted-foreground">{crypto.symbol}</span>
                  <span className="text-sm">{crypto.icon}</span>
                </div>
                <p className="mono-sm text-foreground font-medium">
                  {crypto.symbol === 'V1N3' ? 'N' : '$'}
                  {crypto.price.toLocaleString()}
                </p>
                <div className={`flex items-center gap-1 mt-1 ${crypto.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {crypto.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="mono-xs">{crypto.change >= 0 ? '+' : ''}{crypto.change}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commodity Prices Bar */}
      <section className="border-b border-border bg-card/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="mono-xs text-muted-foreground">COMMODITIES</span>
            </div>
            <div className="h-4 w-px bg-border" />
            {commodities.length > 0 ? (
              commodities.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 flex-shrink-0">
                  <span className="mono-xs text-foreground/80">{item.name}</span>
                  <span className="mono-xs text-foreground font-medium">
                    {item.current_price ? `N${item.current_price.toLocaleString()}` : '---'}
                  </span>
                  <span className={`mono-xs ${
                    (item.price_change_24h || 0) >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {item.price_change_24h ? `${item.price_change_24h >= 0 ? '+' : ''}${item.price_change_24h}%` : '---'}
                  </span>
                  <span className="mono-xs text-muted-foreground/50">/{item.unit}</span>
                  {i < commodities.length - 1 && <div className="h-3 w-px bg-border/50" />}
                </div>
              ))
            ) : (
              <span className="mono-xs text-muted-foreground/50">Loading commodities...</span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Articles */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="mono text-lg text-foreground">Featured Stories</h2>
                  </div>
                  <Link href="#" className="mono-xs text-primary hover:underline flex items-center gap-1">
                    VIEW ALL <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {featuredArticles.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {featuredArticles.map((article, i) => (
                      <motion.article
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group border border-border rounded-[2px] overflow-hidden bg-card hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <Link href={`/news/${article.slug}`}>
                          <div className="relative h-48 overflow-hidden">
                            {article.featured_image ? (
                              <Image
                                src={article.featured_image}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center">
                                <FileText className="w-12 h-12 text-primary/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className={`mono-xs px-2 py-1 border rounded-[2px] ${getCategoryColor(article.category)}`}>
                                {article.category?.name || 'News'}
                              </span>
                              {article.is_breaking && (
                                <span className="mono-xs px-2 py-1 bg-orange text-background rounded-[2px]">
                                  BREAKING
                                </span>
                              )}
                              {article.is_featured && !article.is_breaking && (
                                <span className="mono-xs px-2 py-1 bg-primary text-background rounded-[2px]">
                                  FEATURED
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="text-foreground font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                            </div>
                          </div>
                        </Link>
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{article.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="mono-xs text-muted-foreground">{getAuthorName(article.author)}</span>
                              <span className="text-border">|</span>
                              <span className="mono-xs text-muted-foreground/70">{formatDate(article.published_at)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground/50">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span className="mono-xs">{article.views_count > 1000 ? `${(article.views_count / 1000).toFixed(1)}K` : article.views_count}</span>
                              </div>
                              <button
                                onClick={(e) => { e.preventDefault(); toggleLike(article.id) }}
                                className={`flex items-center gap-1 hover:text-primary transition-colors ${userLikes.has(article.id) ? 'text-primary' : ''}`}
                              >
                                <Heart className={`w-3 h-3 ${userLikes.has(article.id) ? 'fill-primary' : ''}`} />
                                <span className="mono-xs">{article.likes_count}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span className="mono-xs">{article.comments_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {[1, 2].map((i) => (
                      <div key={i} className="border border-border rounded-[2px] overflow-hidden bg-card animate-pulse">
                        <div className="h-48 bg-secondary" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-secondary rounded w-3/4" />
                          <div className="h-3 bg-secondary rounded w-full" />
                          <div className="h-3 bg-secondary rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 border-b border-border pb-4 overflow-x-auto">
                {(['all', 'agriculture', 'crypto', 'market'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`mono-xs px-3 py-1.5 rounded-[2px] transition-all whitespace-nowrap ${
                      filter === f
                        ? 'bg-primary text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {f === 'all' ? 'ALL' : f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Latest News Grid */}
              <div>
                <h2 className="mono text-lg text-foreground mb-6">Latest Updates</h2>
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-4 border border-border rounded-[2px] bg-card animate-pulse">
                        <div className="w-32 h-24 bg-secondary rounded-[2px]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-secondary rounded w-20" />
                          <div className="h-4 bg-secondary rounded w-full" />
                          <div className="h-3 bg-secondary rounded w-3/4" />
                        </div>
                      </div>
                    ))
                  ) : filteredArticles.length > 0 ? (
                    <AnimatePresence mode="wait">
                      {filteredArticles.map((article, i) => (
                        <motion.article
                          key={article.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: i * 0.05 }}
                          className="group flex gap-4 p-4 border border-border rounded-[2px] bg-card hover:border-primary/50 transition-all cursor-pointer"
                        >
                          <Link href={`/news/${article.slug}`} className="relative w-32 h-24 flex-shrink-0 rounded-[2px] overflow-hidden">
                            {article.thumbnail || article.featured_image ? (
                              <Image
                                src={article.thumbnail || article.featured_image!}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-primary/30" />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`mono-xs px-2 py-0.5 border rounded-[2px] text-[9px] ${getCategoryColor(article.category)}`}>
                                {article.category?.name || 'News'}
                              </span>
                              <span className="mono-xs text-muted-foreground/60 text-[10px]">{formatDate(article.published_at)}</span>
                            </div>
                            <Link href={`/news/${article.slug}`}>
                              <h3 className="text-foreground font-medium leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-1">{article.excerpt}</p>
                          </div>
                          <div className="flex flex-col items-end justify-between flex-shrink-0">
                            <button 
                              onClick={() => toggleBookmark(article.id)}
                              className={`p-1.5 transition-colors ${userBookmarks.has(article.id) ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'}`}
                            >
                              <Bookmark className={`w-4 h-4 ${userBookmarks.has(article.id) ? 'fill-primary' : ''}`} />
                            </button>
                            <span className="mono-xs text-muted-foreground/50 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.ceil(article.content.length / 1000)} min
                            </span>
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-[2px]">
                      <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No articles found</p>
                      <p className="text-sm text-muted-foreground/60 mt-1">
                        {searchQuery ? 'Try a different search term' : 'Check back soon for updates'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Load More */}
                {filteredArticles.length > 0 && (
                  <div className="mt-8 text-center">
                    <button className="mono-xs px-6 py-2.5 border border-primary text-primary hover:bg-primary hover:text-background transition-all rounded-[2px]">
                      LOAD MORE ARTICLES
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Trending Topics */}
              <div className="p-5 border border-border rounded-[2px] bg-card">
                <h3 className="mono text-sm text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  TRENDING TOPICS
                </h3>
                <div className="space-y-3">
                  {TRENDING.map((topic, i) => (
                    <div
                      key={topic.tag}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer hover:text-primary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="mono-xs text-muted-foreground/50">{String(i + 1).padStart(2, '0')}</span>
                        <span className="text-sm font-medium">{topic.tag}</span>
                      </div>
                      <span className="mono-xs text-muted-foreground">{topic.posts} posts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* V1N3 Market */}
              <div className="p-5 border border-primary/30 rounded-[2px] bg-gradient-to-br from-primary/5 to-transparent">
                <h3 className="mono text-sm text-foreground mb-4">V1N3 MARKET</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-light text-foreground">N3,002<span className="text-lg text-muted-foreground">.40</span></span>
                    <span className="mono-xs px-2 py-1 bg-primary/20 text-primary rounded">+2.4%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="mono-xs text-muted-foreground mb-1">24H HIGH</p>
                      <p className="text-foreground">N3,156.00</p>
                    </div>
                    <div>
                      <p className="mono-xs text-muted-foreground mb-1">24H LOW</p>
                      <p className="text-foreground">N2,890.50</p>
                    </div>
                    <div>
                      <p className="mono-xs text-muted-foreground mb-1">BTC</p>
                      <p className="text-foreground">$97,842</p>
                    </div>
                    <div>
                      <p className="mono-xs text-muted-foreground mb-1">ETH</p>
                      <p className="text-foreground">$3,456</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="p-5 border border-border rounded-[2px] bg-card">
                <h3 className="mono text-sm text-foreground mb-2">STAY UPDATED</h3>
                <p className="text-sm text-muted-foreground mb-4">Get the latest agri & crypto news delivered to your inbox.</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors"
                  />
                  <button className="w-full mono-xs py-2 bg-primary text-background rounded-[2px] hover:bg-primary/90 transition-colors">
                    SUBSCRIBE
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="p-5 border border-border rounded-[2px] bg-card">
                <h3 className="mono text-sm text-foreground mb-4">CATEGORIES</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (cat.type === 'agriculture') setFilter('agriculture')
                        else if (cat.type === 'crypto') setFilter('crypto')
                        else if (cat.type === 'market') setFilter('market')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[2px] text-sm transition-all ${getCategoryColor(cat)} border hover:opacity-80`}
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-5 border border-border rounded-[2px] bg-card">
                <h3 className="mono text-sm text-foreground mb-4">QUICK LINKS</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Communities', href: '/communities' },
                    { label: 'Wallet', href: '/dashboard/wallet' },
                    { label: 'Profile', href: '/dashboard/profile' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-primary border-b border-border/50 last:border-0 transition-colors"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
