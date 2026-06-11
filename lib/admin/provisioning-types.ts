// Shared constants & types for admin account provisioning.
// Kept out of the "use server" module since that file may only export async fns.

export const AGRO_COMMUNITIES = [
  "crop_farming",
  "animal_farming",
  "agro_marketing",
  "agro_processing",
  "agro_management_legislation",
  "agro_tourism",
  "agro_technology",
  "agro_healthcare",
  "agro_media_branding",
  "agro_security",
  "agro_literature",
  "agro_motivation_training",
  "agro_real_estate",
  "agro_logistics",
] as const

export type AgroCommunity = (typeof AGRO_COMMUNITIES)[number]

export const PROVISIONABLE_ROLES = [
  "agro_executive",
  "gcm",
  "lgpa",
  "scc_member",
  "admin",
] as const

export type ProvisionRole = (typeof PROVISIONABLE_ROLES)[number]

export interface ProvisionInput {
  email: string
  firstName: string
  lastName: string
  phone?: string
  lga?: string
  role: ProvisionRole
  community?: AgroCommunity | null
  secondaryCommunities?: AgroCommunity[]
}

/** The one-time credential package handed to the admin after creation. */
export interface CredentialPackage {
  userId: string
  email: string
  displayName: string
  agroId: string | null
  role: ProvisionRole
  community: AgroCommunity | null
  secondaryCommunities: AgroCommunity[]
  walletAddress: string
  seedPhrase: string | null
  createdAt: string
}

export interface ProvisionedAccount {
  id: string
  email: string | null
  display_name: string | null
  agro_id: string | null
  role: ProvisionRole
  community: AgroCommunity | null
  secondary_communities: AgroCommunity[] | null
  lga: string | null
  wallet_address: string | null
  is_active: boolean
  provisioned_at: string | null
  created_at: string
}
