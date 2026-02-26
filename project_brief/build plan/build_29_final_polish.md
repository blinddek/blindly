# Build 29 — Final Polish, Performance Audit, Launch Prep

> **Type:** QA & Launch
> **Estimated Time:** 2–3 hrs
> **Dependencies:** All previous builds
> **Context Files:** YOROS_UNIVERSAL_PROJECT_BRIEF.md §11 (Quality Standards)

---

## Objective

Final polish pass across the entire application: Lighthouse audit, cross-browser testing, accessibility check, security review, loading states, error handling, and deployment preparation. Nothing ships without this build.

---

## Tasks

### 1. Lighthouse Audit

Run Lighthouse on all key pages and achieve targets:

| Page | Performance | Accessibility | Best Practices | SEO |
|------|------------|---------------|----------------|-----|
| Homepage | 90+ | 95+ | 95+ | 95+ |
| Products | 90+ | 95+ | 95+ | 95+ |
| Configure | 85+ | 95+ | 95+ | 90+ |
| Cart | 85+ | 95+ | 95+ | 90+ |
| Checkout | 85+ | 95+ | 95+ | 90+ |
| Admin | 80+ | 90+ | 95+ | — |

**Common fixes:**
- Image optimization (WebP, proper sizing, lazy loading)
- Unused CSS/JS removal
- Font preloading (DM Serif Display, DM Sans)
- Critical CSS inlining
- Reduce CLS (set explicit dimensions on images/containers)
- Add `loading="lazy"` to below-fold images
- Reduce JavaScript bundle size (check for unnecessary imports)

### 2. Cross-Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome (Android)

Key flows to test:
- Full configurator flow (Steps 1–7)
- Cart + accessories
- Checkout + Paystack payment (test mode)
- Admin login + order management
- Product browse
- Dark mode toggle
- Newsletter signup
- Contact form

### 3. Accessibility Audit

Check against WCAG 2.1 AA:

- **Keyboard navigation:** Tab through all interactive elements, focus visible
- **Screen reader:** All images have alt text, form labels associated, ARIA labels on icons
- **Colour contrast:** All text meets 4.5:1 ratio (check warm neutrals carefully — light backgrounds + light text is a risk)
- **Focus indicators:** Visible focus rings on all interactive elements
- **Skip navigation:** "Skip to main content" link
- **Form errors:** Associated with inputs, announced by screen readers
- **Heading hierarchy:** h1 → h2 → h3 (no skipped levels)
- **Button labels:** All icon-only buttons have aria-label
- **Touch targets:** Minimum 44×44px on mobile

### 4. Error Handling Review

Walk through error states for every user-facing feature:

| Feature | Error State | Expected Behaviour |
|---------|-------------|-------------------|
| Configurator | No categories in DB | Empty state message + admin prompt |
| Configurator | Price lookup fails | "Unable to calculate price — please try again" |
| Cart | Empty cart | "Your cart is empty" + CTA to configurator |
| Checkout | Paystack popup blocked | Instructions to allow popups |
| Checkout | Payment fails | Error message + retry option |
| Contact form | Submission fails | Error toast + form data preserved |
| Quote save | Email send fails | Quote saved, email error noted |
| Admin | Session expired | Redirect to login with message |
| Product browse | No ranges for category | Empty state message |
| Swatch request | Submission fails | Error toast |

### 5. Loading States Review

Every data fetch should have a loading state:
- Skeleton loaders on product cards, tables
- Spinner on price calculations
- Button loading state on form submissions
- Full-page loading for route transitions (Next.js `loading.tsx`)
- Suspense boundaries around data-dependent sections

### 6. Security Review

- [ ] RLS enabled on ALL tables (double-check)
- [ ] No supplier prices exposed in public API responses
- [ ] No markup percentages in public responses
- [ ] Admin routes protected by middleware
- [ ] Paystack webhook validates signature
- [ ] CORS configured correctly
- [ ] Environment variables not leaked to client bundle (check `NEXT_PUBLIC_` prefix usage)
- [ ] Input sanitisation on all forms
- [ ] Rate limiting on public API routes (optional but recommended)
- [ ] CSP headers configured

### 7. Environment Setup

**Production environment variables (.env.production):**

```env
# App
NEXT_PUBLIC_SITE_URL=https://blindly.co.za

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Paystack (LIVE keys — swap from test)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_[key]
PAYSTACK_SECRET_KEY=sk_live_[key]

# Resend
RESEND_API_KEY=re_[key]

# Google
NEXT_PUBLIC_GA_ID=G-[id]
```

**Deployment checklist:**
- [ ] Production Supabase project created (separate from dev)
- [ ] All 6 migrations run on production Supabase
- [ ] Seed data imported on production
- [ ] Admin user created on production
- [ ] Paystack live keys configured
- [ ] Resend domain verified for blindly.co.za
- [ ] DNS configured for blindly.co.za
- [ ] SSL certificate active

### 8. Performance Optimization

- [ ] Verify ISR (Incremental Static Regeneration) on product pages
- [ ] Check API route response times (< 100ms for price lookups)
- [ ] Bundle analysis: `pnpm build` shows reasonable chunk sizes
- [ ] No unnecessary client-side JavaScript (check for "use client" overuse)
- [ ] Database query optimization: verify indexes are being used
- [ ] Image CDN configured (Supabase Storage + transform)

### 9. Client Handover Documentation

Create a handover document covering:
- Admin panel URL and login credentials
- How to update prices (XLS import flow)
- How to manage products (add/edit categories, types, ranges)
- How to manage orders (status pipeline)
- How to update site settings, navigation, pages
- How to upload gallery images
- How to view and manage leads
- Paystack dashboard access
- Supabase dashboard access (if needed)
- Support contact

### 10. Final Smoke Test

Complete one full end-to-end flow:
1. Visit homepage
2. Browse products
3. Configure a blind (all steps)
4. Add accessories
5. Save as quote → verify email received
6. Restore quote → verify cart loads
7. Proceed to checkout
8. Complete test payment
9. Verify order confirmation page
10. Verify confirmation email received
11. Admin: view new order
12. Admin: advance order status
13. Admin: generate supplier PDF
14. Admin: verify status email sent to customer

---

## Acceptance Criteria

```
✅ Lighthouse Performance: 85+ on all pages (90+ on homepage/products)
✅ Lighthouse Accessibility: 95+ on all public pages
✅ Lighthouse SEO: 95+ on all public pages
✅ Cross-browser: works on Chrome, Firefox, Safari, Edge, iOS Safari, Android Chrome
✅ WCAG 2.1 AA: colour contrast, keyboard nav, screen reader, focus indicators
✅ All error states handled with user-friendly messages
✅ All loading states present (no blank screens during data fetch)
✅ Security: no data leaks, RLS verified, API routes secured
✅ Production environment configured
✅ End-to-end smoke test passes (full order flow)
✅ Handover documentation created
✅ `pnpm run build` passes with zero warnings
✅ Ready to deploy 🚀
```

---

## Notes for Claude Code

- This build is about QUALITY, not features. Nothing new gets added here.
- The Lighthouse audit often reveals quick wins: resize an image, add a missing alt tag, preload a font
- Colour contrast is the most common accessibility issue with warm colour palettes — check carefully
- The end-to-end smoke test is the most important acceptance criterion — if this passes, the site works
- Use Paystack test mode for the smoke test, then verify the switch to live keys is clean
- The handover document is for the Nortier client — keep it simple, visual, step-by-step
- After this build, tag the repo as v1.0.0 and deploy
