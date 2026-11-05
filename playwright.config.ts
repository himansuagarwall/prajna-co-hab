import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // two workers, not one per core: eight parallel browsers saturate the
  // single python server and every third test dies on ECONNRESET
  workers: process.env.CI ? 1 : 2,
  reporter: [['json', { outputFile: 'test-results/results.json' }], ['html']],
  use: {
    baseURL: 'http://127.0.0.1:8888',
    trace: 'on-first-retry',
    // the site registers a service worker that precaches the shell; leaving it
    // on makes every test wait on background fetches and turns runs flaky
    serviceWorkers: 'block',
  },
  webServer: {
    // python's http.server is single threaded; parallel test files were getting
    // connection resets from it, which showed up as random assertion failures
    command: `python3 -c "from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler; ThreadingHTTPServer(('127.0.0.1', 8888), SimpleHTTPRequestHandler).serve_forever()"`,
    url: 'http://127.0.0.1:8888',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
