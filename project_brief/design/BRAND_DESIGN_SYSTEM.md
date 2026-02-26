# BLINDLY — Brand Identity & Design System

> **Version:** 1.0
> **Date:** 19 February 2026
> **Status:** Research complete — ready for implementation

---

## 1. Competitive Landscape

### International Premium (aspirational targets)
- **The Shade Store** (US) — Ultra-premium. White/cream palette, serif typography, lifestyle photography-heavy. Free swatches + professional measure as key CTAs. Feels like a luxury fashion brand, not a blinds shop.
- **Blinds 2go** (UK) — Largest UK online blinds retailer. More mass-market. Heavy product photography, filter-based navigation, colour-by-colour browsing. SureSize guarantee as trust signal.
- **Interior Define** — Excellent multi-step configurator UX. Five clear steps with progress indicator. Mobile-optimised. Shows how to do wizard-style configuration properly.

### South African Market (direct competitors)
- **Blinds Direct SA** (blindsdirect.co.za) — SA market leader since 2013. Functional but dated design. "Blinds Builder" instant quote tool. Free delivery over R1,000.
- **BlindCraft** (blindcraft.co.za) — "Blinds Builder™ in 30 seconds" approach. Free swatches. SABS approved. More modern feel than most SA competitors.
- **Blinds Online SA** (blindsonline.co.za) — Factory-direct model. Simple 5-step process. Express shipping. Clean but basic.
- **Taylor Blinds** (taylorblinds.co.za) — SA's biggest manufacturer/brand (via Trellidor). More B2B/showroom focused. Premium lifestyle imagery. Not direct online sales.
- **Blind Designs** (blinddesigns.co.za) — 40+ years in SA. Room-by-room approach to product browsing. Good lifestyle photography. More inspirational, less transactional.

### Opportunity
Most SA blinds sites look dated or purely functional. Nobody is combining premium brand feel + online configurator + smart pricing in the SA market. Blindly can own the space between "premium brand" (Taylor) and "online configurator" (Blinds Direct) — the premium online experience doesn't exist yet in SA.

---

## 2. Brand Personality

### Position
**"Premium online, not high-street."**
Blindly sits between budget online retailers (Blinds Direct, Blinds Online) and premium showroom brands (Taylor, The Shade Store). It's for homeowners who want quality but prefer to shop online, expect a modern experience, and don't want to book a showroom visit for a simple purchase.

### Voice
- Confident but not arrogant
- Knowledgeable but not jargon-heavy  
- Warm but not overly casual
- Helpful without being pushy
- South African without being provincial

### Differentiators
1. Guided configurator (not a product list with a size field)
2. Smart validation (inside/outside mount logic, depth warnings)
3. Multi-window flow (because nobody buys one blind)
4. Quote save & share (for the spouse-approval workflow)
5. Room preview (stretch goal — nobody in SA has this)
6. Professional measure / installation cross-sell built in

---

## 3. Colour Palette

### Design Philosophy
Warm neutrals grounded by a sophisticated charcoal, with a single refined accent colour. The palette should feel like a beautifully decorated room — not a tech product. It must work well alongside any blind colour/material photography without clashing.

### Primary Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Background** | Linen | `#F5F0EB` | Primary page background — warm white, not clinical |
| **Surface** | Ivory | `#FDFBF7` | Cards, modals, configurator steps — slightly lighter |
| **Text Primary** | Charcoal | `#2C2C2C` | Headings, primary text — rich black without being harsh |
| **Text Secondary** | Stone | `#6B6560` | Secondary text, descriptions, labels |
| **Border** | Sand | `#DDD5CA` | Dividers, borders, input outlines |
| **Accent** | Terracotta | `#C4663A` | CTAs, active states, price highlights, progress indicator |
| **Accent Hover** | Burnt Sienna | `#A8522B` | Hover/pressed state for accent elements |
| **Success** | Sage | `#6B8F71` | Confirmations, checkmarks, "in stock" indicators |
| **Warning** | Amber | `#D4A843` | Warnings, measurement caution, disclaimers |
| **Error** | Clay Red | `#C44B3A` | Errors, validation failures |
| **Dark Surface** | Espresso | `#3A3632` | Footer, admin sidebar, dark section backgrounds |

### Why Terracotta?
Terracotta is warm, earthy, and distinctly *not* the default blue/purple/green that every tech product uses. It connects to home interiors (terracotta pots, warm-toned rooms, natural materials) while being bold enough to work as a CTA colour. It pops against the warm neutrals without clashing with blind product photography.

