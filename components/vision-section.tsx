'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Quote } from 'lucide-react'

export function VisionSection() {
  return (
    <section id="vision" className="relative py-24 px-4 md:px-8 lg:px-16 bg-card/30 overflow-hidden">
      <div className="absolute inset-0 noise pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="aspect-[4/5] relative rounded-sm overflow-hidden border border-border/50">
                  <Image
                    src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80"
                    alt="Nigerian farmland"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="aspect-square relative rounded-sm overflow-hidden border border-border/50">
                  <Image
                    src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80"
                    alt="Agricultural produce"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3 pt-8">
                <div className="aspect-square relative rounded-sm overflow-hidden border border-border/50">
                  <Image
                    src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&q=80"
                    alt="Young farmer"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="aspect-[4/5] relative rounded-sm overflow-hidden border border-border/50">
                  <Image
                    src="https://images.unsplash.com/photo-1595508064774-5ff825a02aac?w=600&q=80"
                    alt="Agricultural technology"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 px-4 py-3 bg-primary text-primary-foreground rounded-sm">
              <div className="text-2xl font-mono">10K+</div>
              <div className="text-xs font-mono opacity-80">YOUTH TARGET</div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Section Label */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-4 bg-primary" />
              <span className="text-xs font-mono tracking-wider text-primary">/ 01 — VISION</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-mono leading-tight mb-6 text-balance">
              A better <span className="text-primary">Nigeria</span>
              <br />
              through agriculture<span className="text-accent">.</span>
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              The AgroV1n3 program is driven by a vision to translate our collective dream of a better 
              Nigeria through massive youth participation in the agriculture value chain. With an 
              estimated average of 10,000 youths in Plateau State participating and benefiting from 
              agriculture within the first phase of the program.
            </p>

            {/* Quote */}
            <div className="relative p-6 bg-secondary/50 rounded-sm border-l-2 border-primary mb-8">
              <Quote className="absolute top-4 right-4 size-6 text-primary/30" />
              <p className="text-sm italic text-foreground/90 mb-4">
                &ldquo;We believe that when young Nigerians are empowered with the right tools, 
                training, and opportunities in agriculture, they become the architects of a 
                food-secure and prosperous nation.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-mono text-primary">MD</span>
                </div>
                <div>
                  <div className="text-sm font-mono">Mantim Danzaki</div>
                  <div className="text-xs text-muted-foreground">Founder, V1n3Tech</div>
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card/50 rounded-sm border border-border/50">
                <div className="text-xl font-mono text-primary mb-1">Phase 01</div>
                <div className="text-xs text-muted-foreground">Plateau State Launch</div>
              </div>
              <div className="p-4 bg-card/50 rounded-sm border border-border/50">
                <div className="text-xl font-mono text-accent mb-1">17 LGAs</div>
                <div className="text-xs text-muted-foreground">Full Coverage</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
