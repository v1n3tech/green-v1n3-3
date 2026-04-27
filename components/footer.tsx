'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Twitter, Send, Github, FileText } from 'lucide-react'

const footerLinks = {
  platform: [
    { label: 'Communities', href: '#communities' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Token', href: '#token' },
    { label: 'Structure', href: '#structure' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Whitepaper', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Brand Kit', href: '#' },
  ],
  company: [
    { label: 'About V1n3Tech', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Press', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Send, href: '#', label: 'Telegram' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: FileText, href: '#', label: 'Medium' },
]

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="px-4 md:px-8 lg:px-16 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-mono text-lg">
                Green<span className="text-primary">V1n3</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Cultivating Nigeria&apos;s next economy through youth agricultural empowerment, 
              powered by blockchain technology.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex items-center justify-center size-9 rounded-sm border border-border/50 bg-card/50 hover:border-primary/30 hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-mono text-xs text-muted-foreground mb-4 tracking-wider">PLATFORM</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-mono text-xs text-muted-foreground mb-4 tracking-wider">RESOURCES</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-mono text-xs text-muted-foreground mb-4 tracking-wider">COMPANY</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-mono text-xs text-muted-foreground mb-4 tracking-wider">LEGAL</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/30 px-4 md:px-8 lg:px-16 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>&copy; 2026 V1n3Tech.</span>
            <span className="hidden sm:inline">|</span>
            <span>Founded by Mantim Danzaki</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              BUILT ON SOLANA
            </span>
            <span>PLATEAU STATE, NIGERIA</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
