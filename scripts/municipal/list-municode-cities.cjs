const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  console.log('Loading Municode California page...');
  await page.goto('https://library.municode.com/ca', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Get all city/county links
  const cities = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a').forEach((a) => {
      const href = a.href;
      const text = a.textContent?.trim();
      // Extract city/county slug from URL like /ca/oakland or /ca/alameda_county
      const match = href.match(/library\.municode\.com\/ca\/([a-z_]+)$/i);
      if (match && text && text.length > 2 && text.length < 60) {
        results.push({ name: text, slug: match[1] });
      }
    });
    // Remove duplicates
    return [...new Map(results.map((r) => [r.slug, r])).values()];
  });

  console.log(`\nFound ${cities.length} cities/counties on Municode CA:\n`);
  cities.forEach((c) => console.log(`${c.name} -> ${c.slug}`));

  // Output as JSON for processing
  const fs = require('fs');
  fs.writeFileSync('/tmp/municode-ca-cities.json', JSON.stringify(cities, null, 2));
  console.log('\nSaved to /tmp/municode-ca-cities.json');

  await browser.close();
})();
