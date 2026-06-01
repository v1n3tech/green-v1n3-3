import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { fetchCart } from "@/lib/marketplace/cart"
import { CartView } from "@/components/dashboard/marketplace/cart-view"

export const metadata = {
  title: "Cart — Marketplace — GreenV1n3",
  description: "Review your items and check out with V1N3.",
}

export default async function CartPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { items } = await fetchCart()

  return <CartView initialItems={items} />
}
