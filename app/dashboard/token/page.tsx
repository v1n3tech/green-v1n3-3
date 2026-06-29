import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Coins } from "lucide-react"
import { getTokenStatus } from "@/lib/admin/token-status"
import { TokenControl } from "@/components/dashboard/token/token-control"
import { PageHeading } from "@/components/dashboard/fulfillment/chrome"

export const metadata = {
  title: "Token Control — Dashboard — GreenV1n3",
  description: "Live V1N3 token status, supply, authorities, and treasury balances.",
}

// Always read fresh on-chain data.
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TokenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <p className="mono-xs text-[10px] text-muted-foreground">
            Access denied. Token control is restricted to administrators.
          </p>
        </div>
      </div>
    )
  }

  const status = await getTokenStatus()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeading
        icon={<Coins className="h-4 w-4" />}
        title="Token Control"
        subtitle="Live V1N3 status, fixed supply, authority lock, and treasury balances."
      />
      <TokenControl status={status} />
    </div>
  )
}
