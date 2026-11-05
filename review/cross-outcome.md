# Cross-outcome review: does each page earn its place?

Date: 2026-11-06. Branch: `wiring-pages` (dirty tree, sibling lane in progress; this file is the only write).
Method: read-only audit of all 14 HTML pages + `config.js` + `assets/site.js` + `sitemap.xml`. No browser run in this pass; claims below are from source, not rendered QA. Price book in `config.js`: twin 7200/10000, single 9200/12000, deposits 12000/14000, lock-in 3mo, notice 1mo, `bedsOpen: 0`, `endpoint: ""` (mailto-only).

## The user journey, end to end

1. **Find rent** — works on index and rooms. Prices agree (Rs 7,200 / 9,200 base, +Rs 2,800 dinner, deposits 12k/14k). `npm run check:prices` exists.
2. **Understand inclusions** — works on rooms (in-room lists keep the owner asymmetry: double HAS bedside table, private does NOT, has study table + chair). Index repeats a shorter version. Good.
3. **Email enquiry** — half-works. Every CTA is a `mailto:` with a prefilled subject, and forms fall back to mailto because `config.endpoint` is empty. **Lead capture is not live until Code.gs is deployed** (LEAD-CAPTURE-SETUP.md). Until then, "Send" depends on the visitor's mail client and there is no sheet record. This is the single largest journey risk.
4. **Pit ask/reply open** — works as designed. Ask form and post form are ungated mailto forms; the optional account section explicitly says anyone can read, ask, post and reply without login, and sits after the post form. No password page. Correct per standing rules.

## Verdict per page

### index.html — EARNED, one fix
Hero H1 ("A room of your own, in a house that is run by its owner") plus location, "Dinner is optional. Contact is by email only" and price strip is clear. It has one job (rooms) and one secondary (Pit) and states both. **Fix P1: the hero never says the house is full.** `config.js` says `bedsOpen: 0` and rooms.html says "No beds free right now", but index shows prices with "Email us" and no availability line, so a visitor's first impression is "available now" and the sold-out truth only arrives one click later. Add the `availability` string from config to the hero (it already exists in the price book; rendering it is a one-line `data-cfg` add, not new copy). Also "Email us" as the hero CTA competes with the price strip; when full, the honest primary CTA is "Join the waiting list" (rooms) not a generic enquiry.

### rooms.html — EARNED, strongest conversion page
Tabs by room type, photo per type, inclusions, price table with deposits, lock-in/notice, sold-out state with "Join the waiting list" as the primary action. The waiting-list form duplicates the contact form field-for-field; that is acceptable (same `data-formtype="inquiry"`, same backend) but it means two copies of the same lead form to maintain. **Fix P2:** keep one form component; if the endpoint deploys, both should post the same payload (they do today via site.js, verify after deploy). Minor: title/meta still say "Moshi, Pune" while the printed address is Balaji Nagar, Bhosari; Moshi is area context only per standing rules, so meta should match the address truth.

### about.html — EARNED, thin
" We own the house and we run it" plus name/how-we-run/who-it-is-for earns its place as the trust page behind the "no broker" claim, and it is the only page that explains the name. 377 words is thin but honest. No fix beyond what index already does; do not pad it.

### gallery.html — EARNED, honesty gap (P1)
Six real photos (living, twin, single, kitchen, kitchen-dining, dining) with accurate captions ("Double in-room", "Private in-room", "Common floor") and a "Come and look" visit CTA. Honest so far. **Gap: nothing states these are the actual rooms or when taken.** Alt text describes them as facts ("Twin-sharing room with two single beds"), which is fine if true, but there is no "photos of the actual house" line or date, and the lightbox image has a generic empty alt. Add one line under the H1: what these photos show and that visits confirm them. One line, no new claims.

### blog.html (Guides) — EARNED, fine-tune not expansion
Three posts, all with `<time datetime="2026-11-04">`, BlogPosting schema, "2 min read" labels, and comparative price claims correctly qualified as "unverified here". That matches the standing fine-tune rule. Gaps: zero images in posts (weak for a guide hub), read time is a flat "2 min" on all three (check against the 200 wpm rule when touched), and post 3 (Moshi guide) overlaps pune.html and discover.html. **Fix P2:** add one image per post or an og:image per post (schema already references one), verify read times by word count, and cross-link post 3 to pune/discover instead of repeating the same area content.

