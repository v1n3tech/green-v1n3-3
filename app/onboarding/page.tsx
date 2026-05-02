import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"

export const metadata = {
  title: "Onboarding — GreenV1n3",
  description: "Configure your AgroV1n3 identity.",
}

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated → bounce to home (ConnectModal lives there).
  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, phone, lga, role, community, secondary_communities, bio, display_name, agro_id, wallet_address, onboarding_completed",
    )
    .eq("id", user.id)
    .single()

  // Belt-and-braces: middleware already handles this, but if a fully-onboarded
  // user lands here for any reason, push them onward.
  if (profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  return (
    <OnboardingFlow
      email={user.email ?? null}
      callsign={profile?.display_name ?? null}
      walletAddress={profile?.wallet_address ?? null}
      defaults={{
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
        lga: profile?.lga ?? "",
        role: (profile?.role as "user" | "agro_executive" | null) ?? null,
        community: (profile?.community as string | null) ?? null,
        secondaryCommunities:
          (profile?.secondary_communities as string[] | null) ?? [],
        bio: profile?.bio ?? "",
      }}
    />
  )
}
