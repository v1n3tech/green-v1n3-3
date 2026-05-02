"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Mail, ChevronRight, X, Loader2, Check, ArrowLeft, Wallet as WalletIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  signInWithOtp,
  verifyOtp,
  linkWalletToEmail,
  updateProfileWallet,
} from "@/lib/auth/actions"
import { createClient } from "@/lib/supabase/client"
import {
  PhantomIcon,
  SolflareIcon,
  TorusIcon,
  LedgerIcon,
} from "@/components/icons/wallet-icons"

type AuthStep =
  | "select"
  | "wallet-list"
  | "email-input"
  | "otp-verify"
  | "provisioning"
  | "wallet-email"
  | "success"

type ProvisionStage = "verifying" | "minting" | "linking" | "done"

interface ConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const WALLETS = [
  { name: "Phantom", adapter: "phantom", Icon: PhantomIcon },
  { name: "Solflare", adapter: "solflare", Icon: SolflareIcon },
  { name: "Torus", adapter: "torus", Icon: TorusIcon },
  { name: "Ledger", adapter: "ledger", Icon: LedgerIcon },
]

export function ConnectModal({ isOpen, onClose, onSuccess }: ConnectModalProps) {
  const { wallets, select, connect, publicKey, connected, disconnect } = useWallet()
  const [step, setStep] = useState<AuthStep>("select")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingWallet, setPendingWallet] = useState<string | null>(null)
  const [mintedAddress, setMintedAddress] = useState<string | null>(null)
  const [provisionStage, setProvisionStage] =
    useState<ProvisionStage>("verifying")
  const [walletWarning, setWalletWarning] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [callsign, setCallsign] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setStep("select")
      setEmail("")
      setOtp("")
      setError("")
      setPendingWallet(null)
      setMintedAddress(null)
      setProvisionStage("verifying")
      setWalletWarning(null)
      setIsNewUser(false)
      setCallsign(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (connected && publicKey && step === "wallet-list") {
      handleWalletConnected()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, step])

  const handleWalletConnected = async () => {
    if (!publicKey) return

    setLoading(true)
    setError("")

    const walletAddress = publicKey.toBase58()
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const result = await updateProfileWallet(user.id, walletAddress)
      if (result.error) {
        setError(result.error)
      } else {
        setStep("success")
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      }
    } else {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("wallet_address", walletAddress)
        .single()

      if (existingProfile?.email) {
        setEmail(existingProfile.email)
        const result = await signInWithOtp(existingProfile.email)
        if (result.error) {
          setError(result.error)
        } else {
          setStep("otp-verify")
        }
      } else {
        setPendingWallet(walletAddress)
        setStep("wallet-email")
      }
    }

    setLoading(false)
  }

  const handleWalletSelect = async (walletName: string) => {
    setError("")
    const wallet = wallets.find(
      (w) => w.adapter.name.toLowerCase() === walletName.toLowerCase(),
    )
    if (wallet) {
      try {
        select(wallet.adapter.name)
        await connect()
      } catch {
        setError("Failed to connect wallet")
      }
    }
  }

  const handleEmailSubmit = async () => {
    if (!email) return
    setLoading(true)
    setError("")
    const result = await signInWithOtp(email)
    if (result.error) {
      setError(result.error)
    } else {
      setStep("otp-verify")
    }
    setLoading(false)
  }

  const handleWalletEmailSubmit = async () => {
    if (!email || !pendingWallet) return
    setLoading(true)
    setError("")
    const result = await linkWalletToEmail(email, pendingWallet)
    if (result.error) {
      setError(result.error)
    } else {
      setStep("otp-verify")
    }
    setLoading(false)
  }

  const handleOtpVerify = async () => {
    if (otp.length !== 6) return
    setLoading(true)
    setError("")
    setWalletWarning(null)

    setStep("provisioning")
    setProvisionStage("verifying")

    const stageTimers: ReturnType<typeof setTimeout>[] = []
    stageTimers.push(setTimeout(() => setProvisionStage("minting"), 600))
    stageTimers.push(setTimeout(() => setProvisionStage("linking"), 1400))

    const result = await verifyOtp(email, otp)
    stageTimers.forEach(clearTimeout)

    if (result.error) {
      setError(result.error)
      setStep("otp-verify")
      setLoading(false)
      return
    }

    if (result.accessToken && result.refreshToken) {
      try {
        const supabase = createClient()
        await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        })
      } catch (err) {
        console.log("[v0] setSession failed:", err)
      }
    }

    if (result.walletAddress) setMintedAddress(result.walletAddress)
    if (result.walletWarning) setWalletWarning(result.walletWarning)
    if (result.displayName) setCallsign(result.displayName)
    setIsNewUser(Boolean(result.isNewUser))

    setProvisionStage("done")

    const dwellMs = result.isNewUser ? 3200 : 1500

    setTimeout(() => {
      setStep("success")
      setLoading(false)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, dwellMs)
    }, 500)
  }

  const goBack = () => {
    if (step === "wallet-list" || step === "email-input") {
      setStep("select")
    } else if (step === "otp-verify") {
      setStep(pendingWallet ? "wallet-email" : "email-input")
    } else if (step === "wallet-email") {
      disconnect()
      setPendingWallet(null)
      setStep("select")
    }
    setError("")
  }

  if (!isOpen) return null

  const isLocked = step === "provisioning"

  const safeClose = () => {
    if (isLocked) return
    onClose()
  }

  const getTitle = () => {
    switch (step) {
      case "select":
        return "/ CONNECT"
      case "wallet-list":
        return "/ SELECT WALLET"
      case "email-input":
        return "/ EMAIL"
      case "otp-verify":
        return "/ VERIFY"
      case "provisioning":
        return "/ PROVISIONING"
      case "wallet-email":
        return "/ LINK EMAIL"
      case "success":
        return isNewUser ? "/ INITIATED" : "/ AUTHENTICATED"
    }
  }

  const getStepIndex = () => {
    switch (step) {
      case "select":
        return "00"
      case "wallet-list":
        return "01"
      case "email-input":
        return "01"
      case "wallet-email":
        return "02"
      case "otp-verify":
        return "02"
      case "provisioning":
        return "03"
      case "success":
        return "04"
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/95 backdrop-blur-md"
          onClick={safeClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[380px]"
        >
          {/* Sleek system panel — flush with app background, no milky lift */}
          <div className="relative bg-background border border-border rounded-[2px] overflow-hidden">
            {/* Status bar — top */}
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-4 h-8">
                <div className="flex items-center gap-2.5">
                  <span className="status-dot status-dot-pulse" />
                  <span className="mono-xs text-muted-foreground text-[9px]">SECURE SESSION</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="mono-xs text-muted-foreground/70 text-[9px]">STEP {getStepIndex()}</span>
                  <button
                    onClick={safeClose}
                    disabled={isLocked}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                {step !== "select" &&
                  step !== "success" &&
                  step !== "provisioning" && (
                    <button
                      onClick={goBack}
                      className="p-1 -ml-1 text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                <div className="w-1 h-4 bg-primary" />
                <span className="mono-xs text-primary tracking-wider">{getTitle()}</span>
              </div>
            </div>

            {/* Content */}
            <div className="relative p-5">
              {error && (
                <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-[2px]">
                  <p className="mono-xs text-destructive text-[9px]">{error}</p>
                </div>
              )}

              {step === "select" && (
                <div>
                  <span className="mono-xs text-muted-foreground/70 block mb-3 text-[9px]">
                    / CHOOSE METHOD
                  </span>

                  <div className="space-y-px">
                    <MethodRow
                      index="01"
                      icon={<WalletIcon className="w-3.5 h-3.5" />}
                      label="CONNECT WALLET"
                      hint="SOL"
                      onClick={() => setStep("wallet-list")}
                    />
                    <MethodRow
                      index="02"
                      icon={<Mail className="w-3.5 h-3.5" />}
                      label="CONTINUE WITH EMAIL"
                      hint="OTP"
                      onClick={() => setStep("email-input")}
                    />
                  </div>

                  <div className="pt-4 mt-4 border-t border-border">
                    <p className="mono-xs text-muted-foreground/60 text-center text-[9px] tracking-wider">
                      BY CONNECTING, YOU AGREE TO OUR TERMS
                    </p>
                  </div>
                </div>
              )}

              {step === "wallet-list" && (
                <div>
                  <span className="mono-xs text-muted-foreground/70 block mb-3 text-[9px]">
                    / AVAILABLE WALLETS
                  </span>
                  <div className="space-y-px">
                    {WALLETS.map((wallet, idx) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleWalletSelect(wallet.adapter)}
                        disabled={loading}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 group transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <wallet.Icon className="w-4 h-4 rounded-[2px] shrink-0" />
                        <span className="mono-sm text-foreground/80 group-hover:text-foreground text-[10.5px] tracking-wider transition-colors flex-1 text-left">
                          {wallet.name.toUpperCase()}
                        </span>
                        {loading ? (
                          <Loader2 className="w-3 h-3 text-primary animate-spin" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "email-input" && (
                <div className="space-y-4">
                  <p className="mono-xs text-muted-foreground/80 leading-relaxed text-[10px] tracking-wide">
                    ENTER YOUR EMAIL TO RECEIVE A 6-DIGIT VERIFICATION CODE.
                  </p>

                  <div>
                    <label className="mono-xs text-muted-foreground mb-2 block text-[9px]">
                      / EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 bg-input border border-border rounded-[2px] font-mono text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors tracking-wide"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleEmailSubmit}
                    disabled={!email || loading}
                    className="w-full py-3 bg-primary text-primary-foreground mono-sm rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] tracking-wider"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>SEND CODE</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "wallet-email" && (
                <div className="space-y-4">
                  <p className="mono-xs text-muted-foreground/80 leading-relaxed text-[10px] tracking-wide">
                    LINK YOUR EMAIL TO CREATE YOUR SOCIAL WALLET.
                  </p>

                  <div className="px-3 py-2.5 bg-secondary border border-border rounded-[2px]">
                    <span className="mono-xs text-muted-foreground/70 text-[9px] block mb-1">
                      / WALLET ADDRESS
                    </span>
                    <p className="font-mono text-[10px] text-primary truncate tracking-wide">
                      {pendingWallet}
                    </p>
                  </div>

                  <div>
                    <label className="mono-xs text-muted-foreground mb-2 block text-[9px]">
                      / EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 bg-input border border-border rounded-[2px] font-mono text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors tracking-wide"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleWalletEmailSubmit}
                    disabled={!email || loading}
                    className="w-full py-3 bg-primary text-primary-foreground mono-sm rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] tracking-wider"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>LINK & SEND CODE</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "otp-verify" && (
                <div className="space-y-4">
                  <p className="mono-xs text-muted-foreground/80 leading-relaxed text-[10px] tracking-wide">
                    ENTER THE 6-DIGIT CODE SENT TO
                    <br />
                    <span className="text-foreground/90">{email.toUpperCase()}</span>
                  </p>

                  <div>
                    <label className="mono-xs text-muted-foreground mb-2 block text-[9px]">
                      / VERIFICATION CODE
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-3 py-3.5 bg-input border border-border rounded-[2px] text-base text-foreground text-center font-mono tracking-[0.6em] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleOtpVerify}
                    disabled={otp.length !== 6 || loading}
                    className="w-full py-3 bg-primary text-primary-foreground mono-sm rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] tracking-wider"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>VERIFY</span>
                        <Check className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "provisioning" && (
                <div className="py-2 space-y-4">
                  {/* Spinning ring with center dot */}
                  <div className="flex justify-center pt-2">
                    <div className="relative w-14 h-14">
                      <div className="absolute inset-0 rounded-full border border-border" />
                      <div className="absolute inset-0 rounded-full border-t border-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="status-dot status-dot-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Stage list */}
                  <div className="space-y-1.5 px-1">
                    <ProvisionLine
                      index={1}
                      label="VERIFYING CODE"
                      state={
                        provisionStage === "verifying"
                          ? "active"
                          : "done"
                      }
                    />
                    <ProvisionLine
                      index={2}
                      label="MINTING SOLANA WALLET"
                      state={
                        provisionStage === "verifying"
                          ? "pending"
                          : provisionStage === "minting"
                            ? "active"
                            : "done"
                      }
                    />
                    <ProvisionLine
                      index={3}
                      label="LINKING TO PROFILE"
                      state={
                        provisionStage === "verifying" ||
                        provisionStage === "minting"
                          ? "pending"
                          : provisionStage === "linking"
                            ? "active"
                            : "done"
                      }
                    />
                  </div>

                  <p className="mono-xs text-muted-foreground/60 text-center text-[9px] pt-1 tracking-wider">
                    / DO NOT CLOSE THIS WINDOW
                  </p>
                </div>
              )}

              {step === "success" && !isNewUser && (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-[2px] bg-primary/10 border border-primary/40">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="mono-sm text-foreground text-[11px] mb-1 tracking-wider">
                      WELCOME BACK
                    </p>
                    {callsign && (
                      <p className="font-mono text-[10px] text-primary tracking-[0.15em]">
                        {callsign}
                      </p>
                    )}
                    <p className="mono-xs text-muted-foreground/60 text-[9px] mt-2 tracking-wider">
                      / SESSION RESTORED
                    </p>
                  </div>
                </div>
              )}

              {step === "success" && isNewUser && (
                <div className="py-2 space-y-4">
                  {/* Hero badge */}
                  <div className="flex flex-col items-center gap-3 pb-1">
                    <div className="w-14 h-14 flex items-center justify-center rounded-[2px] bg-primary/10 border border-primary/40">
                      <Check className="w-6 h-6 text-primary" strokeWidth={2} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="mono-xs text-primary/80 text-[9px] tracking-[0.25em]">
                        / IDENTITY FORGED
                      </p>
                      <p className="mono-sm text-foreground text-[12px] tracking-wider">
                        WELCOME TO GREENV1N3
                      </p>
                    </div>
                  </div>

                  {/* Callsign card */}
                  {callsign && (
                    <div className="px-3.5 py-3 bg-secondary border border-border rounded-[2px]">
                      <span className="mono-xs text-muted-foreground/70 text-[9px] block mb-1.5">
                        / YOUR CALLSIGN
                      </span>
                      <p className="font-mono text-[13px] text-primary tracking-[0.2em] font-medium">
                        {callsign}
                      </p>
                    </div>
                  )}

                  {/* Wallet card */}
                  {mintedAddress && (
                    <div className="px-3.5 py-2.5 bg-secondary border border-border rounded-[2px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="mono-xs text-muted-foreground/70 text-[9px]">
                          / SOLANA WALLET MINTED
                        </span>
                        <span className="status-dot status-dot-pulse" />
                      </div>
                      <p className="font-mono text-[10px] text-foreground/90 truncate tracking-wide">
                        {mintedAddress}
                      </p>
                    </div>
                  )}

                  {walletWarning && (
                    <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-[2px]">
                      <p className="mono-xs text-destructive text-[9px] leading-relaxed">
                        WALLET PROVISIONING DEFERRED — WILL RETRY ON NEXT SIGN IN
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer marker bar */}
            <div className="border-t border-border px-4 h-6 flex items-center justify-between">
              <span className="mono-xs text-muted-foreground/50 text-[8.5px] tracking-[0.2em]">
                GREENV1N3 / AUTH
              </span>
              <span className="mono-xs text-muted-foreground/50 text-[8.5px] tracking-[0.2em]">
                V1.0
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function MethodRow({
  index,
  icon,
  label,
  hint,
  onClick,
}: {
  index: string
  icon: React.ReactNode
  label: string
  hint?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-primary/5 group transition-colors border-b border-border last:border-b-0"
    >
      <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
        {index}
      </span>
      <span className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </span>
      <span className="mono-sm text-foreground/80 group-hover:text-foreground text-[10.5px] tracking-wider transition-colors flex-1 text-left">
        {label}
      </span>
      {hint && (
        <span className="mono-xs text-muted-foreground/40 group-hover:text-primary/70 text-[8.5px] tracking-wider transition-colors">
          {hint}
        </span>
      )}
      <ChevronRight className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}

function ProvisionLine({
  index,
  label,
  state,
}: {
  index: number
  label: string
  state: "pending" | "active" | "done"
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 border rounded-[2px] transition-colors ${
        state === "active"
          ? "bg-primary/5 border-primary/40"
          : state === "done"
            ? "bg-secondary border-border"
            : "bg-secondary/40 border-border/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`mono-xs w-4 text-[9px] ${
            state === "pending"
              ? "text-muted-foreground/40"
              : "text-muted-foreground/70"
          }`}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span
          className={`mono-sm text-[10px] tracking-wide transition-colors ${
            state === "active"
              ? "text-foreground"
              : state === "done"
                ? "text-foreground/70"
                : "text-muted-foreground/50"
          }`}
        >
          {label}
        </span>
      </div>
      {state === "active" && (
        <Loader2 className="w-3 h-3 text-primary animate-spin" />
      )}
      {state === "done" && <Check className="w-3 h-3 text-primary" />}
      {state === "pending" && (
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
      )}
    </div>
  )
}
