# Build 20 — Order Emails & Confirmation

> **Type:** Full-stack
> **Estimated Time:** 1–2 hrs
> **Dependencies:** Build 19 (order creation)
> **Context Files:** Order data structure, Resend setup

---

## Objective

Create all transactional email templates for the order lifecycle and wire them to order events. Customer gets confirmation on purchase and updates as their order progresses. Admin gets notified of new orders.

---

## Tasks

### 1. Email Base Layout

**`src/lib/email/templates/base-layout.tsx`** (if not already created)

Shared layout for all emails:
- Blindly logo (centered)
- Brand colours: linen background, charcoal text, terracotta accents
- Footer: contact info (from site_settings), social links, unsubscribe link
- Max width: 600px
- Mobile-responsive

### 2. Order Confirmation Email (to Customer)

**`src/lib/email/templates/order-confirmation.tsx`**

Triggered: immediately after successful payment.

Content:
- "Your order has been confirmed!"
- Order number: BL-2026-XXXX
- Order date
- For each blind:
  - Type, range, colour
  - Dimensions (mm) and matched size (cm)
  - Location label
  - Selected extras
  - Line price
- Subtotal, delivery, installation (if applicable), VAT, total
- Delivery info: type (self-install vs professional) + address
- "What happens next" section (same as confirmation page)
- CTA: "Track Your Order" → link to `/order/[id]`
- Contact info

### 3. New Order Notification (to Admin)

**`src/lib/email/templates/admin-order-notification.tsx`**

Triggered: immediately after successful payment.

Content:
- "New Order: BL-2026-XXXX"
- Customer: name, email, phone
- Cross-sell flag highlighted if checked: "⭐ Interested in other Nortier services"
- Full order details (same as customer email)
- PLUS: supplier cost, markup %, profit per item, total profit
- CTA: "View in Admin" → link to `/admin/orders/[id]`

### 4. Order Status Update Emails (to Customer)

**`src/lib/email/templates/order-status-update.tsx`**

Triggered: when admin changes order_status.

Dynamic content based on new status:

| Status | Subject | Content |
|--------|---------|---------|
| confirmed | "Order Confirmed" | "We've confirmed your order and it's being processed." |
| ordered_from_supplier | "Blinds in Production" | "Your blinds have been ordered from our manufacturer. Estimated production: 7-10 working days." |
| shipped | "Your Blinds Are On Their Way!" | "Your order has been dispatched. Track delivery: [tracking info if available]" |
| delivered | "Blinds Delivered" | "Your blinds have been delivered. [Install guide link if self-install]" |
| installed | "Installation Complete" | "Your blinds have been installed. We hope you love them! [Review request link]" |

Each email includes:
- Order number and summary
- Status timeline showing progress
- Contact info for questions

### 5. Email Sending Helper

**`src/lib/email/send.ts`**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
  to: string,
  subject: string,
  template: React.ReactElement,
  options?: { replyTo?: string; bcc?: string }
) {
  return resend.emails.send({
    from: `Blindly <orders@blindly.co.za>`,  // Or from site_settings
    to,
    subject,
    react: template,
    ...options,
  })
}
```

### 6. Wire Emails to Events

**On order creation (Build 19 flow):**
```typescript
// After payment verified:
await sendEmail(
  order.customer_email,
  `Order Confirmed — ${order.order_number}`,
  OrderConfirmationEmail({ order, items })
)

await sendEmail(
  adminEmail, // from site_settings
  `New Order: ${order.order_number}`,
  AdminOrderNotification({ order, items })
)
```

**On status change (Build 21 will trigger this):**
```typescript
// Server action or API route:
export async function updateOrderStatus(orderId: string, newStatus: string) {
  // Update DB
  await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId)
  
  // Send status email
  const order = await getOrderWithItems(orderId)
  await sendEmail(
    order.customer_email,
    getStatusEmailSubject(newStatus, order.order_number),
    OrderStatusUpdate({ order, newStatus })
  )
  
  // Log activity
  await logActivity('order.status_change', orderId, { from: oldStatus, to: newStatus })
}
```

### 7. Order Confirmation Page Enhancement

Update `/order/[id]` from Build 19:
- Add order status timeline (visual pipeline)
- Show current status with timestamp
- "A confirmation email has been sent to [email]"

---

## Acceptance Criteria

```
✅ Order confirmation email sent to customer on successful payment
✅ Admin notification email sent on new order
✅ Admin email includes profit breakdown (supplier cost vs customer price)
✅ Admin email highlights cross-sell interest flag
✅ Status update emails send on every status change
✅ Status emails have appropriate content per status
✅ All emails use brand styling (logo, colours, typography)
✅ All emails are mobile-responsive
✅ Email rendering verified (check with React Email preview)
✅ Confirmation page shows status timeline
✅ `pnpm run build` passes
```

---

## Notes for Claude Code

- Use React Email components for all templates (`@react-email/components`)
- Resend requires a verified sending domain — for dev, use their sandbox or a verified domain
- The admin notification email is the most important one operationally — the client needs to see new orders immediately
- Status update emails should be idempotent — if called twice for the same status, don't send duplicate emails
- Email subject lines should include the order number for easy searching
- Test emails with React Email's preview server during development: `npx email dev`
