import { test, expect } from '@playwright/test';

// API Data Integrity Tests
test('API metadata has valid totalPrograms', async ({ request }) => {
  const response = await request.get('/api/metadata.json');
  expect(response.ok()).toBeTruthy();

  const metadata = await response.json();

  // Critical: totalPrograms must exist and be positive
  expect(metadata.totalPrograms).toBeDefined();
  expect(metadata.totalPrograms).toBeGreaterThan(0);

  // Should have at least 100 programs (prevents catastrophic data loss)
  expect(metadata.totalPrograms).toBeGreaterThanOrEqual(100);

  // Version should be semver format
  expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);

  // Should have required endpoints
  expect(metadata.endpoints).toBeDefined();
  expect(metadata.endpoints.programs).toBe('/api/programs.json');
  expect(metadata.endpoints.categories).toBe('/api/categories.json');
});

test('API programs.json has matching count', async ({ request }) => {
  const metaResponse = await request.get('/api/metadata.json');
  const metadata = await metaResponse.json();

  const programsResponse = await request.get('/api/programs.json');
  expect(programsResponse.ok()).toBeTruthy();

  const programs = await programsResponse.json();

  // Programs count should match metadata
  expect(programs.total).toBe(metadata.totalPrograms);
  expect(programs.programs.length).toBe(programs.total);

  // Each program should have required fields
  const sampleProgram = programs.programs[0];
  expect(sampleProgram.id).toBeDefined();
  expect(sampleProgram.name).toBeDefined();
  expect(sampleProgram.category).toBeDefined();
});

test('API categories.json is valid', async ({ request }) => {
  const response = await request.get('/api/categories.json');
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.categories).toBeDefined();
  expect(data.categories.length).toBeGreaterThan(0);

  // Each category should have required fields
  for (const category of data.categories) {
    expect(category.id).toBeDefined();
    expect(category.name).toBeDefined();
    expect(typeof category.programCount).toBe('number');
  }
});

test('API groups.json is valid', async ({ request }) => {
  const response = await request.get('/api/groups.json');
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.groups).toBeDefined();
  expect(data.groups.length).toBeGreaterThan(0);
});

// Page Load Tests
test('home page loads', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Check page title
  await expect(page).toHaveTitle(/Bay Navigator/);

  // Hero section should be visible
  const heroTitle = page.locator('h1');
  await expect(heroTitle).toContainText('Bay Area');
});

test('homepage search shows results', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Search results should be hidden initially
  const searchResults = page.locator('#search-results');
  await expect(searchResults).toHaveClass(/hidden/);

  // Wait for search script to be initialized
  await page.waitForTimeout(1000);

  // Type in search box and press Enter
  const input = page.locator('#search-input');
  await input.fill('food');
  await input.press('Enter');

  // Wait for search to complete
  await page.waitForTimeout(1500);

  // Verify section is visible
  await expect(searchResults).not.toHaveClass(/hidden/, { timeout: 5000 });

  // Should show some program cards
  const visibleCards = page.locator('.home-program-card:not(.hidden)');
  const count = await visibleCards.count();
  expect(count).toBeGreaterThan(0);
});

test('directory page shows program cards', async ({ page }) => {
  await page.goto('/directory', { waitUntil: 'domcontentloaded' });

  // Wait for program cards to load
  const programCards = page.locator('[data-category]');
  await expect(programCards.first()).toBeVisible({ timeout: 10000 });

  // Should have multiple programs
  const count = await programCards.count();
  expect(count).toBeGreaterThan(10);
});

test('directory search filters results', async ({ page }) => {
  await page.goto('/directory', { waitUntil: 'domcontentloaded' });

  // Wait for programs to load
  await page.locator('[data-category]').first().waitFor({ state: 'visible', timeout: 10000 });

  const input = page.locator('#search-input');
  await input.fill('food');
  await input.press('Enter');

  // Wait for filter to apply
  await page.waitForTimeout(500);

  // Verify that food programs are visible
  const visibleCards = page.locator('[data-category]:not([style*="display: none"])');
  const count = await visibleCards.count();
  expect(count).toBeGreaterThan(0);
});

test('category links work', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Click on Food category tile
  const foodLink = page.locator('a[href="/directory?category=Food"]');
  await foodLink.click();

  // Should navigate to directory page
  await expect(page).toHaveURL(/\/directory/);

  // Wait for food programs to load (filtered by category=Food)
  await page.locator('[data-category="food"]:not([style*="display: none"])').first().waitFor({ state: 'visible', timeout: 10000 });

  // Should show food programs
  const foodCards = page.locator('[data-category="food"]:not([style*="display: none"])');
  const count = await foodCards.count();
  expect(count).toBeGreaterThan(0);
});

test('about page loads', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'domcontentloaded' });

  // Check page title
  const title = page.locator('h1');
  await expect(title).toContainText('About Bay Navigator');
});

test('eligibility page loads', async ({ page }) => {
  await page.goto('/eligibility', { waitUntil: 'domcontentloaded' });

  // Check page title
  const title = page.locator('h1');
  await expect(title).toContainText('Eligibility Guides');
});

test('partnerships page loads', async ({ page }) => {
  await page.goto('/partnerships', { waitUntil: 'domcontentloaded' });

  // Check page title
  const title = page.locator('h1');
  await expect(title).toContainText('Partner');
});

test('dark mode toggle works', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Click theme toggle
  const themeToggle = page.locator('#theme-toggle');
  await themeToggle.click();

  // Check that dark class is added to html
  const isDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark')
  );
  expect(isDark).toBe(true);
});

test('mobile menu toggle works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Mobile menu button should be visible
  const menuBtn = page.locator('#mobile-menu-btn');
  await expect(menuBtn).toBeVisible();

  // Click to open menu
  await menuBtn.click();

  // Mobile menu should be visible
  const mobileMenu = page.locator('#mobile-menu');
  await expect(mobileMenu).toBeVisible();
});

test('no horizontal scroll on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
});
