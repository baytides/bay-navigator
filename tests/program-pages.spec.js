// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Individual program pages.
 *
 * All 823 programs previously shared one URL. /directory rendered every one of
 * them into a 6.8 MB document titled "Directory | Bay Navigator", detail
 * opened in a JS modal, and Share produced /directory#some-id — which search
 * engines collapse to the parent page.
 *
 * Two things were broken by that, and these tests cover both:
 *   1. No program could rank for its own name.
 *   2. Referral. A case manager sharing a program sent their client a 6.8 MB
 *      page with no way to find it.
 */

const SAMPLES = [
  { slug: 'calfresh-online', name: 'CalFresh Online' },
  { slug: 'alameda-food-bank', name: 'Alameda County Community Food Bank' },
  { slug: 'section-8-hcv', name: 'Section 8' },
];

test.describe('program pages', () => {
  for (const s of SAMPLES) {
    test(`/programs/${s.slug}/ is a real, indexable page`, async ({ page }) => {
      const res = await page.goto(`/programs/${s.slug}/`);
      expect(res?.status(), `expected 200 for /programs/${s.slug}/`).toBe(200);

      // Exactly one h1, carrying the program name.
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
      await expect(h1s.first()).toContainText(s.name);

      // Title must carry the program name, not "Directory".
      const title = await page.title();
      expect(title).toContain(s.name.split(' ')[0]);
      expect(title).not.toBe('Directory | Bay Navigator');

      // Indexable, with a self-referencing canonical.
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots).toContain('index');
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain(`/programs/${s.slug}/`);

      // A unique meta description, not the site-wide fallback.
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc, 'meta description missing').toBeTruthy();
      expect(desc).not.toBe('Free and low-cost resources across the San Francisco Bay Area');
    });
  }

  test('emits GovernmentService and BreadcrumbList structured data', async ({ page }) => {
    await page.goto('/programs/calfresh-online/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.flatMap((b) => {
      try {
        return [JSON.parse(b)['@type']];
      } catch {
        return [];
      }
    });
    // The site previously emitted only Organization and WebSite, sitewide.
    expect(types).toContain('GovernmentService');
    expect(types).toContain('BreadcrumbList');
  });

  test('how to apply is visible, not collapsed behind a click', async ({ page }) => {
    await page.goto('/programs/calfresh-online/');
    await expect(page.getByRole('heading', { name: /how to apply/i })).toBeVisible();
    // It must not sit inside a disclosure the reader has to open.
    await expect(page.locator('details:has(h2:text-is("How to apply"))')).toHaveCount(0);
  });

  test('renders no literal markdown artifacts', async ({ page }) => {
    await page.goto('/programs/calfresh-online/');
    const body = await page.locator('body').innerText();
    expect(body, 'unparsed ** markdown is reaching the reader').not.toMatch(/\*\*\w/);
  });

  test('the page is a fraction of the directory payload', async ({ request }) => {
    const prog = await request.get('/programs/calfresh-online/');
    const dir = await request.get('/directory');
    const progSize = (await prog.body()).length;
    const dirSize = (await dir.body()).length;
    expect(progSize).toBeLessThan(dirSize / 5);
  });

  test('the directory links to program pages and none of them 404', async ({ page, request }) => {
    await page.goto('/directory');
    const links = page.locator('a[href^="/programs/"]');
    const count = await links.count();
    expect(count, 'directory has no links to program pages').toBeGreaterThan(500);

    // Spot-check a sample rather than all 800+.
    const seen = new Set();
    for (let i = 0; i < Math.min(count, 25); i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href || seen.has(href)) continue;
      seen.add(href);
      const res = await request.get(href);
      expect(res.status(), `${href} returned ${res.status()}`).toBe(200);
    }
  });

  test('restricted-licence crisis listings render without a broken link', async ({ page }) => {
    // 988, Crisis Text Line, Trans Lifeline and Trevor Project are excluded
    // from the public API for licence reasons, so no program page exists.
    // They must still appear on the directory, just unlinked.
    await page.goto('/directory');
    await expect(page.getByText('988 Suicide', { exact: false }).first()).toBeVisible();

    for (const slug of ['988-suicide', 'crisis-text-line', 'trans-lifeline', 'trevor-project']) {
      await expect(
        page.locator(`a[href*="/programs/${slug}"]`),
        `links to /programs/${slug}, which is not generated`
      ).toHaveCount(0);
    }
  });
});
