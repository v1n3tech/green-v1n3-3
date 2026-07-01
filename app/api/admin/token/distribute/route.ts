import { NextRequest, NextResponse } from "next/server"
import { PublicKey } from "@solana/web3.js"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { transferV1N3, getV1N3Balance, getExplorerUrl, V1N3_TOKEN } from "@/lib/wallet/v1n3-token"
import { getDistributorKeypair, DISTRIBUTOR_WALLET } from "@/lib/wallet/distributor"

/**
 * Admin-only: send V1N3 from the hot distributor wallet to any address.
 * The distributor key is loaded server-side from V1N3_DISTRIBUTOR_SECRET_KEY.
 * The cold treasury master key is NEVER used here.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
  }

  let body: { recipient?: string; amount?: number; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const recipient = body.recipient?.trim()
  const amount = Number(body.amount)

  // Validate recipient address.
  if (!recipient) {
    return NextResponse.json({ error: "Recipient address is required" }, { status: 400 })
  }
  let recipientPubkey: PublicKey
  try {
    recipientPubkey = new PublicKey(recipient)
  } catch {
    return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 })
  }
  if (recipientPubkey.toBase58() === DISTRIBUTOR_WALLET) {
    return NextResponse.json({ error: "Recipient cannot be the distributor itself" }, { status: 400 })
  }

  // Validate amount.
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
  }

  // Load the distributor signer.
  const distributor = getDistributorKeypair()
  if (!distributor) {
    return NextResponse.json(
      { error: "Distributor signing key is not configured (V1N3_DISTRIBUTOR_SECRET_KEY)." },
      { status: 503 },
    )
  }

  // Ensure the distributor has enough V1N3.
  const balance = await getV1N3Balance(DISTRIBUTOR_WALLET).catch(() => 0)
  if (amount > balance) {
    return NextResponse.json(
      { error: `Insufficient distributor balance. Available: ${balance.toLocaleString()} V1N3.` },
      { status: 400 },
    )
  }

  // Execute the transfer.
  const result = await transferV1N3(distributor, recipientPubkey.toBase58(), amount)
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Transfer failed" }, { status: 500 })
  }

  // Best-effort audit log — never block a completed transfer.
  const toAddress = recipientPubkey.toBase58()
  try {
    const admin = createAdminClient()

    // If the recipient is a known platform user, mirror a "receive" row so the
    // transfer shows up in their wallet history; otherwise log it under the
    // acting admin as a "send".
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("wallet_address", toAddress)
      .maybeSingle()

    await admin.from("wallet_transactions").insert({
      user_id: recipientProfile?.id ?? user.id,
      type: recipientProfile ? "receive" : "send",
      status: "confirmed",
      token_symbol: "V1N3",
      token_mint: V1N3_TOKEN.mintAddress,
      amount,
      fee: 0,
      from_address: DISTRIBUTOR_WALLET,
      to_address: toAddress,
      signature: result.signature,
      confirmed_at: new Date().toISOString(),
      memo: body.note?.trim() || "Admin distribution",
      metadata: { kind: "admin_distribution", admin_id: user.id },
    })

    // Refresh the recipient's cached balance if they're a platform user.
    if (recipientProfile?.id) {
      try {
        const newBalance = await getV1N3Balance(toAddress)
        await admin.from("profiles").update({ v1n3_balance: newBalance }).eq("id", recipientProfile.id)
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.error("[v0] distribute: audit log insert failed:", err)
  }

  return NextResponse.json({
    success: true,
    signature: result.signature,
    explorerUrl: getExplorerUrl(result.signature, "tx"),
    amount,
    recipient: recipientPubkey.toBase58(),
  })
}
