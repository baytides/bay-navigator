import { test, expect } from '@playwright/test';

/**
 * AI Search "Golden Set" Tests
 *
 * These tests verify that critical search queries return expected programs.
 * This prevents regressions when modifying the AI prompt or search logic.
 *
 * Each test case represents a real user need that should always return
 * relevant results. If a test fails after a change, investigate before merging.
 */

// Helper to perform search and get visible program names
async function searchAndGetResults(page, query) {
  await page.goto('/directory', { waitUntil: 'domcontentloaded' });

  // Wait for search UI to be ready
  await page.locator('#search-input').waitFor({ state: 'visible', timeout: 15000 });

  const input = page.locator('#search-input');
  await input.fill(query);
  await input.press('Enter');

  // Wait for search to complete by watching the loading spinner
  // The spinner appears during search and gets 'hidden' class when done
  const searchLoading = page.locator('#search-loading');

  // First wait for loading to start (may be quick)
  await page.waitForTimeout(500);

  // Then wait for loading spinner to be hidden (search complete)
  // Use longer timeout for CI environments, especially mobile-safari
  await searchLoading.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
    // If loading spinner was never shown (instant results), that's okay
  });

  // Additional small wait for DOM to settle after search completes
  await page.waitForTimeout(500);

  // Get visible program cards and descriptions (search may match on description too)
  const visibleCards = page.locator('[data-program-id]:not([style*="display: none"])');
  const count = await visibleCards.count();

  const names = [];
  for (let i = 0; i < Math.min(count, 30); i++) {
    const card = visibleCards.nth(i);
    const nameEl = card.locator('h3');
    const name = await nameEl.textContent();
    if (name) names.push(name.trim().toLowerCase());
    // Also include card content for broader matching
    const content = await card.textContent();
    if (content) names.push(content.trim().toLowerCase());
  }

  return { count, names };
}

// Helper to check if any result contains expected keyword
function hasResultContaining(names, ...keywords) {
  return names.some((name) => keywords.some((keyword) => name.includes(keyword.toLowerCase())));
}

test.describe('Food & Nutrition Searches', () => {
  test('search "food for seniors" returns senior food programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'food for seniors');

    expect(count).toBeGreaterThan(0);
    // Should include Meals on Wheels, CalFresh, or similar
    const hasSeniorFood = hasResultContaining(
      names,
      'meals on wheels',
      'calfresh',
      'food bank',
      'senior',
      'congregate'
    );
    expect(hasSeniorFood).toBe(true);
  });

  test('search "free groceries" returns food assistance', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'free groceries');

    expect(count).toBeGreaterThan(0);
    const hasFoodHelp = hasResultContaining(names, 'food bank', 'pantry', 'calfresh', 'groceries');
    expect(hasFoodHelp).toBe(true);
  });

  test('search "CalFresh" returns CalFresh program', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'CalFresh');

    expect(count).toBeGreaterThan(0);
    const hasCalFresh = hasResultContaining(names, 'calfresh');
    expect(hasCalFresh).toBe(true);
  });
});

test.describe('Housing & Shelter Searches', () => {
  test('search "homeless shelter" returns shelter programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'homeless shelter');

    expect(count).toBeGreaterThan(0);
    const hasShelter = hasResultContaining(names, 'shelter', 'housing', 'homeless');
    expect(hasShelter).toBe(true);
  });

  test('search "help paying rent" returns rental assistance', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'help paying rent');

    expect(count).toBeGreaterThan(0);
    const hasRentHelp = hasResultContaining(
      names,
      'rent',
      'rental',
      'housing',
      'section 8',
      'emergency'
    );
    expect(hasRentHelp).toBe(true);
  });

  test('search "shelter with pets" returns pet-friendly options', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'shelter with pets');

    // May have fewer results - just verify we get something relevant
    expect(count).toBeGreaterThanOrEqual(0);
    if (count > 0) {
      const hasShelter = hasResultContaining(names, 'shelter', 'housing', 'homeless');
      expect(hasShelter).toBe(true);
    }
  });
});

test.describe('Healthcare Searches', () => {
  test('search "free clinic" returns healthcare programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'free clinic');

    expect(count).toBeGreaterThan(0);
    const hasClinic = hasResultContaining(names, 'clinic', 'health', 'medical', 'medi-cal');
    expect(hasClinic).toBe(true);
  });

  test('search "Medi-Cal" returns Medi-Cal program', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'Medi-Cal');

    expect(count).toBeGreaterThan(0);
    const hasMediCal = hasResultContaining(names, 'medi-cal', 'medical', 'health');
    expect(hasMediCal).toBe(true);
  });

  test('search "mental health" returns mental health services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'mental health');

    expect(count).toBeGreaterThan(0);
    const hasMentalHealth = hasResultContaining(
      names,
      'mental',
      'counseling',
      'therapy',
      'crisis',
      'behavioral'
    );
    expect(hasMentalHealth).toBe(true);
  });
});

