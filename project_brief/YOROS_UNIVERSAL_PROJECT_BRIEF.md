# YOROS — Universal Project Standards
## Copy-paste this into every new project as the baseline requirements

> **What this is**: Non-negotiable standards for every Yoros project regardless of scope.
> These are YOUR requirements as the developer — not the client's feature list.
> Paste this into your Claude project, task manager, or project README before starting any build.

---

## 1. ZERO HARDCODING RULE

**Nothing is hardcoded. Everything is admin-editable.**

- [ ] No hardcoded text in components — all copy comes from DB (Supabase) or CMS
- [ ] No hardcoded images — all images served from Supabase Storage or Bunny CDN, URLs stored in DB
- [ ] No hardcoded colours — theme colours defined in Tailwind config, sourced from brand guide or DB
- [ ] No hardcoded nav links — navigation items stored in DB, admin-reorderable
- [ ] No hardcoded footer content — links, social URLs, contact info all from DB
- [ ] No hardcoded pricing — all prices in `pricing_config` or equivalent table
- [ ] No hardcoded SEO meta — title, description, OG image per page from DB or generateMetadata
- [ ] No hardcoded email addresses or phone numbers — all from site_settings table
- [ ] No magic numbers — constants defined in config, not buried in components

**The test**: Can the client change any visible text, image, or link from the admin panel without touching code? If no, it's hardcoded.

---

## 2. TECH STACK (Standard)

- [ ] **Framework**: Next.js (App Router, TypeScript, Server Components by default)
- [ ] **Styling**: Tailwind CSS + shadcn/ui component library
- [ ] **Database**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- [ ] **Hosting**: Vercel (Git deploy, serverless functions, cron)
- [ ] **Payments**: Paystack (SA market) — REST API + webhooks
- [ ] **Email**: Resend + React Email templates
- [ ] **CDN**: Bunny.net (media/video) + Vercel Edge (static)
- [ ] **AI**: Anthropic Claude Haiku (writing assistant, brief generation)
- [ ] **Analytics**: Google Analytics 4 + Google Search Console

---

## 3. SEO — NON-NEGOTIABLE

Every page must have:

- [ ] **Unique title tag** — `<title>Page Name | Business Name</title>`
- [ ] **Meta description** — unique per page, 150–160 chars
- [ ] **Open Graph tags** — og:title, og:description, og:image, og:url, og:type
- [ ] **Twitter card tags** — twitter:card, twitter:title, twitter:description, twitter:image
- [ ] **Canonical URL** — self-referencing canonical on every page
- [ ] **Structured data (JSON-LD)**:
  - Homepage: `Organization`
  - Service pages: `Service` + `BreadcrumbList`
  - Blog posts: `BlogPosting` + `BreadcrumbList`
  - Portfolio: `BreadcrumbList`
  - Contact: `LocalBusiness` (if applicable)
  - FAQ sections: `FAQPage`
- [ ] **Sitemap** — auto-generated `sitemap.xml` (Next.js `app/sitemap.ts`), includes all public routes + dynamic pages
- [ ] **robots.txt** — auto-generated (`app/robots.ts`), allow public routes, disallow `/portal/*`, `/admin/*`, `/api/*`, `/auth/*`
- [ ] **Clean URLs** — lowercase, no trailing slashes, hyphens not underscores
- [ ] **404 page** — branded, with search/navigation links, not default Next.js
- [ ] **Heading hierarchy** — single H1 per page, logical H2→H3→H4 structure
- [ ] **Alt text** — every image has descriptive alt text (stored in DB with image)
- [ ] **Internal linking** — related content links, breadcrumb navigation
- [ ] **Page speed** — images optimised, lazy loaded, Core Web Vitals targets met

---

## 4. PERFORMANCE TARGETS

| Metric | Target |
|---|---|
| Lighthouse Performance | > 85 (aim for > 90) |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| TTFB (Time to First Byte) | < 800ms |

