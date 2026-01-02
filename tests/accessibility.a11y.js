/**
 * Accessibility Tests using axe-core
 * Based on WCAG 2.1 AA standards
 * Powered by Microsoft Accessibility Insights engine
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to run axe and format violations
async function checkAccessibility(page, pageName) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Create detailed violation report
  const violations = results.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length,
    elements: v.nodes.slice(0, 3).map(n => n.html)
  }));

  if (violations.length > 0) {
    console.log(`\n${pageName} - Accessibility Violations:`);
    violations.forEach(v => {
      console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
      console.log(`    Affected elements: ${v.nodes}`);
      console.log(`    Help: ${v.helpUrl}`);
    });
  }

  return { violations, passes: results.passes.length };
}

test.describe('Accessibility - Home Page', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { violations } = await checkAccessibility(page, 'Home');

    // Fail on critical or serious violations
    const critical = violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical, `Found ${critical.length} critical/serious accessibility issues`).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);

    // Check headings don't skip levels (h1 -> h3 without h2)
    const headings = await page.evaluate(() => {
      const hs = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(hs).map(h => parseInt(h.tagName[1]));
    });

    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i] - headings[i-1];
      expect(diff, 'Heading levels should not skip more than one level').toBeLessThanOrEqual(1);
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check nav has aria-label
    const nav = page.locator('nav[aria-label]');
    await expect(nav.first()).toBeVisible();

    // Check skip link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
  });

  test('should have accessible search', async ({ page }) => {
    await page.goto('/');

    // Check search input has label
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();

    // Check label exists (sr-only is fine)
    const label = page.locator('label[for="search-input"]');
    await expect(label).toHaveCount(1);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ runOnly: ['color-contrast'] })
      .analyze();

    expect(results.violations, 'Color contrast violations found').toHaveLength(0);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .options({ runOnly: ['image-alt'] })
      .analyze();

    expect(results.violations, 'Images missing alt text').toHaveLength(0);
  });
});

test.describe('Accessibility - Program Cards', () => {
  test('program cards should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Find first program card link
    const firstCard = page.locator('[data-category]').first();
    await expect(firstCard).toBeVisible();

    // Check card contains focusable elements
    const focusable = firstCard.locator('a, button');
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);
  });

  test('category filter buttons should be accessible', async ({ page }) => {
    await page.goto('/');

    const filterButtons = page.locator('[data-filter]');
    const count = await filterButtons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = filterButtons.nth(i);
      // Should have aria-pressed for toggle state
      const pressed = await btn.getAttribute('aria-pressed');
      expect(pressed !== null, 'Filter buttons should have aria-pressed').toBe(true);
    }
  });
});

test.describe('Accessibility - Dark Mode', () => {
  test('dark mode should maintain accessibility', async ({ page }) => {
    await page.goto('/');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    const { violations } = await checkAccessibility(page, 'Home (Dark Mode)');

    const critical = violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical, 'Dark mode has accessibility issues').toHaveLength(0);
  });
});

test.describe('Accessibility - Smart Assistant', () => {
  test('assistant toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('#assistant-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Should be focusable
    await toggle.focus();
    await expect(toggle).toBeFocused();
  });

  test('assistant panel should have proper ARIA', async ({ page }) => {
    await page.goto('/');

    // Open assistant
    await page.click('#assistant-toggle');

    const panel = page.locator('#assistant-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-labelledby');
  });
});

test.describe('Accessibility - About Page', () => {
  test('about page should have no critical violations', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const { violations } = await checkAccessibility(page, 'About');

    const critical = violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Eligibility Page', () => {
  test('eligibility page should have no critical violations', async ({ page }) => {
    await page.goto('/eligibility');
    await page.waitForLoadState('networkidle');

    const { violations } = await checkAccessibility(page, 'Eligibility');

    const critical = violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });
});
