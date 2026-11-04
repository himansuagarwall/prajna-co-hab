import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['json', { outputFile: 'test-results/results.json' }], ['html']],
  use: {
    baseURL: 'http://127.0.0.1:8888',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 8888',
    url: 'http://127.0.0.1:8888',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
