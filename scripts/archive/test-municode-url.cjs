const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // Test Oakland with full URL
  const fullUrl = 'https://library.municode.com/ca/oakland/codes/code_of_ordinances';
  console.log('Testing full URL:', fullUrl);

  await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const toc = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a[href*="nodeId"]').forEach((a) => {
      const text = a.textContent?.trim().replace(/\s+/g, ' ');
      if (text && text.length > 3) {
        results.push(text.substring(0, 80));
      }
    });
    return results;
  });

  console.log('Found', toc.length, 'TOC entries:');
  toc.slice(0, 10).forEach((t) => console.log(' -', t));

  await browser.close();
})();
