# Tech Stack

## Runtime & Framework

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| React | React | 19.2.3 |
| Runtime | Node.js | 20+ (Vercel serverless) |

## Backend (Supabase)

| Service | Purpose |
|---------|---------|
| **Supabase Auth** | Google OAuth + email/password, cookie-based sessions via `@supabase/ssr` |
| **Supabase Database** | PostgreSQL with Row-Level Security (RLS) |
| **Supabase Storage** | Image storage: `posts`, `messages`, `avatars` buckets |
| **Supabase Realtime** | WebSocket channels for messages and typing indicators |

Client libraries:
- `@supabase/supabase-js` ^2.97.0
- `@supabase/ssr` ^0.8.0

## Payments (Stripe)

| Feature | Stripe Product |
|---------|---------------|
| Pro subscriptions | Stripe Checkout + Webhooks |
| Rental payments | Stripe Connect (Express accounts, destination charges) |
| Ad campaigns | Stripe Checkout with metadata routing |

Library: `stripe` ^20.4.0 (server-side only)

## UI

| Tool | Purpose |
|------|---------|
| **Tailwind CSS** v4 | Utility-first styling |
| **shadcn/ui** (Radix) | Component primitives (15 components) |
| **Lucide React** | Icon library (tree-shakeable) |
| **Sonner** | Toast notifications |
| **next-themes** | Dark/light/system theme switching |
| **Geist** | Font family (sans + mono) |

shadcn components installed: avatar, badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, sonner, switch, tabs, textarea.

## Maps

| Library | Purpose |
|---------|---------|
| **Leaflet** 1.9.4 | Map rendering |
| **react-leaflet** 5.0.0 | React bindings |

Tiles: OpenStreetMap (free, no API key).

## Internationalization

| Library | Setup |
|---------|-------|
| Custom `useI18n` hook | `src/lib/i18n/index.tsx` |
| Locales | `fi.json`, `en.json`, `sv.json` |

Default locale: Finnish (`fi`). User preference stored in `profiles.language`.

## Dev Tools

| Tool | Config |
|------|--------|
| ESLint | `eslint.config.mjs` (eslint-config-next) |
| TypeScript | `tsconfig.json` (strict mode) |
| PostCSS | `@tailwindcss/postcss` v4 |

## Environment Variables

See `.env.example` for full list. Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Admin client (server-side only)

Optional:
- `STRIPE_SECRET_KEY` — Enables payment features (app runs without it)
- `SMTP_HOST` — Enables real email sending (falls back to console.log)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — Push notifications
