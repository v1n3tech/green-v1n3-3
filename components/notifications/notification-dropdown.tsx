'use client'

import { useState, useEffect, useRef } from 'react'
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
  ChevronRight,
  Loader2,
} from 'lucide-react'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
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
}

// Color mapping for notification types
const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  message: 'text-blue-400 bg-blue-400/10',
  message_reaction: 'text-pink-400 bg-pink-400/10',
  request_received: 'text-yellow-400 bg-yellow-400/10',
  request_approved: 'text-primary bg-primary/10',
  request_rejected: 'text-destructive bg-destructive/10',
  assignment_new: 'text-purple-400 bg-purple-400/10',
  assignment_graded: 'text-primary bg-primary/10',
  assignment_due: 'text-orange bg-orange/10',
  news_published: 'text-cyan-400 bg-cyan-400/10',
  payment_received: 'text-primary bg-primary/10',
  payment_sent: 'text-orange bg-orange/10',
  badge_earned: 'text-yellow-400 bg-yellow-400/10',
  system: 'text-muted-foreground bg-muted',
  admin_alert: 'text-destructive bg-destructive/10',
  security: 'text-red-400 bg-red-400/10',
}

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
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Single notification item
function NotificationItem({
  notification,
  onRead,
  onClose,
}: {
  notification: Notification
  onRead: (id: string) => void
  onClose: () => void
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell
  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-muted-foreground bg-muted'

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id)
    }
    onClose()
  }

  const content = (
    <div
      className={`flex items-start gap-3 p-3 rounded-[2px] transition-all cursor-pointer group ${
        notification.is_read 
          ? 'bg-transparent hover:bg-secondary/50' 
          : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
      }`}
      onClick={handleClick}
    >
      <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] leading-snug ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-[9px] text-muted-foreground/50 mt-1 mono-xs">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
      )}
    </div>
  )

  if (notification.action_url) {
    return <Link href={notification.action_url}>{content}</Link>
  }

  return content
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchCount = async () => {
      const count = await getUnreadNotificationCount()
      setUnreadCount(count)
    }
    fetchCount()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchNotifications({ limit: 10 }).then(({ notifications: notifs, unreadCount: count }) => {
        setNotifications(notifs)
        setUnreadCount(count)
        setLoading(false)
      })
    }
  }, [isOpen])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true)
    await markAllNotificationsAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    setUnreadCount(0)
    setMarkingAllRead(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 flex items-center justify-center bg-orange text-[9px] text-white font-medium rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-popover border border-border rounded-[4px] shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="mono-xs text-[11px] tracking-wider text-foreground">NOTIFICATIONS</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAllRead}
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {markingAllRead ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3 h-3" />
                    )}
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-[11px] text-muted-foreground text-center">No notifications yet</p>
                  <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
                    {"You'll"} see updates about messages, requests, and more here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={handleMarkAsRead}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border text-[10px] text-primary hover:bg-primary/5 transition-colors"
              >
                View all notifications
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
