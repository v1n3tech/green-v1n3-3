import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Building2 } from "lucide-react"
import { fetchProvisionedAccounts } from "@/lib/admin/provisioning"
import { fetchAllChangeRequests } from "@/lib/profile/change-requests"
import { OrganizationConsole } from "@/components/dashboard/organization/organization-console"
import { ChangeRequestQueue } from "@/components/dashboard/organization/change-request-queue"
import { PageHeading } from "@/components/dashboard/fulfillment/chrome"

export const metadata = {
  title: "Organization — Dashboard — GreenV1n3",
  description: "Create accounts, allocate communities and roles, and issue credential packages.",
}

export default async function OrganizationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <p className="mono-xs text-[10px] text-muted-foreground">
            Access denied. Organization management is restricted to administrators.
          </p>
        </div>
      </div>
    )
  }

  const { accounts } = await fetchProvisionedAccounts()
  const { requests } = await fetchAllChangeRequests()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeading
        icon={<Building2 className="h-4 w-4" />}
        title="Organization"
        subtitle="Create accounts, allocate roles and communities, and issue downloadable credential packages."
      />
      <OrganizationConsole initialAccounts={accounts} />
      <div className="border-t border-border pt-6">
        <ChangeRequestQueue initialRequests={requests} />
      </div>
    </div>
  )
}
