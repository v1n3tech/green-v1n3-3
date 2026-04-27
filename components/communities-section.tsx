'use client'

import { motion } from 'framer-motion'
import { 
  Sprout, 
  PawPrint, 
  ShoppingCart, 
  Factory, 
  Scale, 
  Palmtree, 
  Cpu, 
  Heart, 
  Radio, 
  Shield, 
  BookOpen, 
  Lightbulb, 
  Building2, 
  Truck,
  ArrowUpRight
} from 'lucide-react'

const communities = [
  { name: 'Crop Farming', icon: Sprout, members: '2,450', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { name: 'Animal Farming', icon: PawPrint, members: '1,820', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { name: 'Agro Marketing', icon: ShoppingCart, members: '1,340', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { name: 'Agro Processing', icon: Factory, members: '980', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { name: 'Management & Legislation', icon: Scale, members: '560', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { name: 'Agro Tourism', icon: Palmtree, members: '720', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  { name: 'Agro Technology', icon: Cpu, members: '890', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { name: 'Agro Health Care', icon: Heart, members: '670', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { name: 'Media & Branding', icon: Radio, members: '540', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { name: 'Agro Security', icon: Shield, members: '420', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { name: 'Agro Literature', icon: BookOpen, members: '380', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { name: 'Motivation & Training', icon: Lightbulb, members: '760', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { name: 'Green Real Estate', icon: Building2, members: '290', color: 'bg-lime-500/10 text-lime-400 border-lime-500/30' },
  { name: 'Agro Logistics', icon: Truck, members: '510', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
]

export function CommunitiesSection() {
  return (
    <section id="communities" className="relative py-24 px-4 md:px-8 lg:px-16">
      {/* Background Elements */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-4 bg-primary" />
            <span className="text-xs font-mono tracking-wider text-primary">/ 02 — COMMUNITIES</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <h2 className="text-4xl sm:text-5xl font-mono leading-tight text-balance">
              14 Disciplines<span className="text-accent">.</span>
              <br />
              <span className="text-primary">One Network</span><span className="text-muted-foreground">.</span>
            </h2>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed">
              Each community represents a vital node in the agricultural value chain. 
              Choose your discipline and start earning V1n3 tokens.
            </p>
          </div>
        </motion.div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {communities.map((community, i) => (
            <motion.div
              key={community.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <div className={`relative p-4 rounded-sm border ${community.color} bg-card/50 hover:bg-card transition-all cursor-pointer`}>
                {/* Number Badge */}
                <div className="absolute top-3 right-3 text-xs font-mono text-muted-foreground/50">
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Icon */}
                <div className="mb-3">
                  <community.icon className="size-6" />
                </div>

                {/* Content */}
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-mono text-sm mb-1">{community.name}</h3>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-foreground">{community.members}</span> executives
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 p-6 bg-card/50 rounded-sm border border-border/50"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <div className="text-2xl sm:text-3xl font-mono text-primary">12,330</div>
              <div className="text-xs font-mono text-muted-foreground tracking-wider">TOTAL REGISTERED</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-2xl sm:text-3xl font-mono text-foreground">8,920</div>
              <div className="text-xs font-mono text-muted-foreground tracking-wider">ACTIVE EXECUTIVES</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-2xl sm:text-3xl font-mono text-foreground">456K</div>
              <div className="text-xs font-mono text-muted-foreground tracking-wider">V1N3 DISTRIBUTED</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-2xl sm:text-3xl font-mono text-accent">95%</div>
              <div className="text-xs font-mono text-muted-foreground tracking-wider">RETENTION RATE</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
