# Green V1N3 Nigeria

### A Youth-Driven Agricultural Value-Chain Platform for Plateau State and Beyond

**The AgroV1n3 Program — Technical & Economic Whitepaper**

Version 1.0 · June 2026

---

## Abstract

Green V1N3 Nigeria is a multifunctional digital platform built to mobilise, coordinate, and reward youth participation across the agriculture value chain. It is the operating system for the **AgroV1n3 program** — a structured initiative that aims to translate a collective dream of a better Nigeria into measurable economic outcomes, beginning with an estimated ten thousand young people across the seventeen Local Government Areas of Plateau State in its first phase.

The platform organises participants — known as **Agro Executives** — into fourteen agricultural communities, gives each of them a personal page, a digital wallet, an online marketplace, an investment and staking surface, a service-request and assignment engine, secure messaging, and a weekly performance-rating system. Settlement across the platform is denominated in **V1N3**, a Solana-based token, and goods movement is handled by an in-platform logistics network of pickup terminals and field executives.

This document describes the vision behind AgroV1n3, the operational structure that governs it, the architecture of the Green V1N3 application as it is built today, the V1N3 token and its economic model, the trust and security design, and the roadmap from the current pilot toward production scale. Where a feature is live in the current build it is described as such; where it is a program target or a planned milestone, it is labelled accordingly. The goal of this paper is honesty as much as ambition: to set out what the platform *is*, not only what it aspires to become.

---

## 1. Introduction

### 1.1 The problem

Nigeria's agricultural sector employs a large share of the population yet captures a small share of the value it creates. Produce is grown by smallholders, moved by informal intermediaries, and sold through fragmented markets where price discovery is poor, payment is slow, quality is inconsistent, and trust between strangers is expensive. Young people — the demographic best positioned to modernise the sector — frequently see agriculture as low-status, low-income work rather than a coordinated, technology-enabled enterprise.

The result is a value chain with weak coordination at every link: between farmers and processors, between sellers and buyers, between producers and the logistics that should connect them, and between the people doing the work and the institutions meant to organise, train, and reward them.

### 1.2 The thesis

The core thesis of AgroV1n3 is that **massive, organised youth participation** is the lever that moves the entire chain. If you can register young people at scale, assign them clear roles, give them tools to transact and be paid quickly, measure their performance transparently, and let them progress on merit, then you create both livelihoods and a functioning market simultaneously.

Green V1N3 is the instrument for that organisation. It is deliberately a *common-denominator platform*: a shared substrate on which several distinct programs and projects can run, rather than a single-purpose app. Marketplace commerce, training, investment, logistics, advocacy, media, and governance all live on the same identity, wallet, and reputation layer.

### 1.3 Why Plateau State first

Plateau State, with its temperate climate and strong agricultural base, is the launch ground. Phase one targets an average of roughly ten thousand participating youths across the state's seventeen LGAs. Starting in a single state allows the operational structure — administrators, community managers, forums, and a coordinating council — to be tested and refined with real people before the model is extended to other states and, ultimately, across African agricultural markets.

---

## 2. Vision and Targets

The AgroV1n3 program is organised around a small number of ambitious three-year outcome targets. These are **program aspirations** that orient the design of the platform; they are not financial promises to any individual participant.

- **60% local patronage** — a majority of agricultural products consumed in the operating region sourced from local producers on the platform.
- **A new generation of agribusiness owners** — the program aims to cultivate large numbers of successful agro-entrepreneurs in every local government, with "a thousand new agro-millionaires per LGA" as its rallying ambition.
- **Pan-African market reach** — establishing new agricultural market linkages across Africa.
- **Poverty reduction** — contributing to lifting a significant share of Nigerians out of poverty through participation in a productive, paid value chain.
- **Velocity** — measurably faster marketing and consumption of local agricultural produce by compressing the distance between producer, buyer, payment, and delivery.

The platform's job is to make each of these measurable. Every transaction, assignment, delivery, and weekly rating is recorded, so progress against these targets can be observed rather than asserted.

---

## 3. Operational Structure & Governance

AgroV1n3 is a human program supported by software, not the reverse. Its governance is a four-tier structure layered over the participant base.

### 3.1 Agro Executives

