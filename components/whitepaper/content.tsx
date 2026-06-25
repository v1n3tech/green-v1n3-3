import type { ReactNode } from 'react'

export interface WhitepaperSection {
  /** Two-digit index used in the "/ 0X" rail label. */
  id: string
  /** URL hash + scroll target. */
  slug: string
  /** Section title. */
  title: string
  /** Rendered body. */
  body: ReactNode
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers — all themed via design tokens.        */
/* ------------------------------------------------------------------ */

function P({ children }: { children: ReactNode }) {
  return <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/70">{children}</p>
}

function Lead({ children }: { children: ReactNode }) {
  return <p className="text-sm sm:text-base leading-relaxed text-foreground/85">{children}</p>
}

function Strong({ children }: { children: ReactNode }) {
  return <span className="text-foreground font-medium">{children}</span>
}

function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3 className="mono-sm text-foreground text-xs sm:text-sm tracking-wide mt-7 mb-3 flex items-center gap-2">
      <span className="w-1 h-3.5 bg-primary/70" />
      {children}
    </h3>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/70">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-2.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/70">
          <span className="mono-xs mt-0.5 shrink-0 text-primary">{String(i + 1).padStart(2, '0')}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* The fourteen communities.                                           */
/* ------------------------------------------------------------------ */

const communities: { name: string; desc: string }[] = [
  { name: 'Crop Farming', desc: 'Field cultivation and primary production.' },
  { name: 'Animal Farming', desc: 'Livestock and animal husbandry.' },
  { name: 'Agro Marketing', desc: 'Trade, distribution, and marketplace fulfilment operations.' },
  { name: 'Agro Processing', desc: 'Value addition and transformation of raw produce.' },
  { name: 'Agro Management & Legislation', desc: 'Policy, compliance, and organisational management.' },
  { name: 'Agro Tourism', desc: 'Agricultural tourism and experiences.' },
  { name: 'Agro Technology', desc: 'The technology stack serving the value chain.' },
  { name: 'Agro Healthcare', desc: 'Health and care services within the community.' },
  { name: 'Agro Media & Branding', desc: 'Media, content, and the voice of the program.' },
  { name: 'Agro Security', desc: 'Safeguarding people, produce, and operations.' },
  { name: 'Agro Literature', desc: 'Documentation, written culture, and knowledge.' },
  { name: 'Agro Motivation & Training', desc: 'Teaching, capacity-building, and motivation.' },
  { name: 'Green Real Estate', desc: 'Agricultural land and property.' },
  { name: 'Agro Logistics', desc: 'The movement of goods that powers delivery.' },
]

function CommunityGrid() {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {communities.map((c, i) => (
        <div
          key={c.name}
          className="flex items-start gap-3 rounded-[2px] border border-border bg-card/30 p-3 card-hover"
        >
          <span className="mono-xs text-muted-foreground/70 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
          <div className="min-w-0">
            <div className="mono-xs text-foreground text-[11px]">{c.name}</div>
            <div className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Governance tiers.                                                   */
/* ------------------------------------------------------------------ */

const tiers: { tier: string; name: string; desc: string }[] = [
  {
    tier: 'TIER 00',
    name: 'Agro Executives',
    desc: 'The young people who register, participate, and benefit. Each selects a primary community, receives a unique Agro ID, and operates in one or more links of the value chain — as producers, sellers, buyers, couriers, and service providers.',
  },
  {
    tier: 'TIER 01',
    name: 'Green V1N3 Community Managers (GCM)',
    desc: 'Lead each community in each locality. GCMs receive and negotiate service requests, allocate work through the assignment engine, manage pickup terminals and logistics, and confirm completion of work and deliveries.',
  },
  {
    tier: 'TIER 02',
    name: 'Local Government Program Administrators (LGPA)',
    desc: 'Youth delegates — one cohort per LGA — who mobilise and manage participants, appoint GCMs, and administer the communities operating in their local government.',
  },
  {
    tier: 'TIER 03',
    name: 'LGPA Forum',
    desc: 'A standing assembly of all LGPAs across the seventeen local governments, chaired by an elected chairperson. It is the program’s appraisal and evaluation body.',
  },
  {
    tier: 'TIER 04',
    name: 'State Coordinating Council (SCC)',
    desc: 'The central body overseeing all activity across the state and beyond. The SCC sets policy, approves program-wide configuration, and stewards the V1N3 treasury.',
  },
]

function GovernanceLadder() {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {tiers.map((t) => (
        <div key={t.tier} className="rounded-[2px] border border-border bg-card/30 p-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="mono-xs text-primary">{t.tier}</span>
            <span className="h-px flex-1 bg-border" />
            <span className="mono-sm text-foreground text-[11px] sm:text-xs">{t.name}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/65">{t.desc}</p>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Token spec table.                                                   */
/* ------------------------------------------------------------------ */

const tokenSpec: { k: string; v: string }[] = [
  { k: 'Token name', v: 'V1n3' },
  { k: 'Symbol', v: 'V1N3' },
  { k: 'Standard', v: 'Token-2022 (SPL)' },
  { k: 'Decimals', v: '9' },
  { k: 'Total supply', v: '4,000,000,000 (fixed)' },
  { k: 'Mint authority', v: 'Revoked' },
  { k: 'Network', v: 'Solana Mainnet' },
]

function TokenSpecTable() {
  return (
    <div className="mt-3 overflow-hidden rounded-[2px] border border-border">
      {tokenSpec.map((row, i) => (
        <div
          key={row.k}
          className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
            i % 2 === 0 ? 'bg-card/30' : 'bg-background/40'
          }`}
        >
          <span className="text-[13px] text-muted-foreground">{row.k}</span>
          <span className="mono-xs text-foreground text-[11px]">{row.v}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section content.                                                    */
/* ------------------------------------------------------------------ */

export const sections: WhitepaperSection[] = [
  {
    id: '01',
    slug: 'abstract',
    title: 'Abstract',
    body: (
      <div className="flex flex-col gap-4">
        <Lead>
          Green V1N3 Nigeria is a multifunctional digital platform built to mobilise, coordinate,
          and reward youth participation across the agriculture value chain. It is the operating
          system for the <Strong>AgroV1n3 program</Strong> — a structured initiative that aims to
          translate a collective dream of a better Nigeria into measurable economic outcomes,
          beginning with an estimated ten thousand young people across the seventeen Local
          Government Areas of Plateau State in its first phase.
        </Lead>
        <P>
          The platform organises participants — known as <Strong>Agro Executives</Strong> — into
          fourteen agricultural communities and gives each of them a personal page, a digital
          wallet, an online marketplace, an investment and staking surface, a service-request and
          assignment engine, secure messaging, and a weekly performance-rating system. Settlement
          across the platform is denominated in <Strong>V1N3</Strong>, a Solana-based token, and
          goods movement is handled by an in-platform logistics network of pickup terminals and
          field executives.
        </P>
        <P>
          This document describes the vision behind AgroV1n3, the operational structure that governs
          it, the architecture of the Green V1N3 application as it is built today, the V1N3 token and
          its economic model, the trust and security design, and the roadmap from the current pilot
          toward production scale. Where a feature is live in the current build it is described as
          such; where it is a program target or a planned milestone, it is labelled accordingly. The
          goal of this paper is honesty as much as ambition: to set out what the platform{' '}
          <Strong>is</Strong>, not only what it aspires to become.
        </P>
      </div>
    ),
  },
  {
    id: '02',
    slug: 'introduction',
    title: 'Introduction',
    body: (
      <div className="flex flex-col gap-4">
        <SubHead>2.1 — The problem</SubHead>
        <P>
          Nigeria’s agricultural sector employs a large share of the population yet captures a small
          share of the value it creates. Produce is grown by smallholders, moved by informal
          intermediaries, and sold through fragmented markets where price discovery is poor, payment
          is slow, quality is inconsistent, and trust between strangers is expensive. Young people —
          the demographic best positioned to modernise the sector — frequently see agriculture as
          low-status, low-income work rather than a coordinated, technology-enabled enterprise.
        </P>
        <P>
          The result is a value chain with weak coordination at every link: between farmers and
          processors, between sellers and buyers, between producers and the logistics that should
          connect them, and between the people doing the work and the institutions meant to organise,
          train, and reward them.
        </P>
        <SubHead>2.2 — The thesis</SubHead>
        <P>
          The core thesis of AgroV1n3 is that <Strong>massive, organised youth participation</Strong>{' '}
          is the lever that moves the entire chain. If you can register young people at scale, assign
          them clear roles, give them tools to transact and be paid quickly, measure their
          performance transparently, and let them progress on merit, then you create both
          livelihoods and a functioning market simultaneously.
        </P>
        <P>
          Green V1N3 is the instrument for that organisation. It is deliberately a{' '}
          <Strong>common-denominator platform</Strong>: a shared substrate on which several distinct
          programs and projects can run, rather than a single-purpose app. Marketplace commerce,
          training, investment, logistics, advocacy, media, and governance all live on the same
          identity, wallet, and reputation layer.
        </P>
        <SubHead>2.3 — Why Plateau State first</SubHead>
        <P>
          Plateau State, with its temperate climate and strong agricultural base, is the launch
          ground. Phase one targets an average of roughly ten thousand participating youths across
          the state’s seventeen LGAs. Starting in a single state allows the operational structure —
          administrators, community managers, forums, and a coordinating council — to be tested and
          refined with real people before the model is extended to other states and, ultimately,
          across African agricultural markets.
        </P>
      </div>
    ),
  },
  {
    id: '03',
    slug: 'vision',
    title: 'Vision & Targets',
    body: (
      <div className="flex flex-col gap-4">
        <P>
          The AgroV1n3 program is organised around a small number of ambitious three-year outcome
          targets. These are <Strong>program aspirations</Strong> that orient the design of the
          platform; they are not financial promises to any individual participant.
        </P>
        <Bullets
          items={[
            <>
              <Strong>60% local patronage</Strong> — a majority of agricultural products consumed in
              the operating region sourced from local producers on the platform.
            </>,
            <>
              <Strong>A new generation of agribusiness owners</Strong> — cultivating large numbers of
              successful agro-entrepreneurs in every local government, with “a thousand new
              agro-millionaires per LGA” as its rallying ambition.
            </>,
            <>
              <Strong>Pan-African market reach</Strong> — establishing new agricultural market
              linkages across Africa.
            </>,
            <>
              <Strong>Poverty reduction</Strong> — contributing to lifting a significant share of
              Nigerians out of poverty through participation in a productive, paid value chain.
            </>,
            <>
              <Strong>Velocity</Strong> — measurably faster marketing and consumption of local
              produce by compressing the distance between producer, buyer, payment, and delivery.
            </>,
          ]}
        />
        <P>
          The platform’s job is to make each of these measurable. Every transaction, assignment,
          delivery, and weekly rating is recorded, so progress against these targets can be observed
          rather than asserted.
        </P>
      </div>
    ),
  },
  {
    id: '04',
    slug: 'governance',
    title: 'Operational Structure & Governance',
    body: (
      <div className="flex flex-col gap-4">
        <P>
          AgroV1n3 is a human program supported by software, not the reverse. Its governance is a
          four-tier structure layered over the participant base. This structure maps directly onto
          the platform’s permission model — roles are enforced at the database level so that
          authority on the screen mirrors authority in the program.
        </P>
        <GovernanceLadder />
      </div>
    ),
  },
  {
    id: '05',
    slug: 'communities',
    title: 'The Fourteen Communities',
    body: (
      <div className="flex flex-col gap-4">
        <P>
          Every Agro Executive operates within one or more of fourteen communities that together
          form the operational matrix of the value chain. Communities are not merely categories;
          they are operational units. A service request is routed to a community’s GCM, marketplace
          fulfilment is owned by Agro Marketing, and deliveries are executed by Agro Logistics — which
          makes the community taxonomy the backbone of how work flows through the system.
        </P>
        <CommunityGrid />
      </div>
    ),
  },
  {
    id: '06',
    slug: 'platform',
    title: 'The Green V1N3 Platform',
    body: (
      <div className="flex flex-col gap-4">
        <P>
          Green V1N3 is delivered as a modern web application. The sections below describe the
          principal surfaces of the platform as they exist in the current build.
        </P>
        <SubHead>6.1 — Identity and onboarding</SubHead>
        <P>
          A new participant registers, verifies their email, selects their Local Government Area
          (from Plateau’s seventeen LGAs) and their primary community, and is issued a unique Agro
          ID. Onboarding also provisions the participant’s wallet, so every member leaves onboarding
          with a usable identity and a place to receive and hold value.
        </P>
        <SubHead>6.2 — Personal page and feed</SubHead>
        <P>
          Each participant has a personal, interactive page supporting rich content — text, photos,
          music, and video — and a social feed with real-time updates and notifications. It is the
          participant’s presence on the platform: a place to publish, to be discovered, and to build
          a following within and across communities.
        </P>
        <SubHead>6.3 — The marketplace (Agro Online Shop)</SubHead>
        <P>
          The marketplace is where produce and agricultural goods are listed, discovered, and sold.
          Sellers list products with prices; buyers add items to a cart and check out, with
          settlement for goods occurring in V1N3.
        </P>
        <Bullets
          items={[
            <>
              <Strong>Platform fee model</Strong> — a small, configurable platform fee (currently
              2.5%) is recorded per order and taken from seller proceeds. Fee parameters live in an
              admin-editable configuration table governed by program leadership.
            </>,
            <>
              <Strong>Loyalty points</Strong> — buyers earn points on completed checkouts. Points
              accrue to an immutable ledger and redeem for V1N3 at a governed rate (currently 1,000
              points per 1 V1N3, above a minimum threshold). Awards and redemptions run through
              atomic, audited database functions, so balances can never go negative or be
              double-spent.
            </>,
          ]}
        />
        <SubHead>6.4 — Fulfilment: pickup terminals and delivery</SubHead>
        <Bullets
          items={[
            <>
              <Strong>Pickup</Strong> — free. The buyer selects a pickup terminal: a physical
              collection point managed by GCMs and administrators, with Agro Marketing owning terminal
              operations.
            </>,
            <>
              <Strong>Delivery</Strong> — the seller sets a per-product delivery fee in Naira. If the
              buyer chooses delivery, they pay that fee to the seller in a separate on-chain V1N3
              transfer after checkout, and the seller raises a delivery request to Agro Logistics.
            </>,
          ]}
        />
        <SubHead>6.5 — Logistics network</SubHead>
        <P>
          The delivery pipeline is a multi-party workflow that mirrors the program’s human structure:
        </P>
        <Steps
          items={[
            <>The buyer pays the delivery fee, and the order advances to <Strong>delivery paid</Strong>.</>,
            <>The seller requests a courier, creating a delivery request routed to the <Strong>Logistics GCM</Strong>.</>,
            <>The Logistics GCM accepts and schedules it, then delegates the job to a field executive through the assignment engine.</>,
            <>The assigned executive carries out the delivery and reports completion with proof — a signature or photograph — plus optional notes.</>,
            <>The GCM reviews the proof and confirms delivery, syncing the order to <Strong>delivered</Strong> and notifying buyer, seller, and executive.</>,
          ]}
        />
        <P>
          This separation of duties is intentional. Assignment and confirmation are kept distinct,
          and the “mark delivered” action is unavailable until an executive has actually been
          assigned and has reported delivery — so completion cannot be claimed before the work is
          genuinely done.
        </P>
        <SubHead>6.6 — Service requests and the assignment engine</SubHead>
        <P>
          Beyond physical goods, the platform brokers <Strong>services</Strong>. Any member can
          submit a request — against a listed service or as a custom, free-form request to any of the
          fourteen communities. Every request lands with the target community’s GCM, who negotiates a
          quote through a structured lifecycle (pending → negotiating → accepted → payment pending →
          paid → in progress → completed), captures location and signature, and allocates the work to
          one or more executives. The same assignment infrastructure that powers logistics powers
          community services.
        </P>
        <SubHead>6.7 — Wallet</SubHead>
        <P>
          Every participant has a personal wallet (detailed in Section 7). It displays the live V1N3
          balance read directly from Solana, supports sending and receiving V1N3, and exposes backup
          and recovery tools.
        </P>
        <SubHead>6.8 — Investment, staking, and rewards</SubHead>
        <P>
          The platform includes an investor surface and a <Strong>staking system</Strong> for V1N3.
          Holders can stake to earn rewards accruing daily against a configurable APY (base currently
          35%, with a minimum stake and optional lock period). A rewards surface tracks earned and
          claimable rewards, and the loyalty-points-to-V1N3 path connects marketplace activity to the
          token economy.
        </P>
        <SubHead>6.9 — Communication, news, and training</SubHead>
        <Bullets
          items={[
            <><Strong>Messaging</Strong> — direct and group conversations with reactions and typing indicators, including auto-provisioned community group chats.</>,
            <><Strong>Notifications</Strong> — a unified system spanning requests, deliveries, assignments, and social activity, with administrative broadcast.</>,
            <><Strong>News</Strong> — agricultural and economic news and updates.</>,
            <><Strong>Training</Strong> — capacity-building content, anchored by Agro Motivation & Training.</>,
          ]}
        />
        <SubHead>6.10 — Evaluation and weekly ratings</SubHead>
        <P>
          The platform produces <Strong>weekly personal financial and operational ratings</Strong>{' '}
          alongside ongoing evaluation. Because commerce, assignments, deliveries, and service
          completions are all recorded, performance signals are derived from real activity rather
          than self-report — the foundation for merit-based progression.
        </P>
        <SubHead>6.11 — Administration</SubHead>
        <P>
          Administrators and the coordinating council have an organisation and administration surface
          for managing membership, configuring platform parameters (fees, rates, staking), overseeing
          security, and stewarding the program.
        </P>
      </div>
    ),
  },
  {
    id: '07',
    slug: 'wallet',
    title: 'Wallet & Custodial Key Management',
    body: (
      <div className="flex flex-col gap-4">
        <P>
          A wallet that ordinary young people can actually use — without prior crypto experience — is
          essential to the platform’s reach. Green V1N3 therefore offers a{' '}
          <Strong>custodial-by-default</Strong> wallet with a clear path to self-custody.
        </P>
        <SubHead>7.1 — Wallet provisioning</SubHead>
        <P>
          When a participant onboards, the platform mints a custodial wallet on their behalf. Wallets
          are generated from a standard <Strong>BIP39 seed phrase</Strong>, with the keypair derived
          along the standard Solana path (<span className="mono-xs text-foreground">m/44&apos;/501&apos;/0&apos;/0&apos;</span>)
          so the wallet is compatible with mainstream wallets such as Phantom and Solflare. Both the
          private key and the seed phrase are encrypted at rest using <Strong>AES-256-GCM</Strong>{' '}
          before storage; secret material is never logged.
        </P>
        <SubHead>7.2 — Custodial sending</SubHead>
        <P>
          Because the platform holds the encrypted key, a participant who signed up with only an
          email can send V1N3 entirely server-side, with no external wallet connection required. The
          server decrypts the key in a protected context, signs the transfer, and submits it.
          Participants who prefer self-custody can connect an external wallet instead; the platform
          supports both origins.
        </P>
        <SubHead>7.3 — Backup and recovery</SubHead>
        <P>
          Custody carries responsibility, and the platform is explicit about it. Two participant-facing
          tools, both gated behind a one-time-passcode (OTP) re-verification, address it:
        </P>
        <Bullets
          items={[
            <><Strong>Reveal secret phrase</Strong> — a participant can, at any time, verify by OTP and view their seed phrase and private key to back them up offline. Reveals are audited.</>,
            <><Strong>Recover wallet</Strong> — if a wallet’s keys ever become unavailable, the participant is shown a clear recovery path that, after OTP confirmation, mints a fresh seed-phrase-backed wallet and re-points their account to it — with an explicit warning that any balance at the old, unrecoverable address cannot be moved.</>,
          ]}
        />
        <P>
          Recovery is deliberately explicit and never destructive-by-default: the system will not
          silently overwrite a wallet, so a genuine self-custody wallet can never be clobbered by an
          automated process. New wallets are recoverable from their seed phrase by design, closing
          the gap that pure server-side key storage would otherwise create.
        </P>
      </div>
    ),
  },
  {
    id: '08',
    slug: 'token',
    title: 'The V1N3 Token',
    body: (
      <div className="flex flex-col gap-4">
        <SubHead>8.1 — Overview</SubHead>
        <P>
          <Strong>V1N3</Strong> is the unit of account and settlement across the Green V1N3 platform.
          It is an SPL token on <Strong>Solana</Strong>, chosen for low transaction costs, high
          throughput, and fast finality — properties that matter when the goal is many small, fast
          agricultural transactions rather than a few large ones.
        </P>
        <TokenSpecTable />
        <P>
          V1N3 is <Strong>live on Solana mainnet</Strong> with a fixed total supply of{' '}
          <Strong>4,000,000,000</Strong> tokens. The full supply has been minted and the mint
          authority <Strong>permanently revoked</Strong> — no more V1N3 can ever be created. The
          freeze authority is disabled, so holder accounts can never be frozen. The full economic
          loop — checkout settlement, delivery-fee transfers, staking, and points conversion —
          settles on-chain.
        </P>
        <SubHead>8.2 — Utility</SubHead>
        <Bullets
          items={[
            <><Strong>Settlement</Strong> for marketplace purchases.</>,
            <><Strong>Delivery payments</Strong> from buyer to seller.</>,
            <><Strong>Service payments</Strong> for community service requests.</>,
            <><Strong>Staking</Strong> to earn rewards and signal long-term participation.</>,
            <><Strong>Loyalty redemption</Strong> — the destination for marketplace loyalty points.</>,
          ]}
        />
        <SubHead>8.3 — Economic flows</SubHead>
        <Bullets
          items={[
            <><Strong>Commerce → fees:</Strong> every sale settles in V1N3, with a small platform fee recorded per order to sustain the program.</>,
            <><Strong>Engagement → points → V1N3:</Strong> buyers earn points for completed transactions; points convert to V1N3 at a governed rate, recycling engagement into spendable value.</>,
            <><Strong>Holding → staking → rewards:</Strong> participants who stake earn time-based rewards, encouraging retention and reducing sell pressure.</>,
            <><Strong>Work → payment:</Strong> executives and service providers are paid in V1N3 for deliveries and services completed and confirmed on-platform.</>,
          ]}
        />
        <P>
          All economically sensitive operations (fee capture, point award, point spend, staking math)
          are implemented as atomic, audited database operations with immutable ledgers, so the
          platform’s internal accounting is verifiable and tamper-evident even where actions occur
          off-chain for speed.
        </P>
        <SubHead>8.4 — Governance of parameters</SubHead>
        <P>
          Token-economic parameters — marketplace fee percentage, points-per-transaction,
          points-per-V1N3 conversion rate, minimum redemption, staking APY, minimum stake, and lock
          period — are <Strong>not hard-coded constants</Strong> but governed configuration, editable
          by program leadership (ultimately the State Coordinating Council). This lets the economy be
          tuned responsibly as the program learns, without code changes.
        </P>
        <SubHead>8.5 — Honest disclosures on tokenomics</SubHead>
        <div className="rounded-[2px] border border-accent/30 bg-accent/[0.06] p-4">
          <Bullets
            items={[
              <><Strong>Mainnet status.</Strong> V1N3 is live on Solana mainnet as a Token-2022 asset. The mint authority has been permanently revoked, so the supply is hard-capped and cannot be inflated.</>,
              <><Strong>Supply.</Strong> Total supply is fixed at 4,000,000,000 V1N3 (9 decimals). Distribution is managed from a treasury wallet into program operations, rewards, and staking over time.</>,
              <><Strong>No investment guarantee.</Strong> Program outcome targets and staking yields are aspirations and configurable parameters, not guarantees of financial return.</>,
              <><Strong>Regulatory posture.</Strong> V1N3 is designed and described as a utility token. The program intends to operate within applicable Nigerian law, and the token’s design may evolve to maintain compliance.</>,
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    id: '09',
    slug: 'architecture',
    title: 'Technology & Architecture',
    body: (
      <div className="flex flex-col gap-4">
        <P>Green V1N3 is built on a modern, security-first stack.</P>
        <Bullets
          items={[
            <><Strong>Application:</Strong> Next.js (App Router) with React, delivering a fast, server-rendered web application.</>,
            <><Strong>Data and authentication:</Strong> Supabase (managed PostgreSQL) provides the database, authentication, and real-time capabilities. Row-Level Security is enforced throughout, so the governance hierarchy is encoded directly in database policy.</>,
            <><Strong>Blockchain:</Strong> Solana, accessed via the official web3.js and SPL-token libraries, for the V1N3 token, balances, and transfers. Custodial derivation uses BIP39 mnemonics and ed25519 HD derivation.</>,
            <><Strong>Storage:</Strong> Vercel Blob for media and delivery-proof uploads.</>,
            <><Strong>Encryption:</Strong> AES-256-GCM for secret material at rest.</>,
          ]}
        />
        <SubHead>Architectural principles</SubHead>
        <Bullets
          items={[
            <><Strong>Authority mirrors the program.</Strong> Roles and community membership are first-class in the data model and enforced by RLS and security-definer functions, not merely hidden in the UI.</>,
            <><Strong>Auditable money.</Strong> Points, fees, and conversions are written to immutable ledgers via atomic functions; on-chain transfers are recorded with their signatures.</>,
            <><Strong>Separation of duties.</Strong> Sensitive workflows — especially delivery and service completion �� separate the party who does the work from the party who confirms it.</>,
            <><Strong>Honest state.</Strong> The platform distinguishes what it holds keys for from what it does not, and surfaces recovery rather than hiding failure.</>,
          ]}
        />
      </div>
    ),
  },
  {
    id: '10',
    slug: 'security',
    title: 'Trust, Safety & Security',
    body: (
      <div className="flex flex-col gap-4">
        <Bullets
          items={[
            <><Strong>Least-privilege access</Strong> through pervasive Row-Level Security.</>,
            <><Strong>Encrypted custody</Strong> with OTP-gated reveal and recovery, and audited access to secret material.</>,
            <><Strong>Non-destructive recovery</Strong> that cannot silently overwrite a self-custodied wallet.</>,
            <><Strong>Proof-of-delivery</Strong> with reviewer confirmation, preventing premature or false completion.</>,
            <><Strong>Immutable financial ledgers</Strong> for points and conversions, with atomic balance operations that cannot go negative.</>,
            <><Strong>Governed parameters</Strong> so economically significant settings change through leadership, with attribution, rather than through ad-hoc code edits.</>,
          ]}
        />
      </div>
    ),
  },
  {
    id: '11',
    slug: 'roadmap',
    title: 'Roadmap',
    body: (
      <div className="flex flex-col gap-3">
        <P>The roadmap is expressed in phases rather than dates, reflecting program readiness.</P>
        {[
          {
            phase: 'PHASE 01',
            tag: 'CURRENT',
            title: 'Plateau Pilot',
            desc: 'Onboard the first cohort across Plateau’s seventeen LGAs toward the ~10,000-participant target. Operate the full platform — marketplace, logistics, services, wallet, staking, messaging, ratings — settling in mainnet V1N3, validating the governance structure with real operations.',
          },
          {
            phase: 'PHASE 02',
            tag: 'NEXT',
            title: 'Hardening & distribution',
            desc: 'Publish the V1N3 distribution policy across operations, rewards, and staking. Independent review of token and custody design. Strengthen evaluation and weekly-rating analytics. Expand pickup-terminal and logistics coverage across all LGAs.',
          },
          {
            phase: 'PHASE 03',
            tag: 'PLANNED',
            title: 'Multi-state expansion',
            desc: 'Extend the program to additional Nigerian states using the proven operational template, scaling V1N3 settlement across new cohorts.',
          },
          {
            phase: 'PHASE 04',
            tag: 'PLANNED',
            title: 'Pan-African market linkages',
            desc: 'Connect regional agricultural markets, pursuing the program’s ambition of new agricultural markets across Africa.',
          },
        ].map((p) => (
          <div key={p.phase} className="rounded-[2px] border border-border bg-card/30 p-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="mono-xs text-primary">{p.phase}</span>
              <span
                className={`mono-xs text-[9px] rounded-[2px] border px-1.5 py-0.5 ${
                  p.tag === 'CURRENT'
                    ? 'border-primary/40 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {p.tag}
              </span>
              <span className="h-px flex-1 bg-border" />
              <span className="mono-sm text-foreground text-[11px] sm:text-xs">{p.title}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/65">{p.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: '12',
    slug: 'conclusion',
    title: 'Conclusion',
    body: (
      <div className="flex flex-col gap-4">
        <P>
          Green V1N3 Nigeria is built on a simple conviction: that organising young people into a
          coordinated, transparent, and rewarding agricultural value chain can change both individual
          livelihoods and the structure of a market at the same time. The platform turns that
          conviction into working software — identities, communities, a marketplace, logistics,
          services, a wallet, a token, staking, and a measurement layer — governed by a human
          structure that runs from the field executive up to the State Coordinating Council.
        </P>
        <P>
          What exists today is a functioning platform: a real application, a real on-chain token
          economy live on Solana mainnet, and a real operational model being exercised in Plateau
          State. What lies ahead is the disciplined work of hardening, governance, and expansion.
          This whitepaper is meant to be read as a faithful account of both — an invitation to build,
          to participate, and to hold the program to the outcomes it has set for itself.
        </P>
      </div>
    ),
  },
]
