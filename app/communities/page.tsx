import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { CommunitiesHub } from "@/components/communities/communities-hub"

export const metadata = {
  title: "Communities — GreenV1n3",
  description: "Explore the 14 agricultural communities powering Nigeria's next economy. Join feeds, discover services, and connect with Agro Executives.",
}

export default async function CommunitiesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, agro_id, role, community, secondary_communities, onboarding_completed")
      .eq("id", user.id)
      .single()
    profile = data
  }

  const isAuthenticated = !!user
  const isCommunityMember = profile?.role === "agro_executive" && profile?.community
  const userCommunity = profile?.community ?? null
  const secondaryCommunities = profile?.secondary_communities ?? []

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <CommunitiesHub
        isAuthenticated={isAuthenticated}
        isCommunityMember={isCommunityMember}
        userCommunity={userCommunity}
        secondaryCommunities={secondaryCommunities}
        displayName={profile?.display_name ?? null}
        agroId={profile?.agro_id ?? null}
      />
    </div>
  )
}
