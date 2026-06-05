import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { WhitepaperView } from '@/components/whitepaper/whitepaper-view'

export const metadata: Metadata = {
  title: 'Whitepaper | GreenV1n3 — AgroV1n3 Program',
  description:
    'The technical and economic whitepaper for Green V1N3 Nigeria: a youth-driven agricultural value-chain platform, the V1N3 Solana token, governance, custody, and roadmap.',
  openGraph: {
    title: 'GreenV1n3 Whitepaper — AgroV1n3 Program',
    description:
      'Technical & economic whitepaper for the Green V1N3 platform and the V1N3 Solana token.',
    type: 'article',
  },
}

export default function WhitepaperPage() {
  return (
    <main className="min-h-screen bg-background relative">
      <Header />
      <WhitepaperView />
      <Footer />
    </main>
  )
}
