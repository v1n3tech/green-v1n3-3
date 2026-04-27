'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ShoppingCart, Star, MapPin, Verified, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const products = [
  {
    id: 1,
    name: 'Organic Tomatoes',
    seller: 'Amina Y.',
    location: 'Jos North',
    price: '2,500',
    unit: 'basket',
    rating: 4.8,
    verified: true,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
  },
  {
    id: 2,
    name: 'Fresh Maize',
    seller: 'Ibrahim K.',
    location: 'Barkin Ladi',
    price: '15,000',
    unit: 'bag',
    rating: 4.9,
    verified: true,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
  },
  {
    id: 3,
    name: 'Free Range Eggs',
    seller: 'Grace M.',
    location: 'Mangu',
    price: '3,200',
    unit: 'crate',
    rating: 4.7,
    verified: false,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
  },
  {
    id: 4,
    name: 'Irish Potatoes',
    seller: 'Daniel P.',
    location: 'Bokkos',
    price: '8,000',
    unit: 'bag',
    rating: 4.6,
    verified: true,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber703?w=400&q=80',
  },
]

export function MarketplacePreview() {
  return (
    <section className="relative py-24 px-4 md:px-8 lg:px-16 bg-card/30">
      <div className="absolute inset-0 noise pointer-events-none" />
      
      <div className="relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-4 bg-primary" />
              <span className="text-xs font-mono tracking-wider text-primary">/ 08 — MARKETPLACE</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-mono leading-tight text-balance">
              Agro <span className="text-primary">Shop</span><span className="text-accent">.</span>
            </h2>
          </div>
          <Button variant="outline" className="gap-2 border-border/50 font-mono text-sm self-start lg:self-auto">
            EXPLORE MARKET
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="rounded-sm border border-border/50 bg-background/50 overflow-hidden hover:border-primary/30 transition-all">
                {/* Image */}
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  
                  {/* Quick Buy */}
                  <button className="absolute bottom-3 right-3 flex items-center justify-center size-10 rounded-sm bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShoppingCart className="size-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-mono text-sm">{product.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-accent">
                      <Star className="size-3 fill-accent" />
                      {product.rating}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      {product.verified && <Verified className="size-3 text-primary" />}
                      {product.seller}
                    </span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {product.location}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-mono text-primary">₦{product.price}</span>
                    <span className="text-xs text-muted-foreground">/{product.unit}</span>
                  </div>
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
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          <div>
            <div className="text-2xl font-mono text-primary">2,450+</div>
            <div className="text-xs font-mono text-muted-foreground">ACTIVE LISTINGS</div>
          </div>
          <div className="w-px h-8 bg-border/50 hidden sm:block" />
          <div>
            <div className="text-2xl font-mono text-foreground">₦45M+</div>
            <div className="text-xs font-mono text-muted-foreground">MONTHLY VOLUME</div>
          </div>
          <div className="w-px h-8 bg-border/50 hidden sm:block" />
          <div>
            <div className="text-2xl font-mono text-foreground">890</div>
            <div className="text-xs font-mono text-muted-foreground">VERIFIED SELLERS</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
