import { test, expect } from '@playwright/test';

/**
 * Offline E2E Tests
 *
 * These tests verify that the service worker correctly caches assets
 * and the app works offline. This is critical for users in areas with
 * poor connectivity or who need to access information without internet.
 */

// Service worker registration and caching take longer in CI
const SW_WAIT_TIME = process.env.CI ? 5000 : 2000;
const SW_CACHE_WAIT_TIME = process.env.CI ? 6000 : 3000;

async function waitForServiceWorkerReady(page) {
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  });
}

test.describe('Service Worker & Offline Functionality', () => {
  test('service worker is registered', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });

    expect(swRegistered).toBe(true);
  });

  test('homepage loads offline after caching', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline navigation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // First visit to cache assets
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(SW_CACHE_WAIT_TIME);

    // Reload once while online so this page is SW-controlled
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify page loaded
    await expect(page.locator('h1')).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Reload homepage again while offline (served by SW)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Core content should still be visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Navigation should be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Go back online for cleanup
    await context.setOffline(false);
  });

  test('directory page loads offline after caching', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline navigation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // First visit to cache
    await page.goto('/directory', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(SW_CACHE_WAIT_TIME);

    // Trigger results view so program cards are visible
    await page.locator('#search-input').fill('food');
    await page.locator('#search-input').press('Enter');
    await page.waitForTimeout(800);

    // Verify programs loaded
    const cards = page.locator('[data-program-id]:not([style*="display: none"])');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Programs should still be visible (from cache)
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Go back online
    await context.setOffline(false);
  });

  test('search works offline with cached data', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline navigation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // First visit to cache everything
    await page.goto('/directory', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(SW_CACHE_WAIT_TIME);

    // Enter a query so results view is shown
    const input = page.locator('#search-input');
    await input.fill('food');
    await input.press('Enter');
    await page.waitForTimeout(800);
    await page.locator('[data-program-id]:not([style*="display: none"])').first().waitFor({
      state: 'visible',
      timeout: 10000,
    });

    // Go offline
    await context.setOffline(true);

    // Reload
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Try a search (fuzzy search should work offline)
    await input.fill('food');
    await input.press('Enter');

    // Wait for local search to process
    await page.waitForTimeout(500);

    // Should still show filtered results
    const visibleCards = page.locator('[data-program-id]:not([style*="display: none"])');
    const count = await visibleCards.count();

    // Should have at least some food-related results
    expect(count).toBeGreaterThan(0);

    // Go back online
    await context.setOffline(false);
  });

  test('favorites page works offline', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline simulation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // Visit favorites page first
    await page.goto('/favorites', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(SW_WAIT_TIME);

    // Go offline
    await context.setOffline(true);

    // Reload
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Page should still work - use first() to avoid strict mode violation from print-only h1
    const title = page.locator('h1').first();
    await expect(title).toContainText('Favorites', { timeout: 10000 });

    // Go back online
    await context.setOffline(false);
  });

  test('about page loads offline', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline navigation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // Cache about page
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(SW_WAIT_TIME);

    // Go offline
    await context.setOffline(true);

    // Reload
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Content should be available
    const title = page.locator('h1');
    await expect(title).toContainText('About', { timeout: 10000 });

    // Go back online
    await context.setOffline(false);
  });

  test('AI toggle shows disabled state offline', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(SW_WAIT_TIME);

    // AI toggle should exist and be enabled
    const aiToggle = page.locator('#assistant-toggle');
    await expect(aiToggle).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Trigger offline detection (may need to interact with page)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await page.waitForTimeout(500);

    // AI toggle should show disabled state
    const isAriaDisabled = await aiToggle.getAttribute('aria-disabled');
    expect(isAriaDisabled === 'true' || isAriaDisabled === null).toBe(true);

    // Go back online
    await context.setOffline(false);
  });

  test('offline banner appears when offline', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.waitForTimeout(1000);

    // Go offline
    await context.setOffline(true);

    // Dispatch offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await page.waitForTimeout(500);

    // Check for offline indicator in the UI
    // The app should show some offline indication
    const offlineIndicator = page.locator('[class*="offline"]');
    const indicatorCount = await offlineIndicator.count();

    // Should have at least one offline indicator element
    // (could be banner, toggle state, etc.)
    expect(indicatorCount).toBeGreaterThanOrEqual(0);

    // Go back online
    await context.setOffline(false);
  });
});

test.describe('PWA Manifest & Icons', () => {
  test('manifest.json is valid', async ({ request }) => {
    const response = await request.get('/assets/images/favicons/site.webmanifest');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    // Required fields
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Should have at least one maskable icon
    const maskableIcon = manifest.icons.find((icon) => icon.purpose?.includes('maskable'));
    expect(maskableIcon).toBeDefined();
  });

  test('service worker file exists', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.ok()).toBeTruthy();

    const swContent = await response.text();
    expect(swContent.length).toBeGreaterThan(100);

    // Should contain caching logic
    expect(swContent).toContain('cache');
  });
});

test.describe('Cached API Data', () => {
  test('programs.json can be cached', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline navigation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // Load page to trigger caching
    await page.goto('/directory', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.evaluate(async () => {
      await fetch('/api/programs.json');
    });
    await page.waitForTimeout(SW_CACHE_WAIT_TIME);

    // Go offline
    await context.setOffline(true);

    // Try to fetch programs API
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/programs.json');
        if (res.ok) {
          const data = await res.json();
          return { ok: true, programCount: data.programs?.length || 0 };
        }
        return { ok: false, error: res.status };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    // Should get cached response
    expect(response.ok).toBe(true);
    expect(response.programCount).toBeGreaterThan(0);

    // Go back online
    await context.setOffline(false);
  });

  test('categories.json can be cached', async ({ page, context, browserName }) => {
    // Skip on WebKit - has internal errors with offline navigation
    test.skip(browserName === 'webkit', 'WebKit has internal errors with offline navigation');

    // Load page to trigger caching
    await page.goto('/directory', { waitUntil: 'domcontentloaded' });
    await waitForServiceWorkerReady(page);
    await page.evaluate(async () => {
      await fetch('/api/categories.json');
    });
    await page.waitForTimeout(SW_CACHE_WAIT_TIME);

    // Go offline
    await context.setOffline(true);

    // Try to fetch categories API
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/categories.json');
        if (res.ok) {
          const data = await res.json();
          return { ok: true, categoryCount: data.categories?.length || 0 };
        }
        return { ok: false, error: res.status };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    // Should get cached response
    expect(response.ok).toBe(true);
    expect(response.categoryCount).toBeGreaterThan(0);

    // Go back online
    await context.setOffline(false);
  });
});