The thousands of young people who register, participate in, and benefit from the program. Each Agro Executive selects a primary community (and may hold secondary community memberships), receives a unique platform identity, and is trained to operate in one or more links of the agriculture value chain. They are the platform's producers, sellers, buyers, couriers, and service providers.

### 3.2 Green V1N3 Community Managers (GCM)

Each of the fourteen communities, in each operating locality, is led by a **Green V1N3 Community Manager**. GCMs are appointed by the Local Government Program Administrators. In the software, the GCM role carries real operational power: GCMs receive and negotiate service requests routed to their community, allocate work to executives through the assignment engine, manage pickup terminals and logistics where their community owns those operations, and confirm completion of work and deliveries.

### 3.3 Local Government Program Administrators (LGPA)

Selected youth delegates — one cohort per LGA — responsible for mobilising and managing participants in their local government. An LGPA also serves as the local-government administrator for the communities operating in their area. They sit between the grassroots (executives and GCMs) and the state-level bodies.

### 3.4 LGPA Forum

A standing assembly of all LGPAs across the seventeen local governments, chaired by an elected chairperson. The forum is the program's appraisal and evaluation body: it reviews performance across LGAs, surfaces issues, and harmonises practice.

### 3.5 State Coordinating Council (SCC)

The central body overseeing all activities across the state and beyond. The SCC sets policy, approves program-wide configuration (fees, rates, and operational parameters), and is the ultimate steward of the program's direction and the V1N3 treasury.

This structure maps directly onto the platform's permission model. Roles are enforced at the database level so that authority on the screen mirrors authority in the program.

---

## 4. The Fourteen Communities

Every Agro Executive operates within one or more of fourteen communities that together form the operational matrix of the value chain:

1. **Crop Farming** — field cultivation and primary production.
2. **Animal Farming** — livestock and animal husbandry.
3. **Agro Marketing** — trade, distribution, and (in the platform) ownership of marketplace fulfilment operations.
4. **Agro Processing** — value addition and transformation of raw produce.
5. **Agro Management & Legislation** — policy, compliance, and organisational management.
6. **Agro Tourism** — agricultural tourism and experiences.
7. **Agro Technology** — the technology stack serving the value chain.
8. **Agro Healthcare** — health and care services within the agricultural community.
9. **Agro Media & Branding** — the voice of the program: media, content, and brand.
10. **Agro Security** — safeguarding people, produce, and operations.
11. **Agro Literature** — documentation, written culture, and knowledge.
12. **Agro Motivation & Training** — teaching, capacity-building, and motivation.
13. **Green Real Estate** — agricultural land and property.
14. **Agro Logistics** — the movement of goods, which powers the platform's delivery network.

Communities are not merely categories; they are operational units. A service request is routed to a community's GCM, marketplace fulfilment is owned by Agro Marketing, and deliveries are executed by Agro Logistics. This makes the community taxonomy the backbone of how work flows through the system.

---

## 5. The Green V1N3 Platform

Green V1N3 is delivered as a modern web application. The sections below describe the principal surfaces of the platform as they exist in the current build.

### 5.1 Identity and onboarding

