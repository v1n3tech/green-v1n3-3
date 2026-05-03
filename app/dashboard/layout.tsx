import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { COMMUNITIES } from "@/components/onboarding/data"

export const metadata = {
  title: "Dashboard — GreenV1n3",
  description: "Your AgroV1n3 command center.",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, agro_id, role, community, lga, wallet_address, weekly_rating, operational_rating, total_earnings, v1n3_balance",
    )
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  const community = COMMUNITIES.find((c) => c.key === profile.community)
  
  const userProfile = {
    id: profile.id,
    email: user.email ?? null,
    firstName: profile.first_name,
    lastName: profile.last_name,
    displayName: profile.display_name,
    agroId: profile.agro_id,
    role: profile.role,
    community: profile.community,
    communityLabel: community?.label ?? null,
    lga: profile.lga,
    walletAddress: profile.wallet_address,
    weeklyRating: profile.weekly_rating,
    operationalRating: profile.operational_rating,
    totalEarnings: profile.total_earnings,
    v1n3Balance: profile.v1n3_balance,
  }

  return <DashboardShell profile={userProfile}>{children}</DashboardShell>
}
