import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CampaignView } from '@/components/campaign/campaign-view'

export const metadata: Metadata = {
  title: 'Campaign | GreenV1n3 — Complete Milestones, Earn V1N3',
  description:
    'Complete milestones in the Green V1N3 program to earn allocated V1N3. An undisclosed number of early adopters will each receive 10 V1N3 at mainnet migration.',
  openGraph: {
    title: 'GreenV1n3 Campaign — Complete Milestones, Earn V1N3',
    description:
      'Earn V1N3 for completing program milestones. 10 V1N3 reward for early adopters at mainnet launch.',
    type: 'website',
  },
}

export default function CampaignPage() {
  return (
    <main className="min-h-screen bg-background bg-green-glow relative">
      <Header />
      <CampaignView />
      <Footer />
    </main>
  )
}
