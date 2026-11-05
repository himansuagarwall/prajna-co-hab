# Prajna Co-hab — Design System

## Overview

One folk-art house, one surface, one voice. Every colour, spacing step, motion curve and component on this site derives from the tokens below. If it is not in this file, it does not exist.

---

## 1. Colour Roles (v13)

Six colours, one job each.

| Variable | Role | Where It Goes |
|---|---|---|
| `--terra` | Action and money | buttons, prices, links, call bars, hover states |
| `--terra-dark` | Action hover / emphasis | hover states, prices that need contrast |
| `--ochre` | Ornament only | rules, dots, trim, watermarks, dividers |
| `--ink` | Weight | headings, body text, dark bands |
| `--ink-deep` | Dark bands | the warm-dark backgrounds, not black |
| `--muted` | Secondary text | captions, meta text, timestamps |

**Rules:**
- Terracotta never ornaments. Ochre never acts or costs.
- No new colours without retiring an existing one.
- All contrast is measured, not assumed. Minimum 4.5:1 for body text.

---

## 2. Typography

| Variable | Value | Use |
|---|---|---|
| `--font-head` | Marcellus, Optima, Georgia | headings only |
| `--font-ui` | Alegreya Sans, system-ui | buttons, nav, labels, meta |
| `--font-body` | `var(--font-ui)` | body text |

**Scale (rem-based):**
- `h1`: `clamp(1.95rem, 4.2vw, 2.75rem)`
- `h2`: `clamp(1.35rem, 2.6vw, 1.8rem)`
- `h3`: `1.2rem`
- `body`: `clamp(.95rem, 1.7vw, 1.02rem)`
- `lede`: `clamp(.96rem, 1.9vw, 1.08rem)`

**Line height:** 1.66 for body, 1.18 for headings.

---

## 3. Spacing (8px base)

| Variable | Value |
|---|---|
| `--sp-xs` | 8px |
| `--sp-sm` | 16px |
| `--sp-md` | 24px |
| `--sp-lg` | 32px |
| `--sp-xl` | 48px |
| `--sp-2xl` | 64px |

**Section rhythm:**
- Normal section: `clamp(2.2rem, 4.5vw, 3.4rem) 0`
- Flat section (follows a heading): `clamp(1.6rem, 3vw, 2.2rem) 0`

---

## 4. Motion (v48)

Four durations, two easing curves.

| Variable | Value | Role |
|---|---|---|
| `--t0` | 140ms | press / click feedback |
| `--t1` | 220ms | hover, colour, small transforms |
| `--t2` | 380ms | state changes: open, close, swap |
| `--t3` | 760ms | arrival: reveals, entrances |

| Variable | Value | Role |
|---|---|---|
| `--e-out` | `cubic-bezier(.22,.61,.36,1)` | things arriving |
| `--e-in-out` | `cubic-bezier(.4,0,.2,1)` | things moving |

**Reduced motion:** all animation removed; content stays visible.

---

## 5. Radius

| Variable | Value |
|---|---|
| `--r-xs` | 2px |
| `--r-sm` | 8px |
| `--r-md` | 12px |
| `--r-pill` | 999px |

**Folk shape rule:** photos and primary buttons carry an arched crown (150px top radius) to read as doorways, not rectangles.

---

## 6. Shadows

| Variable | Value |
|---|---|
| `--sh` | `0 14px 34px rgba(58,50,42,.10)` |

Cards lift on hover by adding shadow, never by adding border.

---

## 7. The Water Column (v51)

The ground beneath all content. Three steps down from paper so caustics have headroom.

| Variable | Value |
|---|---|
| `--water-top` | `#f4ecdc` |
| `--water-mid` | `#ede3cd` |
| `--water-deep` | `#e2d5b9` |

Set on `html` as a fixed linear gradient. Panels sit ON the water with a warm gradient that catches light at the top edge.

---

## 8. Surface

| Variable | Value |
|---|---|
| `--paper` | `#faf5ec` |
| `--panel` | `#fdfaf4` |

