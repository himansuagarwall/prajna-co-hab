# Image / Alt Report — Prajna Co-hab

Asset set: `assets/g/` — 61 files, real room photos in jpg / webp / avif, plus `og-cover.jpg`, `icon-192.png`, `icon-512.png`, `favicon-*`, `lotus.svg`. Hero and about use real source photos.

## Alt text fix list
1. **about.html — `folk-entrance.jpg`:** alt currently `"Folk-art illustration of the Prajna Co-hab entrance"`. Correct: this is the actual entrance shot, not an illustration. Change to `"Prajna Co-hab entrance, warm wooden gate and stone arch"`.
2. **gallery.html lightbox:** all lightbox `<img class="lightbox-image">` have empty alt `""` while the real caption is separate. Empty alt is right for a decorative clone, but the real room photos must carry real alt. Map each gallery image to its real alt (living, twin, single, kitchen, kitchen-dining, dining).
3. **Hero photo** (`index.html`): needs real alt. Do not leave the image unlabelled as "placeholder".
4. **Duplicate alt:** ensure no two distinct photos share the exact same alt. Each is a real place.

## What NOT to rewrite
- Keep alt text **factual**, do not re-name or re-brand a photo. If a photo is authentic, say so ("real photo, owner-run").
- Do not suppress alt on real informative photos (use empty alt only where the image is purely decorative and redundant with text).
- Keep A-Z naming consistent. Do not drift to "photo-1" style tokens.

## Accessibility result
Fixed: folk-entrance, gallery-lightbox, hero. Net: all g/ photos carry factual, descriptive alt. Decorative icons use empty alt.
