# Build 02 — Universal Database Foundation

> **Type:** Migration
> **Estimated Time:** 45 min
> **Dependencies:** Build 01 (project scaffold)
> **Context Files:** BUILD_INDEX.md (Migration 001 SQL)

---

## Objective

Create and run the universal Yoros foundation migration — the tables that every project needs regardless of what it does. This includes site settings, navigation, pages, user profiles, contact forms, newsletter, media library, and activity logging.

---

## Tasks

### 1. Create Migration File

Create `supabase/migrations/001_foundation.sql` with the **exact SQL** from BUILD_INDEX.md → Migration 001.

This includes:
- `site_settings` — key/value store with categories, types, and public/private flag
- `navigation_items` — admin-manageable nav links for header, footer, mobile
- `pages` — dynamic pages with SEO fields and JSONB content blocks
- `user_profiles` — auto-created on auth signup via trigger, with role field
- `contact_submissions` — lead capture from contact forms
- `newsletter_subscribers` — email signup tracking
- `media` — media library for uploaded assets
- `activity_log` — audit trail for admin actions
- `update_updated_at()` — reusable trigger function for timestamp management

### 2. Run Migration

```bash
supabase db push
# or
supabase migration up
```

Verify all tables exist in Supabase dashboard.

### 3. Generate TypeScript Types

```bash
supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

Or if using local development:
```bash
supabase gen types typescript --local > src/types/database.ts
```

### 4. Create Server Actions for Site Settings

**`src/lib/actions/settings.ts`**:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all public settings (for public pages)
export async function getPublicSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value, value_type')
    .eq('is_public', true)
  
  if (error) throw error
  
  // Convert to object for easy access
  return Object.fromEntries(
    (data || []).map(s => [s.key, s.value])
  )
}

// Get all settings (admin only — includes private ones)
export async function getAllSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('category')
  
  if (error) throw error
  return data
}

// Get settings by category
export async function getSettingsByCategory(category: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('category', category)
  
  if (error) throw error
  return data
}

// Get single setting value
export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  
  if (error) return null
  return data.value
}

// Update a setting (admin only)
export async function updateSetting(key: string, value: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('site_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  
  if (error) throw error
  revalidatePath('/admin/settings')
}

// Bulk update settings
export async function updateSettings(updates: Record<string, string>) {
  const supabase = await createClient()
  
  const promises = Object.entries(updates).map(([key, value]) =>
    supabase
      .from('site_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
  )
  
  await Promise.all(promises)
  revalidatePath('/admin/settings')
}
```

### 5. Create Server Actions for Navigation

**`src/lib/actions/navigation.ts`**:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getNavigation(location: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('location', location)
    .eq('is_active', true)
    .order('display_order')
  
  if (error) throw error
  return data
}

export async function getAllNavigation() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('navigation_items')
    .select('*')
    .order('location')
    .order('display_order')
  
  if (error) throw error
  return data
}
```

### 6. Create Helper Types

**`src/types/index.ts`**:

```typescript
// Re-export database types
export type { Database } from './database'

// Common convenience types
import type { Database } from './database'

export type SiteSetting = Database['public']['Tables']['site_settings']['Row']
export type NavigationItem = Database['public']['Tables']['navigation_items']['Row']
export type Page = Database['public']['Tables']['pages']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type Media = Database['public']['Tables']['media']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
```

### 7. Seed Blindly-Specific Settings

After migration runs, seed Blindly-specific values into `site_settings`:

```sql
-- Run manually or via seed script
UPDATE site_settings SET value = 'Blindly' WHERE key = 'site_name';
UPDATE site_settings SET value = 'Premium custom blinds, your way.' WHERE key = 'site_tagline';
UPDATE site_settings SET value = 'Custom window blinds configured to your exact specifications and delivered to your door across South Africa.' WHERE key = 'site_description';
UPDATE site_settings SET value = 'Blindly — Custom Window Blinds | South Africa' WHERE key = 'seo_default_title';
UPDATE site_settings SET value = 'Configure premium custom blinds online. Choose your type, colour and exact measurements. Free delivery on orders over R5,000. South Africa''s smartest way to buy blinds.' WHERE key = 'seo_default_description';
```

### 8. Verify Trigger Works

Test that creating a new auth user auto-creates a `user_profiles` row:

1. Go to Supabase dashboard → Authentication → Users
2. Create a test user (or use the signup API)
3. Check `user_profiles` table — should have a matching row with `role = 'user'`

---

## Acceptance Criteria

```
✅ All 9 foundation tables created in Supabase
✅ site_settings seeded with all default keys (general, contact, social, seo)
✅ Blindly-specific settings values populated
✅ update_updated_at() trigger function exists and works
✅ handle_new_user() trigger creates profile on auth signup
✅ TypeScript types generated and importable (`import type { Database } from '@/types/database'`)
✅ Server actions for settings and navigation work correctly
✅ activity_log indexes created
✅ `pnpm run build` still passes
```

---

## Notes for Claude Code

- The exact SQL for this migration is in BUILD_INDEX.md under "Migration 001 — Universal Yoros Foundation"
- Copy it exactly — do not modify the schema
- After running the migration, generate fresh TypeScript types
- The `user_profiles` trigger uses `SECURITY DEFINER` — this is intentional so it can write to the table regardless of RLS
- The `site_settings` table uses a flat key-value design intentionally — it's simpler to query and cache than a normalised config table
- All timestamps are `TIMESTAMPTZ` (timezone-aware) — this is the Yoros standard
