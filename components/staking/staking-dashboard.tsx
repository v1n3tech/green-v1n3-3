'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coins,
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
} from 'lucide-react'
import Image from 'next/image'
import { useV1N3Balance } from '@/lib/wallet/use-v1n3-balance'
import { formatV1N3Balance } from '@/lib/wallet/v1n3-token'

interface StakingPosition {
  id: string
  amount: number
  staked_at: string
  locked_until: string | null
  is_active: boolean
  rewards_claimed: number
}

interface StakingDashboardProps {
  walletAddress: string | null
  v1n3Balance: number
  stakingPositions: StakingPosition[]
  config: Record<string, string>
}

export function StakingDashboard({
  walletAddress,
  v1n3Balance: dbBalance,
  stakingPositions: initialPositions,
  config,
}: StakingDashboardProps) {
  // State
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [positions, setPositions] = useState(initialPositions)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')

  // Get on-chain balance
  const { balance: onChainBalance, loading: balanceLoading, refetch: refreshBalance } = useV1N3Balance(walletAddress)
  const displayBalance = balanceLoading ? dbBalance : onChainBalance

  // Config values
  const baseApy = parseFloat(config.base_apy || '35')
  const minStakeAmount = parseFloat(config.min_stake_amount || '100')
  const lockPeriodDays = parseInt(config.lock_period_days || '0')
  const isStakingEnabled = config.is_staking_enabled !== 'false'

  // Calculate totals
  const totalStaked = positions.reduce((sum, pos) => sum + Number(pos.amount), 0)
  const availableBalance = Math.max(0, displayBalance - totalStaked)

  // Calculate pending rewards
  useEffect(() => {
    const calculateRewards = () => {
      let total = 0
      const dailyRate = baseApy / 365 / 100
      
      positions.forEach(pos => {
        const daysStaked = (Date.now() - new Date(pos.staked_at).getTime()) / (1000 * 60 * 60 * 24)
        const earned = pos.amount * dailyRate * daysStaked
        total += earned - pos.rewards_claimed
      })
      
      setPendingRewards(Math.max(0, total))
    }

    calculateRewards()
    const interval = setInterval(calculateRewards, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [positions, baseApy])

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
    if (!stakeAmount || isStaking) return
    
    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amount < minStakeAmount) {
      setError(`Minimum stake amount is ${minStakeAmount} V1N3`)
      return
    }
    if (amount > availableBalance) {
      setError('Insufficient balance')
      return
    }

    setIsStaking(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to stake')
      }

      setSuccess(`Successfully staked ${amount} V1N3!`)
      setStakeAmount('')
      setPositions(prev => [result.position, ...prev])
      refreshBalance()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stake')
    } finally {
      setIsStaking(false)
    }
  }

  // Handle unstake
  const handleUnstake = async () => {
    if (!unstakeAmount || isUnstaking) return
    
    const amount = parseFloat(unstakeAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amount > totalStaked) {
      setError('Amount exceeds staked balance')
      return
    }

    setIsUnstaking(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/staking/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unstake')
      }

      setSuccess(`Successfully unstaked ${amount} V1N3!`)
      setUnstakeAmount('')
      // Refresh positions
      const posResponse = await fetch('/api/staking/positions')
      if (posResponse.ok) {
        const posData = await posResponse.json()
        setPositions(posData.positions)
      }
      refreshBalance()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unstake')
    } finally {
      setIsUnstaking(false)
    }
  }

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (pendingRewards <= 0 || isClaiming) return

    setIsClaiming(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/staking/claim', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim rewards')
      }

      setSuccess(`Successfully claimed ${result.amount.toFixed(4)} V1N3!`)
      setPendingRewards(0)
      // Refresh positions to update rewards_claimed
      const posResponse = await fetch('/api/staking/positions')
      if (posResponse.ok) {
        const posData = await posResponse.json()
        setPositions(posData.positions)
      }
      refreshBalance()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim rewards')
    } finally {
      setIsClaiming(false)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen">
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

      {/* Notifications */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-[2px] border flex items-center gap-3 ${
              error 
                ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                : 'bg-primary/10 border-primary/30 text-primary'
            }`}
          >
            {error ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            <span className="mono-xs text-[11px]">{error || success}</span>
            <button 
              onClick={() => { setError(null); setSuccess(null) }}
              className="ml-auto opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Staking Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="font-mono text-2xl text-accent">{baseApy}%</p>
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
              <p className="font-mono text-2xl text-foreground">{formatV1N3Balance(totalStaked)}</p>
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
                <Coins className="w-4 h-4 text-primary" />
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

          {/* Staking Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-[2px] p-6"
          >
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('stake')}
                className={`flex-1 py-2.5 px-4 rounded-[2px] mono-xs text-[11px] transition-all ${
                  activeTab === 'stake'
                    ? 'bg-primary text-background'
                    : 'bg-secondary/50 border border-border text-foreground hover:bg-secondary'
                }`}
              >
                <Lock className="w-4 h-4 inline-block mr-2" />
                STAKE
              </button>
              <button
                onClick={() => setActiveTab('unstake')}
                className={`flex-1 py-2.5 px-4 rounded-[2px] mono-xs text-[11px] transition-all ${
                  activeTab === 'unstake'
                    ? 'bg-primary text-background'
                    : 'bg-secondary/50 border border-border text-foreground hover:bg-secondary'
                }`}
              >
                <Unlock className="w-4 h-4 inline-block mr-2" />
                UNSTAKE
              </button>
            </div>

            {activeTab === 'stake' ? (
              <div className="space-y-4">
                <div>
                  <label className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em] block mb-2">
                    AMOUNT TO STAKE
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={!isStakingEnabled || isStaking}
                      className="w-full bg-secondary/50 border border-border rounded-[2px] px-4 py-3 pr-20 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
                      <button
                        type="button"
                        onClick={() => setStakeAmount(availableBalance.toString())}
                        className="mono-xs text-[9px] text-primary hover:text-primary/80"
                        disabled={!isStakingEnabled || isStaking}
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                    Available: {formatV1N3Balance(availableBalance)} V1N3
                  </p>
                </div>

                <button
                  onClick={handleStake}
                  disabled={!isStakingEnabled || isStaking || !stakeAmount || parseFloat(stakeAmount) < minStakeAmount}
                  className="w-full py-3 bg-primary text-background mono-xs text-[11px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      STAKING...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      STAKE V1N3
                    </>
                  )}
                </button>

                <p className="mono-xs text-[10px] text-muted-foreground text-center">
                  Minimum stake: {minStakeAmount} V1N3
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em] block mb-2">
                    AMOUNT TO UNSTAKE
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={isUnstaking || totalStaked === 0}
                      className="w-full bg-secondary/50 border border-border rounded-[2px] px-4 py-3 pr-20 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="mono-xs text-[10px] text-muted-foreground">V1N3</span>
                      <button
                        type="button"
                        onClick={() => setUnstakeAmount(totalStaked.toString())}
                        className="mono-xs text-[9px] text-primary hover:text-primary/80"
                        disabled={isUnstaking || totalStaked === 0}
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                    Staked: {formatV1N3Balance(totalStaked)} V1N3
                  </p>
                </div>

                <button
                  onClick={handleUnstake}
                  disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > totalStaked}
                  className="w-full py-3 bg-orange text-background mono-xs text-[11px] rounded-[2px] hover:bg-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUnstaking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      UNSTAKING...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      UNSTAKE V1N3
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Claim Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-[2px] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">PENDING REWARDS</p>
                  <p className="font-mono text-2xl text-accent">{pendingRewards.toFixed(4)} <span className="text-sm">V1N3</span></p>
                </div>
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={pendingRewards <= 0 || isClaiming}
                className="py-2.5 px-6 bg-accent text-background mono-xs text-[11px] rounded-[2px] hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <p className="mono-xs text-[10px] text-muted-foreground">
              Rewards are calculated based on your staked amount and current APY. Claim anytime!
            </p>
          </motion.div>
        </div>

        {/* Right Column - Info & Positions */}
        <div className="space-y-6">
          {/* Wallet Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ CONNECTED WALLET</span>
            </div>
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] text-foreground truncate flex-1">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </p>
                <button
                  onClick={copyAddress}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <p className="mono-xs text-[11px] text-muted-foreground">No wallet connected</p>
            )}
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ HOW IT WORKS</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="mono-xs text-[10px] text-primary">1</span>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-foreground">Stake V1N3</p>
                  <p className="mono-xs text-[10px] text-muted-foreground">Lock your tokens to start earning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="mono-xs text-[10px] text-primary">2</span>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-foreground">Earn {baseApy}% APY</p>
                  <p className="mono-xs text-[10px] text-muted-foreground">Rewards calculated daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="mono-xs text-[10px] text-primary">3</span>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-foreground">Claim Anytime</p>
                  <p className="mono-xs text-[10px] text-muted-foreground">No lock period required</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Active Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-[2px] p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <span className="mono-xs text-[9px] text-muted-foreground tracking-[0.18em]">/ ACTIVE POSITIONS</span>
            </div>
            {positions.length > 0 ? (
              <div className="space-y-3">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="p-3 bg-secondary/30 border border-border rounded-[2px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Image src="/images/v1n3-token.jpg" alt="V1N3" width={18} height={18} className="rounded-full" />
                        <span className="font-mono text-[12px] text-foreground">
                          {formatV1N3Balance(position.amount)} V1N3
                        </span>
                      </div>
                      <span className="mono-xs text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-[2px]">
                        ACTIVE
                      </span>
                    </div>
                    <p className="mono-xs text-[10px] text-muted-foreground">
                      Staked on {formatDate(position.staked_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Image 
                  src="/images/v1n3-token.jpg" 
                  alt="V1N3 Token" 
                  width={48} 
                  height={48} 
                  className="rounded-full mx-auto mb-3 opacity-30"
                />
                <p className="mono-xs text-[11px] text-muted-foreground">No active positions</p>
                <p className="mono-xs text-[10px] text-muted-foreground/60">Stake V1N3 to start earning</p>
              </div>
            )}
          </motion.div>

          {/* V1N3 Token Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
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
