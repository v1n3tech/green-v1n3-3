/**
 * Callsign generator — produces a cool, themed display name for new users.
 *
 * Format: <ADJECTIVE>_<NOUN>_<NN>
 *   e.g. VERDANT_REAPER_07, OBSIDIAN_NOMAD_42, CIPHER_HARVEST_88
 *
 * Word lists blend cyber + nature/agro to match the GreenV1n3 aesthetic.
 * Total combinations: 32 * 32 * 99 = 101,376 — collision odds vanish in
 * practice, but `ensureDisplayName` retries on UNIQUE conflicts to be safe.
 */

const ADJECTIVES = [
  "VERDANT",
  "OBSIDIAN",
  "EMERALD",
  "SHADOW",
  "CIPHER",
  "COBALT",
  "CRIMSON",
  "JADE",
  "FERAL",
  "NOCTURNE",
  "PRIMAL",
  "SAVAGE",
  "ROGUE",
  "SILENT",
  "ANCIENT",
  "ETHERIC",
  "PHANTOM",
  "SOLAR",
  "ARCTIC",
  "GLACIAL",
  "KINETIC",
  "VECTOR",
  "QUANTUM",
  "RADIANT",
  "SPECTRAL",
  "ECLIPSE",
  "OBSCURE",
  "HOLLOW",
  "VIVID",
  "WILD",
  "SACRED",
  "STORM",
] as const

const NOUNS = [
  "REAPER",
  "NOMAD",
  "ORACLE",
  "HARVEST",
  "WARDEN",
  "RAVEN",
  "FALCON",
  "PHOENIX",
  "SAGE",
  "ARCHON",
  "KEEPER",
  "SCION",
  "RANGER",
  "HUNTER",
  "PILGRIM",
  "VOYAGER",
  "SENTINEL",
  "GUARDIAN",
  "SHEPHERD",
  "TILLER",
  "SOWER",
  "GRAFTER",
  "GROVE",
  "ROOT",
  "BLOOM",
  "THORN",
  "BRIAR",
  "FERN",
  "DRIFTER",
  "MARSHAL",
  "VANGUARD",
  "SCOUT",
] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generates a single random callsign. Pure function — no side effects.
 */
export function generateCallsign(): string {
  const adj = pick(ADJECTIVES)
  const noun = pick(NOUNS)
  const num = Math.floor(Math.random() * 99) + 1 // 01..99
  const suffix = String(num).padStart(2, "0")
  return `${adj}_${noun}_${suffix}`
}
