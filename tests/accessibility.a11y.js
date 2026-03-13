/**
 * Accessibility Tests using axe-core
 * Based on WCAG 2.2 AA standards
 * Powered by Microsoft Accessibility Insights engine
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to run axe and format violations
async function checkAccessibility(page, pageName) {
  const results = await new AxeBuilder({ page })
    // WCAG 2.2 AA — industry-standard compliance target (AAA is aspirational)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // Explicitly exclude AAA-only rule — axe-core 4.11 surfaces it despite AA-only tag filter
    .disableRules(['color-contrast-enhanced'])
    .analyze();

  // Create detailed violation report
  const violations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.length,
    elements: v.nodes.slice(0, 3).map((n) => n.html),
  }));

  if (violations.length > 0) {
    console.log(`\n${pageName} - Accessibility Violations:`);
    violations.forEach((v) => {
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
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Home');

    // Fail on critical or serious violations
    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical, `Found ${critical.length} critical/serious accessibility issues`).toHaveLength(
      0
    );
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);

    // Check visible headings don't skip levels (h1 -> h3 without h2)
    // Only check headings that are visible (not in hidden sections like search results)
    const headings = await page.evaluate(() => {
      const hs = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(hs)
        .filter((h) => {
          // Check if heading is visible (not inside a hidden parent)
          let parent = h.closest('.hidden');
          return !parent;
        })
        .map((h) => parseInt(h.tagName[1]));
    });

    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i] - headings[i - 1];
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

    const results = await new AxeBuilder({ page }).options({ runOnly: ['image-alt'] }).analyze();

    expect(results.violations, 'Images missing alt text').toHaveLength(0);
  });
});

test.describe('Accessibility - Directory Page', () => {
  test('program cards should be keyboard accessible', async ({ page }) => {
    await page.goto('/directory');

    // Find first program card link
    const firstCard = page.locator('[data-category]').first();
    await expect(firstCard).toBeVisible();

    // Check card contains focusable elements
    const focusable = firstCard.locator('a, button');
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);
  });

  test('smart search toggle should be keyboard accessible', async ({ page }) => {
    await page.goto('/directory');

    const toggle = page.locator('#ai-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label');
    await expect(toggle).toHaveAttribute('role', 'switch');

    // Should be focusable
    await toggle.focus();
    await expect(toggle).toBeFocused();
  });

  test('directory page should have no critical violations', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Directory');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
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

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical, 'Dark mode has accessibility issues').toHaveLength(0);
  });
});

test.describe('Accessibility - About Page', () => {
  test('about page should have no critical violations', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'About');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Eligibility Page', () => {
  test('eligibility page should have no critical violations', async ({ page }) => {
    await page.goto('/eligibility');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Eligibility');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Partnerships Page', () => {
  test('partnerships page should have no critical violations', async ({ page }) => {
    await page.goto('/partnerships');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Partnerships');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Glossary Page', () => {
  test('glossary page should have no critical violations', async ({ page }) => {
    await page.goto('/glossary');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Glossary');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });

  test('abbreviations should have title attributes', async ({ page }) => {
    await page.goto('/glossary');
    await page.waitForLoadState('domcontentloaded');

    // Check that abbr elements have title attributes
    const abbrs = page.locator('abbr[title]');
    const count = await abbrs.count();

    // Should have many abbreviation definitions
    expect(count).toBeGreaterThan(50);
  });
});

test.describe('Accessibility - Sustainability Page', () => {
  test('sustainability page should have no critical violations', async ({ page }) => {
    await page.goto('/sustainability');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Sustainability');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Accessibility Statement Page', () => {
  test('accessibility page should have no critical violations', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Accessibility Statement');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Download Page', () => {
  test('download page should have no critical violations', async ({ page }) => {
    await page.goto('/download');
    await page.waitForLoadState('domcontentloaded');

    const { violations } = await checkAccessibility(page, 'Download');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Legal Pages', () => {
  test('privacy page should have no critical violations', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('domcontentloaded');
    // Wait for main content to be visible before running accessibility checks
    await page
      .locator('main, #main-content, h1')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    const { violations } = await checkAccessibility(page, 'Privacy');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });

  test('terms page should have no critical violations', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('domcontentloaded');
    // Wait for main content to be visible before running accessibility checks
    await page
      .locator('main, #main-content, h1')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    const { violations } = await checkAccessibility(page, 'Terms');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });

  test('credits page should have no critical violations', async ({ page }) => {
    await page.goto('/credits');
    await page.waitForLoadState('domcontentloaded');
    // Wait for main content to be visible before running accessibility checks
    await page
      .locator('main, #main-content, h1')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    const { violations } = await checkAccessibility(page, 'Credits');

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('focus should be visible on interactive elements', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForLoadState('domcontentloaded');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Check that focused element is visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Focus indicator should have visible outline or box-shadow
    const styles = await focused.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        outlineOffset: computed.outlineOffset,
        boxShadow: computed.boxShadow,
      };
    });

    // Should have outline or box-shadow
    const hasIndicator =
      (styles.outline && styles.outline !== 'none' && !styles.outline.includes('0px')) ||
      (styles.boxShadow && styles.boxShadow !== 'none');

    expect(hasIndicator).toBe(true);
  });

  test('skip link should work correctly', async ({ page }) => {
    await page.goto('/');

    // Tab to skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator(':focus');
    const href = await skipLink.getAttribute('href');
    expect(href).toBe('#main-content');

    // Activate skip link
    await page.keyboard.press('Enter');

    // Main content should be focused or scroll to it
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeInViewport();
  });
});
