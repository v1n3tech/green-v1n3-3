import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StakingDashboard } from "@/components/staking/staking-dashboard"

export const metadata = {
  title: "Stake V1N3 — Dashboard — GreenV1n3",
  description: "Stake your V1N3 tokens and earn rewards.",
}

export default async function StakingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address, v1n3_balance")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  // Get user's staking positions
  const { data: stakingPositions } = await supabase
    .from("staking_positions")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("staked_at", { ascending: false })

  // Get staking config
  const { data: configData } = await supabase
    .from("staking_config")
    .select("key, value")

  const config: Record<string, string> = {}
  configData?.forEach((item: { key: string; value: unknown }) => {
    // JSONB values are stored as JSON strings, extract the actual value
    const val = item.value
    if (typeof val === 'string') {
      config[item.key] = val
    } else if (val !== null && val !== undefined) {
      config[item.key] = String(val)
    }
  })

  return (
    <StakingDashboard 
      walletAddress={profile.wallet_address}
      v1n3Balance={profile.v1n3_balance ?? 0}
      stakingPositions={stakingPositions ?? []}
      config={config}
    />
  )
}
