# Build 01 — Project Scaffold

> **Type:** Setup
> **Estimated Time:** 30–45 min
> **Dependencies:** None
> **Context Files:** YOROS_UNIVERSAL_PROJECT_BRIEF.md, BRAND_DESIGN_SYSTEM.md

---

## Objective

Bootstrap a Next.js 14+ project with the Blindly brand identity, Supabase integration, shadcn/ui components, and folder structure ready for all subsequent builds. This is the foundation — every other build depends on this being correct.

---

## Tasks

### 1. Create Next.js Project

```bash
npx create-next-app@latest blindly --typescript --tailwind --app --src-dir --import-alias "@/*"
cd blindly
```

### 2. Install Dependencies

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# UI
pnpm add class-variance-authority clsx tailwind-merge lucide-react sonner
pnpm dlx shadcn@latest init

# Parsing (for XLS import later)
pnpm add xlsx

# Email
pnpm add resend @react-email/components

# Utils
pnpm add nanoid zod
```

### 3. shadcn/ui Components

Install core components needed across the project:

```bash
pnpm dlx shadcn@latest add button input card dialog table tabs select checkbox toast label textarea badge separator dropdown-menu sheet scroll-area skeleton switch tooltip progress avatar
```

### 4. Folder Structure

Create this directory layout inside `src/`:

```
src/
├── app/
│   ├── (public)/              # Public-facing pages
│   │   ├── layout.tsx         # Public layout (header + footer)
│   │   ├── page.tsx           # Homepage (placeholder)
│   │   ├── products/
│   │   ├── configure/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── order/
│   │   ├── quote/
│   │   ├── about/
│   │   ├── contact/
│   │   ├── faq/
│   │   └── gallery/
│   ├── (admin)/               # Admin dashboard
│   │   ├── admin/
│   │   │   ├── layout.tsx     # Admin layout (sidebar + topbar)
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── products/
│   │   │   ├── pricing/
│   │   │   ├── orders/
│   │   │   ├── quotes/
│   │   │   ├── leads/
│   │   │   └── settings/
│   │   └── login/
│   │       └── page.tsx
│   ├── api/
│   │   ├── blinds/
│   │   ├── orders/
│   │   ├── quotes/
│   │   └── webhooks/
│   ├── layout.tsx             # Root layout
│   ├── not-found.tsx          # Custom 404
│   └── error.tsx              # Custom error boundary
├── components/
│   ├── ui/                    # shadcn/ui components (auto-generated)
│   ├── layout/                # Header, Footer, Sidebar, etc.
│   ├── configurator/          # Wizard step components
│   ├── admin/                 # Admin-specific components
│   └── shared/                # Reusable across public + admin
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client (Server Components + Actions)
│   │   └── middleware.ts      # Middleware helper
│   ├── parsers/               # XLS parser modules
│   ├── pricing/               # Price lookup engine
│   ├── actions/               # Server Actions
│   ├── email/                 # Resend + React Email
│   └── utils.ts               # cn(), formatPrice(), etc.
├── types/
│   ├── database.ts            # Generated Supabase types
│   └── index.ts               # Shared app types
├── hooks/                     # Custom React hooks
└── config/
    └── site.ts                # Brand config constants
```

### 5. Supabase Client Setup

**`src/lib/supabase/client.ts`** — Browser client (Client Components):
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — Server client (Server Components, Server Actions, Route Handlers):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — ignore */ }
        },
      },
    }
  )
}
```

**`src/lib/supabase/middleware.ts`** — Session refresh in middleware:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/login')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
```

**`src/middleware.ts`** — Root middleware:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 6. Tailwind Config — Blindly Brand Tokens

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
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
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
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
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 7. Font Setup

In `src/app/layout.tsx`, configure Google Fonts:

```typescript
import { DM_Serif_Display, DM_Sans, JetBrains_Mono } from 'next/font/google'

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})
```

Apply to `<html>`:
```tsx
<html lang="en" className={`${dmSerif.variable} ${dmSans.variable} ${jetbrains.variable}`}>
  <body className="font-body bg-brand-linen text-brand-charcoal antialiased">
```

### 8. Dark Mode

Set up a dark mode provider using `next-themes` or a simple React context. The brand uses warm dark mode:
- Light: `bg-brand-linen` / `text-brand-charcoal`
- Dark: `bg-brand-espresso` / `text-brand-ivory`

Implement a `ThemeProvider` that wraps the app and a `ThemeToggle` component.

### 9. Utility Functions

**`src/lib/utils.ts`**:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function formatPriceDecimal(cents: number): string {
  return `R ${(cents / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
```

### 10. Environment Variables

Create `.env.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Paystack
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=

# Resend (email)
RESEND_API_KEY=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 11. Placeholder Pages

Create minimal placeholder pages so the route structure is in place:
- `src/app/(public)/page.tsx` → "Blindly — Coming Soon" with brand styling
- `src/app/(admin)/admin/page.tsx` → "Admin Dashboard" placeholder
- `src/app/(admin)/login/page.tsx` → Simple email/password login form

### 12. Site Config

**`src/config/site.ts`**:
```typescript
export const siteConfig = {
  name: 'Blindly',
  description: 'Premium custom window blinds, configured to your exact specifications and delivered to your door.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://blindly.co.za',
  ogImage: '/og.png',
  currency: 'ZAR',
  currencySymbol: 'R',
  locale: 'en-ZA',
  vat: 15,
} as const
```

---

## Acceptance Criteria

```
✅ `pnpm run build` passes with zero errors
✅ `pnpm run dev` starts without errors
✅ Brand fonts load correctly (DM Serif Display headings, DM Sans body, JetBrains Mono)
✅ Brand colours available as Tailwind classes (bg-brand-terracotta, text-brand-charcoal, etc.)
✅ Dark mode toggle works (light ↔ dark, no flash on load)
✅ Supabase client initialises without errors (even if DB is empty)
✅ Middleware redirects unauthenticated users from /admin to /login
✅ All folder paths exist as specified
✅ shadcn/ui components installed and importable
✅ .env.example documents all required environment variables
```

---

## Notes for Claude Code

- Use `pnpm` as the package manager (not npm or yarn)
- Use the App Router (not Pages Router)
- Server Components by default — only add `'use client'` when needed
- Follow the Yoros Universal Project Brief standards (zero hardcoding, everything admin-editable)
- The brand colours, fonts, and design tokens are defined in `project_brief/design/BRAND_DESIGN_SYSTEM.md` — use these exact hex values
- Logo files are at `project_brief/design/blindly-logo.svg` and `blindly-logo.png`
