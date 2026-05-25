'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction as SolanaTransaction, Connection } from '@solana/web3.js'
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, getAccount, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
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
  Coins,
  Link2,
  Unlink,
  Loader2,
  Zap,
  Globe,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react'
import { V1N3_TOKEN, V1N3_MINT_PUBKEY, getExplorerUrl, formatV1N3Balance, formatNGN, v1n3ToNGN, SOLANA_NETWORK, SOLANA_RPC_ENDPOINT } from '@/lib/wallet/v1n3-token'
import { useV1N3Balance, useSOLBalance } from '@/lib/wallet/use-v1n3-balance'
import { createClient } from '@/lib/supabase/client'

interface DashboardWalletProps {
  walletAddress: string | null
  v1n3Balance: number
  totalEarnings: number
}

interface Transaction {
  id: string
  type: 'receive' | 'send' | 'swap' | 'stake' | 'unstake' | 'reward'
  amount: number
  token_symbol: string
  from_address: string
  to_address: string
  created_at: string
  status: 'confirmed' | 'pending' | 'failed'
  signature?: string | null
  memo?: string | null
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  
  // Send modal state
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendMemo, setSendMemo] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendSignature, setSendSignature] = useState<string | null>(null)
  
  // ATA state
  const [hasATA, setHasATA] = useState<boolean | null>(null)
  const [ataAddress, setAtaAddress] = useState<string | null>(null)
  const [creatingATA, setCreatingATA] = useState(false)
  
  // Solana wallet adapter hooks
  const { publicKey, connected, disconnect, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  
  // Create devnet connection for V1N3 (Token-2022)
  const devnetConnection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed')
  
  // Real-time V1N3 balance from blockchain
  const { balance: onChainBalance, loading: balanceLoading, refetch: refetchBalance } = useV1N3Balance(walletAddress)
  const { balance: solBalance, loading: solLoading, refetch: refetchSol } = useSOLBalance(walletAddress)
  
  // Use on-chain balance (it's accurate even if 0), only fall back to DB if blockchain fails
  const displayBalance = balanceLoading ? dbBalance : onChainBalance
  const ngnValue = v1n3ToNGN(displayBalance)

  // Check ATA status on mount
  useEffect(() => {
    const checkATA = async () => {
      if (!walletAddress) return
      try {
        const response = await fetch('/api/wallet/ensure-ata')
        if (response.ok) {
          const data = await response.json()
          setHasATA(data.hasATA)
          setAtaAddress(data.ataAddress)
        }
      } catch (err) {
        console.error('[v0] Error checking ATA:', err)
      }
    }
    checkATA()
  }, [walletAddress])

  // Create ATA if needed
  const handleCreateATA = async () => {
    setCreatingATA(true)
    try {
      const response = await fetch('/api/wallet/ensure-ata', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        setHasATA(true)
        setAtaAddress(data.ataAddress)
      } else {
        console.error('[v0] Failed to create ATA:', data.error)
      }
    } catch (err) {
      console.error('[v0] Error creating ATA:', err)
    } finally {
      setCreatingATA(false)
    }
  }

  // Fetch transactions from API (includes both blockchain and database)
  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return
    
    setLoadingTx(true)
    
    try {
      const response = await fetch('/api/wallet/transactions')
      if (response.ok) {
        const data = await response.json()
        
        // Map API response to Transaction interface
        const mapped = (data.transactions || []).map((tx: {
          id: string
          signature: string | null
          type: string
          status: string
          tokenSymbol: string
          amount: number
          fromAddress: string
          toAddress: string
          timestamp: number
          memo: string | null
        }) => ({
          id: tx.id,
          type: tx.type as 'send' | 'receive',
          amount: tx.amount,
          token_symbol: tx.tokenSymbol,
          from_address: tx.fromAddress,
          to_address: tx.toAddress,
          created_at: new Date(tx.timestamp).toISOString(),
          status: tx.status as 'confirmed' | 'pending' | 'failed',
          signature: tx.signature,
          memo: tx.memo,
        })) as Transaction[]
        
        setTransactions(mapped)
      } else {
        // Fallback to database only
        const supabase = createClient()
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (!error && data) {
          const mapped = data.map((tx: Record<string, unknown>) => ({
            ...tx,
            type: tx.from_address === walletAddress ? 'send' : 'receive',
          })) as Transaction[]
          setTransactions(mapped)
        }
      }
    } catch (err) {
      console.error('[v0] Error fetching transactions:', err)
    }
    
    setLoadingTx(false)
  }, [walletAddress])

  // Real-time subscription for new transactions
  useEffect(() => {
    if (!walletAddress) return

    fetchTransactions()

    const supabase = createClient()
    
    const channel = supabase
      .channel(`wallet-transactions-${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
        },
        (payload) => {
          const newTx = payload.new as Record<string, unknown>
          // Check if this transaction involves our wallet
          if (newTx.from_address === walletAddress || newTx.to_address === walletAddress) {
            const mapped = {
              ...newTx,
              type: newTx.from_address === walletAddress ? 'send' : 'receive',
            } as Transaction
            setTransactions(prev => [mapped, ...prev].slice(0, 20))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_transactions',
        },
        (payload) => {
          const updatedTx = payload.new as Transaction
          setTransactions(prev => 
            prev.map(tx => tx.id === updatedTx.id ? { ...updatedTx, type: updatedTx.from_address === walletAddress ? 'send' : 'receive' } : tx)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [walletAddress, fetchTransactions])

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
    await Promise.all([refetchBalance(), refetchSol(), fetchTransactions()])
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleConnectWallet = () => {
    setVisible(true)
  }

  const handleSend = async () => {
    if (!walletAddress || !sendTo || !sendAmount) return
    
    // Check if external wallet is connected for signing
    if (!connected || !publicKey || !signTransaction) {
      setSendError('Please connect your wallet to send V1N3')
      return
    }
    
    setSendLoading(true)
    setSendError(null)
    setSendSignature(null)
    
    try {
      const amount = parseFloat(sendAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount')
      }
      
      if (amount > displayBalance) {
        throw new Error('Insufficient balance')
      }
      
      // Validate recipient address
      let recipientPubkey: PublicKey
      try {
        recipientPubkey = new PublicKey(sendTo)
      } catch {
        throw new Error('Invalid Solana address')
      }
      
      // Get source and destination ATAs (Token-2022)
      const fromAta = await getAssociatedTokenAddress(
        V1N3_MINT_PUBKEY,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      )
      const toAta = await getAssociatedTokenAddress(
        V1N3_MINT_PUBKEY,
        recipientPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      )
      
      // Build transaction
      const transaction = new SolanaTransaction()
      
      // Check if destination ATA exists, create if not
      try {
        await getAccount(devnetConnection, toAta, 'confirmed', TOKEN_2022_PROGRAM_ID)
      } catch {
        // ATA doesn't exist, add instruction to create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            toAta, // ata
            recipientPubkey, // owner
            V1N3_MINT_PUBKEY,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )
      }
      
      // Add transfer instruction
      const amountInLamports = BigInt(Math.floor(amount * Math.pow(10, V1N3_TOKEN.decimals)))
      transaction.add(
        createTransferInstruction(
          fromAta,
          toAta,
          publicKey,
          amountInLamports,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      )
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await devnetConnection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey
      
      // Sign with wallet adapter
      const signedTx = await signTransaction(transaction)
      
      // Send transaction
      const signature = await devnetConnection.sendRawTransaction(signedTx.serialize())
      
      // Confirm transaction
      await devnetConnection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })
      
      setSendSignature(signature)
      setSendSuccess(true)
      setSendTo('')
      setSendAmount('')
      setSendMemo('')
      
      // Refresh data
      await handleRefresh()
      
    } catch (err) {
      console.error('[v0] Send error:', err)
      setSendError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSendLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true
    if (activeTab === 'sent') return tx.type === 'send'
    return tx.type === 'receive'
  })

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

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
              disabled={!walletAddress || displayBalance <= 0}
              className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-primary/40 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <span className="mono-xs text-[10px] text-foreground">SEND</span>
            </button>
            <button 
              onClick={() => setShowReceiveModal(true)}
              disabled={!walletAddress}
              className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-primary/40 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <QrCode className="w-4 h-4 text-primary" />
              </div>
              <span className="mono-xs text-[10px] text-foreground">RECEIVE</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-[2px] hover:border-orange/40 transition-colors group opacity-50 cursor-not-allowed">
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
                {solLoading ? '...' : solBalance.toFixed(6)}
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
            {loadingTx && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
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
                  tx.type === 'receive' || tx.type === 'reward' ? 'bg-primary/10' : 'bg-orange/10'
                }`}>
                  {tx.type === 'receive' || tx.type === 'reward' ? (
                    <ArrowDownLeft className="w-5 h-5 text-primary" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-orange" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="mono-sm text-xs text-foreground">
                      {tx.type === 'receive' || tx.type === 'reward' ? 'Received' : 'Sent'}
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
                    {tx.type === 'receive' || tx.type === 'reward' 
                      ? `From: ${tx.memo || truncateAddress(tx.from_address)}` 
                      : `To: ${truncateAddress(tx.to_address)}`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm ${tx.type === 'receive' || tx.type === 'reward' ? 'text-primary' : 'text-orange'}`}>
                    {tx.type === 'receive' || tx.type === 'reward' ? '+' : '-'}{tx.amount} {tx.token_symbol}
                  </p>
                  <p className="mono-xs text-[9px] text-muted-foreground">{formatTimeAgo(tx.created_at)}</p>
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
              <p className="mono-xs text-muted-foreground">
                {loadingTx ? 'Loading transactions...' : 'No transactions yet'}
              </p>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowReceiveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border rounded-[2px] p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-lg text-foreground">Receive V1N3</h3>
                <button 
                  onClick={() => setShowReceiveModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* ATA Status */}
              {hasATA === false && !ataAddress && (
                <div className="bg-orange/10 border border-orange/30 rounded-[2px] p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-orange shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="mono-xs text-[11px] text-orange font-medium mb-2">
                        V1N3 Token Account Required
                      </p>
                      <p className="mono-xs text-[10px] text-orange/80 mb-3">
                        You need a V1N3 token account to receive tokens. This is a one-time setup that costs a small amount of SOL.
                      </p>
                      <button
                        onClick={handleCreateATA}
                        disabled={creatingATA || solBalance < 0.002}
                        className="w-full py-2 bg-orange text-background mono-xs text-[10px] rounded-[2px] hover:bg-orange/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {creatingATA ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            CREATING ACCOUNT...
                          </>
                        ) : solBalance < 0.002 ? (
                          'NEED MORE SOL'
                        ) : (
                          'CREATE TOKEN ACCOUNT'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {(hasATA === true || ataAddress) && (
                <div className="bg-primary/10 border border-primary/30 rounded-[2px] p-3 mb-4">
                  <div className="flex gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <p className="mono-xs text-[10px] text-primary">
                      Ready to receive V1N3 tokens
                    </p>
                  </div>
                </div>
              )}
              
              <p className="mono-xs text-[11px] text-muted-foreground mb-4">
                Share this address to receive V1N3 or SOL.
              </p>
              
              <div className="bg-secondary/50 border border-border rounded-[2px] p-4 mb-4">
                <p className="mono-xs text-[9px] text-muted-foreground mb-2">YOUR WALLET ADDRESS</p>
                <p className="font-mono text-xs text-foreground break-all select-all">{walletAddress}</p>
              </div>
              
              <div className="bg-orange/10 border border-orange/30 rounded-[2px] p-3 mb-4">
                <p className="mono-xs text-[10px] text-orange">
                  Solana {SOLANA_NETWORK} address. Only send Solana-based tokens.
                </p>
              </div>
              
              <button
                onClick={() => handleCopy(walletAddress, 'address')}
                className="w-full py-2.5 bg-primary text-background mono-xs text-[11px] rounded-[2px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'COPIED!' : 'COPY ADDRESS'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && walletAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => !sendLoading && setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border rounded-[2px] p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-lg text-foreground">Send V1N3</h3>
                <button 
                  onClick={() => !sendLoading && setShowSendModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  disabled={sendLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {sendSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-mono text-lg text-foreground mb-2">Transaction Successful</p>
                  <p className="mono-xs text-muted-foreground mb-4">Your V1N3 has been sent</p>
                  {sendSignature && (
                    <a
                      href={getExplorerUrl(sendSignature, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mono-xs text-[11px]"
                    >
                      View on Explorer
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSendSuccess(false)
                      setSendSignature(null)
                      setShowSendModal(false)
                    }}
                    className="w-full mt-6 py-2.5 bg-primary text-background mono-xs text-[11px] rounded-[2px] hover:bg-primary/90 transition-colors"
                  >
                    CLOSE
                  </button>
                </div>
              ) : !connected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-mono text-lg text-foreground mb-2">Connect Wallet</p>
                  <p className="mono-xs text-muted-foreground mb-4">Connect your wallet to send V1N3</p>
                  <button
                    onClick={handleConnectWallet}
                    className="w-full py-2.5 bg-primary text-background mono-xs text-[11px] rounded-[2px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    CONNECT WALLET
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-4">
                    {/* Recipient */}
                    <div>
                      <label className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em] block mb-2">
                        RECIPIENT ADDRESS
                      </label>
                      <input
                        type="text"
                        value={sendTo}
                        onChange={(e) => setSendTo(e.target.value)}
                        placeholder="Enter Solana wallet address"
                        className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] text-foreground font-mono text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                        disabled={sendLoading}
                      />
                    </div>
                    
                    {/* Amount */}
                    <div>
                      <label className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em] block mb-2">
                        AMOUNT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.0001"
                          className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] text-foreground font-mono text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 pr-20"
                          disabled={sendLoading}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
                          <button
                            type="button"
                            onClick={() => setSendAmount(displayBalance.toString())}
                            className="mono-xs text-[9px] text-primary hover:text-primary/80"
                            disabled={sendLoading}
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                        Available: {formatV1N3Balance(displayBalance)} V1N3
                      </p>
                    </div>
                    
                    {/* Memo */}
                    <div>
                      <label className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em] block mb-2">
                        MEMO (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        value={sendMemo}
                        onChange={(e) => setSendMemo(e.target.value)}
                        placeholder="Add a note"
                        className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] text-foreground font-mono text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                        disabled={sendLoading}
                      />
                    </div>
                  </div>
                  
                  {sendError && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-[2px] p-3 mb-4">
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <p className="mono-xs text-[10px] text-destructive">{sendError}</p>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleSend}
                    disabled={sendLoading || !sendTo || !sendAmount}
                    className="w-full py-2.5 bg-primary text-background mono-xs text-[11px] rounded-[2px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        SEND V1N3
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
