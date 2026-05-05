import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExecutiveAssignments } from "@/components/dashboard/executive-assignments"

export default async function AssignmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, agro_id, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  return (
    <ExecutiveAssignments
      userId={user.id}
      displayName={profile.display_name}
      agroId={profile.agro_id}
    />
  )
}
