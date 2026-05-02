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
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(2, 3, 2, 0.92)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Subtle green glow behind text */}
          <div 
            className="absolute w-64 h-64 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0, 200, 83, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          
          {/* Loader Content */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Pulsing Text */}
            <div className="v1n3-loader-pulse">
              <span 
                className="font-mono text-2xl sm:text-3xl md:text-4xl tracking-[0.15em] font-medium"
                style={{ 
                  color: 'var(--primary)',
                  textShadow: '0 0 30px rgba(0, 200, 83, 0.5), 0 0 60px rgba(0, 200, 83, 0.3)',
                }}
              >
                V1N3TECH
              </span>
            </div>
            
            {/* Loading indicator dots */}
            <div className="flex items-center gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Corner brackets */}
          <div className="absolute top-6 left-6 w-6 h-6 sm:w-8 sm:h-8 md:top-8 md:left-8">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50" />
            <div className="absolute top-0 left-0 w-[2px] h-full bg-primary/50" />
          </div>
          <div className="absolute top-6 right-6 w-6 h-6 sm:w-8 sm:h-8 md:top-8 md:right-8">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-primary/50" />
            <div className="absolute top-0 right-0 w-[2px] h-full bg-primary/50" />
          </div>
          <div className="absolute bottom-6 left-6 w-6 h-6 sm:w-8 sm:h-8 md:bottom-8 md:left-8">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/50" />
            <div className="absolute bottom-0 left-0 w-[2px] h-full bg-primary/50" />
          </div>
          <div className="absolute bottom-6 right-6 w-6 h-6 sm:w-8 sm:h-8 md:bottom-8 md:right-8">
            <div className="absolute bottom-0 right-0 w-full h-[2px] bg-primary/50" />
            <div className="absolute bottom-0 right-0 w-[2px] h-full bg-primary/50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
