# Micro-repo wiring (v73)

Vanilla JS/CSS ports only. No npm, no React. Facts, prices and mail-only
contact unchanged (config.js remains the single price book).

Timings (interior.dev): press 140ms, hover 220ms, state change 380ms,
arrival 760ms, easing cubic-bezier(.22,.61,.36,1). All new effects gate
behind prefers-reduced-motion; magnetic/spotlight only on pointer:fine.
Palette stays inside DESIGN-SYSTEM.md (terra/ochre/paper only).

Already live in assets/site.js (interior strict pass, kept not
duplicated): press-depth, ripple, loading-button, accordion
(details::details-content 380ms), tabs/segmented (rooms pricing),
filter-grid (gallery), blur-up-image, skeleton-swap, lightbox/modal,
copy-button, reading-progress/progress-bar, value-flash, drawer,
sticky-header, hide-on-scroll, scroll-spy, text-reveal, tooltip-group,
task-steps, load-more/pagination, popover, live-activity, icon-morph.
See INTERIOR-AUDIT.md for the full 54-component register.

## Repo -> new pattern picked -> where it landed (v73)

| Repo | Picked | Landed on |
|---|---|---|
| microkit | magnetic-fill-button | hero/pagehead/cta primary CTA, max 6px lean, springs back |
| uniqueui | border-beam | featured .costcard border beam (index, rooms) |
| uniqueui | aurora-glow-button | rotating conic halo, hero/pagehead primary CTA |
| Amicro | SpotlightCard | .card cursor radial glow via --mx/--my, all 8 pages |
| react-bits | Spotlight / TiltedCard | same spotlight + focus-visible lift parity on .card |
| uselayouts | animated-tabs sliding pill | .gallery-filters (gallery) and .segmented (rooms) |
| ui (viberdy) | animated-tabs-indicator | same pill implementation as uselayouts |
| interior | press/ripple/loading/accordion/tabs | already strict in site.js (kept, verified) |

Skipped: count-up (already in assets/motion.js), confetti/marquee/
cursor-trail (would break the folk design system and palette
discipline), command-palette/OTP/password (no such surface; mail-only
by design). Pages without details (about, pune, discover) get no
accordion host because there is no FAQ content to animate; adding one
would invent copy.

## Pages wired (8)

index, rooms, gallery, blog (Guides), contact, about, pune, discover:
all load assets/micro.js?v=73 and assets/style.css?v=73.

- index: magnetic + aurora hero CTA, border-beam on .costcard,
  spotlight on .card, accordion on FAQ details (site.js).
- rooms: magnetic + aurora CTA, border-beam on .costcard, sliding
  pill on .segmented pricing tabs, spotlight on .card, accordion on
  FAQ details (site.js).
- gallery: sliding pill on .gallery-filters, spotlight on teaser
  .card, magnetic CTA; filter-grid + lightbox already in site.js /
  gallery.js.
- blog: spotlight on .card.post, magnetic/aura CTA in pagehead;
  load-more/pagination already in site.js.
- contact: magnetic CTA, spotlight on .card, form loading-button +
  floating-label + inline-validation already in site.js.
- about: magnetic CTA, spotlight on .card tilt grid, blur-up on the
  entrance illustration (site.js).
- pune: magnetic CTA, spotlight on .card tilt grid (6 cards).
- discover: magnetic CTA, spotlight on .card tilt grid (6 cards).

## Files

- assets/micro.js (new, ~110 lines, zero deps)
- assets/style.css append: micro wiring block + reduced-motion kill switch
- 8 content pages: micro.js include + style.css v73
- sw.js: prajna-v73, precache micro.js; assets/site.js stale-cache key v73
