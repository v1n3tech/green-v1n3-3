import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { COMMUNITIES } from "@/components/onboarding/data"
import { DashboardCommunities } from "@/components/dashboard/dashboard-communities"
import { getCommunityDirectory, getFollowedUpdates } from "@/lib/communities/follow-actions"

export const metadata = {
  title: "Communities — Dashboard — GreenV1n3",
  description: "Your community hub and engagement center.",
}

export default async function CommunitiesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("community, role, display_name, agro_id")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  const userCommunity = COMMUNITIES.find((c) => c.key === profile.community)

  const [{ entries: directory }, { updates }] = await Promise.all([
    getCommunityDirectory(),
    getFollowedUpdates(20),
  ])

  return (
    <DashboardCommunities 
      userCommunity={userCommunity ?? null}
      allCommunities={COMMUNITIES}
      role={profile.role}
      displayName={profile.display_name}
      agroId={profile.agro_id}
      directory={directory}
      updates={updates}
    />
  )
}
