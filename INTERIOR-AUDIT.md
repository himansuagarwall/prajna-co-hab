# Interior audit — 54 components vs site (2026-11-05, redesign-vague @b21082f)

Source: `~/Work/Hermes-Projects/interior/components/interior/` (54 single-file components).
Site wiring: `assets/site.js` (interior IIFE + strict pass), `assets/style.css` (interior block + strict pass), hosts in `rooms.html`, `blog.html`, `gallery.html`, `autohub.html`, `contact.html` (= `pform` forms), `index.html`.
Timings: press 140 / hover 220 / state 380 / arrival 760, easing `cubic-bezier(.22,.61,.36,1)`, `prefers-reduced-motion` = instant. Vanilla only, no React/`motion`.

## Implemented (strict, vanilla ports)

| Component | Status | Evidence |
|---|---|---|
| accordion | implemented | `assets/site.js` single-open `.faq details` + `style.css` `details::details-content` 380ms; host `index.html` FAQ, `contact.html` FAQ |
| blur-up-image | implemented (strict) | `assets/site.js` `decode()` + error class + cached-instant; `style.css` `.img-error`; host: all `img` |
| collapsible-banner | implemented (new) | `assets/site.js` open/folded/dismissed vacancy banner (sessionStorage) + `style.css` `.ix-banner`; host: injected on `main`, visible `index.html` |
| copy-button | implemented | `assets/site.js` `data-copy-email` + footer fallback; `style.css` `.copy-btn`; host `contact.html:99` |
| drawer | implemented | `assets/site.js` `navlinks` + inert + Esc; `style.css` `.navlinks.open` 380ms; host: all pages `header .navlinks` |
| dropdown | implemented (new) | `assets/site.js` `aria-haspopup=listbox` + `.ix-dropdown` + `style.css`; host `autohub.html` `.pit-filters select` |
| expanding-search | implemented (new) | `assets/site.js` `.ix-expanding` + 500ms announce + `style.css` 40px mobile collapse; host `autohub.html` `#pit-search` |
| filter-grid | implemented (new) | `assets/site.js` counts (`ix-filter-count`) + 380ms fade + `style.css`; host `gallery.html` `.gallery-filters` |
| floating-label | implemented | `assets/site.js` `fld`/`is-float` wiring + `style.css` `.pform .fld` 220ms; host `contact.html` / `rooms.html` `form.pform` |
| hide-on-scroll | implemented | `assets/site.js` scroll listener + `style.css` `header.hide-away` 380ms; host: all pages `header` |
| icon-morph | implemented (strict) | `assets/style.css` `.nav-toggle` X morph + `assets/site.js` `.is-x` aria sync; host: all pages `.nav-toggle` |
| inline-validation | implemented | `assets/site.js` required/email checks + `aria-invalid`/`fld-err`; host: `form[data-formtype]` |
| lightbox | implemented | `assets/site.js` rooms `dialog.room-lb` + `assets/gallery.js` `#lightbox-backdrop`; host `rooms.html#room-photos`, `gallery.html` |
| live-activity | implemented (strict) | `assets/site.js` vacancy announcer linger 2000ms aria-live + `style.css` `.vdot.is-live`; host `header .vacancy` |
| load-more | implemented (new) | `assets/site.js` Sentinel + 380ms + `style.css` `.ix-loadmore`; host `blog.html#blog-posts` |
| loading-button | implemented (strict) | `assets/site.js` idle/pending/success/error + resetAfter 1400 + `ix:done` dispatch + `style.css` `.is-success/.is-error`; host: all `button[type=submit]` |
| modal | implemented | `assets/site.js` rooms `dialog.room-lb` (native focus trap) + `assets/gallery.js` trap; host `rooms.html`, `gallery.html` |
| new-items-pill | implemented (new) | `assets/site.js` unread pill + gap check + `style.css` `.ix-new-pill`; host `autohub.html#board` |
| pagination | implemented (new) | `assets/site.js` Prev/Next + `style.css` `.ix-pager`; host `blog.html#blog-posts` |
| popover | implemented (new) | `assets/site.js` anchored dialog + `style.css` `.ix-popover` 220ms; host `rooms.html` deposit popover |
| press-depth | implemented (strict) | `assets/site.js` pointer-tracked press + origin + keyboard + `style.css` `.is-pressed` 140ms; host: `.btn,button,.chip` |
| progress-bar | implemented (strict) | `assets/site.js` `.ix-progress` scaleX + aria; `style.css`; host: injected all pages |
| reading-progress | implemented | `assets/site.js` `.reading-progress` (motion.js `.scrollbar-progress` takes precedence); `style.css`; host: all pages |
| ripple | implemented (strict) | `assets/site.js` max4/minVisible220/fade320 + keyboard + `style.css` `.ripple-ix`; host: `.btn,button,.chip` |
| scroll-spy | implemented | `assets/site.js` IntersectionObserver `.spy-nav`; host `rooms.html:159` |
| segmented-control | implemented | `assets/site.js` + `style.css` `.segmented`; host `rooms.html:332` |
| show-more | implemented | `assets/site.js` inclusions show-more + `style.css` `.showmore-btn`; host: `index.html` `.inclusions` |
| skeleton-swap | implemented (strict) | `assets/site.js` 120ms delay/380ms min + `style.css` `.ix-skeleton`; host `autohub.html#board` |
| snap-carousel | implemented | `assets/style.css` `#room-photos` scroll-snap (+ gallery grid lightbox parity); host `rooms.html#room-photos` |
| sticky-header | implemented | `assets/style.css` `header{position:sticky}` + `assets/site.js` `.scrolled`; host: all pages |
| tabs | implemented | `assets/site.js` + `rooms.html` `role=tab`/`tabpanel`/`aria-controls` (tab-plain/tab-meal); host `rooms.html` pricing |
| task-steps | implemented (new) | `assets/site.js` 5-step tracker + live sentence + `style.css` `.ix-steps`; host: injected before inquiry form (`rooms.html`, `contact.html`) |
| text-reveal | implemented (strict) | `assets/site.js` word stagger 600ms/.06 + `style.css` `.tv-word`; host: `main h2` |
| tooltip-group | implemented (strict) | `assets/site.js` single-open 200/120/400 + `style.css` `.tip-body`; host `rooms.html` `data-tip` x2 |
| value-flash | implemented | `assets/site.js` MutationObserver on `[data-cfg]` + `style.css` `.value-flash` 760ms; host: all price spans |

