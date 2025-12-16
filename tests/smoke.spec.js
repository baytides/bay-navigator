import { test, expect } from '@playwright/test';

const home = '/';

async function acceptConsent(page) {
  // No consent UI yet; placeholder for future
}

test('home loads and shows programs', async ({ page }) => {
  await page.goto(home);
  await acceptConsent(page);
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(page.getByRole('button', { name: /share search/i })).toBeVisible();
  await expect(page.locator('[data-program]')).toHaveCountGreaterThan(0);
});

test('search filters results', async ({ page }) => {
  await page.goto(home);
  const input = page.getByRole('searchbox', { name: /search programs/i });
  await input.fill('food');
  await expect(page.locator('#search-results [data-program]')).toBeVisible();
});

test('favorites toggle updates count', async ({ page }) => {
  await page.goto(home);
  const firstHeart = page.locator('.favorite-toggle').first();
  const savedCount = page.locator('#favorites-count');
  const initial = await savedCount.innerText();
  await firstHeart.click();
  await expect(savedCount).not.toHaveText(initial);
  await firstHeart.click();
  await expect(savedCount).toHaveText(initial);
});

test('back to top appears after scroll', async ({ page }) => {
  await page.goto(home);
  await page.mouse.wheel(0, 1200);
  const backToTop = page.locator('#back-to-top');
  await expect(backToTop).toBeVisible();
});
