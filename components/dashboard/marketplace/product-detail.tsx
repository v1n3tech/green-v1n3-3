"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Verified,
  ShieldCheck,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Loader2,
  CheckCircle2,
  Package,
  Tag,
  Store,
  ExternalLink,
  AlertCircle,
  Wallet,
  X,
  ArrowRight,
} from "lucide-react"
import { addToCart } from "@/lib/marketplace/cart"
import { toggleFavorite } from "@/lib/marketplace/actions"
import { runCheckout } from "@/lib/marketplace/checkout-client"
import { ngnToV1n3 } from "@/lib/marketplace/types"
import type { MarketplaceProduct } from "@/lib/marketplace/types"
import { COMMUNITIES } from "@/components/onboarding/data"

const CATEGORY_FALLBACK: Record<string, string> = {
  crops: "/communities/crop-farming.jpg",
  livestock: "/communities/animal-farming.jpg",
  seeds: "/communities/agro-technology.jpg",
  fertilizer: "/communities/crop-farming.jpg",
  equipment: "/communities/agro-technology.jpg",
  services: "/communities/agro-technology.jpg",
  other: "/communities/crop-farming.jpg",
}

function productImage(p: MarketplaceProduct, override?: string | null) {
  return override || p.thumbnail || CATEGORY_FALLBACK[p.category] || "/communities/crop-farming.jpg"
}

