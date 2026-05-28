import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StakingDashboard } from "@/components/staking/staking-dashboard"

export const metadata = {
  title: "Stake V1N3 — Dashboard — GreenV1n3",
  description: "Stake your V1N3 tokens and earn up to 65% APY.",
}

export default async function StakingPage() {
  console.log("[v0] StakingPage: Starting to load...")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  console.log("[v0] StakingPage: User:", user?.id ?? "NO USER")
  
  if (!user) {
    console.log("[v0] StakingPage: No user, redirecting to /")
    redirect("/")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("wallet_address, v1n3_balance, wallet_type")
    .eq("id", user.id)
    .single()

  console.log("[v0] StakingPage: Profile:", profile, "Error:", profileError)

  if (!profile) {
    console.log("[v0] StakingPage: No profile, redirecting to /onboarding")
    redirect("/onboarding")
  }

  // Check if user has a custodial wallet (created via email, not external wallet)
  const isCustodial = profile.wallet_type === 'custodial' || !profile.wallet_type
  
  console.log("[v0] StakingPage: Rendering with wallet:", profile.wallet_address, "isCustodial:", isCustodial)

  return (
    <StakingDashboard 
      walletAddress={profile.wallet_address}
      v1n3Balance={profile.v1n3_balance ?? 0}
      isCustodial={isCustodial}
    />
  )
}
