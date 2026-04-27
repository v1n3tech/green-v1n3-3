'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Wallet, Sprout } from 'lucide-react'
import Image from 'next/image'

export function CTASection() {
  return (
    <section className="py-24 relative border-t border-border">
      <div className="absolute inset-0 grid-pattern" />
      
      <div className="max-w-[1440px] mx-auto px-5 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={72}
                height={72}
                className="object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans leading-tight mb-6">
            Ready to <span className="text-primary">cultivate</span>
            <br />
            your future<span className="text-primary">?</span>
          </h2>

          <p className="text-foreground/50 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of young Nigerians transforming the agricultural landscape. 
            There&apos;s a community for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="flex items-center gap-3 px-8 py-4 bg-primary text-background rounded-[2px] mono-sm hover:bg-primary/90 transition-colors group w-full sm:w-auto justify-center">
              <Sprout className="w-4 h-4" />
              BECOME AN EXECUTIVE
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button className="flex items-center gap-3 px-8 py-4 border border-border hover:border-primary/50 rounded-[2px] mono-sm text-foreground/80 hover:text-foreground transition-all w-full sm:w-auto justify-center">
              <Wallet className="w-4 h-4 text-primary" />
              CONNECT WALLET
            </button>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#communities" className="px-4 py-2.5 border border-border rounded-[2px] bg-card/30 hover:border-primary/50 transition-all mono-xs text-foreground/70 hover:text-foreground">
              VIEW COMMUNITIES
            </a>
            <a href="#" className="px-4 py-2.5 border border-border rounded-[2px] bg-card/30 hover:border-primary/50 transition-all mono-xs text-foreground/70 hover:text-foreground">
              EXPLORE MARKETPLACE
            </a>
            <a href="#" className="px-4 py-2.5 border border-border rounded-[2px] bg-card/30 hover:border-primary/50 transition-all mono-xs text-foreground/70 hover:text-foreground">
              READ WHITEPAPER
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