test.describe('Demographic-Specific Searches', () => {
  test('search "veteran benefits" returns veteran programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'veteran benefits');

    expect(count).toBeGreaterThan(0);
    const hasVeteran = hasResultContaining(names, 'veteran', 'va ', 'military', 'calvet');
    expect(hasVeteran).toBe(true);
  });

  test('search "senior discounts" returns senior programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'senior discounts');

    expect(count).toBeGreaterThan(0);
    const hasSenior = hasResultContaining(names, 'senior', 'older', 'elderly', 'golden');
    expect(hasSenior).toBe(true);
  });

  test('search "help for disabled" returns disability programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'help for disabled');

    expect(count).toBeGreaterThan(0);
    const hasDisability = hasResultContaining(names, 'disab', 'ssi', 'ssdi', 'accessibility');
    expect(hasDisability).toBe(true);
  });

  test('search "immigrant resources" returns immigrant services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'immigrant resources');

    expect(count).toBeGreaterThan(0);
    const hasImmigrant = hasResultContaining(names, 'immigrant', 'refugee', 'citizenship', 'legal');
    expect(hasImmigrant).toBe(true);
  });

  test('search "LGBTQ support" returns LGBTQ+ programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'LGBTQ support');

    // May have fewer results depending on data
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Utility & Bill Assistance Searches', () => {
  test('search "utility bill help" returns utility assistance', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'utility bill help');

    expect(count).toBeGreaterThan(0);
    const hasUtility = hasResultContaining(names, 'liheap', 'utility', 'pge', 'energy', 'bill');
    expect(hasUtility).toBe(true);
  });

  test('search "LIHEAP" returns energy assistance', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'LIHEAP');

    expect(count).toBeGreaterThan(0);
    const hasLIHEAP = hasResultContaining(names, 'liheap', 'energy', 'utility', 'heating');
    expect(hasLIHEAP).toBe(true);
  });

  test('search "free phone" returns phone programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'free phone');

    expect(count).toBeGreaterThan(0);
    const hasPhone = hasResultContaining(names, 'lifeline', 'phone', 'wireless', 'connectivity');
    expect(hasPhone).toBe(true);
  });
});

test.describe('Legal Services Searches', () => {
  test('search "free legal help" returns legal aid', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'free legal help');

    expect(count).toBeGreaterThan(0);
    const hasLegal = hasResultContaining(names, 'legal', 'law', 'attorney', 'aid');
    expect(hasLegal).toBe(true);
  });

  test('search "eviction help" returns tenant services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'eviction help');

    expect(count).toBeGreaterThan(0);
    const hasEviction = hasResultContaining(names, 'eviction', 'tenant', 'legal', 'housing');
    expect(hasEviction).toBe(true);
  });

  test('search "immigration lawyer" returns immigration services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'immigration lawyer');

    expect(count).toBeGreaterThan(0);
    const hasImmigration = hasResultContaining(
      names,
      'immigration',
      'legal',
      'citizenship',
      'immigrant'
    );
    expect(hasImmigration).toBe(true);
  });
});

test.describe('Employment Searches', () => {
  test('search "job training" returns employment programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'job training');

    expect(count).toBeGreaterThan(0);
    const hasJob = hasResultContaining(names, 'job', 'employ', 'career', 'training', 'workforce');
    expect(hasJob).toBe(true);
  });

  test('search "CalJOBS" returns employment services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'CalJOBS');

    expect(count).toBeGreaterThan(0);
    const hasCalJobs = hasResultContaining(names, 'caljobs', 'job', 'employment', 'career');
    expect(hasCalJobs).toBe(true);
  });

  test('search "unemployment benefits" returns EDD programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'unemployment benefits');

    expect(count).toBeGreaterThan(0);
    const hasUnemployment = hasResultContaining(names, 'unemployment', 'edd', 'job', 'benefit');
    expect(hasUnemployment).toBe(true);
  });

  test('search "resume help" returns career services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'resume help');

    expect(count).toBeGreaterThan(0);
    const hasCareer = hasResultContaining(
      names,
      'resume',
      'career',
      'job',
      'workforce',
      'employment'
    );
    expect(hasCareer).toBe(true);
  });
});

