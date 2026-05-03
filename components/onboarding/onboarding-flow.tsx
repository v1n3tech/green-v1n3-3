"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Sprout,
  User,
  MapPin,
  Layers,
  ClipboardCheck,
} from "lucide-react"
import { completeOnboarding } from "@/lib/auth/actions"
import {
  COMMUNITIES,
  PLATEAU_LGAS,
  type AgroCommunityKey,
} from "@/components/onboarding/data"

type Role = "user" | "agro_executive"

interface FormState {
  firstName: string
  lastName: string
  phone: string
  lga: string
  community: AgroCommunityKey | null
  secondaryCommunities: AgroCommunityKey[]
  bio: string
}

interface OnboardingFlowProps {
  email: string | null
  callsign: string | null
  walletAddress: string | null
  /**
   * True when no other user has completed onboarding yet. The first user is
   * automatically promoted to 'agro_executive' (founding executive) and is
   * the only one shown the COMMUNITY step. All subsequent users are forced
   * to 'user' role and admin promotes them later.
   */
  isFirstUser: boolean
  defaults: {
    firstName: string
    lastName: string
    phone: string
    lga: string
    community: string | null
    secondaryCommunities: string[]
    bio: string
  }
}

// Step ids in canonical order. COMMUNITY is only included for the founding
// Agro Executive (the very first user to sign up); see `visibleSteps` below.
type StepId = "identity" | "location" | "community" | "confirm"

const STEP_META: Record<
  StepId,
  { label: string; title: string; icon: React.ReactNode }
