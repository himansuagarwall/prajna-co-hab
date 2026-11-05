# Cross-pages review: main vs premium-reset (14 pages)

READ-ONLY static comparison via `git show` on both branches (no checkout, no edits to site files). Browser check was done only for premium-reset (the checked-out branch) via a local `python3 -m http.server 8734` + browser_exec at viewport 756px. **390px mobile overflow and main-branch rendering are UNVERIFIED** (browser could not be resized to 390px; switching branches would violate read-only). Prices, inclusions, forms, schema and SEO below are static-source verified.

Heads compared: `main` 59e77c1 vs `premium-reset` 2d558f6. Diffstat: 15 files, `assets/style.css` +158/- lines, 14 HTML pages touched, `config.js`/`sitemap.xml`/`robots.txt` identical between branches.

## Global findings (all pages)

- **Header/nav:** main has 10 links (Home, Rooms, The Pit, Gallery, 3D Tour, About Pune, Around the House, About Us, Contact + brand). premium-reset collapses to 5: Rooms, Pit, Gallery, Guides, Contact (+ brand, + empty mobilebar link). This is the single largest structural change; several pages (About Pune, Around the House, About Us, 3D Tour) become reachable only via footer/inline links, not the header. "The Pit" shortened to "Pit" everywhere except autohub.html's own H1 (`The Pit`) and title, where it is retained.
- **Blog/Guides naming:** premium-reset systematically renames Blog to Guides. `blog.html` title changes "Co-living Blog" to "Co-living Guides", og:title likewise; word counts shift (blog 22 to 18, guides 11 to 17 in blog.html). The file stays `blog.html` (no rename), so URLs are stable but visible terminology and title/SEO change. Nav label is "Guides" on all 13 nav-bearing pages.
- **Prices:** unchanged and consistent. `config.js` identical: twinRent 7200, twinRentMeal 10000, singleRent 9200, singleRentMeal 12000. Static fallbacks in rooms.html/index.html/blog.html carry the same figures on both branches. No price regression.
- **Inclusions (rooms):** asymmetry preserved on both branches. Double in-room lists "Bedside table"; private lists "Study table and chair" and does NOT list bedside. No drift.
- **Contact/lead rules:** no `wa.me`, no `tel:` on any page in either branch (0 counts). All forms are `mailto:srijna2b@gmail.com` with `form-action 'self' mailto:` in CSP. Index mailto count drops 9 to 8 in premium-reset (one fewer contact link, likely the removed header link); tour3d mailto rises 2 to 3.
- **Schema:** JSON-LD types are preserved. index retains LodgingBusiness + FAQPage; rooms retains LodgingBusiness with Offer entries + FAQPage; blog retains Blog/BlogPosting/WebPage; others retain LodgingBusiness + BreadcrumbList. No schema additions or deletions found in the diff.
- **SEO meta:** viewport, canonical, og tags present on both branches on all pages. Only gallery.html and blog.html have title/description changes (see per-page). No meta removed.
- **CSS/mobile:** `assets/style.css` grows 111,057 to 117,008 bytes. Media queries at 390px: 3 on both; `overflow-x` rules: 4 on both; `.mobilebar` rules: 25 on both. No new breakpoints, no removed overflow guards. Static risk low, but 390px render unverified.
- **Browser (premium-reset only, 756px):** all 14 pages `scrollWidth == innerWidth`, no horizontal overflow. Screenshot captured for index. Main branch not rendered.

## Gallery count conflict: 6 vs 7 (FLAGGED, unresolved)

This is a real discrepancy between lanes, not a miscount:

- **main gallery.html:** 21 `<img>`, 20 `<figure>` (20 captioned photos + entrance.jpg duplicated as a 21st img, likely hero/lightbox duplicate).
- **premium-reset gallery.html:** 7 `<img>`, 6 `<figure>`. The 6 figures are: Living room, Double in-room, Private in-room, Kitchen, Kitchen and dining, Dining. The 7th img is a duplicate `twin.jpg` (same src as figure 2), almost certainly an un-captioned hero or lightbox element.
- Browser confirms premium-reset in DOM: 7 imgs, 6 figures.

So "6" = captioned figures, "7" = raw img tags. The lanes disagree on which number is the gallery count. If the intended count is captioned photos, it is 6; if raw images, 7. Premium-reset also deletes 14 main photos (entrance, stairs x2, bathrooms x4, gym, lounge, studio, suite, shared, room, hero-local) with no replacement, and renames room vocabulary in captions from "Twin-sharing/Single" to "Double in-room/Private in-room" and "Shared spaces" to "Common floor". This is a content reduction, not a pure restyle, and should be confirmed with the owner before merge.

## Per-page verdicts