### Dark Mode Adaptation
Dark mode is required per Yoros standards but should feel warm, not cold. Use the Espresso (`#3A3632`) as the base rather than pure black, with Ivory (`#FDFBF7`) for text. The Terracotta accent stays the same.

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Background | `#F5F0EB` | `#2A2725` |
| Surface | `#FDFBF7` | `#3A3632` |
| Text Primary | `#2C2C2C` | `#F5F0EB` |
| Text Secondary | `#6B6560` | `#A8A099` |
| Border | `#DDD5CA` | `#4A4540` |
| Accent | `#C4663A` | `#C4663A` |

---

## 4. Typography

### Design Philosophy
A distinctive heading font that feels premium and designed, paired with a highly readable body font. Both available on Google Fonts for easy Next.js integration via `next/font`.

### Font Selection

**Headings: DM Serif Display**
- Category: Serif display
- Why: Elegant, high-contrast serif with character. Feels premium and interior-design-oriented without being stuffy. The contrast between thick and thin strokes echoes the interplay of light and shadow through blinds. Works beautifully at large sizes.
- Weights: 400 (Regular) — display fonts only need one weight
- Use: H1, H2, hero text, configurator step titles, product names

**Body: DM Sans**  
- Category: Geometric sans-serif
- Why: Clean, modern, extremely readable. Part of the same DM family as DM Serif Display, so they share geometric DNA and pair naturally. Low contrast makes it excellent for body text, UI elements, and small sizes.
- Weights: 400 (Regular), 500 (Medium), 700 (Bold)
- Use: Body text, buttons, labels, navigation, form inputs, prices

**Monospace (prices/measurements): JetBrains Mono**
- Category: Monospace
- Why: Clean monospace for displaying measurements (1200mm × 800mm) and prices (R2,450). Adds a technical precision feel to the configurator dimensions.
- Weights: 400, 500
- Use: Price displays, measurement inputs, dimension readouts only

### Type Scale

```css
/* Headings — DM Serif Display */
--text-hero: 3.5rem;     /* 56px — homepage hero, major sections */
--text-h1: 2.5rem;       /* 40px — page titles */
--text-h2: 2rem;         /* 32px — section headings */
--text-h3: 1.5rem;       /* 24px — card titles, step names */
--text-h4: 1.25rem;      /* 20px — sub-sections */

/* Body — DM Sans */
--text-lg: 1.125rem;     /* 18px — lead paragraphs, feature descriptions */
--text-base: 1rem;       /* 16px — default body text */
--text-sm: 0.875rem;     /* 14px — secondary text, labels */
--text-xs: 0.75rem;      /* 12px — fine print, disclaimers */

/* Prices/Measurements — JetBrains Mono */
--text-price-lg: 1.75rem; /* 28px — prominent price display */
--text-price-md: 1.25rem; /* 20px — line item prices */
--text-price-sm: 1rem;    /* 16px — small price references */
```

---

## 5. Logo Design Brief

### Concept: "Light Through Slats"
The logo should evoke the core experience of blinds — controlling light. Horizontal lines with strategic gaps where the background shows through, creating a "see-through" effect.

