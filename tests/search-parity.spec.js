// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Homepage / directory parity.
 *
 * The two surfaces previously ran independent implementations of the same
 * three steps — rewriteQuery, expandSynonyms, getBestBets — with different
 * semantics (exact-match vs word-boundary, string vs array, no stopwords vs a
 * stopword list) and different result limits. They returned materially
 * different answers for the same query by construction.
 *
 * Worse, the directory silently switched engines: Meilisearch treated a
 * zero-hit response as "engine unavailable" and fell through to Fuse, so any
 * search performed with a category filter active ran on a different engine
 * with different weights, with no indication to the user.
 *
 * Both now call the same searcher over the same static index. This test fails
 * if they ever diverge again.
 */

const QUERIES = [
  'cant pay pge bill',
  'i need food',
  'shelter tonight',
  'section 8',
  'calfesh',
  'food alameda county',
  'food stamps',
];

async function homepageTop(page, query, n = 3) {
  await page.goto('/');
  const input = page.locator('#search-input');
  await input.scrollIntoViewIfNeeded();
  await input.fill(query);
  await input.press('Enter');
  const results = page.locator('#search-results-section');
  await results.waitFor({ state: 'visible', timeout: 15000 });
  await expect(results.locator('h3').first()).toBeVisible({ timeout: 15000 });
  return (await results.locator('h3').allTextContents()).slice(0, n).map((s) => s.trim());
}

async function directoryTop(page, query, n = 3) {
  await page.goto('/directory');
  const input = page.locator('#search-input');
  await input.scrollIntoViewIfNeeded();
  await input.fill(query);
  // The directory filters in place; give the debounced handler time to settle.
  await page.waitForTimeout(1500);

  return page.evaluate(
    ({ n }) => {
      const grid = document.getElementById('programs-grid');
      if (!grid) return [];
      const seen = new Set();
      const out = [];
      // FavoritesButton also carries data-program-id, so dedupe by id.
      for (const el of grid.querySelectorAll('[data-program-id]')) {
        if (/** @type {HTMLElement} */ (el).style.display === 'none') continue;
        const id = el.getAttribute('data-program-id');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const card = el.closest('article') || el;
        const h = card.querySelector('h3');
        out.push((h ? h.textContent : '').trim());
        if (out.length === n) break;
      }
      return out;
    },
    { n }
  );
}

test.describe('search parity between homepage and directory', () => {
  for (const q of QUERIES) {
    test(`"${q}" ranks the same on both surfaces`, async ({ page }) => {
      const home = await homepageTop(page, q);
      const dir = await directoryTop(page, q);

      expect(home.length, `homepage returned nothing for "${q}"`).toBeGreaterThan(0);
      expect(dir.length, `directory returned nothing for "${q}"`).toBeGreaterThan(0);
      expect(
        dir,
        `"${q}"\n  homepage: ${home.join(' | ')}\n  directory: ${dir.join(' | ')}`
      ).toEqual(home);
    });
  }

  test('neither surface contacts the Meilisearch host', async ({ page }) => {
    const external = [];
    page.on('request', (r) => {
      if (/baytides\.org/.test(r.url())) external.push(r.url());
    });

    await homepageTop(page, 'food stamps');
    await directoryTop(page, 'food stamps');

    expect(external, `search reached external hosts: ${external.join(', ')}`).toHaveLength(0);
  });

  test('the shipped index carries no serialized Fuse index', async ({ request }) => {
    const res = await request.get('/data/search-index.json');
    expect(res.ok()).toBeTruthy();
    const payload = await res.json();
    // Both surfaces build a MiniSearch index in the browser from `documents`.
    expect(payload.index, 'serialized Fuse index is dead payload').toBeUndefined();
    expect(payload.documents.length).toBeGreaterThan(700);
    // Faceting fields must be present or client-side county filtering silently
    // drops every county-specific program.
    expect(payload.documents[0]).toHaveProperty('counties');
  });
});
