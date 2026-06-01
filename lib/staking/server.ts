import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { getConnection } from '@/lib/wallet/v1n3-token'
import {
  getStakeAccountPDA,
  parseStakeInfo,
  type StakeInfo,
} from '@/lib/staking/staking-program'

/**
 * Build, sign (with a custodial keypair), send and confirm a staking
 * transaction. Used by the custodial (email-wallet) API routes. The secret key
 * is decrypted server-side only and never leaves the server.
 */
export async function signAndSendStakingTx(
  signer: Keypair,
  instructions: TransactionInstruction[]
): Promise<string> {
  const connection = getConnection()
  const transaction = new Transaction().add(...instructions)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = signer.publicKey
  transaction.sign(signer)

  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
  return signature
}

/** Fetch and parse the on-chain stake account for a wallet (null if none). */
export async function readStakeAccount(
  ownerAddress: string,
  connection: Connection = getConnection()
): Promise<StakeInfo | null> {
  const owner = new PublicKey(ownerAddress)
  const [stakePDA] = getStakeAccountPDA(owner)
  const info = await connection.getAccountInfo(stakePDA)
  if (!info) return null
  return parseStakeInfo(info.data as Buffer)
}
