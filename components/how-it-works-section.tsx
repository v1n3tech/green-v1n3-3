'use client'

import { motion } from 'framer-motion'
import { UserPlus, Layers, Coins, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: '01',
    title: 'Register & Choose',
    description: 'Create your account and select from 14 agricultural communities that match your skills and interests.',
    icon: UserPlus,
    features: ['Free registration', 'Unique Agro Executive ID', 'Community selection']
  },
  {
    number: '02',
    title: 'Connect & Learn',
    description: 'Access training materials, connect with mentors, and join your community\'s network of executives.',
    icon: Layers,
    features: ['Training modules', 'Mentor matching', 'Community forums']
  },
  {
    number: '03',
    title: 'Work & Earn',
    description: 'Complete tasks, contribute to projects, and earn V1n3 tokens for your agricultural activities.',
    icon: Coins,
    features: ['Task marketplace', 'V1n3 rewards', 'Weekly payouts']
  },
  {
    number: '04',
    title: 'Grow & Scale',
    description: 'Build your reputation, access investment opportunities, and scale your agricultural enterprise.',
    icon: TrendingUp,
    features: ['Investor access', 'Business scaling', 'Performance ratings']
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 px-4 md:px-8 lg:px-16 bg-card/30">
      <div className="absolute inset-0 noise pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-border" />
            <span className="text-xs font-mono tracking-wider text-primary">/ 03 — HOW IT WORKS</span>
            <div className="w-8 h-px bg-border" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-mono leading-tight mb-4 text-balance">
            Your Path to
            <br />
            <span className="text-primary">Agro Excellence</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            From registration to revenue, we&apos;ve designed a seamless journey that empowers 
            you to contribute to Nigeria&apos;s agricultural transformation.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-sm border border-border/50 bg-background/50 hover:border-primary/30 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-sm bg-primary/10 border border-primary/30">
                      <step.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-primary">STEP {step.number}</span>
                      <h3 className="font-mono text-lg">{step.title}</h3>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {step.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-sm text-xs"
                    >
                      <CheckCircle2 className="size-3 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button size="lg" className="bg-primary text-primary-foreground font-mono text-sm px-8">
            START YOUR JOURNEY
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
