'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Shield,
  MessageSquare,
  Megaphone,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  Home,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Activity,
  TrendingUp,
  ChevronDown,
  UserCog,
  Layers,
  MapPin,
  Calendar,
  XCircle,
  Check,
  Loader2,
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  fetchAllUsers, 
  updateUserRole, 
  updateUserStatus, 
  updateVerificationStatus,
  type UserProfile,
  type UserRole 
} from '@/lib/admin/actions'
import {
  fetchBroadcasts,
  createAndSendBroadcast,
  deleteBroadcast,
  getBroadcastStats,
  type Broadcast,
  type BroadcastAudience,
  type BroadcastPriority,
} from '@/lib/admin/broadcast-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AdminDashboardProps {
  profile: {
    displayName: string | null
    email: string | null
    agroId: string | null
  }
  stats: {
    totalUsers: number
    pendingVerifications: number
    activeExecutives: number
  }
}

type AdminTab = 'overview' | 'users' | 'verifications' | 'messages' | 'broadcast' | 'reports' | 'settings'

const ADMIN_NAV: { href: string; label: string; icon: React.ElementType; tab: AdminTab; index: string }[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3, tab: 'overview', index: '01' },
  { href: '/admin/users', label: 'User Management', icon: UserCog, tab: 'users', index: '02' },
  { href: '/admin/verifications', label: 'Verifications', icon: UserCheck, tab: 'verifications', index: '03' },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare, tab: 'messages', index: '04' },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone, tab: 'broadcast', index: '05' },
  { href: '/admin/reports', label: 'Reports', icon: AlertTriangle, tab: 'reports', index: '06' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, tab: 'settings', index: '07' },
]

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: 'user', label: 'EXPLORER', color: 'text-muted-foreground bg-secondary' },
  { value: 'agro_executive', label: 'EXECUTIVE', color: 'text-primary bg-primary/10' },
  { value: 'gcm', label: 'GCM', color: 'text-orange bg-orange/10' },
  { value: 'lgpa', label: 'LGPA', color: 'text-accent bg-accent/10' },
  { value: 'scc_member', label: 'SCC', color: 'text-blue-400 bg-blue-400/10' },
  { value: 'admin', label: 'ADMIN', color: 'text-destructive bg-destructive/10' },
]

const ROLE_LABELS: Record<string, string> = {
  agro_executive: 'EXECUTIVE',
  gcm: 'GCM',
  lgpa: 'LGPA',
  scc_member: 'SCC',
  admin: 'ADMIN',
  user: 'EXPLORER',
}

const COMMUNITIES = [
  'Crop Farming', 'Animal Farming', 'Agro Marketing', 'Agro Processing',
  'Agro Management & Legislation', 'Agro Tourism', 'Agro Technology',
  'Agro Health Care', 'Agro Media & Branding', 'Agro Security',
  'Agro Literature', 'Agro Motivation & Training', 'Agro Real Estate',
  'Agro Logistics'
]

