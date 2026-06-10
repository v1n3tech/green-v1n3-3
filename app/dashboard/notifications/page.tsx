'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  FileText,
  Briefcase,
  Newspaper,
  Wallet,
  Award,
  AlertCircle,
  Shield,
  Settings,
  X,
  Trash2,
  Filter,
  Search,
  Loader2,
  ChevronDown,
  RefreshCw,
  Users,
} from 'lucide-react'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  type Notification,
  type NotificationType,
} from '@/lib/notifications/actions'

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<NotificationType, typeof MessageSquare> = {
  message: MessageSquare,
  message_reaction: MessageSquare,
  request_received: FileText,
  request_approved: Check,
  request_rejected: X,
  assignment_new: Briefcase,
  assignment_graded: Award,
  assignment_due: AlertCircle,
  news_published: Newspaper,
  payment_received: Wallet,
  payment_sent: Wallet,
  badge_earned: Award,
  system: Settings,
  admin_alert: AlertCircle,
  security: Shield,
  community_update: Users,
}

// Color mapping for notification types
const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  message: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  message_reaction: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  request_received: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  request_approved: 'text-primary bg-primary/10 border-primary/20',
  request_rejected: 'text-destructive bg-destructive/10 border-destructive/20',
  assignment_new: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  assignment_graded: 'text-primary bg-primary/10 border-primary/20',
  assignment_due: 'text-orange bg-orange/10 border-orange/20',
  news_published: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  payment_received: 'text-primary bg-primary/10 border-primary/20',
  payment_sent: 'text-orange bg-orange/10 border-orange/20',
  badge_earned: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  system: 'text-muted-foreground bg-muted border-border',
  admin_alert: 'text-destructive bg-destructive/10 border-destructive/20',
  security: 'text-red-400 bg-red-400/10 border-red-400/20',
  community_update: 'text-primary bg-primary/10 border-primary/20',
}

// Filter categories
const FILTER_OPTIONS = [
  { key: 'all', label: 'All', types: null },
  { key: 'unread', label: 'Unread', types: null, unreadOnly: true },
  { key: 'messages', label: 'Messages', types: ['message', 'message_reaction'] },
  { key: 'requests', label: 'Requests', types: ['request_received', 'request_approved', 'request_rejected'] },
  { key: 'assignments', label: 'Assignments', types: ['assignment_new', 'assignment_graded', 'assignment_due'] },
  { key: 'payments', label: 'Payments', types: ['payment_received', 'payment_sent'] },
  { key: 'system', label: 'System', types: ['system', 'admin_alert', 'security'] },
]

// Format relative time
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

// Format type label
function formatTypeLabel(type: NotificationType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Notification Card Component
function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell
  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-muted-foreground bg-muted border-border'
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    await onDelete(notification.id)
  }

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!notification.is_read) {
      await onMarkAsRead(notification.id)
    }
  }

  const cardContent = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`group relative flex items-start gap-4 p-4 bg-card border rounded-[4px] transition-all hover:border-primary/30 ${
        notification.is_read ? 'border-border' : 'border-primary/40 bg-primary/5'
      }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-[4px] border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[12px] font-medium leading-snug ${notification.is_read ? 'text-foreground/80' : 'text-foreground'}`}>
              {notification.title}
            </p>
            {notification.body && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                {notification.body}
              </p>
            )}
          </div>
          {!notification.is_read && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-0.5" />
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <span className="mono-xs text-[9px] text-muted-foreground/60">
            {formatRelativeTime(notification.created_at)}
          </span>
          <span className="text-border">|</span>
          <span className={`mono-xs text-[9px] px-1.5 py-0.5 rounded-[2px] ${colorClass}`}>
            {formatTypeLabel(notification.type)}
          </span>
        </div>
      </div>

      {/* Actions - show on hover */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.is_read && (
          <button
            onClick={handleMarkRead}
            className="p-1.5 rounded-[2px] bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-[2px] bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          title="Delete"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  )

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} onClick={handleMarkRead}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)

  const LIMIT = 20

  // Fetch notifications
  const loadNotifications = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    const filter = FILTER_OPTIONS.find(f => f.key === activeFilter)
    const options: { limit: number; offset: number; type?: NotificationType; unreadOnly?: boolean } = {
      limit: LIMIT,
      offset: append ? notifications.length : 0,
    }

    if (filter?.unreadOnly) {
      options.unreadOnly = true
    }

    const { notifications: notifs, total: t, unreadCount: uc } = await fetchNotifications(options)

    // Filter by types client-side if needed (for grouped filters)
    let filteredNotifs = notifs
    if (filter?.types) {
      filteredNotifs = notifs.filter(n => filter.types!.includes(n.type))
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredNotifs = filteredNotifs.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.body?.toLowerCase().includes(query)
      )
    }

    if (append) {
      setNotifications(prev => [...prev, ...filteredNotifs])
    } else {
      setNotifications(filteredNotifs)
    }
    setTotal(t)
    setUnreadCount(uc)
    setLoading(false)
    setLoadingMore(false)
  }, [activeFilter, searchQuery, notifications.length])

  // Initial load and filter changes
  useEffect(() => {
    loadNotifications()
  }, [activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadNotifications()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as read
  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    setUnreadCount(0)
    setShowBulkActions(false)
  }

  // Delete notification
  const handleDelete = async (id: string) => {
    await deleteNotification(id)
    const wasUnread = notifications.find(n => n.id === id)?.is_read === false
    setNotifications(prev => prev.filter(n => n.id !== id))
    setTotal(prev => prev - 1)
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // Delete all read
  const handleDeleteAllRead = async () => {
    await deleteAllReadNotifications()
    setNotifications(prev => prev.filter(n => !n.is_read))
    setTotal(unreadCount)
    setShowBulkActions(false)
  }

  // Refresh
  const handleRefresh = () => {
    loadNotifications()
  }

  const hasMore = notifications.length < total

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <span className="mono-xs text-muted-foreground text-[10px]">/ 15</span>
            <span className="mono-xs text-muted-foreground text-[10px]">—</span>
            <h1 className="mono-xs text-primary text-[11px] tracking-wider">NOTIFICATIONS</h1>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 ml-3">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-[2px] text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-[2px] text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Actions
              <ChevronDown className={`w-3 h-3 transition-transform ${showBulkActions ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showBulkActions && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-[4px] shadow-lg z-10 overflow-hidden"
                >
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all as read
                  </button>
                  <button
                    onClick={handleDeleteAllRead}
                    disabled={notifications.every(n => !n.is_read)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete all read
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-[2px] text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-2 rounded-[2px] text-[10px] font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {filter.label}
              {filter.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-orange/20 text-orange rounded-full text-[9px]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-[12px] font-medium text-foreground mb-1">No notifications</h3>
            <p className="text-[11px] text-muted-foreground text-center max-w-xs">
              {activeFilter === 'unread'
                ? "You're all caught up! No unread notifications."
                : searchQuery
                  ? 'No notifications match your search.'
                  : "You don't have any notifications yet. They'll appear here when you receive messages, requests, or updates."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => loadNotifications(true)}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-[2px] text-[10px] text-foreground transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load more ({total - notifications.length} remaining)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
