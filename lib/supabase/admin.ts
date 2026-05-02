import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client.
 *
 * Bypasses RLS. NEVER import this from client code, route handlers that echo
 * data unverified, or anywhere a request body can influence the SQL.
 *
 * Used exclusively for:
 *  - reading/writing the `user_wallets` vault (RLS-locked, service-role only)
 *  - the `linkWalletToProfile` write that runs from a server action
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "[v0] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client",
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