export function AdminDashboard({ profile, stats }: AdminDashboardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      setTime(`${hours}:${mins}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-background border-r border-border z-40 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[280px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded bg-orange/10 border border-orange/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-orange" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <span className="mono text-sm tracking-wider whitespace-nowrap">
                    <span className="text-foreground">GREEN</span>
                    <span className="text-primary">V1N3</span>
                  </span>
                  <p className="mono-xs text-orange text-[9px]">ADMIN PANEL</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Back to Dashboard */}
        <div className={`px-3 py-4 border-b border-border ${collapsed ? 'px-2' : ''}`}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="mono-xs text-[11px]">Back to Dashboard</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const isActive = activeTab === item.tab
              const Icon = item.icon

              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-all ${
                    isActive
                      ? 'bg-orange/10 border border-orange/30'
                      : 'border border-transparent hover:bg-secondary/70 hover:border-border'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-orange' : 'text-muted-foreground'}`} />
                  {!collapsed && (
                    <>
                      <span className={`mono-xs text-[11px] flex-1 text-left ${isActive ? 'text-orange' : 'text-foreground/80'}`}>
                        {item.label}
                      </span>
                      <span className="mono-xs text-[9px] text-muted-foreground/40">{item.index}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Admin Profile Section */}
        <div className="border-t border-border p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded bg-orange/10 border border-orange/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-orange" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="mono-xs text-[11px] text-foreground truncate">{profile.displayName ?? 'ADMIN'}</p>
                <p className="mono-xs text-[9px] text-orange truncate">ADMINISTRATOR</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 h-screen w-[300px] bg-background border-r border-border z-50 flex flex-col"
            >
              <div className="h-16 border-b border-border flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-orange/10 border border-orange/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange" />
                  </div>
                  <div>
                    <span className="mono text-sm tracking-wider">
                      <span className="text-foreground">GREEN</span>
                      <span className="text-primary">V1N3</span>
                    </span>
                    <p className="mono-xs text-orange text-[9px]">ADMIN PANEL</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                {ADMIN_NAV.map((item) => {
                  const isActive = activeTab === item.tab
                  const Icon = item.icon
                  return (
                    <button
                      key={item.tab}
                      onClick={() => {
                        setActiveTab(item.tab)
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-all ${
                        isActive ? 'bg-orange/10 border border-orange/30' : 'border border-transparent hover:bg-secondary/70'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-orange' : 'text-muted-foreground'}`} />
                      <span className={`mono-xs text-[11px] flex-1 text-left ${isActive ? 'text-orange' : 'text-foreground/80'}`}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange/10 rounded border border-orange/30">
              <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              <span className="mono-xs text-orange text-[10px]">ADMIN MODE</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="mono-xs text-muted-foreground text-[10px] hidden sm:block">{time} WAT</span>
            <ThemeToggle />
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab stats={stats} />}
              {activeTab === 'users' && <UserManagementTab />}
              {activeTab === 'verifications' && <VerificationsTab />}
              {activeTab === 'messages' && <MessagesTab />}
              {activeTab === 'broadcast' && <BroadcastTab />}
              {activeTab === 'reports' && <ReportsTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// Overview Tab with improved stats grid
function OverviewTab({ stats }: { stats: AdminDashboardProps['stats'] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-orange rounded-full" />
          <div>
            <h1 className="mono text-lg text-foreground">Admin Overview</h1>
            <p className="mono-xs text-muted-foreground text-[10px]">GREENV1N3 PLATFORM STATISTICS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono-xs text-muted-foreground text-[9px]">Last updated: just now</span>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          index="01" 
          label="TOTAL USERS" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users className="w-5 h-5" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          index="02" 
          label="PENDING VERIFICATIONS" 
          value={stats.pendingVerifications.toString()} 
          icon={<Clock className="w-5 h-5" />} 
          accent 
        />
        <StatCard 
          index="03" 
          label="ACTIVE EXECUTIVES" 
          value={stats.activeExecutives.toLocaleString()} 
          icon={<UserCheck className="w-5 h-5" />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard 
          index="04" 
          label="COMMUNITIES" 
          value="14" 
          icon={<Layers className="w-5 h-5" />} 
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 border border-border rounded bg-card">
          <div className="px-4 h-12 border-b border-border flex items-center justify-between">
            <span className="mono-xs text-muted-foreground text-[10px] tracking-wider">/ RECENT ACTIVITY</span>
            <button className="mono-xs text-primary text-[10px] hover:underline">VIEW ALL</button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {[
                { action: 'New registration', user: 'Ibrahim Musa', time: '2 min ago', type: 'signup' },
                { action: 'Verification approved', user: 'Amina Yusuf', time: '15 min ago', type: 'verify' },
                { action: 'Role changed to GCM', user: 'Chidi Okonkwo', time: '1 hour ago', type: 'role' },
                { action: 'New registration', user: 'Fatima Bello', time: '2 hours ago', type: 'signup' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded border border-border hover:border-border-strong transition-colors">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    item.type === 'signup' ? 'bg-primary/10 text-primary' :
                    item.type === 'verify' ? 'bg-orange/10 text-orange' :
                    'bg-accent/10 text-accent'
                  }`}>
                    {item.type === 'signup' && <Users className="w-4 h-4" />}
                    {item.type === 'verify' && <CheckCircle className="w-4 h-4" />}
                    {item.type === 'role' && <UserCog className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mono-xs text-[11px] text-foreground">{item.action}</p>
                    <p className="mono-xs text-[9px] text-muted-foreground">{item.user}</p>
                  </div>
                  <span className="mono-xs text-[9px] text-muted-foreground/60">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Community Distribution */}
        <div className="border border-border rounded bg-card">
          <div className="px-4 h-12 border-b border-border flex items-center">
            <span className="mono-xs text-muted-foreground text-[10px] tracking-wider">/ ROLE DISTRIBUTION</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { role: 'Agro Executives', count: stats.activeExecutives, color: 'bg-primary' },
              { role: 'GCMs', count: 42, color: 'bg-orange' },
              { role: 'LGPAs', count: 17, color: 'bg-accent' },
              { role: 'SCC Members', count: 8, color: 'bg-blue-400' },
              { role: 'Explorers', count: 156, color: 'bg-muted-foreground' },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="mono-xs text-[10px] text-foreground/80">{item.role}</span>
                  <span className="mono-xs text-[10px] text-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Comprehensive User Management Tab
function UserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { users: fetchedUsers, total, error } = await fetchAllUsers({
      search: searchQuery || undefined,
      role: roleFilter,
      status: statusFilter,
      limit: pageSize,
      offset: page * pageSize,
    })
    
    if (!error) {
      setUsers(fetchedUsers)
      setTotalUsers(total)
    }
    setLoading(false)
  }, [searchQuery, roleFilter, statusFilter, page])

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [loadUsers])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        loadUsers()
        setEditRoleOpen(false)
        setSelectedUser(null)
      }
    })
  }

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await updateUserStatus(userId, !currentStatus)
      if (result.success) {
        loadUsers()
      }
    })
  }

  const totalPages = Math.ceil(totalUsers / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full" />
          <div>
            <h1 className="mono text-lg text-foreground">User Management</h1>
            <p className="mono-xs text-muted-foreground text-[10px]">{totalUsers} TOTAL USERS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadUsers()}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded hover:bg-secondary/50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            <span className="mono-xs text-[10px]">REFRESH</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded hover:bg-secondary/50 transition-colors">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="mono-xs text-[10px]">EXPORT</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/50 border border-border rounded flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
            placeholder="Search by name, email, or Agro ID..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1 font-sans"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(0); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 bg-secondary/50 border border-border rounded mono-xs text-[11px] text-foreground outline-none focus:border-primary/50"
        >
          <option value="all">All Roles</option>
          <option value="user">Explorers</option>
          <option value="agro_executive">Executives</option>
          <option value="gcm">GCMs</option>
          <option value="lgpa">LGPAs</option>
          <option value="scc_member">SCC Members</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 bg-secondary/50 border border-border rounded mono-xs text-[11px] text-foreground outline-none focus:border-primary/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending Verification</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">USER</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">AGRO ID</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">ROLE</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">COMMUNITY</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">JOINED</th>
                <th className="px-4 py-3 text-right mono-xs text-[9px] text-muted-foreground tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
                    <span className="mono-xs text-muted-foreground">Loading users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="mono-xs text-muted-foreground">No users found</span>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center mono-xs text-primary text-[10px] font-bold flex-shrink-0">
                          {(user.display_name || user.first_name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="mono-xs text-[11px] text-foreground truncate">
                            {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed'}
                          </p>
                          <p className="mono-xs text-[9px] text-muted-foreground truncate">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono-xs text-[10px] text-primary">{user.agro_id || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded mono-xs text-[9px] ${
                        ROLE_OPTIONS.find(r => r.value === user.role)?.color || 'bg-secondary text-foreground/70'
                      }`}>
                        {ROLE_LABELS[user.role] ?? user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono-xs text-[10px] text-foreground/80 truncate block max-w-[120px]">
                        {user.community || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                        disabled={isPending}
                        className={`flex items-center gap-1.5 mono-xs text-[9px] px-2 py-1 rounded transition-colors ${
                          user.is_active 
                            ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                            : 'text-muted-foreground bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono-xs text-[10px] text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => { setSelectedUser(user); setEditRoleOpen(true); }}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Change Role"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="mono-xs text-[10px] text-muted-foreground">
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalUsers)} of {totalUsers}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="mono-xs text-[10px] text-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="mono text-foreground">Change User Role</DialogTitle>
            <DialogDescription className="mono-xs text-muted-foreground">
              Update the role for {selectedUser?.display_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  onClick={() => selectedUser && handleRoleChange(selectedUser.id, role.value)}
                  disabled={isPending || selectedUser?.role === role.value}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded border transition-colors ${
                    selectedUser?.role === role.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border-strong hover:bg-secondary/50'
                  } disabled:opacity-50`}
                >
                  <span className={`mono-xs text-[11px] ${role.color.split(' ')[0]}`}>{role.label}</span>
                  {selectedUser?.role === role.value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)} className="mono-xs">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Verifications Tab
function VerificationsTab() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function loadPending() {
      const { users: fetchedUsers } = await fetchAllUsers({
        status: 'pending',
        limit: 50,
      })
      setUsers(fetchedUsers)
      setLoading(false)
    }
    loadPending()
  }, [])

  const handleVerification = async (userId: string, status: 'verified' | 'rejected') => {
    startTransition(async () => {
      const result = await updateVerificationStatus(userId, status)
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== userId))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-orange rounded-full" />
        <div>
          <h1 className="mono text-lg text-foreground">Verification Requests</h1>
          <p className="mono-xs text-muted-foreground text-[10px]">{users.length} PENDING VERIFICATIONS</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="border border-border rounded p-12 text-center bg-card">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="mono-sm text-foreground mb-2">All Caught Up!</h3>
          <p className="mono-xs text-muted-foreground text-[11px]">No pending verifications at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="border border-border rounded p-5 bg-card hover:border-border-strong transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded bg-orange/10 border border-orange/30 flex items-center justify-center mono text-orange font-bold flex-shrink-0">
                    {(user.display_name || user.first_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="mono-sm text-foreground text-[13px]">
                      {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                    </h3>
                    <p className="mono-xs text-muted-foreground text-[10px] mb-3">{user.email}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-orange/10 border border-orange/30 rounded mono-xs text-orange text-[9px]">
                        {ROLE_LABELS[user.role] ?? user.role.toUpperCase()}
                      </span>
                      {user.community && (
                        <span className="px-2.5 py-1 bg-secondary border border-border rounded mono-xs text-foreground/70 text-[9px]">
                          {user.community}
                        </span>
                      )}
                      {user.lga && (
                        <span className="px-2.5 py-1 bg-secondary border border-border rounded mono-xs text-foreground/70 text-[9px] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.lga}
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-secondary border border-border rounded mono-xs text-foreground/70 text-[9px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <button 
                    onClick={() => handleVerification(user.id, 'verified')}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="mono-xs text-primary text-[10px]">APPROVE</span>
                  </button>
                  <button 
                    onClick={() => handleVerification(user.id, 'rejected')}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/30 rounded hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="mono-xs text-destructive text-[10px]">REJECT</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Messages Tab
function MessagesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-primary rounded-full" />
        <div>
          <h1 className="mono text-lg text-foreground">Message Center</h1>
          <p className="mono-xs text-muted-foreground text-[10px]">ADMIN COMMUNICATIONS</p>
        </div>
      </div>

      <div className="border border-border rounded p-12 text-center bg-card">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="mono-sm text-foreground mb-2">Message Center</h3>
        <p className="mono-xs text-muted-foreground text-[11px] max-w-md mx-auto">
          View and manage user messages, support tickets, and system notifications from this central hub.
        </p>
      </div>
    </div>
  )
}

// Broadcast Tab
function BroadcastTab() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<BroadcastAudience>('all')
  const [priority, setPriority] = useState<BroadcastPriority>('normal')
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState({ total: 0, sent: 0, draft: 0, scheduled: 0, totalRecipients: 0, totalReads: 0 })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Load broadcasts and stats
  useEffect(() => {
    async function load() {
      const [broadcastsResult, statsResult] = await Promise.all([
        fetchBroadcasts({ limit: 10 }),
        getBroadcastStats()
      ])
      setBroadcasts(broadcastsResult.broadcasts)
      setStats(statsResult)
      setLoading(false)
    }
    load()
  }, [])

  // Send broadcast
  async function handleSend() {
    if (!title.trim() || !message.trim()) return

    setSending(true)
    setSuccessMessage('')
    setErrorMessage('')

    const { recipientsCount, broadcast, error } = await createAndSendBroadcast({
      title: title.trim(),
      message: message.trim(),
      audience,
      priority,
    })

    setSending(false)

    if (error) {
      setErrorMessage(error)
      return
    }

    setSuccessMessage(`Broadcast sent to ${recipientsCount.toLocaleString()} recipients!`)
    setTitle('')
    setMessage('')
    setAudience('all')
    setPriority('normal')

    // Refresh broadcasts list
    if (broadcast) {
      setBroadcasts(prev => [{ ...broadcast, status: 'sent', recipients_count: recipientsCount } as Broadcast, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        sent: prev.sent + 1,
        totalRecipients: prev.totalRecipients + recipientsCount,
      }))
    }
  }

  // Delete broadcast
  async function handleDelete(id: string) {
    const { success } = await deleteBroadcast(id)
    if (success) {
      setBroadcasts(prev => prev.filter(b => b.id !== id))
    }
  }

  const audienceLabels: Record<BroadcastAudience, string> = {
    all: 'All Users',
    executives: 'Agro Executives',
    gcm: 'GCMs Only',
    lgpa: 'LGPAs Only',
    scc: 'SCC Members',
    admins: 'Admins Only',
  }

  const priorityColors: Record<BroadcastPriority, string> = {
    low: 'text-muted-foreground bg-secondary',
    normal: 'text-primary bg-primary/10',
    high: 'text-orange bg-orange/10',
    urgent: 'text-destructive bg-destructive/10',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-accent rounded-full" />
        <div>
          <h1 className="mono text-lg text-foreground">Broadcast Message</h1>
          <p className="mono-xs text-muted-foreground text-[10px]">SEND ANNOUNCEMENTS TO USERS</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <span className="mono-xs text-[9px] text-muted-foreground">TOTAL</span>
          </div>
          <p className="mono text-2xl text-foreground">{stats.total}</p>
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Send className="w-4 h-4 text-primary" />
            <span className="mono-xs text-[9px] text-muted-foreground">SENT</span>
          </div>
          <p className="mono text-2xl text-foreground">{stats.sent}</p>
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4 text-orange" />
            <span className="mono-xs text-[9px] text-muted-foreground">RECIPIENTS</span>
          </div>
          <p className="mono text-2xl text-foreground">{stats.totalRecipients.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-4 h-4 text-accent" />
            <span className="mono-xs text-[9px] text-muted-foreground">READS</span>
          </div>
          <p className="mono text-2xl text-foreground">{stats.totalReads.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="border border-border rounded bg-card">
          <div className="px-4 h-12 border-b border-border flex items-center">
            <span className="mono-xs text-muted-foreground text-[10px] tracking-wider">/ COMPOSE MESSAGE</span>
          </div>
          <div className="p-5 space-y-5">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span className="mono-xs text-primary text-[11px]">{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span className="mono-xs text-destructive text-[11px]">{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter broadcast title..."
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">AUDIENCE</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as BroadcastAudience)}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="all">All Users</option>
                  <option value="executives">Agro Executives Only</option>
                  <option value="gcm">GCMs Only</option>
                  <option value="lgpa">LGPAs Only</option>
                  <option value="scc">SCC Members Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
              <div>
                <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">PRIORITY</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as BroadcastPriority)}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded text-sm text-foreground outline-none focus:border-primary/50"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">MESSAGE</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your broadcast message..."
                rows={6}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 resize-none transition-colors"
              />
            </div>

            <button 
              onClick={handleSend}
              disabled={!title.trim() || !message.trim() || sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange text-background rounded hover:bg-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="mono-xs text-[11px]">{sending ? 'SENDING...' : 'SEND BROADCAST'}</span>
            </button>
          </div>
        </div>

        {/* Recent Broadcasts */}
        <div className="border border-border rounded bg-card">
          <div className="px-4 h-12 border-b border-border flex items-center justify-between">
            <span className="mono-xs text-muted-foreground text-[10px] tracking-wider">/ RECENT BROADCASTS</span>
            {loading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {!loading && broadcasts.length === 0 ? (
              <div className="p-8 text-center">
                <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="mono-xs text-muted-foreground text-[11px]">No broadcasts yet</p>
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="mono-xs text-foreground text-[11px] font-medium">{b.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded mono-xs text-[8px] ${priorityColors[b.priority]}`}>
                        {b.priority.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="mono-xs text-muted-foreground text-[10px] mb-2 line-clamp-2">{b.message}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2 py-1 bg-secondary border border-border rounded mono-xs text-foreground/70 text-[9px]">
                      {audienceLabels[b.audience]}
                    </span>
                    <span className="flex items-center gap-1 mono-xs text-muted-foreground text-[9px]">
                      <Users className="w-3 h-3" />
                      {b.recipients_count.toLocaleString()} sent
                    </span>
                    <span className="flex items-center gap-1 mono-xs text-muted-foreground text-[9px]">
                      <Eye className="w-3 h-3" />
                      {b.reads_count.toLocaleString()} reads
                    </span>
                    <span className="mono-xs text-muted-foreground/50 text-[9px]">
                      {b.sent_at ? new Date(b.sent_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Draft'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Reports Tab
function ReportsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-destructive rounded-full" />
        <div>
          <h1 className="mono text-lg text-foreground">Reports</h1>
          <p className="mono-xs text-muted-foreground text-[10px]">USER REPORTS & FLAGS</p>
        </div>
      </div>

      <div className="border border-border rounded p-12 text-center bg-card">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="mono-sm text-foreground mb-2">Reports Center</h3>
        <p className="mono-xs text-muted-foreground text-[11px] max-w-md mx-auto">
          View and manage user reports, flagged content, and policy violations.
        </p>
      </div>
    </div>
  )
}

// Settings Tab
function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-muted-foreground rounded-full" />
        <div>
          <h1 className="mono text-lg text-foreground">Settings</h1>
          <p className="mono-xs text-muted-foreground text-[10px]">PLATFORM CONFIGURATION</p>
        </div>
      </div>

      <div className="border border-border rounded p-12 text-center bg-card">
        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="mono-sm text-foreground mb-2">Platform Settings</h3>
        <p className="mono-xs text-muted-foreground text-[11px] max-w-md mx-auto">
          Configure platform settings, manage community options, and set system preferences.
        </p>
      </div>
    </div>
  )
}

// Enhanced Stat Card Component
function StatCard({ 
  index, 
  label, 
  value, 
  icon, 
  accent,
  trend,
  trendUp,
}: { 
  index: string
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className={`border rounded p-5 transition-colors ${accent ? 'border-orange/30 bg-orange/5 hover:border-orange/50' : 'border-border bg-card hover:border-border-strong'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="mono-xs text-muted-foreground/50 text-[9px]">{index}</span>
        <div className={`w-10 h-10 rounded flex items-center justify-center ${accent ? 'bg-orange/10 text-orange' : 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
      </div>
      <p className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-1">/ {label}</p>
      <div className="flex items-end justify-between">
        <p className={`font-mono text-2xl sm:text-3xl tracking-tight ${accent ? 'text-orange' : 'text-foreground'}`}>{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded mono-xs text-[9px] ${trendUp ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}
