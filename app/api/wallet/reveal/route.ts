import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revealWalletSecrets } from "@/lib/wallet/mint"

/**
 * OTP-gated reveal of a user's own wallet secrets (seed phrase + private key).
 *
 *  POST { action: "request" }            -> emails a 6-digit OTP to the user.
 *  POST { action: "verify", token }      -> verifies the OTP, returns secrets.
 *
 * Secrets are returned exactly once in the response body and are never logged.
 */
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
      // Don't echo the full email back; mask it.
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

      const secrets = await revealWalletSecrets(user.id)
      if (!secrets) {
        return NextResponse.json(
          { error: "No custodial wallet found for this account" },
          { status: 404 },
        )
      }

      return NextResponse.json({
        success: true,
        publicKey: secrets.publicKey,
        mnemonic: secrets.mnemonic,
        secretKey: secrets.secretKey,
        hasMnemonic: !!secrets.mnemonic,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] reveal route error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to reveal wallet secrets" }, { status: 500 })
  }
}
