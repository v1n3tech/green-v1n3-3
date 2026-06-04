import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isWalletOrphaned, remintCustodialWallet } from "@/lib/wallet/mint"

/**
 * Self-heal recovery for custodial wallets whose private keys were lost.
 *
 *  GET                                  -> { orphaned: boolean }
 *  POST { action: "request" }           -> emails a 6-digit OTP to the user.
 *  POST { action: "verify", token }     -> verifies OTP, re-mints a fresh
 *                                          mnemonic wallet, returns it ONCE.
 *
 * Re-minting abandons any funds at the old (unsignable) address — the UI must
 * warn the user before they trigger this.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orphaned = await isWalletOrphaned(user.id)
    return NextResponse.json({ orphaned })
  } catch {
    return NextResponse.json({ error: "Failed to check wallet status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action

    if (action === "request") {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      const [name, domain] = user.email.split("@")
      const masked = `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`
      return NextResponse.json({ success: true, sentTo: masked })
    }

    if (action === "verify") {
      const token = String(body?.token ?? "").trim()
      if (!token) {
        return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
      }

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: user.email,
        token,
        type: "email",
      })
      if (verifyErr) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })
      }

      const result = await remintCustodialWallet(user.id)
      return NextResponse.json({
        success: true,
        publicKey: result.publicKey,
        mnemonic: result.mnemonic,
        previousAddress: result.previousAddress,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] recover route error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to recover wallet" }, { status: 500 })
  }
}
