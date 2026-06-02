import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Truck, Clock, CheckCircle2, CalendarClock, PackageCheck } from "lucide-react"
import { fetchDeliveryRequests } from "@/lib/fulfillment/delivery"
import { DeliveryRequestsList } from "@/components/dashboard/logistics/delivery-requests-list"
import { PageHeading, StatsBar, type StatDef } from "@/components/dashboard/fulfillment/chrome"

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
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <p className="mono-xs text-[10px] text-muted-foreground">
            Access denied. Only logistics GCM can access this dashboard.
          </p>
        </div>
      </div>
    )
  }

  // Fetch delivery requests
  const { requests } = await fetchDeliveryRequests()
  // Active = still needs logistics attention (everything except finished/closed).
  const activeStatuses = ["pending", "accepted", "scheduled", "in_transit"]
  const activeRequests = requests.filter((r) => activeStatuses.includes(r.status))

  const countBy = (s: string) => requests.filter((r) => r.status === s).length
  const stats: StatDef[] = [
    { icon: <Clock className="h-3.5 w-3.5" />, label: "PENDING", value: countBy("pending"), tone: "orange" },
    { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "ACCEPTED", value: countBy("accepted"), tone: "primary" },
    { icon: <CalendarClock className="h-3.5 w-3.5" />, label: "SCHEDULED", value: countBy("scheduled"), tone: "accent" },
    { icon: <PackageCheck className="h-3.5 w-3.5" />, label: "DELIVERED", value: countBy("delivered"), tone: "muted" },
  ]

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        icon={<Truck className="h-4 w-4" />}
        title="Agro Logistics"
        subtitle="Accept courier requests and schedule deliveries across terminals."
      />

      <StatsBar stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-primary" />
            <h2 className="mono-sm text-xs text-muted-foreground">Delivery Requests</h2>
          </div>
          <p className="mono-xs text-[10px] text-muted-foreground">{activeRequests.length} active</p>
        </div>
        <DeliveryRequestsList requests={activeRequests} isGcm={true} />
      </div>

      {requests.some((r) => r.status === "delivered" || r.status === "cancelled" || r.status === "rejected") && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="mono-sm text-xs text-muted-foreground">History</h2>
          </div>
          <DeliveryRequestsList
            requests={requests.filter(
              (r) => r.status === "delivered" || r.status === "cancelled" || r.status === "rejected",
            )}
            isGcm={true}
          />
        </div>
      )}
    </div>
  )
}