### Specifications
- **Format:** SVG with transparent areas where background shines through
- **Mark:** Abstract "B" or window shape formed by horizontal parallel lines with varying gaps — some open (light), some closed (shadow)
- **Wordmark:** "BLINDLY" set in DM Serif Display, letterspaced slightly, with the logo mark either to the left or integrated into the "B"
- **Colours:** Works in Charcoal (#2C2C2C), Ivory (#FDFBF7), and Terracotta (#C4663A) — single colour applications
- **Sizes:** Must be recognisable at 24px height (favicon) and beautiful at 200px+ (hero)
- **Avoid:** 4-pane window grid (Microsoft), literal curtains, generic house icons, overly complex illustration

### Logo Variations Needed
1. **Full logo** — mark + wordmark (horizontal layout)
2. **Stacked logo** — mark above wordmark
3. **Mark only** — for favicon, loading states, watermarks
4. **Dark variant** — for dark backgrounds / dark mode
5. **Single colour** — for email footers, embossing, etc.

---

## 6. Layout & Spatial Design

### Grid System
- **Max content width:** 1280px (Tailwind `max-w-7xl`)
- **Configurator max width:** 960px (Tailwind `max-w-5xl`) — tighter for focused flow
- **Section padding:** 80px vertical (desktop), 48px (mobile)
- **Card padding:** 24px (desktop), 16px (mobile)
- **Component spacing:** 8px base unit (Tailwind's default scale)

### Homepage Layout

```
┌─────────────────────────────────────────────────┐
│  HERO                                           │
│  Full-width lifestyle image of room with blinds │
│  Overlay: "Your windows, your way."             │
│  CTA: [Start Configuring] [Browse Products]     │
│  (Background shines through logo mark subtly)   │
├─────────────────────────────────────────────────┤
│  CATEGORIES                                     │
│  4 large cards (Roller, Aluminium, Wood, Vert.) │
│  Each: lifestyle photo + name + "X ranges"      │
│  Hover: subtle zoom + overlay                   │
├─────────────────────────────────────────────────┤
│  HOW IT WORKS                                   │
│  3-4 steps with icons + short descriptions      │
│  "Choose → Customise → Order → Enjoy"           │
├─────────────────────────────────────────────────┤
│  TRUST SIGNALS                                  │
│  "Free delivery over R[x]" "Professional Install│
│  Available" "5-Star Reviews" "SA Manufactured"   │
├─────────────────────────────────────────────────┤
│  CTA BANNER                                     │
│  "Not sure what you need?"                      │
│  [Request a Free Measure] [Browse by Room]      │
├─────────────────────────────────────────────────┤
│  NEWSLETTER + FOOTER                            │
└─────────────────────────────────────────────────┘
```

### Configurator Layout

```
Desktop (>1024px):
┌──────────────────────────────────────────────────┐
│  Progress Bar: ● ● ● ○ ○ ○ ○ ○ (Step 3 of 8)   │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│  Step    │   Selection Area                      │
│  Title   │   (Cards / Swatches / Inputs)         │
│          │                                       │
│  Help    │                                       │
│  text    │                                       │
│          │                                       │
│          ├───────────────────────────────────────┤
│          │   Running Summary / Live Price         │
│          │   [Back]              [Continue →]     │
└──────────┴───────────────────────────────────────┘

Mobile (<768px):
┌────────────────────────┐
│  ← Step 3 of 8         │
│  Progress dots          │
├────────────────────────┤
│                        │
│  Step Title            │
│  Help text             │
│                        │
│  Selection Area        │
│  (full width)          │
│                        │
├────────────────────────┤
│  R2,450  [Continue →]  │  ← Sticky bottom bar
└────────────────────────┘
```

### Key UX Patterns (from research)

1. **Linear progression with back-tracking** — steps go forward, but user can click any completed step to go back. Never force restart.
2. **Live price always visible** — on desktop: right sidebar or bottom of selection area. On mobile: sticky bottom bar with price + CTA.
3. **Smart defaults** — pre-select the most popular option at each step (e.g., outside mount, 50mm for venetians). User changes if needed.
4. **Contextual help, not manuals** — tooltips and expandable hints within each step, not separate help pages.
5. **Save & resume** — configuration saved to localStorage + optional email save. "Pick up where you left off" on return.
6. **Progress indicator** — show completed, current, and remaining steps. Clicking completed steps navigates back.
7. **Validation at each step** — don't let user proceed past measurement step without valid dimensions. Show errors inline.
8. **Disclaimers as confirmation gates** — checkboxes that must be ticked before proceeding (colour, measurements, frame depth).

---

## 7. Component Style Guide

### Buttons

```
Primary:    bg-[#C4663A] text-white rounded-lg px-6 py-3 font-medium
            hover:bg-[#A8522B] transition-colors
            
Secondary:  bg-transparent border-2 border-[#C4663A] text-[#C4663A] 
            rounded-lg px-6 py-3 font-medium
            hover:bg-[#C4663A] hover:text-white transition-colors

Ghost:      bg-transparent text-[#6B6560] px-4 py-2
            hover:text-[#2C2C2C] hover:bg-[#DDD5CA]/30 transition-colors
```

### Cards (Product/Category)

```
Surface bg, rounded-xl, subtle shadow (shadow-sm), 
overflow-hidden for image at top.
Hover: translate-y-[-2px], shadow-md, 200ms transition.
Image: aspect-[4/3], object-cover.
Content: p-6, title in DM Serif Display, description in DM Sans.
```

### Swatch Selectors

```
Colour swatches: 48px circles with 2px border.
Selected: 3px border in Terracotta + small checkmark overlay.
Hover: scale(1.1) with 150ms transition.
Colour name tooltip on hover.
```

### Form Inputs

```
bg-[#FDFBF7] border border-[#DDD5CA] rounded-lg px-4 py-3
text-[#2C2C2C] placeholder-[#A8A099]
focus:border-[#C4663A] focus:ring-2 focus:ring-[#C4663A]/20
transition-all duration-200
```

### Disclaimer Checkboxes

```
Custom checkbox: 24px square, rounded-md, border-2 border-[#DDD5CA]
Checked: bg-[#C4663A] border-[#C4663A] with white checkmark
Associated text: text-sm text-[#6B6560], slightly reduced line-height
Warning icon (⚠️) in Amber before disclaimer text
```

### Progress Bar (Configurator)

```
Horizontal dots connected by line.
Completed: filled Terracotta circle + Terracotta line
Current: filled Terracotta circle with pulse animation
Upcoming: border-only circle + Stone line
Step labels below dots on desktop, hidden on mobile.
```

---

## 8. Imagery Guidelines

### Photography Style
- **Lifestyle shots:** Rooms with blinds installed. Natural light. Warm tones. South African home aesthetic (not US/UK suburbs). Show diverse room types: modern kitchen, cosy bedroom, bright living room, home office.
- **Product close-ups:** Fabric/material textures. Slat detail. Mechanism close-ups. Shot on neutral linen background to match site palette.
- **Swatch photography:** Consistent size, angle, lighting. Flat lay on linen/wood background. Show fabric drape for rollers, slat angle for venetians.

### Image Treatment
- Lifestyle images: subtle warm colour grade, slight vignette
- Product images: neutral, accurate colours (these need to be true-to-product)
- Hero images: may have subtle gradient overlay (Espresso → transparent) for text readability
- All images: rounded-xl corners on cards, full-bleed on heroes

### Placeholder Strategy (until client provides photography)
- Use high-quality stock from Unsplash (interior/home categories)
- Apply consistent warm colour grade to maintain brand cohesion
- Replace with real product/installation photography as it becomes available
- Flag every placeholder image in admin so client knows what needs replacing

---

## 9. Animation & Micro-interactions

### Page Transitions
- Subtle fade-in on route change (200ms)
- Configurator steps: slide-in from right (forward) or left (backward), 300ms ease-out

### Scroll Animations
- Cards and sections: fade-up on scroll into view (IntersectionObserver)
- Staggered delays for grid items (50ms between each)
- Keep subtle — this is a purchase flow, not a portfolio site

### Interactive Elements
- Buttons: scale(0.98) on press, 100ms
- Cards: translateY(-2px) + shadow lift on hover, 200ms
- Swatch selection: scale(1.1) + border change, 150ms
- Price update: number counter animation when price changes (200ms)
- Progress bar: dot fill animation with subtle bounce, 300ms
- Checkbox: spring animation on check, 200ms

### Loading States
- Skeleton loaders matching card/content shape
- Pulse animation in Sand colour (#DDD5CA)
- Price calculation: brief shimmer effect while computing

---

## 10. Tailwind Configuration

```js
// tailwind.config.ts — Blindly brand tokens
const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          linen: '#F5F0EB',
          ivory: '#FDFBF7',
          charcoal: '#2C2C2C',
          stone: '#6B6560',
          sand: '#DDD5CA',
          terracotta: '#C4663A',
          sienna: '#A8522B',
          sage: '#6B8F71',
          amber: '#D4A843',
          clay: '#C44B3A',
          espresso: '#3A3632',
        },
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      maxWidth: {
        configurator: '960px',
      },
    },
  },
};
```

---

## 11. Responsive Breakpoints

| Breakpoint | Width | Focus |
|-----------|-------|-------|
| Mobile | < 640px | Single column, full-width cards, sticky bottom CTA bar, hamburger nav |
| Tablet | 640–1023px | 2-column grids, side-by-side in configurator |
| Desktop | 1024–1279px | Full layout, sidebar in configurator, horizontal progress bar |
| Wide | 1280px+ | Max-width container, generous whitespace |

### Mobile-Specific Patterns
- Configurator: full-screen steps, sticky price bar at bottom
- Product browse: 2-column card grid
- Cart: stacked items with expandable detail
- Navigation: hamburger → full-screen overlay (not slide-out drawer)
- Swatch selectors: scrollable horizontal row, not wrapping grid
