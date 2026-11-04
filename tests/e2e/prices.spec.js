const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * The price book is one set of numbers in config.js and a second set typed
 * into the HTML for no-JS visitors. These tests exist because those two sets
 * drifted apart once already: rooms.html shipped 8,500 / 10,500 while every
 * other page and the schema said 10,000 / 12,000.
 */

function loadConfig() {
  const file = path.join(__dirname, '..', '..', 'config.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.PRAJNA;
}

function inr(n) {
  return Number(n).toLocaleString('en-IN');
}

function read(file) {
  return fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8');
}

const C = loadConfig();

test.describe('price book', () => {
  test('the four rents and two deposits are present and sane', () => {
    for (const key of ['twinRent', 'twinRentMeal', 'singleRent', 'singleRentMeal', 'twinDeposit', 'singleDeposit']) {
      expect(typeof C[key], `${key} must be a number`).toBe('number');
      expect(C[key], `${key} must be positive`).toBeGreaterThan(0);
    }
  });

  test('dinner costs the same add-on on both room types', () => {
    expect(C.twinMealDelta).toBe(C.singleMealDelta);
    expect(C.mealDeltaConsistent).toBe(true);
  });

  test('first-month totals are rent plus deposit', () => {
    expect(C.costTwin).toBe(C.twinRent + C.twinDeposit);
    expect(C.costTwinMeal).toBe(C.twinRentMeal + C.twinDeposit);
    expect(C.costSingle).toBe(C.singleRent + C.singleDeposit);
    expect(C.costSingleMeal).toBe(C.singleRentMeal + C.singleDeposit);
  });

  test('rooms.html quotes the config prices, in the body and in the schema', () => {
    const html = read('rooms.html');
    for (const key of ['twinRent', 'twinRentMeal', 'singleRent', 'singleRentMeal']) {
      expect(html, `rooms.html should quote ${key} as ${inr(C[key])}`).toContain(inr(C[key]));
    }
    expect(html).toContain(inr(C.twinDeposit));
    expect(html).toContain(inr(C.singleDeposit));

    const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
      .filter(Boolean);
    const prices = [];
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node['@type'] === 'Offer' && node.price) prices.push(Number(node.price));
      Object.values(node).forEach(walk);
    };
    blocks.forEach(walk);
    expect(prices.sort((a, b) => a - b)).toEqual(
      [C.twinRent, C.singleRent, C.twinRentMeal, C.singleRentMeal].sort((a, b) => a - b)
    );
  });

  test('no page still carries the retired dinner prices', () => {
    for (const file of ['index.html', 'rooms.html', 'blog.html', 'contact.html', 'testimonials.html']) {
      const html = read(file);
      expect(html, `${file} still quotes the old 8,500 dinner price`).not.toContain('8,500');
      expect(html, `${file} still quotes the old 10,500 dinner price`).not.toContain('10,500');
    }
  });

  test('the blog quote matches the price book', () => {
    const html = read('blog.html');
    expect(html).toContain(inr(C.twinRent));
    expect(html).toContain(inr(C.twinRentMeal));
    expect(html).toContain(inr(C.singleRent));
    expect(html).toContain(inr(C.singleRentMeal));
  });

  test('the rendered homepage shows the config prices, not placeholders', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    const text = await page.locator('body').innerText();
    for (const key of ['twinRent', 'twinRentMeal', 'singleRent', 'singleRentMeal']) {
      expect(text, `homepage should render ${key}`).toContain(inr(C[key]));
    }
    expect(text).not.toContain('₹-');
    expect(text).not.toContain('₹ -');
  });

  test('the rendered rooms page and the homepage agree', async ({ page }) => {
    const grab = async (url) => {
      await page.goto(url, { waitUntil: 'networkidle' });
      return (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    };
    const rooms = await grab('/rooms.html');
    const home = await grab('/index.html');
    for (const key of ['twinRentMeal', 'singleRentMeal', 'twinRent', 'singleRent']) {
      expect(rooms, `rooms.html should show ${key}`).toContain(inr(C[key]));
      expect(home, `index.html should show ${key}`).toContain(inr(C[key]));
    }
  });

  test('the lock-in and notice terms are the configured ones', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    const terms = await page.locator('#termsline').innerText();
    expect(terms).toContain(String(C.lockInMonths));
    expect(terms).toContain(String(C.noticeMonths));
    // innerText skips collapsed <details>, so read the text content
    const faq = (await page.locator('#faq').textContent()).toLowerCase();
    expect(faq).not.toContain('one month minimum');
    expect(faq).toContain('three months');
    expect(faq).toContain('dinner');
  });
});
