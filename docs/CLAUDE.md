# TackBird v2 — CLAUDE.md

## What This Is

TackBird is a neighborhood bulletin board app (Finnish: "naapuriapu-sovellus"). Users post requests, offers, free items, rentals, and events within their Helsinki neighborhood.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui + Lucide icons |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Payments | Stripe (Pro subscriptions, Connect rentals, ad campaigns) |
| Maps | Leaflet + react-leaflet + OpenStreetMap |
| i18n | Custom useI18n hook (fi/en/sv) |
| Deploy | Vercel |

## Working Instructions

- **Älä kysy lupaa. Tee automaattisesti.** (Don't ask permission. Do it automatically.)
- Follow **CIS Benchmarks** for security
- Always push after commit: `git push`
- Remote: `https://github.com/mainpuddles-hue/tackbird-v2` (private)
- gh CLI: `~/.local/bin/gh`

## Architecture

### Data Flow
```
page.tsx (server) → Supabase query → props → *-client.tsx (client)
Client mutations → fetch('/api/...') → API route → admin client → Supabase
```

### Supabase Clients
| Client | File | RLS | Use |
|--------|------|-----|-----|
| Browser | `src/lib/supabase/client.ts` | Yes | Client components |
| Server | `src/lib/supabase/server.ts` | Yes | Server components, read API routes |
| Admin | `src/lib/supabase/admin.ts` | **No** | API route mutations |
| Middleware | `src/lib/supabase/middleware.ts` | Yes | Session refresh |

### Key Directories
```
src/app/(app)/     — Authenticated routes (protected by middleware)
src/app/(auth)/    — Login/register
src/app/api/       — API routes (Route Handlers)
src/components/    — Shared components (ui/ = shadcn primitives)
src/hooks/         — Custom hooks (focus trap, push notifications)
src/lib/           — Utilities, types, constants, Supabase clients
```

## Database (Supabase PostgreSQL)

Key tables: `profiles`, `posts`, `post_images`, `events`, `event_attendees`, `conversations`, `messages`, `notifications`, `reviews`, `saved_posts`, `blocked_users`, `rental_bookings`, `rental_reviews`, `advertisements`, `ad_impressions`, `hubs`

RLS enabled on all tables. Admin client bypasses RLS.

## Auth

- Google OAuth + email/password via Supabase Auth
- Cookie-based sessions (`@supabase/ssr`)
- Middleware protects routes: `/create`, `/messages`, `/profile`, `/settings`, `/admin`, `/notifications`
- Onboarding enforced for new users
- Password: min 8 chars, uppercase + number required

## Payments (Stripe)

Three payment streams, one unified webhook at `/api/stripe/webhook`:

1. **Pro subscriptions** — Stripe Checkout, webhook activation
2. **Rentals** — Stripe Connect (Express), 10% commission (5% Pro)
3. **Ads** — Per-day pricing (2.99€/day, 2.39€ Pro)

**Dev mode:** When `STRIPE_SECRET_KEY` is not set, payments activate instantly.

## Security (CIS Benchmark)

- Security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Rate limiting on all API routes (`src/lib/rate-limit.ts`)
- Input validation at API boundaries
- GDPR: data export (`/api/auth/export`), account deletion (`/api/auth/delete-account`), cookie consent

## API Routes

Auth: forgot-password, reset-password, delete-account, export
Pro: status, checkout, cancel, reactivate
Rentals: book, my-bookings, confirm, cancel, complete, pay, dispute, refund, review, connect/onboard, connect/status
Ads: CRUD, feed, mine, pay, pause, resume, click, impression, business/register
System: health, notifications, notify/message, onboarding, stripe/webhook

## UI Conventions

- Mobile-first: `max-w-md` centered
- shadcn/ui primitives for interactive elements
- Lucide React icons only (no emoji in UI)
- `toast()` from Sonner for all user feedback
- Finnish locale formatting via `src/lib/format.ts`
- `cn()` helper for conditional Tailwind classes

## Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional (graceful degradation):**
- `STRIPE_SECRET_KEY` — payments
- `SMTP_HOST` — email (falls back to console.log)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — push notifications

See `.env.example` for full list.

## Scripts

```bash
npm run dev     # Dev server (localhost:3000)
npm run build   # Production build
npm run lint    # ESLint
```

## Documentation

- `docs/API-AUTH.md` — Authentication & API reference
- `docs/ARCHITECTURE.md` — System design
- `docs/DEVELOPMENT.md` — Coding standards
- `docs/FRONTEND.md` — UI patterns
- `docs/GIT-WORKFLOW.md` — Git workflow
- `docs/TECH-STACK.md` — Technology choices
- `docs/TESTING.md` — Verification approach
