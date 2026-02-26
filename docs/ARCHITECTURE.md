# Architecture

## Overview

TackBird is a neighborhood bulletin board app (Finnish: "naapuriapu-sovellus"). Users post requests, offers, free items, rentals, and events within their Helsinki neighborhood.

The app is a **Next.js 16 App Router** application backed by **Supabase** (PostgreSQL + Auth + Storage + Realtime) with **Stripe** for payments.

## Directory Structure

```
src/
  app/
    (app)/              # Authenticated app routes (protected by middleware)
      admin/            # Admin panel (6-tab dashboard)
      create/           # Create post form
      events/           # Events listing + calendar view
      map/              # Leaflet map with markers
      messages/         # Conversation list + [id] chat
      notifications/    # Notification list with filters
      onboarding/       # 4-step onboarding flow
      post/[id]/        # Post detail page
      profile/          # Own profile + [userId] public profiles
      saved/            # Saved/bookmarked posts
      search/           # Search with filters
      settings/         # Settings + blocked users
      reset-password/   # Password reset form
      layout.tsx        # App shell: header, tab bar, cookie consent
      page.tsx          # Feed (home) — server component → feed-client
    (auth)/
      login/            # Login/register page (Google OAuth + email)
    api/
      ads/              # Ad campaign CRUD, feed, impression/click tracking
      auth/             # Delete account, export data, forgot/reset password
      health/           # Health check endpoint
      notifications/    # Paginated notification list
      notify/message/   # Message notification trigger
      onboarding/       # Onboarding profile setup
      pro/              # Pro subscription management
      rentals/          # Rental booking CRUD, Connect, payments
      stripe/webhook/   # Unified Stripe webhook handler
    auth/callback/      # Supabase OAuth callback (code → session)
  components/
    ui/                 # shadcn/ui primitives (15 components)
    ad-card.tsx         # Native ad card for feed
    ad-dashboard.tsx    # Business ad campaign management
    calendar-view.tsx   # Month grid calendar for events
    cookie-consent.tsx  # GDPR cookie consent banner
    create-ad-modal.tsx # Ad campaign creation form
    error-boundary.tsx  # React error boundary
    filter-bar.tsx      # Category filter chips
    header.tsx          # App header with nav
    network-status.tsx  # Offline indicator
    password-strength.tsx # Password validation indicators
    post-card.tsx       # Post card for feed/search
    pro-upgrade-modal.tsx # Pro subscription CTA
    providers.tsx       # ThemeProvider + Toaster wrapper
    scroll-to-top.tsx   # Scroll-to-top FAB
    tab-bar.tsx         # Bottom navigation tabs
  hooks/
    use-focus-trap.ts   # Focus trap for modals (a11y)
    use-push-notifications.ts # Web Push subscribe/unsubscribe
  lib/
    supabase/           # Supabase client factories (client, server, admin, middleware)
    i18n/               # Internationalization (fi/en/sv)
    constants.ts        # Categories, badges, neighborhoods
    email.ts            # Transactional email (nodemailer/console fallback)
    format.ts           # Finnish locale formatters (time, price, numbers)
    image-optimize.ts   # Client-side Canvas image optimization
    rate-limit.ts       # In-memory rate limiters (CIS compliant)
    stripe.ts           # Stripe client singleton + pricing constants
    types.ts            # TypeScript interfaces for all entities
    utils.ts            # cn() helper (clsx + tailwind-merge)
```

## Data Flow

### Server Components (data fetching)
```
page.tsx (server) → Supabase query → pass data as props → *-client.tsx (client)
```
Every route follows this pattern. The server component handles auth verification and data fetching. The client component handles interactivity.

### API Routes (mutations)
```
Client component → fetch('/api/...') → API route → Supabase admin client → response
```
API routes use the **admin client** (service role key, bypasses RLS) for mutations that need elevated permissions. Read-only operations in server components use the **user client** (respects RLS).

### Realtime
```
Supabase Realtime → postgres_changes channel → client state update
```
Used for: new messages in conversation view, typing indicators (broadcast channel).

## Database

PostgreSQL via Supabase. Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase auth.users) |
| `posts` | Bulletin board posts (7 types) |
| `post_images` | Additional images per post |
| `events` | Community events |
| `event_attendees` | Event RSVPs |
| `conversations` | 1-on-1 message threads |
| `messages` | Chat messages |
| `notifications` | In-app notifications |
| `reviews` | User reviews (1-5 stars) |
| `saved_posts` | Bookmarked posts |
| `blocked_users` | User blocks |
| `rental_bookings` | Rental marketplace bookings |
| `rental_reviews` | Rental-specific reviews |
| `advertisements` | Ad campaigns |
| `ad_impressions` | Deduplicated impression tracking |
| `hubs` | Community hubs/pickup points |

RLS is enabled on all tables. The admin client bypasses RLS for server-side operations.

## Payment Architecture

Three payment streams, all using Stripe:

1. **Pro Subscriptions** — Monthly subscription via Stripe Checkout. Webhook handles activation/renewal/cancellation.
2. **Rental Marketplace** — Stripe Connect (Express accounts). Platform takes 10% commission (5% for Pro users) via destination charges.
3. **Ad Campaigns** — Per-day pricing (2.99/day, 2.39/day for Pro). Stripe Checkout with campaign metadata.

All three share a **unified webhook handler** at `/api/stripe/webhook` that routes events by `metadata.type` field.

**Dev mode**: When `STRIPE_SECRET_KEY` is not set, all payment operations activate instantly without real charges. The app is fully functional without Stripe.

## Security

- CIS Benchmark-compliant security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting on all API routes (in-memory sliding window)
- Supabase Auth with cookie-based sessions
- Middleware redirects for protected/auth routes
- Onboarding enforcement (redirect if not completed)
- Input validation on all API routes
- GDPR: data export, account deletion, cookie consent
