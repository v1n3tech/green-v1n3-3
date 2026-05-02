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
    // Animate progress bar
    const duration = minDisplayTime
    const interval = 30
    const steps = duration / interval
    let currentStep = 0

    const progressTimer = setInterval(() => {
      currentStep++
      const newProgress = Math.min((currentStep / steps) * 100, 100)
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

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(2, 10, 2, 0.95)',
          }}
        >
          {/* Content */}
          <div className="flex flex-col items-center">
            {/* V1n3Tech Text */}
            <div className="v1n3-loader-pulse mb-8">
              <span className="font-mono text-2xl sm:text-3xl tracking-[0.25em]">
                <span className="text-foreground">V1n3</span>
                <span className="text-primary">Tech</span>
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-48 sm:w-64 h-[2px] bg-border mb-6">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Loading Text */}
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.4em] text-muted-foreground">
              LOADING
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
