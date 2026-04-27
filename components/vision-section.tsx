'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function VisionSection() {
  return (
    <section id="doctrine" className="py-20 relative border-t border-border/50">
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 01 — DOCTRINE</span>
        </div>

        {/* Asymmetric Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-6">
          
          {/* Left - Large Tractor Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-[45%] flex-shrink-0"
          >
            <div className="relative aspect-[4/5] rounded-[2px] overflow-hidden border border-border/50">
              <Image
                src="/images/tractor-farm.jpg"
                alt="Nigerian farmer on tractor"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" />
              
              {/* Bottom Corner Bracket */}
              <div className="absolute bottom-4 left-4 w-8 h-8">
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
                <div className="absolute bottom-0 left-0 w-[2px] h-full bg-primary" />
              </div>
            </div>
          </motion.div>

          {/* Right - Content + Image Stack */}
          <div className="flex-1 flex flex-col gap-5">
            
            {/* Top Row - Agro Tech Image + Stats */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Agro Tech Image with Frame */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="sm:w-[55%] relative"
              >
                <div className="relative aspect-[16/10] rounded-[2px] overflow-hidden">
                  <Image
                    src="/images/agro-tech.jpg"
                    alt="Agricultural technology"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-transparent" />
                  
                  {/* Frame Corners */}
                  <div className="absolute top-3 right-3 w-6 h-6">
                    <div className="absolute top-0 right-0 w-full h-[1.5px] bg-primary" />
                    <div className="absolute top-0 right-0 w-[1.5px] h-full bg-primary" />
                  </div>
                  <div className="absolute bottom-3 left-3 w-6 h-6">
                    <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-primary" />
                    <div className="absolute bottom-0 left-0 w-[1.5px] h-full bg-primary" />
                  </div>
                </div>
              </motion.div>

              {/* Empty spacer for asymmetry */}
              <div className="hidden sm:block flex-1" />
            </div>

            {/* Quote Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="border border-border/50 rounded-[2px] bg-card/30 p-5"
            >
              <p className="text-sm text-foreground/60 leading-relaxed mb-4">
                &ldquo;We believe that when young Nigerians are empowered with the right tools, 
                training, and opportunities in agriculture, they become the architects of a 
                food-secure and prosperous nation.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[2px] bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="mono-xs text-primary font-semibold">MD</span>
                </div>
                <div>
                  <div className="mono text-sm text-foreground tracking-wide">MANTIM DANZAKI</div>
                  <div className="mono-xs text-muted-foreground">FOUNDER, V1N3TECH</div>
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-1 border border-border/50 rounded-[2px] bg-card/20 p-4"
              >
                <div className="mono text-2xl text-primary mb-1 tracking-wide">PHASE 01</div>
                <div className="mono-xs text-muted-foreground">PLATEAU STATE LAUNCH</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="flex-1 border border-border/50 rounded-[2px] bg-card/20 p-4"
              >
                <div className="mono text-2xl text-accent mb-1 tracking-wide">17 LGAS</div>
                <div className="mono-xs text-muted-foreground">FULL COVERAGE</div>
              </motion.div>
            </div>

            {/* Youth Target Badge - Floating */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="self-end"
            >
              <div className="px-6 py-4 bg-primary rounded-[2px] inline-block">
                <div className="mono text-2xl text-background tracking-wide">10K+</div>
                <div className="mono-xs text-background/70">YOUTH TARGET</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
