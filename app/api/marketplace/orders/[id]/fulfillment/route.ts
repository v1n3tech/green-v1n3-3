import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCustodialKeypair } from "@/lib/wallet/mint"
import { transferV1N3, getV1N3Balance, V1N3_TOKEN } from "@/lib/wallet/v1n3-token"
import { ngnToV1n3 } from "@/lib/marketplace/types"
import { getDefaultDeliveryFeeNgn } from "@/lib/marketplace/platform-config"
import { createNotification } from "@/lib/notifications/actions"

function roundV1n3(amount: number): number {
  return Math.round(amount * 1e6) / 1e6
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const method: string | undefined = body?.method // 'pickup' | 'delivery'

    if (method !== "pickup" && method !== "delivery") {
      return NextResponse.json({ error: "Invalid fulfillment method" }, { status: 400 })
    }

    // ---- Load the order (must belong to this buyer and be paid) ----
    const { data: order, error: orderErr } = await supabase
      .from("marketplace_orders")
      .select(
        "id, buyer_id, seller_id, product_id, product_title, status, fulfillment_method, fulfillment_status, seller_wallet",
      )
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "You can only manage your own orders" }, { status: 403 })
    }
    if (order.status !== "paid") {
      return NextResponse.json({ error: "This order is not in a payable state" }, { status: 400 })
    }
    if (order.fulfillment_method) {
      return NextResponse.json(
        { error: "Fulfillment has already been chosen for this order" },
        { status: 400 },
      )
    }

    const admin = createAdminClient()

    // ---- Product fulfillment config ----
    const { data: product } = await supabase
      .from("marketplace_products")
      .select("offers_delivery, pickup_available, delivery_fee")
      .eq("id", order.product_id)
      .single()

    // ---------------- PICKUP ----------------
    if (method === "pickup") {
      if (product && product.pickup_available === false) {
        return NextResponse.json({ error: "This product is not available for pickup" }, { status: 400 })
      }
      const terminalId: string | undefined = body?.terminalId
      if (!terminalId) {
        return NextResponse.json({ error: "Please select a pickup terminal" }, { status: 400 })
      }
      const { data: terminal } = await supabase
        .from("marketplace_terminals")
        .select("id, name, is_active")
        .eq("id", terminalId)
        .single()
      if (!terminal || !terminal.is_active) {
        return NextResponse.json({ error: "Selected terminal is unavailable" }, { status: 400 })
      }

      const { error: updErr } = await admin
        .from("marketplace_orders")
        .update({
          fulfillment_method: "pickup",
          fulfillment_status: "awaiting_pickup",
          terminal_id: terminalId,
        })
        .eq("id", orderId)

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }

      // Notify the seller they need to drop the item at the terminal.
      try {
        await createNotification({
          userId: order.seller_id,
          type: "system",
          title: "Buyer chose terminal pickup",
          body: `Order for "${order.product_title}" will be collected at ${terminal.name}.`,
          actionUrl: "/dashboard/orders",
        })
      } catch (e) {
        console.error("[v0] pickup notify error:", e)
      }

      return NextResponse.json({ success: true, method: "pickup", terminal: terminal.name })
    }

    // ---------------- DELIVERY ----------------
    // Delivery is always available via logistics. If the seller did not set a
    // per-listing fee, fall back to the admin-editable platform default.
    const deliveryAddress: string | undefined = body?.deliveryAddress
    const deliveryState: string | undefined = body?.deliveryState
    const deliveryLga: string | undefined = body?.deliveryLga
    const deliveryPhone: string | undefined = body?.deliveryPhone

    if (!deliveryAddress || !deliveryState || !deliveryLga || !deliveryPhone) {
      return NextResponse.json({ error: "Please provide your full delivery details" }, { status: 400 })
    }

    const sellerFee = Number(product?.delivery_fee ?? 0)
    const feeNgn = sellerFee > 0 ? sellerFee : await getDefaultDeliveryFeeNgn()
    const feeV1n3 = roundV1n3(ngnToV1n3(feeNgn))

    // Buyer wallet + balance check
    const { data: buyer } = await supabase
      .from("profiles")
      .select("wallet_address, display_name")
      .eq("id", user.id)
      .single()

    if (!buyer?.wallet_address) {
      return NextResponse.json({ error: "Your wallet is not set up yet" }, { status: 400 })
    }
    if (!order.seller_wallet) {
      return NextResponse.json({ error: "The seller cannot receive the delivery fee yet" }, { status: 400 })
    }

    const balance = await getV1N3Balance(buyer.wallet_address)
    if (balance < feeV1n3) {
      return NextResponse.json(
        { error: "Insufficient V1N3 balance for the delivery fee", balance, required: feeV1n3 },
        { status: 400 },
      )
    }

    const keypair = await getCustodialKeypair(user.id)
    if (!keypair) {
      return NextResponse.json({ error: "Could not access your wallet" }, { status: 400 })
    }

    // Pending send record
    const { data: pendingTx } = await admin
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "send",
        status: "pending",
        token_symbol: "V1N3",
        token_mint: V1N3_TOKEN.mintAddress,
        amount: feeV1n3,
        fee: 0.000005,
        from_address: buyer.wallet_address,
        to_address: order.seller_wallet,
        memo: `Delivery fee — ${order.product_title}`,
        metadata: { kind: "marketplace_delivery_fee", order_id: orderId, seller_id: order.seller_id },
      })
      .select()
      .single()

    const result = await transferV1N3(keypair, order.seller_wallet, feeV1n3)

    if (!result.success) {
      if (pendingTx) {
        await admin
          .from("wallet_transactions")
          .update({ status: "failed", metadata: { error: result.error } })
          .eq("id", pendingTx.id)
      }
      return NextResponse.json({ error: result.error ?? "Delivery fee transfer failed" }, { status: 500 })
    }

    // Confirm send + mirror receive for seller
    if (pendingTx) {
      await admin
        .from("wallet_transactions")
        .update({ status: "confirmed", signature: result.signature, confirmed_at: new Date().toISOString() })
        .eq("id", pendingTx.id)
    }
    await admin.from("wallet_transactions").insert({
      user_id: order.seller_id,
      type: "receive",
      status: "confirmed",
      token_symbol: "V1N3",
      token_mint: V1N3_TOKEN.mintAddress,
      amount: feeV1n3,
      fee: 0,
      from_address: buyer.wallet_address,
      to_address: order.seller_wallet,
      signature: result.signature,
      confirmed_at: new Date().toISOString(),
      metadata: { kind: "marketplace_delivery_fee", order_id: orderId, buyer_id: user.id },
    })

    const { error: updErr } = await admin
      .from("marketplace_orders")
      .update({
        fulfillment_method: "delivery",
        fulfillment_status: "delivery_paid",
        delivery_fee_ngn: feeNgn,
        delivery_fee_v1n3: feeV1n3,
        delivery_fee_signature: result.signature,
        delivery_paid_at: new Date().toISOString(),
        delivery_address: deliveryAddress,
        delivery_state: deliveryState,
        delivery_lga: deliveryLga,
        delivery_contact_phone: deliveryPhone,
      })
      .eq("id", orderId)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    // Refresh buyer cached balance
    try {
      const newBalance = await getV1N3Balance(buyer.wallet_address)
      await admin.from("profiles").update({ v1n3_balance: newBalance }).eq("id", user.id)
    } catch {
      // ignore
    }

    // Notify the seller to request logistics
    try {
      await createNotification({
        userId: order.seller_id,
        type: "payment_received",
        title: "Buyer paid for delivery",
        body: `${buyer.display_name ?? "A buyer"} paid the delivery fee for "${order.product_title}". Request a courier from the logistics community.`,
        referenceType: "payment",
        actionUrl: "/dashboard/orders",
        metadata: { kind: "marketplace_delivery_fee", order_id: orderId },
      })
    } catch (e) {
      console.error("[v0] delivery notify error:", e)
    }

    return NextResponse.json({ success: true, method: "delivery", feeV1n3, signature: result.signature })
  } catch (error) {
    console.error("[v0] fulfillment error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fulfillment failed" },
      { status: 500 },
    )
  }
}
