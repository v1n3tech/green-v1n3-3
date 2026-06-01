import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCustodialKeypair } from "@/lib/wallet/mint"
import { transferV1N3, getV1N3Balance, V1N3_TOKEN } from "@/lib/wallet/v1n3-token"
import { ngnToV1n3 } from "@/lib/marketplace/types"
import { createNotification } from "@/lib/notifications/actions"
import { getPlatformConfig } from "@/lib/rewards/config"
import { ADMIN_WALLET } from "@/lib/staking/staking-program"

// Round a V1N3 amount to the token's display precision to avoid dust.
function roundV1n3(amount: number): number {
  return Math.round(amount * 1e6) / 1e6
}

interface LineItem {
  product_id: string
  quantity: number
  title: string
  thumbnail: string | null
  community: string | null
  unit_price: number
  seller_id: string
  seller_wallet: string | null
  seller_name: string | null
  offers_delivery: boolean
  delivery_fee: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const buyNow: { productId?: string; quantity?: number } | undefined = body?.buyNow
    const memo: string | null = body?.memo ?? null

    // Buyer profile + wallet
    const { data: buyer, error: buyerErr } = await supabase
      .from("profiles")
      .select("id, wallet_address, display_name")
      .eq("id", user.id)
      .single()

    if (buyerErr || !buyer?.wallet_address) {
      return NextResponse.json({ error: "Your wallet is not set up yet" }, { status: 400 })
    }

    // ---- Resolve line items ----
    const productSelect = `
      id, title, thumbnail, community, price, seller_id, status, is_active, quantity_available,
      offers_delivery, delivery_fee, pickup_available,
      seller:profiles!seller_id ( id, display_name, wallet_address )
    `

    const lineItems: LineItem[] = []
    let cartProductIds: string[] = []

