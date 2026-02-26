# Build 24 — Public Pages: Homepage & Layout

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 02 (site_settings, navigation)
> **Context Files:** PROJECT_BRIEF.md §9 (Pages), BRAND_DESIGN_SYSTEM.md

---

## Objective

Build the public-facing layout (header, footer, navigation) and the homepage. This is the first thing visitors see — it needs to feel premium, warm, and trustworthy while directing them to the configurator.

---

## Tasks

### 1. Public Layout

**`src/app/(public)/layout.tsx`**

#### Header
```
┌──────────────────────────────────────────────────────────────┐
│  [Blindly Logo]          [Products] [How It Works] [About]   │
│                          [Contact] [FAQ]    [🌓]  [Cart (2)] │
└──────────────────────────────────────────────────────────────┘
```

- Logo: from site_settings (`logo_url`) — links to /
- Navigation: from `navigation_items` table (location = 'header')
- Dark mode toggle
- Cart icon with item count badge (from localStorage cart)
- Sticky on scroll (with reduced height)
- Mobile: hamburger → slide-out sheet (shadcn Sheet)

#### Footer
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [Blindly Logo]                                              │
│                                                              │
│  Quick Links        Contact          Newsletter              │
│  ─────────────      ───────          ──────────              │
│  Products           info@blindly.co.za  Get updates on new   │
│  How It Works       082 123 4567     ranges and offers.      │
│  About Us           WhatsApp         [email input] [→]       │
│  Contact            Paarl, WC                                │
│  FAQ                                                         │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│  © 2026 Blindly. Part of the Nortier Group.                  │
│  [Privacy] [Terms]  [Facebook] [Instagram]                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Footer links: from `navigation_items` (location = 'footer' and 'footer_legal')
- Contact info: from site_settings
- Social links: from site_settings
- Newsletter signup: insert into `newsletter_subscribers` table

All content pulled from DB — zero hardcoding per Yoros standards.

### 2. Newsletter Signup

Server action for newsletter:
```typescript
'use server'
export async function subscribeNewsletter(email: string) {
  // Validate email
  // Check if already subscribed
  // Insert into newsletter_subscribers
  // Return success/error
}
```

Show toast on success: "You're subscribed! We'll keep you updated."

### 3. Homepage

**`src/app/(public)/page.tsx`**

#### Section 1: Hero
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Premium Custom Blinds,                                      │
│  Configured Your Way.                                        │
│                                                              │
│  Choose your style, enter your measurements,                 │
│  and we'll handle the rest.                                  │
│                                                              │
│  [Start Configuring →]      [Browse Products]                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Background: warm neutral gradient or lifestyle image
- DM Serif Display for heading
- Primary CTA: terracotta button → `/configure`
- Secondary CTA: outlined button → `/products`

#### Section 2: Category Showcase
```
  Explore Our Range

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ [image]  │  │ [image]  │  │ [image]  │  │ [image]  │
  │          │  │          │  │          │  │          │
  │ Roller   │  │ Alum.    │  │ Wood &   │  │ Vertical │
  │ Blinds   │  │ Venetian │  │ Natural  │  │ Blinds   │
  │          │  │          │  │          │  │          │
  │ From R450│  │ From R310│  │ From R520│  │ From R690│
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

- Cards link to `/configure` with category pre-selected
- Starting prices from `blind_categories` → ranges → `starting_price_cents`
- Lifestyle images from category `image_url`

#### Section 3: How It Works
```
  How It Works

  [1]           [2]            [3]           [4]
  Choose        Measure        Configure     Delivered
  
  Pick your     Measure your   Select your   We deliver
  blind type    window or      colour and    and optionally
  and style.    request a      customise     install your
                free measure.  your blind.   perfect blinds.
```

- 4-step horizontal timeline on desktop, vertical on mobile
- Numbered circles with icons
- Brief description per step

#### Section 4: Trust Signals
```
  Why Choose Blindly?

  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ 📐          │  │ 🚚          │  │ 🔧          │  │ ⭐          │
  │ Custom Made │  │ Free        │  │ Professional│  │ Quality     │
  │ Every blind │  │ Delivery    │  │ Install     │  │ Guaranteed  │
  │ made to     │  │ on orders   │  │ available   │  │ Premium     │
  │ your exact  │  │ over R5,000 │  │ across the  │  │ materials   │
  │ measurements│  │             │  │ Western Cape│  │ & finishes  │
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

#### Section 5: CTA Banner
```
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Ready to transform your space?                              │
  │                                                              │
  │  [Start Configuring Your Blinds →]                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

Terracotta background, white text, large CTA button.

#### Section 6: Newsletter
```
  Stay in the Loop

  Get notified about new ranges, seasonal offers, and design tips.
  
  [email@example.com        ] [Subscribe →]
```

### 4. Cookie Consent

Simple banner at bottom of page:
```
┌──────────────────────────────────────────────────────────────┐
│  We use cookies to improve your experience.                  │
│  [Accept] [Decline] [Learn More]                             │
└──────────────────────────────────────────────────────────────┘
```

- Store preference in localStorage
- "Learn More" links to privacy policy page
- Only show on first visit

### 5. Mobile Navigation

- Hamburger icon in header
- Slide-out sheet from right
- All nav items + dark mode toggle + cart link
- Close on navigation or outside click

---

## Acceptance Criteria

```
✅ Header displays logo, navigation from DB, dark mode toggle, cart count
✅ Header is sticky on scroll
✅ Mobile hamburger menu works (slide-out sheet)
✅ Footer displays links from DB, contact info from site_settings, social links
✅ Newsletter signup creates subscriber record
✅ Homepage hero with brand styling and CTA buttons
✅ Category showcase cards with real data and starting prices
✅ "How It Works" section with 4 steps
✅ Trust signals section
✅ CTA banner with terracotta background
✅ Newsletter section works
✅ Cookie consent banner shows once, preference saved
✅ All content from database — zero hardcoding
✅ Fully responsive (mobile, tablet, desktop)
✅ Dark mode works across all sections
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- This is the brand showcase — use the full design system (DM Serif Display headings, DM Sans body, warm neutrals, terracotta accents)
- Max content width: 1280px (from brand design system)
- Section padding: 80px vertical (from brand design system)
- The homepage content should come from the `pages` table (slug = 'home') and/or site_settings — but it's OK to have sensible defaults that render without DB content for initial setup
- Images: use placeholder images for now (can be replaced later) — but make sure image_url fields are wired to the DB so the admin can update them
- The cart count in the header reads from localStorage — it's a Client Component badge on an otherwise Server Component header
