'use client'

import { useState, useRef, ChangeEvent } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Newspaper,
  TrendingUp,
  MessageSquare,
  Heart,
  Send,
  Save,
  X,
  Image as ImageIcon,
  Sparkles,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ChevronDown,
  Layers,
  Zap,
  Upload,
  Loader2,
  Type,
  Link2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NewsAiPanel } from '@/components/news/news-ai-panel'

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import('@/components/editor/rich-text-editor').then(mod => mod.RichTextEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-[2px] overflow-hidden bg-card">
        <div className="h-12 bg-secondary/50 animate-pulse" />
        <div className="h-[400px] bg-background animate-pulse" />
      </div>
    )
  }
)

interface Profile {
  id: string
  role: string | null
  community: string | null
  displayName: string
}

interface Category {
  id: string
  name: string
  slug: string
  type: string
  color: string | null
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
  category_id: string | null
  tags: string[]
  social_links: SocialLinks
  status: 'draft' | 'pending_review' | 'published' | 'archived'
  is_featured: boolean
  is_breaking: boolean
  views_count: number
  likes_count: number
  comments_count: number
  published_at: string | null
  created_at: string
  category: Category | null
  author: { id: string; display_name: string | null; first_name: string | null; last_name: string | null } | null
}

interface NewsManagementProps {
  profile: Profile
  canManageNews: boolean
  categories: Category[]
  initialArticles: Article[]
}

type ViewMode = 'list' | 'create' | 'edit'
type FilterStatus = 'all' | 'draft' | 'pending_review' | 'published' | 'archived'

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

