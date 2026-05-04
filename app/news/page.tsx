'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Leaf,
  Bitcoin,
  Globe,
  Sparkles,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Bookmark,
  Share2,
  Eye,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

// Mock crypto prices
const CRYPTO_PRICES = [
  { symbol: 'V1N3', name: 'V1n3 Token', price: 3002.40, change: 2.4, icon: '🌿' },
  { symbol: 'BTC', name: 'Bitcoin', price: 97842.50, change: 1.2, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -0.8, icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', price: 187.32, change: 3.5, icon: '◎' },
  { symbol: 'AGRI', name: 'AgriCoin', price: 12.45, change: 5.2, icon: '🌾' },
]

// Mock commodity prices
const COMMODITIES = [
  { name: 'Maize', price: 'N85,000', unit: '/ton', change: 1.8 },
  { name: 'Rice', price: 'N120,000', unit: '/ton', change: -0.5 },
  { name: 'Cassava', price: 'N45,000', unit: '/ton', change: 2.3 },
  { name: 'Tomatoes', price: 'N180,000', unit: '/ton', change: 4.1 },
  { name: 'Palm Oil', price: 'N350,000', unit: '/ton', change: 0.9 },
  { name: 'Cocoa', price: 'N1,200,000', unit: '/ton', change: 3.2 },
]

// Mock featured news
const FEATURED_NEWS = [
  {
    id: 1,
    category: 'AGRICULTURE',
    tag: 'FEATURED',
    title: 'Plateau State Launches N5 Billion Agro-Investment Fund for Youth Farmers',
    excerpt: 'The state government announces a landmark initiative to empower 10,000 youth farmers with access to capital, training, and modern farming equipment.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop',
    author: 'Ibrahim Musa',
    date: '2 hours ago',
    readTime: '5 min read',
    views: 2450,
    comments: 34,
  },
  {
    id: 2,
    category: 'CRYPTO',
    tag: 'BREAKING',
    title: 'V1N3 Token Surges 24% as GreenV1n3 Platform Announces Phase 2 Expansion',
    excerpt: 'The native token of the GreenV1n3 ecosystem hits all-time high following announcement of expansion to all 36 Nigerian states.',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=500&fit=crop',
    author: 'Amina Bello',
    date: '4 hours ago',
    readTime: '4 min read',
    views: 5820,
    comments: 89,
  },
]

// Mock latest news
const LATEST_NEWS = [
  {
    id: 3,
    category: 'AGRICULTURE',
    title: 'New Drought-Resistant Maize Variety Yields 40% More in Trial Farms',
    excerpt: 'Nigerian Agricultural Research Institute develops breakthrough variety suited for northern climate.',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
    date: '5 hours ago',
    readTime: '3 min',
  },
  {
    id: 4,
    category: 'CRYPTO',
    title: 'Central Bank Explores Blockchain for Agricultural Supply Chain',
    excerpt: 'CBN partners with tech firms to pilot blockchain-based tracking system for farm produce.',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop',
    date: '6 hours ago',
    readTime: '4 min',
  },
  {
    id: 5,
    category: 'MARKET',
    title: 'Tomato Prices Spike 15% Amid Transportation Challenges',
    excerpt: 'Farmers call for better road infrastructure as logistics costs eat into profits.',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
    date: '8 hours ago',
    readTime: '2 min',
  },
  {
    id: 6,
    category: 'TECHNOLOGY',
    title: 'Smart Irrigation Systems Reduce Water Usage by 60% in Jos Farms',
    excerpt: 'IoT-powered farming technology gains traction among Plateau State agro-executives.',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop',
    date: '10 hours ago',
    readTime: '5 min',
  },
  {
    id: 7,
    category: 'CRYPTO',
    title: 'Solana-Based AgriDEX Launches with Nigerian Farm Commodities',
    excerpt: 'Decentralized exchange allows direct trading of tokenized agricultural produce.',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop',
    date: '12 hours ago',
    readTime: '4 min',
  },
  {
    id: 8,
    category: 'AGRICULTURE',
    title: 'Youth Farmers Cooperative Secures N200M Export Contract',
    excerpt: 'GreenV1n3 registered cooperative to supply organic produce to European markets.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop',
    date: '14 hours ago',
    readTime: '3 min',
  },
]

// Mock trending topics
const TRENDING = [
  { tag: '#V1N3Farming', posts: '2.4K' },
  { tag: '#PlateauAgro', posts: '1.8K' },
  { tag: '#CryptoFarm', posts: '1.2K' },
  { tag: '#AgroExecutive', posts: '980' },
  { tag: '#FarmToTable', posts: '756' },
]

type FilterType = 'all' | 'agri' | 'crypto' | 'market'

export default function NewsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [time, setTime] = useState('')
  const [priceIndex, setPriceIndex] = useState(0)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Rotate crypto prices in ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceIndex((i) => (i + 1) % CRYPTO_PRICES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AGRICULTURE':
        return 'text-primary bg-primary/10 border-primary/30'
      case 'CRYPTO':
        return 'text-orange bg-orange/10 border-orange/30'
      case 'MARKET':
        return 'text-accent bg-accent/10 border-accent/30'
      case 'TECHNOLOGY':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      default:
        return 'text-muted-foreground bg-secondary border-border'
    }
  }

  const filteredNews = LATEST_NEWS.filter((news) => {
    if (filter === 'all') return true
    if (filter === 'agri') return news.category === 'AGRICULTURE'
    if (filter === 'crypto') return news.category === 'CRYPTO'
    if (filter === 'market') return news.category === 'MARKET' || news.category === 'TECHNOLOGY'
    return true
  })

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Live Ticker */}
      <section className="pt-28 pb-8 border-b border-border relative overflow-hidden">
        {/* Background Pattern */}
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
              <button className="p-2.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Price Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            {COMMODITIES.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3 flex-shrink-0">
                <span className="mono-xs text-foreground/80">{item.name}</span>
                <span className="mono-xs text-foreground font-medium">{item.price}</span>
                <span className={`mono-xs ${item.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
                {i < COMMODITIES.length - 1 && <div className="h-3 w-px bg-border/50" />}
              </div>
            ))}
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

                <div className="grid sm:grid-cols-2 gap-5">
                  {FEATURED_NEWS.map((news, i) => (
                    <motion.article
                      key={news.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group border border-border rounded-[2px] overflow-hidden bg-card hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={news.image}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={`mono-xs px-2 py-1 border rounded-[2px] ${getCategoryColor(news.category)}`}>
                            {news.category}
                          </span>
                          {news.tag && (
                            <span className="mono-xs px-2 py-1 bg-orange text-background rounded-[2px]">
                              {news.tag}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-foreground font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {news.title}
                          </h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{news.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="mono-xs text-muted-foreground">{news.author}</span>
                            <span className="text-border">|</span>
                            <span className="mono-xs text-muted-foreground/70">{news.date}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground/50">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span className="mono-xs">{(news.views / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span className="mono-xs">{news.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(['all', 'agri', 'crypto', 'market'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`mono-xs px-3 py-1.5 rounded-[2px] transition-all ${
                      filter === f
                        ? 'bg-primary text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {f === 'all' ? 'ALL' : f === 'agri' ? 'AGRICULTURE' : f === 'crypto' ? 'CRYPTO' : 'MARKET'}
                  </button>
                ))}
              </div>

              {/* Latest News Grid */}
              <div>
                <h2 className="mono text-lg text-foreground mb-6">Latest Updates</h2>
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {filteredNews.map((news, i) => (
                      <motion.article
                        key={news.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.05 }}
                        className="group flex gap-4 p-4 border border-border rounded-[2px] bg-card hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <div className="relative w-32 h-24 flex-shrink-0 rounded-[2px] overflow-hidden">
                          <Image
                            src={news.image}
                            alt={news.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`mono-xs px-2 py-0.5 border rounded-[2px] text-[9px] ${getCategoryColor(news.category)}`}>
                              {news.category}
                            </span>
                            <span className="mono-xs text-muted-foreground/60 text-[10px]">{news.date}</span>
                          </div>
                          <h3 className="text-foreground font-medium leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {news.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{news.excerpt}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                          <button className="p-1.5 text-muted-foreground/50 hover:text-primary transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <span className="mono-xs text-muted-foreground/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {news.readTime}
                          </span>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Load More */}
                <div className="mt-8 text-center">
                  <button className="mono-sm px-8 py-3 border border-border rounded-[2px] text-foreground hover:border-primary hover:bg-primary/5 transition-all">
                    LOAD MORE NEWS
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <div className="border border-border rounded-[2px] bg-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="mono-sm text-foreground">Trending Topics</h3>
                </div>
                <div className="space-y-3">
                  {TRENDING.map((trend, i) => (
                    <motion.div
                      key={trend.tag}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 border border-border rounded-[2px] hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="mono-xs text-muted-foreground/50">0{i + 1}</span>
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{trend.tag}</span>
                      </div>
                      <span className="mono-xs text-muted-foreground">{trend.posts}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Market Overview */}
              <div className="border border-border rounded-[2px] bg-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Globe className="w-4 h-4 text-accent" />
                  <h3 className="mono-sm text-foreground">Market Overview</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border border-primary/30 rounded-[2px] bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="mono-xs text-muted-foreground">V1N3 TOKEN</span>
                      <span className="mono-xs text-primary flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +2.4%
                      </span>
                    </div>
                    <p className="text-2xl text-foreground font-light">N3,002.40</p>
                    <p className="mono-xs text-muted-foreground mt-1">24h Volume: N4.2B</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-border rounded-[2px]">
                      <span className="mono-xs text-muted-foreground block mb-1">BTC/NGN</span>
                      <p className="text-sm text-foreground">N145.2M</p>
                      <span className="mono-xs text-primary">+1.2%</span>
                    </div>
                    <div className="p-3 border border-border rounded-[2px]">
                      <span className="mono-xs text-muted-foreground block mb-1">ETH/NGN</span>
                      <p className="text-sm text-foreground">N5.1M</p>
                      <span className="mono-xs text-destructive">-0.8%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="border border-primary/30 rounded-[2px] bg-gradient-to-br from-primary/10 via-card to-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="mono-sm text-foreground">Stay Updated</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get daily agri-crypto insights delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-[2px] text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
                  />
                  <button className="w-full mono-sm py-2.5 bg-primary text-background rounded-[2px] hover:bg-primary/90 transition-colors">
                    SUBSCRIBE
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="border border-border rounded-[2px] bg-card p-5">
                <h3 className="mono-sm text-foreground mb-4">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { label: 'GreenV1n3 Dashboard', href: '/dashboard' },
                    { label: 'Marketplace', href: '/dashboard/marketplace' },
                    { label: 'Community Forums', href: '/communities' },
                    { label: 'Investment Portal', href: '/dashboard/investments' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between p-2.5 border border-border rounded-[2px] text-sm text-foreground/80 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all group"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
