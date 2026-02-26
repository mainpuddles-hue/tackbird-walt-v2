# API & Authentication

## Authentication Methods

TackBird supports two authentication methods, both via Supabase Auth:

1. **Google OAuth** — `signInWithOAuth({ provider: 'google' })`, redirects to `/auth/callback`
2. **Email/Password** — `signUp()` + email verification, `signInWithPassword()` for login

Sessions are cookie-based, managed by `@supabase/ssr`.

## Supabase Client Architecture

Four client factories, each for a specific context:

### Browser Client (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
```
**Used in:** Client components (`'use client'`). Respects RLS.

### Server Client (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies: { getAll, setAll } })
}
```
**Used in:** Server components and API routes for read operations. Respects RLS. Cookie-based session.

### Admin Client (`src/lib/supabase/admin.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'
export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}
```
**Used in:** API routes for mutations needing elevated permissions. **Bypasses RLS.**

### Middleware Client (`src/lib/supabase/middleware.ts`)
Created inline in `updateSession()`. Refreshes auth cookies on every request.

## Auth Flow

### Login
```
User clicks "Google" → Supabase OAuth → Google consent → /auth/callback → exchangeCodeForSession(code) → redirect /
User fills email/password → signInWithPassword() → cookie set → router.push('/')
```

### Registration
```
User fills name/email/password → signUp({ email, password, data: { full_name } })
→ Supabase sends verification email → User clicks link → Account active
```

### Password Reset
```
User clicks "Forgot password" → POST /api/auth/forgot-password → Supabase sends reset email
→ User clicks link → /login?reset_token=xxx → POST /api/auth/reset-password
```

### Session Management
Every request passes through Next.js middleware (`src/middleware.ts`):
1. `updateSession()` refreshes the Supabase session cookie
2. `supabase.auth.getUser()` validates the session server-side
3. Routes are protected/redirected based on auth status

## Route Protection

Defined in `src/lib/supabase/middleware.ts`:

| Route Pattern | Rule |
|---------------|------|
| `/create`, `/messages`, `/profile`, `/settings`, `/admin`, `/notifications` | Auth required → redirect `/login` |
| `/login` | Authenticated users → redirect `/` |
| `/onboarding` | Shown if `profiles.onboarding_completed = false` |
| `/api/*` | No redirect (API routes handle auth internally) |

## API Route Auth Pattern

Every API route follows this pattern:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // 1. Verify auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit
  const ip = getClientIp(request)
  if (someLimiter.isLimited(ip)) return rateLimitResponse()

  // 3. Validate input
  const body = await request.json()

  // 4. Use admin client for mutations (bypasses RLS)
  const admin = createAdminClient()
  const { error } = await admin.from('table').insert({ ... })

  // 5. Return response
  return NextResponse.json({ success: true })
}
```

## Rate Limiting

In-memory sliding window counters per IP (`src/lib/rate-limit.ts`). CIS Benchmark compliant.

| Limiter | Limit | Window |
|---------|-------|--------|
| `authLimiter` | 10 | 15 min |
| `registerLimiter` | 5 | 1 hour |
| `createLimiter` | 30 | 1 hour |
| `messageLimiter` | 60 | 1 min |
| `reviewLimiter` | 20 | 1 hour |
| `reportLimiter` | 10 | 1 hour |
| `rentalLimiter` | 20 | 1 hour |
| `adLimiter` | 10 | 1 hour |
| `globalLimiter` | 200 | 1 min |
| `subscribeLimiter` | 10 | 1 hour |

Map size capped at 10,000 entries to prevent OOM in serverless.

## Security Headers (CIS Benchmark)

Configured in `next.config.ts`:

| Header | Value | CIS Ref |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | 4.1 |
| `X-Frame-Options` | `DENY` | 4.2 |
| `X-XSS-Protection` | `1; mode=block` | 4.3 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | 4.4 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 4.5 |
| `Permissions-Policy` | Camera, mic, USB disabled; geolocation, payment self-only | 4.6 |
| `Content-Security-Policy` | Strict CSP allowing Supabase, Stripe, OSM tiles | 4.7 |

## API Routes Reference

### Auth
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| DELETE | `/api/auth/delete-account` | GDPR account deletion |
| GET | `/api/auth/export` | GDPR data export (JSON) |

### Content
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/onboarding` | Complete onboarding profile |
| GET | `/api/notifications` | Paginated notification list |
| POST | `/api/notify/message` | Trigger message notification |

### Pro Subscriptions
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/pro/status` | Check Pro subscription status |
| POST | `/api/pro/checkout` | Create Stripe Checkout session |
| POST | `/api/pro/cancel` | Cancel Pro subscription |
| POST | `/api/pro/reactivate` | Reactivate cancelled subscription |

### Rentals
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/rentals/book` | Create rental booking |
| GET | `/api/rentals/my-bookings` | List user's bookings |
| POST | `/api/rentals/:id/confirm` | Lender confirms booking |
| POST | `/api/rentals/:id/cancel` | Cancel booking |
| POST | `/api/rentals/:id/complete` | Mark as returned |
| POST | `/api/rentals/:id/pay` | Create payment for booking |
| POST | `/api/rentals/:id/dispute` | Open dispute (admin) |
| POST | `/api/rentals/:id/refund` | Refund booking (admin) |
| POST | `/api/rentals/:id/review` | Review completed rental |
| GET | `/api/rentals/connect/status` | Stripe Connect account status |
| POST | `/api/rentals/connect/onboard` | Start Connect onboarding |

### Ads
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/ads` | List/create ad campaigns |
| GET/PUT/DELETE | `/api/ads/:id` | Single campaign CRUD |
| GET | `/api/ads/mine` | My campaigns |
| GET | `/api/ads/feed` | Active ads for feed |
| POST | `/api/ads/:id/pay` | Pay for campaign |
| POST | `/api/ads/:id/pause` | Pause campaign |
| POST | `/api/ads/:id/resume` | Resume campaign |
| POST | `/api/ads/:id/click` | Track click |
| POST | `/api/ads/:id/impression` | Track impression |
| POST | `/api/ads/business/register` | Register business account |

### Payments
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/stripe/webhook` | Unified Stripe webhook |

### System
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check (DB connectivity) |

## Dev Mode

When `STRIPE_SECRET_KEY` is not set, all payment operations activate instantly without real charges. The app is fully functional without Stripe configured.
