# Build 07 — RLS Policies & Indexes

> **Type:** Migration
> **Estimated Time:** 30 min
> **Dependencies:** Build 06 (all tables must exist)
> **Context Files:** BUILD_INDEX.md (Migration 006 SQL)

---

## Objective

Lock down every table with Row Level Security policies. Public users can read product data and submit orders/leads. Only admins can access markup config, import history, and manage all records. This is the security boundary for the entire application.

---

## Context

Blindly has two access levels:
- **Anonymous/Public** — browse products, see prices, submit orders, request swatches/measures, save quotes
- **Admin** — full access to everything, including supplier costs, markup strategy, and order management

There is NO authenticated customer role for this project (guest checkout only). The only authenticated users are admins.

**Critical security concern:** The `markup_config` table and `is_public = false` settings contain margin strategy — these must NEVER be readable by anonymous users. Supplier prices in `price_matrices` ARE readable (they're used for live pricing), but the markup is applied server-side so the customer only sees the final price.

---

## Tasks

### 1. Create Migration File

Create `supabase/migrations/006_rls_policies.sql` with the **exact SQL** from BUILD_INDEX.md → Migration 006.

This includes:

**Helper function:**
- `is_admin()` — checks if current user has 'admin' or 'super_admin' role in user_profiles

**Public read tables (anon + authenticated):**
- site_settings (public ones only via `is_public = true` filter)
- navigation_items (active only)
- pages (published only)
- media (all)
- blind_categories (active only)
- blind_types (active only)
- blind_ranges (active only)
- price_matrices (all — needed for live pricing)
- vertical_slat_mapping (all)
- blind_extras (active only)
- extra_price_points (all)
- motorisation_options (active only)
- motorisation_prices (all)
- mechanism_lookup (all)

**Admin-only tables:**
- markup_config (NEVER public)
- price_imports
- import_mappings
- activity_log
- user_profiles (own profile OR admin)

**Insert by anyone, manage by admin:**
- orders (anyone can create, public can read by ID for guest checkout)
- order_items (same)
- saved_quotes (anyone can create, read by token)
- swatch_requests (anyone can create)
- measure_requests (anyone can create)
- contact_submissions (anyone can create)
- newsletter_subscribers (anyone can subscribe)

### 2. Run Migration

```bash
supabase db push
```

### 3. Create Admin Test User

In Supabase dashboard → Authentication → Users:
1. Create user: admin@blindly.co.za / strong password
2. After creation, update user_profiles row: set `role = 'admin'`

```sql
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@blindly.co.za';
```

### 4. Verify RLS Policies

Test with the Supabase SQL editor or API:

**As anonymous (no auth):**
```sql
-- Should work:
SELECT * FROM blind_categories WHERE is_active = true;
SELECT * FROM price_matrices LIMIT 5;
SELECT * FROM site_settings WHERE is_public = true;

-- Should return empty / be denied:
SELECT * FROM markup_config;  -- EMPTY (RLS blocks)
SELECT * FROM site_settings WHERE is_public = false;  -- EMPTY
SELECT * FROM price_imports;  -- EMPTY
SELECT * FROM activity_log;  -- EMPTY
```

**As admin user:**
```sql
-- Should work (all):
SELECT * FROM markup_config;
SELECT * FROM site_settings;  -- Including is_public = false
SELECT * FROM price_imports;
```

**Insert tests (anonymous):**
```sql
-- Should work:
INSERT INTO contact_submissions (name, email, message) VALUES ('Test', 'test@test.com', 'Hello');
INSERT INTO newsletter_subscribers (email) VALUES ('sub@test.com');

-- Clean up test data after
```

---

## Key Policy Details

### is_admin() Function
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

- `SECURITY DEFINER` — runs as the function owner, bypassing RLS on user_profiles to check the role
- `STABLE` — tells Postgres the result won't change within a single transaction (optimization)
- Checks `is_active = true` — deactivated admins are locked out immediately

### Price Matrix Security Note
Price matrices are public read because the configurator needs live price lookups. However, these are **supplier prices** — the customer never sees them directly. The pricing engine (server-side) applies markup before returning the customer price. The markup_config table (which contains the margin percentages) is admin-only.

### Orders — Guest Checkout
Orders use `FOR SELECT USING (true)` — any order can be read by anyone with its ID. This is intentional: guest checkout means there's no auth session to verify ownership. The order ID/number is effectively the access token. This is acceptable because order IDs are UUIDs (unguessable).

---

## Acceptance Criteria

```
✅ RLS enabled on ALL tables (no tables left without RLS)
✅ is_admin() function created and working
✅ Admin test user created and can access all tables
✅ Anonymous user can read active products, prices, extras, navigation, public settings
✅ Anonymous user CANNOT read markup_config, price_imports, import_mappings, activity_log
✅ Anonymous user CANNOT read site_settings where is_public = false
✅ Anonymous user CAN insert orders, contact_submissions, newsletter_subscribers, saved_quotes, swatch_requests, measure_requests
✅ Admin user has full CRUD on all tables
✅ User profiles: users can read/update own, admin can access all
✅ TypeScript types still valid
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The exact SQL is in BUILD_INDEX.md under "Migration 006 — RLS Policies"
- RLS policies must be applied AFTER all tables exist — that's why this is the last migration
- The `SECURITY DEFINER` on is_admin() is critical — without it, the function can't read user_profiles when RLS is active
- Test EVERY policy — a missed RLS policy is a security hole
- After this build, the database is fully secured and ready for application code
- Keep the admin test user credentials documented somewhere safe for the client handover
