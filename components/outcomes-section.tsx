'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, Globe, Users, Zap } from 'lucide-react'

const outcomes = [
  {
    icon: TrendingUp,
    metric: '60%',
    title: 'Local Patronage',
    description: 'Increase in patronage of locally produced agricultural products across Nigeria.',
  },
  {
    icon: Users,
    metric: '1000',
    title: 'New Millionaires',
    description: 'Target agro millionaires created from each local government within 3 years.',
  },
  {
    icon: Globe,
    metric: 'Africa-Wide',
    title: 'New Markets',
    description: 'Expansion of agricultural markets beyond Nigeria across the African continent.',
  },
  {
    icon: Target,
    metric: '30%',
    title: 'Poverty Reduction',
    description: 'Target percentage of Nigerians lifted out of poverty through agricultural empowerment.',
  },
  {
    icon: Zap,
    metric: '10x',
    title: 'Market Speed',
    description: 'Acceleration in marketing and consumption of local agricultural produce.',
  },
]

export function OutcomesSection() {
  return (
    <section className="relative py-24 px-4 md:px-8 lg:px-16 bg-card/30 overflow-hidden">
      <div className="absolute inset-0 noise pointer-events-none" />
      
      {/* Large Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[20vw] font-mono text-border/30 whitespace-nowrap select-none">
          2029
        </span>
      </div>
      
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
            <span className="text-xs font-mono tracking-wider text-primary">/ 07 — OUTCOMES</span>
            <div className="w-8 h-px bg-border" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-mono leading-tight mb-4 text-balance">
            3-Year <span className="text-primary">Impact</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Our measurable targets for transforming Nigeria&apos;s agricultural landscape 
            and creating sustainable economic opportunities.
          </p>
        </motion.div>

        {/* Outcomes Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outcomes.map((outcome, i) => (
            <motion.div
              key={outcome.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="h-full p-6 rounded-sm border border-border/50 bg-background/80 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-12 rounded-sm bg-primary/10 border border-primary/30 shrink-0">
                    <outcome.icon className="size-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-mono text-primary mb-1">{outcome.metric}</div>
                    <h3 className="font-mono text-sm mb-2">{outcome.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {outcome.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
