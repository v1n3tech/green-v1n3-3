'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  MoreHorizontal,
  Newspaper,
  TrendingUp,
  MessageSquare,
  Heart,
  Send,
  Save,
  X,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Link2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  category_id: string | null
  tags: string[]
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

export function NewsManagement({ profile, canManageNews, categories, initialArticles }: NewsManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  })

  const supabase = createClient()

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
    })
    setEditingArticle(null)
    setError(null)
  }

  const handleCreate = () => {
    resetForm()
    setViewMode('create')
  }

  const handleEdit = (article: Article) => {
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
    })
    setEditingArticle(article)
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

      const articleData = {
        title: formData.title.trim(),
        slug,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim(),
        featured_image: formData.featured_image.trim() || null,
        category_id: formData.category_id || null,
        tags,
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
            <h1 className="text-2xl font-light text-foreground">News</h1>
            <p className="text-sm text-muted-foreground mt-1">Stay updated with the latest news</p>
          </div>
        </div>

        <div className="p-12 border border-dashed border-border rounded-[2px] text-center">
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
          <h1 className="text-2xl font-light text-foreground">News Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage news articles for GreenV1n3
          </p>
        </div>
        {viewMode === 'list' && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 mono-xs px-4 py-2.5 bg-primary text-background rounded-[2px] hover:bg-primary/90 transition-colors"
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
                { label: 'Total Articles', value: stats.total, icon: FileText },
                { label: 'Published', value: stats.published, icon: CheckCircle },
                { label: 'Drafts', value: stats.drafts, icon: Clock },
                { label: 'Total Views', value: stats.views.toLocaleString(), icon: Eye },
              ].map((stat) => (
                <div key={stat.label} className="p-4 border border-border rounded-[2px] bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-primary" />
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
                    className="flex items-center gap-4 p-4 border border-border rounded-[2px] bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                      </div>
                      <h3 className="text-foreground font-medium truncate">{article.title}</h3>
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
                <div className="p-12 border border-dashed border-border rounded-[2px] text-center">
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
                <h2 className="text-lg font-medium text-foreground">
                  {viewMode === 'edit' ? 'Edit Article' : 'New Article'}
                </h2>
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
                  className="inline-flex items-center gap-2 mono-xs px-4 py-2 bg-primary text-background rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors"
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
                  <label className="block mono-xs text-muted-foreground mb-2">CONTENT *</label>
                  <div className="border border-border rounded-[2px] overflow-hidden">
                    <div className="flex items-center gap-1 px-3 py-2 bg-secondary/30 border-b border-border">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <List className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your article content here..."
                      rows={15}
                      className="w-full px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-[2px] bg-card space-y-4">
                  <h3 className="mono-xs text-foreground">SETTINGS</h3>

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
                    <label className="block mono-xs text-muted-foreground mb-2">FEATURED IMAGE URL</label>
                    <input
                      type="text"
                      value={formData.featured_image}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Mark as Featured</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_breaking}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_breaking: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Mark as Breaking News</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-[2px] bg-card">
                  <h3 className="mono-xs text-foreground mb-3">PUBLISH STATUS</h3>
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
