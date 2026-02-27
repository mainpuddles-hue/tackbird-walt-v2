# Helsinki Dusk — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual overhaul of TackBird V2 — new color system, typography, component redesign following the "Helsinki Dusk" / Arctic Minimal design language.

**Architecture:** Replace CSS custom properties and Tailwind theme tokens in globals.css. Swap fonts in layout.tsx. Redesign each component in-place (no new files except font loading). Remove bulletin-board metaphor (pushpin, cork gradient). Add left-edge category accent bars to cards.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Google Fonts (Bricolage Grotesque + Instrument Sans), Lucide React icons, shadcn/ui components.

---

### Task 1: Color System + CSS Tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/constants.ts`

**Step 1: Replace CSS custom properties in globals.css**

Replace the entire `:root` block with Helsinki Dusk tokens:

```css
:root {
  --radius: 0.625rem;
  --background: #F5F4F0;
  --foreground: #1A1A2E;
  --card: #FFFFFF;
  --card-foreground: #1A1A2E;
  --popover: #FFFFFF;
  --popover-foreground: #1A1A2E;
  --primary: #1E3A5F;
  --primary-foreground: #FFFFFF;
  --secondary: #ECEAE4;
  --secondary-foreground: #1A1A2E;
  --muted: #ECEAE4;
  --muted-foreground: #8B8680;
  --accent: #D4654A;
  --accent-foreground: #FFFFFF;
  --destructive: #C43C3C;
  --destructive-foreground: #FFFFFF;
  --border: #C4BFB8;
  --input: #C4BFB8;
  --ring: #1E3A5F;
  --chart-1: #D4654A;
  --chart-2: #2B6B4F;
  --chart-3: #3B7DD8;
  --chart-4: #C98B2E;
  --chart-5: #7C5CBF;
  --sidebar: #F5F4F0;
  --sidebar-foreground: #1A1A2E;
  --sidebar-primary: #1E3A5F;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #ECEAE4;
  --sidebar-accent-foreground: #1A1A2E;
  --sidebar-border: #C4BFB8;
  --sidebar-ring: #1E3A5F;
}
```

Replace `.dark` block:

```css
.dark {
  --background: #0D0D15;
  --foreground: #E8E6E0;
  --card: #1E1E35;
  --card-foreground: #E8E6E0;
  --popover: #1E1E35;
  --popover-foreground: #E8E6E0;
  --primary: #6BA3D6;
  --primary-foreground: #0D0D15;
  --secondary: #16162A;
  --secondary-foreground: #E8E6E0;
  --muted: #16162A;
  --muted-foreground: #6E6A64;
  --accent: #E8856E;
  --accent-foreground: #0D0D15;
  --destructive: #E07A5F;
  --destructive-foreground: #FFFFFF;
  --border: #2E2E48;
  --input: #2E2E48;
  --ring: #6BA3D6;
  --chart-1: #E8856E;
  --chart-2: #5BBF8E;
  --chart-3: #6BA3D6;
  --chart-4: #E8B84A;
  --chart-5: #A78BFA;
  --sidebar: #16162A;
  --sidebar-foreground: #E8E6E0;
  --sidebar-primary: #6BA3D6;
  --sidebar-primary-foreground: #0D0D15;
  --sidebar-accent: #16162A;
  --sidebar-accent-foreground: #E8E6E0;
  --sidebar-border: #2E2E48;
  --sidebar-ring: #6BA3D6;
}
```

**Step 2: Replace animation system in globals.css**

Remove ALL existing keyframes and animation classes (popIn, fadeInUp, cardEntrance, slideInLeft, slideInRight, badgePulse, tabDotIn, pageEnter, scaleIn, stagger classes, button:active scale). Replace with:

