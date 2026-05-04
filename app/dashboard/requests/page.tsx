import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardRequests } from "@/components/dashboard/dashboard-requests"
import { COMMUNITIES } from "@/components/onboarding/data"

export const metadata = {
  title: "Requests — GreenV1n3",
  description: "Manage service requests and offerings.",
}

export default async function RequestsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, community, display_name, agro_id")
    .eq("id", user.id)
    .single()
  
  if (!profile) redirect("/onboarding")
  
  const community = COMMUNITIES.find((c) => c.key === profile.community)
  
  return (
    <DashboardRequests
      userId={profile.id}
      role={profile.role}
      community={profile.community}
      communityLabel={community?.label ?? null}
      displayName={profile.display_name}
      agroId={profile.agro_id}
    />
  )
}
