'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      
      {/* Subtle Glow */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0, 200, 83, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="GreenV1n3"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="font-mono text-sm tracking-wider">
              <span className="text-foreground">GREEN</span>
              <span className="text-primary">V1N3</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground">ERROR 404</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center"
        >
          {/* 404 Display */}
          <div className="mb-10">
            <span 
              className="font-mono text-[120px] sm:text-[160px] md:text-[180px] font-bold leading-none tracking-tight"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.5px var(--primary)',
              }}
            >
              404
            </span>
          </div>

          {/* Message */}
          <h1 className="font-mono text-lg sm:text-xl text-foreground mb-3 tracking-wide">
            PAGE NOT FOUND
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-10 leading-relaxed max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-primary text-background font-mono text-xs tracking-wider rounded-sm hover:bg-primary/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              GO HOME
            </Link>
            <Link 
              href="/#communities"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 border border-border text-foreground font-mono text-xs tracking-wider rounded-sm hover:border-primary/50 transition-colors"
            >
              <Compass className="w-4 h-4" />
              EXPLORE
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 border border-border text-muted-foreground font-mono text-xs tracking-wider rounded-sm hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              GO BACK
            </button>
          </div>

          {/* Status */}
          <div className="mt-14 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-4 font-mono text-[10px] tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>NETWORK ACTIVE</span>
              </div>
              <span className="text-border-strong">/</span>
              <span className="text-primary">V1N3TECH</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