```css
/* ─── Helsinki Dusk Animation System ─── */

/* Feed card entrance — opacity only */
@keyframes cardFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-card-in {
  animation: cardFadeIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}

/* Stagger delays */
.stagger-1 { animation-delay: 60ms; }
.stagger-2 { animation-delay: 120ms; }
.stagger-3 { animation-delay: 180ms; }
.stagger-4 { animation-delay: 240ms; }
.stagger-5 { animation-delay: 300ms; }
.stagger-6 { animation-delay: 360ms; }
.stagger-7 { animation-delay: 420ms; }
.stagger-8 { animation-delay: 480ms; }
.stagger-9 { animation-delay: 540ms; }
.stagger-10 { animation-delay: 600ms; }

/* Page-level fade */
@keyframes pageIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-page-in {
  animation: pageIn 0.25s ease both;
}

/* Login stagger entrance */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Tab active dot */
@keyframes dotIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Typing indicator */
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.typing-dots span {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: currentColor;
  margin: 0 1px;
  animation: typing-dot 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

/* Smooth focus ring */
:focus-visible {
  transition: outline-offset 0.15s ease;
  outline-offset: 2px;
}

/* No button scale on press — just color change */
button {
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}
```

**Step 3: Update constants.ts category colors**

Replace `CATEGORIES` color values with Helsinki Dusk tones:

```typescript
tarvitsen: { ..., color: '#C75B3A', bgLight: '#FDF0EB', bgDark: '#2A1A15' },
tarjoan:   { ..., color: '#7C5CBF', bgLight: '#F4EFFF', bgDark: '#1A1525' },
ilmaista:  { ..., color: '#3B7DD8', bgLight: '#EBF2FE', bgDark: '#101A2D' },
nappaa:    { ..., color: '#C43C3C', bgLight: '#FDECEC', bgDark: '#2D1010' },
lainaa:    { ..., color: '#C98B2E', bgLight: '#FDF6E8', bgDark: '#2D2010' },
tapahtuma: { ..., color: '#2B8A62', bgLight: '#E8F7EF', bgDark: '#102D1A' },
tilannehuone: { ..., color: '#1E8CA0', bgLight: '#E6F6FA', bgDark: '#102D2B' },
```

Remove `BOARD` export entirely (no more bulletin board).

**Step 4: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`
Expected: Build succeeds (BOARD import will break — fix in Task 3)

---

### Task 2: Typography — Fonts

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (font variables in @theme)

**Step 1: Replace fonts in layout.tsx**

```typescript
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
})

const instrument = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
  display: 'swap',
})
```

Remove Plus_Jakarta_Sans and Geist_Mono imports.

Update body className:
```tsx
<body className={`${bricolage.variable} ${instrument.variable} font-sans antialiased`}>
```

**Step 2: Update font CSS variables in globals.css @theme block**

```css
--font-sans: var(--font-instrument);
--font-mono: var(--font-geist-mono, monospace);
```

Add after `@layer base`:
```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-bricolage), sans-serif;
}
```

**Step 3: Update viewport themeColor in layout.tsx**

```typescript
themeColor: [
  { media: '(prefers-color-scheme: light)', color: '#F5F4F0' },
  { media: '(prefers-color-scheme: dark)', color: '#0D0D15' },
],
```

**Step 4: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`
Expected: Build succeeds, fonts load

---

### Task 3: Post Card Redesign

**Files:**
- Modify: `src/components/post-card.tsx`

**Step 1: Remove pushpin and bulletin-board styling**

- Remove `import { Pushpin }` and `import { BOARD }` from imports
- Remove the pushpin `<div>` block entirely
- Remove `BOARD.paperShadow` / `BOARD.paperShadowDark` references
- Remove the inline `borderTop: 3px solid` style
- Remove the cork background gradient for pro items

**Step 2: Add left-edge category accent bar**

Replace Card's style prop with:

```tsx
<Card
  className={cn(
    'overflow-hidden border transition-all duration-150 ease-in-out hover:border-[var(--color-muted-foreground)] hover:shadow-[0_1px_3px_rgba(26,26,46,0.04)]',
    'rounded-2xl',
    isPro && 'ring-1 ring-amber-400/40'
  )}
>
  {/* Left accent bar */}
  <div
    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
    style={{ backgroundColor: category?.color ?? '#888' }}
  />
  <CardContent className="p-4 pl-5">
```

Remove all inline `style={{}}` from the Card (backgroundColor, backgroundImage, boxShadow, borderRadius, borderTop).

**Step 3: Simplify hover — no translateY**

The hover classes are already set in Step 1: `hover:border-[var(--color-muted-foreground)] hover:shadow-[0_1px_3px_rgba(26,26,46,0.04)]`. Remove `hover:-translate-y-1` and `hover:shadow-lg`.

