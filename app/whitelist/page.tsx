import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Rocket, ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Whitelist | GreenV1n3 — Coming to Mainnet Soon',
  description:
    'The Green V1N3 whitelist opens with our migration to Solana mainnet. Coming to mainnet soon.',
}

export default function WhitelistPage() {
  return (
    <main className="min-h-screen bg-background bg-green-glow relative flex flex-col">
      <Header />

      <section className="relative flex-1 flex items-center justify-center px-4 py-28 overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-primary/8 blur-[140px] rounded-full" />

        <div className="relative text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative w-16 h-16 border border-border-strong rounded-[1px] bg-card flex items-center justify-center">
              <Rocket className="w-7 h-7 text-primary" />
              <span className="absolute inset-0 bg-primary/15 blur-2xl rounded-full scale-150" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="status-dot status-dot-warning status-dot-pulse" />
            <span className="mono-xs text-accent">WHITELIST STATUS</span>
          </div>

          <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl leading-[0.98] tracking-tight mb-5 text-balance">
            Coming to <span className="text-primary">mainnet</span> soon
          </h1>

          <p className="text-foreground/55 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            The Green V1N3 whitelist opens with our migration to Solana mainnet. We&apos;re finalizing the
            published supply schedule and custody review first. An undisclosed number of early adopters will
            each be rewarded with <span className="text-accent">10 V1N3</span> at launch.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/campaign"
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 border border-border hover:border-primary/50 rounded-[1px] mono-sm text-foreground/80 hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm">BACK TO CAMPAIGN</span>
            </Link>
            <Link
              href="/whitepaper"
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary text-background rounded-[1px] mono-sm hover:bg-primary/90 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs sm:text-sm">READ WHITEPAPER</span>
            </Link>
          </div>

          <p className="mono-xs text-muted-foreground mt-10">
            DEVNET PILOT · V1N3 CARRIES NO MONETARY VALUE UNTIL MAINNET
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