    if (buyNow?.productId) {
      const qty = Math.max(1, Math.floor(buyNow.quantity ?? 1))
      const { data: p } = await supabase
        .from("marketplace_products")
        .select(productSelect)
        .eq("id", buyNow.productId)
        .single()

      if (!p || p.status !== "approved" || !p.is_active) {
        return NextResponse.json({ error: "This product is not available" }, { status: 400 })
      }
      const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller
      lineItems.push({
        product_id: p.id,
        quantity: qty,
        title: p.title,
        thumbnail: p.thumbnail,
        community: p.community,
        unit_price: Number(p.price),
        seller_id: p.seller_id,
        seller_wallet: seller?.wallet_address ?? null,
        seller_name: seller?.display_name ?? null,
        offers_delivery: Boolean(p.offers_delivery),
        delivery_fee: Number(p.delivery_fee ?? 0),
      })
    } else {
      const { data: cart } = await supabase
        .from("cart_items")
        .select(
          `
          product_id, quantity,
          product:marketplace_products!product_id ( ${productSelect} )
        `,
        )
        .eq("user_id", user.id)

      for (const row of cart ?? []) {
        const p = Array.isArray(row.product) ? row.product[0] : row.product
        if (!p || p.status !== "approved" || !p.is_active) continue
        const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller
        lineItems.push({
          product_id: p.id,
          quantity: row.quantity,
          title: p.title,
          thumbnail: p.thumbnail,
          community: p.community,
          unit_price: Number(p.price),
          seller_id: p.seller_id,
          seller_wallet: seller?.wallet_address ?? null,
          seller_name: seller?.display_name ?? null,
          offers_delivery: Boolean(p.offers_delivery),
          delivery_fee: Number(p.delivery_fee ?? 0),
        })
        cartProductIds.push(p.id)
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 })
    }

    // ---- Validate line items ----
    for (const item of lineItems) {
      if (item.seller_id === user.id) {
        return NextResponse.json(
          { error: `You cannot buy your own listing ("${item.title}")` },
          { status: 400 },
        )
      }
      if (!item.seller_wallet) {
        return NextResponse.json(
          { error: `The seller of "${item.title}" cannot receive payments yet` },
          { status: 400 },
        )
      }
    }

    // ---- Totals ----
    const totalNgn = lineItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
    const totalV1n3 = ngnToV1n3(totalNgn)

    // ---- Balance check (on-chain) ----
    const balance = await getV1N3Balance(buyer.wallet_address)
    if (balance < totalV1n3) {
      return NextResponse.json(
        {
          error: "Insufficient V1N3 balance",
          balance,
          required: totalV1n3,
        },
        { status: 400 },
      )
    }

    // ---- Custodial signer ----
    const keypair = await getCustodialKeypair(user.id)
    if (!keypair) {
      return NextResponse.json({ error: "Could not access your wallet" }, { status: 400 })
    }

    const admin = createAdminClient()

    // ---- Platform fee config (admin-editable) ----
    const config = await getPlatformConfig(admin)
    const feePct = Math.max(0, config.feePercent) / 100

    // ---- Group by seller (one on-chain transfer per seller) ----
    const sellers = new Map<string, LineItem[]>()
    for (const item of lineItems) {
      const list = sellers.get(item.seller_id) ?? []
      list.push(item)
      sellers.set(item.seller_id, list)
    }

    const createdOrders: Array<{ id: string; signature: string; title: string }> = []
    const failures: Array<{ seller: string; error: string }> = []
    const purchasedProductIds: string[] = []

    for (const [sellerId, items] of sellers) {
      const sellerWallet = items[0].seller_wallet as string
      const sellerName = items[0].seller_name ?? "Seller"
      const sellerNgn = items.reduce((s, it) => s + it.unit_price * it.quantity, 0)
      const sellerV1n3 = ngnToV1n3(sellerNgn)

      // Platform fee taken from the seller's proceeds (buyer still pays full price).
      const feeV1n3 = roundV1n3(sellerV1n3 * feePct)
      const netV1n3 = roundV1n3(sellerV1n3 - feeV1n3)
      const feeNgn = sellerNgn * feePct

      // Pending send record for the buyer (records the NET sent to the seller).
      const { data: pendingTx } = await admin
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "send",
          status: "pending",
          token_symbol: "V1N3",
          token_mint: V1N3_TOKEN.mintAddress,
          amount: netV1n3,
          fee: 0.000005,
          from_address: buyer.wallet_address,
          to_address: sellerWallet,
          memo: memo ?? `Marketplace order — ${items.map((i) => i.title).join(", ")}`,
          metadata: {
            kind: "marketplace_checkout",
            seller_id: sellerId,
            platform_fee_v1n3: feeV1n3,
            fee_percent: config.feePercent,
          },
        })
        .select()
        .single()

      const result = await transferV1N3(keypair, sellerWallet, netV1n3)

      if (!result.success) {
        if (pendingTx) {
          await admin
            .from("wallet_transactions")
            .update({ status: "failed", metadata: { error: result.error } })
            .eq("id", pendingTx.id)
        }
        failures.push({ seller: sellerName, error: result.error ?? "Transfer failed" })
        continue
      }

      // Confirm the send.
      if (pendingTx) {
        await admin
          .from("wallet_transactions")
          .update({
            status: "confirmed",
            signature: result.signature,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", pendingTx.id)
      }

      // Route the platform fee to the treasury (dev wallet). Best-effort: a
      // failed fee transfer must NOT void a paid order — we just record fee 0.
      let feeSignature: string | null = null
      let collectedFeeV1n3 = 0
      if (feeV1n3 > 0 && sellerWallet !== ADMIN_WALLET) {
        const feeResult = await transferV1N3(keypair, ADMIN_WALLET, feeV1n3)
        if (feeResult.success) {
          feeSignature = feeResult.signature
          collectedFeeV1n3 = feeV1n3
        } else {
          console.error("[v0] checkout fee transfer failed:", feeResult.error)
        }
      }

      // Mirror receive record for the seller.
      await admin.from("wallet_transactions").insert({
        user_id: sellerId,
        type: "receive",
        status: "confirmed",
        token_symbol: "V1N3",
        token_mint: V1N3_TOKEN.mintAddress,
        amount: netV1n3,
        fee: 0,
        from_address: buyer.wallet_address,
        to_address: sellerWallet,
        signature: result.signature,
        confirmed_at: new Date().toISOString(),
        metadata: {
          kind: "marketplace_sale",
          buyer_id: user.id,
          platform_fee_v1n3: collectedFeeV1n3,
        },
      })

      // One order row per line item.
      for (const item of items) {
        const lineNgn = item.unit_price * item.quantity
        const lineV1n3 = ngnToV1n3(lineNgn)
        const lineFeeV1n3 = roundV1n3(lineV1n3 * feePct)
        const { data: order } = await admin
          .from("marketplace_orders")
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            product_id: item.product_id,
            product_title: item.title,
            product_thumbnail: item.thumbnail,
            community: item.community,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: lineNgn,
            currency: "NGN",
            v1n3_amount: lineV1n3,
            platform_fee_v1n3: lineFeeV1n3,
            platform_fee_ngn: lineNgn * feePct,
            seller_net_v1n3: roundV1n3(lineV1n3 - lineFeeV1n3),
            fee_signature: feeSignature,
            payment_signature: result.signature,
            buyer_wallet: buyer.wallet_address,
            seller_wallet: sellerWallet,
            status: "paid",
            fulfillment_method: null,
            fulfillment_status: "awaiting_choice",
            memo,
          })
          .select("id")
          .single()

        // Decrement inventory + bump orders_count atomically.
        await admin.rpc("record_product_purchase", {
          p_product_id: item.product_id,
          p_qty: item.quantity,
        })

        purchasedProductIds.push(item.product_id)
        if (order) {
          createdOrders.push({ id: order.id, signature: result.signature, title: item.title })
        }
      }

      // Notify the seller.
      try {
        await createNotification({
          userId: sellerId,
          type: "payment_received",
          title: "New marketplace order",
          body: `${buyer.display_name ?? "A buyer"} ordered ${items
            .map((i) => `${i.quantity}× ${i.title}`)
            .join(", ")} for N${sellerNgn.toLocaleString()}.`,
          referenceType: "payment",
          actionUrl: "/dashboard/marketplace?tab=listings",
          metadata: { kind: "marketplace_sale", signature: result.signature },
        })
      } catch (e) {
        console.error("[v0] checkout notify error:", e)
      }
    }

    // Remove purchased items from the cart (cart checkout only).
    if (!buyNow?.productId && purchasedProductIds.length > 0) {
      await admin
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .in("product_id", purchasedProductIds)
    }

    // Refresh the buyer's cached balance from chain.
    try {
      const newBalance = await getV1N3Balance(buyer.wallet_address)
      await admin.from("profiles").update({ v1n3_balance: newBalance }).eq("id", user.id)
    } catch {
      // ignore
    }

    if (createdOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: failures[0]?.error ?? "Checkout failed",
          failures,
        },
        { status: 500 },
      )
    }

    // Award loyalty points for the completed checkout (once per transaction).
    let earnedPoints = 0
    if (config.pointsPerTransaction > 0) {
      try {
        await admin.rpc("award_points", {
          p_user_id: user.id,
          p_delta: config.pointsPerTransaction,
          p_reason: "marketplace_purchase",
          p_reference_type: "marketplace_order",
          p_reference_id: createdOrders[0]?.id ?? null,
        })
        earnedPoints = config.pointsPerTransaction
      } catch (e) {
        console.error("[v0] checkout award points error:", e)
      }
    }

    // Notify the buyer of the completed purchase.
    try {
      await createNotification({
        userId: user.id,
        type: "payment_sent",
        title: "Order confirmed",
        body: `You paid ${totalV1n3.toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })} V1N3 for ${createdOrders.length} item${createdOrders.length > 1 ? "s" : ""}.`,
        referenceType: "payment",
        actionUrl: "/dashboard/marketplace",
        metadata: { kind: "marketplace_purchase" },
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      orders: createdOrders,
      totalNgn,
      totalV1n3,
      earnedPoints,
      partial: failures.length > 0,
      failures,
    })
  } catch (error) {
    console.error("[v0] checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 },
    )
  }
}
