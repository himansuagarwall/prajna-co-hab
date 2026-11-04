const { test, expect } = require('@playwright/test');
const {
  HomePage,
  GalleryPage,
  Tour3DPage,
  AboutPage,
  ContactPage,
} = require('./page-objects');

const CONTENT_PAGES = [
  { path: '/index.html', name: 'Home' },
  { path: '/gallery.html', name: 'Gallery' },
  { path: '/tour3d.html', name: 'Tour3D' },
  { path: '/about.html', name: 'About' },
  { path: '/contact.html', name: 'Contact' },
];

test.describe('Prajna Co-hab E2E', () => {
  test('all nav links resolve without 404', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();

    const hrefs = await home.navLinks.evaluateAll((els) => {
      return Array.from(els)
        .map((el) => el.getAttribute('href'))
        .filter((href) => href && href.endsWith('.html') && !href.startsWith('http'));
    });

    const unique = [...new Set(hrefs)];
    for (const href of unique) {
      const res = await page.request.get(href, { maxRedirects: 3 });
      expect(res.status(), `${href} should resolve`).toBe(200);
    }
  });

  test('WhatsApp CTA exists on every content page', async ({ page }) => {
    for (const { path, name } of CONTENT_PAGES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const cta = page.locator('a[href*="wa.me/"]');
      await expect(cta).toHaveCount(1, `${name} should have one WhatsApp CTA`);
    }
  });

  test('JSON-LD schema is valid JSON on every page', async ({ page }) => {
    for (const { path, name } of CONTENT_PAGES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const jsonLd = page.locator('script[type="application/ld+json"]');
      const count = await jsonLd.count();
      expect(count, `${name} should have at least one JSON-LD`).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const raw = await jsonLd.nth(i).innerText();
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          throw new Error(`${name} has invalid JSON-LD[${i}]: ${e.message}`);
        }
        expect(parsed).toBeTruthy();
      }
    }
  });

  test('gallery page shows at least 20 images', async ({ page }) => {
    const gallery = new GalleryPage(page);
    await gallery.open();
    const count = await gallery.images.count();
    expect(count, 'Gallery should have at least 20 images').toBeGreaterThanOrEqual(20);
  });

  test('tour3d page loads Three.js canvas', async ({ page }) => {
    const tour = new Tour3DPage(page);
    await tour.open();
    await expect(tour.canvas).toHaveCount(1, 'Tour3D should have a canvas');
  });

  test('all content pages have exactly one h1', async ({ page }) => {
    for (const { path, name } of CONTENT_PAGES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1, `${name} should have exactly one h1`);
    }
  });
});
