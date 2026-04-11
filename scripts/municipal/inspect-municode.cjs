const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Try Oakland noise search
  const url =
    'https://library.municode.com/ca/oakland/codes/code_of_ordinances?nodeId=search&searchText=noise';
  console.log('Loading:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

  // Wait for any content
  await page.waitForTimeout(5000);

  // Get the HTML of the body
  const html = await page.evaluate(() => document.body.innerHTML);

  // Save for inspection
  require('fs').writeFileSync('/tmp/municode-page.html', html);
  console.log('Saved HTML to /tmp/municode-page.html');

  // Look for any results
  const results = await page.evaluate(() => {
    const allElements = Array.from(document.body.querySelectorAll('*'));
    const elementsWithContent = allElements.filter(
      (el) =>
        el.textContent &&
        el.textContent.toLowerCase().includes('noise') &&
        el.tagName !== 'SCRIPT' &&
        el.tagName !== 'STYLE'
    );

    return {
      totalElements: allElements.length,
      matchingElements: elementsWithContent.length,
      sampleClasses: Array.from(
        new Set(elementsWithContent.slice(0, 20).map((el) => el.className))
      ).filter((c) => c),
      sampleTags: Array.from(new Set(elementsWithContent.slice(0, 20).map((el) => el.tagName))),
    };
  });

  console.log('Page analysis:', JSON.stringify(results, null, 2));

  // Look for specific patterns
  const searchResultPatterns = await page.evaluate(() => {
    const patterns = {
      searchResults: document.querySelectorAll('[class*="search-result"]').length,
      result: document.querySelectorAll('[class*="result"]').length,
      items: document.querySelectorAll('li').length,
      links: document.querySelectorAll('a').length,
      ngComponents: document.querySelectorAll('[_ngcontent]').length,
      matCards: document.querySelectorAll('mat-card').length,
    };
    return patterns;
  });

  console.log('Pattern counts:', JSON.stringify(searchResultPatterns, null, 2));

  await browser.close();
})();