**Step 4: Update pro styling**

For pro cards, use subtle amber tint instead of gold gradient:
```tsx
backgroundColor: isPro
  ? (isDark ? 'rgba(217,165,50,0.06)' : 'rgba(217,165,50,0.04)')
  : undefined
```

Apply this as inline style on CardContent, not on Card.

**Step 5: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`
Expected: Build succeeds. PostCard renders with left accent bar, no pushpin.

---

### Task 4: Header Redesign

**Files:**
- Modify: `src/components/header.tsx`

**Step 1: Update header styling**

Replace the header className:
```tsx
<header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-card)]">
```

Remove `backdrop-blur`, `supports-[backdrop-filter]`, `transition-[backdrop-filter]`, `bg-background/95`.

**Step 2: Update logo text**

Replace:
```tsx
<span className="text-lg font-bold tracking-tight">TackBird</span>
```
With:
```tsx
<span className="font-[family-name:var(--font-bricolage)] text-[15px] font-medium tracking-[0.06em] uppercase">TackBird</span>
```

**Step 3: Remove hover rotation from logo**

Replace `group-hover:rotate-[-8deg]` with just `text-foreground`.

**Step 4: Update notification badge**

Remove `animate-badge-pulse` class. Replace with static styling:
```tsx
<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4654A] px-1 text-[10px] font-medium text-white">
```

**Step 5: Update icon styling**

Change icons to use `--stone` color:
```tsx
<Search className="h-[18px] w-[18px] text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
<Map className="h-[18px] w-[18px] text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
<Bell className="h-[18px] w-[18px] text-[var(--color-muted-foreground)]" strokeWidth={1.5} />
```

**Step 6: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`

---

### Task 5: Tab Bar Redesign

**Files:**
- Modify: `src/components/tab-bar.tsx`

**Step 1: Update nav container**

Replace:
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
```
With:
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-card)] pb-[env(safe-area-inset-bottom)]">
```

**Step 2: Redesign "Luo" (Create) tab**

Remove the circle background. Replace the entire create block with:

```tsx
if (isCreate) {
  return (
    <Link
      key={href}
      href={href}
      className="relative flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-0.5 px-3 py-1"
    >
      <Icon className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.75} />
      <span className="font-[family-name:var(--font-bricolage)] text-[10px] text-[var(--color-accent)]">{label}</span>
    </Link>
  )
}
```

**Step 3: Update regular tabs**

Icon styling:
```tsx
<Icon className="h-5 w-5" strokeWidth={isActive ? 1.75 : 1.25} />
```

Remove `hover:scale-105`, `stroke-[2.5]`.

Label font: add `font-[family-name:var(--font-bricolage)]`.

**Step 4: Update active dot**

Replace the dot to use ember color and opacity animation:
```tsx
{isActive && (
  <span
    className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--color-accent)]"
    style={{ animation: 'dotIn 0.2s ease both' }}
  />
)}
```

**Step 5: Update message badge**

Remove `animate-badge-pulse`:
```tsx
<span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#D4654A] px-0.5 text-[9px] font-bold text-white">
```

**Step 6: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`

---

### Task 6: Login Page Redesign

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

**Step 1: Update background**

Replace the inline gradient with solid mist:
```tsx
<div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-[var(--color-background)] relative">
```

**Step 2: Add watermark bird**

After the opening div, before the card:
```tsx
{/* Watermark */}
<div className="absolute top-1/4 opacity-[0.04] pointer-events-none">
  <TackBirdLogo size={160} className="text-foreground" />
</div>
```

**Step 3: Redesign card**

Replace:
```tsx
<div className="w-full max-w-sm space-y-6 rounded-2xl bg-white/90 dark:bg-card/95 p-8 shadow-[0_2px_16px_rgba(0,0,0,0.08)] backdrop-blur">
```
With:
```tsx
<div className="relative z-10 w-full max-w-sm space-y-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 shadow-[0_4px_24px_rgba(26,26,46,0.06)]">
```

**Step 4: Update logo section**

Replace inline animation styles with class-based opacity animation:
```tsx
<div className="flex flex-col items-center gap-3" style={{ animation: 'fadeIn 0.5s ease both' }}>
  <TackBirdLogo size={48} className="text-foreground" />
  <div className="text-center">
    <h1 className="font-[family-name:var(--font-bricolage)] text-xl font-medium tracking-[0.06em] uppercase">TackBird</h1>
    <p className="text-sm text-muted-foreground mt-1">Naapurustosi ilmoitustaulu</p>
  </div>
