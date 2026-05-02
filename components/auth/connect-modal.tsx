"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Wallet, Mail, ChevronRight, X, Loader2, Check } from "lucide-react"
import { 
  signInWithOtp, 
  verifyOtp, 
  linkWalletToEmail,
  updateProfileWallet 
} from "@/lib/auth/actions"
import { createClient } from "@/lib/supabase/client"

type AuthStep = "select" | "wallet-list" | "email-input" | "otp-verify" | "wallet-email" | "success"

interface ConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const WALLETS = [
  { name: "Phantom", icon: "/wallets/phantom.svg", adapter: "phantom" },
  { name: "Solflare", icon: "/wallets/solflare.svg", adapter: "solflare" },
  { name: "Torus", icon: "/wallets/torus.svg", adapter: "torus" },
  { name: "Ledger", icon: "/wallets/ledger.svg", adapter: "ledger" },
]

export function ConnectModal({ isOpen, onClose, onSuccess }: ConnectModalProps) {
  const { wallets, select, connect, publicKey, connected, disconnect } = useWallet()
  const [step, setStep] = useState<AuthStep>("select")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingWallet, setPendingWallet] = useState<string | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("select")
      setEmail("")
      setOtp("")
      setError("")
      setPendingWallet(null)
    }
  }, [isOpen])

  // Handle wallet connection
  useEffect(() => {
    if (connected && publicKey && step === "wallet-list") {
      handleWalletConnected()
    }
  }, [connected, publicKey, step])

  const handleWalletConnected = async () => {
    if (!publicKey) return
    
    setLoading(true)
    setError("")
    
    const walletAddress = publicKey.toBase58()
    const supabase = createClient()
    
    // Check if user is already logged in
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // User is logged in, link wallet to their account
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
      // Check if wallet is already linked to an account
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("wallet_address", walletAddress)
        .single()
      
      if (existingProfile?.email) {
        // Wallet is linked, send OTP to that email
        setEmail(existingProfile.email)
        const result = await signInWithOtp(existingProfile.email)
        if (result.error) {
          setError(result.error)
        } else {
          setStep("otp-verify")
        }
      } else {
        // New wallet, need to link with email
        setPendingWallet(walletAddress)
        setStep("wallet-email")
      }
    }
    
    setLoading(false)
  }

  const handleWalletSelect = async (walletName: string) => {
    setError("")
    const wallet = wallets.find(w => w.adapter.name.toLowerCase() === walletName.toLowerCase())
    if (wallet) {
      try {
        select(wallet.adapter.name)
        await connect()
      } catch (err) {
        setError("Failed to connect wallet. Please try again.")
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
    
    const result = await verifyOtp(email, otp)
    
    if (result.error) {
      setError(result.error)
    } else {
      setStep("success")
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    }
    
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[360px] mx-4 bg-[#0a0f0a] border border-[#00c853]/20 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#00c853]/10">
          <h2 className="text-sm font-light tracking-wider text-white/90">
            {step === "select" && "Connect"}
            {step === "wallet-list" && "Select Wallet"}
            {step === "email-input" && "Enter Email"}
            {step === "otp-verify" && "Verify Code"}
            {step === "wallet-email" && "Link Email"}
            {step === "success" && "Connected"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-sm">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          
          {step === "select" && (
            <div className="space-y-3">
              <button
                onClick={() => setStep("wallet-list")}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1410] border border-[#00c853]/10 rounded-sm hover:border-[#00c853]/30 hover:bg-[#0d1410]/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-sm bg-[#00c853]/10">
                    <Wallet className="w-4 h-4 text-[#00c853]" />
                  </div>
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                    Connect Wallet
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#00c853] transition-colors" />
              </button>
              
              <button
                onClick={() => setStep("email-input")}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1410] border border-[#00c853]/10 rounded-sm hover:border-[#00c853]/30 hover:bg-[#0d1410]/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-sm bg-[#00c853]/10">
                    <Mail className="w-4 h-4 text-[#00c853]" />
                  </div>
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                    Continue with Email
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#00c853] transition-colors" />
              </button>
              
              <p className="text-[10px] text-white/30 text-center pt-2 tracking-wide">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          )}
          
          {step === "wallet-list" && (
            <div className="space-y-2">
              {WALLETS.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet.adapter)}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1410] border border-[#00c853]/10 rounded-sm hover:border-[#00c853]/30 hover:bg-[#0d1410]/80 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-sm bg-white/5">
                      <Wallet className="w-3.5 h-3.5 text-white/60" />
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                      {wallet.name}
                    </span>
                  </div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-[#00c853] animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#00c853] transition-colors" />
                  )}
                </button>
              ))}
              
              <button
                onClick={() => setStep("select")}
                className="w-full text-xs text-white/40 hover:text-white/60 transition-colors py-2"
              >
                Back
              </button>
            </div>
          )}
          
          {step === "email-input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-white/40 tracking-wider mb-2 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#0d1410] border border-[#00c853]/10 rounded-sm text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00c853]/40 transition-colors"
                  autoFocus
                />
              </div>
              
              <button
                onClick={handleEmailSubmit}
                disabled={!email || loading}
                className="w-full py-3 bg-[#00c853] text-black text-sm font-medium rounded-sm hover:bg-[#00e676] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Code"
                )}
              </button>
              
              <button
                onClick={() => setStep("select")}
                className="w-full text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Back
              </button>
            </div>
          )}
          
          {step === "wallet-email" && (
            <div className="space-y-4">
              <p className="text-xs text-white/50 leading-relaxed">
                Link your email to create your social wallet and complete registration.
              </p>
              
              <div>
                <label className="block text-[10px] text-white/40 tracking-wider mb-2 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#0d1410] border border-[#00c853]/10 rounded-sm text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00c853]/40 transition-colors"
                  autoFocus
                />
              </div>
              
              <div className="px-3 py-2 bg-[#00c853]/5 border border-[#00c853]/10 rounded-sm">
                <p className="text-[10px] text-[#00c853]/70 font-mono truncate">
                  {pendingWallet}
                </p>
              </div>
              
              <button
                onClick={handleWalletEmailSubmit}
                disabled={!email || loading}
                className="w-full py-3 bg-[#00c853] text-black text-sm font-medium rounded-sm hover:bg-[#00e676] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Link & Send Code"
                )}
              </button>
              
              <button
                onClick={() => {
                  disconnect()
                  setStep("select")
                  setPendingWallet(null)
                }}
                className="w-full text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          
          {step === "otp-verify" && (
            <div className="space-y-4">
              <p className="text-xs text-white/50 leading-relaxed">
                Enter the 6-digit code sent to <span className="text-white/80">{email}</span>
              </p>
              
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-[#0d1410] border border-[#00c853]/10 rounded-sm text-lg text-white text-center font-mono tracking-[0.5em] placeholder:text-white/20 focus:outline-none focus:border-[#00c853]/40 transition-colors"
                  autoFocus
                />
              </div>
              
              <button
                onClick={handleOtpVerify}
                disabled={otp.length !== 6 || loading}
                className="w-full py-3 bg-[#00c853] text-black text-sm font-medium rounded-sm hover:bg-[#00e676] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </button>
              
              <button
                onClick={() => setStep("email-input")}
                className="w-full text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Change email
              </button>
            </div>
          )}
          
          {step === "success" && (
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#00c853]/10 border border-[#00c853]/30">
                <Check className="w-6 h-6 text-[#00c853]" />
              </div>
              <p className="text-sm text-white/80">Successfully connected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
