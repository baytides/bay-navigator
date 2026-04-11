#!/usr/bin/env node
/**
 * Scrape city council data from Granicus OpenCities websites
 * Granicus is used by ~12 Bay Area cities
 *
 * Usage: node scripts/scrape-granicus-councils.cjs
 *
 * Granicus OpenCities patterns:
 * - Council page: /city-council, /government/city-council, /elected-officials
 * - Uses structured data with JSON-LD
 * - Staff profiles often at /staff/{name} or embedded in page
 * - Photos typically in /sites/default/files/
 *
 * Photos are downloaded to: public/images/officials/{city-slug}/{name-slug}.jpg
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Directory for storing official photos (matches Flutter asset structure)
const PHOTOS_DIR = path.join(
  __dirname,
  '..',
  'apps',
  'assets',
  'images',
  'representatives',
  'local'
);
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'data-exports', 'city-councils');

// Bay Area cities using Granicus OpenCities
const GRANICUS_CITIES = [
  // Alameda County
  { name: 'Alameda', url: 'https://www.alamedaca.gov', county: 'Alameda' },
  { name: 'Albany', url: 'https://www.albanyca.org', county: 'Alameda' },
  { name: 'Fremont', url: 'https://www.fremont.gov', county: 'Alameda' },
  { name: 'Livermore', url: 'https://www.livermoreca.gov', county: 'Alameda' },
  { name: 'Newark', url: 'https://www.newark.org', county: 'Alameda' },

  // Santa Clara County
  { name: 'Sunnyvale', url: 'https://www.sunnyvale.ca.gov', county: 'Santa Clara' },
  { name: 'Mountain View', url: 'https://www.mountainview.gov', county: 'Santa Clara' },
  { name: 'Palo Alto', url: 'https://www.cityofpaloalto.org', county: 'Santa Clara' },
  { name: 'Santa Clara', url: 'https://www.santaclaraca.gov', county: 'Santa Clara' },
  { name: 'Cupertino', url: 'https://www.cupertino.org', county: 'Santa Clara' },

  // Contra Costa County
  { name: 'Brentwood', url: 'https://www.brentwoodca.gov', county: 'Contra Costa' },

  // Solano County
  { name: 'Fairfield', url: 'https://www.fairfield.ca.gov', county: 'Solano' },
];

const COUNCIL_PATHS = [
  '/city-council',
  '/government/city-council',
  '/our-city/city-council',
  '/city-hall/city-council',
  '/elected-officials',
  '/your-government/city-council',
  '/government/mayor-city-council',
  '/our-city/mayor-and-city-council',
];

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function downloadPhoto(imageUrl, countySlug, citySlug, nameSlug) {
  return new Promise((resolve) => {
    const cityDir = path.join(PHOTOS_DIR, countySlug, citySlug);
    fs.mkdirSync(cityDir, { recursive: true });

    const localPath = path.join(cityDir, `${nameSlug}.jpg`);
    const relativePath = `assets/images/representatives/local/${countySlug}/${citySlug}/${nameSlug}.jpg`;

    if (fs.existsSync(localPath)) {
      resolve(relativePath);
      return;
    }

    const protocol = imageUrl.startsWith('https') ? https : http;
    const options = {
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
      timeout: 15000,
    };

    const req = protocol.get(imageUrl, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(imageUrl);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        resolve(downloadPhoto(redirectUrl, countySlug, citySlug, nameSlug));
        return;
      }

      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length > 1024) {
          fs.writeFileSync(localPath, buffer);
          resolve(relativePath);
        } else {
          resolve(null);
        }
      });
      res.on('error', () => resolve(null));
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function fetchPage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    };

    const req = protocol.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        resolve(fetchPage(redirectUrl, maxRedirects - 1));
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function extractJsonLd(html) {
  const scripts =
    html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  const jsonLdData = [];

  for (const script of scripts) {
    const content = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try {
      const data = JSON.parse(content);
      jsonLdData.push(data);
    } catch (e) {
      // Ignore parse errors
    }
  }

  return jsonLdData;
}

function parseGranicusCouncilPage(html, baseUrl) {
  const officials = [];

  // Try to find JSON-LD data first
  const jsonLd = extractJsonLd(html);
  for (const data of jsonLd) {
    if (
      data['@type'] === 'Person' ||
      (Array.isArray(data) && data.some((d) => d['@type'] === 'Person'))
    ) {
      const people = Array.isArray(data) ? data.filter((d) => d['@type'] === 'Person') : [data];
      for (const person of people) {
        if (person.name && person.jobTitle) {
          officials.push({
            name: person.name,
            title: person.jobTitle,
            email: person.email || null,
            phone: person.telephone || null,
            photoUrl: person.image || null,
            website: person.url || null,
          });
        }
      }
    }
  }

  if (officials.length > 0) {
    return officials;
  }

  // Fallback: Parse HTML for common Granicus patterns
  // Look for council member cards/sections

  // Pattern 1: .views-row with council member info
  const viewsRows =
    html.match(/<div[^>]*class="[^"]*views-row[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];

  // Pattern 2: .council-member or .elected-official divs
  const councilDivs =
    html.match(
      /<div[^>]*class="[^"]*(?:council-member|elected-official|staff-member)[^"]*"[^>]*>[\s\S]*?<\/div>/gi
    ) || [];

  // Pattern 3: Article cards
  const articleCards = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi) || [];

  const allSections = [...viewsRows, ...councilDivs, ...articleCards];

  for (const section of allSections) {
    // Try to extract name
    const nameMatch =
      section.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i) ||
      section.match(/class="[^"]*(?:name|title)[^"]*"[^>]*>([^<]+)</i);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim();

    // Skip if not a person name
    if (!/^[A-Z][a-z]+ [A-Z]/.test(name)) continue;

    // Try to extract title
    const titleMatch = section.match(/(?:Mayor|Vice Mayor|Council\s*Member|Supervisor|President)/i);
    const title = titleMatch ? titleMatch[0] : 'Council Member';

    // Try to extract email
    const emailMatch =
      section.match(/href="mailto:([^"]+)"/i) ||
      section.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : null;

    // Try to extract photo
    const photoMatch = section.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    let photoUrl = null;
    if (photoMatch) {
      photoUrl = photoMatch[1];
      if (photoUrl.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        photoUrl = `${urlObj.protocol}//${urlObj.host}${photoUrl}`;
      }
    }

    // Try to extract phone
    const phoneMatch = section.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : null;

    officials.push({
      name,
      title,
      email,
      phone,
      photoUrl,
    });
  }

  // Dedupe by name
  const seen = new Set();
  return officials.filter((o) => {
    if (seen.has(o.name)) return false;
    seen.add(o.name);
    return true;
  });
}

async function scrapeCity(city) {
  console.log(`\n[${city.name}] Scraping ${city.url}...`);

  const result = {
    city: city.name,
    county: city.county,
    url: city.url,
    officials: [],
    error: null,
    scrapedAt: new Date().toISOString(),
  };

  // Try to find council page
  let councilPageHtml = null;
  let councilPageUrl = null;

  for (const pagePath of COUNCIL_PATHS) {
    try {
      const url = `${city.url}${pagePath}`;
      councilPageHtml = await fetchPage(url);
      councilPageUrl = url;
      console.log(`  Found council page at ${pagePath}`);
      break;
    } catch (e) {
      // Try next path
    }
  }

  // Also try to find from main page links
  if (!councilPageHtml) {
    try {
      const mainPage = await fetchPage(city.url);
      const councilLink = mainPage.match(/href="([^"]*(?:council|elected|mayor)[^"]*)"/i);
      if (councilLink) {
        let linkUrl = councilLink[1];
        if (linkUrl.startsWith('/')) {
          linkUrl = `${city.url}${linkUrl}`;
        }
        councilPageHtml = await fetchPage(linkUrl);
        councilPageUrl = linkUrl;
        console.log(`  Found council page via main page link`);
      }
    } catch (e) {
      // Continue without council page
    }
  }

  if (!councilPageHtml) {
    result.error = 'Could not find council page';
    console.log(`  Could not find council page`);
    return result;
  }

  // Parse council page
  const officials = parseGranicusCouncilPage(councilPageHtml, city.url);
  console.log(`  Found ${officials.length} officials from page`);

  // Download photos and filter to council members
  for (const official of officials) {
    const titleLower = (official.title || '').toLowerCase();
    if (
      titleLower.includes('mayor') ||
      titleLower.includes('council') ||
      titleLower.includes('supervisor') ||
      titleLower.includes('president')
    ) {
      if (official.photoUrl) {
        const countySlug = slugify(city.county);
        const citySlug = slugify(city.name);
        const nameSlug = slugify(official.name).replace(/-+/g, '_');
        const localPhotoPath = await downloadPhoto(
          official.photoUrl,
          countySlug,
          citySlug,
          nameSlug
        );
        if (localPhotoPath) {
          official.localPhotoPath = localPhotoPath;
          console.log(`    Downloaded photo for ${official.name}`);
        }
      }

      official.sourceUrl = councilPageUrl;
      result.officials.push(official);
      console.log(`    Found: ${official.name} - ${official.title || 'N/A'}`);
    }
  }

  console.log(`  Total officials found: ${result.officials.length}`);
  return result;
}

async function main() {
  console.log('Granicus OpenCities City Council Scraper');
  console.log('========================================');
  console.log(`Scraping ${GRANICUS_CITIES.length} cities...`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = {};

  for (const city of GRANICUS_CITIES) {
    results[city.name] = await scrapeCity(city);
    await new Promise((r) => setTimeout(r, 1000)); // Rate limit
  }

  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'granicus-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Summary
  console.log('\n========================================');
  console.log(`Saved results to ${outputPath}`);

  let totalCities = 0;
  let totalOfficials = 0;
  const byCounty = {};

  for (const [name, data] of Object.entries(results)) {
    if (data.officials && data.officials.length > 0) {
      totalCities++;
      totalOfficials += data.officials.length;

      if (!byCounty[data.county]) {
        byCounty[data.county] = { cities: 0, officials: 0 };
      }
      byCounty[data.county].cities++;
      byCounty[data.county].officials += data.officials.length;
    }
  }

  console.log(`Total cities: ${GRANICUS_CITIES.length}`);
  console.log(`Cities with data: ${totalCities}`);
  console.log(`Total officials: ${totalOfficials}`);
  console.log('\nBy County:');
  for (const [county, stats] of Object.entries(byCounty)) {
    console.log(`  ${county}: ${stats.cities} cities, ${stats.officials} officials`);
  }
}

main().catch(console.error);
