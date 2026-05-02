import type { Metadata, Viewport } from 'next'
import { Abel, Aldrich } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { V1n3Loader } from '@/components/v1n3-loader'
import './globals.css'

const _abel = Abel({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-abel'
})

const _aldrich = Aldrich({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-aldrich'
})

export const metadata: Metadata = {
  title: 'GreenV1n3 | AgroV1n3 Program - Cultivating Nigeria\'s Next Economy',
  description: 'Join 10,000+ Agro Executives transforming Nigeria\'s agriculture. Access 14 communities, earn V1n3 tokens, and be part of the agricultural revolution.',
  generator: 'v0.app',
  keywords: ['agriculture', 'Nigeria', 'youth employment', 'farming', 'agribusiness', 'blockchain', 'Solana', 'V1n3'],
  authors: [{ name: 'Mantim Danzaki', url: 'https://v1n3tech.com' }],
  creator: 'V1n3Tech',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'GreenV1n3 | AgroV1n3 Program',
    description: 'Cultivating Nigeria\'s Next Economy through Youth Agricultural Empowerment',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a1f0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${_abel.variable} ${_aldrich.variable} font-sans antialiased bg-green-glow`}>
        <V1n3Loader minDisplayTime={1000} />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
