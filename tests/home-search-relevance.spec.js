// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Homepage search relevance.
 *
 * Assertions are on RANKED RESULTS, not "count > 0". The existing golden-set
 * suite passes 37/40 by pushing each card's entire textContent into a match
 * pool and asserting toBeGreaterThanOrEqual(0), so it stayed green while every
 * query below was broken.
 *
 * Each case here failed against the previous Fuse + Meilisearch pipeline:
 *   - "cant pay pge bill" returned ZERO results
 *   - "i need food" / "im hungry" never reached search at all (diverted to Carl)
 *   - "shelter tonight" returned Section 8 voucher waitlists
 *   - "food alameda county" ranked SF and Santa Clara food banks above Alameda
 */

const CASES = [
  {
    query: 'cant pay pge bill',
    expectTop: /PG&E|REACH|Arrearage|LIHEAP|Match My Payment/i,
    why: 'returned zero results before',
  },
  {
    query: 'i need food',
    expectTop: /Food Bank|Brown Bag|CalFresh|Pantry/i,
    why: 'was diverted to the assistant and never searched',
  },
  {
    query: 'im hungry',
    expectTop: /Food Bank|Pantry|Meals|CalFresh/i,
    why: 'was diverted to the assistant and never searched',
  },
  {
    query: 'shelter tonight',
    expectTop: /Shelter|Housing|Coordinated Entry|Homelessness/i,
    forbidTop: /Section 8|Voucher/i,
    why: 'returned multi-year voucher waitlists to someone needing a bed tonight',
  },
  {
    query: 'food alameda county',
    expectTop: /Alameda/i,
    why: 'ranked SF-Marin and Santa Clara above the Alameda food bank',
  },
  {
    query: 'section 8',
    expectTop: /Section 8|Housing Choice Voucher/i,
    forbidTop: /Burial|Headstone|Memorial|Grave/i,
    why: 'returned VA burial allowances at ranks 4-10',
  },
  {
    query: 'calfesh',
    expectTop: /CalFresh/i,
    why: 'typo tolerance',
  },
];

async function runSearch(page, query) {
  await page.goto('/');
  const input = page.locator('#search-input');
  await input.scrollIntoViewIfNeeded();
  await input.fill(query);
  await input.press('Enter');
  const results = page.locator('#search-results-section');
  await results.waitFor({ state: 'visible', timeout: 15000 });
  await expect(results.locator('h3').first()).toBeVisible({ timeout: 15000 });
  return results;
}

test.describe('homepage search relevance', () => {
  for (const c of CASES) {
    test(`"${c.query}" — ${c.why}`, async ({ page }) => {
      const results = await runSearch(page, c.query);
      const names = await results.locator('h3').allTextContents();

      expect(names.length, `"${c.query}" returned no results`).toBeGreaterThan(0);

      const top3 = names.slice(0, 3).join(' | ');
      expect(top3, `top 3 for "${c.query}" were: ${top3}`).toMatch(c.expectTop);

      if (c.forbidTop) {
        expect(top3, `unwanted result in top 3 for "${c.query}": ${top3}`).not.toMatch(c.forbidTop);
      }
    });
  }

  test('a nonsense query returns no results rather than noise', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#search-input');
    await input.scrollIntoViewIfNeeded();
    await input.fill('xyzabc123qqq');
    await input.press('Enter');
    const results = page.locator('#search-results-section');
    await results.waitFor({ state: 'visible', timeout: 15000 });
    await expect(results.getByText(/0 programs found/)).toBeVisible({ timeout: 15000 });
  });

  test('search does not contact the Meilisearch host', async ({ page }) => {
    // The homepage previously had a hard dependency on search.baytides.org —
    // a Mac Mini behind a Cloudflare Tunnel — with no fallback whatsoever.
    const external = [];
    page.on('request', (r) => {
      if (/baytides\.org/.test(r.url())) external.push(r.url());
    });

    await runSearch(page, 'food stamps');
    expect(external, `search reached external hosts: ${external.join(', ')}`).toHaveLength(0);
  });
});
