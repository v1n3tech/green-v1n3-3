"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  UserPlus,
  Loader2,
  Search,
  Download,
  KeyRound,
  Copy,
  Check,
  X,
  ShieldAlert,
  Wallet,
  Eye,
} from "lucide-react"
import { provisionAccount, revealAccountCredentials } from "@/lib/admin/provisioning"
import {
  AGRO_COMMUNITIES,
  PROVISIONABLE_ROLES,
  type AgroCommunity,
  type ProvisionRole,
  type ProvisionedAccount,
  type CredentialPackage,
} from "@/lib/admin/provisioning-types"
import { downloadCredentialPdf } from "@/lib/admin/credential-pdf"

const ROLE_LABELS: Record<ProvisionRole, string> = {
  agro_executive: "Agro Executive",
  gcm: "General Community Manager",
  lgpa: "LGPA",
  scc_member: "SCC Member",
  admin: "Administrator",
}

function humanize(value: string | null): string {
  if (!value) return "—"
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

const inputCls =
  "w-full rounded-[2px] border border-border bg-background px-2.5 py-2 text-[11px] text-foreground outline-none transition-colors focus:border-primary/50 placeholder:text-muted-foreground/50"
const labelCls = "mono-xs text-[9px] tracking-[0.16em] text-muted-foreground"

interface Props {
  initialAccounts: ProvisionedAccount[]
}

export function OrganizationConsole({ initialAccounts }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<CredentialPackage | null>(null)
  const [query, setQuery] = useState("")
  const [revealingId, setRevealingId] = useState<string | null>(null)

  // form state
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [lga, setLga] = useState("")
  const [role, setRole] = useState<ProvisionRole>("agro_executive")
  const [community, setCommunity] = useState<AgroCommunity | "">("agro_marketing")
  const [secondary, setSecondary] = useState<AgroCommunity[]>([])

  const accounts = initialAccounts.filter((a) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      (a.display_name ?? "").toLowerCase().includes(q) ||
      (a.email ?? "").toLowerCase().includes(q) ||
      (a.agro_id ?? "").toLowerCase().includes(q)
    )
  })

  function resetForm() {
    setEmail("")
    setFirstName("")
    setLastName("")
    setPhone("")
    setLga("")
    setRole("agro_executive")
    setCommunity("agro_marketing")
    setSecondary([])
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await provisionAccount({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        lga: lga || undefined,
        role,
        community: community || null,
        secondaryCommunities: secondary,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      if (res.credentials) {
        setCredentials(res.credentials)
        resetForm()
        router.refresh()
      }
    })
  }

  function reveal(userId: string) {
    setRevealingId(userId)
    setError(null)
    startTransition(async () => {
      const res = await revealAccountCredentials(userId)
      setRevealingId(null)
      if (res.error) setError(res.error)
      else if (res.credentials) setCredentials(res.credentials)
    })
  }

  function toggleSecondary(c: AgroCommunity) {
    setSecondary((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {error && (
        <p className="lg:col-span-5 rounded-[2px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          {error}
        </p>
      )}

      {/* Creation form */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-3.5 w-3.5 text-primary" />
          <h2 className="mono-sm text-xs text-muted-foreground">Create Account</h2>
        </div>
        <form
          onSubmit={submit}
          className="space-y-3.5 rounded-[2px] border border-border bg-secondary/20 p-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>FIRST NAME</label>
              <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>LAST NAME</label>
              <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>EMAIL</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exec@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>PHONE</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>LGA</label>
              <input className={inputCls} value={lga} onChange={(e) => setLga(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>ROLE</label>
            <select
              className={inputCls}
              value={role}
              onChange={(e) => setRole(e.target.value as ProvisionRole)}
            >
              {PROVISIONABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>
              PRIMARY COMMUNITY{role === "agro_executive" ? " *" : " (optional)"}
            </label>
            <select
              className={inputCls}
              value={community}
              onChange={(e) => setCommunity(e.target.value as AgroCommunity | "")}
            >
              <option value="">— None —</option>
              {AGRO_COMMUNITIES.map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>SECONDARY COMMUNITIES</label>
            <div className="flex flex-wrap gap-1.5">
              {AGRO_COMMUNITIES.filter((c) => c !== community).map((c) => {
                const active = secondary.includes(c)
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleSecondary(c)}
                    className={`rounded-[2px] border px-2 py-1 text-[9px] transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {humanize(c)}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-primary px-3 py-2.5 text-[10px] font-medium tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending && !revealingId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            CREATE & GENERATE PACKAGE
          </button>
          <p className="mono-xs text-[9px] leading-relaxed text-muted-foreground">
            Generates an account, allocates role + community, mints a custodial wallet and produces a
            downloadable PDF with email, crypto address and seed phrase.
          </p>
        </form>
      </div>

      {/* Provisioned accounts list */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <h2 className="mono-sm text-xs text-muted-foreground">
              Provisioned Accounts — {initialAccounts.length}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[2px] border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or Agro ID..."
            className="mono-xs flex-1 bg-transparent text-[10px] text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {accounts.length === 0 ? (
          <p className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-3 py-8 text-center mono-xs text-[10px] text-muted-foreground">
            {initialAccounts.length === 0
              ? "No accounts provisioned yet. Create one to get started."
              : "No matching accounts."}
          </p>
        ) : (
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-[2px] border border-border bg-secondary/20 p-3 transition-colors hover:border-primary/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-foreground">{a.display_name ?? "Unnamed"}</p>
                  <p className="mono-xs truncate text-[9px] text-muted-foreground">
                    {a.agro_id ?? "—"} · {ROLE_LABELS[a.role] ?? humanize(a.role)}
                    {a.community ? ` · ${humanize(a.community)}` : ""}
                  </p>
                  <p className="mono-xs truncate text-[9px] text-muted-foreground/70">{a.email}</p>
                </div>
                <button
                  onClick={() => reveal(a.id)}
                  disabled={pending && revealingId === a.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-primary/30 px-2.5 py-1.5 text-[9px] text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  {pending && revealingId === a.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  CREDENTIALS
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {credentials && (
        <CredentialModal pkg={credentials} onClose={() => setCredentials(null)} />
      )}
    </div>
  )
}

function CredentialModal({ pkg, onClose }: { pkg: CredentialPackage; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(key: string, value: string) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const rows: { key: string; label: string; value: string; mono?: boolean }[] = [
    { key: "email", label: "Login Email", value: pkg.email, mono: true },
    { key: "agro", label: "Agro ID", value: pkg.agroId ?? "—", mono: true },
    { key: "addr", label: "Crypto Address", value: pkg.walletAddress, mono: true },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col rounded-[3px] border border-primary/30 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h3 className="mono-sm text-xs text-foreground">Credential Package</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-[12px] text-foreground">{pkg.displayName}</p>

        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.key} className="space-y-1">
              <p className={labelCls}>{r.label.toUpperCase()}</p>
              <div className="flex items-center gap-2 rounded-[2px] border border-border bg-background px-2.5 py-1.5">
                <span className={`min-w-0 flex-1 truncate text-[11px] text-foreground ${r.mono ? "font-mono" : ""}`}>
                  {r.value}
                </span>
                <button
                  onClick={() => copy(r.key, r.value)}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  {copied === r.key ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}

          {pkg.seedPhrase && (
            <div className="space-y-1">
              <p className={labelCls}>RECOVERY SEED PHRASE</p>
              <div className="rounded-[2px] border border-primary/30 bg-primary/5 p-2.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {pkg.seedPhrase.split(/\s+/).map((word, i) => (
                    <span key={i} className="font-mono text-[10px] text-foreground">
                      <span className="text-primary/60">{String(i + 1).padStart(2, "0")}</span> {word}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => copy("seed", pkg.seedPhrase ?? "")}
                  className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground hover:text-primary"
                >
                  {copied === "seed" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  COPY PHRASE
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-[2px] border border-accent/30 bg-accent/5 p-2.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="mono-xs text-[9px] leading-relaxed text-muted-foreground">
              Anyone with the seed phrase controls this wallet. Hand the PDF over securely and store it offline.
            </p>
          </div>
        </div>

        <div className="border-t border-border p-5 pt-3">
          <button
            onClick={() => downloadCredentialPdf(pkg)}
            className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-primary px-3 py-2.5 text-[10px] font-medium tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" />
            DOWNLOAD PDF PACKAGE
          </button>
        </div>
      </div>
    </div>
  )
}
