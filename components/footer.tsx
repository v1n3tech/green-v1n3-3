'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Twitter, Send, Github, FileText } from 'lucide-react'

const footerLinks = {
  platform: [
    { label: 'Doctrine', href: '#doctrine' },
    { label: 'Communities', href: '#communities' },
    { label: 'Infrastructure', href: '#infra' },
    { label: 'V1n3 Token', href: '#chain' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Whitepaper', href: '/whitepaper' },
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
    <footer className="border-t border-border bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={32}
                height={32}
                className="object-contain w-7 h-7 sm:w-8 sm:h-8"
              />
              <span className="mono text-sm sm:text-base tracking-wider">
                <span className="text-foreground">GREEN</span>
                <span className="text-primary">V1N3</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-foreground/50 leading-relaxed mb-5 sm:mb-6 max-w-xs">
              Cultivating Nigeria&apos;s next economy through youth agricultural empowerment, 
              powered by blockchain technology.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-border rounded-[2px] bg-card/30 hover:border-primary/50 hover:text-primary transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-3 sm:mb-4 text-[10px] sm:text-[11px]">PLATFORM</h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs sm:text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-3 sm:mb-4 text-[10px] sm:text-[11px]">RESOURCES</h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs sm:text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-3 sm:mb-4 text-[10px] sm:text-[11px]">COMPANY</h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs sm:text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-3 sm:mb-4 text-[10px] sm:text-[11px]">LEGAL</h4>
            <ul className="space-y-2 sm:space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs sm:text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mono-xs text-muted-foreground text-[9px] sm:text-[10px]">
              <span>&copy; 2026 V1N3TECH</span>
              <span className="text-border-strong">/</span>
              <span>FOUNDED BY MANTIM DANZAKI</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 mono-xs text-muted-foreground text-[9px] sm:text-[10px]">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="status-dot status-dot-pulse" />
                BUILT ON SOLANA
              </span>
              <span className="text-border-strong hidden sm:inline">/</span>
              <span>PLATEAU STATE, NIGERIA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
