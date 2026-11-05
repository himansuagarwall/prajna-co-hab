# Gaps before merge — `premium-reset` → `main`

Branch: `premium-reset` @ `2d558f6` (up to date with `origin/premium-reset`).
Date: 2026-11-05. READ-ONLY audit; no edits, no merge performed.
Scope: `git diff main...premium-reset` = 15 files, +337/−230
(404.html, about.html, assets/style.css, autohub.html, blog.html,
contact.html, discover.html, feedback.html, gallery.html, index.html,
offline.html, pune.html, rooms.html, testimonials.html, tour3d.html).
Counts are from `HEAD` (tree clean except untracked `review/` — see §7).

## Verdict: DO NOT MERGE — 6 must-fix blockers (1 red test, 1 a11y focus trap,
1 contrast fail, 1 fluff copy, 1 missing og meta, 1 dirty-tree hygiene)

---

## MUST-FIX

### 1. Test failure: gallery ≥20 vs 6 photos — suite is red on this branch
- `tests/e2e/core.spec.js:88-91` (unchanged on this branch):
  ```js
  test('gallery page shows at least 20 images', async ({ page }) => {
    const gallery = new GalleryPage(page);
    await gallery.open();
    const count = await gallery.images.count();
    expect(count, 'Gallery should have at least 20 images').toBeGreaterThanOrEqual(20);
  });
  ```
- `gallery.html:90-139` now renders **6 `<figure class="gallery-item">`**
  (living, twin, single, kitchen, kitchen-dining, dining) + 1 lightbox
  `<img>` at `gallery.html:147` = **7 `<img>` total**; header text at
  `gallery.html:94` reads "6 photographs". `review/premium-verify.md`
  already records the failure (received 8 at the time, now 7 — same root cause).
- Exact fix (pick one, do not leave suite red):
  ```diff
  -  test('gallery page shows at least 20 images', async ({ page }) => {
  +  test('gallery page shows at least 6 house photos', async ({ page }) => {
       const gallery = new GalleryPage(page);
       await gallery.open();
       const count = await gallery.images.count();
  -    expect(count, 'Gallery should have at least 20 images').toBeGreaterThanOrEqual(20);
  +    expect(count, 'Gallery should have at least 6 images').toBeGreaterThanOrEqual(6);
     });
  ```
  Or restore ≥20 real photos. The purge commits (`8b02d58`, `88a7f31`)
  intentionally cut to raw-data house photos only, so the test threshold
  is the stale side. Re-run `npx playwright test` green before merge.

### 2. Lightbox has no focus trap — keyboard/SR users can escape into the page
- `assets/gallery.js:76-92`:
  ```js
  function openLightbox() {
    active = items.filter(function (item) { return !item.hidden; });
    if (!active.length) return;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    preloadAdjacent();
  }
  ```
  Problems: (a) focus is never moved into the lightbox on open (should go
  to `.lightbox-close`); (b) no Tab trap — Tab leaves behind the backdrop
  into the still-focusable gallery/header; (c) background is not made
  inert; (d) `gallery.html:142` uses a plain `<div class="lightbox-backdrop"
  aria-hidden="true">` with focusable `<button>` children — `aria-hidden`
  on a container with focusable descendants is an ARIA violation while hidden.
  Contrast with the rooms lightbox in `assets/site.js:680-712`, which uses
  a native `<dialog>` (`dlg.showModal()` semantics via `dlg.close()` +
  `returnFocus.focus()` at `site.js:712`) and gets trapping for free.
- Exact fix (minimal, mirrors `site.js` pattern):
  ```js
  // in openLightbox(), after classList.add("is-open"):
  lightbox.querySelector(".lightbox-close").focus();

  // in the existing keydown handler (assets/gallery.js:114-121), add:
  if (event.key === "Tab") {
    var focusable = Array.prototype.slice.call(
      lightbox.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")
    ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
  // in closeLightbox() the existing `returnFocus.focus()` is already correct — keep it.
  ```
  And in `gallery.html:142` add `role="dialog" aria-modal="true"` to the
  backdrop div. Preferred long-term: replace the div with `<dialog>` like
  `site.js:687` does.

### 3. Terra `--terra:#c05621` fails WCAG AA (4.5:1) for small text
- `assets/style.css:16`: `--terra:#c05621`. Measured contrast:
  on `--paper:#faf5ec` = **4.21:1**; on `--panel:#fdfaf4` = 4.39:1;
  on `--card:#ffffff` = 4.57:1. Fails 4.5:1 for normal text (<18pt/14pt bold).
