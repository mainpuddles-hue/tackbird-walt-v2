# Frontend Patterns

## Component Architecture

### Server/Client Split

Every route uses the same pattern:

```
src/app/(app)/feature/
  page.tsx              ← Server component: auth + data fetch
  feature-client.tsx    ← Client component: UI + interactivity
```

**Server component** (`page.tsx`):
```typescript
import { createClient } from '@/lib/supabase/server'
import { FeatureClient } from './feature-client'

export default async function FeaturePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select('*')
  return <FeatureClient initialData={data ?? []} />
}
```

**Client component** (`feature-client.tsx`):
```typescript
'use client'
export function FeatureClient({ initialData }: Props) {
  const [items, setItems] = useState(initialData)
  // ... interactivity
}
```

### Layout Structure

```
RootLayout (src/app/layout.tsx)
  ├── Providers (theme, i18n, error boundary, toaster)
  └── AppLayout (src/app/(app)/layout.tsx)
       ├── Header
       ├── NetworkStatus
       ├── <main> (max-w-md, pb-20)
       ├── TabBar (bottom navigation)
       ├── ScrollToTop (FAB)
       └── CookieConsent
```

The app is mobile-first: `max-w-md` (448px) centered content.

## UI Library

### shadcn/ui Components

15 installed primitives from `src/components/ui/`:

avatar, badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, sonner, switch, tabs, textarea

**Usage:** Import from `@/components/ui/component-name`.

### Icons

Lucide React only. No emoji in UI.

```typescript
import { MapPin, Clock, Crown } from 'lucide-react'
```

### Toasts

Sonner via `toast()` from `sonner`:

```typescript
import { toast } from 'sonner'
toast.success('Tallennettu')
toast.error('Virhe tapahtui')
```

Rendered by `<Toaster position="top-center" richColors closeButton />` in Providers.

### Theme

`next-themes` with three modes: light, dark, system.

```typescript
import { useTheme } from 'next-themes'
const { resolvedTheme } = useTheme()
```

Theme class applied to `<html>`. Tailwind `dark:` variants for styling.

## Key Components

### PostCard (`src/components/post-card.tsx`)

Feed card for posts. Features:
- Category color stripe (3px top border)
- Category-specific light/dark background color
- Pro badge (amber ring) for promoted posts
- User avatar, name, neighborhood, timestamp
- Post image with fallback
- Multi-image indicator badge

Entire card is a `<Link>` to `/post/[id]`.

### FilterBar (`src/components/filter-bar.tsx`)

Horizontal scrollable chip filter for post categories. Used in feed and map views.

### TabBar (`src/components/tab-bar.tsx`)

Bottom navigation with 5 tabs: Home, Events, Create (+), Messages, Profile. Fixed at bottom, hidden on certain views (settings, admin).

### Header (`src/components/header.tsx`)

Top app bar with logo, search, notifications bell with unread count.

### ErrorBoundary (`src/components/error-boundary.tsx`)

Class component wrapping entire app. Shows "Something went wrong" with reload button instead of white screen.

### NetworkStatus (`src/components/network-status.tsx`)

Shows offline indicator bar when `navigator.onLine` is false.

## Hooks

### `useFocusTrap(containerRef, isActive)`
Traps Tab/Shift+Tab within a container. Restores focus on deactivate. Used for custom modals that don't use shadcn Dialog.

### `usePushNotifications()`
Web Push subscribe/unsubscribe. Uses VAPID keys.

## Patterns

### Data Mutations from Client

```typescript
const response = await fetch('/api/feature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
if (!response.ok) throw new Error()
toast.success('Done')
```

Always show toast feedback on success/error.

### Image Upload

```typescript
import { optimizePostImage } from '@/lib/image-optimize'

const optimized = await optimizePostImage(file)  // Canvas resize/compress
const path = `posts/${userId}/${Date.now()}.webp`
const { error } = await supabase.storage.from('posts').upload(path, optimized, {
  contentType: optimized.type,
  upsert: false,
})
const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)
```

Three optimization presets: `optimizePostImage` (1200px), `optimizeAvatar` (400px), `optimizeMessageImage` (800px).

### Realtime

```typescript
const channel = supabase
  .channel(`conversation:${id}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
    (payload) => setMessages(prev => [...prev, payload.new])
  )
  .subscribe()
```

Used for: new messages in conversations, typing indicators (broadcast channel).

### Internationalization

```typescript
import { useI18n } from '@/lib/i18n'
const { t, locale, setLocale } = useI18n()
// t('feed.title') → "Ilmoitustaulu" (fi) / "Bulletin Board" (en)
```

Three locales: `fi` (default), `en`, `sv`. JSON files in `src/lib/i18n/`.

### Finnish Locale Formatting

Always use formatters from `src/lib/format.ts` for user-facing values:

```typescript
import { formatTimeAgo, formatPrice, formatNumber } from '@/lib/format'
formatPrice(10)         // "10,00 €"
formatTimeAgo(date)     // "2 tuntia sitten"
formatNumber(1500)      // "1 500"
```

## Accessibility

- Focus trap on custom modals/overlays (`useFocusTrap`)
- shadcn Dialog/Sheet have built-in focus management
- Escape key closes modals
- Semantic HTML: `<main>`, `<nav>`, proper heading hierarchy
- Alt text on images
- `aria-label` on icon-only buttons