**How to achieve:**
- [ ] All images via Next.js `<Image>` (automatic WebP/AVIF, lazy load, blur placeholder)
- [ ] Fonts via `next/font` (self-hosted, no layout shift)
- [ ] Code splitting — automatic per-route, dynamic imports for heavy components
- [ ] No unused JS/CSS bundles
- [ ] Prefetching on critical navigation links
- [ ] ISR (Incremental Static Regeneration) for content pages, SWR for portal data

---

## 5. DARK MODE — STANDARD ON EVERY PROJECT

- [ ] Dark mode toggle in navbar (sun/moon icon)
- [ ] Persisted in localStorage (or cookie for SSR)
- [ ] System preference detection on first visit (`prefers-color-scheme`)
- [ ] Tailwind `dark:` variants on all components
- [ ] No flash of wrong theme on page load (script in `<head>` or cookie-based)
- [ ] All colours have dark mode equivalents — no white-on-white or black-on-black
- [ ] Images/logos have dark mode variants where needed (or use CSS filter)
- [ ] Admin can preview both modes

---

## 6. RESPONSIVE DESIGN — MOBILE FIRST

- [ ] Mobile-first approach — design for 375px up, then scale
- [ ] Breakpoints: `sm` (640), `md` (768), `lg` (1024), `xl` (1280), `2xl` (1536)
- [ ] Touch-friendly tap targets (min 44×44px)
- [ ] No horizontal scroll on any viewport
- [ ] Mobile navigation (hamburger menu or bottom sheet)
- [ ] Portal: mobile-optimised sidebar (collapsible or bottom tabs)
- [ ] Test on: iPhone SE (small), iPhone 14 (standard), iPad (tablet), Desktop (1440px+)
- [ ] Images responsive — `sizes` attribute on all `<Image>` components

---

## 7. ADMIN PANEL — FULL CRUD

Every project gets a `/admin` area with:

- [ ] **Role-based access** — admin only (JWT role check in middleware)
- [ ] **Dashboard** — overview stats, recent activity, pending actions
- [ ] **Content management** — CRUD for all page sections, text, images
- [ ] **Navigation management** — add/edit/reorder/delete nav links and footer links
- [ ] **Site settings** — business name, contact info, social links, logo, favicon
- [ ] **Media library** — upload/manage images (Supabase Storage)
- [ ] **SEO per page** — edit title, description, OG image from admin
- [ ] **Blog management** — create/edit/publish/archive posts with markdown editor
- [ ] **Portfolio management** — add/edit/reorder/publish case studies
- [ ] **Form submissions** — view contact form entries, lead data
- [ ] **Analytics view** — basic traffic stats or link to GA4

**CRUD pattern for every entity:**
- List view with search, filter, sort, pagination
- Create form with validation
- Edit form (pre-populated)
- Delete with confirmation
- Soft delete where appropriate (archive, not destroy)
- Activity logging (who changed what, when)

---

## 8. AUTHENTICATION

- [ ] Supabase Auth (email + password)
- [ ] Registration with validation (8+ chars, 1 number, confirm match)
- [ ] Email confirmation flow
- [ ] Password reset (forgot password → email → reset page)
- [ ] Auth callback handler (`/auth/callback`)
- [ ] Middleware route protection:
  - `/portal/*` — authenticated users only
  - `/admin/*` — admin role only
  - `/login`, `/register` — redirect to portal if already logged in
- [ ] JWT custom claims hook (role in token, no DB query per request)
- [ ] Auto-create user profile on signup (DB trigger)
- [ ] Session refresh in middleware
- [ ] Sign out (clear session, redirect to home)
- [ ] Navbar auth state (Login button / Dashboard + avatar)

---

## 9. DATABASE STANDARDS

- [ ] **UUIDs** as primary keys (not auto-increment)
- [ ] **Timestamps** — `created_at` and `updated_at` on every table
- [ ] **Soft deletes** where appropriate (`deleted_at` timestamp, null = active)
- [ ] **RLS (Row Level Security)** on every table — no exceptions
  - Public tables: read-only for anon
  - User tables: own data only
  - Admin tables: admin role check
