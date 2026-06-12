/* Shared constants + types for profile change requests (no "use server"). */

/** Fields a user is allowed to request changes to. */
export const EDITABLE_FIELDS = [
  "email",
  "first_name",
  "last_name",
  "display_name",
  "phone",
  "bio",
  "lga",
  "state",
  "address",
] as const

export type EditableField = (typeof EDITABLE_FIELDS)[number]

export const FIELD_LABELS: Record<EditableField, string> = {
  email: "Login Email",
  first_name: "First Name",
  last_name: "Last Name",
  display_name: "Display Name",
  phone: "Phone",
  bio: "Bio",
  lga: "LGA",
  state: "State",
  address: "Address",
}

/** Fields that use a multi-line textarea instead of a single-line input. */
export const MULTILINE_FIELDS: EditableField[] = ["bio", "address"]

export type ChangeEntry = { current: string | null; requested: string }

export interface ChangeRequest {
  id: string
  user_id: string
  changes: Record<string, ChangeEntry>
  reason: string | null
  status: "pending" | "approved" | "rejected"
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export interface AdminChangeRequest extends ChangeRequest {
  applicant: {
    display_name: string | null
    email: string | null
    agro_id: string | null
    role: string | null
  } | null
}
