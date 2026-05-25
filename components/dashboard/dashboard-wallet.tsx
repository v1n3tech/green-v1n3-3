'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  Copy,
  Check,
  TrendingUp,
  Clock,
  ExternalLink,
  RefreshCw,
  Shield,
  Coins,
  Link2,
  Unlink,
  Loader2,
  Zap,
  Globe,
  ChevronRight,
} from 'lucide-react'
import { V1N3_TOKEN, getExplorerUrl, formatV1N3Balance, formatNGN, v1n3ToNGN, SOLANA_NETWORK } from '@/lib/wallet/v1n3-token'
import { useV1N3Balance, useSOLBalance } from '@/lib/wallet/use-v1n3-balance'
import { createClient } from '@/lib/supabase/client'

interface DashboardWalletProps {
  walletAddress: string | null
  v1n3Balance: number
  totalEarnings: number
}

interface Transaction {
  id: string
  type: 'receive' | 'send'
  amount: number
  token: string
  from?: string
  to?: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'failed'
  signature?: string
}

export function DashboardWallet({
  walletAddress,
  v1n3Balance: dbBalance,
  totalEarnings,
}: DashboardWalletProps) {
  const [copied, setCopied] = useState(false)
  const [copiedMint, setCopiedMint] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  
  // Solana wallet adapter hooks
  const { publicKey, connected, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  
  // Real-time V1N3 balance from blockchain
  const { balance: onChainBalance, loading: balanceLoading, refetch: refetchBalance } = useV1N3Balance(walletAddress)
  const { balance: solBalance, loading: solLoading } = useSOLBalance(walletAddress)
  
  // Use on-chain balance if available, otherwise fall back to DB balance
  const displayBalance = onChainBalance > 0 ? onChainBalance : dbBalance
  const ngnValue = v1n3ToNGN(displayBalance)

  // Mock transactions - in production, fetch from blockchain
  const transactions: Transaction[] = [
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
  ]

  const handleCopy = (text: string, type: 'address' | 'mint') => {
    navigator.clipboard.writeText(text)
    if (type === 'address') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopiedMint(true)
      setTimeout(() => setCopiedMint(false), 2000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchBalance()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleConnectWallet = () => {
    setVisible(true)
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true
    if (activeTab === 'sent') return tx.type === 'send'
    return tx.type === 'receive'
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 04 — WALLET</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Network Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange/10 border border-orange/30 rounded-[2px]">
            <Globe className="w-3 h-3 text-orange" />
            <span className="mono-xs text-[9px] text-orange tracking-wider">{SOLANA_NETWORK.toUpperCase()}</span>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-[2px] hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="mono-xs text-[10px] text-foreground">REFRESH</span>
          </button>
        </div>
      </div>

      {/* Token Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/5 via-background to-orange/5 border border-border rounded-[2px] p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="font-mono text-sm text-primary font-bold">V1</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-foreground font-medium">{V1N3_TOKEN.name}</span>
                <span className="mono-xs text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">{V1N3_TOKEN.symbol}</span>
              </div>
              <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">SPL Token on Solana</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="mono-xs text-[9px] text-muted-foreground">MINT ADDRESS</p>
              <div className="flex items-center gap-1.5">
                <code className="mono-xs text-[10px] text-foreground">
                  {V1N3_TOKEN.mintAddress.slice(0, 8)}...{V1N3_TOKEN.mintAddress.slice(-8)}
                </code>
                <button
                  onClick={() => handleCopy(V1N3_TOKEN.mintAddress, 'mint')}
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  {copiedMint ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href={getExplorerUrl(V1N3_TOKEN.mintAddress, 'address')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
                <p className="mono-xs text-[10px] text-primary">SOLANA {SOLANA_NETWORK.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {balanceLoading && (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-[2px]">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="mono-xs text-[10px] text-primary">+2.4%</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl sm:text-5xl text-foreground tracking-tight">
                {formatV1N3Balance(displayBalance)}
              </span>
              <span className="mono-sm text-primary">V1N3</span>
            </div>
            <p className="mono-xs text-[11px] text-muted-foreground mt-2">
              ≈ {formatNGN(ngnValue)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setShowSendModal(true)}
              className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-primary/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <span className="mono-xs text-[10px] text-foreground">SEND</span>
            </button>
            <button 
              onClick={() => setShowReceiveModal(true)}
              className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-primary/40 transition-colors group"
            >
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
          {/* SOL Balance */}
          <div className="bg-background border border-border rounded-[2px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-orange" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ SOL BALANCE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-2xl text-foreground">
                {solLoading ? '...' : solBalance.toFixed(4)}
              </p>
              <span className="mono-xs text-orange">SOL</span>
            </div>
            <p className="mono-xs text-[10px] text-muted-foreground mt-1">For transaction fees</p>
          </div>

          {/* Wallet Address */}
          <div className="bg-background border border-border rounded-[2px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ CUSTODIAL WALLET</span>
            </div>
            {walletAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[11px] text-foreground truncate flex-1">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </p>
                  <button
                    onClick={() => handleCopy(walletAddress, 'address')}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={getExplorerUrl(walletAddress, 'address')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="mono-xs text-[11px] text-muted-foreground">No wallet assigned</p>
            )}
          </div>

          {/* External Wallet Connection */}
          <div className="bg-background border border-border rounded-[2px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-accent" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ EXTERNAL WALLET</span>
            </div>
            {connected && publicKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[11px] text-foreground truncate flex-1">
                    {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                  </p>
                  <button
                    onClick={() => disconnect()}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Disconnect"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="mono-xs text-[10px] text-primary">Connected</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="w-full py-2 px-3 bg-primary/10 border border-primary/30 rounded-[2px] hover:bg-primary/20 transition-colors"
              >
                <span className="mono-xs text-[10px] text-primary">CONNECT WALLET</span>
              </button>
            )}
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
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
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
                    <span className={`mono-xs text-[9px] px-1.5 py-0.5 rounded-[2px] ${
                      tx.status === 'confirmed' 
                        ? 'bg-primary/10 text-primary' 
                        : tx.status === 'pending'
                        ? 'bg-orange/10 text-orange'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
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
                {tx.signature && (
                  <a 
                    href={getExplorerUrl(tx.signature, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="mono-xs text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>

        {/* View All */}
        <div className="border-t border-border p-3 text-center">
          <a 
            href={walletAddress ? getExplorerUrl(walletAddress, 'address') : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-xs text-[10px] text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
          >
            VIEW ON EXPLORER
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </motion.div>

      {/* Receive Modal */}
      <AnimatePresence>
        {showReceiveModal && walletAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowReceiveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border rounded-[2px] p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-mono text-lg text-foreground mb-4">Receive V1N3</h3>
              <div className="bg-secondary/50 border border-border rounded-[2px] p-4 mb-4">
                <p className="mono-xs text-[10px] text-muted-foreground mb-2">YOUR WALLET ADDRESS</p>
                <p className="font-mono text-xs text-foreground break-all">{walletAddress}</p>
              </div>
              <button
                onClick={() => handleCopy(walletAddress, 'address')}
                className="w-full py-2.5 bg-primary text-background mono-xs text-[11px] rounded-[2px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'COPIED!' : 'COPY ADDRESS'}
              </button>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-full py-2.5 mt-2 border border-border text-foreground mono-xs text-[11px] rounded-[2px] hover:bg-secondary/50 transition-colors"
              >
                CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border rounded-[2px] p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-mono text-lg text-foreground mb-4">Send V1N3</h3>
              <p className="mono-xs text-muted-foreground mb-4">
                Send functionality will be available soon. Your V1N3 tokens are securely stored.
              </p>
              <button
                onClick={() => setShowSendModal(false)}
                className="w-full py-2.5 border border-border text-foreground mono-xs text-[11px] rounded-[2px] hover:bg-secondary/50 transition-colors"
              >
                CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
