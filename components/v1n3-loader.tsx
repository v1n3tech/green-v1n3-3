'use client'

import { useEffect, useRef, useState } from 'react'

export function V1n3Loader() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [progress, setProgress] = useState(6)

  // Target progress that the visible bar smoothly eases toward
  const targetRef = useRef(6)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const setTarget = (value: number) => {
      targetRef.current = Math.max(targetRef.current, Math.min(value, 100))
    }

    // Smoothly animate the visible progress toward the target
    const tick = () => {
      setProgress((current) => {
        const target = targetRef.current
        const diff = target - current
        if (Math.abs(diff) < 0.15) return target
        return current + diff * 0.07
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // 1) Initial bump so the bar isn't empty
    setTarget(18)

    // 2) Document readyState transitions
    const handleReadyState = () => {
      if (document.readyState === 'interactive') setTarget(55)
      if (document.readyState === 'complete') setTarget(92)
    }
    handleReadyState()
    document.addEventListener('readystatechange', handleReadyState)

    // 3) Resource loading via PerformanceObserver — bump as assets arrive
    let resourcesSeen = 0
    let observer: PerformanceObserver | null = null
    try {
      observer = new PerformanceObserver((list) => {
        resourcesSeen += list.getEntries().length
        // Asymptotic climb: each resource pushes us closer to ~88%
        const eased = 88 - 70 * Math.exp(-resourcesSeen / 14)
        setTarget(eased)
      })
      observer.observe({ type: 'resource', buffered: true })
    } catch {
      /* PerformanceObserver not supported — silent fallback */
    }

    // 4) Fonts ready
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
    if (fonts?.ready) {
      fonts.ready.then(() => {
        if (mountedRef.current) setTarget(85)
      })
    }

    // 5) Window load — fully complete, then hold 1s and fade
    const handleLoad = () => {
      setTarget(100)
      setTimeout(() => {
        if (!mountedRef.current) return
        setFading(true)
        setTimeout(() => {
          if (mountedRef.current) setVisible(false)
        }, 500)
      }, 1000)
    }
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad, { once: true })
    }

    return () => {
      mountedRef.current = false
      document.removeEventListener('readystatechange', handleReadyState)
      window.removeEventListener('load', handleLoad)
      observer?.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!visible) return null

  const displayProgress = Math.round(progress)
  const aldrich = { fontFamily: 'var(--font-aldrich)' as const }

  return (
    <div
      aria-hidden={fading}
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Soft green ambient wash behind the wordmark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 35% at 50% 50%, rgba(0, 200, 83, 0.10), transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Wordmark with breathing halo */}
        <div className="relative leading-none">
          {/* Blurred halo layer behind */}
          <span
            aria-hidden="true"
            className="v1n3-loader-halo absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl tracking-[0.18em] text-primary"
            style={aldrich}
          >
            V1n3Tech
          </span>
          {/* Main text */}
          <span
            className="v1n3-loader-text relative block text-2xl sm:text-3xl tracking-[0.18em]"
            style={aldrich}
          >
            <span className="text-foreground">V1n3</span>
            <span className="text-primary">Tech</span>
          </span>
        </div>

        {/* Progress bar + percentage */}
        <div className="flex items-center gap-3">
          <div
            className="relative h-px w-40 sm:w-48 overflow-hidden bg-primary/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayProgress}
          >
            <span
              className="absolute inset-y-0 left-0 bg-primary"
              style={{
                width: `${displayProgress}%`,
                boxShadow: '0 0 10px rgba(0, 200, 83, 0.7)',
                transition: 'width 120ms linear',
              }}
            />
          </div>
          <span
            className="text-[10px] tracking-[0.2em] text-foreground/70 tabular-nums w-9 text-right"
            style={aldrich}
          >
            {String(displayProgress).padStart(3, '0')}
          </span>
        </div>

        <span
          className="text-[10px] tracking-[0.4em] text-muted-foreground"
          style={aldrich}
        >
          LOADING
        </span>
      </div>
    </div>
  )
}
