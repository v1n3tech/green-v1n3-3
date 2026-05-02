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
    <section id="structure" className="py-12 sm:py-16 md:py-20 relative border-t border-border bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-8 sm:mb-10 md:mb-12">
          <div className="w-1 h-4 sm:h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 06 — STRUCTURE</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 xl:gap-20">
          {/* Left - Intro */}
          <div>
            <h2 className="mono text-xl sm:text-2xl md:text-3xl leading-tight mb-3 sm:mb-4 tracking-wide">
              OPERATIONAL
              <br />
              <span className="text-primary">FRAMEWORK</span>
            </h2>
            <p className="text-foreground/50 max-w-md text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
              A decentralized governance structure ensuring effective coordination 
              from state level down to individual executives.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-lg sm:text-xl text-accent">1</div>
                <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">SCC</div>
              </div>
              <div className="p-3 sm:p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-lg sm:text-xl text-primary">17</div>
                <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">LGPAs</div>
              </div>
              <div className="p-3 sm:p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-lg sm:text-xl text-foreground">238</div>
                <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">GCMs</div>
              </div>
              <div className="p-3 sm:p-4 border border-border rounded-[2px] bg-background/50">
                <div className="mono text-lg sm:text-xl text-foreground">10K+</div>
                <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">EXECS</div>
              </div>
            </div>
          </div>

          {/* Right - Structure List */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-primary to-border" />

            <div className="space-y-2 sm:space-y-3">
              {structure.map((item, i) => (
                <motion.div
                  key={item.level}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-10 sm:pl-12"
                >
                  {/* Connection Point */}
                  <div className="absolute left-[10px] sm:left-[14px] top-4 sm:top-5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-primary bg-background" />

                  {/* Card */}
                  <div className="p-3 sm:p-4 border border-border rounded-[3px] bg-card/30 card-hover">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <span className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">LEVEL {item.level}</span>
                          <span className="mono-xs px-1 sm:px-1.5 py-0.5 bg-background border border-border rounded-[2px] text-[9px] sm:text-[10px]">{item.abbr}</span>
                          <span className="mono-xs text-primary ml-auto text-[9px] sm:text-[10px]">{item.count}</span>
                        </div>
                        <h3 className="mono-sm text-foreground mb-0.5 sm:mb-1 truncate text-[11px] sm:text-xs">{item.title}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{item.description}</p>
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
