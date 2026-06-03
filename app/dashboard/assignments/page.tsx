import { redirect } from "next/navigation"
import { Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ExecutiveAssignments } from "@/components/dashboard/executive-assignments"
import { ExecutiveDeliveryAssignments } from "@/components/dashboard/logistics/executive-delivery-assignments"
import { fetchMyDeliveryAssignments } from "@/lib/fulfillment/delivery"

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

  // Delivery assignments delegated to this executive by the logistics GCM.
  const { requests: deliveryRequests } = await fetchMyDeliveryAssignments()

  return (
    <div className="space-y-10">
      <ExecutiveAssignments
        userId={user.id}
        displayName={profile.display_name}
        agroId={profile.agro_id}
      />

      {deliveryRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-primary" />
            <h2 className="mono text-lg text-foreground">Delivery Assignments</h2>
          </div>
          <p className="mono-xs text-[10px] text-muted-foreground">
            Deliveries delegated to you by logistics. Upload proof and report completion for GCM confirmation.
          </p>
          <ExecutiveDeliveryAssignments requests={deliveryRequests} bare />
        </section>
      )}
    </div>
  )
}
