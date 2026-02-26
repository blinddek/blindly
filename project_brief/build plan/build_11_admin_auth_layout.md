# Build 11 — Admin: Auth & Layout

> **Type:** Frontend
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 07 (RLS + admin user)
> **Context Files:** YOROS_UNIVERSAL_PROJECT_BRIEF.md §7 (Admin Panel), BRAND_DESIGN_SYSTEM.md

---

## Objective

Build the admin authentication flow and dashboard shell — login page, sidebar navigation, top bar, and the base layout that all admin pages share. Plus the settings page, media library, and activity log viewer.

---

## Tasks

### 1. Login Page

**`src/app/(admin)/login/page.tsx`**

- Email + password form
- Supabase Auth `signInWithPassword`
- Error display (invalid credentials, network error)
- On success → redirect to `/admin`
- Brand-styled: Blindly logo, warm neutral background, terracotta accent on CTA
- If already authenticated → redirect to `/admin`

### 2. Admin Layout

**`src/app/(admin)/admin/layout.tsx`**

Desktop layout:
```
┌──────────────────────────────────────────────────┐
│  [Logo]    Blindly Admin    [User] [Logout]      │  ← Top bar
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Dashboard │   Main Content Area                 │
│  Products  │                                     │
│  Pricing   │   (children rendered here)          │
│  Import    │                                     │
│  Orders    │                                     │
│  Quotes    │                                     │
│  Leads     │                                     │
│  Settings  │                                     │
│            │                                     │
│  ─────     │                                     │
│  Media     │                                     │
│  Activity  │                                     │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

Mobile: sidebar collapses into a hamburger menu (use shadcn Sheet component).

**Sidebar navigation items:**
| Label | Icon | Route |
|-------|------|-------|
| Dashboard | LayoutDashboard | /admin |
| Products | Package | /admin/products |
| Pricing | DollarSign | /admin/pricing |
| Price Import | Upload | /admin/products/import |
| Orders | ShoppingCart | /admin/orders |
| Quotes | FileText | /admin/quotes |
| Leads | Users | /admin/leads |
| Settings | Settings | /admin/settings |
| — separator — | | |
| Media Library | Image | /admin/media |
| Activity Log | Activity | /admin/activity |

Active state: terracotta left border + linen background on current route.

### 3. Top Bar

- Left: Blindly logo (small) + "Admin" text
- Right: User avatar/initial + name + role badge + logout button
- Fetch current user from Supabase Auth + user_profiles

### 4. Dashboard Page

**`src/app/(admin)/admin/page.tsx`**

Placeholder stats cards (real data comes in later builds):

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Orders Today │  │  Revenue MTD │  │  Pending      │  │  Open Leads  │
│  0            │  │  R 0         │  │  Quotes: 0    │  │  Swatches: 0 │
│               │  │              │  │               │  │  Measures: 0 │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

Wire up real data where possible (count queries on orders, saved_quotes, swatch_requests, measure_requests). Use skeleton loaders while data loads.

### 5. Settings Page

**`src/app/(admin)/admin/settings/page.tsx`**

Tabbed interface grouped by site_settings category:

| Tab | Settings |
|-----|----------|
| General | site_name, site_tagline, site_description, logo_url, logo_dark_url, favicon_url |
| Contact | contact_email, contact_phone, contact_whatsapp, contact_address |
| Social | social_facebook, social_instagram, social_linkedin, social_tiktok, social_youtube |
| SEO | seo_default_title, seo_default_description, seo_og_image, google_analytics_id, google_search_console |
| Pricing | global_markup_percent, installation_fee_cents, free_delivery_threshold_cents, delivery_fee_cents, vat_percent, currency |

Each setting renders as an appropriate input based on `value_type`:
- `text` → text input
- `number` → number input
- `boolean` → switch toggle
- `url` → URL input with validation
- `email` → email input with validation
- `json` → textarea with JSON validation

Save button per tab (not per field). Toast notification on save success.

### 6. Media Library

**`src/app/(admin)/admin/media/page.tsx`**

- Grid view of uploaded images (from `media` table)
- Upload button → Supabase Storage upload → create media record
- Click image → show detail: filename, size, URL, alt text (editable)
- Copy URL button (for pasting into settings or content)
- Delete button with confirmation
- Filter by folder
- Search by filename

### 7. Activity Log

**`src/app/(admin)/admin/activity/page.tsx`**

- Table view of activity_log entries, newest first
- Columns: Date, User, Action, Entity, Details
- Filterable by action type, entity type, date range
- Paginated (20 per page)
- Details column: show JSONB preview, click to expand

### 8. Logout

- Logout button calls `supabase.auth.signOut()`
- Redirect to `/login`
- Clear any local state

### 9. Auth Guard

The middleware from Build 01 handles route-level protection. Additionally:
- Admin layout should fetch and verify the user on mount
- If session expires mid-use, redirect to login with a toast message
- Store the user profile (name, role) in a React context for display in the top bar

---

## Acceptance Criteria

```
✅ Login page authenticates via Supabase Auth
✅ Invalid credentials show error message
✅ Successful login redirects to /admin
✅ Admin layout renders with sidebar + top bar + content area
✅ Sidebar highlights active route
✅ Mobile: sidebar collapses to hamburger menu
✅ Dashboard shows stat cards (placeholder or real counts)
✅ Settings page loads all settings grouped by category
✅ Settings save correctly with toast confirmation
✅ Media library uploads to Supabase Storage
✅ Media library displays uploaded files
✅ Activity log displays entries with pagination
✅ Logout clears session and redirects to /login
✅ Non-admin users cannot access /admin routes
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use shadcn/ui components throughout: Card, Table, Tabs, Input, Button, Sheet (mobile sidebar), Toast
- Lucide React for all icons
- The admin layout is a Server Component wrapper, but interactive pieces (sidebar toggle, logout) are Client Components
- Fetch user profile on the server side in the layout to avoid flicker
- Settings use server actions (from Build 02) for CRUD
- Keep the admin UI clean and functional — it doesn't need to be pretty, it needs to be fast and usable
- All admin pages use the brand typography but with a neutral colour scheme — save the terracotta accents for primary CTAs only
