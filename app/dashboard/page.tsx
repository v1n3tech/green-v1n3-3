import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { COMMUNITIES } from "@/components/onboarding/data"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, display_name, agro_id, role, community, lga, wallet_address, weekly_rating, operational_rating, total_earnings, v1n3_balance",
    )
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  const community = COMMUNITIES.find((c) => c.key === profile.community)
  const isExecutive = profile.role === "agro_executive"

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.display_name ||
    "AGRO EXECUTIVE"

  return (
    <DashboardOverview 
      profile={{
        fullName,
        displayName: profile.display_name,
        agroId: profile.agro_id,
        role: isExecutive ? "EXECUTIVE" : "EXPLORER",
        community: community?.label ?? null,
        lga: profile.lga,
        walletAddress: profile.wallet_address,
        weeklyRating: profile.weekly_rating ?? 0,
        operationalRating: profile.operational_rating ?? 0,
        totalEarnings: profile.total_earnings ?? 0,
        v1n3Balance: profile.v1n3_balance ?? 0,
      }}
    />
  )
}
