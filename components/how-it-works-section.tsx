'use client'

import { motion } from 'framer-motion'
import { UserPlus, Layers, Coins, TrendingUp, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Register & Choose',
    description: 'Create your account and select from 14 agricultural communities that match your skills.',
    icon: UserPlus,
    features: ['Free registration', 'Unique ID', 'Community selection']
  },
  {
    number: '02',
    title: 'Connect & Learn',
    description: 'Access training materials, connect with mentors, and join your community network.',
    icon: Layers,
    features: ['Training modules', 'Mentor matching', 'Community forums']
  },
  {
    number: '03',
    title: 'Work & Earn',
    description: 'Complete tasks, contribute to projects, and earn V1n3 tokens for your activities.',
    icon: Coins,
    features: ['Task marketplace', 'V1n3 rewards', 'Weekly payouts']
  },
  {
    number: '04',
    title: 'Grow & Scale',
    description: 'Build your reputation, access investments, and scale your agricultural enterprise.',
    icon: TrendingUp,
    features: ['Investor access', 'Business scaling', 'Performance ratings']
  },
]

export function HowItWorksSection() {
  return (
    <section id="infra" className="py-12 sm:py-16 md:py-20 relative border-t border-border bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-8 sm:mb-10 md:mb-12">
          <div className="w-1 h-4 sm:h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 02 — HOW IT WORKS</span>
        </div>

        <div className="grid lg:grid-cols-[1fr,auto] gap-6 sm:gap-8 lg:gap-12 items-start">
          <div>
            <h2 className="mono text-xl sm:text-2xl md:text-3xl leading-tight mb-3 sm:mb-4 tracking-wide">
              YOUR PATH TO
              <br />
              <span className="text-primary">AGRO EXCELLENCE</span>
            </h2>
            <p className="text-foreground/50 max-w-lg text-sm sm:text-base leading-relaxed">
              From registration to revenue, a seamless journey that empowers 
              you to contribute to Nigeria&apos;s agricultural transformation.
            </p>
          </div>

          <button className="hidden lg:flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 border border-border hover:border-primary/50 rounded-[2px] mono-sm text-foreground/80 hover:text-foreground transition-all group">
            <span className="text-xs sm:text-sm">START YOUR JOURNEY</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="mt-8 sm:mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="h-full p-4 sm:p-5 border border-border rounded-[3px] bg-background/50 card-hover">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="mono-xs text-muted-foreground">STEP {step.number}</span>
                </div>

                {/* Content */}
                <h3 className="mono text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">{step.title}</h3>
                <p className="text-[11px] sm:text-xs text-foreground/50 leading-relaxed mb-3 sm:mb-4">
                  {step.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {step.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-card border border-border rounded-[2px] mono-xs text-foreground/60 text-[9px] sm:text-[10px]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 sm:mt-8 lg:hidden">
          <button className="w-full flex items-center justify-center gap-2.5 px-5 py-3 sm:py-3.5 bg-primary text-background rounded-[2px] mono-sm">
            <span className="text-xs sm:text-sm">START YOUR JOURNEY</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
