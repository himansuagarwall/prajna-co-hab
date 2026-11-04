const { test, expect } = require('@playwright/test');

/**
 * Lead capture, end to end.
 *
 * Whatever is deployed, the browser side must do four things:
 *   1. send the visitor's email address, because that is the only reply channel
 *   2. send the rating the visitor actually clicked
 *   3. refuse a honeypot submission without leaking that it refused
 *   4. keep the typed data when the send fails
 *
 * These tests stub the Apps Script endpoint, so they prove the client, not
 * Google. The server itself is covered by the manual checklist in
 * LEAD-CAPTURE-SETUP.md.
 */

const ENDPOINT = 'https://script.google.com/macros/s/TEST/exec';

async function withEndpoint(page, handler) {
  await page.route('**/config.js*', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    body = body.replace(/endpoint:\s*""/, `endpoint: "${ENDPOINT}"`);
    await route.fulfill({ response: res, body });
  });
  await page.route('https://script.google.com/**', handler);
}

test.describe('lead capture', () => {
  test('contact form sends name, email and a stable id', async ({ page }) => {
    const sent = [];
    await withEndpoint(page, async (route) => {
      const body = JSON.parse(route.request().postData());
      // the same endpoint also receives anonymous page_view beacons
      if (body.type !== 'visit') sent.push(body);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/contact.html', { waitUntil: 'networkidle' });
    await page.fill('#iname', 'Audit Visitor');
    await page.fill('#iemail', 'visitor@example.com');
    await page.fill('#imsg', 'Twin room from December, night shift.');
    await page.click('form[data-formtype="inquiry"] button[type=submit]');
    await expect(page.locator('.fresult')).toContainText('Got it', { timeout: 5000 });

    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe('inquiry');
    expect(sent[0].name).toBe('Audit Visitor');
    expect(sent[0].email).toBe('visitor@example.com');
    expect(sent[0].id).toBeTruthy();
    expect(sent[0].page).toBe('contact.html');
    // the old handler reset the form; a successful send should still clear it
    await expect(page.locator('#iname')).toHaveValue('');
  });

  test('the feedback rating that is clicked is the rating that is sent', async ({ page }) => {
    const sent = [];
    await withEndpoint(page, async (route) => {
      const body = JSON.parse(route.request().postData());
      if (body.type !== 'visit') sent.push(body);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/feedback.html', { waitUntil: 'networkidle' });
    await page.click('label[for="s5"]');
    // the rating must actually be selected before submit, or native
    // validation blocks the form and the assertion below tests nothing
    await expect(page.locator('#s5')).toBeChecked();
    await page.fill('#fmsg', 'Clean, quiet, food was good.');
    await page.click('form[data-formtype="feedback"] button[type=submit]');
    await expect(page.locator('.fresult')).toContainText('Got it', { timeout: 5000 });

    expect(sent).toHaveLength(1);
    expect(sent[0].rating).toBe('5');
    expect(sent[0].type).toBe('feedback');
  });

  test('a filled honeypot is silently dropped', async ({ page }) => {
    const sent = [];
    await withEndpoint(page, async (route) => {
      const body = JSON.parse(route.request().postData());
      if (body.type !== 'visit') sent.push(1);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/contact.html', { waitUntil: 'networkidle' });
    await page.fill('#iname', 'Bot');
    await page.fill('#iemail', 'bot@example.com');
    await page.evaluate(() => { document.querySelector('#icompany').value = 'spam co'; });
    await page.click('form[data-formtype="inquiry"] button[type=submit]');
    await expect(page.locator('.fresult')).toContainText('Got it', { timeout: 5000 });

    expect(sent, 'nothing should reach the endpoint').toHaveLength(0);
  });

  test('a failed send keeps the typed data and says so', async ({ page }) => {
    await withEndpoint(page, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'save_failed' }) })
    );

    await page.goto('/contact.html', { waitUntil: 'networkidle' });
    await page.fill('#iname', 'Unlucky Visitor');
    await page.fill('#iemail', 'unlucky@example.com');
    await page.click('form[data-formtype="inquiry"] button[type=submit]');
    await expect(page.locator('.fresult')).toContainText('Could not send', { timeout: 5000 });
    await expect(page.locator('#iname')).toHaveValue('Unlucky Visitor');
    await expect(page.locator('#iemail')).toHaveValue('unlucky@example.com');
  });

  test('the forms require an email address and carry a honeypot', async ({ page }) => {
    await page.goto('/contact.html', { waitUntil: 'networkidle' });
    await expect(page.locator('#iemail')).toHaveAttribute('type', 'email');
    await expect(page.locator('#iemail')).toHaveAttribute('required', '');
    await expect(page.locator('#icompany')).toHaveCount(1);
    await expect(page.locator('#icompany')).toHaveAttribute('tabindex', '-1');

    await page.goto('/feedback.html', { waitUntil: 'networkidle' });
    await expect(page.locator('input[name="rating"]')).toHaveCount(5);
    await expect(page.locator('#s5')).toHaveAttribute('required', '');

    await page.goto('/autohub.html', { waitUntil: 'networkidle' });
    await expect(page.locator('#bcompany')).toHaveCount(1);
  });

  test('no submit button is overridden by an aria-label', async ({ page }) => {
    for (const url of ['/contact.html', '/feedback.html', '/autohub.html']) {
      await page.goto(url, { waitUntil: 'networkidle' });
      const withLabel = await page.locator('form[data-formtype] button[type=submit][aria-label]').count();
      expect(withLabel, `${url} submit button should use its visible text`).toBe(0);
    }
  });
});
