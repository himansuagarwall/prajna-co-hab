# Premium reset — verify lane

Branch: `premium-reset` (dirty: 14 files, builders mid-flight; counts below are working tree, re-check after commit).
Date: 2026-11-05. Deterministic checks win; Ollama qwen3.5:9b used for screenshot summary only.

## Verdict: NOT DONE — header/vocab/motion land, gallery→guides and blog expansion missing

### Header responsive — PASS (deterministic + vision)
- Playwright (threading Node server, port 8899): all 4 pages 1440 + 390 — headerH 62px, scrollW == clientW (no horizontal overflow), toggle `none` @1440 / `block` @390, 0 console/page errors.
- Vision (host vision, not Ollama): index-1440 single row logo+nav+vacancy pill; index-390 logo+hamburger, menu closed, no wrap/slab/overlap.
- CSS: `header{max-height:95px}`, `.nav{flex-wrap:nowrap}`, nav drawer ≤1024px, vacancy badge in header only. Prior `linksH:900` @390 is drawer element height when closed (off-canvas), not visible — screenshots confirm closed.

### Vocabulary relevance — PASS with 1 residual
- Nav trimmed 9→6 links (Rooms, Pit, Gallery, Guides, About, Contact), gallery retitled "Rooms photos", filler filters dropped (bathrooms/entry).
- Plain copy on pages checked. Residual: `tour3d.html:265` — "premium furnishing. Your own sanctuary" (unearned-fluff register, per workflow no-fluff rule).

### Subtle motion (interior) — PASS
- Tokens present: `--t0/--t-press:140ms`, `--t1/--t-hover:220ms`, `--t2/--t-state:380ms`, `--t3/--t-arrival:760ms`, easing `cubic-bezier(.22,.61,.36,1)`.
- `prefers-reduced-motion`: 11 blocks in style.css, incl. transitions off for btn/card/nav/reveal.

### Gallery → Guides — FAIL (lane 3 not done)
- `gallery.html`: 7 `<figure>` (was 20), "7 photographs", photo grid with 3 filters. **0 links to `blog.html#postN`, 0 "Read in Guides" cards.**
- Bullet in workflow ("short informative cards, title + 1 line + Read in Guides") unmet.
- Consequence: `tests/e2e/core.spec.js:88` "gallery ≥20 images" now FAILS (received 8). Builder must update threshold to ≥7 or restore — whichever lane 3 decides; do not leave suite red.

### Blog informatives — PARTIAL (lane 4 not expanded)
- 3 posts only (`#post1/2/3`), each 233–249 words, 1× `<time>`, 1× BlogPosting JSON-LD per post, "2 min read" (consistent at ~200wpm).
- Prices in post1 match config (7,200/10,000/9,200/12,000). Unverified claims are qualified in-text ("unverified here") — good.
- No new researched posts beyond the 3; workflow lane 4 asks for added researched short posts. Not evidenced in tree.

### Prices / contacts — PASS
- `wa.me`: 0 in all 14 HTML, JS, config. `tel:` hrefs: 0 (only a comment + dead log line in `assets/site.js`).
- Stale dinner prices 8,500/10,500: 0 occurrences. Config: twin 7200/10000, single 9200/12000, deposits 12000/14000, lock-in 3mo / notice 1mo — matches workflow owner rules.
- `prices.spec.js`: 9 passed. Full suite earlier: 22 passed (pre-gallery-trim); re-run after trim: 1 gallery-threshold failure (above).

### Playwright — PARTIAL
- `npx playwright test`: 22 passed at 05:01 UTC (pre-trim tree).
- After gallery trim: `core.spec.js -g gallery` — 1 failed (≥20 vs 8), `prices.spec.js` 9 passed. Full re-run required once lane 3 lands.

### Ollama qwen3.5:9b screenshot summary — UNVERIFIED (vision)
- `ollama run qwen3.5:9b` succeeded but text-only (no image pixels fed); output summarised the prompt descriptions, not the PNGs. Marked **unverified** per workflow; host-vision descriptions above are the visual evidence. Screenshots: `~/.hermes/cache/scratch/premium-verify/{index,gallery,blog,rooms}-{1440,390}.png` + `metrics2.json`.

### Ponytail note
- Tree dirty mid-build: treat all counts as snapshot, not `HEAD`. No dead-code trim verdict possible until builders commit. Do not merge to main on this state.

## Blockers before merge
1. Lane 3: gallery → guide cards with `blog.html#postN` links, or explicitly descope and update the ≥20 test + workflow.
2. Lane 4: add researched posts or descope; current 3 posts are accurate but not "added".
3. Fix `tour3d.html` "premium furnishing/sanctuary" fluff.
4. Re-run full Playwright green after 1–3.
