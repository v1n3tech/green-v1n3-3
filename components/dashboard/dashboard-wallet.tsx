'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  RefreshCw,
  Shield,
  Coins,
} from 'lucide-react'

interface DashboardWalletProps {
  walletAddress: string | null
  v1n3Balance: number
  totalEarnings: number
}

const TRANSACTIONS = [
  {
    id: '1',
    type: 'receive',
    amount: 150,
    token: 'V1N3',
    from: 'Weekly Rewards',
    timestamp: '2h ago',
    status: 'confirmed',
  },
  {
    id: '2',
    type: 'send',
    amount: 50,
    token: 'V1N3',
    to: '7xKq...m3Pf',
    timestamp: '1d ago',
    status: 'confirmed',
  },
  {
    id: '3',
    type: 'receive',
    amount: 200,
    token: 'V1N3',
    from: 'Training Bonus',
    timestamp: '3d ago',
    status: 'confirmed',
  },
  {
    id: '4',
    type: 'receive',
    amount: 75,
    token: 'V1N3',
    from: 'Referral Reward',
    timestamp: '5d ago',
    status: 'confirmed',
  },
  {
    id: '5',
    type: 'send',
    amount: 25,
    token: 'V1N3',
    to: '9aB4...x7Qr',
    timestamp: '1w ago',
    status: 'confirmed',
  },
]

export function DashboardWallet({
  walletAddress,
  v1n3Balance,
  totalEarnings,
}: DashboardWalletProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all')

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const filteredTransactions = TRANSACTIONS.filter((tx) => {
    if (activeTab === 'all') return true
    if (activeTab === 'sent') return tx.type === 'send'
    return tx.type === 'receive'
  })

  const ngnRate = 3002.40 // Mock V1N3 to NGN rate
  const ngnValue = v1n3Balance * ngnRate

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 04 — WALLET</span>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-[2px] hover:border-primary/40 transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="mono-xs text-[10px] text-foreground">REFRESH</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-background to-background border border-primary/30 rounded-[2px] p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[2px] bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ V1N3 BALANCE</p>
                <p className="mono-xs text-[10px] text-primary">SOLANA NETWORK</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-[2px]">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="mono-xs text-[10px] text-primary">+2.4%</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl sm:text-5xl text-foreground tracking-tight">
                {Number(v1n3Balance).toLocaleString(undefined, {
                  minimumFractionDigits: v1n3Balance < 1 ? 4 : 2,
                  maximumFractionDigits: 4,
                })}
              </span>
              <span className="mono-sm text-primary">V1N3</span>
            </div>
            <p className="mono-xs text-[11px] text-muted-foreground mt-2">
              ≈ N{ngnValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-primary/40 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <span className="mono-xs text-[10px] text-foreground">SEND</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-primary/40 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <QrCode className="w-4 h-4 text-primary" />
              </div>
              <span className="mono-xs text-[10px] text-foreground">RECEIVE</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-orange/40 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center group-hover:bg-orange/20 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-orange" />
              </div>
              <span className="mono-xs text-[10px] text-foreground">SWAP</span>
            </button>
          </div>
        </motion.div>

        {/* Side Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Earnings */}
          <div className="bg-background border border-border rounded-[2px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ TOTAL EARNINGS</span>
            </div>
            <p className="font-mono text-2xl text-foreground">
              N{Number(totalEarnings).toLocaleString()}
            </p>
            <p className="mono-xs text-[10px] text-muted-foreground mt-1">Lifetime earnings</p>
          </div>

          {/* Wallet Address */}
          <div className="bg-background border border-border rounded-[2px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ WALLET ADDRESS</span>
            </div>
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] text-foreground truncate flex-1">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </p>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="mono-xs text-[11px] text-muted-foreground">No wallet connected</p>
            )}
          </div>

          {/* Security */}
          <div className="bg-background border border-border rounded-[2px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ SECURITY</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="mono-xs text-[10px] text-foreground">2FA Enabled</span>
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-background border border-border rounded-[2px] overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-border px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">/ RECENT TRANSACTIONS</span>
          </div>
          <div className="flex gap-1">
            {(['all', 'sent', 'received'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 mono-xs text-[9px] rounded-[2px] transition-colors ${
                  activeTab === tab
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-border">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
              <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center ${
                tx.type === 'receive' ? 'bg-primary/10' : 'bg-orange/10'
              }`}>
                {tx.type === 'receive' ? (
                  <ArrowDownLeft className="w-5 h-5 text-primary" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-orange" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="mono-sm text-xs text-foreground">
                    {tx.type === 'receive' ? 'Received' : 'Sent'}
                  </span>
                  <span className="mono-xs text-[9px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-[2px]">
                    {tx.status.toUpperCase()}
                  </span>
                </div>
                <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">
                  {tx.type === 'receive' ? `From: ${tx.from}` : `To: ${tx.to}`}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm ${tx.type === 'receive' ? 'text-primary' : 'text-orange'}`}>
                  {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.token}
                </p>
                <p className="mono-xs text-[9px] text-muted-foreground">{tx.timestamp}</p>
              </div>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="border-t border-border p-3 text-center">
          <button className="mono-xs text-[10px] text-primary hover:text-primary/80 transition-colors">
            VIEW ALL TRANSACTIONS
          </button>
        </div>
      </motion.div>
    </div>
  )
}
