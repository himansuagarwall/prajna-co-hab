# Cross-UX review — Prajna Co-hab (2026-11-06)

Scope: READ-ONLY cross-check against `interior` + `design-repo-kit` mappings.
Methods: code inspection (`assets/style.css`, `site.js`, `gallery.js`, `micro.js`,
`motion.js`, `fluid.js`, `pond.js`), live browser at 1440×900 + 390×844
(screenshots via vision where noted), computed contrast ratios from tokens.
No files edited except this review. Mobile-bar / drawer / lightbox mid-animation
screenshots were re-taken after settling — earlier frames are not evidence.

## Verdict summary

Site is in good shape: no horizontal overflow anywhere, drawer/lightbox/form
focus handling is real, reduced-motion coverage is unusually thorough. Two
real AA risks (terra-as-text, glass-over-dark), one iOS-zoom risk (input font
size), and Lenis is absent by design (native smooth scroll instead).

## Checklist

### 1. Header responsive — PASS (verified live)
- Desktop ≥1025px: single row, brand left, nav right, vacancy pill; `max-height:95px`.
- ≤1024px: hamburger + left glass drawer; vacancy hidden (no wrap/sideways strip).
- 1440 + 390, all 10 pages (`index, rooms, contact, gallery, blog, about, pune,
  discover, feedback, autohub`): `scrollWidth == clientWidth`, no overflow.
- Screenshots: index/rooms/contact/gallery at both widths — header fits, no
  truncation. Vision flagged muted nav links as weakest header text (see §5).

### 2. Nav drawer — PASS (verified live, settled state)
- Left drawer `width:min(86vw,340px)`, `100dvh`, glass `rgba(250,245,236,.94)`
  + `blur(16px)`, links 1.25rem serif stacked, icon-morph X toggle.
- JS (`site.js` v60): `aria-expanded` sync, `inert` on closed drawer, Esc closes
  and returns focus to toggle, link click closes.
- Settled 390px screenshot: all 5 links (Rooms/Pit/Gallery/Guides/Contact)
  visible/readable, X in top-right. Mid-slide frames show bleed-through — that
  is the 380ms animation, not a bug.

### 3. Mobile bar fixed — PASS with note (verified live)
- `position:fixed; bottom:0`, `min-height:56px` (`--bar-h`), `safe-area-inset`
  padding, hidden ≥861px, single `Email` mailto link (56×390 measured).
- Footer reserves `padding-bottom: calc(56px + safe-area + 14px)` = 70px at
  390px, so the bar cannot cover footer content. Vision "overlap" in top-of-page
  screenshots is the fixed bar over mid-page content during scroll — expected.
- Note: bar is Email-only, no Rooms/Contact shortcut. Intentional per
  email-only design; not flagged as defect.

