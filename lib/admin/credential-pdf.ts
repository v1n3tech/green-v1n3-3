import { jsPDF } from "jspdf"
import type { CredentialPackage } from "@/lib/admin/provisioning-types"

const ROLE_LABELS: Record<string, string> = {
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

/**
 * Render a sleek, branded A4 credential package PDF and trigger a download.
 * Contains the account email, Agro ID, crypto (Solana) address and the
 * recovery seed phrase. Pure client-side — no secrets ever touch the network
 * beyond the single server action response that produced them.
 */
export function downloadCredentialPdf(pkg: CredentialPackage) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  const M = 48
  const ink = { r: 18, g: 22, b: 19 }
  const green = { r: 22, g: 163, b: 74 }
  const muted = { r: 110, g: 120, b: 112 }

  // Header band
  doc.setFillColor(ink.r, ink.g, ink.b)
  doc.rect(0, 0, W, 96, "F")
  doc.setTextColor(green.r, green.g, green.b)
  doc.setFont("courier", "bold")
  doc.setFontSize(22)
  doc.text("GREENV1N3", M, 50)
  doc.setTextColor(235, 240, 235)
  doc.setFont("courier", "normal")
  doc.setFontSize(9)
  doc.text("ACCOUNT CREDENTIAL PACKAGE", M, 68)
  doc.setTextColor(150, 160, 152)
  doc.setFontSize(7.5)
  doc.text(
    `ISSUED ${new Date(pkg.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC`,
    M,
    82,
  )

  let y = 134

  const field = (label: string, value: string, opts?: { mono?: boolean }) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(muted.r, muted.g, muted.b)
    doc.text(label.toUpperCase(), M, y)
    y += 16
    doc.setFont(opts?.mono ? "courier" : "helvetica", opts?.mono ? "normal" : "bold")
    doc.setFontSize(opts?.mono ? 10 : 12)
    doc.setTextColor(ink.r, ink.g, ink.b)
    const lines = doc.splitTextToSize(value || "—", W - M * 2)
    doc.text(lines, M, y)
    y += lines.length * (opts?.mono ? 14 : 16) + 14
  }

  doc.setFont("courier", "bold")
  doc.setFontSize(11)
  doc.setTextColor(ink.r, ink.g, ink.b)
  doc.text("/ IDENTITY", M, y)
  y += 24

  field("Full Name", pkg.displayName)
  field("Login Email", pkg.email, { mono: true })
  field("Agro ID", pkg.agroId ?? "—", { mono: true })
  field("Role", ROLE_LABELS[pkg.role] ?? humanize(pkg.role))
  field(
    "Community",
    [humanize(pkg.community), ...pkg.secondaryCommunities.map(humanize)]
      .filter((c) => c !== "—")
      .join(", ") || "—",
  )

  // Wallet section
  doc.setDrawColor(225, 230, 225)
  doc.line(M, y - 4, W - M, y - 4)
  y += 16
  doc.setFont("courier", "bold")
  doc.setFontSize(11)
  doc.text("/ CUSTODIAL WALLET", M, y)
  y += 24

  field("Solana Address", pkg.walletAddress, { mono: true })

  // Seed phrase highlighted box
  if (pkg.seedPhrase) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(muted.r, muted.g, muted.b)
    doc.text("RECOVERY SEED PHRASE", M, y)
    y += 12

    const words = pkg.seedPhrase.trim().split(/\s+/)
    const boxH = 18 + Math.ceil(words.length / 3) * 22 + 12
    doc.setFillColor(244, 250, 245)
    doc.setDrawColor(green.r, green.g, green.b)
    doc.roundedRect(M, y, W - M * 2, boxH, 4, 4, "FD")

    doc.setFont("courier", "bold")
    doc.setFontSize(11)
    doc.setTextColor(ink.r, ink.g, ink.b)
    const colW = (W - M * 2 - 24) / 3
    words.forEach((word, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = M + 16 + col * colW
      const wy = y + 26 + row * 22
      doc.setTextColor(green.r, green.g, green.b)
      doc.text(`${String(i + 1).padStart(2, "0")}`, x, wy)
      doc.setTextColor(ink.r, ink.g, ink.b)
      doc.text(word, x + 22, wy)
    })
    y += boxH + 20
  }

  // Warning footer
  doc.setFillColor(255, 247, 237)
  doc.setDrawColor(234, 179, 8)
  const warnY = doc.internal.pageSize.getHeight() - 96
  doc.roundedRect(M, warnY, W - M * 2, 56, 4, 4, "FD")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(146, 102, 9)
  doc.text("KEEP THIS DOCUMENT SECURE", M + 14, warnY + 20)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(120, 95, 30)
  doc.text(
    "Anyone with this seed phrase can control the wallet. Store it offline and never share it.",
    M + 14,
    warnY + 36,
  )

  const safeName = pkg.displayName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "account"
  doc.save(`greenv1n3-credentials-${safeName}.pdf`)
}
