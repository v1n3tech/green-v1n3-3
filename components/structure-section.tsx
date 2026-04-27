'use client'

import { motion } from 'framer-motion'
import { Users, UserCog, Building, Crown, User } from 'lucide-react'

const structure = [
  {
    level: 'A',
    title: 'State Coordinating Council',
    abbr: 'SCC',
    icon: Crown,
    description: 'Central body overseeing all activities across Plateau State and beyond. Sets strategic direction and policies.',
    color: 'border-accent text-accent',
    bgColor: 'bg-accent/10'
  },
  {
    level: 'B',
    title: 'LGPA Forum',
    abbr: 'FORUM',
    icon: Building,
    description: 'Meeting point for all 17 LGPAs to appraise performance, carry out evaluations, and coordinate state-wide initiatives.',
    color: 'border-primary text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    level: 'C',
    title: 'Local Government Program Administrators',
    abbr: 'LGPA',
    icon: UserCog,
    description: 'Selected youth delegates responsible for mobilizing and managing Agro Executives in each of the 17 local governments.',
    color: 'border-emerald-400 text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
  {
    level: 'D',
    title: 'Green V1n3 Community Managers',
    abbr: 'GCM',
    icon: Users,
    description: 'Selected by LGPAs to manage participants at the community grouping level. Each LGA has 14 GCMs, one for each community.',
    color: 'border-cyan-400 text-cyan-400',
    bgColor: 'bg-cyan-500/10'
  },
  {
    level: 'E',
    title: 'Agro Executives',
    abbr: 'EXEC',
    icon: User,
    description: 'Thousands of young participants who register, train, contribute, and benefit from the AgroV1n3 program across all communities.',
    color: 'border-muted-foreground text-muted-foreground',
    bgColor: 'bg-muted/50'
  },
]

export function StructureSection() {
  return (
    <section id="structure" className="relative py-24 px-4 md:px-8 lg:px-16 bg-card/30">
      <div className="absolute inset-0 noise pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-border" />
            <span className="text-xs font-mono tracking-wider text-primary">/ 05 — STRUCTURE</span>
            <div className="w-8 h-px bg-border" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-mono leading-tight mb-4 text-balance">
            Operational
            <br />
            <span className="text-primary">Framework</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            A decentralized governance structure ensuring effective coordination 
            from state level down to individual executives.
          </p>
        </motion.div>

        {/* Structure Diagram */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-primary to-muted-foreground/30 md:-translate-x-px" />

          {/* Structure Items */}
          <div className="space-y-4">
            {structure.map((item, i) => (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex ${i % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}
              >
                {/* Connection Point */}
                <div className={`absolute left-6 md:left-1/2 top-6 size-3 rounded-full border-2 ${item.color} ${item.bgColor} -translate-x-1/2`} />

                {/* Card */}
                <div className={`ml-12 md:ml-0 ${i % 2 === 0 ? 'md:mr-[52%]' : 'md:ml-[52%]'} w-full md:w-auto`}>
                  <div className={`p-5 rounded-sm border ${item.color} ${item.bgColor} hover:scale-[1.02] transition-transform`}>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex items-center justify-center size-10 rounded-sm border ${item.color} bg-background/50`}>
                        <item.icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono opacity-60">LEVEL {item.level}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 bg-background/50 rounded-sm">{item.abbr}</span>
                        </div>
                        <h3 className="font-mono text-sm">{item.title}</h3>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-sm border border-border/50 bg-background/50 text-center">
            <div className="text-2xl font-mono text-accent">1</div>
            <div className="text-xs font-mono text-muted-foreground">SCC</div>
          </div>
          <div className="p-4 rounded-sm border border-border/50 bg-background/50 text-center">
            <div className="text-2xl font-mono text-primary">17</div>
            <div className="text-xs font-mono text-muted-foreground">LGPAs</div>
          </div>
          <div className="p-4 rounded-sm border border-border/50 bg-background/50 text-center">
            <div className="text-2xl font-mono text-emerald-400">238</div>
            <div className="text-xs font-mono text-muted-foreground">GCMs</div>
          </div>
          <div className="p-4 rounded-sm border border-border/50 bg-background/50 text-center">
            <div className="text-2xl font-mono text-foreground">10K+</div>
            <div className="text-xs font-mono text-muted-foreground">EXECUTIVES</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
