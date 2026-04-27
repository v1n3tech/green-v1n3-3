import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { VisionSection } from '@/components/vision-section'
import { HowItWorksSection } from '@/components/how-it-works-section'
import { CommunitiesSection } from '@/components/communities-section'
import { FeaturesSection } from '@/components/features-section'
import { TokenSection } from '@/components/token-section'
import { StructureSection } from '@/components/structure-section'
import { CTASection } from '@/components/cta-section'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <VisionSection />
      <HowItWorksSection />
      <CommunitiesSection />
      <FeaturesSection />
      <TokenSection />
      <StructureSection />
      <CTASection />
      <Footer />
    </main>
  )
}
