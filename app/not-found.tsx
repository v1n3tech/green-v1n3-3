'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Search, Compass, RefreshCw } from 'lucide-react'

export default function NotFound() {
  const [time, setTime] = useState('')
  const [glitchText, setGlitchText] = useState('404')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      const secs = now.getSeconds().toString().padStart(2, '0')
      setTime(`${hours}:${mins}:${secs}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Glitch effect for 404
    const glitchChars = ['4', '0', 'O', '□', '■', '▓', '░']
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        const newText = '404'.split('').map(char => 
          Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
        ).join('')
        setGlitchText(newText)
        setTimeout(() => setGlitchText('404'), 100)
      }
    }, 500)
    return () => clearInterval(glitchInterval)
  }, [])

  return (
    <main className="min-h-screen bg-background bg-green-glow flex flex-col relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Background Glow Accents */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 200, 83, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 160, 0, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <Image
              src="/logo.png"
              alt="GreenV1n3"
              width={32}
              height={32}
              className="w-7 h-7 sm:w-8 sm:h-8"
            />
            <span className="mono text-sm sm:text-base tracking-wider">
              <span className="text-foreground">GREEN</span>
              <span className="text-primary">V1N3</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="mono-xs text-muted-foreground hidden sm:inline">{time} WAT</span>
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-warning" />
              <span className="mono-xs text-accent hidden sm:inline">PAGE NOT FOUND</span>
              <span className="mono-xs text-accent sm:hidden">404</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl w-full">
          {/* Error Code Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            {/* Section Label */}
            <div className="flex items-center justify-center gap-2.5 mb-6 sm:mb-8">
              <div className="w-1 h-4 sm:h-5 bg-accent" />
              <span className="mono-xs text-accent">/ ERR — ROUTE NOT FOUND</span>
            </div>

            {/* Large 404 */}
            <div className="relative inline-block mb-6 sm:mb-8">
              <span 
                className="font-mono text-[100px] sm:text-[140px] md:text-[180px] lg:text-[220px] font-bold leading-none tracking-tighter"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '2px var(--primary)',
                  textShadow: '0 0 40px rgba(0, 200, 83, 0.3)',
                }}
              >
                {glitchText}
              </span>
              {/* Glitch overlay */}
              <span 
                className="absolute inset-0 font-mono text-[100px] sm:text-[140px] md:text-[180px] lg:text-[220px] font-bold leading-none tracking-tighter text-primary/10"
                style={{
                  clipPath: 'inset(40% 0 40% 0)',
                  transform: 'translate(-2px, 2px)',
                }}
              >
                {glitchText}
              </span>
            </div>

            {/* Error Message */}
            <h1 className="mono text-xl sm:text-2xl md:text-3xl text-foreground mb-3 sm:mb-4 tracking-wide px-4">
              SECTOR <span className="text-accent">OFFLINE</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-foreground/50 max-w-md mx-auto leading-relaxed px-4">
              The coordinates you&apos;re looking for don&apos;t exist in our network. 
              This path hasn&apos;t been cultivated yet.
            </p>
          </motion.div>

          {/* Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10"
          >
            <Link 
              href="/"
              className="group p-4 sm:p-5 border border-border rounded-[3px] bg-card/30 hover:border-primary/50 hover:bg-card/50 transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mono text-sm sm:text-base text-foreground mb-1 group-hover:text-primary transition-colors">RETURN HOME</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Navigate back to the main hub</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/#communities"
              className="group p-4 sm:p-5 border border-border rounded-[3px] bg-card/30 hover:border-primary/50 hover:bg-card/50 transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mono text-sm sm:text-base text-foreground mb-1 group-hover:text-primary transition-colors">EXPLORE COMMUNITIES</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Discover 14 agricultural sectors</p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4"
          >
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 border border-border hover:border-primary/50 rounded-[2px] mono-sm text-foreground/70 hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              GO BACK
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 border border-border hover:border-primary/50 rounded-[2px] mono-sm text-foreground/70 hover:text-foreground transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              RETRY
            </button>
            <Link 
              href="/#doctrine"
              className="flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 bg-primary text-background rounded-[2px] mono-sm hover:bg-primary/90 transition-colors"
            >
              <Search className="w-4 h-4" />
              VIEW DOCTRINE
            </Link>
          </motion.div>

          {/* Status Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-border"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mono-xs text-muted-foreground text-center">
              <div className="flex items-center gap-2">
                <span className="status-dot" />
                <span>NETWORK : ACTIVE</span>
              </div>
              <span className="text-border-strong hidden sm:inline">/</span>
              <span>ERR_CODE : 404_NOT_FOUND</span>
              <span className="text-border-strong hidden sm:inline">/</span>
              <span className="text-primary">V1N3TECH.IO</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 w-8 sm:w-12 h-8 sm:h-12 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-primary/30" />
        <div className="absolute bottom-0 left-0 w-[1.5px] h-full bg-primary/30" />
      </div>
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-8 sm:w-12 h-8 sm:h-12 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-[1.5px] bg-primary/30" />
        <div className="absolute bottom-0 right-0 w-[1.5px] h-full bg-primary/30" />
      </div>
    </main>
  )
}