- Text usages that hit this (all small text):
  `style.css:47` `.tag` (0.68rem uppercase), `:61` `.brand span`,
  `:66-68` `.navlinks a:hover/.on`, `:80` `.btn.ghost`, `:119` `.price`,
  `:125` `.teasercard .go` (0.74rem), `:216` `.costrows b`,
  `:222` `.menucard .day b` (0.68rem), `:232` `.statrow b` (1.9rem = large, OK),
  plus the `v13 ROLE DISCIPLINE` override at `style.css:561-563`
  (`a{color:var(--terra)}`, `.price,.rate…`, `.tag`).
  `--terra-dark:#9a4522` passes at 5.95:1 on paper.
- Exact fix (ponytail-minimal: text → terra-dark, keep terra for fills/borders):
  ```diff
  - .tag{...color:var(--terra)}
  + .tag{...color:var(--terra-dark)}
  - .brand span{color:var(--terra)}
  + .brand span{color:var(--terra-dark)}
  - .navlinks a:hover{color:var(--terra);...} / .navlinks a.on{color:var(--terra)}
  + .navlinks a:hover{color:var(--terra-dark);...} / .navlinks a.on{color:var(--terra-dark)}
  - .btn.ghost{...color:var(--terra);...}
  + .btn.ghost{...color:var(--terra-dark);...}
  - .price{color:var(--terra);...}
  + .price{color:var(--terra-dark);...}
  - .teasercard .go{...color:var(--terra);...}
  + .teasercard .go{...color:var(--terra-dark);...}
  - a { color: var(--terra); }            /* style.css:561 */
  + a { color: var(--terra-dark); }
  - .price, .rate, .amount, .statrow b { color: var(--terra); }  /* :562 */
  + .price, .rate, .amount, .statrow b { color: var(--terra-dark); }
  - .tag { color: var(--terra); }         /* :563 */
  + .tag { color: var(--terra-dark); }
  ```
  Keep `--terra` for `.btn` backgrounds (white on terra = 4.57:1, passes)
  and for decorative `.folkline`/borders. Applies to every page since all
  link `assets/style.css`.

### 4. Tour3d unearned-fluff copy (no-fluff rule violation)
- `tour3d.html:274` (in the `rooms` JS object):
  > `desc: 'Private 12x15 ft room with full lockable space, ensuite access,
  > and premium furnishing. Your own sanctuary after a long shift.'`
  ("premium furnishing / your own sanctuary" — unearned register; the site
  voice elsewhere is plain/factual, e.g. twin desc at same line:
  "Comfortable 10x12 ft space with wardrobe, study desk, and home-style meals.")
- Exact fix:
  ```diff
  -      single: { name: 'Single Room', desc: 'Private 12x15 ft room with full lockable space, ensuite access, and premium furnishing. Your own sanctuary after a long shift.', photo: img('single.jpg'), accent: 0xd9a441, ...
  +      single: { name: 'Single Room', desc: 'Private 12x15 ft room with full lockable space, ensuite access, and wardrobe.', photo: img('single.jpg'), accent: 0xd9a441, ...
  ```
  (State only what the room includes; drop "premium" and "sanctuary".)
  Grep confirms this is the only "premium|sanctuary|fluff|exquisite" hit
  in tour3d/gallery/index/blog/about/rooms/contact.

### 5. Offline page has zero og meta (inconsistent with all other pages)
- `offline.html:1-13` has `<title>`, `description`, `theme-color`, manifest,
  CSP — but **no `og:*` tags at all**. Every other page has them
  (e.g. `index.html:11-18`, `gallery.html:12-19`, `tour3d.html:9-16`,
  `404.html:9-14`). The only change on this branch was
  `offline.html:11` bumping `style.css?v=70→v71`.
- Exact fix (add after the `description` line, `offline.html:9`):
  ```html
  <meta property="og:site_name" content="Prajna Co-hab">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Offline — Prajna Co-hab">
  <meta property="og:description" content="Prajna Co-hab offline page. Pages you already visited stay available.">
  <meta property="og:url" content="https://himansuagarwall.github.io/prajna-co-hab/offline.html">
  <meta property="og:image" content="https://himansuagarwall.github.io/prajna-co-hab/assets/og-cover.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  ```

