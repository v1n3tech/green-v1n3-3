import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { COMMUNITIES, PLATEAU_LGAS } from "@/components/onboarding/data"
import {
  Activity,
  Calendar,
  Coins,
  Hash,
  Layers,
  Mail,
  MapPin,
  Phone,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from "lucide-react"
import { ProfileWalletCard } from "@/components/profile/profile-wallet-card"
import { UsernameEditor } from "@/components/profile/username-editor"
import { ProfileAvatar } from "@/components/profile/profile-avatar"

export const metadata = {
  title: "Profile — GreenV1n3",
  description: "Your AgroV1n3 identity, network, and operational footprint.",
}

const ROLE_LABELS: Record<string, string> = {
  agro_executive: "EXECUTIVE",
  gcm: "GCM",
  lgpa: "LGPA",
  scc_member: "SCC",
  admin: "ADMIN",
  user: "EXPLORER",
}

const VERIFICATION_LABELS: Record<string, string> = {
  pending: "PENDING REVIEW",
  verified: "VERIFIED",
  rejected: "REJECTED",
}

function initialsFor(name: string) {
  const parts = name.split(/[_\s\-.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).toUpperCase()
  } catch {
    return "—"
  }
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id, email, wallet_address, display_name, first_name, last_name, phone,
      avatar_url, bio, agro_id, role, community, secondary_communities,
      state, lga, address,       weekly_rating, operational_rating, total_earnings, v1n3_balance,
      followers_count, following_count, posts_count,
      verification_status, is_active, created_at, last_active_at
      `,
    )
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  const callsign = profile.display_name ?? "ANONYMOUS"
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"
  const roleLabel = ROLE_LABELS[profile.role ?? "user"] ?? "MEMBER"
  const verificationLabel =
    VERIFICATION_LABELS[profile.verification_status ?? "pending"] ?? "—"
  const verificationOk = profile.verification_status === "verified"

  const community = COMMUNITIES.find((c) => c.key === profile.community)
  const secondaries: string[] = profile.secondary_communities ?? []
  const secondaryCommunities = secondaries
    .map((k) => COMMUNITIES.find((c) => c.key === k))
    .filter((c): c is (typeof COMMUNITIES)[number] => Boolean(c))

  const lgaLabel =
    PLATEAU_LGAS.find((l) => l === profile.lga)?.toUpperCase() ?? profile.lga?.toUpperCase() ?? "—"

  const isExecutive = profile.role === "agro_executive"

  return (
    <div className="bg-background min-h-screen">
      <Header />

      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative">
        <div className="absolute inset-0 grid-pattern pointer-events-none -z-10" />

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-primary" />
            <span className="mono-xs text-primary text-[10px] tracking-wider">
              / 02 — PROFILE
            </span>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-1.5 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-[2px] transition-colors group"
          >
            <SettingsIcon className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="mono-xs text-muted-foreground group-hover:text-foreground text-[9.5px] tracking-wider transition-colors">
              EDIT PROFILE
            </span>
          </Link>
        </div>

        {/* Identity hero */}
        <div className="mb-8 border border-border rounded-[2px] overflow-hidden">
          {/* Top status strip */}
          <div className="border-b border-border px-4 h-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-pulse" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.2em]">
                / IDENTITY CARD
              </span>
            </div>
            <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">
              {profile.is_active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6 sm:items-center">
            {/* Avatar */}
            <ProfileAvatar 
              currentAvatar={profile.avatar_url} 
              displayName={callsign} 
            />

            {/* Identity */}
            <div className="flex-1 min-w-0 space-y-3">
              <UsernameEditor initial={profile.display_name} />

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <RoleBadge label={roleLabel} accent={isExecutive} />
                <VerificationBadge
                  label={verificationLabel}
                  ok={verificationOk}
                />
                {community && (
                  <span className="mono-xs text-muted-foreground/80 text-[9.5px] tracking-wider">
                    / {community.label.toUpperCase()}
                  </span>
                )}
              </div>

              <p className="text-foreground/55 text-sm leading-relaxed max-w-xl">
                {profile.bio ?? (
                  <span className="text-muted-foreground/50 italic">
                    No bio yet. Add one in settings to introduce yourself to the network.
                  </span>
                )}
              </p>
            </div>

            {/* Joined */}
            <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 pl-4 border-l border-border">
              <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-[0.2em]">
                / JOINED
              </span>
              <span className="font-mono text-foreground/85 text-[12px] tracking-wider">
                {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat
            index="01"
            label="AGRO ID"
            value={profile.agro_id ?? "—"}
            mono
            icon={<Hash className="w-3.5 h-3.5" />}
          />
          <Stat
            index="02"
            label="POSTS"
            value={String(profile.posts_count ?? 0).padStart(2, "0")}
            mono
            icon={<Activity className="w-3.5 h-3.5" />}
          />
          <Stat
            index="03"
            label="FOLLOWERS"
            value={String(profile.followers_count ?? 0).padStart(2, "0")}
            mono
            icon={<UserIcon className="w-3.5 h-3.5" />}
          />
          <Stat
            index="04"
            label="FOLLOWING"
            value={String(profile.following_count ?? 0).padStart(2, "0")}
            mono
            icon={<UserIcon className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left column — details + location */}
          <div className="lg:col-span-2 space-y-3">
            {/* Personal */}
            <Panel
              icon={<UserIcon className="w-3 h-3 text-muted-foreground" />}
              label="/ PERSONAL"
              hint="PRIVATE"
            >
              <DetailRow
                index="01"
                icon={<UserIcon className="w-3.5 h-3.5" />}
                label="LEGAL NAME"
                value={fullName}
              />
              <DetailRow
                index="02"
                icon={<Mail className="w-3.5 h-3.5" />}
                label="EMAIL"
                value={profile.email ?? "—"}
                lower
              />
              <DetailRow
                index="03"
                icon={<Phone className="w-3.5 h-3.5" />}
                label="PHONE"
                value={profile.phone ?? "—"}
              />
              <DetailRow
                index="04"
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="LAST ACTIVE"
                value={formatDate(profile.last_active_at)}
              />
            </Panel>

            {/* Location */}
            <Panel
              icon={<MapPin className="w-3 h-3 text-muted-foreground" />}
              label="/ LOCATION"
              hint={`STATE / ${(profile.state ?? "PLATEAU").toUpperCase()}`}
            >
              <DetailRow
                index="01"
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="LOCAL GOVERNMENT"
                value={lgaLabel}
              />
              <DetailRow
                index="02"
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="ADDRESS"
                value={profile.address ?? "—"}
              />
            </Panel>

            {/* Network — only shown for executives with assigned communities */}
            {isExecutive && (
              <Panel
                icon={<Layers className="w-3 h-3 text-muted-foreground" />}
                label="/ NETWORK"
                hint="VALUE CHAIN"
              >
                <DetailRow
                  index="01"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label="PRIMARY COMMUNITY"
                  value={community?.label.toUpperCase() ?? "—"}
                  accent
                />
                {secondaryCommunities.length > 0 && (
                  <div className="px-4 py-3.5 flex items-start gap-3 border-b border-border last:border-b-0">
                    <span className="mono-xs text-muted-foreground/50 text-[9px] w-5 pt-0.5">
                      02
                    </span>
                    <Layers className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-2">
                        / SECONDARY INTERESTS
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {secondaryCommunities.map((c) => (
                          <span
                            key={c.key}
                            className="px-2 py-1 border border-border hover:border-primary/40 rounded-[2px] mono-xs text-foreground/80 text-[9px] tracking-wider transition-colors"
                          >
                            {c.label.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            )}
          </div>

          {/* Right column — V1n3 balance + wallet + ratings */}
          <div className="lg:col-span-1 space-y-3">
            <V1n3BalancePanel
              balance={Number(profile.v1n3_balance ?? 0)}
              earnings={Number(profile.total_earnings ?? 0)}
            />

            <ProfileWalletCard walletAddress={profile.wallet_address} />

            {/* Ratings */}
            <Panel
              icon={<Activity className="w-3 h-3 text-muted-foreground" />}
              label="/ RATINGS"
              hint="WEEKLY"
            >
              <RatingRow
                index="01"
                label="WEEKLY RATING"
                value={Number(profile.weekly_rating ?? 0)}
              />
              <RatingRow
                index="02"
                label="OPERATIONAL"
                value={Number(profile.operational_rating ?? 0)}
              />
              <div className="px-4 py-3.5 flex items-center justify-between border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
                    03
                  </span>
                  <span className="mono-xs text-muted-foreground text-[9.5px] tracking-[0.18em]">
                    / TOTAL EARNINGS
                  </span>
                </div>
                <span className="font-mono text-foreground text-[12px] tracking-wider">
                  N{Number(profile.total_earnings ?? 0).toLocaleString()}
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RoleBadge({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`px-2 py-1 border rounded-[2px] mono-xs text-[9px] tracking-wider ${
        accent
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border text-foreground/80"
      }`}
    >
      / {label}
    </span>
  )
}

function VerificationBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 px-2 py-1 border rounded-[2px] mono-xs text-[9px] tracking-wider ${
        ok
          ? "border-primary/40 text-primary"
          : "border-accent/40 text-accent"
      }`}
    >
      <ShieldCheck className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

function Stat({
  index,
  label,
  value,
  icon,
  mono,
}: {
  index: string
  label: string
  value: string
  icon: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="border border-border rounded-[2px] p-3.5">
      <div className="flex items-center justify-between mb-3">
        <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">
          {index}
        </span>
        <span className="text-primary/70">{icon}</span>
      </div>
      <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-1.5">
        / {label}
      </p>
      <p
        className={`text-foreground tracking-wider truncate ${
          mono ? "font-mono text-[13px]" : "mono-sm text-[12px]"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Panel({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-border rounded-[2px] overflow-hidden">
      <div className="border-b border-border px-4 h-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.2em]">
            {label}
          </span>
        </div>
        {hint && (
          <span className="mono-xs text-muted-foreground/50 text-[9px] tracking-wider">
            {hint}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

function DetailRow({
  index,
  icon,
  label,
  value,
  accent,
  lower,
}: {
  index: string
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
  lower?: boolean
}) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3">
      <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
        {index}
      </span>
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <span className="mono-xs text-muted-foreground text-[9.5px] tracking-[0.18em]">
          / {label}
        </span>
        <span
          className={`font-mono text-[11.5px] tracking-wide truncate text-right ${
            accent ? "text-primary" : "text-foreground/85"
          } ${lower ? "normal-case" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function V1n3BalancePanel({
  balance,
  earnings,
}: {
  balance: number
  earnings: number
}) {
  const formattedBalance = balance.toLocaleString(undefined, {
    minimumFractionDigits: balance < 1 ? 4 : 2,
    maximumFractionDigits: 4,
  })

  return (
    <div className="border border-border rounded-[2px] overflow-hidden">
      <div className="border-b border-border px-4 h-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-3 h-3 text-primary" />
          <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.2em]">
            / V1N3 BALANCE
          </span>
        </div>
        <span className="mono-xs text-primary text-[9px] tracking-wider">
          TOKEN
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="mono-xs text-muted-foreground/70 text-[9px] mb-2 tracking-[0.2em]">
            / AVAILABLE
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl text-foreground tracking-tight">
              {formattedBalance}
            </span>
            <span className="mono-xs text-primary/80 text-[10px] tracking-[0.2em]">
              V1N3
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em] truncate">
              / EARNINGS
            </span>
          </div>
          <span className="font-mono text-foreground/85 text-[12px] tracking-wider whitespace-nowrap">
            N{earnings.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

function RatingRow({
  index,
  label,
  value,
}: {
  index: string
  label: string
  value: number
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
            {index}
          </span>
          <span className="mono-xs text-muted-foreground text-[9.5px] tracking-[0.18em]">
            / {label}
          </span>
        </div>
        <span className="font-mono text-primary text-[12px] tracking-wider">
          {pct.toFixed(1)}
        </span>
      </div>
      <div className="ml-8 h-[3px] bg-border rounded-[2px] overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
