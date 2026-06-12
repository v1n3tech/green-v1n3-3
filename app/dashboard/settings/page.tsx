import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"
import { PageHeading } from "@/components/dashboard/fulfillment/chrome"
import { ProfileChangeRequest } from "@/components/dashboard/settings/profile-change-request"
import { fetchMyChangeRequests } from "@/lib/profile/change-requests"

export const metadata = {
  title: "Settings — Dashboard — GreenV1n3",
  description: "Manage your profile and request changes to your account details.",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, display_name, phone, bio, lga, state, address")
    .eq("id", user.id)
    .single()

  const { requests } = await fetchMyChangeRequests()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeading
        icon={<Settings className="h-4 w-4" />}
        title="Settings"
        subtitle="Apply to the admin organization to update your login email and profile details."
      />
      <ProfileChangeRequest profile={profile ?? {}} initialRequests={requests} />
    </div>
  )
}
