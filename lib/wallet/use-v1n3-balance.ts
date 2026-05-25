'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import { V1N3_MINT_PUBKEY, V1N3_TOKEN } from './v1n3-token'

interface UseV1N3BalanceResult {
  balance: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useV1N3Balance(walletAddress?: string | null): UseV1N3BalanceResult {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Use provided wallet address or connected wallet
  const targetAddress = walletAddress || publicKey?.toBase58()

  const fetchBalance = useCallback(async () => {
    if (!targetAddress) {
      setBalance(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const walletPubkey = new PublicKey(targetAddress)
      
      // Get the associated token account for V1N3
      const tokenAccountAddress = await getAssociatedTokenAddress(
        V1N3_MINT_PUBKEY,
        walletPubkey
      )

      try {
        const tokenAccount = await getAccount(connection, tokenAccountAddress)
        // Convert from lamports (raw amount) to token amount
        const tokenBalance = Number(tokenAccount.amount) / Math.pow(10, V1N3_TOKEN.decimals)
        setBalance(tokenBalance)
      } catch {
        // Token account doesn't exist yet - balance is 0
        setBalance(0)
      }
    } catch (err) {
      console.error('Error fetching V1N3 balance:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }, [connection, targetAddress])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Subscribe to account changes for real-time updates
  useEffect(() => {
    if (!targetAddress) return

    let subscriptionId: number | undefined

    const subscribe = async () => {
      try {
        const walletPubkey = new PublicKey(targetAddress)
        const tokenAccountAddress = await getAssociatedTokenAddress(
          V1N3_MINT_PUBKEY,
          walletPubkey
        )

        subscriptionId = connection.onAccountChange(
          tokenAccountAddress,
          (accountInfo) => {
            // Parse the token account data
            // The amount is at bytes 64-72 (u64)
            if (accountInfo.data.length >= 72) {
              const amount = accountInfo.data.readBigUInt64LE(64)
              const tokenBalance = Number(amount) / Math.pow(10, V1N3_TOKEN.decimals)
              setBalance(tokenBalance)
            }
          },
          'confirmed'
        )
      } catch (err) {
        console.error('Error subscribing to account changes:', err)
      }
    }

    subscribe()

    return () => {
      if (subscriptionId !== undefined) {
        connection.removeAccountChangeListener(subscriptionId)
      }
    }
  }, [connection, targetAddress])

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  }
}

// Hook for SOL balance
export function useSOLBalance(walletAddress?: string | null) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const targetAddress = walletAddress || publicKey?.toBase58()

  const fetchBalance = useCallback(async () => {
    if (!targetAddress) {
      setBalance(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const walletPubkey = new PublicKey(targetAddress)
      const lamports = await connection.getBalance(walletPubkey)
      setBalance(lamports / 1e9)
    } catch (err) {
      console.error('Error fetching SOL balance:', err)
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }, [connection, targetAddress])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return { balance, loading, refetch: fetchBalance }
}
