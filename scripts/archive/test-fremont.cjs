const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const url = 'https://library.municode.com/ca/fremont/codes/code_of_ordinances';
  console.log('Loading:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait more for Angular to render
  console.log('Waiting for Angular to render...');
  await page.waitForTimeout(8000);

  // Check page title
  const title = await page.title();
  console.log('Page title:', title);

  // Check for any links
  const linkCount = await page.evaluate(() => document.querySelectorAll('a').length);
  console.log('Total links on page:', linkCount);

  // Get TOC entries
  const toc = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a').forEach((a) => {
      const text = a.textContent?.trim();
      const href = a.href;
      if (text && href.includes('fremont') && text.length > 5) {
        results.push({ text: text.substring(0, 80), href: href.substring(0, 100) });
      }
    });
    return results;
  });

  console.log('\nTOC entries:', toc.length);
  toc.slice(0, 15).forEach((t) => console.log(' -', t.text));

  // Check for any nodeId links
  const nodeIdLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="nodeId"]'))
      .map((a) => a.textContent?.trim())
      .slice(0, 10)
  );
  console.log('\nnodeId links:', nodeIdLinks);

  await browser.close();
})();
