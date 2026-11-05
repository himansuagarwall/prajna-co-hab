# Cross-code review — Prajna Co-hab

READ-ONLY pass. Repo: `~/Work/Hermes-Projects/prajna-co-hab-github`, branch `premium-reset`, HEAD `2d558f6`. No repo files edited except this report. Counts below were printed by Python/regex over the tree and `node tests/backend/code-gs.test.js` (30 checks, 0 failed).

## Verdict

Core cross-file contracts hold: one price book, mail-only contact, single vacancy instance, form types match the Apps Script backend, CSP covers Maps + Apps Script. Gaps are mostly documentation/version drift (`check:prices` missing, SW `?v=70` vs HTML `?v=71`), one likely-failing gallery test, unlabelled testimonials, and ponytail dead code (166 `!important`, ~40 unused CSS classes, dead `vacancy-mini` JS). Lead capture is **not live**: `config.js:55 endpoint: ""`.

## Counts (via code)

| Check | Result |
|---|---|
| `wa.me` links (html/js/css) | 0 |
| `tel:` links | 0 links; 2 mentions in `assets/site.js:104,461` (comment + dead `call_tap` branch) |
| `whatsapp` string | 0 |
| `mailto:` occurrences | 76; `srijna2b@gmail.com` 79 |
| Pages with CSP meta | 13/14 (`offline.html:10` stricter, no scripts — fine) |
| `!important` in `assets/style.css` | 166 (1895 lines, 120 KB) |
| Duplicate bare selectors in `style.css` | `:root` x9 (`style.css:1,268,325,845,923,1133,1299,1466,1506`), `header` x5 (`:57,526,701,798,1350,1748` — last is premium-reset), `html` bg x3 (`:418,1042,1311`), `body::after` x4, `header .navlinks` x2 (`:1766,1805`), `header .navlinks a` x2 (`:1771,1827`) |
| `data-cfg` keys in HTML | 16 keys, 30 uses — all set by `assets/site.js:48-76` |
| `data-cfg` keys set but absent in HTML | `foodWord`, `twinMealDelta`, `singleMealDelta` (`site.js:55,56,59`) — `set()` no-ops on empty NodeList |
| Forms | 6 `data-formtype`: inquiry x3 (`contact.html:111`, `rooms.html:386`, +), feedback (`feedback.html:95`), board x3 (`autohub.html:276,355,377`) |
| SW shell (computed) | 502.2 KB over 25 entries, not "~260KB" (`sw.js:7-9`); `assets/tour.mp4` 7.39 MB correctly excluded |
| Backend test | `node tests/backend/code-gs.test.js` → 30 checks, 0 failed |

## What agrees

- **Price book** — `config.js:34-40` twin 7200/10000, single 9200/12000, deposits 12000/14000, lock-in 3 / notice 1 (`config.js:46-47`). HTML fallbacks, `index.html:208`, `rooms.html:196-197,235-236,344-352,417-418`, JSON-LD `rooms.html:78,85,92,99`, `blog.html:127`, `contact.html:143` all match; dinner delta ₹2,800 consistent (`config.js:66-70` `mealDeltaConsistent`); first-month costs ₹19,200/22,000/23,200/26,000 (`index.html:171-176`) = rent+deposit. Retired 8,500/10,500: 0 hits. `tests/e2e/prices.spec.js:33-123` covers all of this.
- **Contact model** — `config.js:26-27` email only, `phone: ""`; all forms `action="mailto:srijna2b@gmail.com"`; `tests/e2e/core.spec.js:36-51` asserts wa.me=0/tel=0 per page.
- **Address truth** — `streetAddress` = Anandrao Lande Road, Balaji Nagar, Bhosari Industrial Estate, 411026 on every page (e.g. `index.html:31-34`, `contact.html:41-44,158-159`); Moshi only as area context (`geo.placename`, footer). Maps iframes `index.html:333`, `contact.html:158` use the full address.
- **Inclusions asymmetry** — `rooms.html:319` double has Bedside table; `rooms.html:320` private has Study table and chair, no bedside. Correct.
- **Header / vacancy** — one `vacancy-badge` per content page (0 in `offline.html`), nav = Rooms/Pit/Gallery/Guides/Contact (`index.html` nav block), one `<header>`, one `<h1>` per page. Premium blocks: `style.css:1741-1842` premium-reset header (95px, drawer ≤1024px, interior 140/220/380/760 timings), `style.css:1844-1895` premium-ui (index spacing; scoped `main ...` so it applies site-wide — header lane owns above, as commented).
- **Forms ↔ Code.gs** — types `inquiry/feedback/board/visit` match `Code.gs:34-38` TABS; `validate_` (`Code.gs:171-191`) matches client guards `site.js:238-248` (email validity, `input[name="rating"]:checked`); honeypot `company` dropped client-side `site.js:232-236` and excluded from `asEmail` (`site.js:186`). `collect()` truncates at 1200 chars (`site.js:170`) vs `cell_` caps in Code.gs — consistent. Rating: `feedback.html:104-110` 5 radios, `#s5` required, `leads.spec.js:56-75` proves the clicked rating is sent (regression for the old "always 1 star" bug noted `site.js:139`).
- **CSP** — identical on all content pages (`index.html:7`): `default-src 'self'`, `script-src 'self' 'unsafe-inline' cdn.jsdelivr.net` (covers `tour3d.html:200-211` three@0.160.0 importmap), `connect-src ... script.google.com script.googleusercontent.com`, `frame-src google.com/maps.google.com`, `form-action 'self' mailto:`. No CSP gap found.
- **Sitemap/robots** — 12 URLs in `sitemap.xml`, `robots.txt` disallows `/apps-script/`, `/tests/`, docs.

