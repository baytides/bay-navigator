const { test, expect } = require('@playwright/test');

test.describe('Utility Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('utility bar is visible and accessible', async ({ page }) => {
    // Check utility bar is visible
    const utilityBar = page.locator('#utility-bar');
    await expect(utilityBar).toBeVisible();

    // Check toggle button exists and is accessible
    const toggleBtn = page.locator('#utility-bar-toggle');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-label', /toggle utility bar/i);

    // Check initial state (expanded on desktop, collapsed on mobile)
    const viewportWidth = page.viewportSize().width;
    const expectedExpanded = viewportWidth > 768 ? 'true' : 'false';
    await expect(toggleBtn).toHaveAttribute('aria-expanded', expectedExpanded);
  });

  test('can toggle utility bar open and closed', async ({ page }) => {
    const toggleBtn = page.locator('#utility-bar-toggle');
    const content = page.locator('#utility-bar-content');

    // Get initial state
    const initialExpanded = await toggleBtn.getAttribute('aria-expanded');

    // Click to toggle
    await toggleBtn.click();
    const newExpanded = initialExpanded === 'true' ? 'false' : 'true';
    await expect(toggleBtn).toHaveAttribute('aria-expanded', newExpanded);

    if (newExpanded === 'false') {
      await expect(content).toHaveClass(/hidden/);
    } else {
      await expect(content).not.toHaveClass(/hidden/);
    }

    // Click to toggle back
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', initialExpanded);

    if (initialExpanded === 'false') {
      await expect(content).toHaveClass(/hidden/);
    } else {
      await expect(content).not.toHaveClass(/hidden/);
    }
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
    
    // Check toggle still works
    const toggleBtn = page.locator('#utility-bar-toggle');
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('keyboard navigation works', async ({ page }) => {
    // Tab to theme select
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Theme select

    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeFocused();

    // Continue tabbing through controls
    await page.keyboard.press('Tab'); // Spacing toggle
    const spacingToggle = page.locator('#spacing-toggle');
    await expect(spacingToggle).toBeFocused();

    await page.keyboard.press('Tab'); // Share button (print button was removed)
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