A new participant registers, verifies their email, selects their Local Government Area (from Plateau's seventeen LGAs) and their primary community, and is issued a unique platform identity (an Agro ID). Onboarding also provisions the participant's wallet, so every member leaves onboarding with a usable identity and a place to receive and hold value.

### 5.2 Personal page and feed

Each participant has a personal, interactive page supporting rich content — text, photos, music, and video — and a social feed. This is the participant's presence on the platform: a place to publish, to be discovered, and to build a following within and across communities. The feed supports real-time updates and notifications.

### 5.3 The marketplace (Agro Online Shop)

The marketplace is where produce and agricultural goods are listed, discovered, and sold. Sellers list products with prices; buyers add items to a cart and check out. Settlement for goods occurs in V1N3 at checkout. The marketplace includes:

- **Platform fee model** — a small, configurable platform fee (currently set at 2.5%) is recorded per order and taken from seller proceeds. Fee parameters are held in an admin-editable configuration table governed by the program's leadership.
- **Loyalty points** — buyers earn loyalty points on completed checkouts (currently configured at a fixed award per transaction). Points accrue to a balance, are recorded in an immutable ledger, and can be redeemed for V1N3 at a governed conversion rate (currently 1,000 points per 1 V1N3, subject to a minimum redemption threshold). Point awards and redemptions are executed by atomic, audited database functions to guarantee balances can never go negative or be double-spent.

### 5.4 Fulfilment: pickup terminals and delivery

Orders can be fulfilled two ways:

- **Pickup** — free. The buyer selects a pickup terminal. Terminals are physical collection points managed by GCMs and administrators, with Agro Marketing owning terminal operations.
- **Delivery** — the seller sets a per-product delivery fee in Naira. If the buyer chooses delivery, they pay that fee to the seller in a *separate* on-chain V1N3 transfer after checkout. The seller then raises a delivery request to the Agro Logistics community.

### 5.5 Logistics network

The delivery pipeline is a multi-party workflow that mirrors the program's human structure:

1. The buyer pays the delivery fee, and the order advances to *delivery paid*.
2. The seller requests a courier, creating a delivery request routed to the **Logistics GCM**.
3. The Logistics GCM accepts the request and schedules it, then **delegates the job to a field executive** through the assignment engine.
4. The assigned executive carries out the delivery and **reports completion with proof** — a signature or photograph uploaded to the platform — plus optional notes.
5. The GCM reviews the proof and **confirms delivery**, which syncs the marketplace order to *delivered* and notifies the buyer, seller, and executive.

This separation of duties is intentional. Assignment and confirmation are deliberately kept distinct, and the "mark delivered" action is unavailable until an executive has actually been assigned and has reported delivery — so completion cannot be claimed before the work is genuinely done.

### 5.6 Service requests and the assignment engine

Beyond physical goods, the platform brokers *services*. Any member can submit a request — either against a service a community has listed, or as a **custom, free-form request** to any of the fourteen communities (including their own). Every request lands with the target community's GCM, who negotiates a quote through a structured lifecycle (`pending → negotiating → accepted → payment pending → paid → in progress → completed`), captures location and signature, and then **allocates the work to one or more executives**. The same assignment infrastructure that powers logistics powers community services, giving GCMs a single, consistent way to distribute work to their members.

### 5.7 Wallet

Every participant has a personal wallet (described in detail in Section 6). It displays the live V1N3 balance read directly from the Solana blockchain, supports sending and receiving V1N3, and exposes backup and recovery tools.

### 5.8 Investment, staking, and rewards

The platform includes an investment and investor surface and a **staking system** for V1N3. Holders can stake V1N3 to earn rewards accruing daily against a configurable annual percentage yield (base APY currently configured at 35%, with a minimum stake and optional lock period). Staking configuration is governed centrally and can be adjusted by program leadership. A rewards surface tracks earned and claimable rewards, and a loyalty-points-to-V1N3 conversion path connects marketplace activity to the token economy.

### 5.9 Communication, news, and training

- **Messaging** — direct and group conversations with message reactions and typing indicators, including automatically provisioned community group chats.
- **Notifications** — a unified notification system spanning requests, deliveries, assignments, and social activity, with administrative broadcast capability.
- **News** — agricultural and economic news and updates.
- **Training** — capacity-building content, anchored by the Agro Motivation & Training community.

### 5.10 Evaluation and weekly ratings

The platform is designed to produce **weekly personal financial and operational ratings** for participants, alongside ongoing evaluation and monitoring. Because commerce, assignments, deliveries, and service completions are all recorded, the platform can derive performance signals from real activity rather than self-report — the foundation for merit-based progression within communities and the program.

### 5.11 Administration

Administrators and the coordinating council have an organisation and administration surface for managing membership, configuring platform parameters (fees, rates, staking), overseeing security, and stewarding the program.

---

## 6. The Personal Wallet and Custodial Key Management

A wallet that ordinary young people can actually use — without prior crypto experience — is essential to the platform's reach. Green V1N3 therefore offers a **custodial-by-default** wallet with a clear path to self-custody.

### 6.1 Wallet provisioning

When a participant onboards, the platform mints a custodial wallet on their behalf. Wallets are generated from a standard **BIP39 seed phrase**, with the keypair derived along the standard Solana derivation path (`m/44'/501'/0'/0'`) so the wallet is compatible with mainstream wallets such as Phantom and Solflare. Both the private key and the seed phrase are encrypted at rest using **AES-256-GCM** before storage; secret material is never logged.

### 6.2 Custodial sending

Because the platform holds the encrypted key, a participant who signed up with only an email can send V1N3 entirely server-side, with no external wallet connection required. The server decrypts the key in a protected context, signs the transfer, and submits it to the network. Participants who prefer self-custody can connect an external wallet instead; the platform supports both origins.

### 6.3 Backup and recovery

Custody carries responsibility, and the platform is explicit about it. Two participant-facing tools, both gated behind a one-time-passcode (OTP) re-verification, address it:

- **Reveal secret phrase** — a participant can, at any time, verify by OTP and view their seed phrase and private key to back them up offline. Reveals are audited.
- **Recover wallet** — if a wallet's keys ever become unavailable (for example, vault data is lost), the participant is shown a clear recovery path that, after OTP confirmation, mints a fresh seed-phrase-backed wallet and re-points their account to it. The action carries an explicit warning that any balance at the old, unrecoverable address cannot be moved.

Recovery is deliberately explicit and never destructive-by-default: the system will not silently overwrite a wallet, so a genuine self-custody (external) wallet can never be clobbered by an automated process. New wallets are recoverable from their seed phrase by design, closing the gap that pure server-side key storage would otherwise create.

---

## 7. The V1N3 Token

### 7.1 Overview

**V1N3** is the unit of account and settlement across the Green V1N3 platform. It is an SPL token on **Solana**, chosen for low transaction costs, high throughput, and fast finality — properties that matter when the goal is many small, fast agricultural transactions rather than a few large ones.

Current configuration (pilot):

| Property | Value |
| --- | --- |
| Token name | V1n3 |
| Symbol | V1N3 |
| Standard | SPL (Token program) |
| Decimals | 9 |
| Network | Solana Devnet (pilot) |

The token is live on **devnet** during the pilot phase. This is a deliberate choice: it lets the full economic loop — checkout settlement, delivery-fee transfers, staking, and points conversion — be exercised end-to-end with real on-chain mechanics before value is committed on mainnet.

### 7.2 Utility

V1N3 is a utility token whose purpose is to move value through the agricultural value chain. Its roles include:

- **Settlement** for marketplace purchases.
- **Delivery payments** from buyer to seller.
- **Service payments** for community service requests.
- **Staking** to earn rewards and signal long-term participation.
- **Loyalty redemption** — the destination for marketplace loyalty points.

### 7.3 Economic flows

The token economy is a set of interlocking, on-platform flows:

- **Commerce → fees:** every marketplace sale settles in V1N3, with a small platform fee recorded per order. Fees sustain the program and its operations.
- **Engagement → points → V1N3:** buyers earn points for completed transactions; points convert to V1N3 at a governed rate, recycling engagement back into spendable value.
- **Holding → staking → rewards:** participants who stake V1N3 earn time-based rewards, encouraging retention and reducing sell pressure.
- **Work → payment:** executives and service providers are paid in V1N3 for deliveries and services completed and confirmed on-platform.

All economically sensitive operations (fee capture, point award, point spend, staking math) are implemented as atomic, audited database operations with immutable ledgers, so the platform's internal accounting is verifiable and tamper-evident even where actions occur off-chain for speed.

### 7.4 Governance of parameters

Token-economic parameters — marketplace fee percentage, points-per-transaction, points-per-V1N3 conversion rate, minimum redemption, staking APY, minimum stake, and lock period — are **not hard-coded constants** but governed configuration, editable by program leadership (ultimately the State Coordinating Council). This lets the economy be tuned responsibly as the program learns, without code changes.

### 7.5 Honest disclosures on tokenomics

In the spirit of a genuine whitepaper, several points must be stated plainly:

- **Devnet status.** V1N3 currently operates on Solana devnet. Devnet tokens carry no monetary value. A mainnet launch, with a fixed and published supply schedule, is a future milestone (see Roadmap).
- **Supply.** A final mainnet supply policy and distribution schedule have not yet been fixed in this version and will be published before any mainnet deployment.
- **No investment guarantee.** Program outcome targets (Section 2) and staking yields are aspirations and configurable parameters, not guarantees of financial return. Yields are funded by program economics and are subject to change by governance.
- **Regulatory posture.** V1N3 is designed and described as a utility token for use within the platform. The program intends to operate within applicable Nigerian law and regulation, and the token's design may evolve to maintain compliance.

These disclosures are not caveats bolted on at the end; they reflect the actual state of the system and the program's intention to grow it credibly.

---

## 8. Technology and Architecture

Green V1N3 is built on a modern, security-first stack.

- **Application:** Next.js (App Router) with React, delivering a fast, server-rendered web application.
- **Data and authentication:** Supabase (managed PostgreSQL) provides the database, authentication, and real-time capabilities. **Row-Level Security (RLS)** is enforced on tables throughout, so a user can only read and write the rows their role and identity permit — the same governance hierarchy described in Section 3 is encoded directly in database policy.
- **Blockchain:** Solana, accessed via the official web3.js and SPL-token libraries, for the V1N3 token, balances, and transfers. Custodial key derivation uses standard BIP39 mnemonics and ed25519 HD derivation.
- **Storage:** Vercel Blob for media and delivery proof uploads.
- **Encryption:** AES-256-GCM for secret material at rest.

Architectural principles:

- **Authority mirrors the program.** Roles (executive, GCM, administrator) and community membership are first-class in the data model and enforced by RLS and security-definer functions, not merely hidden in the UI.
- **Auditable money.** Points, fees, and conversions are written to immutable ledgers via atomic functions; on-chain transfers are recorded with their signatures.
- **Separation of duties.** Sensitive workflows — especially delivery and service completion — separate the party who does the work from the party who confirms it.
- **Honest state.** The platform distinguishes what it holds keys for from what it does not, and surfaces recovery rather than hiding failure.

---

## 9. Trust, Safety, and Security

- **Least-privilege access** through pervasive Row-Level Security.
- **Encrypted custody** with OTP-gated reveal and recovery, and audited access to secret material.
- **Non-destructive recovery** that cannot silently overwrite a self-custodied wallet.
- **Proof-of-delivery** with reviewer confirmation, preventing premature or false completion.
- **Immutable financial ledgers** for points and conversions, with atomic balance operations that cannot go negative.
- **Governed parameters** so economically significant settings change through leadership, with attribution, rather than through ad-hoc code edits.

---

## 10. Roadmap

The roadmap is expressed in phases rather than dates, reflecting program readiness.

**Phase 1 — Plateau Pilot (current).**
Onboard the first cohort across Plateau's seventeen LGAs toward the ~10,000-participant target. Operate the full platform — marketplace, logistics, services, wallet, staking, messaging, ratings — with V1N3 on devnet. Validate the governance structure (Executives, GCMs, LGPAs, Forum, SCC) with real operations.

**Phase 2 — Hardening and mainnet preparation.**
Publish the mainnet token supply and distribution policy. Independent review of token and custody design. Strengthen evaluation and weekly-rating analytics. Expand pickup-terminal and logistics coverage across all LGAs.

**Phase 3 — Mainnet and multi-state expansion.**
Migrate V1N3 to Solana mainnet under the published supply schedule. Extend the program to additional Nigerian states using the proven operational template.

**Phase 4 — Pan-African market linkages.**
Connect regional agricultural markets, pursuing the program's ambition of new agricultural markets across Africa.

---

## 11. Conclusion

Green V1N3 Nigeria is built on a simple conviction: that organising young people into a coordinated, transparent, and rewarding agricultural value chain can change both individual livelihoods and the structure of a market at the same time. The platform turns that conviction into working software — identities, communities, a marketplace, logistics, services, a wallet, a token, staking, and a measurement layer — governed by a human structure that runs from the field executive up to the State Coordinating Council.

What exists today is a functioning pilot: a real application, a real on-chain token economy on devnet, and a real operational model being exercised in Plateau State. What lies ahead is the disciplined work of hardening, governance, mainnet launch, and expansion. This whitepaper is meant to be read as a faithful account of both — an invitation to build, to participate, and to hold the program to the outcomes it has set for itself.

---

*This document describes a program and a platform under active development. Feature descriptions reflect the current build at the time of writing; economic parameters are configurable and subject to governance; and the V1N3 token operates on Solana devnet during the pilot phase and carries no monetary value until a future mainnet launch under a published supply policy. Nothing in this document is financial advice or an offer of securities.*