- [ ] **Indexes** on all foreign keys and frequently queried columns
- [ ] **Migrations** — numbered SQL files (`001_`, `002_`, etc.), never manual DB changes
- [ ] **Seed data** — `seed.sql` for initial content, admin user template
- [ ] **Types** — generated Supabase types or manual TypeScript interfaces for all tables
- [ ] **No raw SQL in components** — use Supabase SDK, server actions, or API routes
- [ ] **Audit trail** — `activity_log` table tracking significant changes

---

## 10. EMAIL SETUP

- [ ] Resend account configured
- [ ] Sending domain verified (DNS records: SPF, DKIM, DMARC)
- [ ] From address: `hello@clientdomain.co.za` (or Yoros domain for subscription clients)
- [ ] React Email templates for:
  - [ ] Welcome / registration confirmation
  - [ ] Password reset
  - [ ] Contact form submission (to admin)
  - [ ] Contact form confirmation (to sender)
- [ ] All emails branded (logo, colours, footer with unsubscribe)
- [ ] Email previews testable in development

---

## 11. NEWSLETTER

- [ ] `newsletter_subscribers` table (email, name, subscribed_at, status)
- [ ] Signup form in footer (email + optional name)
- [ ] Duplicate handling (upsert, not error)
- [ ] Unsubscribe link in all marketing emails
- [ ] Admin view of subscribers (export, filter by date)
- [ ] POPIA compliance notice near signup form

---

## 12. CONTACT / LEAD CAPTURE

- [ ] Contact form on `/contact` page
- [ ] Fields: name, email, phone, message (minimum)
- [ ] Server-side validation
- [ ] Stored in `contact_submissions` or `leads` table
- [ ] Email notification to admin on new submission
- [ ] Confirmation email to sender
- [ ] Honeypot or rate limiting (anti-spam)
- [ ] Admin view of all submissions with read/unread status
- [ ] Optional: WhatsApp link as alternative contact method

---

## 13. LEGAL / COMPLIANCE

- [ ] **Privacy Policy** page — POPIA compliant (required by SA law)
- [ ] **Terms & Conditions** page (if e-commerce or service bookings)
- [ ] **Cookie consent banner** (if using analytics/tracking)
- [ ] Cookie consent stored in localStorage, choices respected
- [ ] **POPIA notice** on all forms collecting personal data
- [ ] SSL enforced (Vercel handles this, but verify)
- [ ] No sensitive data in URLs, logs, or client-side storage

---

## 14. ERROR HANDLING & UX

- [ ] **Custom 404 page** — branded, helpful (suggest pages, search)
- [ ] **Custom 500 page** — friendly error message, "try again" or "contact us"
- [ ] **Loading states** — skeleton loaders or spinners on all async content
- [ ] **Empty states** — friendly messages when lists are empty ("No projects yet — let's start one!")
- [ ] **Toast notifications** — success/error/info feedback via sonner
- [ ] **Form validation** — inline errors, not just on submit
- [ ] **Optimistic UI** — where appropriate (likes, toggles, status changes)
- [ ] **Offline handling** — graceful degradation, not blank screen

---

## 15. ACCESSIBILITY

