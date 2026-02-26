# Build 19 — Checkout & Paystack Integration

> **Type:** Full-stack
> **Estimated Time:** 2–3 hrs
> **Dependencies:** Build 17 (cart)
> **Context Files:** PROJECT_BRIEF.md §3 (Steps 10–11), orders schema

---

## Objective

Build the full checkout flow: delivery/installation selection, customer details form, Paystack payment integration, order creation, and order confirmation page. This is the money flow.

---

## Tasks

### 1. Checkout Page

**`src/app/(public)/checkout/page.tsx`**

Two-step checkout (not wizard — single page with sections):

**Section 1: Delivery & Installation**

```
"How would you like to receive your blinds?"

  ○ Self-Install (I'll install them myself)
    Standard delivery: R 500
    Free on orders over R 5,000
    
  ○ Professional Installation
    We'll measure, deliver and install.
    Delivery: R 500 (or free over R 5,000)
    Installation: R 500 per blind × [X] blinds = R [total]

  ☐ I'm interested in other Nortier Group services
    (Decking, cupboards, home improvement)
```

**Section 2: Your Details**

```
  Name:     [________________________]
  Email:    [________________________]
  Phone:    [________________________]
  
  Delivery Address:
  Street:   [________________________]
  City:     [________________________]
  Province: [__________ ▼]  (dropdown: 9 SA provinces)
  Postal Code: [______]
  
  Notes:    [________________________]  (optional)
```

**Section 3: Order Summary**

```
  ── Your Order ──
  
  Kitchen Window 1
  Roller — Beach — Sand — 120×150cm      R 1,267
    + Stainless chain                     R   170
    + Side guides                         R   384
                                          ───────
  Main Bedroom
  Aluminium 50mm — Plain — White — 90×120cm  R 892
                                          ───────
  
  Subtotal:                               R 2,713
  Delivery:                               R   500
  Installation (2 blinds × R500):         R 1,000
  ──────────────────────────────────
  Subtotal excl. VAT:                     R 4,213
  VAT (15%):                              R   632
  ══════════════════════════════════
  Total:                                  R 4,845
  
  [Pay R 4,845 with Paystack →]
```

### 2. Price Calculation

Server-side calculation (never trust client-side totals):

```typescript
function calculateOrderTotal(cart: CartItem[], deliveryType: string, settings: PricingSettings) {
  const subtotal = cart.reduce((sum, item) => 
    sum + (item.customer_price_cents + item.extras_cents) * item.quantity, 0
  )
  
  const deliveryFee = subtotal >= settings.free_delivery_threshold_cents 
    ? 0 
    : settings.delivery_fee_cents
  
  const blindCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const installationFee = deliveryType === 'professional_install' 
    ? settings.installation_fee_cents * blindCount 
    : 0
  
  const subtotalWithFees = subtotal + deliveryFee + installationFee
  const vatCents = Math.round(subtotalWithFees * (settings.vat_percent / 100))
  const totalCents = subtotalWithFees + vatCents
  
  return { subtotal, deliveryFee, installationFee, vatCents, totalCents }
}
```

### 3. Order Creation API

**`POST /api/orders`**

