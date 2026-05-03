'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function VisionSection() {
  return (
    <section id="doctrine" className="py-12 sm:py-16 md:py-20 relative border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-8 sm:mb-10 md:mb-12">
          <div className="w-1 h-4 sm:h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 01 — DOCTRINE</span>
        </div>

        {/* Asymmetric Layout */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-6">
          
          {/* Left - Large Tractor Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[45%] flex-shrink-0"
          >
            <div className="media-frame group p-1.5 sm:p-2">
              <div className="media-plate aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
                <Image
                  src="/images/tractor-farm.jpg"
                  alt="Nigerian farmer on tractor"
                  fill
                  className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/10" />

                {/* Bottom inline tag */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10 flex items-center gap-2 px-2.5 py-1 bg-background/60 backdrop-blur-md border border-border rounded-full">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  <span className="mono-xs text-foreground/80 text-[9px] sm:text-[10px]">FIELD / 01</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Content + Image Stack */}
          <div className="flex-1 flex flex-col gap-4 sm:gap-5">
            
            {/* Top Row - Agro Tech Image + Stats */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Agro Tech Image with Frame */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="w-full sm:w-[55%] relative"
              >
                <div className="media-frame group p-1.5">
                  <div className="media-plate aspect-[16/10]">
                    <Image
                      src="/images/agro-tech.jpg"
                      alt="Agricultural technology"
                      fill
                      className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/30" />

                    {/* Top-right tag */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2 py-1 bg-background/60 backdrop-blur-md border border-border rounded-full">
                      <span className="w-1 h-1 rounded-full bg-orange" />
                      <span className="mono-xs text-orange text-[9px]">TECH / 07</span>
                    </div>
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
              className="border border-border/50 rounded-[2px] bg-card/30 p-4 sm:p-5"
            >
              <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed mb-3 sm:mb-4">
                &ldquo;We believe that when young Nigerians are empowered with the right tools, 
                training, and opportunities in agriculture, they become the architects of a 
                food-secure and prosperous nation.&rdquo;
              </p>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[2px] bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="mono-xs text-primary font-semibold text-[10px] sm:text-xs">MD</span>
                </div>
                <div>
                  <div className="mono text-xs sm:text-sm text-foreground tracking-wide">MANTIM DANZAKI</div>
                  <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">FOUNDER, V1N3TECH</div>
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-1 border border-border/50 rounded-[2px] bg-card/20 p-3 sm:p-4"
              >
                <div className="mono text-lg sm:text-2xl text-primary mb-0.5 sm:mb-1 tracking-wide">PHASE 01</div>
                <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">PLATEAU STATE LAUNCH</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="flex-1 border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 h-full w-px bg-orange/50" />
                <div className="mono text-lg sm:text-2xl text-orange mb-0.5 sm:mb-1 tracking-wide">17 LGAS</div>
                <div className="mono-xs text-muted-foreground text-[9px] sm:text-[10px]">FULL COVERAGE</div>
              </motion.div>
            </div>

            {/* Youth Target Badge - Floating */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="self-start sm:self-end"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-primary rounded-[2px] inline-block">
                <div className="mono text-lg sm:text-2xl text-background tracking-wide">10K+</div>
                <div className="mono-xs text-background/70 text-[9px] sm:text-[10px]">YOUTH TARGET</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
