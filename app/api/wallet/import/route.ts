import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { importWallet } from "@/lib/wallet/mint"

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

    let body: { secretKey?: string; derivationPath?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const secretKey = body.secretKey
    if (!secretKey || typeof secretKey !== "string") {
      return NextResponse.json({ error: "Secret key is required" }, { status: 400 })
    }

    const outcome = await importWallet(user.id, secretKey, {
      derivationPath: typeof body.derivationPath === "string" ? body.derivationPath : undefined,
    })

    // Seed phrase mapped to multiple/zero funded addresses — ask the user to pick.
    if (outcome.needsSelection) {
      return NextResponse.json({ success: false, needsSelection: true, candidates: outcome.candidates })
    }

    return NextResponse.json({
      success: true,
      publicKey: outcome.publicKey,
      replacedPreviousWallet: outcome.replacedPreviousWallet,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import wallet"
    console.log("[v0] wallet import error:", message)
    // Validation errors are safe to surface; keep a 400 for those.
    const isValidation =
      message.startsWith("Invalid secret key") ||
      message.startsWith("Secret key") ||
      message.includes("already linked")
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 })
  }
}
