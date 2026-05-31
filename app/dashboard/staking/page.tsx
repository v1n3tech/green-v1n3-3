import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { StakingDashboard } from "@/components/staking/staking-dashboard"

export const metadata = {
  title: "Stake V1N3 — Dashboard — GreenV1n3",
  description: "Stake your V1N3 tokens and earn up to 65% APY.",
}

export default async function StakingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // NOTE: profiles has NO `wallet_type` column. Selecting it returns a 400,
  // which made `.single()` fail -> null profile -> redirect loop to overview.
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address, v1n3_balance")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/onboarding")
  }

  // Custodial vs external is tracked in `user_wallets.origin`
  // (minted = custodial wallet created by the app, otherwise external).
  // user_wallets is RLS-locked (service-role only), so use the admin client.
  let isCustodial = false
  try {
    const admin = createAdminClient()
    const { data: walletData } = await admin
      .from("user_wallets")
      .select("origin")
      .eq("user_id", user.id)
      .maybeSingle()

    isCustodial = walletData?.origin === "minted"
  } catch (err) {
    console.error("[v0] StakingPage: failed to resolve wallet origin", err)
  }

  return (
    <StakingDashboard
      walletAddress={profile.wallet_address}
      v1n3Balance={profile.v1n3_balance ?? 0}
      isCustodial={isCustodial}
    />
  )
}
