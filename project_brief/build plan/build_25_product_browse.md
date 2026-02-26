# Build 25 — Public Pages: Product Browse

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 10 (pricing), Build 24 (public layout)
> **Context Files:** Product data, BRAND_DESIGN_SYSTEM.md

---

## Objective

Build the 3-level product browse experience: categories → types → ranges. This gives customers an alternative entry point to the configurator — they can browse and explore before committing to configure. The challenge: make 4 categories and ~40 ranges feel like a full showroom.

---

## Tasks

### 1. Products Landing Page

**`src/app/(public)/products/page.tsx`**

```
  Our Blinds Collection

  Find the perfect blind for every room in your home.

  ┌───────────────────────────────┐  ┌───────────────────────────────┐
  │                               │  │                               │
  │   [lifestyle hero image]      │  │   [lifestyle hero image]      │
  │                               │  │                               │
  │   Roller Blinds               │  │   Aluminium Venetian          │
  │   Clean, modern blinds that   │  │   Classic slatted blinds      │
  │   roll up into a compact      │  │   in lightweight aluminium.   │
  │   headrail.                   │  │                               │
  │                               │  │                               │
  │   12 ranges · From R 450      │  │   5 ranges · From R 310       │
  │   [Explore →]                 │  │   [Explore →]                 │
  └───────────────────────────────┘  └───────────────────────────────┘

  ┌───────────────────────────────┐  ┌───────────────────────────────┐
  │                               │  │                               │
  │   [lifestyle hero image]      │  │   [lifestyle hero image]      │
  │                               │  │                               │
  │   Wood & Natural Venetian     │  │   Vertical Blinds             │
  │   ...                         │  │   ...                         │
  └───────────────────────────────┘  └───────────────────────────────┘
```

Large lifestyle cards (16:9 or similar aspect ratio). Show range count and lowest starting price.

### 2. Category Page

**`src/app/(public)/products/[category-slug]/page.tsx`**

```
  Breadcrumb: Products > Roller Blinds

  Roller Blinds

  [category description from DB]

  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  [swatch]   │  │  [swatch]   │  │  [swatch]   │
  │             │  │             │  │             │
  │  Beach      │  │  Cedar      │  │  Sanctuary  │
  │             │  │             │  │  LF         │
  │  ● ● ● ● ● │  │  ● ● ● ●   │  │  ● ● ● ● ● │
  │  8 colours  │  │  6 colours  │  │  10 colours │
  │             │  │             │  │             │
  │  From R 450 │  │  From R 520 │  │  From R 680 │
  │             │  │             │  │             │
  │ [Configure] │  │ [Configure] │  │ [Configure] │
  └─────────────┘  └─────────────┘  └─────────────┘
```

**For categories with multiple types (Aluminium Venetian, Wood Venetian):**

Show types first as a sub-navigation or filter:

```
  Filter by type: [All] [25mm] [50mm]
```

Or show types as sections with their ranges underneath.

**"Configure" button:** Links to `/configure` with the category and range pre-selected (jumps to Step 2 in the configurator).

### 3. Type/Range Detail (Optional)

If a category has distinct types (25mm vs 50mm), optionally add:

**`src/app/(public)/products/[category-slug]/[type-slug]/page.tsx`**

Shows ranges within that specific type. Same layout as category page but filtered.

### 4. Breadcrumb Navigation

On all product pages:
```
Products > Roller Blinds > Beach
```

Each segment is a clickable link. Use `BreadcrumbList` structured data for SEO.

### 5. Making 5 Products Feel Like a Showroom

Design techniques to make a small catalogue feel rich:

- **Large imagery:** Use lifestyle photos as hero images on category cards
- **Colour swatch strips:** Show 4-6 colour dots per range card (pulls from colour_options)
- **"X colours available"** text on each range card
- **Descriptive text:** Each range has a description that paints a picture
- **Hover effects:** Cards lift with shadow, swatch dots enlarge on hover
- **Starting price anchor:** "From R X" creates a price range feeling
- **Filter feel:** Even simple type filtering (25mm / 50mm) makes it feel like a larger catalogue
- **Related products:** "Also consider..." section at the bottom of range pages

### 6. Pre-Selected Configurator Entry

When a customer clicks "Configure" on a product card, the configurator should start with that product pre-selected:

```
/configure?category=roller-blinds&range=beach
```

The configurator reads URL params and skips to the appropriate step (Step 2 — mount type, since category and range are already chosen).

### 7. SEO per Page

Each product page needs:
- Unique title: "Beach Roller Blinds | Blindly"
- Meta description: from range/category description
- OG image: lifestyle or swatch image
- Breadcrumb structured data
- Product structured data (for ranges with prices)

---

## Acceptance Criteria

```
✅ Products landing page shows all 4 categories with lifestyle cards
✅ Category pages show ranges with swatch previews and starting prices
✅ Colour dot strips show on range cards (from colour_options JSONB)
✅ "Configure" button links to configurator with pre-selected product
✅ Breadcrumb navigation on all pages
✅ Type filtering works for multi-type categories
✅ Pages feel rich and full despite small catalogue
✅ All content from database
✅ SEO meta tags on every page
✅ Responsive on mobile
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- The key challenge is making 4 categories and ~40 ranges feel like a proper e-commerce showroom — use design to compensate for catalogue size
- Fetch categories with a count of their ranges and types for display
- Starting prices: use the `starting_price_cents` cached on blind_ranges (includes markup)
- Colour dots: render from the colour_options JSONB array — show hex circles
- If no lifestyle images are available yet, use warm neutral gradient backgrounds with the swatch image overlaid
- The "Configure" link with pre-selection is a key conversion path — make sure it works correctly with the configurator state from Build 15
