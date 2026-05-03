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

  // First-user detection: only the very first user to complete onboarding
  // becomes the founding Agro Executive. Everyone else registers as a regular
  // 'user' and an admin can promote them later. The RPC enforces this server-
  // side; we read it here purely to drive the UX (whether to render the
  // /COMMUNITY step). A race is harmless: if two users tie, the RPC's
  // advisory lock will force the loser to role='user' and clear community.
  const { count: onboardedOthers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_completed", true)
    .neq("id", user.id)

  const isFirstUser = (onboardedOthers ?? 0) === 0

  return (
    <OnboardingFlow
      email={user.email ?? null}
      callsign={profile?.display_name ?? null}
      walletAddress={profile?.wallet_address ?? null}
      isFirstUser={isFirstUser}
      defaults={{
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
        lga: profile?.lga ?? "",
        community: (profile?.community as string | null) ?? null,
        secondaryCommunities:
          (profile?.secondary_communities as string[] | null) ?? [],
        bio: profile?.bio ?? "",
      }}
    />
  )
}
