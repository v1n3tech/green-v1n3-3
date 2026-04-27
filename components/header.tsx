'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Menu, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Vision', href: '#vision', number: '01' },
  { label: 'Communities', href: '#communities', number: '02' },
  { label: 'How it works', href: '#how-it-works', number: '03' },
  { label: 'Token', href: '#token', number: '04' },
  { label: 'Structure', href: '#structure', number: '05' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Top Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2 text-xs font-mono tracking-wider">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">SOLANA MAINNET</span>
            </div>
            <span className="text-muted-foreground/60">V0.1.0 / BUILD 0427</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">SOL <span className="text-foreground">187.42</span></span>
            <span className="text-primary font-semibold">V1N3 PRE-LAUNCH</span>
            <span className="text-muted-foreground hidden sm:block">17:17WAT</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="fixed top-8 left-0 right-0 z-40 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="GreenV1n3"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-mono text-lg tracking-tight">
              Green<span className="text-primary">V1n3</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-primary/70 font-mono text-xs">/{item.number}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="hidden sm:flex gap-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground font-mono text-xs"
            >
              <Wallet className="size-3.5" />
              CONNECT WALLET
            </Button>
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-12">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="GreenV1n3"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                  <span className="font-mono text-lg">
                    Green<span className="text-primary">V1n3</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center justify-between py-4 border-b border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-mono text-sm">/{item.number}</span>
                        <span className="text-2xl font-mono">{item.label}</span>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="pt-6 border-t border-border/30">
                <Button className="w-full gap-2 bg-primary text-primary-foreground font-mono">
                  <Wallet className="size-4" />
                  CONNECT WALLET
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
