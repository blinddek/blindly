# Build 18 — Quote Save & Share

> **Type:** Full-stack
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 17 (cart)
> **Context Files:** PROJECT_BRIEF.md §3 (Step 9), saved_quotes schema

---

## Objective

Build the quote save, share, restore, and email functionality. This turns abandoned carts into recoverable leads and gives customers a way to share their configuration with others before committing to purchase.

---

## Tasks

### 1. Save Quote Flow

Wire up the "Save as Quote" and "Email me this" buttons from the cart page.

**"Email me this quote" button opens a modal:**

Fields:
- Email (required)
- Name (optional)
- Phone (optional)

On submit:
1. Generate unique `quote_token` using nanoid (12 chars)
2. Snapshot the entire cart state as `cart_data` JSONB
3. Calculate `total_cents` from cart
4. Insert into `saved_quotes` table
5. Send quote email via Resend
6. Show success: "Quote saved! Check your email for the link."
7. Display the shareable URL in the modal for copying

**API Route: `POST /api/quotes/save`**

```typescript
// Body: { email, name?, phone?, cart_data, total_cents }
// Returns: { quote_token, share_url }
```

### 2. Quote Email

**React Email template: `src/lib/email/templates/quote-saved.tsx`**

Content:
- Blindly logo + brand header
- "Your quote is ready"
- Summary of all configured blinds (type, range, colour, size, price per item)
- Total
- Big CTA button: "View Your Quote" → links to `/quote/[token]`
- Expiry notice: "This quote is valid for 30 days"
- Contact info footer

### 3. Share URL

After saving, display:
```
Your quote link:
https://blindly.co.za/quote/abc123xyz789

[Copy Link]  [Share via WhatsApp]
```

WhatsApp share: `https://wa.me/?text=Check out my blind quote: https://blindly.co.za/quote/...`

### 4. Restore Quote Page

**`src/app/(public)/quote/[token]/page.tsx`**

1. Fetch `saved_quotes` by `quote_token`
2. If not found or expired → show friendly error: "This quote has expired or doesn't exist. Start a new configuration."
3. If found:
   - Display all configured blinds from `cart_data` JSONB
   - Show original total
   - "Restore to Cart" button → loads cart_data into localStorage cart, navigates to `/cart`
   - "This quote was created on [date] and expires on [date]"

**Price recalculation note:**
When restoring, the stored prices may be outdated if supplier prices have changed. Two options:
- **Option A (recommended for pilot):** Use stored prices as-is. Show "Prices from [date]" disclaimer.
- **Option B:** Recalculate all prices on restore and show differences if any changed.

Go with Option A for simplicity.

### 5. Quote Expiry

- Default: 30 days from creation (`expires_at`)
- Expired quotes: show "This quote has expired" with a CTA to start fresh
- Don't delete expired quotes from DB — admin can still see them as historical leads

### 6. PDF Download

**"Download PDF" button on cart page and quote restore page:**

Generate a branded PDF quote document:
- Blindly logo
- "Quote #[token]" header
- Date generated
- Customer name/email (if provided)
- Table: all blinds with specs + prices
- Subtotal, extras, delivery, estimated total
- "Valid for 30 days"
- Contact information

Use a server-side PDF generation approach (e.g., `@react-pdf/renderer` or HTML-to-PDF via headless Chrome). Keep it simple — a clean, professional document.

**API Route: `GET /api/quotes/[token]/pdf`**

### 7. Follow-up Tracking

The `saved_quotes` table has follow-up flags: `email_sent_24h`, `email_sent_72h`, `email_sent_7d`.

These are used by an automation (cron job or Supabase Edge Function — not built in this session, just prep the data model):
- 24h after save: "Still thinking about your blinds?" reminder email
- 72h: "Your quote expires in 27 days" with the restore link
- 7d: "Don't miss out — your personalised quote" final nudge

For now, just ensure the flags exist and are set to `false` on creation.

### 8. Conversion Tracking

When a quote is restored and the customer completes checkout:
- Set `converted_to_order_id` on the saved_quote
- This links the lead to the sale for analytics

---

## Acceptance Criteria

```
✅ "Email me this quote" button opens modal with email/name/phone fields
✅ Submitting creates saved_quotes record with cart_data snapshot
✅ Unique quote_token generated (nanoid, 12 chars)
✅ Quote email sent via Resend with correct content and restore link
✅ Shareable URL displayed after save (copyable)
✅ WhatsApp share link works
✅ /quote/[token] page loads and displays the saved cart
✅ "Restore to Cart" button loads cart data into localStorage and navigates to /cart
✅ Expired quotes show friendly message with CTA to start fresh
✅ PDF download generates a branded quote document
✅ Price disclaimer shown on restored quotes ("Prices from [date]")
✅ Follow-up flags initialised to false
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use `nanoid` for token generation: `nanoid(12)` produces a URL-safe 12-char string
- The cart_data JSONB stores the FULL cart snapshot — everything needed to restore the cart without any additional DB queries
- Email sending uses Resend (configured in Build 01 with RESEND_API_KEY)
- For PDF generation, consider `@react-pdf/renderer` for a pure React approach, or use a simpler HTML-to-PDF if time is tight
- The quote system is a lead capture goldmine — every saved quote is a warm lead with contact info
- Don't over-engineer the follow-up emails in this build — just have the flags ready. Automation comes later.