### 4. Focus indicators — PASS (code + live)
- Global `:focus-visible { outline:2px solid var(--terra); offset:3px }`,
  `:focus:not(:focus-visible){outline:none}` (mouse clicks don't get rings).
- Specifics: `.btn` glow, `.segmented [role=tab]`, star-rating
  `input:focus-visible + label` (ochre-ink), gallery image links 3px,
  `[data-tip]:focus-visible` reveals tooltip.
- Live: rooms `<dialog>` open → `document.activeElement` is a BUTTON inside
  dialog; gallery open → close button focused. Native dialog traps focus.

### 5. Contrast AA — PARTIAL: 2 risks (computed from tokens)
| Pair | Ratio | AA normal text |
|---|---|---|
| ink `#2b2620` / paper `#faf5ec` | 13.80:1 | PASS |
| muted `#7a6f60` / paper | 4.53:1 | PASS (barely) |
| muted / panel `#fdfaf4` | 4.72:1 | PASS |
| **terra `#c05621` / paper** | **4.21:1** | **FAIL** |
| terra-dark `#9a4522` / paper | 5.95:1 | PASS |
| white / terra (primary btn) | 4.57:1 | PASS |
| ochre-ink `#7a5a1c` / ochre-soft | 5.32:1 | PASS |
| dark-mode ink/muted on `#1a1714` | 13.6 / 8.1:1 | PASS |
| ochre `#d9a441` / paper | 2.07:1 | FAIL (ornament only — by design, never text; `.tag.gold` correctly uses ochre-ink) |

Risks:
- **Terra as text** (`a{color:var(--terra-dark)}` is safe, but `--terra` is used
  for prices/links in places) at 4.21:1 fails AA for small text. Audit any
  `--terra` (not `-dark`) text usage <18px.
- **Muted nav links** at 4.53:1 pass mathematically but vision at both widths
  called them the weakest header text; over glass (next item) margin evaporates.

### 6. Reduced motion — PASS (code-verified; not browser-emulated)
- CSS: ≥10 `@media (prefers-reduced-motion: reduce)` blocks; global kill-switch
  (`animation/transition:none`), `html{scroll-behavior:auto}`, header/drawer
  transitions off, scrollbar-progress hidden.
- JS gates: `motion.js` (no-op), `fluid.js`, `pond.js`, `micro.js`, `site.js`
  (tilt, scrollIntoView `behavior:auto`, pagination), `gallery.js` (tilt off).
- `html.reduce` class path also honoured. Recommend one emulated run to confirm
  no FOUC — marked code-only here.

### 7. Form labels / validation — PASS with one risk (verified live)
- Real `<label for>` on every field (`contact.html`, `rooms.html`, `feedback.html`),
  `required`, `type=email/tel`, `autocomplete`, `maxlength`, honeypot
  `aria-hidden + tabindex=-1`.
- Floating label: `.fld > label` absolute → shrinks/floats on `is-float` /
  `:focus-within`; placeholder transparent when floated (no double-label).
  Vision's "placeholder-only" read was wrong — labels are persistent DOM labels.
- Inline validation: `aria-describedby → .fld-err[role=alert]`, `aria-invalid`,
  blur + re-validate on input. **Live test:** bad email → `aria-invalid=true`,
  error "That email address does not look right." Submit also focuses email
  field on invalid. Star rating: `role=radiogroup` + `aria-labelledby`,
  screen-reader-only star names.
- **Risk: input font-size `.85rem` (~13.6px)** — iOS Safari auto-zooms on focus.
  Bump `.pform input/textarea/select` to ≥16px on touch (or accept zoom).

### 8. Lightbox focus — PASS (verified live)
- Rooms: native `<dialog class=room-lb>` via `showModal()` — focus trap +
  `::backdrop`, Prev/Next/Close bar, `aria-label="Room photo viewer"`,
  focus returns to originating figure (`focus({preventScroll:true})`).
  Figures are `role=button tabindex=0` with Enter/Space handlers.
- Gallery (`gallery.js`): `role=dialog aria-modal=true`, close button focused
  on open, Tab trap (first↔last wrap), Esc/←/→, `inert` background siblings,
  focus returns to originating link, counter `aria-live=polite`, 48px targets.
- Vision note: prev/next glyphs are faint (8% white bg, 20% border on dark) —
  visible but low-salience; focus ring itself is present via global rule.

### 9. Map fallback — PASS (verified live, settled)
- Google embed iframe `title="Prajna Co-hab location"`, `loading=lazy`,
  260px height. Blank on first paint; after ~2.5s tiles load (settled 390px
  screenshot shows streets/labels).
- Fallback is static HTML, not JS-dependent: `.mapbox .addr` full address below
  iframe + "Open in Maps" link on contact page. Works with iframe blocked /
  no-JS (address) — correct pattern. No `onerror` handler needed.

### 10. Smooth scroll / Lenis — PASS as native; Lenis absent (code-verified)
- **No Lenis** anywhere in repo (grep: zero hits in html/js/css) — despite
  `design-repo-kit` listing it as an option. Site uses native
  `html{scroll-behavior:smooth}` + JS `scrollIntoView({behavior:smooth})`,
  both gated: `prefers-reduced-motion → auto`, `(hover:none) → auto` (touch
  keeps native), pagination scroll respects same gate.
- Verdict: intentional vanilla choice consistent with "no heavy npm for static
  site" rule. Do not add Lenis without a measured jank complaint.

### 11. Glass readability — PARTIAL (verified live + vision)
- V42 policy: panels are solid paper; **only header, drawer, mobile bar keep
  glass** (`header rgba(250,246,238,.72) blur(8px) saturate(1.04)`, drawer
  `.94/16px`, bar panel/blur14 → 4px ≤640px).
- Over light paper: fine (ink on near-opaque cream). Over dark bands
  (`.feature`, `.cta-strip` near-black-brown) while sticky-scrolled: header
  stays light glass — text remains dark-on-light, so readable, but the live
  gallery screenshot shows pond-canvas light streaks bleeding through glass
  and washing out nav/heading text. That haze is the animated background
  canvas behind translucent header, not panel opacity.
- Recommendation: raise header bg to ≥.90 opacity (or solid) when scrolled
  over dark sections, or accept and document. Not a blocker.

## Interior mapping cross-check (spot)
Press/ripple/loading-button, accordion, tabs/segmented, filter-grid, drawer,
sticky/hide-on-scroll, lightbox/modal, floating-label/inline-validation,
tooltip-group, copy-button, reading-progress — all present per
`INTERIOR-AUDIT.md` and spot-confirmed in code above. Timings 140/220/380/760
+ `cubic-bezier(.22,.61,.36,1)` consistent in `style.css` tokens.

## Open items (priority order)
1. Terra-as-text AA audit (4.21:1) — swap small text to `--terra-dark`.
2. Input font-size ≥16px on touch to stop iOS zoom.
3. Header glass over dark sections — consider solid-on-scroll.
4. Emulated `prefers-reduced-motion` browser run to close code-only gap.
5. Gallery photo haze in screenshots — confirm whether pond canvas overlay
   affects real users or was harness artifact; if real, it's a trust issue
   for a house-photo gallery.
