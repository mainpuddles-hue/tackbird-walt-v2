# TackBird "Helsinki Dusk" — Brand & Frontend Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual overhaul — new brand identity, typography, color system, component design, and animations rooted in Finnish design heritage (Marimekko, Aalto, Iittala).

**Aesthetic direction:** Scandinavian minimalism with warmth. "Lakeside Dusk" color palette. Clean but atmospheric. Every element intentional.

**Inspiration:** Finnish design studios, Notion, Linear, Cal.com — but with a distinctly Nordic personality.

---

## Typography

### Fonts

- **Display:** Bricolage Grotesque (Variable, Google Fonts)
  - Warm, imperfect grotesque with personality
  - Used for: logo text, headings, nav labels
  - Weight: Medium (500) for headings, Regular (400) for nav

- **Body:** Instrument Sans (Google Fonts)
  - Clean geometric pair for Bricolage
  - Used for: body text, descriptions, form inputs, meta
  - Weight: Regular (400), Medium (500) for emphasis

### Scale

| Element | Font | Size | Weight | Extras |
|---------|------|------|--------|--------|
| Logo | Bricolage | 18px | 500 | letter-spacing: 0.06em, uppercase |
| H1 | Bricolage | 22px | 500 | — |
| H3/card title | Bricolage | 16px | 500 | — |
| Body | Instrument | 14px | 400 | leading-relaxed |
| Meta/time | Instrument | 12px | 400 | Stone color |
| Badge | Instrument | 11px | 500 | — |
| Button | Instrument | 14px | 500 | — |
| Input | Instrument | 14px | 400 | — |
| Tab label | Bricolage | 11px | 400 | — |

---

## Color System — "Lakeside Dusk"

### Light Mode

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--ink` | `#1A1A2E` | Ink | Primary text, primary buttons |
| `--slate` | `#2D2D44` | Slate | Secondary text, hover states |
| `--mist` | `#F5F4F0` | Mist | Page background |
| `--frost` | `#ECEAE4` | Frost | Surface/sections |
| `--snow` | `#FFFFFF` | Snow | Cards |
| `--ember` | `#D4654A` | Ember | Primary accent (CTA, create) |
| `--ember-soft` | `#FAEBE6` | Ember Soft | Accent background |
| `--pine` | `#2B6B4F` | Pine | Secondary accent (success) |
| `--pine-soft` | `#E8F4ED` | Pine Soft | Secondary accent bg |
| `--stone` | `#8B8680` | Stone | Muted text |
| `--pebble` | `#C4BFB8` | Pebble | Borders |

### Dark Mode — "Midnight Lake"

| Token | Hex | Name |
|-------|-----|------|
| `--ink` | `#E8E6E0` | Text |
| `--slate` | `#A8A4A0` | Secondary text |
| `--mist` | `#0D0D15` | Page background |
| `--frost` | `#16162A` | Surface |
| `--snow` | `#1E1E35` | Cards |
| `--ember` | `#E8856E` | Accent |
| `--ember-soft` | `#2A1A18` | Accent bg |
| `--pine` | `#5BBF8E` | Secondary accent |
| `--pine-soft` | `#142A1E` | Secondary accent bg |
| `--stone` | `#6E6A64` | Muted |
| `--pebble` | `#2E2E48` | Borders |

### Category Colors

| Category | Color | Background |
|----------|-------|------------|
| Tarvitsen | `#C75B3A` | `#FDF0EB` |
| Tarjoan | `#7C5CBF` | `#F4EFFF` |
| Ilmaista | `#3B7DD8` | `#EBF2FE` |
| Nappaa! | `#C43C3C` | `#FDECEC` |
| Lainaa | `#C98B2E` | `#FDF6E8` |
| Tapahtuma | `#2B8A62` | `#E8F7EF` |
| Tilannehuone | `#1E8CA0` | `#E6F6FA` |

Dark mode category backgrounds: 12% opacity of the category color.

---

## Component Design

### Header
- Background: `--snow`, bottom border `1px solid --pebble`
- Logo: TackBird SVG (24px) + "TACKBIRD" Bricolage Medium, letter-spacing 0.06em, uppercase, `--ink`
- Right icons: 20px, 1.25px stroke, `--stone` → hover `--ink`, transition 150ms
- Notification dot: 6px circle, `--ember`, static (no pulse)
- No backdrop-blur, no shadows
- Height: 56px

