import { test, expect } from '@playwright/test';

// Use ?no-step=1 to skip the onboarding wizard for tests that need direct access to content
// Use ?force-step=1 to force-show wizard even in automation mode (navigator.webdriver)
const home = '/?no-step=1';
const homeWithWizard = '/?force-step=1';

async function acceptConsent(page) {
  // No consent UI yet; placeholder for future
}

test('home loads and shows programs', async ({ page }) => {
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  await acceptConsent(page);
  // Ensure the searchbox is visible (wizard is skipped)
  await expect(page.getByRole('searchbox', { name: /search programs/i })).toBeVisible();
  await expect(page.locator('[data-program]').first()).toBeVisible();
});

test('search filters results', async ({ page }) => {
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  const input = page.getByRole('searchbox', { name: /search programs/i });
  await input.fill('food');
  await expect(page.locator('#search-results [data-program]').filter({ hasText: /food/i }).first()).toBeVisible();
});

test('favorites toggle updates count', async ({ page }) => {
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  await page.locator('.favorite-toggle').first().click();
  await page.goto('/favorites.html', { waitUntil: 'domcontentloaded' });
  const savedCount = page.locator('#favorites-count');
  await expect(savedCount).toHaveText('1');
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  await page.locator('.favorite-toggle').first().click();
  await page.goto('/favorites.html', { waitUntil: 'domcontentloaded' });
  await expect(savedCount).toHaveText('0');
});

test('back to top hidden on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  await page.mouse.wheel(0, 1200);
  const backToTop = page.locator('#back-to-top');
  await expect(backToTop).not.toBeVisible();
});

test('back to top appears after scroll on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  await page.mouse.wheel(0, 1200);
  const backToTop = page.locator('#back-to-top');
  await expect(backToTop).toBeVisible();
});

test('mobile filter drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  await page.goto(home, { waitUntil: 'domcontentloaded' });

  // Mobile filter button should be visible
  const filterToggle = page.locator('#mobile-filter-toggle');
  await expect(filterToggle).toBeVisible();

  // Click to open drawer
  await filterToggle.click();
  const searchPanel = page.locator('.search-panel');
  await expect(searchPanel).toHaveClass(/mobile-open/);

  // Backdrop should be visible
  const backdrop = page.locator('.mobile-filter-backdrop');
  await expect(backdrop).toHaveClass(/show/);

  // Click close button to close drawer
  const closeBtn = page.locator('.mobile-drawer-close');
  await closeBtn.click();
  await expect(searchPanel).not.toHaveClass(/mobile-open/);
});

test('mobile layout prevents horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(home, { waitUntil: 'domcontentloaded' });

  // Check that body doesn't have horizontal scrollbar
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
});

test('step flow wizard displays and navigates correctly', async ({ page }) => {
  await page.goto(homeWithWizard, { waitUntil: 'domcontentloaded' });

  // Step 1: Introduction page should be visible
  const step1 = page.locator('#step-1');
  await expect(step1).toBeVisible();
  await expect(page.locator('#step-1-title')).toContainText('Stretch your budget');

  // Click "Get Started" to go to step 2
  await page.locator('.step-next[data-next="2"]').click();

  // Step 2: Eligibility selection should be visible
  const step2 = page.locator('#step-2');
  await expect(step2).toBeVisible();
  await expect(page.locator('#step-2-title')).toContainText('Which of these apply to you');

  // Select an eligibility option (click the label since inputs are visually hidden)
  await page.locator('.option-card:has(input[value="everyone"])').click();

  // Click "Continue" to go to step 3
  await page.locator('.step-next[data-next="3"]').click();

  // Step 3: County selection should be visible
  const step3 = page.locator('#step-3');
  await expect(step3).toBeVisible();
  await expect(page.locator('#step-3-title')).toContainText('What county do you live in');

  // Select a county (click the label since inputs are visually hidden)
  await page.locator('.option-card:has(input[value="San Francisco"])').click();

  // Click "Show my results" to complete wizard
  await page.locator('.step-submit').click();

  // Wizard should be hidden and search results visible
  await expect(page.locator('#step-flow')).not.toBeVisible();
  await expect(page.getByRole('searchbox', { name: /search programs/i })).toBeVisible();
});
