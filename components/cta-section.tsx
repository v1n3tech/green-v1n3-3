'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Wallet, Users, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function CTASection() {
  return (
    <section className="relative py-24 px-4 md:px-8 lg:px-16">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={80}
                height={80}
                className="object-contain"
              />
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-mono leading-tight mb-6 text-balance">
            Ready to <span className="text-primary">cultivate</span>
            <br />
            your future<span className="text-accent">?</span>
          </h2>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of young Nigerians transforming the agricultural landscape. 
            Whether you&apos;re a farmer, marketer, technologist, or investor — there&apos;s a 
            community for you.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm px-8 w-full sm:w-auto">
              <Sprout className="size-4" />
              BECOME AN EXECUTIVE
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-border/50 font-mono text-sm px-8 w-full sm:w-auto">
              <Wallet className="size-4" />
              CONNECT WALLET
            </Button>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
              <Users className="size-4 text-primary" />
              <span className="font-mono">View Communities</span>
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
              <span className="font-mono text-muted-foreground">Explore Marketplace</span>
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-sm border border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
              <span className="font-mono text-muted-foreground">Read Whitepaper</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
