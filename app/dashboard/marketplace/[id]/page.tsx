import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { fetchProductById } from "@/lib/marketplace/cart"
import { fetchApprovedProducts } from "@/lib/marketplace/actions"
import { ProductDetail } from "@/components/dashboard/marketplace/product-detail"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { product } = await fetchProductById(id)
  if (!product) return { title: "Product — Marketplace — GreenV1n3" }
  return {
    title: `${product.title} — Marketplace — GreenV1n3`,
    description: product.description?.slice(0, 150),
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { product, inCart, favorited, isOwn } = await fetchProductById(id)
  if (!product) notFound()

  const { data: profile } = await supabase
    .from("profiles")
    .select("v1n3_balance")
    .eq("id", user.id)
    .single()
  const walletBalance = Number(profile?.v1n3_balance ?? 0)

  // A few more products from the same category to keep browsing.
  const { products: related } = await fetchApprovedProducts({
    category: product.category,
    limit: 6,
  })

  return (
    <ProductDetail
      product={product}
      inCart={inCart}
      favorited={favorited}
      isOwn={isOwn}
      walletBalance={walletBalance}
      related={related.filter((p) => p.id !== product.id).slice(0, 4)}
    />
  )
}
