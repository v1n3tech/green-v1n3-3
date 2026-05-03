import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardWallet } from "@/components/dashboard/dashboard-wallet"

export const metadata = {
  title: "Wallet — Dashboard — GreenV1n3",
  description: "Manage your V1N3 tokens and earnings.",
}

export default async function WalletPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address, v1n3_balance, total_earnings")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  return (
    <DashboardWallet 
      walletAddress={profile.wallet_address}
      v1n3Balance={profile.v1n3_balance ?? 0}
      totalEarnings={profile.total_earnings ?? 0}
    />
  )
}
