import "server-only"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * AES-256-GCM authenticated encryption for custodial wallet secrets.
 *
 * Format:
 *  - key:        process.env.WALLET_ENCRYPTION_KEY (64 hex chars = 32 bytes)
 *  - iv:         12 random bytes per encryption (base64)
 *  - ciphertext: base64
 *  - authTag:    16 bytes (base64) — prevents tampering
 *
 * The plaintext we feed in is the Solana secretKey already base58-encoded as
 * a string, so it round-trips cleanly to and from the DB.
 */

const ALGO = "aes-256-gcm"
const IV_LEN = 12

function getKey(): Buffer {
  const hex = process.env.WALLET_ENCRYPTION_KEY
  if (!hex) {
    throw new Error("[v0] WALLET_ENCRYPTION_KEY env var is not set")
  }
  if (hex.length !== 64) {
    throw new Error(
      "[v0] WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes)",
    )
  }
  return Buffer.from(hex, "hex")
}

export interface EncryptedPayload {
  ciphertext: string
  iv: string
  authTag: string
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  }
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getKey()
  const iv = Buffer.from(payload.iv, "base64")
  const authTag = Buffer.from(payload.authTag, "base64")
  const ciphertext = Buffer.from(payload.ciphertext, "base64")

  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return plaintext.toString("utf8")
}
