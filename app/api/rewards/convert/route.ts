import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { transferV1N3, getV1N3Balance, V1N3_TOKEN, getExplorerUrl } from "@/lib/wallet/v1n3-token"
import { getPlatformConfig } from "@/lib/rewards/config"
import { getDistributorKeypair, DISTRIBUTOR_WALLET } from "@/lib/wallet/distributor"
import { createNotification } from "@/lib/notifications/actions"

function roundV1n3(amount: number): number {
  return Math.round(amount * 1e6) / 1e6
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
    const points = Math.floor(Number(body?.points))

    if (!Number.isFinite(points) || points <= 0) {
      return NextResponse.json({ error: "Enter a valid number of points" }, { status: 400 })
    }

    const admin = createAdminClient()
    const config = await getPlatformConfig(admin)

    if (points < config.minConversionPoints) {
      return NextResponse.json(
        { error: `You need at least ${config.minConversionPoints.toLocaleString()} points to redeem` },
        { status: 400 },
      )
    }

    // Buyer profile + balance check.
    const { data: me } = await supabase
      .from("profiles")
      .select("id, wallet_address, points_balance, display_name")
      .eq("id", user.id)
      .single()

    if (!me?.wallet_address) {
      return NextResponse.json({ error: "Your wallet is not set up yet" }, { status: 400 })
    }
    if ((me.points_balance ?? 0) < points) {
      return NextResponse.json({ error: "Insufficient points balance" }, { status: 400 })
    }

    const v1n3Amount = roundV1n3(points / config.pointsPerV1n3)
    if (v1n3Amount <= 0) {
      return NextResponse.json({ error: "Amount too small to redeem" }, { status: 400 })
    }

    // Load the mainnet distributor signer from the secure server env var.
    const treasuryKeypair = getDistributorKeypair()
    if (!treasuryKeypair) {
      return NextResponse.json(
        { error: "Rewards distributor is not configured yet. Please contact support." },
        { status: 503 },
      )
    }

    // Ensure the distributor can cover the payout.
    const treasuryBalance = await getV1N3Balance(DISTRIBUTOR_WALLET)
    if (treasuryBalance < v1n3Amount) {
      return NextResponse.json(
        { error: "Rewards pool is temporarily out of funds. Please try again later." },
        { status: 503 },
      )
    }

    // 1. Record a pending conversion.
    const { data: conversion, error: convErr } = await admin
      .from("points_conversions")
      .insert({
        user_id: user.id,
        points_spent: points,
        v1n3_amount: v1n3Amount,
        rate: config.pointsPerV1n3,
        treasury_wallet: DISTRIBUTOR_WALLET,
        user_wallet: me.wallet_address,
        status: "pending",
      })
      .select("id")
      .single()

    if (convErr || !conversion) {
      return NextResponse.json({ error: "Could not start conversion" }, { status: 500 })
    }

    // 2. Deduct points atomically (guards against double-spend / race).
    try {
      await admin.rpc("spend_points_for_conversion", {
        p_user_id: user.id,
        p_points: points,
        p_conversion_id: conversion.id,
      })
    } catch (e) {
      await admin
        .from("points_conversions")
        .update({ status: "failed", error: "deduct_failed", updated_at: new Date().toISOString() })
        .eq("id", conversion.id)
      return NextResponse.json({ error: "Insufficient points balance" }, { status: 400 })
    }

    // 3. Pay out V1N3 from the treasury.
    const result = await transferV1N3(treasuryKeypair, me.wallet_address, v1n3Amount)

    if (!result.success) {
      // Refund the points and mark the conversion failed.
      await admin.rpc("award_points", {
        p_user_id: user.id,
        p_delta: points,
        p_reason: "conversion_refund",
        p_reference_type: "points_conversion",
        p_reference_id: conversion.id,
      })
      await admin
        .from("points_conversions")
        .update({
          status: "failed",
          error: result.error ?? "transfer_failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversion.id)
      return NextResponse.json(
        { error: "Payout failed, your points were refunded. Please try again." },
        { status: 500 },
      )
    }

    // 4. Confirm + mirror records.
    await admin
      .from("points_conversions")
      .update({
        status: "confirmed",
        signature: result.signature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversion.id)

    await admin.from("wallet_transactions").insert({
      user_id: user.id,
      type: "receive",
      status: "confirmed",
      token_symbol: "V1N3",
      token_mint: V1N3_TOKEN.mintAddress,
      amount: v1n3Amount,
      fee: 0,
      from_address: DISTRIBUTOR_WALLET,
      to_address: me.wallet_address,
      signature: result.signature,
      confirmed_at: new Date().toISOString(),
      memo: `Redeemed ${points.toLocaleString()} points`,
      metadata: { kind: "points_conversion", conversion_id: conversion.id },
    })

    // Refresh cached balance.
    try {
      const newBalance = await getV1N3Balance(me.wallet_address)
      await admin.from("profiles").update({ v1n3_balance: newBalance }).eq("id", user.id)
    } catch {
      // ignore
    }

    try {
      await createNotification({
        userId: user.id,
        type: "payment_received",
        title: "Points redeemed",
        body: `You converted ${points.toLocaleString()} points into ${v1n3Amount} V1N3.`,
        referenceType: "payment",
        actionUrl: "/dashboard/rewards",
        metadata: { kind: "points_conversion", signature: result.signature },
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      pointsSpent: points,
      v1n3Amount,
      signature: result.signature,
      explorerUrl: getExplorerUrl(result.signature, 'tx'),
    })
  } catch (error) {
    console.error("[v0] convert error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion failed" },
      { status: 500 },
    )
  }
}