### tour3d.html — EARNED as a structurally sound shell, not yet a real tour
Real WebGL probe (not just constructor check), `#tour-fallback` overlay with the four real room photos and captions when WebGL fails, hotspots, walkthrough, reduced-motion respected. Textures are the gallery photos, per plan. It correctly falls back to photos, which is the requirement. **Fix P2:** the fallback works, but the tour still only has 4 texture photos for 3+ zones and its own copy admits example/replace markers; until owner photos per room exist it is a structural scene, and the page should say so in one line ("photos of the real rooms" appears only in fallback). Do not ship claims of a full 3D tour until per-room photos land; the honest label is "3D walkthrough built from house photos".

### contact.html — EARNED, conditional on backend deploy (P0)
Email-first with the "Why there's no number here" explainer (good, prevents the obvious question), optional phone field, Maps link to the correct Anandrao Lande Road address, FAQ. Form is mailto-only today. **P0: deploy Code.gs and set `config.endpoint`, or the entire lead journey (rooms waiting list + contact) has no capture.** Until then every "Send" is a mail-client gamble. Also the `phone` field on the form is fine (visitor's number, optional), but keep `config.phone` blank forever.

### autohub.html (Pit) — EARNED, purpose is clear and correctly fenced
Local auto/bike board: categories (Mechanics/Parts/Used bikes/RTO/Insurance/Questions), area filters, ask form, listing templates, trust block, all posts labelled "Example — replace with a real post". Login is optional, mail-only, placed after the post form, never blocks guests. Lead capture scope is rooms/contact only, Pit posting is not a lead form. This is exactly the standing rule. **Fix P2:** replies are "through email" by design, but no per-post Reply action exists; if the board ever shows real posts, each needs a prefilled "Reply to this post" mailto or the reply path is invisible. Do not add accounts, logins, or phone numbers to fix this.

### pune.html + discover.html — EARNED but redundant pair (P2)
pune.html (377 words, "New to Pune?") and discover.html (470 words, "Around the house") both cover commute/markets/food around the house, and blog post 3 covers the same ground a third time. Individually each is useful (pune = city for newcomers, discover = daily needs near the house), but as a pair plus the blog post they dilute. Either merge into one "Around Prajna" page, or differentiate sharply: pune = commute from the belt (job-focused), discover = walkable/rideable daily needs. Keep whichever survives linked from footer and sitemap; both are currently in sitemap.

### testimonials.html — NOT EARNED yet (P1)
Every card is labelled "Example — replace with real resident words" and the meta description says the same. Correctly honest, but the page has no outcome until real reviews exist. Options: (a) keep it out of the primary nav and sitemap until real reviews land, or (b) keep it but add a single line at the top saying reviews are being collected (the feedback page already invites them). Do not let it sit in the footer looking like social proof.

### feedback.html — EARNED as the testimonials feeder
Rating + role + stay length + message, mailto to the owner. This is the only path that can make testimonials.html real. Keep linked from testimonials (it is) and from the footer (it is).

### offline.html / 404.html — EARNED, utility pages
Offline lists cached pages and reload; 404 offers home/rooms/email. Both fine, no outcome risk.

## Cross-cutting fixes, in order

- **P0** Deploy the Apps Script backend and set `config.endpoint`. Until then, state plainly in DEPLOY/LEAD-CAPTURE that capture is mailto-only. Do not report lead capture as live.
- **P1** Sold-out mismatch: surface `config.availability` on the index hero. The house is full; the homepage must not read as available.
- **P1** Testimonials: hide from sitemap/nav until real reviews, or label the page as "being collected" at the top. It earns its place later, not now.
- **P2** Meta/title "Moshi" vs printed address "Balaji Nagar, Bhosari": align meta to the address truth; Moshi stays as area context only.
- **P2** Gallery/tour3d: one honest line each on what the photos are. Tour3d: keep the "built from house photos" framing until per-room photos exist.
- **P2** pune/discover/blog-post-3 overlap: differentiate or merge; add images and verified read times to blog posts.
- **P2** Pit: add a prefilled reply action per real post when posts exist; never gate ask/post/reply behind login.

## What is verified vs not in this pass
Verified from source: price agreement, inclusion asymmetry, mail-only contact model (no `wa.me`, no `tel:`, `config.phone` blank), Pit open ask/reply with optional mail-only account, WebGL fallback present, blog schema + qualified claims, sold-out truth present on rooms but absent on index, endpoint empty. Not verified: rendered behaviour at 1440/390, form submission end-to-end, console errors, mobile bar fixity. Those need a browser pass after the P0/P1 fixes.
