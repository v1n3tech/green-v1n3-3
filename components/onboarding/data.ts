// Reference data for the onboarding wizard. Kept colocated so the wizard
// stays self-contained.

export const PLATEAU_LGAS = [
  "Bokkos",
  "Barkin Ladi",
  "Bassa",
  "Jos East",
  "Jos North",
  "Jos South",
  "Kanam",
  "Kanke",
  "Langtang North",
  "Langtang South",
  "Mangu",
  "Mikang",
  "Pankshin",
  "Qua'an Pan",
  "Riyom",
  "Shendam",
  "Wase",
] as const

export type AgroCommunityKey =
  | "crop_farming"
  | "animal_farming"
  | "agro_marketing"
  | "agro_processing"
  | "agro_management_legislation"
  | "agro_tourism"
  | "agro_technology"
  | "agro_healthcare"
  | "agro_media_branding"
  | "agro_security"
  | "agro_literature"
  | "agro_motivation_training"
  | "agro_real_estate"
  | "agro_logistics"

export const COMMUNITIES: Array<{
  key: AgroCommunityKey
  label: string
  hint: string
}> = [
  { key: "crop_farming",                label: "CROP FARMING",            hint: "FIELD" },
  { key: "animal_farming",              label: "ANIMAL FARMING",          hint: "LIVESTOCK" },
  { key: "agro_marketing",              label: "AGRO MARKETING",          hint: "TRADE" },
  { key: "agro_processing",             label: "AGRO PROCESSING",         hint: "VALUE" },
  { key: "agro_management_legislation", label: "MANAGEMENT & LEGISLATION", hint: "POLICY" },
  { key: "agro_tourism",                label: "AGRO TOURISM",            hint: "VISIT" },
  { key: "agro_technology",             label: "AGRO TECHNOLOGY",         hint: "STACK" },
  { key: "agro_healthcare",             label: "AGRO HEALTHCARE",         hint: "CARE" },
  { key: "agro_media_branding",         label: "MEDIA & BRANDING",        hint: "VOICE" },
  { key: "agro_security",               label: "AGRO SECURITY",           hint: "GUARD" },
  { key: "agro_literature",             label: "AGRO LITERATURE",         hint: "WORD" },
  { key: "agro_motivation_training",    label: "MOTIVATION & TRAINING",   hint: "TEACH" },
  { key: "agro_real_estate",            label: "GREEN REAL ESTATE",       hint: "LAND" },
  { key: "agro_logistics",              label: "AGRO LOGISTICS",          hint: "MOVE" },
]
