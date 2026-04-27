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
    <section id="infra" className="py-20 relative border-t border-border bg-card/20">
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 02 — HOW IT WORKS</span>
        </div>

        <div className="grid lg:grid-cols-[1fr,auto] gap-12 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-sans leading-tight mb-4">
              Your Path to
              <br />
              <span className="text-primary">Agro Excellence</span>
            </h2>
            <p className="text-foreground/50 max-w-lg text-base leading-relaxed">
              From registration to revenue, a seamless journey that empowers 
              you to contribute to Nigeria&apos;s agricultural transformation.
            </p>
          </div>

          <button className="hidden lg:flex items-center gap-2.5 px-5 py-3 border border-border hover:border-primary/50 rounded-[2px] mono-sm text-foreground/80 hover:text-foreground transition-all group">
            START YOUR JOURNEY
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="h-full p-5 border border-border rounded-[3px] bg-background/50 card-hover">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="mono-xs text-muted-foreground">STEP {step.number}</span>
                </div>

                {/* Content */}
                <h3 className="mono text-sm text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-foreground/50 leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {step.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-card border border-border rounded-[2px] mono-xs text-foreground/60"
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
        <div className="mt-8 lg:hidden">
          <button className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-primary text-background rounded-[2px] mono-sm">
            START YOUR JOURNEY
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