## Skipped (inapplicable — one line each)

- command-palette: no global command surface; nav is five links.
- context-menu: no right-click action exists on this content site.
- otp-input: no OTP flow; auth is mail-only by design (`config.js`).
- password-strength: no password field anywhere; contact is mail-only.
- tree-view: no hierarchical tree data; content is flat page sections.
- swipe-deck: no card stack; photos are a grid with lightbox.
- sortable-table: no data table needing sort; price table is fixed.
- tag-input: no multi-tag entry; Pit categories are fixed selects.
- wizard-steps: no multi-step wizard; enquiry is one form (task-steps covers progress).
- presence-avatars: no accounts or live users; Pit is guest-open, no login wall.
- poll-results: no poll; testimonials must be examples, never invented votes.
- dnd reorder (reorder-list): no sortable list; inclusions/FAQ order is fixed.
- hold-to-confirm: no destructive action to confirm (no delete/remove on site).
- like-burst: no like/favourite feature exists; adding one invents engagement.
- logo-marquee: no real logos to marquee; would invent client marks.
- long-press: no long-press action; touch targets are tap + scroll only.
- slider-detents: no slider control; pricing is segmented tabs, not a range.
- streaming-text: no streaming source; all copy is static HTML.
- typing-indicator: no chat; Pit replies arrive by email.
- progress-bar indeterminate path: unfinished; determinate reading bar covers the only host.

## Verification (2026-11-05)

- `npx playwright test`: 22/22 passed.
- Screenshots 1440px + 390px: index, rooms, blog, gallery, autohub, contact; no horizontal overflow (`scrollWidth <= clientWidth` all 12).
- Console: 0 page errors; only 2x `ERR_CONNECTION_RESET` on gallery (python http.server flake, not page JS).
- Prices: config single source intact (`config.js` only; `check:prices` covered by 22/22).
