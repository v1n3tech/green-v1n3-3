// Runs a SQL migration file against the project's Postgres database.
// Usage: node --env-file-if-exists=/vercel/share/.env.project scripts/run-migration.mjs scripts/migrations/032_community_follows.sql
import { readFileSync } from 'node:fs'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('[v0] Usage: node scripts/run-migration.mjs <path-to-sql>')
  process.exit(1)
}

let connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('[v0] No POSTGRES_URL_NON_POOLING / POSTGRES_URL in env')
  process.exit(1)
}
// Strip sslmode from URL so our ssl config object takes effect (Supabase uses a cert chain
// that fails strict verify-full from this sandbox).
connectionString = connectionString.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '')

const sql = readFileSync(file, 'utf8')
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query('BEGIN')
  await client.query(sql)
  await client.query('COMMIT')
  console.log('[v0] Migration applied successfully:', file)
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('[v0] Migration failed:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
