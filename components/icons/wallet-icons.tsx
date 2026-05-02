"use client"

import { SVGProps } from "react"

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string
}

// Phantom Wallet Icon - Purple ghost
export function PhantomIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="128" height="128" rx="26" fill="url(#phantom-gradient)" />
      <path
        d="M110.584 64.916C110.584 85.116 93.864 101.484 72.944 101.484C69.744 101.484 66.624 101.124 63.624 100.444L63.104 100.564C56.044 102.444 48.244 104.244 39.704 105.004C37.324 105.204 36.104 102.244 37.764 100.524C41.004 97.124 44.764 92.924 47.584 88.724C35.184 81.404 27.344 69.204 27.344 55.524C27.344 34.284 47.064 17.004 71.624 17.004C96.184 17.004 110.584 34.284 110.584 55.524V64.916Z"
        fill="white"
      />
      <ellipse cx="52.5" cy="53" rx="8.5" ry="10" fill="#AB9FF2" />
      <ellipse cx="76.5" cy="53" rx="8.5" ry="10" fill="#AB9FF2" />
      <defs>
        <linearGradient
          id="phantom-gradient"
          x1="0"
          y1="0"
          x2="128"
          y2="128"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#534BB1" />
          <stop offset="1" stopColor="#551BF9" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Solflare Wallet Icon - Orange flame
export function SolflareIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="128" height="128" rx="26" fill="#121212" />
      <path
        d="M64 20C64 20 44 44 44 68C44 80 52 92 64 100C76 92 84 80 84 68C84 44 64 20 64 20Z"
        fill="url(#solflare-gradient-1)"
      />
      <path
        d="M64 40C64 40 52 56 52 72C52 80 56 88 64 94C72 88 76 80 76 72C76 56 64 40 64 40Z"
        fill="url(#solflare-gradient-2)"
      />
      <path
        d="M64 56C64 56 58 66 58 76C58 82 60 86 64 90C68 86 70 82 70 76C70 66 64 56 64 56Z"
        fill="#FFDC40"
      />
      <defs>
        <linearGradient
          id="solflare-gradient-1"
          x1="64"
          y1="20"
          x2="64"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FC7227" />
          <stop offset="1" stopColor="#FC4C27" />
        </linearGradient>
        <linearGradient
          id="solflare-gradient-2"
          x1="64"
          y1="40"
          x2="64"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFA726" />
          <stop offset="1" stopColor="#FF7043" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Torus Wallet Icon - Blue torus shape
export function TorusIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="128" height="128" rx="26" fill="#0364FF" />
      <circle cx="64" cy="64" r="36" stroke="white" strokeWidth="6" fill="none" />
      <circle cx="64" cy="64" r="18" fill="white" />
      <circle cx="64" cy="64" r="8" fill="#0364FF" />
    </svg>
  )
}

// Ledger Wallet Icon - Black with white text/logo
export function LedgerIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="128" height="128" rx="26" fill="#000000" />
      <path
        d="M24 78V92H54V86H30V78H24Z"
        fill="white"
      />
      <path
        d="M24 36V50H30V42H54V36H24Z"
        fill="white"
      />
      <path
        d="M74 36V92H104V86H80V64H98V58H80V42H104V36H74Z"
        fill="white"
      />
      <rect x="54" y="54" width="14" height="20" fill="white" />
    </svg>
  )
}

// Backpack Wallet Icon
export function BackpackIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="128" height="128" rx="26" fill="#E33E3F" />
      <path
        d="M64 24C48 24 36 36 36 52V100H92V52C92 36 80 24 64 24Z"
        fill="white"
      />
      <rect x="48" y="40" width="32" height="24" rx="4" fill="#E33E3F" />
      <rect x="56" y="70" width="16" height="8" rx="2" fill="#E33E3F" />
    </svg>
  )
}

// Generic Solana Wallet Icon
export function SolanaWalletIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="128" height="128" rx="26" fill="url(#solana-gradient)" />
      <path
        d="M32 82L52 62H96L76 82H32Z"
        fill="white"
      />
      <path
        d="M32 46L52 66H96L76 46H32Z"
        fill="white"
      />
      <path
        d="M32 64L52 44H96L76 64H32Z"
        fill="white"
        fillOpacity="0.6"
      />
      <defs>
        <linearGradient
          id="solana-gradient"
          x1="0"
          y1="0"
          x2="128"
          y2="128"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export const WalletIcons = {
  phantom: PhantomIcon,
  solflare: SolflareIcon,
  torus: TorusIcon,
  ledger: LedgerIcon,
  backpack: BackpackIcon,
  default: SolanaWalletIcon,
} as const

export type WalletIconName = keyof typeof WalletIcons
