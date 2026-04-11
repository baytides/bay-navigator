#!/usr/bin/env node
/**
 * Scrape city council data from CivicPlus websites
 * CivicPlus is the most common CMS for Bay Area city websites (~40 cities)
 *
 * Usage: node scripts/scrape-civicplus-councils.cjs
 *
 * CivicPlus patterns:
 * - Staff directory: /directory.aspx
 * - Individual profile: /directory.aspx?EID={id}
 * - Department listing: /directory.aspx?DID={id}
 * - CSS classes: .BioName, .BioText, .BioLink, .DirectoryNormalText
 * - Images: /ImageRepository/Document?documentID={id}
 *
 * Photos are downloaded to: apps/assets/images/representatives/local/{county}/{city}/{name}.jpg
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

// Bay Area cities using CivicPlus
const CIVICPLUS_CITIES = [
  // Alameda County
  { name: 'Dublin', url: 'https://dublin.ca.gov', county: 'Alameda' },
  { name: 'Piedmont', url: 'https://piedmont.ca.gov', county: 'Alameda' },
  { name: 'San Leandro', url: 'https://www.sanleandro.org', county: 'Alameda' },
  { name: 'Union City', url: 'https://www.unioncityca.gov', county: 'Alameda' },

  // Contra Costa County
  { name: 'Antioch', url: 'https://www.antiochca.gov', county: 'Contra Costa' },
  { name: 'Brentwood', url: 'https://www.brentwoodca.gov', county: 'Contra Costa' },
  { name: 'Clayton', url: 'https://claytonca.gov', county: 'Contra Costa' },
  { name: 'Concord', url: 'https://cityofconcord.org', county: 'Contra Costa' },
  { name: 'Danville', url: 'https://www.danville.ca.gov', county: 'Contra Costa' },
  { name: 'El Cerrito', url: 'https://www.el-cerrito.org', county: 'Contra Costa' },
  { name: 'Hercules', url: 'https://www.ci.hercules.ca.us', county: 'Contra Costa' },
  { name: 'Martinez', url: 'https://www.cityofmartinez.org', county: 'Contra Costa' },
  { name: 'Moraga', url: 'https://www.moraga.ca.us', county: 'Contra Costa' },
  { name: 'Oakley', url: 'https://www.ci.oakley.ca.us', county: 'Contra Costa' },
  { name: 'Orinda', url: 'https://cityoforinda.org', county: 'Contra Costa' },
  { name: 'Pinole', url: 'https://www.ci.pinole.ca.us', county: 'Contra Costa' },
  { name: 'Pittsburg', url: 'https://www.pittsburgca.gov', county: 'Contra Costa' },
  { name: 'Pleasant Hill', url: 'https://www.pleasanthillca.org', county: 'Contra Costa' },
  { name: 'Richmond', url: 'https://www.ci.richmond.ca.us', county: 'Contra Costa' },
  { name: 'San Pablo', url: 'https://www.sanpabloca.gov', county: 'Contra Costa' },
  { name: 'San Ramon', url: 'https://www.sanramon.ca.gov', county: 'Contra Costa' },
  { name: 'Walnut Creek', url: 'https://www.walnutcreekca.gov', county: 'Contra Costa' },

  // Marin County
  { name: 'Larkspur', url: 'https://www.cityoflarkspur.org', county: 'Marin' },
  { name: 'Mill Valley', url: 'https://www.cityofmillvalley.gov', county: 'Marin' },
  { name: 'Novato', url: 'https://www.novato.org', county: 'Marin' },
  { name: 'San Anselmo', url: 'https://www.sananselmo.gov', county: 'Marin' },
  { name: 'Sausalito', url: 'https://www.sausalito.gov', county: 'Marin' },
  { name: 'Tiburon', url: 'https://www.townoftiburon.org', county: 'Marin' },

  // Napa County
  { name: 'American Canyon', url: 'https://www.americancanyon.gov', county: 'Napa' },
  { name: 'Calistoga', url: 'https://ci.calistoga.ca.us', county: 'Napa' },
  { name: 'Napa', url: 'https://www.cityofnapa.org', county: 'Napa' },
  { name: 'St. Helena', url: 'https://www.cityofsthelena.org', county: 'Napa' },
  { name: 'Yountville', url: 'https://www.townofyountville.com', county: 'Napa' },

  // Santa Clara County
  { name: 'Campbell', url: 'https://www.campbellca.gov', county: 'Santa Clara' },
  { name: 'Gilroy', url: 'https://www.cityofgilroy.org', county: 'Santa Clara' },
  { name: 'Los Altos', url: 'https://www.losaltosca.gov', county: 'Santa Clara' },
  { name: 'Los Gatos', url: 'https://www.losgatosca.gov', county: 'Santa Clara' },
  { name: 'Morgan Hill', url: 'https://www.morgan-hill.ca.gov', county: 'Santa Clara' },
  { name: 'Saratoga', url: 'https://www.saratoga.ca.us', county: 'Santa Clara' },

  // Solano County
  { name: 'Vallejo', url: 'https://www.cityofvallejo.net', county: 'Solano' },

  // Sonoma County
  { name: 'Cloverdale', url: 'https://www.cloverdale.net', county: 'Sonoma' },
  { name: 'Healdsburg', url: 'https://healdsburg.gov', county: 'Sonoma' },
  { name: 'Rohnert Park', url: 'https://www.rpcity.org', county: 'Sonoma' },
  { name: 'Santa Rosa', url: 'https://srcity.org', county: 'Sonoma' },
  { name: 'Windsor', url: 'https://www.townofwindsor.com', county: 'Sonoma' },
];

// Common council/elected officials page patterns
const COUNCIL_PAGE_PATTERNS = [
  '/government/city-council',
  '/city-council',
  '/our-city/city-council',
  '/our_city/city_council',
  '/government/mayor-city-council',
  '/government/elected-officials',
  '/elected-officials',
  '/town-council',
  '/board-of-directors',
  '/your-government/city-council',
  '/city-government/city-council',
  '/cms/one.aspx?pageId=',
];

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Convert a string to a URL-friendly slug
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Download an image and save it locally
 * Returns the local path if successful, null otherwise
 * Path structure: {county}/{city}/{name}.jpg
 */
