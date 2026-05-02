"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Wallet, Mail, ChevronRight, X, Loader2, Check, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
  { name: "Phantom", adapter: "phantom" },
  { name: "Solflare", adapter: "solflare" },
  { name: "Torus", adapter: "torus" },
  { name: "Ledger", adapter: "ledger" },
]

export function ConnectModal({ isOpen, onClose, onSuccess }: ConnectModalProps) {
  const { wallets, select, connect, publicKey, connected, disconnect } = useWallet()
  const [step, setStep] = useState<AuthStep>("select")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingWallet, setPendingWallet] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setStep("select")
      setEmail("")
      setOtp("")
      setError("")
      setPendingWallet(null)
    }
  }, [isOpen])

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
    
    const { data: { user } } = await supabase.auth.getUser()
    
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
    const wallet = wallets.find(w => w.adapter.name.toLowerCase() === walletName.toLowerCase())
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

  const getTitle = () => {
    switch (step) {
      case "select": return "CONNECT"
      case "wallet-list": return "SELECT WALLET"
      case "email-input": return "EMAIL"
      case "otp-verify": return "VERIFY"
      case "wallet-email": return "LINK EMAIL"
      case "success": return "CONNECTED"
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-[340px] mx-4 bg-card border border-border rounded-[3px] overflow-hidden"
        >
          {/* Corner Brackets */}
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-l border-t border-primary z-10" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-r border-t border-primary z-10" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-l border-b border-primary z-10" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-r border-b border-primary z-10" />
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              {step !== "select" && step !== "success" && (
                <button 
                  onClick={goBack}
                  className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="mono-xs text-foreground/80 tracking-widest">{getTitle()}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-[2px]">
                <p className="mono-xs text-destructive">{error}</p>
              </div>
            )}
            
            {step === "select" && (
              <div className="space-y-2">
                <button
                  onClick={() => setStep("wallet-list")}
                  className="w-full flex items-center justify-between px-3 py-3 bg-secondary border border-border rounded-[2px] hover:border-border-strong hover:bg-muted transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-primary/10 border border-primary/20">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="mono-xs text-foreground/80 group-hover:text-foreground transition-colors tracking-wide">
                      CONNECT WALLET
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                
                <button
                  onClick={() => setStep("email-input")}
                  className="w-full flex items-center justify-between px-3 py-3 bg-secondary border border-border rounded-[2px] hover:border-border-strong hover:bg-muted transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-primary/10 border border-primary/20">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="mono-xs text-foreground/80 group-hover:text-foreground transition-colors tracking-wide">
                      CONTINUE WITH EMAIL
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                
                <p className="mono-xs text-muted-foreground text-center pt-3 tracking-wide text-[9px]">
                  BY CONNECTING, YOU AGREE TO OUR TERMS
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
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary border border-border rounded-[2px] hover:border-border-strong hover:bg-muted transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center rounded-[2px] bg-muted border border-border">
                        <Wallet className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="mono-xs text-foreground/80 group-hover:text-foreground transition-colors tracking-wide">
                        {wallet.name.toUpperCase()}
                      </span>
                    </div>
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {step === "email-input" && (
              <div className="space-y-4">
                <div>
                  <label className="mono-xs text-muted-foreground tracking-widest mb-2 block text-[9px]">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-[2px] mono-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleEmailSubmit}
                  disabled={!email || loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground mono-xs tracking-wider rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "SEND CODE"
                  )}
                </button>
              </div>
            )}
            
            {step === "wallet-email" && (
              <div className="space-y-4">
                <p className="mono-xs text-muted-foreground leading-relaxed text-[10px]">
                  Link your email to create your social wallet
                </p>
                
                <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded-[2px]">
                  <p className="mono-xs text-primary/80 truncate text-[10px]">
                    {pendingWallet}
                  </p>
                </div>
                
                <div>
                  <label className="mono-xs text-muted-foreground tracking-widest mb-2 block text-[9px]">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-[2px] mono-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleWalletEmailSubmit}
                  disabled={!email || loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground mono-xs tracking-wider rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "LINK & SEND CODE"
                  )}
                </button>
              </div>
            )}
            
            {step === "otp-verify" && (
              <div className="space-y-4">
                <p className="mono-xs text-muted-foreground leading-relaxed text-[10px]">
                  Enter the 6-digit code sent to{" "}
                  <span className="text-foreground/80">{email}</span>
                </p>
                
                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-3 bg-secondary border border-border rounded-[2px] text-base text-foreground text-center font-mono tracking-[0.4em] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleOtpVerify}
                  disabled={otp.length !== 6 || loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground mono-xs tracking-wider rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "VERIFY"
                  )}
                </button>
              </div>
            )}
            
            {step === "success" && (
              <div className="py-6 flex flex-col items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <p className="mono-xs text-foreground/80 tracking-wider">SUCCESSFULLY CONNECTED</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
