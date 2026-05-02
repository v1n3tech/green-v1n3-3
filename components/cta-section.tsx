'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Wallet, Sprout } from 'lucide-react'
import Image from 'next/image'

export function CTASection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 relative border-t border-border">
      <div className="absolute inset-0 grid-pattern" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={72}
                height={72}
                className="object-contain relative z-10 w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px]"
              />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-sans leading-tight mb-4 sm:mb-6 px-4">
            Ready to <span className="text-primary">cultivate</span>
            <br />
            your future<span className="text-primary">?</span>
          </h2>

          <p className="text-foreground/50 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
            Join thousands of young Nigerians transforming the agricultural landscape. 
            There&apos;s a community for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 px-4">
            <button className="flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-background rounded-[2px] mono-sm hover:bg-primary/90 transition-colors group">
              <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">BECOME AN EXECUTIVE</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button className="flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 border border-border hover:border-primary/50 rounded-[2px] mono-sm text-foreground/80 hover:text-foreground transition-all">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm">CONNECT WALLET</span>
            </button>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4">
            <a href="#communities" className="px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-[2px] bg-card/30 hover:border-primary/50 transition-all mono-xs text-foreground/70 hover:text-foreground text-[10px] sm:text-xs">
              VIEW COMMUNITIES
            </a>
            <a href="#" className="px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-[2px] bg-card/30 hover:border-primary/50 transition-all mono-xs text-foreground/70 hover:text-foreground text-[10px] sm:text-xs">
              EXPLORE MARKETPLACE
            </a>
            <a href="#" className="px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-[2px] bg-card/30 hover:border-primary/50 transition-all mono-xs text-foreground/70 hover:text-foreground text-[10px] sm:text-xs">
              READ WHITEPAPER
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