| Page | Verdict | Key changes main to premium-reset | Gaps / risks |
|---|---|---|---|
| index.html (25,230 to 25,833 B) | PASS with note | H1 changes from "Prajna Co-hab — Moshi" to "Prajna Co-hab, Balaji Nagar, Bhosari" (address truth improvement). Hero markup (`div.hero`, pond canvas, lotus SVG) unchanged. Nav collapses 10 to 5 links. | Nav loses Home/3D Tour/About Pune/Around/About Us from header. 390px unverified. |
| rooms.html (28,161 to 27,977 B) | PASS | H1, prices (Rs 7,200/9,200, Rs 12,000/14,000, deposits), inclusions asymmetry, Offer schema, inquiry form all unchanged. | Only nav + Guides naming changes. No content gap. |
| gallery.html (24,345 to 15,507 B) | **FLAG: content loss + count conflict** | Title "Photo Gallery" to "House Photos", description rewritten, preload entrance.avif to twin.avif, photos 20 figures to 6 figures, vocabulary renamed. | 14 photos removed. 6 vs 7 count conflict above. Confirm intended photo set and count definition before merge. |
| tour3d.html (30,921 to 32,241 B) | PASS | Canvas (1), importmap + module scripts, Three.js reference all retained. Mailto 2 to 3. | Nav on main tour3d was already shorter (no Pit); premium adds Pit/Guides. No 3D functionality change in static source. WebGL render unverified. |
| autohub.html (53,712 to 53,538 B) | PASS | H1 "The Pit" retained. Categories Mechanics/Parts/Used bikes/RTO/Insurance/Questions retained. 3 forms retained (board, pit-join, pit-ask), all mailto. Pit login section retained verbatim: "Want an account? Pit login is optional", "Without an account you can (always)", "Request an optional account", mail-only, placed after post form. Board stays open, no gatekeeping added. | Nav label is "The Pit" on this page vs "Pit" elsewhere (minor inconsistency, pre-existing). |
| blog.html (18,537 to 18,096 B) | PASS with naming note | Title and og:title Blog to Guides. Blog/BlogPosting schema retained. Prices in posts unchanged. | File is still blog.html; internal links still point to blog.html. Terminology change only. Sitemap identical, so no URL change. |
| contact.html (16,375 to 16,197 B) | PASS | H1 "Write to us", inquiry form (name/email/phone/interest/movein/budget/message/company) unchanged, mailto only. | No change beyond nav/Guides. |
| about.html (12,226 to 12,017 B) | PASS | H1 "We own the house and we run it." unchanged. | Nav only. |
| discover.html (13,228 to 13,019 B) | PASS | H1 "Around the house" unchanged. | Nav only; page becomes orphaned from header nav (reachable via footer only). |
| feedback.html (12,215 to 12,038 B) | PASS | H1 "Tell us", feedback form unchanged. | Nav only. |
| pune.html (12,254 to 12,045 B) | PASS | H1 "New to Pune?" unchanged. | Nav only; page becomes orphaned from header nav. |
| testimonials.html (12,752 to 12,537 B) | PASS | H1 "What our residents say" unchanged. No invented testimonials added or removed. | Nav only. |
| 404.html (6,297 to 6,197 B) | PASS | H1 unchanged. | Nav only. |
| offline.html (1,491 B, identical size) | PASS | No nav, no schema on either branch (expected for offline shell). | None. |

## Gaps and open items

1. **Gallery 6 vs 7:** decide the canonical count (figures vs img tags) and reconcile lanes. Premium-reset ships 6 captioned photos + 1 duplicate img.
2. **Gallery photo deletion:** 14 main photos removed. Confirm owner intent; this is the only content-loss finding.
3. **Header orphaning:** About Pune, Around the House, About Us, 3D Tour no longer in header nav. Verify footer/sitemap coverage is sufficient, or restore a secondary nav.
4. **Pit label inconsistency:** "Pit" in nav vs "The Pit" as autohub H1/title. Pre-existing, not a regression.
5. **390px mobile overflow:** unverified on both branches (browser fixed at 756px). Needs a 390px Playwright pass before merge.
6. **Main-branch render:** unverified (read-only; no checkout). Main comparison is static only.
7. **3D/WebGL and form submission:** tour3d WebGL scene and mailto/AppScript form behaviour not exercised; static presence only.
8. **Interior micro-interactions:** premium-reset is a header/content change; no new interactive patterns were assessed here. Press/ripple/accordion/lightbox behaviour is out of scope for this cross-check and still needs the standard 390px + reduced-motion pass.

## Method note

Counts were produced by code (`git show` + regex over both branches, printed, not estimated). Browser numbers are premium-reset DOM at 756px only. No site files were edited; this report is the only file written.
