'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Menu, X } from 'lucide-react'

const navItems = [
  { id: '01', label: 'Doctrine' },
  { id: '02', label: 'Infra' },
  { id: '03', label: 'Communities' },
  { id: '04', label: 'Chain' },
  { id: '05', label: 'V1n3' },
  { id: '06', label: 'Horizon' },
]

export function Header() {
  const [time, setTime] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      setTime(`${hours}:${mins}WAT`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm">
      {/* Status Bar */}
      <div className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-7 sm:h-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="status-dot status-dot-pulse" />
              <span className="mono-xs text-muted-foreground hidden xs:inline">NETWORK : </span>
              <span className="mono-xs text-muted-foreground">SOLANA</span>
            </div>
            <span className="hidden sm:inline text-border-strong">/</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="mono-xs text-foreground/90">V1N3 : N3,002.40</span>
              <span className="mono-xs text-primary">+2.4%</span>
            </div>
            <span className="hidden lg:inline text-border-strong">/</span>
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="mono-xs text-muted-foreground">PHASE 01 : PLATEAU</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-5">
            <span className="mono-xs text-muted-foreground">{time}</span>
            <span className="hidden sm:inline mono-xs text-primary hover:text-primary/80 cursor-pointer transition-colors">V1N3TECH.IO</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-border">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-12 sm:h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <Image
              src="/logo.png"
              alt="GreenV1n3"
              width={36}
              height={36}
              className="w-7 h-7 sm:w-9 sm:h-9"
            />
            <span className="mono text-sm sm:text-base tracking-wider">
              <span className="text-foreground">GREEN</span>
              <span className="text-primary">V1N3</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`#${item.label.toLowerCase()}`}
                className="flex items-center gap-1.5 px-5 py-2 group"
              >
                <span className="mono-xs text-muted-foreground/70 group-hover:text-primary transition-colors">{item.id}</span>
                <span className="mono-sm text-foreground/70 group-hover:text-foreground transition-colors">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/signin" className="hidden md:block mono-sm text-foreground/70 hover:text-foreground transition-colors">
              SIGN IN
            </Link>
            <button className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-primary/50 rounded-[2px] hover:border-primary hover:bg-primary/5 transition-all group">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="mono-xs sm:mono-sm text-primary hidden xs:inline">CONNECT</span>
              <span className="mono-xs sm:mono-sm text-primary xs:hidden">
                <Wallet className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border overflow-hidden"
          >
            <nav className="flex flex-col p-5 gap-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`#${item.label.toLowerCase()}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 border border-border rounded-[2px] card-hover"
                  >
                    <span className="mono-xs text-muted-foreground">{item.id}</span>
                    <span className="mono-sm text-foreground">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 flex items-center justify-center px-4 py-3.5 border border-border rounded-[2px] mono-sm text-foreground card-hover"
                >
                  SIGN IN
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
