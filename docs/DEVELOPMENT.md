# Development

## Prerequisites

- Node.js 20+
- Supabase project (or local Supabase)
- Git

## Setup

```bash
git clone https://github.com/mainpuddles-hue/tackbird-v2.git
cd tackbird-v2
npm install
cp .env.example .env.local    # Fill in Supabase keys
npm run dev                    # http://localhost:3000
```

## Environment Variables

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Optional (features degrade gracefully without these):**
```
STRIPE_SECRET_KEY          # Payments — app works without, payments activate instantly
SMTP_HOST                  # Email — falls back to console.log
NEXT_PUBLIC_VAPID_PUBLIC_KEY  # Push notifications
```

See `.env.example` for the full list with comments.

## Project Structure

```
src/
  app/
    (app)/         # Authenticated routes (header, tab bar, cookie consent)
    (auth)/        # Login/register
    api/           # API routes (Next.js Route Handlers)
    auth/callback/ # OAuth callback
  components/
    ui/            # shadcn/ui primitives
    *.tsx          # Feature components
  hooks/           # Custom React hooks
  lib/
    supabase/      # Client factories (client, server, admin, middleware)
    i18n/          # Translations (fi, en, sv)
    *.ts           # Utilities (format, rate-limit, types, constants, etc.)
```

## Coding Standards

### Server vs Client Components

Every page follows the pattern:
```
page.tsx (server) → fetch data → pass as props → *-client.tsx (client)
```

- Server components: data fetching, auth verification, SEO
- Client components: interactivity, state, event handlers

Mark client components with `'use client'` at the top.

### Supabase Client Usage

| Context | Import | RLS |
|---------|--------|-----|
| Client component | `from '@/lib/supabase/client'` | Yes |
| Server component / read API | `from '@/lib/supabase/server'` | Yes |
| API route mutations | `from '@/lib/supabase/admin'` | **No** (bypasses) |

**Rule:** Use the server client for reads, admin client for writes that need elevated permissions.

### TypeScript

- Strict mode enabled
- All entities typed in `src/lib/types.ts`
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `any` — use `unknown` and narrow

### Styling

- Tailwind CSS v4 utility classes
- `cn()` helper from `src/lib/utils.ts` for conditional classes (`clsx` + `tailwind-merge`)
- shadcn/ui for interactive primitives (Dialog, Sheet, Tabs, etc.)
- Lucide React for icons (tree-shakeable)

### Formatting

All user-facing numbers, prices, dates use Finnish locale formatters from `src/lib/format.ts`:

| Function | Example Output |
|----------|---------------|
| `formatTimeAgo(date)` | "2 tuntia sitten" |
| `formatPrice(10)` | "10,00 €" |
| `formatNumber(1000)` | "1 000" |
| `formatResponseRate(98)` | "98 %" |
| `formatEventDate(date)` | "Torstai 27. helmikuuta 2026" |

### Error Handling

- API routes: return proper HTTP status codes (400, 401, 403, 404, 429, 500)
- Client: `toast.error()` via Sonner for user-facing errors
- React: `ErrorBoundary` component wraps the entire app

### Input Validation

Validate at API boundaries:
- Title: max 200 chars
- Description: max 5,000 chars
- Email: regex validation
- Name: max 100 chars
- Coordinates: lat -90..90, lng -180..180

### Security

- Never expose `service_role_key` to the client
- All API routes check `supabase.auth.getUser()` before proceeding
- Rate limit every API route (use pre-configured limiters from `rate-limit.ts`)
- CIS Benchmark security headers configured in `next.config.ts`
- CSP restricts script/style/connect sources

## Adding a New Feature

### New Page Route
1. Create `src/app/(app)/feature/page.tsx` (server component — fetch data)
2. Create `src/app/(app)/feature/feature-client.tsx` (client component — UI)
3. Add to middleware protected routes if auth required

### New API Route
1. Create `src/app/api/feature/route.ts`
2. Follow auth pattern: `getUser()` → rate limit → validate → admin client → response
3. Add appropriate rate limiter

### New Component
1. Create in `src/components/`
2. Use shadcn/ui primitives where possible
3. Use Lucide icons, not emoji
4. Follow existing patterns for cards, modals, forms

## Scripts

```bash
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
```