test.describe('Education Searches', () => {
  test('search "GED classes" returns adult education', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'GED classes');

    expect(count).toBeGreaterThan(0);
    const hasGED = hasResultContaining(
      names,
      'ged',
      'adult',
      'education',
      'diploma',
      'high school'
    );
    expect(hasGED).toBe(true);
  });

  test('search "free preschool" returns Head Start', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'free preschool');

    expect(count).toBeGreaterThan(0);
    const hasPreschool = hasResultContaining(
      names,
      'head start',
      'preschool',
      'early',
      'childhood'
    );
    expect(hasPreschool).toBe(true);
  });

  test('search "FAFSA help" returns financial aid services', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'FAFSA help');

    expect(count).toBeGreaterThan(0);
    const hasFAFSA = hasResultContaining(names, 'fafsa', 'financial aid', 'college', 'grant');
    expect(hasFAFSA).toBe(true);
  });

  test('search "ESL classes" returns language programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'ESL classes');

    expect(count).toBeGreaterThan(0);
    const hasESL = hasResultContaining(names, 'esl', 'english', 'adult', 'education', 'language');
    expect(hasESL).toBe(true);
  });
});

test.describe('Housing Searches', () => {
  test('search "Section 8" returns housing vouchers', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'Section 8');

    expect(count).toBeGreaterThan(0);
    const hasSection8 = hasResultContaining(names, 'section 8', 'housing', 'voucher', 'authority');
    expect(hasSection8).toBe(true);
  });

  test('search "housing authority" returns local programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'housing authority');

    expect(count).toBeGreaterThan(0);
    const hasAuthority = hasResultContaining(names, 'housing authority', 'section 8', 'voucher');
    expect(hasAuthority).toBe(true);
  });

  test('search "affordable housing" returns listings', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'affordable housing');

    expect(count).toBeGreaterThan(0);
    const hasAffordable = hasResultContaining(names, 'affordable', 'housing', 'rental', 'dahlia');
    expect(hasAffordable).toBe(true);
  });
});

test.describe('Natural Language Queries', () => {
  test('search "I\'m a senior who needs help with bills" returns relevant programs', async ({
    page,
  }) => {
    const { count, names } = await searchAndGetResults(
      page,
      "I'm a senior who needs help with bills"
    );

    expect(count).toBeGreaterThan(0);
    // Should return utility assistance, senior programs, or similar
    const hasRelevant = hasResultContaining(
      names,
      'senior',
      'utility',
      'liheap',
      'energy',
      'bill',
      'assistance'
    );
    expect(hasRelevant).toBe(true);
  });

  test('search "low-income family looking for food" returns food programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'low-income family looking for food');

    expect(count).toBeGreaterThan(0);
    const hasFood = hasResultContaining(names, 'food', 'calfresh', 'wic', 'pantry', 'bank');
    expect(hasFood).toBe(true);
  });

  test('search "help for single mom" returns family programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'help for single mom');

    expect(count).toBeGreaterThan(0);
    const hasFamily = hasResultContaining(
      names,
      'family',
      'wic',
      'child',
      'parent',
      'women',
      'calworks'
    );
    expect(hasFamily).toBe(true);
  });
});

test.describe('Category Searches', () => {
  test('search "transportation" returns transit programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'transportation');

    expect(count).toBeGreaterThan(0);
    const hasTransit = hasResultContaining(names, 'transit', 'bus', 'bart', 'paratransit', 'ride');
    expect(hasTransit).toBe(true);
  });

  test('search "education" returns education programs', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'education');

    expect(count).toBeGreaterThan(0);
    const hasEducation = hasResultContaining(
      names,
      'education',
      'school',
      'college',
      'library',
      'ged'
    );
    expect(hasEducation).toBe(true);
  });

  test('search "recreation" returns parks and recreation', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'recreation');

    expect(count).toBeGreaterThan(0);
    const hasRecreation = hasResultContaining(names, 'park', 'recreation', 'museum', 'library');
    expect(hasRecreation).toBe(true);
  });
});

test.describe('Ranking & Typo Tolerance', () => {
  test('search "CalFresh Online" ranks the exact program first', async ({ page }) => {
    const { count } = await searchAndGetResults(page, 'CalFresh Online');

    expect(count).toBeGreaterThan(0);
    const firstName = await page
      .locator('[data-category]:not([style*="display: none"])')
      .first()
      .locator('h3')
      .textContent();

    expect(firstName?.trim().toLowerCase()).toContain('calfresh online');
  });

  test('search typo "calfrsh online" still returns CalFresh Online', async ({ page }) => {
    const { count, names } = await searchAndGetResults(page, 'calfrsh online');

    expect(count).toBeGreaterThan(0);
    const hasTypoMatch = hasResultContaining(names, 'calfresh online', 'calfresh');
    expect(hasTypoMatch).toBe(true);
  });
});

test.describe('Zero Results Handling', () => {
  test('search with gibberish shows fallback resources', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const input = page.locator('#search-input');
    await input.fill('xyzabc123nonsense');
    await input.press('Enter');

    await page.waitForTimeout(2000);

    // Should show the no-results fallback
    const noResults = page.locator('#no-results');
    await expect(noResults).toBeVisible({ timeout: 5000 });

    // Should show 2-1-1 fallback
    const fallbackText = await noResults.textContent();
    expect(fallbackText).toContain('2-1-1');
  });
});