function downloadPhoto(imageUrl, countySlug, citySlug, nameSlug) {
  return new Promise((resolve) => {
    const cityDir = path.join(PHOTOS_DIR, countySlug, citySlug);
    fs.mkdirSync(cityDir, { recursive: true });

    const localPath = path.join(cityDir, `${nameSlug}.jpg`);
    const relativePath = `assets/images/representatives/local/${countySlug}/${citySlug}/${nameSlug}.jpg`;

    // Skip if already downloaded
    if (fs.existsSync(localPath)) {
      resolve(relativePath);
      return;
    }

    const protocol = imageUrl.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/*',
      },
      timeout: 15000,
    };

    const req = protocol.get(imageUrl, options, (res) => {
      // Handle redirects
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
        // Only save if it's a valid image (at least 1KB)
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

/**
 * Make an HTTP/HTTPS request with proper headers
 */
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
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Connection: 'keep-alive',
      },
      timeout: 30000,
    };

    const req = protocol.get(url, options, (res) => {
      // Handle redirects
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

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Extract text content from HTML, removing tags
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract email from obfuscated JavaScript or mailto links
 */
function extractEmail(html) {
  // Look for mailto links
  const mailtoMatch = html.match(/href=["']mailto:([^"'?]+)/i);
  if (mailtoMatch) {
    return mailtoMatch[1];
  }

  // Look for JavaScript email obfuscation patterns
  // Pattern: var wsd = "user"; var xsd = "domain.gov";
  const jsEmailMatch = html.match(
    /var\s+\w+\s*=\s*["']([^"']+)["'];\s*var\s+\w+\s*=\s*["']([^"']+)["']/
  );
  if (jsEmailMatch) {
    return `${jsEmailMatch[1]}@${jsEmailMatch[2]}`;
  }

  // Look for plain email addresses (but not generic ones)
  const plainEmailMatch = html.match(
    /\b([a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.(?:gov|org|us))\b/
  );
  if (plainEmailMatch) {
    return plainEmailMatch[1];
  }

  return null;
}

/**
 * Extract phone number
 */
function extractPhone(html) {
  // Look for phone patterns
  const phoneMatch = html.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    // Format consistently
    const digits = phoneMatch[0].replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  }
  return null;
}

/**
 * Parse a CivicPlus directory profile page
 */
function parseProfilePage(html, baseUrl) {
  const official = {
    name: null,
    title: null,
    email: null,
    phone: null,
    photoUrl: null,
    bio: null,
    department: null,
  };

  // Extract name from BioName class or h1
  const nameMatch =
    html.match(/<h1[^>]*class=['"][^'"]*BioName[^'"]*['"][^>]*>([^<]+)<\/h1>/i) ||
    html.match(/<[^>]*class=['"][^'"]*BioName[^'"]*['"][^>]*>([^<]+)<\//i) ||
    html.match(/<title>[^•<]*•\s*([^<•]+)/i);
  if (nameMatch) {
    official.name = stripHtml(nameMatch[1]).trim();
  }

  // Extract title - look for "Title: X" pattern
  const titleMatch = html.match(/Title:\s*([^<\n]+)/i);
  if (titleMatch) {
    official.title = stripHtml(titleMatch[1]).trim();
  }

  // Extract department from BioLink
  const deptMatch = html.match(
    /<a[^>]*class=['"][^'"]*BioLink[^'"]*['"][^>]*href=['"][^'"]*DID=\d+['"][^>]*>([^<]+)<\/a>/i
  );
  if (deptMatch) {
    official.department = stripHtml(deptMatch[1]).trim();
  }

  // Extract photo URL
  const photoMatch = html.match(/<img[^>]*src=['"]([^'"]*ImageRepository[^'"]+)['"][^>]*/i);
  if (photoMatch) {
    let photoUrl = photoMatch[1];
    if (photoUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      photoUrl = `${urlObj.protocol}//${urlObj.host}${photoUrl}`;
    }
    official.photoUrl = photoUrl;
  }

  // Extract email
  official.email = extractEmail(html);

  // Extract phone
  official.phone = extractPhone(html);

  // Extract bio from BioText
  const bioMatch = html.match(
    /<div[^>]*class=['"][^'"]*BioText[^'"]*['"][^>]*>([\s\S]*?)<\/div>\s*(?:<br|<\/)/i
  );
  if (bioMatch) {
    official.bio = stripHtml(bioMatch[1]).substring(0, 500);
  }

  return official;
}

/**
 * Find directory entry IDs from a council page
 */
function findDirectoryIds(html) {
  const ids = new Set();

  // Look for directory.aspx?EID= links
  const eidMatches = html.matchAll(/directory\.aspx\?EID=(\d+)/gi);
  for (const match of eidMatches) {
    ids.add(match[1]);
  }

  // Look for Directory.aspx?EID= (capital D)
  const eidMatches2 = html.matchAll(/Directory\.aspx\?EID=(\d+)/gi);
  for (const match of eidMatches2) {
    ids.add(match[1]);
  }

  return Array.from(ids);
}

/**
 * Find links to council member pages
 */
function findCouncilLinks(html, baseUrl) {
  const links = [];

  // Pattern: links containing council member keywords
  const linkPattern =
    /<a[^>]*href=['"]([^'"]+)['"][^>]*>([^<]*(?:mayor|council|supervisor|vice)[^<]*)<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    let href = match[1];
    const text = stripHtml(match[2]);

    if (text.length < 3 || text.length > 100) continue;
    if (href.includes('javascript:')) continue;

    if (href.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      href = `${urlObj.protocol}//${urlObj.host}${href}`;
    } else if (!href.startsWith('http')) {
      href = `${baseUrl}/${href}`;
    }

    links.push({ url: href, text });
  }

  return links;
}

/**
 * Scrape a single CivicPlus city
 */
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

  try {
    // Try to find the council page
    let councilPageHtml = null;
    let councilPageUrl = null;

    for (const pattern of COUNCIL_PAGE_PATTERNS) {
      try {
        const testUrl = `${city.url}${pattern}`;
        councilPageHtml = await fetchPage(testUrl);
        councilPageUrl = testUrl;
        console.log(`  Found council page at ${pattern}`);
        break;
      } catch (e) {
        // Try next pattern
      }
    }

    if (!councilPageHtml) {
      // Try the main page and look for council link
      try {
        const mainPage = await fetchPage(city.url);
        const councilLinkMatch = mainPage.match(
          /href=['"]([^'"]*(?:city-council|town-council|council|elected)[^'"]*)['"]/i
        );
        if (councilLinkMatch) {
          let councilUrl = councilLinkMatch[1];
          if (councilUrl.startsWith('/')) {
            councilUrl = `${city.url}${councilUrl}`;
          } else if (!councilUrl.startsWith('http')) {
            councilUrl = `${city.url}/${councilUrl}`;
          }
          councilPageHtml = await fetchPage(councilUrl);
          councilPageUrl = councilUrl;
          console.log(`  Found council page via main page link`);
        }
      } catch (e) {
        console.log(`  Could not find council page: ${e.message}`);
      }
    }

    if (!councilPageHtml) {
      result.error = 'Could not find council page';
      return result;
    }

    // Find directory IDs
    const directoryIds = findDirectoryIds(councilPageHtml);
    console.log(`  Found ${directoryIds.length} directory IDs`);

    // Scrape individual profiles
    const seenNames = new Set();

    for (const eid of directoryIds.slice(0, 15)) {
      try {
        const profileUrl = `${city.url}/directory.aspx?EID=${eid}`;
        const profileHtml = await fetchPage(profileUrl);
        const official = parseProfilePage(profileHtml, city.url);

        if (official.name && !seenNames.has(official.name.toLowerCase())) {
          seenNames.add(official.name.toLowerCase());
          official.sourceUrl = profileUrl;

          // Only include if it looks like an elected official
          const titleLower = (official.title || '').toLowerCase();
          const deptLower = (official.department || '').toLowerCase();
          if (
            titleLower.includes('mayor') ||
            titleLower.includes('council') ||
            titleLower.includes('supervisor') ||
            titleLower.includes('vice') ||
            deptLower.includes('council') ||
            deptLower.includes('elected')
          ) {
            // Download photo if available
            if (official.photoUrl) {
              const countySlug = slugify(city.county);
              const citySlug = slugify(city.name);
              const nameSlug = slugify(official.name).replace(/-+/g, '_'); // Use underscores like existing photos
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

            result.officials.push(official);
            console.log(`    Found: ${official.name} - ${official.title || 'N/A'}`);
          }
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        // Skip this profile
      }
    }

    // If we didn't find officials via directory, try parsing the council page directly
    if (result.officials.length === 0) {
      // Look for inline official info on the council page
      const nameMatches = councilPageHtml.matchAll(
        /<(?:h[1-4]|strong|b)[^>]*>([^<]{3,50})<\/(?:h[1-4]|strong|b)>[\s\S]{0,200}?(?:Mayor|Council|Vice|District)/gi
      );
      for (const match of nameMatches) {
        const name = stripHtml(match[1]);
        if (
          name &&
          !seenNames.has(name.toLowerCase()) &&
          !name.includes('City') &&
          !name.includes('Council')
        ) {
          seenNames.add(name.toLowerCase());
          result.officials.push({
            name,
            title: 'Council Member',
            sourceUrl: councilPageUrl,
          });
        }
      }
    }

    console.log(`  Total officials found: ${result.officials.length}`);
  } catch (e) {
    result.error = e.message;
    console.log(`  Error: ${e.message}`);
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('CivicPlus City Council Scraper');
  console.log('==============================');
  console.log(`Scraping ${CIVICPLUS_CITIES.length} cities...`);

  const results = {};
  let totalOfficials = 0;
  let successCount = 0;

  for (const city of CIVICPLUS_CITIES) {
    try {
      const result = await scrapeCity(city);
      results[city.name] = result;
      totalOfficials += result.officials.length;
      if (result.officials.length > 0) successCount++;

      // Rate limit between cities
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.log(`[${city.name}] Fatal error: ${e.message}`);
      results[city.name] = {
        city: city.name,
        county: city.county,
        url: city.url,
        officials: [],
        error: e.message,
      };
    }
  }

  // Save results
  const outputDir = path.join(__dirname, '..', '..', 'data-exports', 'city-councils');
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'civicplus-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('\n==============================');
  console.log(`Saved results to ${outputPath}`);
  console.log(`Total cities: ${Object.keys(results).length}`);
  console.log(`Cities with data: ${successCount}`);
  console.log(`Total officials: ${totalOfficials}`);

  // Summary by county
  const byCounty = {};
  for (const [cityName, data] of Object.entries(results)) {
    const county = data.county || 'Unknown';
    if (!byCounty[county]) {
      byCounty[county] = { cities: 0, officials: 0, withData: 0 };
    }
    byCounty[county].cities++;
    byCounty[county].officials += data.officials?.length || 0;
    if (data.officials?.length > 0) byCounty[county].withData++;
  }

  console.log('\nBy County:');
  for (const [county, stats] of Object.entries(byCounty)) {
    console.log(
      `  ${county}: ${stats.withData}/${stats.cities} cities, ${stats.officials} officials`
    );
  }
}

main().catch(console.error);
