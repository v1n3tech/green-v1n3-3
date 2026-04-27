'use client'

import { motion } from 'framer-motion'
import { Users, UserCog, Building, Crown, User } from 'lucide-react'

const structure = [
  {
    level: 'A',
    title: 'State Coordinating Council',
    abbr: 'SCC',
    icon: Crown,
    description: 'Central body overseeing all activities across Plateau State and beyond.',
    count: '1',
  },
  {
    level: 'B',
    title: 'LGPA Forum',
    abbr: 'FORUM',
    icon: Building,
    description: 'Meeting point for all 17 LGPAs to appraise performance and coordinate.',
    count: '1',
  },
  {
    level: 'C',
    title: 'Local Government Program Administrators',
    abbr: 'LGPA',
    icon: UserCog,
    description: 'Selected delegates responsible for mobilizing executives in each LGA.',
    count: '17',
  },
  {
    level: 'D',
    title: 'Green V1n3 Community Managers',
    abbr: 'GCM',
    icon: Users,
    description: 'Manage participants at community level. Each LGA has 14 GCMs.',
    count: '238',
  },
  {
    level: 'E',
    title: 'Agro Executives',
    abbr: 'EXEC',
    icon: User,
    description: 'Young participants who register, train, and benefit from AgroV1n3.',
    count: '10K+',
  },
]

export function StructureSection() {
  return (
    <section id="structure" className="py-20 relative border-t border-border bg-card/20">
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 06 — STRUCTURE</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Intro */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-sans leading-tight mb-4">
              Operational
              <br />
              <span className="text-primary">Framework</span>
            </h2>
            <p className="text-foreground/50 max-w-md text-base leading-relaxed mb-8">
              A decentralized governance structure ensuring effective coordination 
              from state level down to individual executives.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-xl text-accent">1</div>
                <div className="mono-xs text-muted-foreground">SCC</div>
              </div>
              <div className="p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-xl text-primary">17</div>
                <div className="mono-xs text-muted-foreground">LGPAs</div>
              </div>
              <div className="p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-xl text-foreground">238</div>
                <div className="mono-xs text-muted-foreground">GCMs</div>
              </div>
              <div className="p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-xl text-foreground">10K+</div>
                <div className="mono-xs text-muted-foreground">EXECS</div>
              </div>
            </div>
          </div>

          {/* Right - Structure List */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-primary to-border" />

            <div className="space-y-3">
              {structure.map((item, i) => (
                <motion.div
                  key={item.level}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-12"
                >
                  {/* Connection Point */}
                  <div className="absolute left-[14px] top-5 w-3 h-3 rounded-full border-2 border-primary bg-background" />

                  {/* Card */}
                  <div className="p-4 border border-border rounded-[3px] bg-card/30 card-hover">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="mono-xs text-muted-foreground">LEVEL {item.level}</span>
                          <span className="mono-xs px-1.5 py-0.5 bg-background border border-border rounded-[2px]">{item.abbr}</span>
                          <span className="mono-xs text-primary ml-auto">{item.count}</span>
                        </div>
                        <h3 className="mono-sm text-foreground mb-1 truncate">{item.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
