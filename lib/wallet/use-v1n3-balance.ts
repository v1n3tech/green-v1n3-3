'use client'

import { useState, useEffect, useCallback } from 'react'
import { PublicKey, Connection } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { V1N3_MINT_PUBKEY, V1N3_TOKEN, SOLANA_RPC_ENDPOINT } from './v1n3-token'

// Create a dedicated devnet connection for V1N3
const devnetConnection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed')

interface UseV1N3BalanceResult {
  balance: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useV1N3Balance(walletAddress?: string | null): UseV1N3BalanceResult {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const walletPubkey = new PublicKey(walletAddress)
      
      // Get the associated token account for V1N3 (using Token-2022)
      const tokenAccountAddress = await getAssociatedTokenAddress(
        V1N3_MINT_PUBKEY,
        walletPubkey,
        false, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID // V1N3 uses Token-2022
      )

      console.log('[v0] Fetching V1N3 balance for:', walletAddress)
      console.log('[v0] Using mint address:', V1N3_MINT_PUBKEY.toBase58())
      console.log('[v0] Token account address (Token-2022):', tokenAccountAddress.toBase58())

      try {
        const tokenAccount = await getAccount(devnetConnection, tokenAccountAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)
        // Convert from lamports (raw amount) to token amount
        const tokenBalance = Number(tokenAccount.amount) / Math.pow(10, V1N3_TOKEN.decimals)
        console.log('[v0] V1N3 balance:', tokenBalance)
        setBalance(tokenBalance)
      } catch (err) {
        // Token account doesn't exist yet - balance is 0
        console.log('[v0] Token account not found, balance is 0:', err)
        setBalance(0)
      }
    } catch (err) {
      console.error('[v0] Error fetching V1N3 balance:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Subscribe to account changes for real-time updates
  useEffect(() => {
    if (!walletAddress) return

    let subscriptionId: number | undefined

    const subscribe = async () => {
      try {
        const walletPubkey = new PublicKey(walletAddress)
        const tokenAccountAddress = await getAssociatedTokenAddress(
          V1N3_MINT_PUBKEY,
          walletPubkey,
          false,
          TOKEN_2022_PROGRAM_ID
        )

        subscriptionId = devnetConnection.onAccountChange(
          tokenAccountAddress,
          (accountInfo) => {
            // Parse the token account data
            // The amount is at bytes 64-72 (u64)
            if (accountInfo.data.length >= 72) {
              const amount = accountInfo.data.readBigUInt64LE(64)
              const tokenBalance = Number(amount) / Math.pow(10, V1N3_TOKEN.decimals)
              console.log('[v0] V1N3 balance updated via subscription:', tokenBalance)
              setBalance(tokenBalance)
            }
          },
          'confirmed'
        )
      } catch (err) {
        console.error('[v0] Error subscribing to account changes:', err)
      }
    }

    subscribe()

    return () => {
      if (subscriptionId !== undefined) {
        devnetConnection.removeAccountChangeListener(subscriptionId)
      }
    }
  }, [walletAddress])

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  }
}

// Hook for SOL balance on devnet
export function useSOLBalance(walletAddress?: string | null) {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const walletPubkey = new PublicKey(walletAddress)
      const lamports = await devnetConnection.getBalance(walletPubkey)
      console.log('[v0] SOL balance:', lamports / 1e9)
      setBalance(lamports / 1e9)
    } catch (err) {
      console.error('[v0] Error fetching SOL balance:', err)
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return { balance, loading, refetch: fetchBalance }
}
