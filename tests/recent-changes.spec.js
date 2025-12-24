const { test, expect } = require('@playwright/test');

test.describe('Recent Changes - Site Header and Dark Mode', () => {
  test('site header appears on index page', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();

    // Check logo is present
    const logo = page.locator('.site-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('aria-label', /Bay Area Discounts - Home/i);

    // Check navigation is present
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
  });

  test('site header appears on privacy page', async ({ page }) => {
    await page.goto('/privacy.html');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();

    // Check logo is clickable and goes to home
    const logo = page.locator('.site-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/');
  });

  test('site header appears only once (no duplicates)', async ({ page }) => {
    await page.goto('/');

    const headers = page.locator('.site-header');
    await expect(headers).toHaveCount(1);
  });

  test('dark mode toggle applies correct CSS variables', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    const themeSelect = page.locator('#theme-select');

    // Test dark mode
    await themeSelect.selectOption('dark');
    await expect(body).toHaveAttribute('data-theme', 'dark');

    // Check that dark mode CSS variables are applied
    const bgColor = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--bg-main').trim();
    });
    expect(bgColor).toBe('#0d1117'); // Dark mode background

    // Test light mode
    await themeSelect.selectOption('light');
    await expect(body).toHaveAttribute('data-theme', 'light');

    // Check that light mode CSS variables are applied
    const lightBgColor = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--bg-main').trim();
    });
    expect(lightBgColor).toBe('white'); // Light mode background
  });

  test('dark mode toggle overrides system preference', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    const themeSelect = page.locator('#theme-select');

    // Set to light mode explicitly
    await themeSelect.selectOption('light');

    // Emulate dark color scheme preference
    await page.emulateMedia({ colorScheme: 'dark' });

    // Body should still show light mode (manual override)
    await expect(body).toHaveAttribute('data-theme', 'light');

    const bgColor = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--bg-main').trim();
    });
    expect(bgColor).toBe('white'); // Should stay light
  });

  test('auto mode respects system preference', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    const themeSelect = page.locator('#theme-select');

    // Set to auto mode
    await themeSelect.selectOption('auto');

    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100); // Wait for media query to apply

    await expect(body).toHaveAttribute('data-theme', 'dark');

    // Emulate light color scheme
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);

    await expect(body).toHaveAttribute('data-theme', 'light');
  });

  test('privacy policy text is visible in dark mode', async ({ page }) => {
    await page.goto('/privacy.html');

    const themeSelect = page.locator('#theme-select');
    await themeSelect.selectOption('dark');

    // Check content wrapper is visible
    const contentWrapper = page.locator('.content-wrapper');
    await expect(contentWrapper).toBeVisible();

    // Check that h1 exists and is visible
    const h1 = page.locator('.content-wrapper h1').first();
    await expect(h1).toBeVisible();
  });

  test('h1.sr-only is inside header landmark (ADA fix)', async ({ page }) => {
    await page.goto('/');

    // Check that h1.sr-only exists
    const srOnlyH1 = page.locator('h1.sr-only');
    await expect(srOnlyH1).toHaveCount(1);

    // Check that it's inside the header element
    const headerH1 = page.locator('header h1.sr-only');
    await expect(headerH1).toHaveCount(1);
    await expect(headerH1).toHaveText('Bay Area Discounts');
  });

  test('site header navigation links work', async ({ page }) => {
    await page.goto('/');

    // All Programs link now uses /?no-step=1 to skip the wizard
    const homeLink = page.locator('.nav-link[href*="no-step"]');
    await expect(homeLink).toBeVisible();

    const favoritesLink = page.locator('.nav-link[href*="favorites"]');
    if (await favoritesLink.count() > 0) {
      await expect(favoritesLink).toBeVisible();
    }
  });

  test('responsive design on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();

    const logo = page.locator('.site-logo');
    await expect(logo).toBeVisible();

    // Utility bar should be collapsed by default on mobile
    const utilityContent = page.locator('#utility-bar-content');
    await expect(utilityContent).toHaveClass(/hidden/);

    // Expand utility bar
    const utilityToggle = page.locator('#utility-bar-toggle');
    await utilityToggle.click();

    // Now theme select should be visible
    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeVisible();
  });

  test('responsive design on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();

    const utilityBar = page.locator('#utility-bar');
    await expect(utilityBar).toBeVisible();
  });

  test('responsive design on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const header = page.locator('.site-header');
    await expect(header).toBeVisible();

    const logo = page.locator('.site-logo');
    await expect(logo).toBeVisible();

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
  });
});
