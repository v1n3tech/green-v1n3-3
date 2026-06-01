import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { fetchDeliveryRequests } from "@/lib/fulfillment/delivery"
import { DeliveryRequestsList } from "@/components/dashboard/logistics/delivery-requests-list"

export default async function AgroLogisticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  // Only logistics GCM and admins
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community")
    .eq("id", user.id)
    .single()

  const isLogisticsGcm = (profile?.role === "gcm" && profile?.community === "agro_logistics") || profile?.role === "admin"

  if (!isLogisticsGcm) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Access denied. Only logistics GCM can access this dashboard.</p>
      </div>
    )
  }

  // Fetch pending delivery requests
  const { requests } = await fetchDeliveryRequests()
  const pendingRequests = requests.filter((r) => r.status === "pending" || r.status === "accepted")

  return (
    <div className="p-6 space-y-8">
      <h1 className="mono-lg text-foreground uppercase">Agro Logistics</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="mono-sm text-xs text-muted-foreground uppercase">Delivery Requests</h2>
          <p className="mono-xs text-[10px] text-muted-foreground">
            {pendingRequests.length} pending
          </p>
        </div>
        <DeliveryRequestsList requests={pendingRequests} isGcm={true} />
      </div>
    </div>
  )
}