</div>
```

**Step 5: Update button styling**

Primary button: already uses `--primary` token (now #1E3A5F). Add rounded-xl:
```tsx
<Button type="submit" className="w-full rounded-xl" ...>
```

Google button: outline with rounded-xl:
```tsx
<Button variant="outline" className="w-full rounded-xl" ...>
```

**Step 6: Update all fadeInUp → fadeIn animations**

Replace all `animation: 'fadeInUp ...'` with `animation: 'fadeIn ...'` throughout the file (5-6 occurrences).

**Step 7: Update forgot-password view**

Same card styling changes. Remove cork gradient background.

**Step 8: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`

---

### Task 7: Feed Client Redesign

**Files:**
- Modify: `src/app/(app)/feed-client.tsx`

**Step 1: Remove cork gradient background**

Replace:
```tsx
style={{
  background: isDark
    ? 'linear-gradient(180deg, #1a1a1a 0%, #1a1815 100%)'
    : 'linear-gradient(180deg, #F7F5F0 0%, #ede5d5 100%)',
}}
```
With no style prop — just use `bg-background`:
```tsx
<div className="min-h-screen space-y-3 p-4">
```

**Step 2: Update card entrance animation class**

Replace `animate-card-entrance` with `animate-card-in`:
```tsx
className={`animate-card-in ${index < 10 ? `stagger-${index + 1}` : ''}`}
```

**Step 3: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`

---

### Task 8: Scroll-to-Top Redesign

**Files:**
- Modify: `src/components/scroll-to-top.tsx`

**Step 1: Replace with minimal design**

Replace TackBirdLogo with ArrowUp icon. Use ink background:

```tsx
import { ArrowUp } from 'lucide-react'

// In the return:
<Button
  variant="outline"
  size="icon"
  onClick={scrollToTop}
  className={cn(
    'fixed bottom-24 right-4 z-40 h-11 w-11 rounded-full bg-[var(--color-foreground)] border-none transition-opacity duration-200',
    visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
  )}
  aria-label="Takaisin ylös"
>
  <ArrowUp className="h-5 w-5 text-[var(--color-card)]" strokeWidth={1.5} />
</Button>
```

Remove the `scaleIn` animation and scale transform classes.

**Step 2: Verify**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`

---

### Task 9: Remove Pushpin Component References

**Files:**
- Check: any remaining imports of `Pushpin` or `BOARD` from constants

**Step 1: Search for remaining BOARD/Pushpin references**

Run: `grep -r "BOARD\|Pushpin\|pushpin\|paperShadow" src/ --include="*.tsx" --include="*.ts" -l`

Fix any remaining imports by removing them.

**Step 2: Verify full build**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npx next build`
Expected: Clean build, no errors.

---

### Task 10: Visual Verification

**Step 1: Start dev server**

Run: `cd /Users/jesseparkkonen/tackbird-v2 && npm run dev`

**Step 2: Take screenshots**

- Login page (incognito)
- Feed page (logged in)
- Dark mode feed
- Dark mode login

**Step 3: Verify checklist**

- [ ] Bricolage Grotesque renders on headings and logo
- [ ] Instrument Sans renders on body text
- [ ] Background is mist (#F5F4F0) not white
- [ ] Cards have left accent bar (3px, category color)
- [ ] No pushpins visible
- [ ] No cork gradient visible
- [ ] Header: solid bg, no blur, uppercase logo
- [ ] TabBar: no circle on create, dot indicator works
- [ ] Login: watermark bird, rounded-3xl card, mist bg
- [ ] Notification badge: static ember, no pulse
- [ ] Hover on cards: border change + subtle shadow only
- [ ] Dark mode: midnight lake colors (#0D0D15 base)
- [ ] Animations: only opacity, no transform movement
