/**
 * Config-driven client profile field visibility.
 *
 * Controls which optional fields appear in the portal settings form
 * and admin client detail view. All columns always exist in the DB —
 * this config just controls the UI.
 *
 * Usage:
 *   import { isClientFieldEnabled, getEnabledClientFields } from "@/lib/auth/client-fields";
 *   if (isClientFieldEnabled("emergencyContact")) { ... }
 */

import { siteConfig } from "@/config/site";

const DEFAULTS = {
  dateOfBirth: false,
  gender: false,
  address: false,
  relationshipStatus: false,
  emergencyContact: false,
  referralSource: false,
  medicalInfo: false,
  companyName: false,
} as const;

export type ClientFieldKey = keyof typeof DEFAULTS;

export function isClientFieldEnabled(field: ClientFieldKey): boolean {
  return siteConfig.clientFields?.[field] ?? DEFAULTS[field];
}

export function getEnabledClientFields(): ClientFieldKey[] {
  return (Object.keys(DEFAULTS) as ClientFieldKey[]).filter((key) =>
    isClientFieldEnabled(key)
  );
}

/** Maps field keys to human-readable labels */
export const CLIENT_FIELD_LABELS: Record<ClientFieldKey, string> = {
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  address: "Address",
  relationshipStatus: "Relationship Status",
  emergencyContact: "Emergency Contact",
  referralSource: "Referral Source",
  medicalInfo: "Medical Information",
  companyName: "Company Name",
};

/** Maps field keys to their database column names */
export const CLIENT_FIELD_COLUMNS: Record<ClientFieldKey, string> = {
  dateOfBirth: "date_of_birth",
  gender: "gender",
  address: "address",
  relationshipStatus: "relationship_status",
  emergencyContact: "emergency_contact",
  referralSource: "referral_source",
  medicalInfo: "medical_info",
  companyName: "company_name",
};
