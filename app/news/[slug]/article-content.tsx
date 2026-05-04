'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  ChevronRight,
  Calendar,
  User,
  FileText,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
} from 'lucide-react'
import { marked } from 'marked'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { createClient } from '@/lib/supabase/client'

interface NewsCategory {
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
  avatar_url: string | null
  community: string | null
  role: string | null
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
  thumbnail: string | null
  tags: string[]
  social_links: SocialLinks | null
  is_featured: boolean
  is_breaking: boolean
  views_count: number
  likes_count: number
  comments_count: number
  bookmarks_count: number
  published_at: string | null
  created_at: string
  category: NewsCategory | null
  author: Author | null
}

interface RelatedArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail: string | null
  featured_image: string | null
  published_at: string | null
  views_count: number
  category: { name: string; type: string; color: string | null } | null
}

interface ArticleContentProps {
  article: Article
  relatedArticles: RelatedArticle[]
}

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

export function ArticleContent({ article, relatedArticles }: ArticleContentProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likesCount, setLikesCount] = useState(article.likes_count)
  const [parsedContent, setParsedContent] = useState('')

  const supabase = createClient()

  // Parse markdown content
  useEffect(() => {
    const parseMarkdown = async () => {
      const html = await marked(article.content)
      setParsedContent(html)
    }
    parseMarkdown()
  }, [article.content])

  // Check if user has already liked/bookmarked
  useEffect(() => {
    const checkUserInteractions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: likes }, { data: bookmarks }] = await Promise.all([
        supabase.from('news_likes').select('id').eq('article_id', article.id).eq('user_id', user.id).single(),
        supabase.from('news_bookmarks').select('id').eq('article_id', article.id).eq('user_id', user.id).single(),
      ])

      setIsLiked(!!likes)
      setIsBookmarked(!!bookmarks)
    }
    checkUserInteractions()
  }, [article.id, supabase])

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.rpc('toggle_article_like', { p_article_id: article.id })
    setIsLiked(data)
    setLikesCount(prev => data ? prev + 1 : prev - 1)
  }

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.rpc('toggle_article_bookmark', { p_article_id: article.id })
    setIsBookmarked(data)
  }

  const getAuthorName = (author: Author | null) => {
    if (!author) return 'GreenV1n3'
    if (author.display_name) return author.display_name
    if (author.first_name && author.last_name) return `${author.first_name} ${author.last_name}`
    if (author.first_name) return author.first_name
    return 'GreenV1n3'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getCategoryColor = (category: NewsCategory | null) => {
    if (!category) return 'text-muted-foreground bg-secondary border-border'
    
    switch (category.type) {
      case 'agriculture':
        return 'text-primary bg-primary/10 border-primary/30'
      case 'crypto':
        return 'text-orange bg-orange/10 border-orange/30'
      case 'market':
        return 'text-accent bg-accent/10 border-accent/30'
      case 'technology':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      default:
        return 'text-muted-foreground bg-secondary border-border'
    }
  }

  const readTime = Math.ceil(article.content.length / 1000)

  const hasSocialLinks = article.social_links && Object.values(article.social_links).some(v => v)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-8 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 lg:px-6 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="mono-xs text-muted-foreground hover:text-primary transition-colors">
              HOME
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <Link href="/news" className="mono-xs text-muted-foreground hover:text-primary transition-colors">
              NEWS
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="mono-xs text-primary truncate max-w-[200px]">{article.title}</span>
          </div>

          {/* Back Button */}
          <Link 
            href="/news"
            className="inline-flex items-center gap-2 mono-xs text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO NEWS
          </Link>

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`mono-xs px-3 py-1 border rounded-[2px] ${getCategoryColor(article.category)}`}>
              {article.category?.name || 'News'}
            </span>
            {article.is_breaking && (
              <span className="mono-xs px-3 py-1 bg-orange text-background rounded-[2px]">
                BREAKING
              </span>
            )}
            {article.is_featured && (
              <span className="mono-xs px-3 py-1 bg-primary text-background rounded-[2px]">
                FEATURED
              </span>
            )}
          </div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-foreground mb-6 leading-tight"
          >
            {article.title}
          </motion.h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              {article.author?.avatar_url ? (
                <Image
                  src={article.author.avatar_url}
                  alt={getAuthorName(article.author)}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <span className="font-medium text-foreground">{getAuthorName(article.author)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.published_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{readTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{article.views_count.toLocaleString()} views</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="mono-xs px-2 py-1 bg-secondary text-muted-foreground rounded-[2px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {article.featured_image && (
        <section className="py-8 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <div className="relative aspect-[16/9] rounded-[2px] overflow-hidden">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12">
            {/* Article Body */}
            <article className="prose prose-invert prose-lg max-w-none">
              <div 
                className="article-content text-foreground/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parsedContent }}
              />
              
              {/* Social Links Section */}
              {hasSocialLinks && (
                <div className="mt-10 pt-8 border-t border-border">
                  <h4 className="mono text-sm text-foreground mb-4">FOLLOW THIS STORY</h4>
                  <div className="flex flex-wrap gap-3">
                    {article.social_links?.twitter && (
                      <a
                        href={article.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-[2px] hover:bg-[#1DA1F2]/20 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        <span className="mono-xs">Twitter</span>
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    )}
                    {article.social_links?.facebook && (
                      <a
                        href={article.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] rounded-[2px] hover:bg-[#1877F2]/20 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        <span className="mono-xs">Facebook</span>
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    )}
                    {article.social_links?.instagram && (
                      <a
                        href={article.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#E4405F]/10 border border-[#E4405F]/30 text-[#E4405F] rounded-[2px] hover:bg-[#E4405F]/20 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        <span className="mono-xs">Instagram</span>
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    )}
                    {article.social_links?.linkedin && (
                      <a
                        href={article.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] rounded-[2px] hover:bg-[#0A66C2]/20 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span className="mono-xs">LinkedIn</span>
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    )}
                    {article.social_links?.youtube && (
                      <a
                        href={article.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] rounded-[2px] hover:bg-[#FF0000]/20 transition-colors"
                      >
                        <Youtube className="w-4 h-4" />
                        <span className="mono-xs">YouTube</span>
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    )}
                    {article.social_links?.tiktok && (
                      <a
                        href={article.social_links.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-foreground/10 border border-foreground/30 text-foreground rounded-[2px] hover:bg-foreground/20 transition-colors"
                      >
                        <TikTokIcon className="w-4 h-4" />
                        <span className="mono-xs">TikTok</span>
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </article>

            {/* Sticky Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-32 space-y-4">
                <button
                  onClick={toggleLike}
                  className={`flex items-center justify-center gap-2 w-12 h-12 border rounded-full transition-all ${
                    isLiked 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-primary' : ''}`} />
                </button>
                <div className="text-center mono-xs text-muted-foreground">{likesCount}</div>
                
                <button
                  onClick={toggleBookmark}
                  className={`flex items-center justify-center gap-2 w-12 h-12 border rounded-full transition-all ${
                    isBookmarked 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: article.title, url: window.location.href })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-12 h-12 border border-border rounded-full text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                <button className="flex items-center justify-center gap-2 w-12 h-12 border border-border rounded-full text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <div className="text-center mono-xs text-muted-foreground">{article.comments_count}</div>
              </div>
            </aside>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center justify-center gap-4 py-8 border-t border-border mt-12 lg:hidden">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 border rounded-[2px] transition-all ${
                isLiked 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-primary' : ''}`} />
              <span className="mono-xs">{likesCount}</span>
            </button>
            
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-2 px-4 py-2 border rounded-[2px] transition-all ${
                isBookmarked 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
              <span className="mono-xs">Save</span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: article.title, url: window.location.href })
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-[2px] text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="mono-xs">Share</span>
            </button>
          </div>

          {/* Author Box */}
          {article.author && (
            <div className="p-6 border border-border rounded-[2px] bg-card mt-8">
              <div className="flex items-start gap-4">
                {article.author.avatar_url ? (
                  <Image
                    src={article.author.avatar_url}
                    alt={getAuthorName(article.author)}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="mono-xs text-muted-foreground mb-1">WRITTEN BY</p>
                  <h4 className="text-lg font-medium text-foreground">{getAuthorName(article.author)}</h4>
                  {article.author.community && (
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {article.author.community.replace(/_/g, ' ')} Community
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 border-t border-border bg-card/30">
          <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <h2 className="mono text-lg text-foreground mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {relatedArticles.map((related) => (
                <Link 
                  key={related.id}
                  href={`/news/${related.slug}`}
                  className="group border border-border rounded-[2px] overflow-hidden bg-card hover:border-primary/50 transition-all"
                >
                  <div className="relative h-32 overflow-hidden">
                    {related.thumbnail || related.featured_image ? (
                      <Image
                        src={related.thumbnail || related.featured_image!}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                    <p className="mono-xs text-muted-foreground mt-2">
                      {related.views_count.toLocaleString()} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* Custom styles for markdown content */}
      <style jsx global>{`
        .article-content h1 {
          font-size: 2rem;
          font-weight: 300;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
        }
        .article-content h2 {
          font-size: 1.5rem;
          font-weight: 400;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
        }
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 500;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }
        .article-content p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
        }
        .article-content strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .article-content em {
          font-style: italic;
        }
        .article-content ul, .article-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .article-content li {
          margin-bottom: 0.5rem;
        }
        .article-content ul li {
          list-style-type: disc;
        }
        .article-content ol li {
          list-style-type: decimal;
        }
        .article-content blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .article-content code {
          background: hsl(var(--secondary));
          padding: 0.2rem 0.4rem;
          border-radius: 2px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .article-content pre {
          background: hsl(var(--secondary));
          padding: 1rem;
          border-radius: 2px;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .article-content pre code {
          background: none;
          padding: 0;
        }
        .article-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .article-content a:hover {
          opacity: 0.8;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 2px;
          margin: 1.5rem 0;
        }
        .article-content hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 2rem 0;
        }
      `}</style>
    </main>
  )
}
