'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface V1n3LoaderProps {
  minDisplayTime?: number
}

export function V1n3Loader({ minDisplayTime = 1000 }: V1n3LoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Track page load
    if (document.readyState === 'complete') {
      setPageLoaded(true)
    } else {
      const handleLoad = () => setPageLoaded(true)
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    // Ensure minimum display time
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, minDisplayTime)
    
    return () => clearTimeout(timer)
  }, [minDisplayTime])

  useEffect(() => {
    // Animate progress bar with percentage
    const duration = minDisplayTime
    const interval = 30
    const steps = duration / interval
    let currentStep = 0

    const progressTimer = setInterval(() => {
      currentStep++
      const newProgress = Math.min(Math.floor((currentStep / steps) * 100), 100)
      setProgress(newProgress)
      
      if (currentStep >= steps) {
        clearInterval(progressTimer)
      }
    }, interval)

    return () => clearInterval(progressTimer)
  }, [minDisplayTime])

  useEffect(() => {
    // Dismiss loader when both conditions are met
    if (pageLoaded && minTimeElapsed) {
      setIsLoading(false)
    }
  }, [pageLoaded, minTimeElapsed])

  // Format progress as 3-digit number (001, 012, 100)
  const formattedProgress = progress.toString().padStart(3, '0')

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 12, 4, 0.75)',
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Content */}
          <div className="flex flex-col items-center">
            {/* V1n3Tech Text - Thinner with Aldrich font */}
            <div className="v1n3-loader-pulse mb-10">
              <span 
                className="text-xl sm:text-2xl tracking-[0.35em] font-light"
                style={{ fontFamily: 'var(--font-aldrich), monospace' }}
              >
                <span className="text-white/90">V1n3</span>
                <span className="text-primary">Tech</span>
              </span>
            </div>
            
            {/* Progress Bar with Counter */}
            <div className="flex items-center gap-4 mb-5">
              {/* Thin Progress Bar */}
              <div className="w-40 sm:w-52 h-[1px] bg-white/20">
                <div 
                  className="h-full bg-primary/80 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Percentage Counter */}
              <span 
                className="text-[10px] tracking-[0.15em] text-white/50 tabular-nums"
                style={{ fontFamily: 'var(--font-aldrich), monospace' }}
              >
                {formattedProgress}
              </span>
            </div>
            
            {/* Loading Text - Thinner */}
            <span 
              className="text-[9px] sm:text-[10px] tracking-[0.5em] text-white/40 font-light"
              style={{ fontFamily: 'var(--font-aldrich), monospace' }}
            >
              LOADING
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
