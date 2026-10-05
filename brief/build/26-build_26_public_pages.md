# Build 26 — Public Pages: About, Contact, FAQ, Gallery

> **Type:** Frontend
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 24 (public layout)
> **Context Files:** PROJECT_BRIEF.md §9 (Pages), pages table schema

---

## Objective

Build the four supporting public pages. All content must come from the database (pages table or site_settings) — zero hardcoding per Yoros standards.

---

## Tasks

### 1. About Page

**`src/app/(public)/about/page.tsx`**

Content from `pages` table (slug = 'about'):

Sections:
- Hero with tagline
- Company story (who we are, part of Nortier Group)
- Service area (Western Cape + national delivery)
- Values / commitments (quality, custom-made, local manufacturing)
- Team section (optional — can be populated later)
- CTA: "Ready to get started?" → configurator link

Layout: alternating text-left/image-right sections for visual rhythm. Content from pages.content JSONB.

### 2. Contact Page

**`src/app/(public)/contact/page.tsx`**

```
  Get in Touch

  ┌────────────────────────────┐  ┌────────────────────────────┐
  │                            │  │                            │
  │  Contact Form              │  │  Contact Details           │
  │                            │  │                            │
  │  Name:  [____________]     │  │  📧 info@blindly.co.za     │
  │  Email: [____________]     │  │  📞 082 123 4567           │
  │  Phone: [____________]     │  │  💬 WhatsApp               │
  │  Message:                  │  │  📍 Paarl, Western Cape    │
  │  [                    ]    │  │                            │
  │  [                    ]    │  │  Business Hours            │
  │  [                    ]    │  │  Mon–Fri: 8am–5pm          │
  │                            │  │  Sat: 9am–1pm              │
  │  [Send Message →]          │  │                            │
  │                            │  │                            │
  └────────────────────────────┘  └────────────────────────────┘

  ── Need Help Choosing? ──

  ┌──────────────────────┐  ┌──────────────────────┐
  │  📐 Free Professional │  │  🎨 Free Colour      │
  │     Measurement       │  │     Swatches         │
  │                      │  │                      │
  │  We'll come to you   │  │  Order up to 5 free  │
  │  and measure your    │  │  swatches delivered   │
  │  windows for free.   │  │  to your door.       │
  │                      │  │                      │
  │  [Request Measure →] │  │  [Browse Swatches →] │
  └──────────────────────┘  └──────────────────────┘
```

**Contact form:**
- Submits to `contact_submissions` table
- Fields: name (required), email (required), phone (optional), message (required)
- Source: 'contact_form'
- Success toast + form reset
- Optional: honeypot field for basic spam protection

**Contact details:** All from site_settings (contact_email, contact_phone, contact_whatsapp, contact_address).

**WhatsApp link:** `https://wa.me/27821234567?text=Hi, I have a question about blinds.`

**CTAs:** Link to measure request (modal from Build 15/16) and product browse.

### 3. FAQ Page

**`src/app/(public)/faq/page.tsx`**

Accordion-style FAQ grouped by topic:

```
  Frequently Asked Questions

  ── Measuring ──
  
  ▸ How do I measure my window for blinds?
  ▸ What's the difference between inside and outside mount?
  ▸ What if my measurements are wrong?
  ▸ Can you measure for me?
  
  ── Ordering ──
  
  ▸ How does the configurator work?
  ▸ Can I save my quote and come back later?
  ▸ What payment methods do you accept?
  ▸ Can I change my order after placing it?
  
  ── Colours & Materials ──
  
  ▸ Will the colour match what I see on screen?
  ▸ Can I get a free swatch sample?
  ▸ What materials are available?
  
  ── Delivery & Installation ──
  
  ▸ How long does delivery take?
  ▸ Do you deliver nationwide?
  ▸ Is free delivery available?
  ▸ Do you offer installation?
  ▸ Can I install blinds myself?
  
  ── Returns & Warranty ──
  
  ▸ What is your return policy?
  ▸ What warranty do you offer?
  ▸ What if my blind is damaged on arrival?
```

**FAQ data source:** Store FAQs in the `pages` table (slug = 'faq') with content as JSONB:

```json
{
  "sections": [
    {
      "title": "Measuring",
      "items": [
        {
          "question": "How do I measure my window for blinds?",
          "answer": "To measure your window, use a steel tape measure..."
        }
      ]
    }
  ]
}
```

Or create a dedicated FAQ table if preferred.

**Accordion:** Use shadcn/ui Accordion component. One item open at a time.

**Seed with initial FAQ content** — the admin can update via the pages editor later.

### 4. Gallery Page

**`src/app/(public)/gallery/page.tsx`**

Installation showcase — photos of completed blind installations:

```
  Our Work

  Filter: [All] [Roller] [Venetian] [Wood] [Vertical]

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │          │  │          │  │          │  │          │
  │  [photo] │  │  [photo] │  │  [photo] │  │  [photo] │
  │          │  │          │  │          │  │          │
  │ Kitchen  │  │ Bedroom  │  │ Office   │  │ Lounge   │
  │ Roller   │  │ Venetian │  │ Vertical │  │ Wood     │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Data source:** `media` table filtered by `folder = 'gallery'`.

Each gallery item should have:
- Image (from media table)
- Caption / room name (from media.alt_text or a custom field)
- Category tag (for filtering)

**Lightbox:** Click image → fullscreen lightbox view with navigation.

**Admin workflow:** Upload images to media library with folder = 'gallery' → they appear on the gallery page automatically.

**Empty state:** If no gallery images exist, show: "Gallery coming soon. In the meantime, start configuring your perfect blinds." with CTA.

### 5. Seed Initial Content

Create entries in the `pages` table for each page:
- slug: 'about' — with placeholder content structure
- slug: 'faq' — with initial FAQ items
- slug: 'contact' — with any page-specific content

This ensures the pages render with sensible content even before the admin customises them.

---

## Acceptance Criteria

```
✅ About page renders with content from pages table
✅ Contact form submits to contact_submissions table
✅ Contact details pulled from site_settings
✅ WhatsApp link opens correctly
✅ FAQ page with accordion grouped by section
✅ FAQ content from pages table JSONB
✅ Gallery page loads images from media table (folder = 'gallery')
✅ Gallery filter by category works
✅ Gallery lightbox works
✅ Gallery empty state displays when no images
✅ All pages have correct SEO meta tags
✅ All content editable from admin (zero hardcoding)
✅ Initial content seeded for all pages
✅ Responsive on mobile
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- FAQ structured data (FAQPage schema) is handled in Build 27 — just make sure the data structure supports it
- The gallery is a "nice to have" that grows over time as the client takes installation photos — start with the empty state
- Contact form should have basic validation and a honeypot field for spam
- Use the pages table's JSONB `content` field for structured page data — not separate text fields
- For the lightbox, a simple CSS/JS approach or a lightweight library works fine
- All pages should have a final CTA section driving to the configurator
