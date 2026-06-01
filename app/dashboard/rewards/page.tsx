import { redirect } from "next/navigation"
import { getPointsSummary, getFeesSummary, type FeesSummary } from "@/lib/rewards/data"
import { RewardsDashboard } from "@/components/dashboard/rewards-dashboard"

export const metadata = {
  title: "Rewards — Dashboard — GreenV1n3",
  description: "Earn loyalty points on every marketplace purchase and redeem them for V1N3.",
}

export default async function RewardsPage() {
  const summary = await getPointsSummary()

  if (!summary) {
    redirect("/")
  }

  // Treasury fee reporting is only loaded for the dev/admin wallet.
  let fees: FeesSummary | null = null
  if (summary.isAdmin) {
    fees = await getFeesSummary()
  }

  return <RewardsDashboard summary={summary} fees={fees} />
}