## Gaps (file:line)

### P1
1. `config.js:12-13` promises `` `npm run check:prices` fails the build `` — `package.json` has **no `check:prices` script** (only `test/test:prices/test:leads/test:ui/test:backend`). The real gate is `tests/e2e/prices.spec.js`; doc or script is wrong.
2. SW/HTML version skew: `sw.js:14` `V='prajna-v70'`, SHELL precaches `style.css?v=70`/`pond.css?v=70`, but every HTML links `assets/style.css?v=71` + `assets/pond.css?v=71` (28 refs; only JS stays `?v=70`). Precache keys miss the live CSS, so first-visit offline shell silently falls back to runtime cache. Bump SW to v71 or drop the query strings.
3. `tests/e2e/core.spec.js:84-88` expects gallery ≥20 images; `gallery.html` has 6 `.gallery-item` / 7 `<img>` (26 `assets/g/` refs incl. srcset). As written the test should fail — either the count target or the gallery regressed. Unverified in browser this pass.
4. `testimonials.html:99-133` — 6 named, dated testimonials ("Rahul, software engineer, stayed 6 months" etc.) with **no** "Example — replace" label. Contradicts the standing no-invented-testimonials rule; Pit cards (`autohub.html:233-258`) are correctly labelled, testimonials are not.
5. `config.js:55 endpoint: ""` — lead capture not live. All endpoint paths are correctly gated (`site.js:266` mailto fallback, `site.js:324-325` board fetch, `site.js:443-446` analytics), but `Code.gs` deployment is unverified from the tree. Do not claim sheet capture works.

### P2 — ponytail trim candidates
6. `assets/style.css` 166 `!important` (e.g. `:316-317,343,426-427,499-547,651-664,739-772,1043-1044,1315-1316,1519-1553,1859-1864`). Latest layers (`:1741+`) mostly avoid them; early theme/dark/reduced-motion blocks are the source.
7. Dead CSS classes (no match in HTML/site.js/motion/pond/fluid): `.wa-link`, `.sr-only`, `.fmark`, `.pitstats`, `.mt-5`, `.mb-1`, `.delay-1`, `.form-actions`, `.fresult-ok/-err/-info` (results use `.fresult` + state classes in JS?) — ~40 classes total; `.voice`/`.menucard` only appear in `fluid.js`/`motion.js` so may be JS-injected, verify before deleting. `.wa-link` is a WhatsApp remnant.
8. Dead JS: `site.js:440` `vacancy-mini` IIFE — 0 elements with that id in any HTML. Duplicate `log`/`qs` defined twice (`site.js:444-445` vs `494,497`) in separate IIFEs — no collision (function-scoped), but `share()` at `site.js:469-471` relies on hoisting to the second `log`; works, fragile.
9. `site.js:194` success copy "we call if you left a number" sits uneasily with the mail-only model (phone is collected, `Code.gs:204`, never published — acceptable, but copy implies a call the site elsewhere disavows).

### P3
10. `site.js:461` dead `call_tap` analytics branch (no `tel:` links exist) — harmless, remove with trim.
11. `404.html` and `tour3d.html` have no `.mobilebar` (all other content pages have 1) — likely intentional, confirm.
12. `sw.js:7-9` shell-size comment stale (502 KB actual vs "~260KB"); `sitemap.xml` `lastmod 2026-11-05` matches HEAD date.

## Not checked this pass
Browser viewports/console (1440/390), Playwright e2e run, live URL behaviour, Apps Script deployment state. Recommendations: run `npm run test:prices` + `npm test` after fixing #3, curl live pages for `?v=71`/vacancy markers per RUNBOOK before claiming go-live (live serves `main`, this tree is `premium-reset`).
