'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function VisionSection() {
  return (
    <section id="doctrine" className="py-20 relative border-t border-border">
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 01 — DOCTRINE</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Image Grid with Frame Brackets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[4/5] border border-border rounded-[2px] overflow-hidden">
                  {/* Corner Brackets */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-l border-t border-primary z-10" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-r border-b border-primary z-10" />
                  <Image
                    src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80"
                    alt="Nigerian farmland"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square border border-border rounded-[2px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80"
                    alt="Agricultural produce"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-10">
                <div className="relative aspect-square border border-border rounded-[2px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&q=80"
                    alt="Young farmer"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-[4/5] border border-border rounded-[2px] overflow-hidden">
                  {/* Corner Brackets */}
                  <div className="absolute top-2 right-2 w-5 h-5 border-r border-t border-primary z-10" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-l border-b border-primary z-10" />
                  <Image
                    src="https://images.unsplash.com/photo-1595508064774-5ff825a02aac?w=600&q=80"
                    alt="Agricultural technology"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Stats Badge */}
            <div className="absolute -bottom-4 -right-4 px-5 py-4 bg-primary rounded-[2px]">
              <div className="mono text-2xl text-background">10K+</div>
              <div className="mono-xs text-background/70">YOUTH TARGET</div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-sans leading-tight mb-6">
              A better <span className="text-primary">Nigeria</span>
              <br />
              through agriculture<span className="text-primary">.</span>
            </h2>

            <p className="text-foreground/50 text-base leading-relaxed mb-8">
              The AgroV1n3 program is driven by a vision to translate our collective dream of a better 
              Nigeria through massive youth participation in the agriculture value chain. With an 
              estimated average of 10,000 youths in Plateau State participating and benefiting from 
              agriculture within the first phase of the program.
            </p>

            {/* Founder Quote */}
            <div className="relative p-5 bg-card/50 border border-border rounded-[2px] mb-8">
              <div className="absolute -top-px left-6 w-8 h-px bg-primary" />
              <p className="text-sm text-foreground/70 italic leading-relaxed mb-4">
                &ldquo;We believe that when young Nigerians are empowered with the right tools, 
                training, and opportunities in agriculture, they become the architects of a 
                food-secure and prosperous nation.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[2px] bg-primary/20 flex items-center justify-center">
                  <span className="mono-xs text-primary">MD</span>
                </div>
                <div>
                  <div className="mono-sm text-foreground">Mantim Danzaki</div>
                  <div className="mono-xs text-muted-foreground">FOUNDER, V1N3TECH</div>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-border rounded-[2px] bg-card/30">
                <div className="mono text-xl text-primary mb-1">Phase 01</div>
                <div className="mono-xs text-muted-foreground">PLATEAU STATE LAUNCH</div>
              </div>
              <div className="p-4 border border-border rounded-[2px] bg-card/30">
                <div className="mono text-xl text-accent mb-1">17 LGAs</div>
                <div className="mono-xs text-muted-foreground">FULL COVERAGE</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