- [ ] Semantic HTML (`nav`, `main`, `article`, `section`, `header`, `footer`)
- [ ] ARIA labels on interactive elements (especially icon buttons)
- [ ] Keyboard navigation — all interactive elements focusable + operable
- [ ] Focus indicators visible (don't remove outlines without replacement)
- [ ] Colour contrast — WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- [ ] Screen reader tested (at least one pass with VoiceOver or NVDA)
- [ ] Skip-to-content link
- [ ] Alt text on all images
- [ ] Form labels associated with inputs (`htmlFor` / `id`)
- [ ] Error messages associated with form fields (`aria-describedby`)
- [ ] No autoplaying video/audio without controls
- [ ] Lighthouse Accessibility: target 100

---

## 16. SECURITY

- [ ] All env vars server-side only (except `NEXT_PUBLIC_*` for Supabase URL/anon key)
- [ ] No secrets in client-side code
- [ ] RLS on every Supabase table
- [ ] Webhook signature verification (Paystack HMAC)
- [ ] CRON_SECRET on all cron endpoints
- [ ] Rate limiting on public API routes (quote calculation, contact form, AI endpoints)
- [ ] Input sanitisation (XSS prevention)
- [ ] CSRF protection (Next.js server actions handle this)
- [ ] Content Security Policy headers (where feasible)
- [ ] No `dangerouslySetInnerHTML` without sanitisation
- [ ] Regular dependency updates (`npm audit`)

---

## 17. CODE QUALITY

- [ ] TypeScript strict mode — no `any` types
- [ ] ESLint configured — zero errors, zero warnings before commit
- [ ] Prettier for consistent formatting
- [ ] Server Components by default — `"use client"` only when needed
- [ ] Server Actions for mutations (not API routes, unless webhook/external)
- [ ] Consistent file naming: `kebab-case` for files, `PascalCase` for components
- [ ] Reusable components — don't repeat UI patterns
- [ ] Environment variables typed and validated at startup
- [ ] `npm run build` — zero errors before deploy
- [ ] Git: meaningful commit messages, no `node_modules`, `.env` in `.gitignore`

---

## 18. DEPLOYMENT & OPS

- [ ] Vercel connected to GitHub repo
- [ ] Environment variables set in Vercel dashboard (production + preview)
- [ ] Preview deployments on PR (automatic via Vercel)
- [ ] Production deploys on `main` branch push
- [ ] Supabase project configured (auth, storage buckets, RLS enabled)
- [ ] Custom domain configured (DNS, SSL auto via Vercel)
- [ ] Monitoring: Vercel Analytics enabled
- [ ] Error tracking: Vercel or Sentry (at minimum, check runtime logs)
- [ ] Backup: Supabase automatic daily backups (Pro plan)
- [ ] `vercel.json` for cron jobs and redirects

---

## 19. HANDOVER CHECKLIST (For subscription buyout or once-off delivery)

When transferring ownership to client:

- [ ] Source code pushed to client's GitHub repo
- [ ] Vercel project redeployed under client's account (or transferred)
- [ ] Supabase project transferred to client's org
- [ ] All environment variables documented and shared securely
- [ ] Domain DNS pointed to client's Vercel deployment
- [ ] Paystack account: client's own (once-off) or migrated (subscription)
- [ ] Resend: domain verification transferred or client creates own account
- [ ] Admin credentials created for client
- [ ] 1-hour training session (recorded for reference)
- [ ] Maintenance package offered (Basic R350 / Standard R650 / Premium R1,200)
- [ ] All third-party account credentials documented in handover doc
- [ ] README.md in repo with setup, env vars, deployment instructions

---

## QUICK COPY — MINIMAL CHECKLIST

For quick reference, the absolute non-negotiables on every project:

```
□ Zero hardcoding (all content from DB)
□ Full admin CRUD (every entity manageable)
□ Dark mode with toggle + system detection
□ Mobile-first responsive
□ SEO: sitemap, robots.txt, meta tags, structured data, 404 page
□ Lighthouse: A100 / BP100 / SEO100 / Perf>85
□ Supabase Auth + RLS on every table
□ Newsletter signup
□ Contact form with admin notifications
□ Privacy Policy page (POPIA)
□ Cookie consent banner
□ Custom 404 + 500 pages
□ Loading states + empty states + toast notifications
□ Accessibility: semantic HTML, ARIA, keyboard nav, contrast
□ TypeScript strict, ESLint clean, zero build errors
□ Resend email (welcome, password reset, contact confirmation)
□ CRON_SECRET on cron endpoints
□ Webhook signature verification
□ Git + Vercel CI/CD
□ Handover-ready (README, env docs, training)
```
