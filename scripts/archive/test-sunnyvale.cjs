const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Try with domcontentloaded instead of networkidle
  await page.goto('https://qcode.us/codes/sunnyvale/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .slice(0, 30)
      .map((a) => ({
        text: a.textContent?.trim().substring(0, 80),
        href: a.href,
      }));
  });

  console.log('Links on page (' + links.length + '):');
  links.forEach((l) => console.log('  ' + l.text));

  await browser.close();
})();
