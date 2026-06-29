'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Printer, FileText, ChevronRight } from 'lucide-react'
import { sections } from './content'

export function WhitepaperView() {
  const [activeSlug, setActiveSlug] = useState(sections[0].slug)

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSlug(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.slug)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = useCallback((slug: string) => {
    const el = document.getElementById(slug)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative">
      {/* Document masthead */}
      <section className="border-b border-border bg-card/20 grid-pattern print:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16">
          <div className="flex items-center gap-2.5 mb-6">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="mono-xs text-primary">/ TECHNICAL &amp; ECONOMIC WHITEPAPER</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mono text-2xl sm:text-4xl lg:text-5xl tracking-wide text-balance leading-tight"
          >
            <span className="text-foreground">GREEN</span>
            <span className="text-primary">V1N3</span>
            <span className="text-foreground"> NIGERIA</span>
          </motion.h1>

          <p className="mt-4 max-w-2xl text-sm sm:text-base text-foreground/70 leading-relaxed text-pretty">
            A youth-driven agricultural value-chain platform for Plateau State and beyond — the
            operating system for the AgroV1n3 program.
          </p>

          {/* Meta rail */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              ['VERSION', '1.0'],
              ['DATE', 'JUNE 2026'],
              ['NETWORK', 'SOLANA MAINNET'],
              ['PHASE', '01 — PLATEAU'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <span className="mono-xs text-muted-foreground/70 text-[9px]">{k}</span>
                <span className="mono-sm text-foreground text-[11px] sm:text-xs">{v}</span>
              </div>
            ))}
            <button
              onClick={() => window.print()}
              className="ml-auto flex items-center gap-2 rounded-[2px] border border-primary/50 px-3.5 py-2 transition-all hover:border-primary hover:bg-primary/5 print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span className="mono-sm text-primary text-[10px] sm:text-xs">DOWNLOAD PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* Body: sticky TOC + content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
          {/* Table of contents */}
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-28">
              <div className="mono-xs text-muted-foreground/70 mb-4 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-primary" />
                CONTENTS
              </div>
              <nav className="flex flex-col">
                {sections.map((s) => {
                  const active = activeSlug === s.slug
                  return (
                    <button
                      key={s.slug}
                      onClick={() => scrollTo(s.slug)}
                      className="group flex items-center gap-2 py-1.5 text-left"
                    >
                      <span
                        className={`mono-xs text-[10px] transition-colors ${
                          active ? 'text-primary' : 'text-muted-foreground/60'
                        }`}
                      >
                        {s.id}
                      </span>
                      <span
                        className={`text-[13px] leading-snug transition-colors ${
                          active
                            ? 'text-foreground'
                            : 'text-muted-foreground group-hover:text-foreground/80'
                        }`}
                      >
                        {s.title}
                      </span>
                      {active && <ChevronRight className="w-3 h-3 text-primary ml-auto" />}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Sections */}
          <article className="min-w-0 flex flex-col gap-12 sm:gap-16">
            {sections.map((s) => (
              <section key={s.slug} id={s.slug} className="scroll-mt-28">
                <header className="mb-5 border-b border-border pb-4">
                  <div className="mono-xs text-primary mb-2">/ {s.id}</div>
                  <h2 className="mono text-lg sm:text-2xl tracking-wide text-foreground text-balance">
                    {s.title}
                  </h2>
                </header>
                {s.body}
              </section>
            ))}

            {/* Legal footnote */}
            <p className="border-t border-border pt-6 text-[11px] leading-relaxed text-muted-foreground italic">
              This document describes a program and a platform under active development. Feature
              descriptions reflect the current build at the time of writing; economic parameters are
              configurable and subject to governance. The V1N3 token is live on Solana mainnet as a
              Token-2022 asset with a fixed total supply of 4,000,000,000 and a permanently revoked
              mint authority. Nothing in this document is financial advice or an offer of securities.
            </p>
          </article>
        </div>
      </div>
    </div>
  )
}
