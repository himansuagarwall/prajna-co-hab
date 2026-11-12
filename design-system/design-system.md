# Prajna Co-hab — Design System (v0.1 preview)

Minimal, folk, modern. Built for the owner-run co-living house on the Bhosari Industrial Estate, Balaji Nagar, Pune. Designed to be found by AI (GEO/AEO) and read by people: high readability, clear structure, real warmth.

## 1. Palette
Warm paper + terracotta, generous negative space, no sterile corporate.

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#faf6f0` | Page background |
| `--panel` | `#fdfaf4` | Card / FAQ / block backgrounds |
| `--ink` | `#2b2620` | Body text |
| `--muted` | `#7a7166` | Secondary copy, labels |
| `--terra` | `#c05621` | Terracotta accent (primary CTAs, datums) |
| `--terra-dark` | `#9a4522` | Hover / stronger accent |
| `--ochre` | `#d9a441` | Secondary accent (rules, tags, badges) |
| `--line` | `#e8e0d4` | Rules, borders |

Contrast guard: do not set text-over-terracotta for body (fails AA). Use `--terra-dark` or ink on paper for body. Ochre is decorative-only, never body text.

## 2. Type
- **Headings:** Marcellus (serif) — distinctive, folk, structured.
- **Body / UI:** Verdana (humanist, very readable at small sizes).
- Brand mark: empty lotus (SVG), single colour at a time.
- `lang="en-IN"` on every page.

## 3. Voice & vocabulary
See /content/voice-and-tone.md. Core: matured, warm, hilarious, understated. Plain words. No filler. Indian English rhythm. The copy must answer a question, not decorate.

## 4. Patterns
- **Folk-line:** repeating-linear-gradient terracotta→ochre→terra-dark, subtle opacity — page dividers, tags.
- **Lotus mark:** SVG lotus, single colour, used in header brand and PDF.
- **Arch:** top-arch photo treatment on hero. Consistent, never mixed with another hero treatment.
- **Paper + water:** hard paper surfaces, a faint water/ochre wash on hero anchor. Meditative, not loud.
- **Price blocks:** standalone cartoned cards, prices in terra-dark.
- **Cards:** paper, border line, 8px radius, no drop shadows (flat folk).
- **Badges/tags:** ochre pill, uppercase, small.

## 5. Components
Buttons (filled terra, ghost terra, pill, small), price cards, FAQ, tags, forms (pform + mailto), forms with honeypot. Every component is responsive: no horizontal scroll < 320px.

## 6. Responsive
Single breakpoint at 1024px (nav + column reflow). 67 media queries already tuned. New patterns extend, not duplicate.

## 7. GEO / AEO posture
Every page must be AI-discoverable, not just human-readable:

| Rule | Where |
|---|---|
| Structured data on every page | `LodgingBusiness` + `FAQPage` on index/rooms. Add `ContactPage`/`Person` |
| Canonical + unique titles | all pages |
| Open Graph + Twitter cards | every page |
| JSON-LD FAQ + author context | index, rooms, blog |
| Clear language schema | controlled vocab (the voice in this file) |
| `llms.txt` | repo root (done) |
| No image misclassification | factual alt text |
| Factual present tense | no unverifiable claims |

## 8. Human warmth rules (non-negotiable)
- No corporate "we're thrilled to announce". No invented claims.
- Paper, not plastic: warm, lived-in, slightly imperfect.
- Copy must earn the next scroll. Every block should invite the next click.

## 9. Colour checks
- `--terra` on `--paper` = 4.21:1 (AA fail for normal text). Use `--terra-dark` / `--ink` on paper.
- `--ochre` on `--paper` = 2.07:1, decorative-only.
