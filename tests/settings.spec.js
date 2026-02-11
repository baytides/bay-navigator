import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('theme buttons update theme and persistence', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });

    await page.click('#settings-theme-dark');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.click('#settings-theme-light');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(false);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    await page.click('#settings-theme-system');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe(null);
  });

  test('accessibility toggles work and remain correct after reset', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });

    const colorblindToggle = page.locator('#settings-colorblind-toggle');
    await colorblindToggle.click();
    await expect(colorblindToggle).toHaveAttribute('aria-checked', 'true');
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.classList.contains('colorblind-mode'))
      )
      .toBe(true);

    await page.click('#settings-reset-all');
    await expect(colorblindToggle).toHaveAttribute('aria-checked', 'false');
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.classList.contains('colorblind-mode'))
      )
      .toBe(false);

    // One click should enable it again. If listeners are duplicated, this can flip twice.
    await colorblindToggle.click();
    await expect(colorblindToggle).toHaveAttribute('aria-checked', 'true');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('baynavigator_colorblind_mode')))
      .toBe('true');
  });

  test('location can be set by ZIP and cleared', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });

    await page.fill('#settings-zip-input', '94102');
    await page.click('#settings-zip-submit');

    await expect(page.locator('#settings-location-display')).not.toHaveClass(/hidden/);
    await expect(page.locator('#settings-location-name')).toContainText('San Francisco');

    await page.click('#settings-location-clear');
    await expect(page.locator('#settings-location-display')).toHaveClass(/hidden/);
    await expect(page.locator('#settings-location-form')).not.toHaveClass(/hidden/);
  });

  test('language selector emits locale-changed with object detail', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      window.__lastLocaleDetail = null;
      window.addEventListener('locale-changed', (e) => {
        window.__lastLocaleDetail = e.detail;
      });
    });

    await page.selectOption('#settings-language', 'es');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('baynavigator_locale')))
      .toBe('es');
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('es');
    await expect
      .poll(() =>
        page.evaluate(() => window.__lastLocaleDetail && window.__lastLocaleDetail.locale)
      )
      .toBe('es');
  });
});
