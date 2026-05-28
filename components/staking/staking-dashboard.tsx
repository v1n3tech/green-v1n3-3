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
import { Transaction } from '@solana/web3.js'
import BN from 'bn.js'
import { useV1N3Balance } from '@/lib/wallet/use-v1n3-balance'
import { formatV1N3Balance } from '@/lib/wallet/v1n3-token'
import {
  LOCK_PERIODS,
  STAKING_PROGRAM_ID,
  getStakeInfoPDA,
  createStakeInstruction,
  createUnstakeInstruction,
  createClaimRewardsInstruction,
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
  // Wallet adapter
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  
  // State
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<LockPeriodOption>(LOCK_PERIODS[2]) // Default to 3 months (best APY)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [successTx, setSuccessTx] = useState<string | null>(null)
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [isLoadingStakeInfo, setIsLoadingStakeInfo] = useState(true)

  // Get on-chain balance
  const { balance: onChainBalance, loading: balanceLoading, refetch: refreshBalance } = useV1N3Balance(walletAddress)
  const displayBalance = balanceLoading ? dbBalance : onChainBalance

  // Calculate available balance (total - staked)
  const stakedAmount = stakeInfo?.stakedAmount?.toNumber() ?? 0
  const availableBalance = Math.max(0, displayBalance - (stakedAmount / 1e9))

  // Fetch stake info from chain
  const fetchStakeInfo = useCallback(async () => {
    if (!publicKey || !connection) {
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
      console.error('[v0] Error fetching stake info:', err)
      setStakeInfo(null)
    } finally {
      setIsLoadingStakeInfo(false)
    }
  }, [publicKey, connection])

  useEffect(() => {
    fetchStakeInfo()
  }, [fetchStakeInfo])

  // Calculate pending rewards
  useEffect(() => {
    if (!stakeInfo || !stakeInfo.isActive) {
      setPendingRewards(0)
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
    const interval = setInterval(updateRewards, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [stakeInfo])

  // Copy wallet address
  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle stake
  const handleStake = async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError('Please connect your wallet first')
      return
    }

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
      // Convert to lamports (9 decimals)
      const amountBN = new BN(Math.floor(amount * 1e9))
      const lockPeriodBN = new BN(selectedLockPeriod.seconds)

      const instruction = createStakeInstruction(publicKey, amountBN, lockPeriodBN)
      
      const transaction = new Transaction().add(instruction)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTx = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      setSuccess(`Successfully staked ${amount.toLocaleString()} V1N3 for ${selectedLockPeriod.label}!`)
      setSuccessTx(signature)
      setStakeAmount('')
      
      // Refresh data
      await Promise.all([fetchStakeInfo(), refreshBalance()])
    } catch (err) {
      console.error('[v0] Stake error:', err)
      setError(err instanceof Error ? err.message : 'Failed to stake. Please try again.')
    } finally {
      setIsStaking(false)
    }
  }

  // Handle unstake
  const handleUnstake = async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError('Please connect your wallet first')
      return
    }

    if (!stakeInfo || !stakeInfo.isActive) {
      setError('No active stake to unstake')
      return
    }

    // Check if lock period has passed
    const unlockTime = stakeInfo.stakeTimestamp.toNumber() + stakeInfo.lockPeriod.toNumber()
    const now = Math.floor(Date.now() / 1000)
    
    if (now < unlockTime) {
      setError(`Tokens are locked until ${new Date(unlockTime * 1000).toLocaleDateString()}`)
      return
    }

    setIsUnstaking(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
      const instruction = createUnstakeInstruction(publicKey)
      
      const transaction = new Transaction().add(instruction)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTx = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      
      await connection.confirmTransaction(signature, 'confirmed')
      
      const unstakedAmount = stakeInfo.stakedAmount.toNumber() / 1e9
      setSuccess(`Successfully unstaked ${unstakedAmount.toLocaleString()} V1N3!`)
      setSuccessTx(signature)
      
      await Promise.all([fetchStakeInfo(), refreshBalance()])
    } catch (err) {
      console.error('[v0] Unstake error:', err)
      setError(err instanceof Error ? err.message : 'Failed to unstake. Please try again.')
    } finally {
      setIsUnstaking(false)
    }
  }

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError('Please connect your wallet first')
      return
    }

    if (pendingRewards <= 0) {
      setError('No rewards to claim')
      return
    }

    setIsClaiming(true)
    setError(null)
    setSuccess(null)
    setSuccessTx(null)

    try {
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
      
      await Promise.all([fetchStakeInfo(), refreshBalance()])
    } catch (err) {
      console.error('[v0] Claim error:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim rewards. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  // Handle max button
  const handleMax = () => {
    setStakeAmount(availableBalance.toString())
  }

  // Get lock period info for current stake
  const getCurrentLockPeriodInfo = () => {
    if (!stakeInfo) return null
    const lockSeconds = stakeInfo.lockPeriod.toNumber()
    return LOCK_PERIODS.find(lp => lp.seconds === lockSeconds) || LOCK_PERIODS[0]
  }

  // Calculate unlock time
  const getUnlockTime = () => {
    if (!stakeInfo) return null
    return stakeInfo.stakeTimestamp.toNumber() + stakeInfo.lockPeriod.toNumber()
  }

  const isLocked = () => {
    const unlockTime = getUnlockTime()
    if (!unlockTime) return false
    return Math.floor(Date.now() / 1000) < unlockTime
  }

  return (
    <div className="max-w-6xl mx-auto">
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
              EARN UP TO 65% APY ON YOUR V1N3 TOKENS
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-[2px] flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
            <p className="mono-xs text-[11px] text-destructive">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-[2px]"
          >
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="mono-xs text-[11px] text-primary">{success}</p>
                {successTx && (
                  <a
                    href={getExplorerUrl(successTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono-xs text-[10px] text-primary/70 hover:text-primary flex items-center gap-1 mt-1"
                  >
                    View on Solana Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Current APY Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">APY</span>
              </div>
              <p className="font-mono text-2xl text-accent">
                {stakeInfo ? getCurrentLockPeriodInfo()?.apy : selectedLockPeriod.apy}%
              </p>
              <p className="mono-xs text-[10px] text-muted-foreground">
                {stakeInfo ? getCurrentLockPeriodInfo()?.label : selectedLockPeriod.label}
              </p>
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
              <p className="font-mono text-2xl text-foreground">
                {isLoadingStakeInfo ? '...' : formatV1N3Balance(stakedAmount / 1e9)}
              </p>
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
                <Zap className="w-4 h-4 text-primary" />
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
          {!stakeInfo?.isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-4 h-4 text-primary" />
                <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">
                  / SELECT LOCK PERIOD
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {LOCK_PERIODS.map((period) => (
                  <button
                    key={period.seconds}
                    onClick={() => setSelectedLockPeriod(period)}
                    className={`relative p-4 rounded-[2px] border transition-all ${
                      selectedLockPeriod.seconds === period.seconds
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-card/50'
                    }`}
                  >
                    {period.recommended && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 bg-accent rounded-[2px]">
                        <Crown className="w-3 h-3 text-background" />
                        <span className="mono-xs text-[8px] text-background font-bold">BEST</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className={`font-mono text-2xl ${
                        period.recommended ? 'text-accent' : 'text-foreground'
                      }`}>
                        {period.apy}%
                      </p>
                      <p className="mono-xs text-[9px] text-muted-foreground tracking-[0.1em] mt-1">
                        APY
                      </p>
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="mono-xs text-[11px] text-foreground">{period.label}</p>
                        <p className="mono-xs text-[9px] text-muted-foreground">{period.days} days lock</p>
                      </div>
                    </div>
                    {selectedLockPeriod.seconds === period.seconds && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stake/Unstake Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('stake')}
                className={`flex-1 py-3 px-4 rounded-[2px] font-mono text-[12px] transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'stake'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Lock className="w-4 h-4" />
                STAKE
              </button>
              <button
                onClick={() => setActiveTab('unstake')}
                className={`flex-1 py-3 px-4 rounded-[2px] font-mono text-[12px] transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'unstake'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Unlock className="w-4 h-4" />
                UNSTAKE
              </button>
            </div>

            {activeTab === 'stake' ? (
              <div className="space-y-4">
                <div>
                  <label className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em] mb-2 block">
                    AMOUNT TO STAKE
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-background border border-border rounded-[2px] px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
                      <button
                        onClick={handleMax}
                        className="mono-xs text-[10px] text-primary hover:text-primary/80 transition-colors"
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
                  disabled={isStaking || !connected || !stakeAmount}
                  className="w-full py-4 bg-primary text-primary-foreground font-mono text-[12px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      STAKING...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      STAKE V1N3 ({selectedLockPeriod.apy}% APY)
                    </>
                  )}
                </button>

                <p className="mono-xs text-[9px] text-muted-foreground text-center">
                  Minimum stake: 100 V1N3 | Lock period: {selectedLockPeriod.label}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stakeInfo?.isActive ? (
                  <>
                    <div className="bg-background border border-border rounded-[2px] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="mono-xs text-[10px] text-muted-foreground">YOUR STAKED AMOUNT</span>
                        <span className="mono-xs text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px]">
                          {isLocked() ? 'LOCKED' : 'UNLOCKED'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Image src="/images/v1n3-token.jpg" alt="V1N3" width={24} height={24} className="rounded-full" />
                        <span className="font-mono text-xl text-foreground">
                          {formatV1N3Balance(stakedAmount / 1e9)} V1N3
                        </span>
                      </div>
                      {isLocked() && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="mono-xs text-[10px]">
                              {formatTimeRemaining(getUnlockTime()!)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleUnstake}
                      disabled={isUnstaking || isLocked()}
                      className="w-full py-4 bg-muted text-foreground font-mono text-[12px] rounded-[2px] hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUnstaking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          UNSTAKING...
                        </>
                      ) : isLocked() ? (
                        <>
                          <Lock className="w-4 h-4" />
                          LOCKED - {formatTimeRemaining(getUnlockTime()!)}
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          UNSTAKE ALL V1N3
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Image 
                      src="/images/v1n3-token.jpg" 
                      alt="V1N3" 
                      width={48} 
                      height={48} 
                      className="rounded-full mx-auto mb-3 opacity-30"
                    />
                    <p className="mono-xs text-[11px] text-muted-foreground">No active stake</p>
                    <p className="mono-xs text-[10px] text-muted-foreground/60">Stake V1N3 to start earning rewards</p>
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
            className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-[2px] p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">PENDING REWARDS</p>
                  <p className="font-mono text-xl text-accent">{pendingRewards.toFixed(4)} <span className="text-sm">V1N3</span></p>
                </div>
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={isClaiming || pendingRewards <= 0}
                className="py-3 px-6 bg-accent text-accent-foreground font-mono text-[11px] rounded-[2px] hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    CLAIMING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    CLAIM REWARDS
                  </>
                )}
              </button>
            </div>
            <p className="mono-xs text-[9px] text-muted-foreground mt-3">
              Rewards are calculated based on your staked amount and current APY. Claim anytime!
            </p>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Connected Wallet Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">
                / CONNECTED WALLET
              </span>
            </div>
            {walletAddress ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-foreground">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAddress}
                    className="p-1.5 hover:bg-muted rounded-[2px] transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-muted rounded-[2px] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="mono-xs text-[11px] text-muted-foreground">Connect wallet to stake</p>
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
              <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">
                / HOW IT WORKS
              </span>
            </div>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Choose Lock Period', desc: 'Longer locks = higher rewards' },
                { step: '2', title: 'Stake V1N3', desc: 'Lock your tokens on-chain' },
                { step: '3', title: 'Earn Rewards', desc: 'Up to 65% APY' },
                { step: '4', title: 'Claim Anytime', desc: 'Rewards available instantly' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="mono-xs text-[10px] text-primary">{item.step}</span>
                  </div>
                  <div>
                    <p className="mono-xs text-[11px] text-foreground">{item.title}</p>
                    <p className="mono-xs text-[9px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Current Stake Info */}
          {stakeInfo?.isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-card border border-primary/30 rounded-[2px] p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-primary" />
                <span className="mono-xs text-[10px] text-muted-foreground tracking-[0.18em]">
                  / ACTIVE STAKE
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">Staked</span>
                  <span className="mono-xs text-[11px] text-foreground">
                    {formatV1N3Balance(stakedAmount / 1e9)} V1N3
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">Lock Period</span>
                  <span className="mono-xs text-[11px] text-foreground">
                    {getCurrentLockPeriodInfo()?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">APY</span>
                  <span className="mono-xs text-[11px] text-accent">
                    {getCurrentLockPeriodInfo()?.apy}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">Status</span>
                  <span className={`mono-xs text-[11px] ${isLocked() ? 'text-yellow-500' : 'text-primary'}`}>
                    {isLocked() ? 'Locked' : 'Unlocked'}
                  </span>
                </div>
                {isLocked() && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="mono-xs text-[10px] text-muted-foreground">
                        {formatTimeRemaining(getUnlockTime()!)}
                      </span>
                    </div>
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