1. Validate all input (Zod schema)
2. Recalculate prices server-side (don't trust client prices)
   - For each cart item: call price lookup to verify current price
   - If price has changed since cart was created, use current price
3. Create order record
4. Create order_items records (one per blind)
5. Initialise Paystack transaction
6. Return: `{ order_id, paystack_access_code, paystack_reference }`

### 4. Paystack Integration

**Initialise transaction:**
```typescript
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: customerEmail,
    amount: totalCents, // Paystack uses kobo/cents
    currency: 'ZAR',
    reference: paystackReference, // Generate unique reference
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/${orderId}`,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
    },
  }),
})
```

**Client-side: Paystack Inline Popup**

Use Paystack's inline JS to show the payment popup:
```typescript
// Load Paystack inline script
const handler = PaystackPop.setup({
  key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  email: customerEmail,
  amount: totalCents,
  currency: 'ZAR',
  ref: paystackReference,
  callback: function(response) {
    // Payment successful — verify on server
    verifyPayment(response.reference)
  },
  onClose: function() {
    // User closed popup without paying
  },
})
handler.openIframe()
```

### 5. Payment Verification

**`POST /api/orders/verify`**

After Paystack callback:
1. Call Paystack verify endpoint: `GET https://api.paystack.co/transaction/verify/${reference}`
2. Verify: `data.status === 'success'` AND `data.amount === order.total_cents`
3. Update order: `payment_status = 'paid'`, `order_status = 'confirmed'`
4. Clear cart (send clear signal to client)
5. Redirect to confirmation page

### 6. Paystack Webhook

**`POST /api/webhooks/paystack`**

Backup verification via webhook (in case client-side callback fails):

1. Verify webhook signature (Paystack uses HMAC SHA512):
   ```typescript
   const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
     .update(JSON.stringify(req.body))
     .digest('hex')
   if (hash !== req.headers['x-paystack-signature']) return 401
   ```
2. If event === 'charge.success':
   - Find order by paystack_reference
   - If not already paid: update payment_status and order_status
3. Return 200

### 7. Order Confirmation Page

**`src/app/(public)/order/[id]/page.tsx`**

```
  ✓ Order Confirmed!
  
  Order #BL-2026-0001
  
  Thank you, [Name]! Your order has been placed.
  A confirmation email has been sent to [email].
  
  ── Order Details ──
  [Full order summary: all blinds with specs + prices]
  
  ── What Happens Next ──
  1. We'll confirm your order within 24 hours
  2. Your blinds will be manufactured to order
  3. Delivery in 10–15 working days
  [4. Our installer will contact you to schedule]  (if professional install)
  
  [Track Your Order] → link to same page (order status updates here)
  
  Questions? Contact us at [contact_email] or [contact_phone]
```

### 8. Form Validation

Zod schemas for all inputs:
- Name: required, min 2 chars
- Email: required, valid email format
- Phone: required, SA phone format (starts with 0, 10 digits)
- Address fields: all required for delivery
- Province: one of 9 SA provinces

### 9. Error Handling

- Payment failed: show error, allow retry
- Network error during order creation: show error, don't double-charge
- Paystack popup blocked: show instructions to allow popups
- Order creation succeeds but payment fails: order exists with `payment_status = 'pending'` — can be retried

---

## Acceptance Criteria

```
✅ Checkout page shows delivery type selector with correct pricing
✅ Professional install calculates per-blind installation fee
✅ Cross-sell checkbox works
✅ Customer details form validates correctly
✅ SA province dropdown with all 9 provinces
✅ Order summary shows correct line items + totals + VAT
✅ Server-side price recalculation matches client-side display
✅ Order created in database with correct data
✅ Order number auto-generated (BL-2026-XXXX)
✅ Paystack payment popup opens and accepts test payment
✅ Payment verification updates order status to 'paid'/'confirmed'
✅ Webhook handler verifies signature and processes events
✅ Order confirmation page displays after successful payment
✅ Cart cleared after successful payment
✅ Error handling: failed payment, network errors, popup blocked
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use Paystack TEST keys during development (PAYSTACK_SECRET_KEY starts with sk_test_)
- Paystack amounts are in the smallest currency unit (cents for ZAR)
- The Paystack inline JS needs to be loaded dynamically (script tag or next/script)
- Always verify payments server-side — never trust the client callback alone
- The webhook is the reliable path — the client callback is the fast path
- Order creation and payment initialisation should be atomic: if Paystack init fails, don't leave a dangling order
- SA phone validation: 10 digits starting with 0 (e.g., 0821234567)
- For the province dropdown: Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, North West, Northern Cape, Western Cape
