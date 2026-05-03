'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  HelpCircle,
  LogOut,
  Home,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Activity,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

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

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: BarChart3, index: '01' },
  { href: '/admin/users', label: 'Users', icon: Users, index: '02' },
  { href: '/admin/verifications', label: 'Verifications', icon: UserCheck, index: '03' },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare, index: '04' },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone, index: '05' },
  { href: '/admin/reports', label: 'Reports', icon: AlertTriangle, index: '06' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, index: '07' },
]

// Mock data for users
const MOCK_USERS = [
  { id: '1', name: 'Ibrahim Musa', email: 'ibrahim@example.com', role: 'agro_executive', community: 'Crop Farming', status: 'active', verified: true, joined: '2026-04-15' },
  { id: '2', name: 'Amina Yusuf', email: 'amina@example.com', role: 'agro_executive', community: 'Animal Farming', status: 'active', verified: true, joined: '2026-04-18' },
  { id: '3', name: 'Chidi Okonkwo', email: 'chidi@example.com', role: 'gcm', community: 'Agro Technology', status: 'active', verified: true, joined: '2026-04-20' },
  { id: '4', name: 'Fatima Bello', email: 'fatima@example.com', role: 'user', community: null, status: 'pending', verified: false, joined: '2026-05-01' },
  { id: '5', name: 'David Akpan', email: 'david@example.com', role: 'lgpa', community: 'Agro Marketing', status: 'active', verified: true, joined: '2026-05-02' },
]

// Mock pending verifications
const PENDING_VERIFICATIONS = [
  { id: '1', name: 'Fatima Bello', email: 'fatima@example.com', requestedRole: 'agro_executive', community: 'Crop Farming', submitted: '2026-05-01', documents: 3 },
  { id: '2', name: 'Usman Garba', email: 'usman@example.com', requestedRole: 'gcm', community: 'Animal Farming', submitted: '2026-05-02', documents: 2 },
  { id: '3', name: 'Grace Eze', email: 'grace@example.com', requestedRole: 'agro_executive', community: 'Agro Processing', submitted: '2026-05-03', documents: 4 },
]

// Mock broadcasts
const RECENT_BROADCASTS = [
  { id: '1', title: 'Platform Update v2.1', audience: 'All Users', sent: '2026-05-01', reads: 1234 },
  { id: '2', title: 'New Community Guidelines', audience: 'Agro Executives', sent: '2026-04-28', reads: 890 },
  { id: '3', title: 'Marketplace Launch', audience: 'All Users', sent: '2026-04-25', reads: 2100 },
]

const ROLE_LABELS: Record<string, string> = {
  agro_executive: 'EXECUTIVE',
  gcm: 'GCM',
  lgpa: 'LGPA',
  scc_member: 'SCC',
  admin: 'ADMIN',
  user: 'EXPLORER',
}