function v1n3Label(ngn: number) {
  return ngnToV1n3(ngn).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export function ProductDetail({
  product,
  inCart,
  favorited: initialFavorited,
  isOwn,
  walletBalance,
  related,
}: {
  product: MarketplaceProduct
  inCart: boolean
  favorited: boolean
  isOwn: boolean
  walletBalance: number
  related: MarketplaceProduct[]
}) {
  const router = useRouter()
  const gallery = [product.thumbnail, ...(product.gallery ?? [])].filter(Boolean) as string[]
  const images = gallery.length > 0 ? gallery : [productImage(product)]

  const [activeImage, setActiveImage] = useState(images[0])
  const [favorited, setFavorited] = useState(initialFavorited)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(inCart)
  const [isPending, startTransition] = useTransition()
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [success, setSuccess] = useState<{ signature: string } | null>(null)

  const community = COMMUNITIES.find((c) => c.key === product.community)
  const maxQty = product.quantity_available ?? 99
  const inStock = product.quantity_available == null || product.quantity_available > 0
  const lineNgn = Number(product.price) * quantity

  function changeQty(delta: number) {
    setQuantity((q) => Math.max(1, Math.min(maxQty, q + delta)))
  }

  function handleFavorite() {
    setFavorited((f) => !f)
    startTransition(async () => {
      await toggleFavorite(product.id)
    })
  }

  function handleAddToCart() {
    setError(null)
    startTransition(async () => {
      const res = await addToCart(product.id, quantity)
      if (res.success) {
        setAdded(true)
      } else {
        setError(res.error ?? "Could not add to cart")
      }
    })
  }

  async function handleBuyNow() {
    setError(null)
    setBuying(true)
    const res = await runCheckout({ buyNow: { productId: product.id, quantity } })
    setBuying(false)
    if (res.success && res.orders?.[0]) {
      setConfirmOpen(false)
      setSuccess({ signature: res.orders[0].signature })
      router.refresh()
      // Take the buyer to their orders after the success state is shown.
      setTimeout(() => router.push("/dashboard/orders"), 2600)
    } else {
      setError(res.error ?? "Checkout failed")
    }
  }

  const lineV1n3 = ngnToV1n3(lineNgn)
  const insufficient = walletBalance < lineV1n3

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/marketplace"
          className="flex items-center gap-2 mono-xs text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO MARKETPLACE
        </Link>
        <Link
          href="/dashboard/marketplace/cart"
          className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-[2px] mono-xs text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          CART
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---------- Gallery ---------- */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-secondary border border-border rounded-[3px] overflow-hidden">
            <Image src={productImage(product, activeImage)} alt={product.title} fill className="object-cover" />
            {product.on_behalf_of_community && (
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-primary/90 rounded-[2px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-background" />
                <span className="mono-xs text-[8px] text-background tracking-wider">COMMUNITY</span>
              </div>
            )}
            {!inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <span className="mono-sm text-destructive">OUT OF STOCK</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-[2px] overflow-hidden border transition-colors ${
                    activeImage === img ? "border-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <Image src={img || "/placeholder.svg"} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Info panel ---------- */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-secondary border border-border rounded-[2px] mono-xs text-[9px] text-muted-foreground tracking-wider">
              {product.category.toUpperCase()}
            </span>
            {community && (
              <span className="mono-xs text-[9px] text-muted-foreground">{community.label}</span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-balance text-xl sm:text-2xl text-foreground leading-tight">{product.title}</h1>
            <button
              onClick={handleFavorite}
              className="w-9 h-9 flex-shrink-0 bg-secondary border border-border rounded-[2px] flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              aria-label="Toggle favorite"
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          {/* Seller + rating */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="mono-xs text-[10px] text-muted-foreground">
                {product.seller?.display_name ?? "GreenV1n3"}
              </span>
              {product.seller?.verification_status === "verified" && (
                <Verified className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
              <span className="mono-xs text-[10px] text-foreground">{Number(product.rating).toFixed(1)}</span>
              <span className="mono-xs text-[9px] text-muted-foreground">({product.reviews_count})</span>
            </div>
            {product.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="mono-xs text-[10px] text-muted-foreground">{product.location}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-5 p-4 bg-secondary/40 border border-border rounded-[2px]">
            <div className="flex items-end gap-2">
              <span className="font-mono text-3xl text-primary">N{Number(product.price).toLocaleString()}</span>
              <span className="mono-xs text-[10px] text-muted-foreground mb-1.5">/{product.price_unit ?? "each"}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Image src="/images/v1n3-token.jpg" alt="V1N3" width={14} height={14} className="rounded-full" />
              <span className="mono-xs text-[10px] text-foreground/70">
                ≈ {v1n3Label(Number(product.price))} V1N3 each
              </span>
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mt-3">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="mono-xs text-[10px] text-muted-foreground">
              {product.quantity_available == null
                ? "In stock"
                : product.quantity_available > 0
                  ? `${product.quantity_available} available`
                  : "Out of stock"}
            </span>
          </div>

          {/* Quantity + actions */}
          {!isOwn && inStock && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-4">
                <span className="mono-xs text-[9px] text-muted-foreground tracking-wider">QTY</span>
                <div className="flex items-center border border-border rounded-[2px] overflow-hidden">
                  <button
                    onClick={() => changeQty(-1)}
                    disabled={quantity <= 1}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono text-sm text-foreground">{quantity}</span>
                  <button
                    onClick={() => changeQty(1)}
                    disabled={quantity >= maxQty}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="mono-xs text-[10px] text-muted-foreground ml-auto">
                  Total <span className="text-primary font-mono">N{lineNgn.toLocaleString()}</span>
                </span>
              </div>

              <div className="flex gap-2">
                {added ? (
                  <Link
                    href="/dashboard/marketplace/cart"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-primary/40 text-primary rounded-[2px] mono-xs text-[10px] hover:bg-primary/10 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    VIEW IN CART
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-border text-foreground rounded-[2px] mono-xs text-[10px] hover:border-primary/40 transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    ADD TO CART
                  </button>
                )}
                <button
                  onClick={() => {
                    setError(null)
                    setConfirmOpen(true)
                  }}
                  disabled={buying}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-background rounded-[2px] mono-xs text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  BUY NOW
                </button>
              </div>
            </div>
          )}

          {isOwn && (
            <div className="mt-5 flex items-start gap-2 p-3 bg-secondary/50 border border-border rounded-[2px]">
              <Store className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="mono-xs text-[9px] text-muted-foreground leading-relaxed">
                This is your own listing. Manage it from the My Listings tab.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-[2px]">
              <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="mono-xs text-[9px] text-destructive">{error}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-[2px] mono-xs text-[9px] text-muted-foreground"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Description ---------- */}
      <div className="bg-background border border-border rounded-[2px] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 bg-primary" />
          <span className="mono-xs text-[10px] text-primary tracking-wider">DESCRIPTION</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap text-pretty">
          {product.description}
        </p>
      </div>

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary" />
            <span className="mono-xs text-[10px] text-primary tracking-wider">MORE IN {product.category.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/marketplace/${p.id}`}
                className="bg-background border border-border rounded-[2px] overflow-hidden group hover:border-primary/40 transition-all"
              >
                <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                  <Image
                    src={productImage(p)}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="mono-sm text-[11px] text-foreground truncate">{p.title}</h3>
                  <span className="font-mono text-sm text-primary">N{Number(p.price).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Buy Now confirmation ---------- */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => !buying && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-[3px] overflow-hidden"
            >
              {/* header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <span className="mono-xs text-[10px] text-primary tracking-wider">CONFIRM PURCHASE</span>
                <button
                  onClick={() => !buying && setConfirmOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* product line */}
              <div className="flex items-center gap-3 px-5 pt-4">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-[2px] overflow-hidden border border-border bg-secondary">
                  <Image src={productImage(product, activeImage)} alt={product.title} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-foreground truncate">{product.title}</p>
                  <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">
                    {quantity} × N{Number(product.price).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* breakdown */}
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center justify-between mono-xs text-[10px]">
                  <span className="text-muted-foreground">Item total</span>
                  <span className="text-foreground font-mono">N{lineNgn.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mono-xs text-[10px]">
                  <span className="text-muted-foreground">In V1N3</span>
                  <span className="text-foreground font-mono">
                    {lineV1n3.toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3
                  </span>
                </div>
                <div className="flex items-center justify-between mono-xs text-[10px]">
                  <span className="text-muted-foreground">Fulfillment</span>
                  <span className="text-foreground">Chosen after payment</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">You pay now</span>
                  <span className="font-mono text-lg text-primary">
                    {lineV1n3.toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-[2px] bg-secondary/50 border border-border px-2.5 py-2">
                  <span className="flex items-center gap-1.5 mono-xs text-[9px] text-muted-foreground">
                    <Wallet className="w-3 h-3" />
                    Wallet balance
                  </span>
                  <span className={`font-mono text-[11px] ${insufficient ? "text-destructive" : "text-foreground"}`}>
                    {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3
                  </span>
                </div>

                {insufficient && (
                  <div className="flex items-start gap-2 rounded-[2px] bg-destructive/10 border border-destructive/20 px-2.5 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="mono-xs text-[9px] text-destructive leading-relaxed">
                      Insufficient V1N3 balance. Top up your wallet to complete this purchase.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-[2px] bg-destructive/10 border border-destructive/20 px-2.5 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="mono-xs text-[9px] text-destructive leading-relaxed">{error}</p>
                  </div>
                )}

                <p className="mono-xs text-[8px] text-muted-foreground/70 leading-relaxed">
                  This is a real V1N3 transfer from your wallet to the seller on the Solana network. Delivery or pickup
                  is arranged from your Orders after payment.
                </p>
              </div>

              {/* actions */}
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={buying}
                  className="flex-1 px-4 py-2.5 border border-border text-muted-foreground rounded-[2px] mono-xs text-[10px] hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={buying || insufficient}
                  className="flex-[1.4] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-background rounded-[2px] mono-xs text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {buying ? "SETTLING…" : "CONFIRM & PAY"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Success overlay ---------- */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSuccess(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-[3px] p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg text-foreground">Order confirmed</h3>
              <p className="mono-xs text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Your V1N3 payment settled on-chain. The seller has been notified. Choose delivery or pickup from your
                orders.
              </p>
              <a
                href={`https://explorer.solana.com/tx/${success.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 mono-xs text-[10px] text-primary hover:underline"
              >
                VIEW TRANSACTION
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-background rounded-[2px] mono-xs text-[10px] hover:bg-primary/90 transition-colors"
              >
                GO TO ORDERS
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <p className="mono-xs text-[8px] text-muted-foreground/70 mt-2">Redirecting to your orders…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
