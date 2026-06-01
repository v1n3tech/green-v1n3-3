'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Lock,
  Unlock,
  Gift,
  Clock,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Timer,
  Crown,
} from 'lucide-react'
import Image from 'next/image'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { useV1N3Balance } from '@/lib/wallet/use-v1n3-balance'
import { formatV1N3Balance } from '@/lib/wallet/v1n3-token'
import {
  LOCK_PERIODS,
  ADMIN_WALLET,
  getStakeInfoPDA,
  createStakeInstruction,
  createUnstakeInstruction,
  createClaimRewardsInstruction,
  createInitializeVaultInstruction,
  createFundRewardsInstruction,
  parseStakeInfo,
  calculatePendingRewards,
  getExplorerUrl,
  formatTimeRemaining,
  type StakeInfo,
  type LockPeriodOption,
} from '@/lib/staking/staking-program'

interface StakingDashboardProps {
  walletAddress: string | null
  v1n3Balance: number
  isCustodial?: boolean
}

export function StakingDashboard({
  walletAddress,
  v1n3Balance: dbBalance,
  isCustodial = false,
}: StakingDashboardProps) {
  // Wallet adapter (for external wallets only)
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  
  // Determine effective wallet - use props wallet for custodial, adapter for external
  const effectiveWalletAddress = isCustodial ? walletAddress : (publicKey?.toBase58() ?? walletAddress)
  const canTransact = isCustodial ? !!walletAddress : (connected && !!signTransaction)

  // Admin (Mantim) check - matches whether the admin is on a custodial wallet
  // (signed server-side) or an external wallet (signed via the adapter).
  const isAdmin = effectiveWalletAddress === ADMIN_WALLET
  
  // State
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<LockPeriodOption>(LOCK_PERIODS[2])
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isInitializingVault, setIsInitializingVault] = useState(false)
  const [vaultInitialized, setVaultInitialized] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [isFunding, setIsFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [successTx, setSuccessTx] = useState<string | null>(null)
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [isLoadingStakeInfo, setIsLoadingStakeInfo] = useState(true)
  const [dbStakingData, setDbStakingData] = useState<{
    totalStaked: number
    pendingRewards: number
    positions: Array<{
      id: string
      amount: number
      staked_at: string
      locked_until: string | null
      lock_period_days: number
      apy: number
      is_active: boolean
    }>
  } | null>(null)

  // Get on-chain balance
  const { balance: onChainBalance, loading: balanceLoading, refetch: refreshBalance } = useV1N3Balance(effectiveWalletAddress)
  const displayBalance = balanceLoading ? dbBalance : onChainBalance

  // Calculate available balance
  const stakedAmount = isCustodial 
    ? (dbStakingData?.totalStaked ?? 0)
    : (stakeInfo?.stakedAmount?.toNumber() ?? 0) / 1e9
  const availableBalance = Math.max(0, displayBalance - stakedAmount)

  // Fetch staking data from database (for custodial wallets)
  const fetchDbStakingData = useCallback(async () => {
    if (!isCustodial) return
    
    try {
      setIsLoadingStakeInfo(true)
      const response = await fetch('/api/staking/positions')
      if (response.ok) {
        const data = await response.json()
        setDbStakingData(data)
        setPendingRewards(data.pendingRewards ?? 0)
      }
    } catch (err) {
      console.error('Error fetching staking data:', err)
    } finally {
      setIsLoadingStakeInfo(false)
    }
  }, [isCustodial])

  // Fetch stake info from chain (for external wallets)
  const fetchOnChainStakeInfo = useCallback(async () => {
    if (isCustodial || !publicKey || !connection) {
      setIsLoadingStakeInfo(false)
      return
    }
    
    try {
      setIsLoadingStakeInfo(true)
      const [stakeInfoPDA] = getStakeInfoPDA(publicKey)
      const accountInfo = await connection.getAccountInfo(stakeInfoPDA)
      
      if (accountInfo) {
        const info = parseStakeInfo(accountInfo.data as Buffer)
        setStakeInfo(info)
      } else {
        setStakeInfo(null)
      }
    } catch (err) {
      console.error('Error fetching stake info:', err)
      setStakeInfo(null)
    } finally {
      setIsLoadingStakeInfo(false)
    }
  }, [isCustodial, publicKey, connection])

  // Fetch data on mount
  useEffect(() => {
    if (isCustodial) {
      fetchDbStakingData()
    } else {
      fetchOnChainStakeInfo()
    }
  }, [isCustodial, fetchDbStakingData, fetchOnChainStakeInfo])

  // Calculate pending rewards for external wallets
  useEffect(() => {
    if (isCustodial || !stakeInfo || !stakeInfo.isActive) {
      if (!isCustodial) setPendingRewards(0)
      return
    }

    const updateRewards = () => {
      const rewards = calculatePendingRewards(
        stakeInfo.stakedAmount,
        stakeInfo.lockPeriod.toNumber(),
        stakeInfo.stakeTimestamp.toNumber(),
        stakeInfo.lastClaimTimestamp.toNumber()
      )
      setPendingRewards(rewards)
    }

    updateRewards()
    const interval = setInterval(updateRewards, 30000)
    return () => clearInterval(interval)
  }, [isCustodial, stakeInfo])

  // Copy wallet address
  const copyAddress = () => {
    if (effectiveWalletAddress) {
      navigator.clipboard.writeText(effectiveWalletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle initialize vault (admin only) - uses the connected admin wallet to sign
  const handleInitializeVault = async () => {
    setIsInitializingVault(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
      if (isCustodial) {
        // CUSTODIAL: admin keypair is decrypted and signed server-side.
        const response = await fetch('/api/staking/initialize-vault', { method: 'POST' })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize vault')
        }
        setSuccess('Reward Vault initialized successfully')
        if (data.signature) setSuccessTx(data.signature)
        setVaultInitialized(true)
      } else {
        // EXTERNAL: admin signs with the connected wallet adapter.
        if (!publicKey || !signTransaction || !connection) {
          throw new Error('Please connect the admin wallet first')
        }
        if (publicKey.toBase58() !== ADMIN_WALLET) {
          throw new Error('Only the admin wallet can initialize the vault')
        }

        const instruction = createInitializeVaultInstruction(publicKey)
        const transaction = new Transaction().add(instruction)
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signedTx = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature, 'confirmed')

        setSuccess('Reward Vault initialized successfully')
        setSuccessTx(signature)
        setVaultInitialized(true)
      }
    } catch (err) {
      console.error('Initialize vault error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize vault. Please try again.')
    } finally {
      setIsInitializingVault(false)
    }
  }

  // Handle fund rewards (admin only) - deposits V1N3 into the reward vault
  const handleFundRewards = async () => {
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount to fund')
      return
    }

    setIsFunding(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
      if (isCustodial) {
        const response = await fetch('/api/staking/fund-rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fund rewards')
        }
        setSuccess(`Funded reward vault with ${amount.toLocaleString()} V1N3`)
        if (data.signature) setSuccessTx(data.signature)
        setFundAmount('')
        await refreshBalance()
      } else {
        if (!publicKey || !signTransaction || !connection) {
          throw new Error('Please connect the admin wallet first')
        }
        if (publicKey.toBase58() !== ADMIN_WALLET) {
          throw new Error('Only the admin wallet can fund rewards')
        }

        const rawAmount = new BN(Math.floor(amount * 1e9))
        const instruction = createFundRewardsInstruction(publicKey, rawAmount)
        const transaction = new Transaction().add(instruction)
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signedTx = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature, 'confirmed')

        setSuccess(`Funded reward vault with ${amount.toLocaleString()} V1N3`)
        setSuccessTx(signature)
        setFundAmount('')
        await refreshBalance()
      }
    } catch (err) {
      console.error('Fund rewards error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fund rewards. Please try again.')
    } finally {
      setIsFunding(false)
    }
  }

  // Handle stake - CUSTODIAL: call API, EXTERNAL: use wallet adapter
  const handleStake = async () => {
    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount < 100) {
      setError('Minimum stake amount is 100 V1N3')
      return
    }

    if (amount > availableBalance) {
      setError('Insufficient V1N3 balance')
      return
    }

    setIsStaking(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
      if (isCustodial) {
        // CUSTODIAL: Call server API
        const response = await fetch('/api/staking/stake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount,
            lockPeriodDays: selectedLockPeriod.days,
            lockPeriodSeconds: selectedLockPeriod.seconds,
            apy: selectedLockPeriod.apy
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to stake')
        }

        setSuccess(`Successfully staked ${amount.toLocaleString()} V1N3 for ${selectedLockPeriod.label}!`)
        if (data.signature) setSuccessTx(data.signature)
        setStakeAmount('')
        await Promise.all([fetchDbStakingData(), refreshBalance()])
      } else {
        // EXTERNAL: Use wallet adapter
        if (!publicKey || !signTransaction || !connection) {
          throw new Error('Please connect your wallet first')
        }

        const amountBN = new BN(Math.floor(amount * 1e9))
        const lockPeriodBN = new BN(selectedLockPeriod.seconds)

        const instruction = createStakeInstruction(publicKey, amountBN, lockPeriodBN)
        const transaction = new Transaction().add(instruction)
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signedTx = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature, 'confirmed')
        
        setSuccess(`Successfully staked ${amount.toLocaleString()} V1N3 for ${selectedLockPeriod.label}!`)
        setSuccessTx(signature)
        setStakeAmount('')
        await Promise.all([fetchOnChainStakeInfo(), refreshBalance()])
      }
    } catch (err) {
      console.error('Stake error:', err)
      setError(err instanceof Error ? err.message : 'Failed to stake. Please try again.')
    } finally {
      setIsStaking(false)
    }
  }

  // Handle unstake
  const handleUnstake = async () => {
    setIsUnstaking(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
      if (isCustodial) {
        // CUSTODIAL: Call server API
        const response = await fetch('/api/staking/unstake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to unstake')
        }

        setSuccess(`Successfully unstaked ${data.amount?.toLocaleString() ?? ''} V1N3!`)
        if (data.signature) setSuccessTx(data.signature)
        await Promise.all([fetchDbStakingData(), refreshBalance()])
      } else {
        // EXTERNAL: Use wallet adapter
        if (!publicKey || !signTransaction || !connection) {
          throw new Error('Please connect your wallet first')
        }

        // Check lock period
        if (stakeInfo) {
          const now = Math.floor(Date.now() / 1000)
          const unlockTime = stakeInfo.stakeTimestamp.toNumber() + stakeInfo.lockPeriod.toNumber()
          if (now < unlockTime) {
            const remaining = formatTimeRemaining(unlockTime - now)
            throw new Error(`Tokens are locked for ${remaining}`)
          }
        }

        const instruction = createUnstakeInstruction(publicKey)
        const transaction = new Transaction().add(instruction)
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signedTx = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature, 'confirmed')
        
        setSuccess('Successfully unstaked your V1N3!')
        setSuccessTx(signature)
        await Promise.all([fetchOnChainStakeInfo(), refreshBalance()])
      }
    } catch (err) {
      console.error('Unstake error:', err)
      setError(err instanceof Error ? err.message : 'Failed to unstake. Please try again.')
    } finally {
      setIsUnstaking(false)
    }
  }

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (pendingRewards <= 0) {
      setError('No rewards to claim')
      return
    }

    setIsClaiming(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
      if (isCustodial) {
        // CUSTODIAL: Call server API
        const response = await fetch('/api/staking/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to claim rewards')
        }

        setSuccess(`Successfully claimed ${data.amount?.toFixed(4) ?? pendingRewards.toFixed(4)} V1N3 rewards!`)
        if (data.signature) setSuccessTx(data.signature)
        await Promise.all([fetchDbStakingData(), refreshBalance()])
      } else {
        // EXTERNAL: Use wallet adapter
        if (!publicKey || !signTransaction || !connection) {
          throw new Error('Please connect your wallet first')
        }

        const instruction = createClaimRewardsInstruction(publicKey)
        const transaction = new Transaction().add(instruction)
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signedTx = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        await connection.confirmTransaction(signature, 'confirmed')
        
        setSuccess(`Successfully claimed ${pendingRewards.toFixed(4)} V1N3 rewards!`)
        setSuccessTx(signature)
        await Promise.all([fetchOnChainStakeInfo(), refreshBalance()])
      }
    } catch (err) {
      console.error('Claim error:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim rewards. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  // Check if user has active stake
  const hasActiveStake = isCustodial 
    ? (dbStakingData?.positions?.some(p => p.is_active) ?? false)
    : (stakeInfo?.isActive ?? false)

  // Check if tokens are locked
  const isLocked = (() => {
    if (isCustodial) {
      const activePosition = dbStakingData?.positions?.find(p => p.is_active)
      if (!activePosition?.locked_until) return false
      return new Date(activePosition.locked_until) > new Date()
    } else {
      if (!stakeInfo) return false
      const now = Math.floor(Date.now() / 1000)
      const unlockTime = stakeInfo.stakeTimestamp.toNumber() + stakeInfo.lockPeriod.toNumber()
      return now < unlockTime
    }
  })()

  // Get time remaining until unlock
  const getTimeRemaining = () => {
    if (isCustodial) {
      const activePosition = dbStakingData?.positions?.find(p => p.is_active)
      if (!activePosition?.locked_until) return null
      const unlockTime = new Date(activePosition.locked_until).getTime()
      const remaining = Math.max(0, Math.floor((unlockTime - Date.now()) / 1000))
      return remaining > 0 ? formatTimeRemaining(remaining) : null
    } else {
      if (!stakeInfo) return null
      const now = Math.floor(Date.now() / 1000)
      const unlockTime = stakeInfo.stakeTimestamp.toNumber() + stakeInfo.lockPeriod.toNumber()
      const remaining = unlockTime - now
      return remaining > 0 ? formatTimeRemaining(remaining) : null
    }
  }

  // Get current APY for active stake
  const getCurrentApy = () => {
    if (isCustodial) {
      const activePosition = dbStakingData?.positions?.find(p => p.is_active)
      return activePosition?.apy ?? selectedLockPeriod.apy
    } else {
      if (!stakeInfo) return selectedLockPeriod.apy
      const lockSeconds = stakeInfo.lockPeriod.toNumber()
      const period = LOCK_PERIODS.find(p => p.seconds === lockSeconds)
      return period?.apy ?? 35
    }
  }

  const timeRemaining = getTimeRemaining()
  const currentApy = getCurrentApy()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Image 
            src="/images/v1n3-token.jpg" 
            alt="V1N3 Token" 
            width={44} 
            height={44}
            className="rounded-full"
          />
          <div>
            <h1 className="font-mono text-2xl text-foreground">Stake V1N3</h1>
            <p className="mono-xs text-[10px] text-muted-foreground tracking-[0.2em]">
              EARN REWARDS ON YOUR V1N3 TOKENS
            </p>
          </div>
        </div>
      </div>

      {/* Admin: Initialize Vault (Mantim only) */}
      {isAdmin && !vaultInitialized && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-accent/5 border border-accent/30 rounded-[2px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[2px] bg-accent/15 shrink-0">
              <Crown className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="mono-xs text-[11px] text-foreground tracking-[0.12em]">ADMIN CONTROL</p>
              <p className="mono-xs text-[10px] text-muted-foreground">
                Initialize the on-chain reward vault before staking goes live.
              </p>
            </div>
          </div>
          <button
            onClick={handleInitializeVault}
            disabled={isInitializingVault}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-[2px] mono-xs text-[11px] tracking-[0.12em] hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isInitializingVault ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                INITIALIZING...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                INITIALIZE VAULT
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Admin: Fund Reward Vault (Mantim only) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-accent/5 border border-accent/30 rounded-[2px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[2px] bg-accent/15 shrink-0">
              <Gift className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="mono-xs text-[11px] text-foreground tracking-[0.12em]">FUND REWARDS</p>
              <p className="mono-xs text-[10px] text-muted-foreground">
                Deposit V1N3 into the reward vault so payouts stay solvent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              inputMode="decimal"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="0.00"
              className="w-28 px-3 py-2.5 bg-background border border-border rounded-[2px] mono-xs text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
            />
            <button
              onClick={handleFundRewards}
              disabled={isFunding}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-[2px] mono-xs text-[11px] tracking-[0.12em] hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFunding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  FUNDING...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  FUND
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Error/Success Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-[2px] flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="mono-xs text-[11px] text-red-400">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-primary/10 border border-primary/30 rounded-[2px]"
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <p className="mono-xs text-[11px] text-primary">{success}</p>
            </div>
            {successTx && (
              <a
                href={getExplorerUrl(successTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-primary/70 hover:text-primary transition-colors"
              >
                <span className="mono-xs text-[10px]">View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Staking Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* APY Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">APY</span>
              </div>
              <p className="font-mono text-2xl text-accent">{currentApy}%</p>
            </motion.div>

            {/* Total Staked Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">STAKED</span>
              </div>
              <p className="font-mono text-2xl text-foreground">{formatV1N3Balance(stakedAmount)}</p>
              <div className="flex items-center gap-1.5">
                <Image src="/images/v1n3-token.jpg" alt="V1N3" width={14} height={14} className="rounded-full" />
                <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
              </div>
            </motion.div>

            {/* Available Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">AVAILABLE</span>
              </div>
              <p className="font-mono text-2xl text-foreground">
                {balanceLoading ? '...' : formatV1N3Balance(availableBalance)}
              </p>
              <div className="flex items-center gap-1.5">
                <Image src="/images/v1n3-token.jpg" alt="V1N3" width={14} height={14} className="rounded-full" />
                <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
              </div>
            </motion.div>

            {/* Pending Rewards Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-accent" />
                <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">REWARDS</span>
              </div>
              <p className="font-mono text-2xl text-accent">{pendingRewards.toFixed(4)}</p>
              <div className="flex items-center gap-1.5">
                <Image src="/images/v1n3-token.jpg" alt="V1N3" width={14} height={14} className="rounded-full" />
                <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
              </div>
            </motion.div>
          </div>

          {/* Lock Period Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-[2px] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">/ SELECT LOCK PERIOD</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LOCK_PERIODS.map((period) => (
                <button
                  key={period.days}
                  onClick={() => setSelectedLockPeriod(period)}
                  disabled={hasActiveStake}
                  className={`relative p-4 rounded-[2px] border-2 transition-all text-left ${
                    selectedLockPeriod.days === period.days
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/50 hover:border-primary/50'
                  } ${hasActiveStake ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {period.recommended && (
                    <div className="absolute -top-2 right-2 px-2 py-0.5 bg-accent text-background rounded-[2px]">
                      <span className="mono-xs text-[8px] font-bold tracking-wider">BEST</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {period.recommended ? (
                      <Crown className="w-4 h-4 text-accent" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="mono-xs text-[11px] text-foreground">{period.label}</span>
                  </div>
                  <p className={`font-mono text-2xl ${period.recommended ? 'text-accent' : 'text-primary'}`}>
                    {period.apy}%
                  </p>
                  <p className="mono-xs text-[10px] text-muted-foreground">APY</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stake/Unstake Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-[2px] p-5"
          >
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setActiveTab('stake')}
                className={`flex-1 py-3 px-4 rounded-[2px] flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'stake'
                    ? 'bg-primary text-background'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span className="mono-xs text-[11px] tracking-wider">STAKE</span>
              </button>
              <button
                onClick={() => setActiveTab('unstake')}
                className={`flex-1 py-3 px-4 rounded-[2px] flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'unstake'
                    ? 'bg-primary text-background'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span className="mono-xs text-[11px] tracking-wider">UNSTAKE</span>
              </button>
            </div>

            {activeTab === 'stake' ? (
              <div className="space-y-4">
                <div>
                  <label className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em] mb-2 block">
                    AMOUNT TO STAKE
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={hasActiveStake}
                      className="w-full bg-muted/20 border border-border rounded-[2px] px-4 py-3 font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
                      <button
                        onClick={() => setStakeAmount(availableBalance.toString())}
                        disabled={hasActiveStake}
                        className="px-2 py-1 bg-primary/20 text-primary rounded-[2px] mono-xs text-[10px] hover:bg-primary/30 transition-colors disabled:opacity-50"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  <p className="mono-xs text-[10px] text-muted-foreground mt-2">
                    Available: {formatV1N3Balance(availableBalance)} V1N3
                  </p>
                </div>

                <button
                  onClick={handleStake}
                  disabled={isStaking || !canTransact || hasActiveStake || !stakeAmount}
                  className="w-full py-4 bg-primary text-background rounded-[2px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStaking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span className="mono-xs text-[11px] tracking-wider">
                    {isStaking ? 'STAKING...' : hasActiveStake ? 'ALREADY STAKING' : 'STAKE V1N3'}
                  </span>
                </button>

                <p className="mono-xs text-[10px] text-center text-muted-foreground">
                  Minimum stake: 100 V1N3
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {hasActiveStake ? (
                  <>
                    <div className="p-4 bg-muted/20 border border-border rounded-[2px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="mono-xs text-[10px] text-muted-foreground">Staked Amount</span>
                        <div className="flex items-center gap-1.5">
                          <Image src="/images/v1n3-token.jpg" alt="V1N3" width={14} height={14} className="rounded-full" />
                          <span className="font-mono text-foreground">{formatV1N3Balance(stakedAmount)} V1N3</span>
                        </div>
                      </div>
                      {isLocked && timeRemaining && (
                        <div className="flex items-center gap-2 text-amber-500">
                          <Lock className="w-4 h-4" />
                          <span className="mono-xs text-[10px]">Locked for {timeRemaining}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleUnstake}
                      disabled={isUnstaking || isLocked || !canTransact}
                      className="w-full py-4 bg-primary text-background rounded-[2px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUnstaking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                      <span className="mono-xs text-[11px] tracking-wider">
                        {isUnstaking ? 'UNSTAKING...' : isLocked ? 'LOCKED' : 'UNSTAKE V1N3'}
                      </span>
                    </button>

                    {isLocked && (
                      <p className="mono-xs text-[10px] text-center text-amber-500">
                        Your tokens are locked. Wait for the lock period to end.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="mono-xs text-[11px] text-muted-foreground">No active stake</p>
                    <p className="mono-xs text-[10px] text-muted-foreground/60">Stake V1N3 first to unstake</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Claim Rewards Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-[2px] p-5"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5 text-accent" />
                  <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">PENDING REWARDS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/images/v1n3-token.jpg" alt="V1N3" width={20} height={20} className="rounded-full" />
                  <span className="font-mono text-2xl text-accent">{pendingRewards.toFixed(4)}</span>
                  <span className="mono-xs text-muted-foreground">V1N3</span>
                </div>
                <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                  Rewards are calculated based on your staked amount and current APY. Claim anytime!
                </p>
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={isClaiming || pendingRewards <= 0 || !canTransact}
                className="px-6 py-3 bg-accent text-background rounded-[2px] flex items-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isClaiming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="mono-xs text-[11px] tracking-wider">CLAIM REWARDS</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Connected Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ CONNECTED WALLET</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-foreground">
                {effectiveWalletAddress
                  ? `${effectiveWalletAddress.slice(0, 6)}...${effectiveWalletAddress.slice(-6)}`
                  : 'Not connected'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="p-1.5 hover:bg-muted/30 rounded-[2px] transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {effectiveWalletAddress && (
                  <a
                    href={`https://explorer.solana.com/address/${effectiveWalletAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-muted/30 rounded-[2px] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
            {isCustodial && (
              <p className="mono-xs text-[9px] text-primary mt-2">Email wallet (custodial)</p>
            )}
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ HOW IT WORKS</span>
            </div>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Choose Lock Period', desc: 'Longer locks earn higher APY' },
                { step: '2', title: 'Stake V1N3', desc: 'Lock your tokens to start earning' },
                { step: '3', title: 'Earn Rewards', desc: 'Rewards calculated daily' },
                { step: '4', title: 'Claim Anytime', desc: 'Claim rewards without unstaking' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="mono-xs text-[10px] text-primary">{item.step}</span>
                  </div>
                  <div>
                    <p className="mono-xs text-[11px] text-foreground">{item.title}</p>
                    <p className="mono-xs text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Position */}
          {hasActiveStake && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-card border border-primary/30 rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ ACTIVE POSITION</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">Amount</span>
                  <div className="flex items-center gap-1.5">
                    <Image src="/images/v1n3-token.jpg" alt="V1N3" width={12} height={12} className="rounded-full" />
                    <span className="mono-xs text-[11px] text-foreground">{formatV1N3Balance(stakedAmount)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">APY</span>
                  <span className="mono-xs text-[11px] text-accent">{currentApy}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">Status</span>
                  <span className={`mono-xs text-[11px] ${isLocked ? 'text-amber-500' : 'text-primary'}`}>
                    {isLocked ? 'Locked' : 'Unlocked'}
                  </span>
                </div>
                {timeRemaining && (
                  <div className="flex items-center justify-between">
                    <span className="mono-xs text-[10px] text-muted-foreground">Unlock in</span>
                    <span className="mono-xs text-[11px] text-foreground">{timeRemaining}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* V1N3 Token Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center py-4"
          >
            <div className="flex items-center gap-3 opacity-70">
              <Image 
                src="/images/v1n3-token.jpg" 
                alt="V1N3 Token" 
                width={32} 
                height={32}
                className="rounded-full"
              />
              <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.1em]">POWERED BY V1N3</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
