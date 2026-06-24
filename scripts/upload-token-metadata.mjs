import { put } from "@vercel/blob"
import { readFile } from "node:fs/promises"

/**
 * One-off: hosts the V1N3 token logo + Metaplex-style fungible metadata JSON
 * on Vercel Blob so the on-chain Token-2022 metadata URI is stable.
 */

const logoBytes = await readFile("public/images/v1n3-token-logo.png")

const logo = await put("token/v1n3-token-logo.png", logoBytes, {
  access: "public",
  contentType: "image/png",
  addRandomSuffix: false,
  allowOverwrite: true,
})

console.log("[v0] logo url:", logo.url)

const metadata = {
  name: "V1n3",
  symbol: "V1N3",
  description:
    "V1N3 is the native token of GreenV1n3 — a Solana-based agricultural network powering rewards, staking, and on-chain participation across farming communities.",
  image: logo.url,
  external_url: "https://v1n3tech.io",
  attributes: [],
  properties: {
    files: [{ uri: logo.url, type: "image/png" }],
    category: "image",
  },
}

const meta = await put("token/v1n3-token-metadata.json", JSON.stringify(metadata, null, 2), {
  access: "public",
  contentType: "application/json",
  addRandomSuffix: false,
  allowOverwrite: true,
})

console.log("[v0] METADATA_URI:", meta.url)