### Post Card
- Background: `--snow`, border `1px solid --pebble`, rounded-2xl (16px)
- **Left edge accent:** 3px vertical bar on left side, category color (TackBird's visual signature)
- No pushpin icons
- Content flow: avatar(32px) + name(Bricolage 500) + time(Instrument, Stone) → title(Bricolage 500) → description(Instrument, 2 lines) → CTA
- CTA button: ghost style — category color text, hover → category bg at 8% opacity, rounded-lg
- Hover state: border → `--stone`, shadow `0 1px 3px rgba(26,26,46,0.04)`, transition 150ms
- No translateY lift — only border + shadow change
- Category badge: top-right, pill shape, category bg + category color text, 11px Instrument 500

### Tab Bar
- Background: `--snow`, top border `1px solid --pebble`
- 5 tabs: icon (20px, 1.25px stroke) + label (11px Bricolage)
- Inactive: `--stone`
- Active: `--ink` + 4px dot below icon, `--ember` color, animated opacity
- "Luo" tab: `--ember` color for icon and label (no circle background)
- Height: 64px + safe area
- No shadows, no blur

### Login Page
- Full-screen `--mist` background
- Watermark: TackBird SVG, 120px, `--ink` at 5% opacity, top-center behind card
- Card: `--snow`, `rounded-3xl`, `border --pebble`, `shadow: 0 4px 24px rgba(26,26,46,0.06)`
- Padding: 40px
- Logo: TackBird SVG (48px) + "TACKBIRD" + tagline "Naapurustosi ilmoitustaulu" in `--stone`
- Inputs: `--frost` background, `--pebble` border, rounded-xl, focus → `--ink` border
- Primary button: `--ink` bg, `--snow` text, rounded-xl, full-width
- Google button: outline `--pebble`, `--slate` text
- Stagger entrance: opacity 0→1, 500ms ease, 80ms stagger per element

### Onboarding
- Same background as login (`--mist`)
- Step content in `--snow` card
- Progress: thin bar at top, `--ember` fill
- Neighborhood buttons: `--frost` bg, `--pebble` border, rounded-xl, selected → `--pine-soft` bg + `--pine` border
- Continue button: `--ink` bg

### Scroll-to-Top FAB
- Circle 44px, `--ink` bg, white ArrowUp icon (20px)
- Opacity transition in/out, 200ms ease
- No scale animation

---

## Animation Philosophy

**Rule: Only opacity and color transitions. No transforms (translateY, scale, rotate).**

Exception: hover cursor feedback (very subtle).

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Feed cards entrance | opacity 0→1 | 400ms | cubic-bezier(0.25, 0.1, 0.25, 1) |
| Card stagger delay | 60ms per card | — | — |
| Page transition | opacity 0→1 | 250ms | ease |
| Hover (card) | border-color + shadow | 150ms | ease |
| Hover (button) | background-color | 150ms | ease |
| Tab active dot | opacity 0→1 | 200ms | ease |
| FAB show/hide | opacity 0→1 | 200ms | ease |
| Input focus | border-color | 150ms | ease |

**No:** pulse, bounce, popIn, scale, translateY, rotate, slideIn

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/globals.css` | New color system, animation keyframes, remove old animations |
| 2 | `src/app/layout.tsx` | Bricolage Grotesque + Instrument Sans fonts |
| 3 | `src/lib/constants.ts` | Updated category colors + new design tokens |
| 4 | `src/components/header.tsx` | New minimal header design |
| 5 | `src/components/tab-bar.tsx` | New tab bar with dot indicator |
| 6 | `src/components/post-card.tsx` | Left accent bar, no pushpin, new hover |
| 7 | `src/components/tackbird-logo.tsx` | Keep SVG, update default styling |
| 8 | `src/app/(auth)/login/page.tsx` | New login design with watermark |
| 9 | `src/app/(app)/onboarding/page.tsx` | New onboarding styling |
| 10 | `src/app/(app)/feed-client.tsx` | New entrance animation classes |
| 11 | `src/components/scroll-to-top.tsx` | Simplified FAB |

---

## Verification

1. `npm run build` — no errors
2. Visual check: Login, Feed, Events, Profile in both light and dark mode
3. Typography renders correctly (Bricolage + Instrument Sans loaded)
4. Category colors visible in card left-bar accents
5. Animations smooth and minimal (no janky transforms)
6. Dark mode fully themed
