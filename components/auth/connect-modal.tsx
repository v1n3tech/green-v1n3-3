"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Mail, ChevronRight, X, Loader2, Check, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  signInWithOtp, 
  verifyOtp, 
  linkWalletToEmail,
  updateProfileWallet 
} from "@/lib/auth/actions"
import { createClient } from "@/lib/supabase/client"
import { 
  PhantomIcon, 
  SolflareIcon, 
  TorusIcon, 
  LedgerIcon,
  SolanaWalletIcon 
} from "@/components/icons/wallet-icons"

type AuthStep = "select" | "wallet-list" | "email-input" | "otp-verify" | "wallet-email" | "success"

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
          className="absolute inset-0 bg-[#030504]/90 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-[320px] mx-4 bg-[#0a0f0a] border border-[#1a2f1a] rounded-[3px] overflow-hidden"
        >
          {/* Corner Brackets */}
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-l border-t border-[#00c853] z-10" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-r border-t border-[#00c853] z-10" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-l border-b border-[#00c853] z-10" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-r border-b border-[#00c853] z-10" />
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2f1a]">
            <div className="flex items-center gap-2">
              {step !== "select" && step !== "success" && (
                <button 
                  onClick={goBack}
                  className="p-1 -ml-1 text-[#4a6a4a] hover:text-[#8ab88a] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="font-mono text-[10px] text-[#8ab88a]/80 tracking-[0.2em]">{getTitle()}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-[#4a6a4a] hover:text-[#8ab88a] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="mb-3 px-3 py-2 bg-red-950/30 border border-red-900/30 rounded-[2px]">
                <p className="font-mono text-[9px] text-red-400 tracking-wide">{error}</p>
              </div>
            )}
            
            {step === "select" && (
              <div className="space-y-2">
                <button
                  onClick={() => setStep("wallet-list")}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0d140d] border border-[#1a2f1a] rounded-[2px] hover:border-[#2a4a2a] hover:bg-[#0f180f] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <SolanaWalletIcon className="w-5 h-5 rounded-[2px]" />
                    <span className="font-mono text-[10px] text-[#8ab88a]/70 group-hover:text-[#8ab88a] transition-colors tracking-[0.15em]">
                      CONNECT WALLET
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#4a6a4a] group-hover:text-[#00c853] transition-colors" />
                </button>
                
                <button
                  onClick={() => setStep("email-input")}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0d140d] border border-[#1a2f1a] rounded-[2px] hover:border-[#2a4a2a] hover:bg-[#0f180f] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center rounded-[2px] bg-[#00c853]/10 border border-[#00c853]/20">
                      <Mail className="w-2.5 h-2.5 text-[#00c853]" />
                    </div>
                    <span className="font-mono text-[10px] text-[#8ab88a]/70 group-hover:text-[#8ab88a] transition-colors tracking-[0.15em]">
                      CONTINUE WITH EMAIL
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#4a6a4a] group-hover:text-[#00c853] transition-colors" />
                </button>
                
                <p className="font-mono text-[8px] text-[#4a6a4a] text-center pt-3 tracking-[0.15em]">
                  BY CONNECTING, YOU AGREE TO OUR TERMS
                </p>
              </div>
            )}
            
            {step === "wallet-list" && (
              <div className="space-y-1.5">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleWalletSelect(wallet.adapter)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#0d140d] border border-[#1a2f1a] rounded-[2px] hover:border-[#2a4a2a] hover:bg-[#0f180f] transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <wallet.Icon className="w-5 h-5 rounded-[2px]" />
                      <span className="font-mono text-[10px] text-[#8ab88a]/70 group-hover:text-[#8ab88a] transition-colors tracking-[0.15em]">
                        {wallet.name.toUpperCase()}
                      </span>
                    </div>
                    {loading ? (
                      <Loader2 className="w-3 h-3 text-[#00c853] animate-spin" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-[#4a6a4a] group-hover:text-[#00c853] transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {step === "email-input" && (
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[8px] text-[#4a6a4a] tracking-[0.2em] mb-2 block">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-[#0d140d] border border-[#1a2f1a] rounded-[2px] font-mono text-[11px] text-[#8ab88a] placeholder:text-[#3a5a3a] focus:outline-none focus:border-[#00c853]/40 transition-colors"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleEmailSubmit}
                  disabled={!email || loading}
                  className="w-full py-2.5 bg-[#00c853] text-[#030504] font-mono text-[10px] font-medium tracking-[0.2em] rounded-[2px] hover:bg-[#00c853]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <p className="font-mono text-[9px] text-[#6a8a6a] leading-relaxed">
                  Link your email to create your social wallet
                </p>
                
                <div className="px-3 py-2 bg-[#00c853]/5 border border-[#00c853]/20 rounded-[2px]">
                  <p className="font-mono text-[9px] text-[#00c853]/70 truncate">
                    {pendingWallet}
                  </p>
                </div>
                
                <div>
                  <label className="font-mono text-[8px] text-[#4a6a4a] tracking-[0.2em] mb-2 block">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-[#0d140d] border border-[#1a2f1a] rounded-[2px] font-mono text-[11px] text-[#8ab88a] placeholder:text-[#3a5a3a] focus:outline-none focus:border-[#00c853]/40 transition-colors"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleWalletEmailSubmit}
                  disabled={!email || loading}
                  className="w-full py-2.5 bg-[#00c853] text-[#030504] font-mono text-[10px] font-medium tracking-[0.2em] rounded-[2px] hover:bg-[#00c853]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <p className="font-mono text-[9px] text-[#6a8a6a] leading-relaxed">
                  ENTER THE 6-DIGIT CODE SENT TO{" "}
                  <span className="text-[#8ab88a]">{email.toUpperCase()}</span>
                </p>
                
                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-3 bg-[#0d140d] border border-[#1a2f1a] rounded-[2px] text-sm text-[#8ab88a] text-center font-mono tracking-[0.5em] placeholder:text-[#3a5a3a] focus:outline-none focus:border-[#00c853]/40 transition-colors"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleOtpVerify}
                  disabled={otp.length !== 6 || loading}
                  className="w-full py-2.5 bg-[#00c853] text-[#030504] font-mono text-[10px] font-medium tracking-[0.2em] rounded-[2px] hover:bg-[#00c853]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#00c853]/10 border border-[#00c853]/30">
                  <Check className="w-5 h-5 text-[#00c853]" />
                </div>
                <p className="font-mono text-[10px] text-[#8ab88a]/80 tracking-[0.2em]">SUCCESSFULLY CONNECTED</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
