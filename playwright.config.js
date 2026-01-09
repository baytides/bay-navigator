// Playwright config with accessibility testing
// To run: npx playwright test
// To run accessibility only: npx playwright test --project=accessibility
// To run mobile only: npx playwright test --project=mobile
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  timeout: 120000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
    trace: 'on-first-retry',
    navigationTimeout: 120000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.js/,
    },
    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.js/,
    },
    // Mobile Chrome (Android)
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*\.spec\.js/,
    },
    // Mobile Safari (iOS)
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      testMatch: /.*\.spec\.js/,
    },
    // Accessibility tests (Chrome only for speed)
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.a11y\.js/,
    },
    // Accessibility tests - Mobile viewport
    {
      name: 'accessibility-mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*\.a11y\.js/,
    },
  ],
  // Reporter configuration
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],
});
