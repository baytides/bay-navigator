#!/usr/bin/env node
/**
 * Scrape city council data from ProudCity (WordPress-based) websites
 * ProudCity is used by ~7 Bay Area cities
 *
 * Usage: node scripts/scrape-proudcity-councils.cjs
 *
 * ProudCity patterns:
 * - WordPress REST API: /wp-json/wp/v2/
 * - Staff CPT: /wp-json/wp/v2/staff or /wp-json/wp/v2/people
 * - Pages: /wp-json/wp/v2/pages?slug=city-council
 * - Featured images via media endpoint
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

// Bay Area cities using ProudCity
const PROUDCITY_CITIES = [
  // Alameda County
  { name: 'Emeryville', url: 'https://www.ci.emeryville.ca.us', county: 'Alameda' },

  // Contra Costa County
  { name: 'Clayton', url: 'https://claytonca.gov', county: 'Contra Costa' },
  { name: 'Oakley', url: 'https://www.ci.oakley.ca.us', county: 'Contra Costa' },
  { name: 'San Pablo', url: 'https://www.sanpabloca.gov', county: 'Contra Costa' },

  // Marin County
  { name: 'Larkspur', url: 'https://www.cityoflarkspur.org', county: 'Marin' },
  { name: 'San Anselmo', url: 'https://www.sananselmo.gov', county: 'Marin' },
  { name: 'Tiburon', url: 'https://www.townoftiburon.org', county: 'Marin' },

  // Sonoma County
  { name: 'Cloverdale', url: 'https://www.cloverdale.net', county: 'Sonoma' },
  { name: 'Windsor', url: 'https://www.townofwindsor.com', county: 'Sonoma' },
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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
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
        resolve(fetchJson(redirectUrl));
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
        resolve(fetchPage(redirectUrl));
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

async function getMediaUrl(baseUrl, mediaId) {
  try {
    const media = await fetchJson(`${baseUrl}/wp-json/wp/v2/media/${mediaId}`);
    return media.source_url || null;
  } catch (e) {
    return null;
  }
}

async function scrapeViaApi(city) {
  const officials = [];

  // Try different staff/people endpoints
  const endpoints = [
    '/wp-json/wp/v2/staff',
    '/wp-json/wp/v2/people',
    '/wp-json/wp/v2/team',
    '/wp-json/wp/v2/directory',
  ];

  for (const endpoint of endpoints) {
    try {
      const staff = await fetchJson(`${city.url}${endpoint}?per_page=50`);
      if (Array.isArray(staff) && staff.length > 0) {
        console.log(`  Found ${staff.length} entries via ${endpoint}`);

        for (const person of staff) {
          // Check if this is a council member based on title/category
          const title = person.title?.rendered || '';
          const content = person.content?.rendered || '';

          // Look for council-related terms
          const isCouncil =
            /mayor|council|supervisor|elected/i.test(title) ||
            /mayor|council|supervisor|elected/i.test(content);

          if (isCouncil || staff.length < 20) {
            // Get featured image
            let photoUrl = null;
            if (person.featured_media) {
              photoUrl = await getMediaUrl(city.url, person.featured_media);
            }

            // Extract name from title
            const name = title.replace(/<[^>]*>/g, '').trim();
            if (name && name.length > 2) {
              officials.push({
                name,
                title: 'Council Member',
                email: person.acf?.email || null,
                phone: person.acf?.phone || null,
                photoUrl,
                sourceUrl: person.link || null,
              });
            }
          }
        }

        if (officials.length > 0) break;
      }
    } catch (e) {
      // Try next endpoint
    }
  }

  return officials;
}

async function scrapeViaHtml(city) {
  const officials = [];

  // Try common council page paths
  const paths = [
    '/city-council',
    '/government/city-council',
    '/your-government/city-council',
    '/elected-officials',
    '/town-council',
  ];

  for (const pagePath of paths) {
    try {
      const html = await fetchPage(`${city.url}${pagePath}`);

      // Look for council member patterns in HTML
      // Pattern: cards with names and photos

      // Try to find council member sections
      const sections =
        html.match(
          /<(?:div|article|li)[^>]*class="[^"]*(?:council|member|official|staff)[^"]*"[^>]*>[\s\S]*?<\/(?:div|article|li)>/gi
        ) || [];

      for (const section of sections) {
        // Extract name from heading
        const nameMatch = section.match(/<h[2-5][^>]*>([^<]+)<\/h[2-5]>/i);
        if (!nameMatch) continue;

        const name = nameMatch[1].replace(/&[^;]+;/g, '').trim();
        if (!name || !/^[A-Z]/.test(name)) continue;

        // Extract title
        const titleMatch = section.match(/(?:Mayor|Vice Mayor|Council\s*Member|Supervisor)/i);
        const title = titleMatch ? titleMatch[0] : 'Council Member';

        // Extract photo
        const photoMatch = section.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
        let photoUrl = null;
        if (photoMatch) {
          photoUrl = photoMatch[1];
          if (photoUrl.startsWith('/')) {
            photoUrl = `${city.url}${photoUrl}`;
          }
        }

        // Extract email
        const emailMatch = section.match(/href="mailto:([^"]+)"/i);
        const email = emailMatch ? emailMatch[1] : null;

        officials.push({
          name,
          title,
          email,
          photoUrl,
          sourceUrl: `${city.url}${pagePath}`,
        });
      }

      if (officials.length > 0) {
        console.log(`  Found ${officials.length} officials from ${pagePath}`);
        break;
      }
    } catch (e) {
      // Try next path
    }
  }

  return officials;
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

  try {
    // Try WordPress REST API first
    let officials = await scrapeViaApi(city);

    // Fallback to HTML parsing
    if (officials.length === 0) {
      officials = await scrapeViaHtml(city);
    }

    // Download photos
    for (const official of officials) {
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

      result.officials.push(official);
      console.log(`    Found: ${official.name} - ${official.title}`);
    }

    if (result.officials.length === 0) {
      result.error = 'No officials found';
    }
  } catch (e) {
    result.error = e.message;
    console.log(`  Error: ${e.message}`);
  }

  console.log(`  Total officials found: ${result.officials.length}`);
  return result;
}

async function main() {
  console.log('ProudCity (WordPress) City Council Scraper');
  console.log('==========================================');
  console.log(`Scraping ${PROUDCITY_CITIES.length} cities...`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = {};

  for (const city of PROUDCITY_CITIES) {
    results[city.name] = await scrapeCity(city);
    await new Promise((r) => setTimeout(r, 1000)); // Rate limit
  }

  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'proudcity-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Summary
  console.log('\n==========================================');
  console.log(`Saved results to ${outputPath}`);

  let totalCities = 0;
  let totalOfficials = 0;

  for (const [name, data] of Object.entries(results)) {
    if (data.officials && data.officials.length > 0) {
      totalCities++;
      totalOfficials += data.officials.length;
    }
  }

  console.log(`Total cities: ${PROUDCITY_CITIES.length}`);
  console.log(`Cities with data: ${totalCities}`);
  console.log(`Total officials: ${totalOfficials}`);
}

main().catch(console.error);