export function AdminDashboard({ profile, stats }: AdminDashboardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verifications' | 'messages' | 'broadcast'>('overview')
  const [time, setTime] = useState('')

  useState(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      setTime(`${hours}:${mins}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  })

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-background border-r border-orange/20 z-40 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b border-orange/20 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-[2px] bg-orange/10 border border-orange/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-orange" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="mono text-sm tracking-wider whitespace-nowrap overflow-hidden"
                >
                  <span className="text-foreground">ADMIN</span>
                  <span className="text-orange">PANEL</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-orange/10 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Back to Dashboard */}
        <div className={`px-3 py-3 border-b border-orange/20 ${collapsed ? 'px-2' : ''}`}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-[2px] transition-colors"
          >
            <Home className="w-4 h-4" />
            {!collapsed && <span className="mono-xs text-[11px]">Back to Dashboard</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {ADMIN_NAV.map((item) => {
              const isActive = activeTab === item.label.toLowerCase()
              const Icon = item.icon

              return (
                <button
                  key={item.href}
                  onClick={() => setActiveTab(item.label.toLowerCase() as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[2px] transition-all ${
                    isActive
                      ? 'bg-orange/10 border border-orange/30'
                      : 'border border-transparent hover:bg-secondary/70 hover:border-border'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange' : 'text-muted-foreground'}`} />
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

        {/* User Section */}
        <div className="border-t border-orange/20 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-[2px] bg-orange/10 border border-orange/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-orange" />
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
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
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
              className="lg:hidden fixed top-0 left-0 h-screen w-[280px] bg-background border-r border-orange/20 z-50 flex flex-col"
            >
              {/* Mobile content mirrors desktop */}
              <div className="h-14 border-b border-orange/20 flex items-center justify-between px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[2px] bg-orange/10 border border-orange/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-orange" />
                  </div>
                  <span className="mono text-sm tracking-wider">
                    <span className="text-foreground">ADMIN</span>
                    <span className="text-orange">PANEL</span>
                  </span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-2">
                {ADMIN_NAV.map((item) => {
                  const isActive = activeTab === item.label.toLowerCase()
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setActiveTab(item.label.toLowerCase() as typeof activeTab)
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-[2px] transition-all ${
                        isActive ? 'bg-orange/10 border border-orange/30' : 'border border-transparent hover:bg-secondary/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange' : 'text-muted-foreground'}`} />
                      <span className={`mono-sm text-xs flex-1 text-left ${isActive ? 'text-orange' : 'text-foreground/80'}`}>
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
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur-sm border-b border-orange/20 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              <span className="mono-xs text-orange text-[10px]">ADMIN MODE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="mono-xs text-muted-foreground text-[10px]">{time} WAT</span>
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'verifications' && <VerificationsTab />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'broadcast' && <BroadcastTab />}
        </main>
      </div>
    </div>
  )
}

// Overview Tab
function OverviewTab({ stats }: { stats: AdminDashboardProps['stats'] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-orange" />
        <span className="mono-xs text-orange text-[10px] tracking-wider">/ ADMIN — OVERVIEW</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index="01" label="TOTAL USERS" value={stats.totalUsers.toLocaleString()} icon={<Users className="w-4 h-4" />} />
        <StatCard index="02" label="PENDING VERIFICATIONS" value={stats.pendingVerifications.toString()} icon={<Clock className="w-4 h-4" />} accent />
        <StatCard index="03" label="ACTIVE EXECUTIVES" value={stats.activeExecutives.toLocaleString()} icon={<UserCheck className="w-4 h-4" />} />
        <StatCard index="04" label="COMMUNITIES" value="14" icon={<Activity className="w-4 h-4" />} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Verifications */}
        <div className="border border-border rounded-[2px]">
          <div className="px-4 h-10 border-b border-border flex items-center justify-between">
            <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">/ PENDING VERIFICATIONS</span>
            <span className="mono-xs text-orange text-[9px]">{PENDING_VERIFICATIONS.length} PENDING</span>
          </div>
          <div className="divide-y divide-border">
            {PENDING_VERIFICATIONS.slice(0, 3).map((v) => (
              <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[2px] bg-orange/10 border border-orange/30 flex items-center justify-center mono-xs text-orange text-[9px] font-bold">
                    {v.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="mono-xs text-[11px] text-foreground truncate">{v.name}</p>
                    <p className="mono-xs text-[9px] text-muted-foreground">{v.requestedRole.toUpperCase()} • {v.documents} docs</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-primary hover:bg-primary/10 rounded-[2px] transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-destructive hover:bg-destructive/10 rounded-[2px] transition-colors">
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Broadcasts */}
        <div className="border border-border rounded-[2px]">
          <div className="px-4 h-10 border-b border-border flex items-center justify-between">
            <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">/ RECENT BROADCASTS</span>
            <button className="mono-xs text-primary text-[9px] hover:underline">VIEW ALL</button>
          </div>
          <div className="divide-y divide-border">
            {RECENT_BROADCASTS.map((b) => (
              <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="mono-xs text-[11px] text-foreground truncate">{b.title}</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">{b.audience} • {b.sent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-muted-foreground" />
                  <span className="mono-xs text-[10px] text-foreground">{b.reads.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Users Tab
function UsersTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-orange" />
          <span className="mono-xs text-orange text-[10px] tracking-wider">/ USER MANAGEMENT</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-[2px] hover:bg-secondary/50 transition-colors">
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="mono-xs text-[10px]">EXPORT</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-orange/10 border border-orange/30 rounded-[2px] hover:bg-orange/20 transition-colors">
            <Upload className="w-3.5 h-3.5 text-orange" />
            <span className="mono-xs text-orange text-[10px]">IMPORT</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border rounded-[2px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none flex-1 mono-xs"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-secondary/50 border border-border rounded-[2px] mono-xs text-[11px] text-foreground outline-none"
        >
          <option value="all">All Roles</option>
          <option value="agro_executive">Executives</option>
          <option value="gcm">GCMs</option>
          <option value="lgpa">LGPAs</option>
          <option value="user">Explorers</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">USER</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">ROLE</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">COMMUNITY</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-left mono-xs text-[9px] text-muted-foreground tracking-wider">JOINED</th>
                <th className="px-4 py-3 text-right mono-xs text-[9px] text-muted-foreground tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center mono-xs text-primary text-[9px] font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="mono-xs text-[11px] text-foreground">{user.name}</p>
                        <p className="mono-xs text-[9px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-[2px] mono-xs text-[9px] ${
                      user.role === 'agro_executive' ? 'bg-primary/10 text-primary' :
                      user.role === 'gcm' ? 'bg-orange/10 text-orange' :
                      'bg-secondary text-foreground/70'
                    }`}>
                      {ROLE_LABELS[user.role] ?? user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="mono-xs text-[10px] text-foreground/80">{user.community ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 mono-xs text-[9px] ${
                      user.status === 'active' ? 'text-primary' : 'text-accent'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-primary' : 'bg-accent'}`} />
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="mono-xs text-[10px] text-muted-foreground">{user.joined}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Verifications Tab
function VerificationsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-orange" />
        <span className="mono-xs text-orange text-[10px] tracking-wider">/ VERIFICATION REQUESTS</span>
      </div>

      <div className="grid gap-3">
        {PENDING_VERIFICATIONS.map((v) => (
          <div key={v.id} className="border border-border rounded-[2px] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[2px] bg-orange/10 border border-orange/30 flex items-center justify-center mono-xs text-orange font-bold">
                  {v.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="mono-sm text-foreground text-[13px]">{v.name}</h3>
                  <p className="mono-xs text-muted-foreground text-[10px] mb-2">{v.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-orange/10 border border-orange/30 rounded-[2px] mono-xs text-orange text-[9px]">
                      {v.requestedRole.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-secondary border border-border rounded-[2px] mono-xs text-foreground/70 text-[9px]">
                      {v.community}
                    </span>
                    <span className="px-2 py-1 bg-secondary border border-border rounded-[2px] mono-xs text-foreground/70 text-[9px]">
                      {v.documents} documents
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-[2px] hover:bg-primary/20 transition-colors">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="mono-xs text-primary text-[10px]">APPROVE</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-[2px] hover:bg-destructive/20 transition-colors">
                  <UserX className="w-4 h-4 text-destructive" />
                  <span className="mono-xs text-destructive text-[10px]">REJECT</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Messages Tab (Admin version - view all user messages/reports)
function MessagesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-orange" />
        <span className="mono-xs text-orange text-[10px] tracking-wider">/ MESSAGE CENTER</span>
      </div>

      <div className="border border-border rounded-[2px] p-8 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="mono-sm text-foreground mb-2">Admin Message Center</h3>
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
  const [audience, setAudience] = useState('all')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-orange" />
        <span className="mono-xs text-orange text-[10px] tracking-wider">/ BROADCAST MESSAGE</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compose */}
        <div className="border border-border rounded-[2px]">
          <div className="px-4 h-10 border-b border-border flex items-center">
            <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">/ COMPOSE</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter broadcast title..."
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] mono-xs text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-orange/50"
              />
            </div>
            <div>
              <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">AUDIENCE</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] mono-xs text-[11px] text-foreground outline-none focus:border-orange/50"
              >
                <option value="all">All Users</option>
                <option value="executives">Agro Executives Only</option>
                <option value="gcm">GCMs Only</option>
                <option value="lgpa">LGPAs Only</option>
              </select>
            </div>
            <div>
              <label className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-2 block">MESSAGE</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your broadcast message..."
                rows={6}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-[2px] mono-xs text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-orange/50 resize-none"
              />
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange/10 border border-orange/30 rounded-[2px] hover:bg-orange/20 transition-colors">
              <Send className="w-4 h-4 text-orange" />
              <span className="mono-xs text-orange text-[11px]">SEND BROADCAST</span>
            </button>
          </div>
        </div>

        {/* Recent */}
        <div className="border border-border rounded-[2px]">
          <div className="px-4 h-10 border-b border-border flex items-center">
            <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">/ RECENT BROADCASTS</span>
          </div>
          <div className="divide-y divide-border">
            {RECENT_BROADCASTS.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="mono-xs text-foreground text-[11px]">{b.title}</h4>
                  <span className="mono-xs text-muted-foreground text-[9px] shrink-0">{b.sent}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-secondary border border-border rounded-[2px] mono-xs text-foreground/70 text-[9px]">
                    {b.audience}
                  </span>
                  <span className="flex items-center gap-1 mono-xs text-muted-foreground text-[9px]">
                    <Eye className="w-3 h-3" />
                    {b.reads.toLocaleString()} reads
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  index, 
  label, 
  value, 
  icon, 
  accent 
}: { 
  index: string
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={`border rounded-[2px] p-4 ${accent ? 'border-orange/30 bg-orange/5' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="mono-xs text-muted-foreground/60 text-[9px]">{index}</span>
        <span className={accent ? 'text-orange' : 'text-primary'}>{icon}</span>
      </div>
      <p className="mono-xs text-muted-foreground text-[9px] tracking-wider mb-1">/ {label}</p>
      <p className={`font-mono text-2xl tracking-tight ${accent ? 'text-orange' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}
