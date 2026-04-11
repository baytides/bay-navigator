const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Go directly to Oakland's Code of Ordinances main page
  const url = 'https://library.municode.com/ca/oakland/codes/code_of_ordinances';
  console.log('Loading:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Get the table of contents
  const toc = await page.evaluate(() => {
    const results = [];

    // Find all TOC links
    document.querySelectorAll('a[href*="nodeId"], a[href*="/codes/"]').forEach((a) => {
      const text = a.textContent?.trim();
      const href = a.href;
      if (
        text &&
        text.length > 3 &&
        href.includes('oakland') &&
        !results.find((r) => r.text === text)
      ) {
        results.push({ text: text.substring(0, 150), href });
      }
    });

    return results.slice(0, 30);
  });

  console.log('Table of Contents:', JSON.stringify(toc, null, 2));

  // Look for title-level links (main chapters)
  const titles = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('[class*="chunk"] a, .code-chunk a, .toc a').forEach((a) => {
      const text = a.textContent?.trim();
      const href = a.href;
      if (text && href && !results.find((r) => r.text === text)) {
        results.push({ text: text.substring(0, 150), href });
      }
    });
    return results.slice(0, 30);
  });

  console.log('\nTitle links:', JSON.stringify(titles, null, 2));

  // Get the page title and any visible content
  const pageInfo = await page.evaluate(() => ({
    title: document.title,
    h1: Array.from(document.querySelectorAll('h1, h2, h3'))
      .slice(0, 5)
      .map((h) => h.textContent?.trim()),
    bodyText: document.body.textContent?.substring(0, 1000),
  }));

  console.log('\nPage info:', JSON.stringify(pageInfo, null, 2));

  await browser.close();
})();
