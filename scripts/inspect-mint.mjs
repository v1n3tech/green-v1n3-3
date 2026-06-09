import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getMint, getTokenMetadata, TOKEN_2022_PROGRAM_ID, getMetadataPointerState, getExtensionTypes } from '@solana/spl-token'

const mint = new PublicKey('EAtP7GvoVreBt9jFH7NEQkW5bkzDWQ1uuhQ7nnSMx7g1')
const conn = new Connection(clusterApiUrl('devnet'), 'confirmed')

const info = await conn.getAccountInfo(mint)
console.log('[v0] owner program:', info?.owner.toBase58())
console.log('[v0] TOKEN_2022_PROGRAM_ID:', TOKEN_2022_PROGRAM_ID.toBase58())

try {
  const m = await getMint(conn, mint, 'confirmed', TOKEN_2022_PROGRAM_ID)
  console.log('[v0] decimals:', m.decimals)
  console.log('[v0] mintAuthority:', m.mintAuthority?.toBase58() ?? 'none')
  console.log('[v0] tlvData extensions:', getExtensionTypes(m.tlvData))
  const ptr = getMetadataPointerState(m)
  console.log('[v0] metadataPointer:', JSON.stringify(ptr))
} catch (e) {
  console.log('[v0] getMint error:', e.message)
}

try {
  const md = await getTokenMetadata(conn, mint, 'confirmed', TOKEN_2022_PROGRAM_ID)
  console.log('[v0] tokenMetadata:', JSON.stringify(md, null, 2))
} catch (e) {
  console.log('[v0] getTokenMetadata error:', e.message)
}
