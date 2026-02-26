// ============================================================
// Audience Filter Types — used by campaigns + getCampaignRecipients
// ============================================================

export interface AudienceFilters {
  // Basic filters
  source?: string[];             // ["website", "newsletter", "booking", "import", "manual"]
  clientStatus?: string[];       // ["active", "inactive", "archived"]
  gender?: string[];             // ["male", "female", "non_binary", "prefer_not_to_say"]

  // Age
  ageRange?: {
    min?: number;                // e.g. 18
    max?: number;                // e.g. 65
  };

  // Engagement
  lastLoginRange?: string;       // "7d" | "30d" | "60d" | "90d" | "never"
  lastLoginDirection?: string;   // "within" | "not_within" (within = active, not_within = dormant)

  // Enrollment (LMS)
  hasEnrollments?: boolean;      // true = has at least one course enrollment
  hasNoEnrollments?: boolean;    // true = zero enrollments (good for upselling)

  // Onboarding
  onboardingComplete?: boolean;  // true = onboarding_complete = true

  // Tags (freeform targeting)
  tags?: string[];
}

// Filter section definitions for the UI
export interface FilterSection {
  key: string;
  label: string;
  description?: string;
  type: "checkbox" | "radio" | "range" | "toggle";
}

// Options for select-style filters
export const CLIENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "newsletter", label: "Newsletter" },
  { value: "booking", label: "Booking" },
  { value: "import", label: "Import" },
  { value: "manual", label: "Manual" },
];

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-Binary" },
  { value: "prefer_not_to_say", label: "Prefer Not to Say" },
];

export const LAST_LOGIN_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "60d", label: "60 days" },
  { value: "90d", label: "90 days" },
  { value: "never", label: "Never logged in" },
];

export const AGE_PRESETS = [
  { label: "Under 18", min: undefined, max: 17 },
  { label: "18–25", min: 18, max: 25 },
  { label: "26–35", min: 26, max: 35 },
  { label: "36–50", min: 36, max: 50 },
  { label: "Over 50", min: 50, max: undefined },
];
