'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { toPng } from 'html-to-image'
import { motion } from 'framer-motion'
import { Download, FileText, ArrowRight, Megaphone, Loader2, Coins, Rocket } from 'lucide-react'
import { CampaignPoster } from './campaign-poster'

export function CampaignView() {
  const posterRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    const node = posterRef.current
    if (!node) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        // Match the app background so transparent corners don't show through
        backgroundColor: '#020302',
      })
      const link = document.createElement('a')
      link.download = 'greenv1n3-campaign.png'
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('[v0] poster export failed:', err)
    } finally {
      setDownloading(false)
    }
  }, [])

  return (
    <section className="relative min-h-screen pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 blur-[140px] rounded-full" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="status-dot status-dot-pulse" />
          <span className="mono-xs text-primary">ONGOING CAMPAIGN</span>
          <span className="mono-xs text-muted-foreground">/ PHASE 01 — PLATEAU</span>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="max-w-3xl mb-12"
        >
          <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-tight mb-5 text-balance">
            Complete milestones.
            <br />
            Earn <span className="text-primary">V1N3</span>.
          </h1>
          <p className="text-foreground/55 text-base sm:text-lg leading-relaxed max-w-2xl">
            Green V1N3 rewards real participation. Clear program milestones and we allocate V1N3 straight
            to your wallet. And when we migrate to mainnet, an undisclosed number of early adopters will
            each receive a <span className="text-accent">10 V1N3</span> reward.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row flex-wrap gap-3 mb-14"
        >
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary text-background rounded-[1px] mono-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="text-xs sm:text-sm">{downloading ? 'GENERATING…' : 'DOWNLOAD POSTER'}</span>
          </button>

          <Link
            href="/whitepaper"
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 border border-border hover:border-primary/50 rounded-[1px] mono-sm text-foreground/80 hover:text-foreground transition-all"
          >
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm">READ WHITEPAPER</span>
          </Link>

          <Link
            href="/whitelist"
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 border border-border hover:border-primary/50 rounded-[1px] mono-sm text-foreground/80 hover:text-foreground transition-all group"
          >
            <Megaphone className="w-4 h-4 text-accent" />
            <span className="text-xs sm:text-sm">JOIN WHITELIST</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid sm:grid-cols-2 gap-4 mb-14"
        >
          <div className="border border-border rounded-[1px] bg-card/50 p-6 flex gap-4">
            <div className="w-11 h-11 shrink-0 border border-border-strong rounded-[1px] bg-background flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="mono-sm text-foreground mb-2">MILESTONE ALLOCATIONS</h3>
              <p className="text-foreground/55 text-sm leading-relaxed">
                V1N3 is allocated for each milestone you complete — joining a community, verifying,
                transacting on-chain, and staking to grow.
              </p>
            </div>
          </div>
          <div className="border border-border-strong rounded-[1px] bg-card/50 p-6 flex gap-4">
            <div className="w-11 h-11 shrink-0 border border-accent/40 rounded-[1px] bg-background flex items-center justify-center">
              <Rocket className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="mono-sm text-foreground mb-2">
                MAINNET EARLY ADOPTERS — <span className="text-accent">10 V1N3</span>
              </h3>
              <p className="text-foreground/55 text-sm leading-relaxed">
                An undisclosed number of early adopters will each be rewarded with 10 V1N3 when the program
                migrates to Solana mainnet. Be early.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Poster preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="mono-xs text-muted-foreground">CAMPAIGN POSTER / PREVIEW</span>
            <span className="mono-xs text-muted-foreground">PNG · 1080W @2X</span>
          </div>
          <div className="media-frame">
            <div className="media-chrome top">
              <span className="text-primary">●</span>
              <span>GREENV1N3-CAMPAIGN.PNG</span>
              <span className="chrome-spacer" />
              <span className="text-muted-foreground">EXPORTABLE</span>
            </div>
            {/* Scrollable, scaled preview of the full-size poster */}
            <div className="media-plate overflow-x-auto">
              <div className="mx-auto" style={{ width: 1080 }}>
                <CampaignPoster ref={posterRef} />
              </div>
            </div>
          </div>
          <p className="text-foreground/40 text-xs mt-3 text-center mono-xs">
            Tip: tap “DOWNLOAD POSTER” to save the full-resolution image.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