export function NewsManagement({ profile, canManageNews, categories, initialArticles }: NewsManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSocialLinks, setShowSocialLinks] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: '',
    tags: '',
    is_featured: false,
    is_breaking: false,
    status: 'draft' as Article['status'],
    social_links: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
    } as SocialLinks,
  })

  const supabase = createClient()

  // Image upload handler
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Use JPEG, PNG, WebP, or GIF.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('File too large. Maximum size is 10MB.')
      return
    }

    setIsUploadingImage(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/news-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFormData(prev => ({ ...prev, featured_image: data.url }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploadingImage(false)
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category_id: '',
      tags: '',
      is_featured: false,
      is_breaking: false,
      status: 'draft',
      social_links: {
        twitter: '',
        facebook: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        tiktok: '',
      },
    })
    setEditingArticle(null)
    setError(null)
    setShowSocialLinks(false)
  }

  const handleCreate = () => {
    resetForm()
    setViewMode('create')
  }

  const handleEdit = (article: Article) => {
    const socialLinks = article.social_links || {}
    setFormData({
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content,
      featured_image: article.featured_image || '',
      category_id: article.category_id || '',
      tags: article.tags?.join(', ') || '',
      is_featured: article.is_featured,
      is_breaking: article.is_breaking,
      status: article.status,
      social_links: {
        twitter: socialLinks.twitter || '',
        facebook: socialLinks.facebook || '',
        instagram: socialLinks.instagram || '',
        linkedin: socialLinks.linkedin || '',
        youtube: socialLinks.youtube || '',
        tiktok: socialLinks.tiktok || '',
      },
    })
    setEditingArticle(article)
    setShowSocialLinks(Object.values(socialLinks).some(v => v))
    setViewMode('edit')
  }

  const handleCancel = () => {
    resetForm()
    setViewMode('list')
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const slug = editingArticle?.slug || generateSlug(formData.title) + '-' + Date.now()
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      const status = publishNow ? 'published' : formData.status

      // Clean up empty social links
      const socialLinks: SocialLinks = {}
      if (formData.social_links.twitter) socialLinks.twitter = formData.social_links.twitter
      if (formData.social_links.facebook) socialLinks.facebook = formData.social_links.facebook
      if (formData.social_links.instagram) socialLinks.instagram = formData.social_links.instagram
      if (formData.social_links.linkedin) socialLinks.linkedin = formData.social_links.linkedin
      if (formData.social_links.youtube) socialLinks.youtube = formData.social_links.youtube
      if (formData.social_links.tiktok) socialLinks.tiktok = formData.social_links.tiktok

      const articleData = {
        title: formData.title.trim(),
        slug,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        featured_image: formData.featured_image.trim() || null,
        category_id: formData.category_id || null,
        tags,
        social_links: socialLinks,
        is_featured: formData.is_featured,
        is_breaking: formData.is_breaking,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        author_id: profile.id,
      }

      if (editingArticle) {
        const { error: updateError } = await supabase
          .from('news_articles')
          .update(articleData)
          .eq('id', editingArticle.id)

        if (updateError) throw updateError

        setArticles(prev => prev.map(a => 
          a.id === editingArticle.id 
            ? { ...a, ...articleData, category: categories.find(c => c.id === articleData.category_id) || null }
            : a
        ))
      } else {
        const { data: newArticle, error: insertError } = await supabase
          .from('news_articles')
          .insert(articleData)
          .select(`
            *,
            category:news_categories(id, name, slug, type, color),
            author:profiles(id, display_name, first_name, last_name)
          `)
          .single()

        if (insertError) throw insertError
        if (newArticle) {
          setArticles(prev => [newArticle as Article, ...prev])
          
          // Send notifications when publishing
          if (status === 'published') {
            try {
              // Notify all users in the same community about new news
              const { data: communityUsers } = await supabase
                .from('profiles')
                .select('id')
                .eq('is_active', true)
                .neq('id', profile.id)
              
              if (communityUsers && communityUsers.length > 0) {
                const notifications = communityUsers.map(u => ({
                  user_id: u.id,
                  type: 'news_published',
                  title: 'New Article Published',
                  body: `${formData.title.substring(0, 60)}${formData.title.length > 60 ? '...' : ''}`,
                  reference_type: 'news',
                  reference_id: newArticle.id,
                  action_url: `/dashboard/feed/${newArticle.slug}`,
                  metadata: { 
                    author: profile.displayName,
                    category: categories.find(c => c.id === articleData.category_id)?.name || null,
                    is_breaking: formData.is_breaking,
                  },
                }))
                
                // Insert in batches
                const batchSize = 100
                for (let i = 0; i < notifications.length; i += batchSize) {
                  const batch = notifications.slice(i, i + batchSize)
                  await supabase.from('notifications').insert(batch)
                }
              }
            } catch (notifErr) {
              console.error('[News] Failed to send notifications:', notifErr)
            }
          }
        }
      }

      resetForm()
      setViewMode('list')
    } catch (err) {
      console.error('[v0] Error saving article:', err)
      setError(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error
      setArticles(prev => prev.filter(a => a.id !== articleId))
    } catch (err) {
      console.error('[v0] Error deleting article:', err)
      alert('Failed to delete article')
    }
  }

  const getStatusIcon = (status: Article['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-primary" />
      case 'pending_review':
        return <AlertCircle className="w-4 h-4 text-orange" />
      case 'draft':
        return <Clock className="w-4 h-4 text-muted-foreground" />
      case 'archived':
        return <XCircle className="w-4 h-4 text-destructive" />
    }
  }

  const getStatusLabel = (status: Article['status']) => {
    return status.replace('_', ' ').toUpperCase()
  }

  const filteredArticles = articles.filter(article => {
    if (filterStatus !== 'all' && article.status !== filterStatus) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return article.title.toLowerCase().includes(query) || 
             article.excerpt?.toLowerCase().includes(query)
    }
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Stats
  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
    views: articles.reduce((sum, a) => sum + a.views_count, 0),
  }

  if (!canManageNews) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-[2px]">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-light text-foreground">News Studio</h1>
            </div>
            <p className="text-sm text-muted-foreground">Stay updated with the latest news</p>
          </div>
        </div>

        <div className="p-12 border border-dashed border-border rounded-[2px] text-center bg-gradient-to-br from-card to-secondary/20">
          <Newspaper className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">View Only Access</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You can view news articles on the public news page. To create and manage news articles, 
            you need to be part of the Agro Media & Branding community or have administrative privileges.
          </p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 mono-xs px-6 py-2.5 bg-primary text-background rounded-[2px] hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            VIEW PUBLIC NEWS
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-[2px]">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-2xl font-light text-foreground">News Studio</h1>
            <span className="mono-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">PRO</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Create, edit, and publish news articles for GreenV1n3
          </p>
        </div>
        {viewMode === 'list' && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 mono-xs px-5 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-background rounded-[2px] hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            NEW ARTICLE
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Articles', value: stats.total, icon: Layers, color: 'text-primary' },
                { label: 'Published', value: stats.published, icon: Zap, color: 'text-green-400' },
                { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-orange' },
                { label: 'Total Views', value: stats.views.toLocaleString(), icon: TrendingUp, color: 'text-accent' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 border border-border rounded-[2px] bg-gradient-to-br from-card to-secondary/10 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="mono-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-light text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-[2px] flex-1 sm:max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                {(['all', 'published', 'draft', 'pending_review', 'archived'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`mono-xs px-3 py-1.5 rounded-[2px] whitespace-nowrap transition-all ${
                      filterStatus === status
                        ? 'bg-primary text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {status === 'all' ? 'ALL' : getStatusLabel(status as Article['status'])}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-[2px] bg-card hover:border-primary/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getStatusIcon(article.status)}
                        <span className="mono-xs text-muted-foreground">
                          {getStatusLabel(article.status)}
                        </span>
                        {article.category && (
                          <>
                            <span className="text-border">|</span>
                            <span className="mono-xs text-primary">{article.category.name}</span>
                          </>
                        )}
                        {article.is_featured && (
                          <span className="mono-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[9px]">
                            FEATURED
                          </span>
                        )}
                        {article.is_breaking && (
                          <span className="mono-xs px-1.5 py-0.5 bg-orange/20 text-orange rounded text-[9px]">
                            BREAKING
                          </span>
                        )}
                        {article.social_links && Object.keys(article.social_links).length > 0 && (
                          <span className="mono-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded text-[9px] flex items-center gap-1">
                            <Link2 className="w-2.5 h-2.5" /> SOCIAL
                          </span>
                        )}
                      </div>
                      <h3 className="text-foreground font-medium truncate group-hover:text-primary transition-colors">{article.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(article.created_at)}</span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{article.views_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{article.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{article.comments_count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {article.status === 'published' && (
                        <Link
                          href={`/news/${article.slug}`}
                          target="_blank"
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 border border-dashed border-border rounded-[2px] text-center bg-gradient-to-br from-card to-secondary/10">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || filterStatus !== 'all' 
                      ? 'No articles match your filters' 
                      : 'No articles yet. Create your first one!'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-medium text-foreground">
                    {viewMode === 'edit' ? 'Edit Article' : 'New Article'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Use markdown for formatting</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 mono-xs px-4 py-2 border border-border text-foreground rounded-[2px] hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  SAVE DRAFT
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 mono-xs px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-background rounded-[2px] hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  PUBLISH
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-[2px] text-destructive text-sm">
                {error}
              </div>
            )}

            {/* AI Assistant */}
            <NewsAiPanel
              title={formData.title}
              excerpt={formData.excerpt}
              content={formData.content}
              category={categories.find(c => c.id === formData.category_id)?.name}
              onApplyContent={(html) => setFormData(prev => ({ ...prev, content: html }))}
              onApplyExcerpt={(text) => setFormData(prev => ({ ...prev, excerpt: text }))}
              onApplyTags={(csv) => setFormData(prev => ({ ...prev, tags: csv }))}
            />

            {/* Editor Form */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block mono-xs text-muted-foreground mb-2">TITLE *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter article title..."
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-lg"
                  />
                </div>

                <div>
                  <label className="block mono-xs text-muted-foreground mb-2">EXCERPT</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief summary of the article..."
                    rows={2}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="mono-xs text-foreground font-medium flex items-center gap-2">
                      <Type className="w-4 h-4 text-primary" />
                      CONTENT EDITOR
                    </label>
                    <span className="mono-xs text-primary/70 text-[9px] px-2 py-0.5 bg-primary/10 rounded">RICH TEXT</span>
                  </div>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    placeholder="Start writing your article..."
                  />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-[2px] bg-gradient-to-br from-card to-secondary/10 space-y-4">
                  <h3 className="mono-xs text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    SETTINGS
                  </h3>

                  <div>
                    <label className="block mono-xs text-muted-foreground mb-2">CATEGORY</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] text-foreground focus:border-primary/50 outline-none transition-colors"
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mono-xs text-muted-foreground mb-2">TAGS</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="farming, crypto, market"
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                    />
                    <p className="mono-xs text-muted-foreground/60 mt-1">Separate with commas</p>
                  </div>

                  <div>
                    <label className="block mono-xs text-muted-foreground mb-2">FEATURED IMAGE</label>
                    
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {/* Image preview or upload button */}
                    {formData.featured_image ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-[2px] overflow-hidden border border-border bg-secondary/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={formData.featured_image} 
                            alt="Featured" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                            className="absolute top-2 right-2 p-1.5 bg-background/90 hover:bg-destructive hover:text-background rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="w-full px-3 py-2 border border-dashed border-border rounded-[2px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Change Image
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isUploadingImage && imageInputRef.current?.click()}
                        className={`aspect-video border-2 border-dashed rounded-[2px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                          isUploadingImage 
                            ? 'border-primary/50 bg-primary/5' 
                            : 'border-border hover:border-primary/40 hover:bg-secondary/30'
                        }`}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="mono-xs text-muted-foreground">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground/50" />
                            <span className="mono-xs text-muted-foreground">Click to upload</span>
                            <span className="text-xs text-muted-foreground/50">Max 10MB</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Upload error */}
                    {uploadError && (
                      <p className="text-xs text-destructive mt-2">{uploadError}</p>
                    )}
                    
                    {/* Or paste URL */}
                    <div className="mt-3">
                      <p className="mono-xs text-muted-foreground/50 mb-1">Or paste URL:</p>
                      <input
                        type="text"
                        value={formData.featured_image}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">Mark as Featured</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.is_breaking}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_breaking: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">Mark as Breaking News</span>
                    </label>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="p-4 border border-border rounded-[2px] bg-card">
                  <button
                    type="button"
                    onClick={() => setShowSocialLinks(!showSocialLinks)}
                    className="w-full flex items-center justify-between mono-xs text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      SOCIAL MEDIA LINKS
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSocialLinks ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showSocialLinks && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pt-4">
                          <div className="flex items-center gap-2">
                            <Twitter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="url"
                              value={formData.social_links.twitter}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, twitter: e.target.value }
                              }))}
                              placeholder="Twitter/X URL"
                              className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="url"
                              value={formData.social_links.facebook}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, facebook: e.target.value }
                              }))}
                              placeholder="Facebook URL"
                              className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="url"
                              value={formData.social_links.instagram}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, instagram: e.target.value }
                              }))}
                              placeholder="Instagram URL"
                              className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="url"
                              value={formData.social_links.linkedin}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, linkedin: e.target.value }
                              }))}
                              placeholder="LinkedIn URL"
                              className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Youtube className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="url"
                              value={formData.social_links.youtube}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, youtube: e.target.value }
                              }))}
                              placeholder="YouTube URL"
                              className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <TikTokIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                              type="url"
                              value={formData.social_links.tiktok}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                social_links: { ...prev.social_links, tiktok: e.target.value }
                              }))}
                              placeholder="TikTok URL"
                              className="flex-1 px-3 py-1.5 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-4 border border-border rounded-[2px] bg-card">
                  <h3 className="mono-xs text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    PUBLISH STATUS
                  </h3>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Article['status'] }))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] text-foreground focus:border-primary/50 outline-none transition-colors"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Formatting Help */}
                <div className="p-4 border border-border/50 rounded-[2px] bg-secondary/20">
                  <h4 className="mono-xs text-muted-foreground mb-2">FORMATTING TIPS</h4>
                  <div className="space-y-1 text-xs text-muted-foreground/70 font-mono">
                    <p>**bold** → <strong>bold</strong></p>
                    <p>*italic* → <em>italic</em></p>
                    <p># Heading 1</p>
                    <p>## Heading 2</p>
                    <p>[link](url)</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
