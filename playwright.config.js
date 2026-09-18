// Playwright config with accessibility testing
// To run: npx playwright test
// To run accessibility only: npx playwright test --project=accessibility
// To run mobile only: npx playwright test --project=mobile
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  // Longer timeout in CI due to slower GitHub Actions runners
  timeout: process.env.CI ? 90000 : 60000,
  // Run tests in parallel for better CI performance
  fullyParallel: true,
  // Single worker in CI to reduce resource contention on shared runners
  workers: process.env.CI ? 1 : undefined,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
    trace: 'on-first-retry',
    navigationTimeout: 60000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    // In CI the workflow has already run `npm run build` in a preceding step,
    // so only serve it. Building again here doubled the work: once the site
    // grew to ~900 pages the second build alone took ~7 minutes on GitHub
    // runners and blew through this timeout, failing the whole suite before a
    // single test ran. Locally, build first so the server reflects your changes.
    command: process.env.CI ? 'npm run preview' : 'npm run build && npm run preview',
    port: 4321,
    // `astro preview` daemonizes: it prints "Preview server running (pid N)"
    // and the foreground process exits, leaving the server up in the
    // background. Playwright watches the process it spawned, sees it exit, and
    // reports "Process from config.webServer exited early" — while the server
    // it was waiting for is in fact listening on 4321.
    //
    // reuseExistingServer makes Playwright check the port before spawning
    // anything, so with the server already started (the CI workflow starts it
    // in its own step) it attaches instead of launching a process it will then
    // misread. Unconditional rather than !CI, because the daemonizing is not
    // something CI does differently — it was only invisible locally, where a
    // server was usually already running.
    reuseExistingServer: true,
    timeout: process.env.CI ? 120000 : 600000,
    stdout: 'pipe',
    stderr: 'pipe',
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