### 6. Concurrent-lane overwrite risk — duplicate purge + header churn + CSS append
Three overlaps in the 7 commits on this branch, all landing in the same files:
- **Gallery purged twice**: `8b02d58` ("keep only raw-data photos, remove
  invented filler") then `88a7f31` ("purge to raw-data house photos only").
  Net is correct (6 photos), but it means two lanes edited the same grid
  and the second silently superseded the first. No data loss (both were
  deletions), but the ≥20 test breakage (§1) slipped through because
  neither lane updated `core.spec.js`.
- **Header nav rewritten twice**: `e5a9e16` ("Rooms, Pit, Gallery, Guides,
  Contact") then `2d558f6` ("unified responsive header, plain nav
  vocabulary, single vacancy instance"). Current state is consistent
  (5 links + one `#vacancy-badge` per page), so no action beyond confirming
  main-side nav expectations before merge.
- **CSS appended, not edited in place**: `assets/style.css` premium-reset
  block is appended at the end (`style.css:1740+`, ~156 lines) and
  re-declares `header{}`, `header .nav{}`, `header .brand{}`, etc. on top
  of the earlier `header{}` at `style.css:58ff`. Cascade order saves it
  today, but a future edit to the earlier block will appear to work and
  then be overridden. Exact fix: move the block up to sit with the
  header section it overrides, or add a one-line pointer comment at the
  first `header{}` (e.g. `/* canonical header rules now at end of file,
  premium-reset — edit there */`). Not a functional break today; merge
  only after confirming no main-side lane is also appending to `style.css`.

### 7. Dirty tree / hygiene
- `git status`: branch clean except **untracked `review/`**
  (`review/premium-verify.md` — auto-generated verify lane output, not
  committed). `.gitignore` covers `node_modules/`, `test-results/`,
  `playwright-report/`, `.DS_Store`, `.muse-context/` — so the current
  `node_modules/` on disk is ignored and harmless.
- Exact fix before merge: either `git add review/gaps-before-merge.md`
  (this file) or delete `review/premium-verify.md` from the merge set —
  do not merge `premium-verify.md` as-is; it still says "dirty: 14 files,
  builders mid-flight" which is stale (tree is clean at `2d558f6`).
  Verify with `git status --porcelain` showing only the intended file.

---

## NICE-TO-HAVE (do not block merge)

| # | Location | Gap | Exact fix |
|---|----------|-----|-----------|
| N1 | `config.js:55` `endpoint: ""` | Form backend empty. Deliberate per `config.js:48-54` comment: forms fall back to pre-filled `mailto:`, so the site works. Effects: `site.js:324` pit board fetch disabled, `site.js:443,495` analytics no-op, `gallery.js:176-177` beacon no-op. Not a regression vs main. | None required. If a lane expects sheets/Autohub writes, set `endpoint: "<deployed /exec URL>"` and run `npm run test:backend`. Otherwise leave blank and note "mailto-only" in the merge PR. |
| N2 | `style.css:309,646,891,1164,1496` | Four+ competing `:focus-visible` rules (`--terra` vs `--ochre-ink` outline colour, different offsets 2px/3px). Cascade picks the last; harmless but confusing. | Ponytail pass: keep one `:focus-visible` block, delete the others. |
| N3 | `style.css:1071-1072` | Dead comment `/* lightboxes had no dialog semantics */` with empty body. | Delete the 2 lines. |
| N4 | `assets/site.js:332-335` | Comment-only block (`v38/v43` notes about removed `.gal` lightbox). | Leave; it documents why `if(gal){` is absent. |
| N5 | `gallery.html:80-87` header | `</nav>` and `</header>` indentation changed vs other pages (cosmetic only). | Reindent to match `index.html`. |
| N6 | `tests/e2e/core.spec.js:44-45` | Duplicate identical `wa.me` assertion lines (copy-paste). | Delete one line. |

---

## Verification notes (what was actually checked)
- `git log --oneline main..premium-reset`: 7 commits (`7a2c63e` … `2d558f6`).
- `grep -c "<figure" gallery.html` = 6; `grep -c gallery-item` = 6; 7 imgs total.
- `grep -n "premium|sanctuary"` across HTML: 1 hit, `tour3d.html:274`.
- `grep -n "og:" offline.html` = 0; `404.html` = 6 tags (for the template).
- Contrast computed from hex: terra/paper 4.21, terra/white 4.57, terra-dark/paper 5.95.
- Focus-trap: read `assets/gallery.js:76-121` (no `.focus()`, no Tab handler)
  vs `assets/site.js:680-712` (dialog + `returnFocus`).
- Endpoint: `config.js:55` empty; consumers at `site.js:266,324,443,495`,
  `gallery.js:176`.
- No edits made; only `review/gaps-before-merge.md` (this file) written.
