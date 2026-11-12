# Schema Audit — Prajna Co-hab

Live repo: `prajna-co-hab-github` (branch `dig-prajna-website`). Schema confirmed via live `ld+json` block read. Prices from config.js (twin from 7,200, single from 9,200, dinner +2,800, deposits 12,000/14,000).

## Ground truth (verified)
Every page except `offline.html` already carries a `LodgingBusiness` block. `index`/`rooms` also carry `FAQPage`. Most pages carry `BreadcrumbList`. No `Review`, no `Organization`, and no page has a real contact-page schema yet.

| Page | Has | Missing / risk |
|---|---|---|
| index.html | LodgingBusiness, FAQPage | ContactPage, Person |
| rooms.html | LodgingBusiness | FAQPage, ContactPage, Person |
| contact.html | LodgingBusiness, BreadcrumbList | ContactPage (add: contactPoint), BreadcrumbList ✓ |
| about.html | LodgingBusiness, BreadcrumbList | AboutPage (added), Person (added) |
| gallery.html | LodgingBusiness, BreadcrumbList, ImageGallery ✓ | none critical |
| autohub.html | LodgingBusiness, BreadcrumbList | none critical |
| blog.html: posts 1-3 | BlogPosting ×3 | other 12 posts have no schema |
| testimonials.html | LodgingBusiness, BreadcrumbList | Review — must NOT add fake reviews |
| tour3d.html | LodgingBusiness (array), BreadcrumbList, VirtualLocation (added) | none |
| 404.html | LodgingBusiness | none critical |
| offline.html | none | none critical |
| discover/pune/feedback | LodgingBusiness, BreadcrumbList | none critical |

## Truthfulness guardrails (from the reading docs)
- `Review` / `AggregateRating` must NOT be emitted while testimonials are invented. No fake reviews.
- Add no schema that asserts facts not yet true (e.g. no "acceptedAnswer" without an actual reply post).
- `ContactPoint` on contact.html only if mailto endpoint is genuinely the contact path — correct here.

## Recommended action
Add `ContactPage` schema to contact.html with `contactPoint`, add `Person` (owner) to about.html index, normalize `BlogPosting` on all 15 posts, add `ImageGallery` facet to gallery.html. Then verify each block parses as valid JSON-LD.
