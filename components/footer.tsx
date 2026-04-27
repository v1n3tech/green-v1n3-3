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
    <footer className="border-t border-border bg-card/20">
      <div className="max-w-[1440px] mx-auto px-5 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <Image
                src="/logo.png"
                alt="GreenV1n3"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="mono text-base tracking-wider">
                <span className="text-foreground">GREEN</span>
                <span className="text-primary">V1N3</span>
              </span>
            </Link>
            <p className="text-sm text-foreground/50 leading-relaxed mb-6 max-w-xs">
              Cultivating Nigeria&apos;s next economy through youth agricultural empowerment, 
              powered by blockchain technology.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded-[2px] bg-card/30 hover:border-primary/50 hover:text-primary transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-4">PLATFORM</h4>
            <ul className="space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-4">RESOURCES</h4>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-4">COMPANY</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mono-xs text-muted-foreground mb-4">LEGAL</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
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
        <div className="max-w-[1440px] mx-auto px-5 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 mono-xs text-muted-foreground">
              <span>&copy; 2026 V1N3TECH</span>
              <span className="text-border-strong">/</span>
              <span>FOUNDED BY MANTIM DANZAKI</span>
            </div>
            <div className="flex items-center gap-4 mono-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="status-dot status-dot-pulse" />
                BUILT ON SOLANA
              </span>
              <span className="text-border-strong">/</span>
              <span>PLATEAU STATE, NIGERIA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