> = {
  identity:  { label: "/ IDENTITY",  title: "Tell us who you are.",     icon: <User className="w-3.5 h-3.5" /> },
  location:  { label: "/ LOCATION",  title: "Where do you operate?",     icon: <MapPin className="w-3.5 h-3.5" /> },
  community: { label: "/ COMMUNITY", title: "Pick your value chain.",    icon: <Layers className="w-3.5 h-3.5" /> },
  confirm:   { label: "/ CONFIRM",   title: "Review and forge identity.", icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
}

export function OnboardingFlow({
  email,
  callsign,
  walletAddress,
  isFirstUser,
  defaults,
}: OnboardingFlowProps) {
  // Role is no longer self-selected: it's deterministic from `isFirstUser`.
  // The server-side complete_onboarding RPC double-checks this under an
  // advisory lock, so the client value is purely UX.
  const role: Role = isFirstUser ? "agro_executive" : "user"

  const [form, setForm] = useState<FormState>({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    phone: defaults.phone,
    lga: defaults.lga,
    community: (defaults.community as AgroCommunityKey | null) ?? null,
    secondaryCommunities:
      (defaults.secondaryCommunities as AgroCommunityKey[]) ?? [],
    bio: defaults.bio,
  })

  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [agroId, setAgroId] = useState<string | null>(null)

  // Only the founding Agro Executive picks a value chain on signup.
  const visibleSteps: StepId[] = useMemo(() => {
    return isFirstUser
      ? ["identity", "location", "community", "confirm"]
      : ["identity", "location", "confirm"]
  }, [isFirstUser])

  const currentStep = visibleSteps[stepIndex]
  const totalSteps = visibleSteps.length

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }))

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case "identity":
        return (
          form.firstName.trim().length > 0 &&
          form.lastName.trim().length > 0 &&
          form.phone.trim().length >= 7
        )
      case "location":
        return form.lga.trim().length > 0
      case "community":
        return form.community !== null
      case "confirm":
        return true
    }
  }

  const next = () => {
    if (!canAdvance()) return
    setError(null)
    if (stepIndex < totalSteps - 1) setStepIndex((i) => i + 1)
  }

  const back = () => {
    if (stepIndex === 0) return
    setError(null)
    setStepIndex((i) => i - 1)
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)

    const result = await completeOnboarding({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      lga: form.lga,
      role, // server-side RPC re-validates and may override based on race
      community: isFirstUser ? form.community : null,
      secondaryCommunities: isFirstUser ? form.secondaryCommunities : [],
      bio: form.bio || null,
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    if (result.profile?.agro_id) {
      setAgroId(result.profile.agro_id)
    }
    setDone(true)
    setSubmitting(false)

    // Hard-navigate so middleware re-runs against the freshly persisted
    // session/profile row. router.push + refresh races the cookie write and
    // can leave the user stranded on /onboarding with a blank page.
    setTimeout(() => {
      window.location.assign("/dashboard")
    }, 2200)
  }

  // ---------- success / done state ----------
  if (done) {
    return (
      <Shell stepIndex={totalSteps - 1} totalSteps={totalSteps} label="/ INITIATED">
        <div className="py-4 space-y-5">
          <div className="flex flex-col items-center gap-3 pb-1">
            <div className="w-14 h-14 flex items-center justify-center rounded-[2px] bg-primary/10 border border-primary/40">
              <Check className="w-6 h-6 text-primary" strokeWidth={2} />
            </div>
            <div className="text-center space-y-1">
              <p className="mono-xs text-primary/80 text-[9px] tracking-[0.25em]">
                / IDENTITY FORGED
              </p>
              <p className="mono-sm text-foreground text-[12px] tracking-wider">
                WELCOME TO THE FIELD
              </p>
            </div>
          </div>

          {callsign && (
            <SummaryCard label="/ CALLSIGN">
              <p className="font-mono text-[13px] text-primary tracking-[0.2em] font-medium">
                {callsign}
              </p>
            </SummaryCard>
          )}

          {agroId && (
            <SummaryCard label="/ AGRO ID">
              <p className="font-mono text-[13px] text-foreground tracking-[0.2em]">
                {agroId}
              </p>
            </SummaryCard>
          )}

          <div className="pt-2 flex flex-col items-center gap-2.5">
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-[2px] mono-xs hover:bg-primary/90 transition-colors text-[10.5px] tracking-wider"
            >
              ENTER DASHBOARD
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <p className="mono-xs text-muted-foreground/55 text-center text-[9px] tracking-wider">
              / AUTO-ROUTING IN A MOMENT
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  // ---------- main wizard ----------
  return (
    <Shell
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      label={STEP_META[currentStep].label}
      onBack={stepIndex > 0 ? back : undefined}
    >
      {/* Identity strip — small persistent sub-header showing who is onboarding */}
      <IdentityStrip email={email} callsign={callsign} walletAddress={walletAddress} />

      {/* Step indicator */}
      <StepIndicator steps={visibleSteps} active={stepIndex} />

      {/* Step title */}
      <div className="px-1 pt-5 pb-4">
        <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-1.5">
          STEP {String(stepIndex + 1).padStart(2, "0")} OF {String(totalSteps).padStart(2, "0")}
        </p>
        <h2 className="font-mono text-foreground text-[20px] sm:text-[22px] leading-tight tracking-tight text-balance">
          {STEP_META[currentStep].title}
        </h2>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-[2px]">
          <p className="mono-xs text-destructive text-[9.5px]">{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {currentStep === "identity" && (
              <StepIdentity form={form} update={update} />
            )}
            {currentStep === "location" && (
              <StepLocation form={form} update={update} />
            )}
            {currentStep === "community" && (
              <StepCommunity form={form} update={update} />
            )}
            {currentStep === "confirm" && (
              <StepConfirm form={form} role={role} isFirstUser={isFirstUser} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action bar */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={stepIndex === 0 || submitting}
          className="flex items-center gap-2 px-3 py-2.5 mono-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[10px] tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK
        </button>

        {currentStep !== "confirm" ? (
          <button
            onClick={next}
            disabled={!canAdvance() || submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-[2px] mono-xs hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[10.5px] tracking-wider"
          >
            CONTINUE
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-[2px] mono-xs hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[10.5px] tracking-wider"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                FORGING
              </>
            ) : (
              <>
                FORGE IDENTITY
                <Sparkles className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </Shell>
  )
}

/* =========================================================================
 * Shell — the framed terminal panel that wraps every step
 * ========================================================================= */
function Shell({
  children,
  stepIndex,
  totalSteps,
  label,
  onBack,
}: {
  children: React.ReactNode
  stepIndex: number
  totalSteps: number
  label: string
  onBack?: () => void
}) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-24 sm:py-28">
      {/* subtle grid */}
      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[560px]"
      >
              <div className="relative bg-background border border-border rounded-[2px] overflow-hidden">
                {/* Status bar — top */}
                <div className="border-b border-border">
            <div className="flex items-center justify-between px-4 h-8">
              <div className="flex items-center gap-2.5">
                <span className="status-dot status-dot-pulse" />
                <span className="mono-xs text-muted-foreground text-[9px]">
                  ONBOARDING
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="mono-xs text-muted-foreground/70 text-[9px]">
                  {String(stepIndex + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-1 h-4 bg-primary" />
            <span className="mono-xs text-primary tracking-wider text-[10.5px]">
              {label}
            </span>
          </div>

          {/* body */}
          <div className="relative p-5 sm:p-6">{children}</div>

          {/* footer marker */}
                <div className="border-t border-border px-4 h-6 flex items-center justify-between">
            <span className="mono-xs text-muted-foreground/50 text-[8.5px] tracking-[0.2em]">
              GREENV1N3 / ONBOARDING
            </span>
            <span className="mono-xs text-muted-foreground/50 text-[8.5px] tracking-[0.2em]">
              V1.0
            </span>
          </div>
        </div>
      </motion.div>
    </main>
  )
}

/* =========================================================================
 * IdentityStrip — fixed sub-header showing the user's session identity
 * ========================================================================= */
function IdentityStrip({
  email,
  callsign,
  walletAddress,
}: {
  email: string | null
  callsign: string | null
  walletAddress: string | null
}) {
  return (
    <div className="grid grid-cols-3 gap-px bg-border rounded-[2px] overflow-hidden mb-4">
      <IdentityCell label="/ CALLSIGN" value={callsign ?? "—"} highlight />
      <IdentityCell
        label="/ EMAIL"
        value={email ? email.split("@")[0].toUpperCase() : "—"}
      />
      <IdentityCell
        label="/ WALLET"
        value={
          walletAddress
            ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
            : "—"
        }
      />
    </div>
  )
}

function IdentityCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
                        <div className="bg-input px-3 py-2 border-b border-border">
      <p className="mono-xs text-muted-foreground/60 text-[8.5px] mb-1 tracking-[0.15em]">
        {label}
      </p>
      <p
        className={`font-mono text-[10px] truncate tracking-[0.15em] ${
          highlight ? "text-primary" : "text-foreground/85"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

/* =========================================================================
 * StepIndicator — horizontal segments showing wizard progress
 * ========================================================================= */
function StepIndicator({ steps, active }: { steps: StepId[]; active: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((id, idx) => {
        const state = idx < active ? "done" : idx === active ? "active" : "pending"
        return (
          <div key={id} className="flex-1">
            <div
              className={`h-[3px] rounded-[2px] transition-colors ${
                state === "active"
                  ? "bg-primary"
                  : state === "done"
                    ? "bg-primary/50"
                    : "bg-border"
              }`}
            />
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className={`mono-xs text-[8px] tracking-[0.18em] ${
                  state === "pending" ? "text-muted-foreground/40" : "text-muted-foreground/80"
                }`}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span
                className={`mono-xs text-[8px] tracking-[0.18em] hidden sm:inline ${
                  state === "active"
                    ? "text-primary"
                    : state === "done"
                      ? "text-foreground/70"
                      : "text-muted-foreground/40"
                }`}
              >
                {STEP_META[id].label.replace("/ ", "")}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* =========================================================================
 * Step components
 * ========================================================================= */
function StepIdentity({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="/ FIRST NAME">
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Amina"
            className="onboard-input"
            autoFocus
          />
        </Field>
        <Field label="/ LAST NAME">
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Yusuf"
            className="onboard-input"
          />
        </Field>
      </div>

      <Field label="/ PHONE">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+234 800 000 0000"
          className="onboard-input"
        />
      </Field>

      <Field label="/ BIO" hint="OPTIONAL">
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Tell the network what you bring to the field…"
          rows={3}
          className="onboard-input resize-none"
        />
      </Field>
    </div>
  )
}

function StepLocation({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="/ STATE" hint="LOCKED">
        <div className="onboard-input flex items-center justify-between cursor-not-allowed opacity-90">
          <span className="text-foreground/90">PLATEAU</span>
          <span className="mono-xs text-primary/70 text-[9px] tracking-wider">
            PHASE 01
          </span>
        </div>
      </Field>

      <Field label="/ LOCAL GOVERNMENT AREA">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {PLATEAU_LGAS.map((lga) => {
            const active = form.lga === lga
            return (
              <button
                key={lga}
                type="button"
                onClick={() => update("lga", lga)}
                className={`px-3 py-2 rounded-[2px] border text-left transition-colors ${
                  active
                    ? "bg-primary/10 border-primary/60 text-foreground"
                    : "bg-input/50 border-border hover:border-primary/40 hover:bg-primary/5 text-foreground/75"
                }`}
              >
                <span className="mono-xs text-[10px] tracking-wider">
                  {lga.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </Field>
    </div>
  )
}

function StepCommunity({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const toggleSecondary = (key: AgroCommunityKey) => {
    if (form.community === key) return // can't double up on primary
    const set = new Set(form.secondaryCommunities)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    update("secondaryCommunities", Array.from(set) as AgroCommunityKey[])
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em] mb-2.5">
          / PRIMARY COMMUNITY — REQUIRED
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {COMMUNITIES.map(({ key, label, hint }) => {
            const active = form.community === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  update("community", key)
                  // remove from secondary if it was there
                  update(
                    "secondaryCommunities",
                    form.secondaryCommunities.filter((k) => k !== key),
                  )
                }}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-[2px] border transition-colors text-left ${
                  active
                    ? "bg-primary/10 border-primary/60"
                    : "bg-input/50 border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sprout
                    className={`w-3 h-3 shrink-0 ${active ? "text-primary" : "text-muted-foreground/60"}`}
                  />
                  <span className="mono-xs text-[9.5px] tracking-wider truncate text-foreground/85">
                    {label}
                  </span>
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[8px] tracking-wider shrink-0">
                  {hint}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em] mb-2.5">
          / SECONDARY INTERESTS — OPTIONAL
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMUNITIES.filter((c) => c.key !== form.community).map(
            ({ key, label }) => {
              const active = form.secondaryCommunities.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSecondary(key)}
                  className={`px-2.5 py-1.5 rounded-[2px] border transition-colors mono-xs text-[9px] tracking-wider ${
                    active
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-input/40 border-border hover:border-primary/30 text-foreground/65"
                  }`}
                >
                  {label}
                </button>
              )
            },
          )}
        </div>
      </div>
    </div>
  )
}

function StepConfirm({
  form,
  role,
  isFirstUser,
}: {
  form: FormState
  role: Role
  isFirstUser: boolean
}) {
  const community = COMMUNITIES.find((c) => c.key === form.community)
  const secondaryLabels = form.secondaryCommunities
    .map((k) => COMMUNITIES.find((c) => c.key === k)?.label)
    .filter(Boolean) as string[]

  const roleValue =
    role === "agro_executive" ? "AGRO EXECUTIVE" : "REGULAR USER"
  const roleSecondary = isFirstUser ? "FOUNDING / AUTO-ASSIGNED" : "DEFAULT"

  return (
    <div className="space-y-2">
      <SummaryRow
        index="01"
        label="IDENTITY"
        value={
          form.firstName || form.lastName
            ? `${form.firstName} ${form.lastName}`.trim().toUpperCase()
            : "—"
        }
        secondary={form.phone}
      />
      <SummaryRow
        index="02"
        label="LOCATION"
        value={`PLATEAU / ${form.lga.toUpperCase()}`}
      />
      <SummaryRow
        index="03"
        label="ROLE"
        value={roleValue}
        secondary={roleSecondary}
      />
      {role === "agro_executive" && (
        <SummaryRow
          index="04"
          label="COMMUNITY"
          value={community?.label ?? "—"}
          secondary={
            secondaryLabels.length > 0
              ? `+${secondaryLabels.length} SECONDARY`
              : undefined
          }
        />
      )}
      {form.bio && (
        <div className="px-3 py-2.5 bg-secondary border border-border rounded-[2px]">
          <p className="mono-xs text-muted-foreground/70 text-[8.5px] tracking-[0.18em] mb-1">
            / BIO
          </p>
          <p className="text-[11.5px] text-foreground/80 leading-relaxed">
            {form.bio}
          </p>
        </div>
      )}

      <div className="mt-3 px-3 py-2.5 bg-primary/5 border border-primary/30 rounded-[2px] flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="mono-xs text-foreground/85 text-[9.5px] tracking-wider leading-relaxed">
          A UNIQUE AGRO ID WILL BE FORGED ON SUBMIT.
        </p>
      </div>
    </div>
  )
}

/* =========================================================================
 * Atoms
 * ========================================================================= */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">
          {label}
        </span>
        {hint && (
          <span className="mono-xs text-muted-foreground/50 text-[8.5px] tracking-wider">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  )
}

function SummaryRow({
  index,
  label,
  value,
  secondary,
}: {
  index: string
  label: string
  value: string
  secondary?: string
}) {
  return (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-input border border-border rounded-[2px]">
      <div className="flex items-center gap-3 min-w-0">
        <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider w-5">
          {index}
        </span>
        <span className="mono-xs text-muted-foreground/80 text-[9px] tracking-[0.18em] w-[78px] shrink-0">
          / {label}
        </span>
        <span className="mono-sm text-foreground text-[11px] tracking-wider truncate">
          {value}
        </span>
      </div>
      {secondary && (
        <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider shrink-0 hidden sm:inline">
          {secondary}
        </span>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="px-3.5 py-3 bg-secondary border border-border rounded-[2px]">
      <span className="mono-xs text-muted-foreground/70 text-[9px] block mb-1.5 tracking-[0.18em]">
        {label}
      </span>
      {children}
    </div>
  )
}
