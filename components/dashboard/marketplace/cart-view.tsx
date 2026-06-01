"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Store,
  Verified,
  AlertCircle,
  ShoppingBag,
} from "lucide-react"
import { updateCartQuantity, removeFromCart, clearCart } from "@/lib/marketplace/cart"
import { runCheckout } from "@/lib/marketplace/checkout-client"
import { ngnToV1n3 } from "@/lib/marketplace/types"
import type { CartItem } from "@/lib/marketplace/types"

const CATEGORY_FALLBACK: Record<string, string> = {
  crops: "/communities/crop-farming.jpg",
  livestock: "/communities/animal-farming.jpg",
  seeds: "/communities/agro-technology.jpg",
  fertilizer: "/communities/crop-farming.jpg",
  equipment: "/communities/agro-technology.jpg",
  services: "/communities/agro-technology.jpg",
  other: "/communities/crop-farming.jpg",
}

function itemImage(it: CartItem) {
  const p = it.product
  if (!p) return "/communities/crop-farming.jpg"
  return p.thumbnail || CATEGORY_FALLBACK[p.category] || "/communities/crop-farming.jpg"
}

export function CartView({ initialItems }: { initialItems: CartItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>(initialItems)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ count: number; totalV1n3: number; signature?: string } | null>(null)

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.product?.price ?? 0) * it.quantity, 0),
    [items],
  )
  const totalUnits = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items])

  // Group by seller so the UI mirrors the per-seller settlement.
  const groups = useMemo(() => {
    const map = new Map<string, { sellerName: string; verified: boolean; items: CartItem[] }>()
    for (const it of items) {
      const sellerId = it.product?.seller_id ?? "unknown"
      const g = map.get(sellerId) ?? {
        sellerName: it.product?.seller?.display_name ?? "GreenV1n3",
        verified: it.product?.seller?.verification_status === "verified",
        items: [],
      }
      g.items.push(it)
      map.set(sellerId, g)
    }
    return Array.from(map.values())
  }, [items])

  function setQty(productId: string, nextQty: number) {
    const item = items.find((i) => i.product_id === productId)
    if (!item) return
    const max = item.product?.quantity_available ?? 99
    const clamped = Math.max(1, Math.min(max, nextQty))
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity: clamped } : i)))
    setBusyId(productId)
    startTransition(async () => {
      await updateCartQuantity(productId, clamped)
      setBusyId(null)
    })
  }

  function handleRemove(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
    startTransition(async () => {
      await removeFromCart(productId)
    })
  }

  function handleClear() {
    setItems([])
    startTransition(async () => {
      await clearCart()
    })
  }

  async function handleCheckout() {
    setError(null)
    setChecking(true)
    const res = await runCheckout({})
    setChecking(false)
    if (res.success) {
      setSuccess({
        count: res.orders?.length ?? items.length,
        totalV1n3: res.totalV1n3 ?? ngnToV1n3(subtotal),
        signature: res.orders?.[0]?.signature,
      })
      setItems([])
      router.refresh()
    } else {
      if (typeof res.balance === "number" && typeof res.required === "number") {
        setError(
          `${res.error}. You have ${res.balance.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })} V1N3 but need ${res.required.toLocaleString(undefined, { maximumFractionDigits: 4 })}.`,
        )
      } else {
        setError(res.error ?? "Checkout failed")
      }
    }
  }

  const empty = items.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ CART</span>
        </div>
        <Link
          href="/dashboard/marketplace"
          className="flex items-center gap-2 mono-xs text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          CONTINUE SHOPPING
        </Link>
      </div>

      {empty && !success ? (
        <div className="text-center py-16 border border-dashed border-border rounded-[2px]">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="mono-sm text-foreground">Your cart is empty</p>
          <p className="mono-xs text-muted-foreground mt-1 mb-4">Browse the marketplace to add products</p>
          <Link
            href="/dashboard/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            GO TO MARKETPLACE
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------- Items ---------- */}
          <div className="lg:col-span-2 space-y-5">
            {groups.map((group, gi) => (
              <div key={gi} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="mono-xs text-[10px] text-foreground">{group.sellerName}</span>
                  {group.verified && <Verified className="w-3.5 h-3.5 text-primary" />}
                </div>
                <AnimatePresence initial={false}>
                  {group.items.map((it) => {
                    const price = Number(it.product?.price ?? 0)
                    const max = it.product?.quantity_available ?? 99
                    return (
                      <motion.div
                        key={it.product_id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="bg-background border border-border rounded-[2px] p-3 flex gap-3"
                      >
                        <Link
                          href={`/dashboard/marketplace/${it.product_id}`}
                          className="relative w-20 h-20 bg-secondary rounded-[2px] overflow-hidden flex-shrink-0"
                        >
                          <Image src={itemImage(it)} alt={it.product?.title ?? ""} fill className="object-cover" />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/dashboard/marketplace/${it.product_id}`}
                              className="mono-sm text-xs text-foreground hover:text-primary transition-colors truncate"
                            >
                              {it.product?.title}
                            </Link>
                            <button
                              onClick={() => handleRemove(it.product_id)}
                              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-mono text-sm text-primary mt-0.5">
                            N{price.toLocaleString()}
                            <span className="mono-xs text-[9px] text-muted-foreground">
                              /{it.product?.price_unit ?? "each"}
                            </span>
                          </span>
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="flex items-center border border-border rounded-[2px] overflow-hidden">
                              <button
                                onClick={() => setQty(it.product_id, it.quantity - 1)}
                                disabled={it.quantity <= 1 || busyId === it.product_id}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs text-foreground">
                                {busyId === it.product_id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                ) : (
                                  it.quantity
                                )}
                              </span>
                              <button
                                onClick={() => setQty(it.product_id, it.quantity + 1)}
                                disabled={it.quantity >= max || busyId === it.product_id}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="mono-sm text-xs text-foreground">
                              N{(price * it.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ))}

            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 mono-xs text-[9px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                CLEAR CART
              </button>
            )}
          </div>

          {/* ---------- Summary ---------- */}
          <div className="lg:col-span-1">
            <div className="bg-background border border-border rounded-[2px] p-5 sticky top-20 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary" />
                <span className="mono-xs text-[10px] text-primary tracking-wider">ORDER SUMMARY</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between mono-xs text-[10px]">
                  <span className="text-muted-foreground">Items</span>
                  <span className="text-foreground">{totalUnits}</span>
                </div>
                <div className="flex items-center justify-between mono-xs text-[10px]">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-mono">N{subtotal.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="mono-xs text-[10px] text-muted-foreground">Total</span>
                  <span className="font-mono text-lg text-primary">N{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <Image src="/images/v1n3-token.jpg" alt="V1N3" width={14} height={14} className="rounded-full" />
                  <span className="mono-xs text-[10px] text-foreground/70">
                    ≈ {ngnToV1n3(subtotal).toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-[2px]">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="mono-xs text-[9px] text-destructive leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={checking || items.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-background rounded-[2px] mono-xs text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {checking ? "SETTLING ON-CHAIN…" : "CHECKOUT WITH V1N3"}
              </button>

              <p className="mono-xs text-[8px] text-muted-foreground/70 leading-relaxed text-center">
                Payment is a real V1N3 transfer from your wallet to each seller on the Solana network.
              </p>
            </div>
          </div>
        </div>
      )}

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
                {success.count} item{success.count > 1 ? "s" : ""} paid for —{" "}
                {success.totalV1n3.toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3 settled on-chain.
              </p>
              {success.signature && (
                <a
                  href={`https://explorer.solana.com/tx/${success.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 mono-xs text-[10px] text-primary hover:underline"
                >
                  VIEW TRANSACTION
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <Link
                href="/dashboard/marketplace"
                className="block w-full mt-5 px-4 py-2.5 bg-primary text-background rounded-[2px] mono-xs text-[10px] hover:bg-primary/90 transition-colors"
              >
                CONTINUE SHOPPING
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
