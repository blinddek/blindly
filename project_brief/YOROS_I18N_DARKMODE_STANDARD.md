# YOROS Standard: i18n & Dark Mode

> **Applies to:** Every Yoros project (Blindly, The Deck Lab, future projects)
> **Date established:** 19 February 2026
> **Canonical location:** Copied to each project's project_brief folder

---

## 1. Multi-Language (EN/AF)

### Approach
- **Cookie/toggle** — single URL structure, language switcher in header
- No URL prefixes (/en/, /af/), no subdomains
- Cookie: `locale` = `'en'` | `'af'` (default: `'en'`)
- SSR reads cookie, renders correct language server-side

### LocalizedString Type

```typescript
// src/types/i18n.ts
export type Locale = 'en' | 'af'

export interface LocalizedString {
  en: string
  af: string
}

export function t(localized: LocalizedString | string | null, locale: Locale = 'en'): string {
  if (!localized) return ''
  if (typeof localized === 'string') return localized
  return localized[locale] || localized.en || ''
}
```

### Which Fields Are Localized

**Rule:** Public-facing content fields become `JSONB` (LocalizedString). Technical/admin fields stay `TEXT`.

| Localized (JSONB) | NOT Localized (TEXT) |
|-------------------|---------------------|
| name | slug |
| description | sku |
| short_description | extra_key |
| label | rate_type |
| features (display text) | hex_colour |
| alt text (images) | pricing_model |
| unit_label on extras | status values |
| variant_label | order_number |
| | email addresses |
| | all _cents fields |

### Database Convention

```sql
-- Localized field
name JSONB NOT NULL,           -- {"en": "...", "af": "..."}
description JSONB,             -- {"en": "...", "af": "..."}

-- NOT localized
slug TEXT UNIQUE NOT NULL,     -- always English for URLs
sku TEXT,                      -- technical identifier
```

### Admin Panel
- Admin panel is **English only**
- Admin CRUD forms show two input fields for localized content: "English" + "Afrikaans"
- If Afrikaans field is left empty, falls back to English on the public site

### Static UI Strings
- Stored in JSON files: `src/locales/en.json` + `src/locales/af.json`
- Covers: button labels, form placeholders, error messages, nav labels, footer text
- NOT in the database — developer-managed strings

### Language Switcher
- Simple toggle in header: "EN | AF"
- Sets cookie + triggers router.refresh()

---

## 2. Dark Mode

### Approach
- `next-themes` with `class` strategy
- System preference detection on first visit
- User toggle persists to localStorage
- Both public site and admin panel support dark mode

### Tailwind Config
```typescript
darkMode: "class",
```

### Theme Provider
`<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` from `next-themes`.

### Toggle
- Sun/moon icon in header
- Cycles: system → light → dark
- Works on both public and admin
