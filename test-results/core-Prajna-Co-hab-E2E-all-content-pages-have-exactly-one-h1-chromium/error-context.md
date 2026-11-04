# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core.spec.js >> Prajna Co-hab E2E >> all content pages have exactly one h1
- Location: tests/e2e/core.spec.js:77:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('h1')
Expected: 1
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('h1') with timeout 5000ms
  - waiting for locator('h1')
    12 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - link "Skip to content" [ref=f3e2] [cursor=pointer]:
    - /url: "#main"
  - main [ref=f3e3]:
    - generic [ref=f3e5]:
      - heading "Twin-Sharing Room" [level=2] [ref=f3e6]
      - paragraph [ref=f3e7]: Comfortable 10x12 ft space with wardrobe, study desk, and home-style meals. Built for professionals who value simplicity and function.
    - link "← Back" [ref=f3e8] [cursor=pointer]:
      - /url: index.html
    - generic: Drag to orbit · Scroll to zoom
    - generic [ref=f3e9]:
      - button "View twin-sharing room" [ref=f3e10] [cursor=pointer]: Twin Room
      - button "View single room" [ref=f3e11] [cursor=pointer]: Single Room
      - button "View common floor" [ref=f3e12] [cursor=pointer]: Common Floor
      - button "View living area" [ref=f3e13] [cursor=pointer]: Living Area
    - link "WhatsApp Us" [ref=f3e14] [cursor=pointer]:
      - /url: https://wa.me/919876543210?text=Hi%20Prajna%20Co-hab,%20I%20want%20to%20book%20a%20visit.
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const {
  3  |   HomePage,
  4  |   GalleryPage,
  5  |   Tour3DPage,
  6  |   AboutPage,
  7  |   ContactPage,
  8  | } = require('./page-objects');
  9  | 
  10 | const CONTENT_PAGES = [
  11 |   { path: '/index.html', name: 'Home' },
  12 |   { path: '/gallery.html', name: 'Gallery' },
  13 |   { path: '/tour3d.html', name: 'Tour3D' },
  14 |   { path: '/about.html', name: 'About' },
  15 |   { path: '/contact.html', name: 'Contact' },
  16 | ];
  17 | 
  18 | test.describe('Prajna Co-hab E2E', () => {
  19 |   test('all nav links resolve without 404', async ({ page }) => {
  20 |     const home = new HomePage(page);
  21 |     await home.open();
  22 | 
  23 |     const hrefs = await home.navLinks.evaluateAll((els) => {
  24 |       return Array.from(els)
  25 |         .map((el) => el.getAttribute('href'))
  26 |         .filter((href) => href && href.endsWith('.html') && !href.startsWith('http'));
  27 |     });
  28 | 
  29 |     const unique = [...new Set(hrefs)];
  30 |     for (const href of unique) {
  31 |       const res = await page.request.get(href, { maxRedirects: 3 });
  32 |       expect(res.status(), `${href} should resolve`).toBe(200);
  33 |     }
  34 |   });
  35 | 
  36 |   test('WhatsApp CTA exists on every content page', async ({ page }) => {
  37 |     for (const { path, name } of CONTENT_PAGES) {
  38 |       await page.goto(path, { waitUntil: 'networkidle' });
  39 |       const cta = page.locator('a[href*="wa.me/"]');
  40 |       await expect(cta).toHaveCount(1, `${name} should have one WhatsApp CTA`);
  41 |     }
  42 |   });
  43 | 
  44 |   test('JSON-LD schema is valid JSON on every page', async ({ page }) => {
  45 |     for (const { path, name } of CONTENT_PAGES) {
  46 |       await page.goto(path, { waitUntil: 'networkidle' });
  47 |       const jsonLd = page.locator('script[type="application/ld+json"]');
  48 |       const count = await jsonLd.count();
  49 |       expect(count, `${name} should have at least one JSON-LD`).toBeGreaterThan(0);
  50 | 
  51 |       for (let i = 0; i < count; i++) {
  52 |         const raw = await jsonLd.nth(i).innerText();
  53 |         let parsed;
  54 |         try {
  55 |           parsed = JSON.parse(raw);
  56 |         } catch (e) {
  57 |           throw new Error(`${name} has invalid JSON-LD[${i}]: ${e.message}`);
  58 |         }
  59 |         expect(parsed).toBeTruthy();
  60 |       }
  61 |     }
  62 |   });
  63 | 
  64 |   test('gallery page shows at least 20 images', async ({ page }) => {
  65 |     const gallery = new GalleryPage(page);
  66 |     await gallery.open();
  67 |     const count = await gallery.images.count();
  68 |     expect(count, 'Gallery should have at least 20 images').toBeGreaterThanOrEqual(20);
  69 |   });
  70 | 
  71 |   test('tour3d page loads Three.js canvas', async ({ page }) => {
  72 |     const tour = new Tour3DPage(page);
  73 |     await tour.open();
  74 |     await expect(tour.canvas).toHaveCount(1, 'Tour3D should have a canvas');
  75 |   });
  76 | 
  77 |   test('all content pages have exactly one h1', async ({ page }) => {
  78 |     for (const { path, name } of CONTENT_PAGES) {
  79 |       await page.goto(path, { waitUntil: 'networkidle' });
  80 |       const h1s = page.locator('h1');
> 81 |       await expect(h1s).toHaveCount(1, `${name} should have exactly one h1`);
     |                         ^ Error: expect(locator).toHaveCount(expected) failed
  82 |     }
  83 |   });
  84 | });
  85 | 
```