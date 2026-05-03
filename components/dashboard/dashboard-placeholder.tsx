'use client'

import { motion } from 'framer-motion'
import { Construction, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface DashboardPlaceholderProps {
  section: string
  title: string
  description: string
}

export function DashboardPlaceholder({ section, title, description }: DashboardPlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ {section} — {title.toUpperCase()}</span>
        </div>
      </div>

      {/* Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] bg-background border border-border rounded-[2px] p-8 text-center"
      >
        <div className="w-16 h-16 rounded-[2px] bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-mono text-xl sm:text-2xl text-foreground mb-3">{title}</h2>
        <p className="mono-xs text-[11px] text-muted-foreground max-w-md leading-relaxed mb-6">
          {description}
        </p>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary mono-xs text-[10px] rounded-[2px] hover:bg-primary/5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO OVERVIEW
        </Link>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-background border border-border rounded-[2px] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ MODULE STATUS</span>
          <span className="mono-xs text-[9px] text-accent">IN DEVELOPMENT</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '35%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
        <p className="mono-xs text-[9px] text-muted-foreground mt-2">
          Expected launch: Phase 02
        </p>
      </motion.div>
    </div>
  )
}
