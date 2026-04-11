const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Try Oakland noise search - go directly to search tab
  const url =
    'https://library.municode.com/ca/oakland/codes/code_of_ordinances?nodeId=search&searchText=noise';
  console.log('Loading:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

  // Wait for content to load
  await page.waitForTimeout(8000);

  // Try clicking a search button if there is one
  const searchBtn = await page.$(
    'button[aria-label*="Search"], button.search-button, #headerSearch + button'
  );
  if (searchBtn) {
    console.log('Found search button, clicking...');
    await searchBtn.click();
    await page.waitForTimeout(3000);
  }

  // Look for the actual content area
  const content = await page.evaluate(() => {
    // Find the main content area
    const mainContent =
      document.querySelector('[ui-view="main"]') ||
      document.querySelector('main') ||
      document.querySelector('.main-content');
    if (mainContent) {
      return {
        mainContentHTML: mainContent.innerHTML.substring(0, 5000),
        mainContentText: mainContent.textContent?.substring(0, 2000),
      };
    }

    // Find all links that might be results
    const links = Array.from(
      document.querySelectorAll('a[href*="COORDINGS"], a[href*="nodeId="], a[href*="TIT"]')
    );
    return {
      links: links.map((a) => ({ text: a.textContent?.trim(), href: a.href })).slice(0, 10),
    };
  });

  console.log('Content:', JSON.stringify(content, null, 2));

  // Check if there's a table of contents
  const toc = await page.evaluate(() => {
    const tocItems = document.querySelectorAll(
      '.toc-item, [class*="toc"] a, .menubar a[href*="nodeId"], .codetitle a, article a'
    );
    return Array.from(tocItems)
      .slice(0, 20)
      .map((a) => ({
        text: a.textContent?.trim().substring(0, 100),
        href: a.href,
      }));
  });

  console.log('\nTOC items:', JSON.stringify(toc, null, 2));

  await browser.close();
})();