Panels are opaque paper, not glass. The header keeps a light blur because it genuinely scrolls over content.

---

## 9. Components

### Button
- Filled: `--terra` background, white text, `--r-sm` radius, folk stitch (inset double border)
- Ghost: transparent, `--ochre` dashed border, `--ochre-soft` hover
- Minimum tap target: 46px

### Card
- `--panel` background, `1px solid --line` border, `--r-md` radius
- Shadow: `--sh` on hover
- Top decoration: `--ochre` dashes at 35% opacity, 80% on hover
- 3D tilt on desktop (`.tilt`)

### Section header
- `.shead` — max-width 38rem, bottom margin 1.5rem
- `.shead h2::after` — `--ochre` rule, scales in on reveal

### Folk line
- `.folkline` — 6px tall, terracotta + ochre dashes and dots
- Animates open on load

### Lotus mark
- `.lotusmark` — 27-30px SVG lotus
- `.lotusbig` — 60px page emblem
- `.lotusmid` — 34px inline with text

### Gallery
- 3:2 aspect ratio, `border-radius: 150px 150px 10px 10px`
- 3D tilt on hover, custom lightbox with spring animation
- No decorative badges; the frame is the target

### Form controls
- `min-height: 46px`, `--r-sm` radius
- Focus ring: `--terra` outline
- Paper-white background with hairline border

---

## 10. Dark Mode

Triggered by `prefers-color-scheme: dark`. All tokens remap; no new colours.

| Light | Dark |
|---|---|
| `--paper: #faf5ec` | `--paper: #1a1714` |
| `--panel: #fdfaf4` | `--panel: #211e19` |
| `--ink: #2b2620` | `--ink: #e8e0d2` |
| `--muted: #7a6f60` | `--muted: #b8ad9c` |
| `--line: #e9e0d2` | `--line: #3a352c` |
| `--water-top: #f4ecdc` | `--water-top: #1a1714` |
| `--water-mid: #ede3cd` | `--water-mid: #15120f` |
| `--water-deep: #e2d5b9` | `--water-deep: #110e0b` |

Dark bands deepen to `rgba(26,23,20,.92)`. Text stays warm, never pure white.

---

## 11. Responsive Breakpoints

| Width | Rule |
|---|---|
| `<= 860px` | Mobile nav (hamburger + slide-in drawer), footer padding for bottom bar |
| `<= 760px` | Reduced motion optimisations, grain hidden |
| `<= 640px` | Gallery goes single column, form controls lift, blur reduces |
| `<= 520px` | Arch radii soften, daystrip goes 1 column |
| `<= 380px` | Tighter padding, smaller h1 |

---

## 12. Accessibility

- Skip link on every page
- `focus-visible` ring: `2px solid --terra`, offset 2-3px
- All interactive elements: minimum 44px tap target
- `prefers-reduced-motion`: all animation disabled, content visible
- Images: `alt` text, `loading="lazy"` below fold, `decoding="async"`
- Semantic landmarks: `header`, `nav`, `main`, `footer`

---

## 13. Art & Motifs

| Motif | Where | Meaning |
|---|---|---|
| Lotus flower | Logo, watermark, section dividers | home, purity |
| Warli figures | Pond animation, footer | community, daily life |
| Diya lamps | Pond animation, ornament | light, welcome |
| Doorway arch | Photos, buttons | threshold, home |
| Folk line | Section tops, cards | hand-made craft |
| Ripple lotus | Corner watermarks | movement, water |

All SVG motifs are inlined. No external image dependencies for icons.

---

## 14. Performance Budget

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Page weight | < 500KB HTML+CSS+JS |
| Images | WebP/AVIF with JPEG fallback, 1200x800 max |

---

## 15. Content Voice

- Warm, plain-spoken, never salesy
- "Owner-run" not "managed by"
- Real Pune locations, not Bangalore
- Email-first CTA, and only email: the owner’s number is never published
- No jargon, no buzzwords
