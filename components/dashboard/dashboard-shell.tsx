'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Search,
  Sparkles,
  Activity,
  Radio,
  Newspaper,
  GraduationCap,
  Building2,
  Shield,
  HelpCircle,
  MessageSquare,
  FileText,
  Briefcase,
} from 'lucide-react'
import { signOut } from '@/lib/auth/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

export interface DashboardProfile {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  agroId: string | null
  role: string | null
  community: string | null
  communityLabel: string | null
  lga: string | null
  walletAddress: string | null
  weeklyRating: number | null
  operationalRating: number | null
  totalEarnings: number | null
  v1n3Balance: number | null
}

interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within DashboardShell')
  return ctx
}

const NAV_ITEMS = [
  { 
    section: 'CORE',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, index: '01' },
      { href: '/dashboard/communities', label: 'Communities', icon: Users, index: '02' },
      { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag, index: '03' },
      { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet, index: '04' },
      { href: '/dashboard/investments', label: 'Investments', icon: TrendingUp, index: '05' },
    ]
  },
  {
    section: 'ENGAGE',
    items: [
      { href: '/dashboard/feed', label: 'Feed', icon: Radio, index: '06' },
      { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, index: '07' },
      { href: '/dashboard/requests', label: 'Requests', icon: FileText, index: '08' },
      { href: '/dashboard/assignments', label: 'Assignments', icon: Briefcase, index: '09' },
      { href: '/dashboard/news', label: 'News', icon: Newspaper, index: '10' },
      { href: '/dashboard/training', label: 'Training', icon: GraduationCap, index: '11' },
    ]
  },
  {
    section: 'ADMIN',
    items: [
      { href: '/dashboard/organization', label: 'Organization', icon: Building2, index: '12' },
      { href: '/dashboard/security', label: 'Security', icon: Shield, index: '13' },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, index: '14' },
    ]
  },
]

export function DashboardShell({
  profile,
  children,
}: {
  profile: DashboardProfile
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [time, setTime] = useState('')
  const pathname = usePathname()

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

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const handleSignOut = async () => {
    await signOut()
  }

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    profile.displayName ||
    'EXECUTIVE'

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-background border-r border-border z-40 transition-all duration-300 ${
            collapsed ? 'w-[72px]' : 'w-[260px]'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-14 border-b border-border flex items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={32}
                height={32}
                className="w-8 h-8 flex-shrink-0"
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="mono text-sm tracking-wider whitespace-nowrap overflow-hidden"
                  >
                    <span className="text-foreground">GREEN</span>
                    <span className="text-primary">V1N3</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Search */}
          <div className={`px-3 py-3 border-b border-border ${collapsed ? 'hidden' : ''}`}>
            <div className="flex items-center gap-2.5 px-3 py-2 bg-secondary/50 border border-border rounded-[2px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none flex-1 mono-xs"
              />
              <span className="mono-xs text-muted-foreground/50 text-[9px]">⌘K</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {NAV_ITEMS.map((section) => (
              <div key={section.section}>
                {!collapsed && (
                  <p className="px-3 mb-2 mono-xs text-[9px] text-muted-foreground/60 tracking-[0.2em]">
                    / {section.section}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[2px] transition-all group ${
                          isActive
                            ? 'bg-primary/10 border border-primary/30'
                            : 'border border-transparent hover:bg-secondary/70 hover:border-border'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        {!collapsed && (
                          <>
                            <span className={`mono-xs text-[11px] flex-1 ${isActive ? 'text-primary' : 'text-foreground/80'}`}>
                              {item.label}
                            </span>
                            <span className="mono-xs text-[9px] text-muted-foreground/40">{item.index}</span>
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Section */}
          <div className="border-t border-border p-3">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="mono-xs text-[11px] text-foreground truncate">{fullName}</p>
                  <p className="mono-xs text-[9px] text-muted-foreground truncate">
                    {profile.agroId ?? 'NO ID'}
                  </p>
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
                className="lg:hidden fixed top-0 left-0 h-screen w-[280px] bg-background border-r border-border z-50 flex flex-col"
              >
                {/* Mobile Header */}
                <div className="h-14 border-b border-border flex items-center justify-between px-4">
                  <Link href="/" className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="GreenV1n3" width={32} height={32} className="w-8 h-8" />
                    <span className="mono text-sm tracking-wider">
                      <span className="text-foreground">GREEN</span>
                      <span className="text-primary">V1N3</span>
                    </span>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="px-3 py-3 border-b border-border">
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
                    />
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                  {NAV_ITEMS.map((section) => (
                    <div key={section.section}>
                      <p className="px-3 mb-2 mono-xs text-[9px] text-muted-foreground/60 tracking-[0.2em]">
                        / {section.section}
                      </p>
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href))
                          const Icon = item.icon

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-3 px-3 py-3 rounded-[2px] transition-all ${
                                isActive
                                  ? 'bg-primary/10 border border-primary/30'
                                  : 'border border-transparent hover:bg-secondary/70'
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`mono-sm text-xs flex-1 ${isActive ? 'text-primary' : 'text-foreground/80'}`}>
                                {item.label}
                              </span>
                              <span className="mono-xs text-[9px] text-muted-foreground/40">{item.index}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </nav>

                {/* Mobile User Section */}
                <div className="border-t border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="mono-sm text-xs text-foreground truncate">{fullName}</p>
                      <p className="mono-xs text-[10px] text-muted-foreground truncate">
                        {profile.agroId ?? 'NO ID'}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <span className="status-dot status-dot-pulse" />
                <span className="mono-xs text-muted-foreground text-[10px]">SOLANA</span>
                <span className="text-border-strong/50">/</span>
                <span className="mono-xs text-foreground/80 text-[10px]">V1N3: N3,002.40</span>
                <span className="mono-xs text-primary text-[10px]">+2.4%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="mono-xs text-muted-foreground text-[10px]">{time} WAT</span>
              <ThemeToggle />
              <NotificationDropdown />
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
