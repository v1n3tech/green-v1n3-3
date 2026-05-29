import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address, v1n3_balance, wallet_type")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/onboarding")
  }

  // Check if user has a custodial wallet (created via email) or external wallet (wallet adapter)
  const isCustodial = profile.wallet_type === 'custodial' || !profile.wallet_type

  return (
    <StakingDashboard 
      walletAddress={profile.wallet_address}
      v1n3Balance={profile.v1n3_balance ?? 0}
      isCustodial={isCustodial}
    />
  )
}
