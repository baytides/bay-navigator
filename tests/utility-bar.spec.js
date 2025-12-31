const { test, expect } = require('@playwright/test');

test.describe('Utility Bar', () => {
  test.beforeEach(async ({ page }) => {
    // Use ?no-step=1 to skip the onboarding wizard
    await page.goto('/?no-step=1');
  });

  test('utility bar is visible', async ({ page }) => {
    // Check utility bar is visible
    const utilityBar = page.locator('#utility-bar');
    await expect(utilityBar).toBeVisible();

    // Utility bar content should always be visible (static, no toggle)
    const content = page.locator('#utility-bar-content');
    await expect(content).toBeVisible();
  });

  test('theme selector works', async ({ page }) => {
    const themeSelect = page.locator('#theme-select');

    // Check theme select is visible
    await expect(themeSelect).toBeVisible();

    // Check options exist
    await expect(themeSelect).toHaveValue('auto');

    // Change to dark mode
    await themeSelect.selectOption('dark');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');

    // Change to light mode
    await themeSelect.selectOption('light');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
  });

  test('utility buttons are accessible', async ({ page }) => {
    // Check spacing toggle button
    const spacingToggle = page.locator('#spacing-toggle');
    await expect(spacingToggle).toBeVisible();
    await expect(spacingToggle).toHaveAttribute('aria-label', /toggle enhanced text spacing/i);

    // Check share button
    const shareBtn = page.locator('#share-btn');
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toHaveAttribute('aria-label', /share/i);
  });

  test('utility bar works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check utility bar is still visible
    const utilityBar = page.locator('#utility-bar');
    await expect(utilityBar).toBeVisible();

    // Check controls are accessible
    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    // Focus on the theme select directly instead of assuming tab order
    // Tab order varies depending on sidebar visibility (viewport width >= 1024px shows sidebar)
    const themeSelect = page.locator('#theme-select');
    await themeSelect.focus();
    await expect(themeSelect).toBeFocused();

    // Tab to next control (spacing toggle)
    await page.keyboard.press('Tab');
    const spacingToggle = page.locator('#spacing-toggle');
    await expect(spacingToggle).toBeFocused();

    // Tab to next control (share button)
    await page.keyboard.press('Tab');
    const shareBtn = page.locator('#share-btn');
    await expect(shareBtn).toBeFocused();
  });

  test('preferences persist after page reload', async ({ page }) => {
    // Set dark theme
    const themeSelect = page.locator('#theme-select');
    await themeSelect.selectOption('dark');

    // Wait for localStorage to be set
    await page.waitForTimeout(100);

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check preferences were saved
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  });
});
