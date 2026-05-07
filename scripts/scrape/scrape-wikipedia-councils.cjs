#!/usr/bin/env node
/**
 * Scrape city council/mayor data from Wikipedia
 * Uses Wikipedia API to get structured infobox data
 *
 * Usage: node scripts/scrape-wikipedia-councils.cjs
 *
 * Wikipedia patterns:
 * - Infobox settlement: contains mayor, city council info
 * - API: https://en.wikipedia.org/w/api.php?action=parse&page=...&prop=wikitext
 * - Person infobox: contains image field for official photos
 * - Wikimedia Commons: https://upload.wikimedia.org/wikipedia/commons/...
 *
 * This is useful as a fallback for cities where we can't scrape the official site.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { stripBlocks } = require('../util/html-strip.cjs');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'data-exports', 'city-councils');
const PHOTOS_DIR = path.join(
  __dirname,
  '..',
  'apps',
  'assets',
  'images',
  'representatives',
  'local'
);

// Bay Area cities to look up on Wikipedia
// Format: { cityName, wikipediaTitle, county }
// Complete list of all 101 incorporated cities in the 9-county Bay Area
const WIKIPEDIA_CITIES = [
  // Alameda County (14 cities)
  { name: 'Alameda', wikipedia: 'Alameda, California', county: 'Alameda' },
  { name: 'Albany', wikipedia: 'Albany, California', county: 'Alameda' },
  { name: 'Berkeley', wikipedia: 'Berkeley, California', county: 'Alameda' },
  { name: 'Dublin', wikipedia: 'Dublin, California', county: 'Alameda' },
  { name: 'Emeryville', wikipedia: 'Emeryville, California', county: 'Alameda' },
  { name: 'Fremont', wikipedia: 'Fremont, California', county: 'Alameda' },
  { name: 'Hayward', wikipedia: 'Hayward, California', county: 'Alameda' },
  { name: 'Livermore', wikipedia: 'Livermore, California', county: 'Alameda' },
  { name: 'Newark', wikipedia: 'Newark, California', county: 'Alameda' },
  { name: 'Oakland', wikipedia: 'Oakland, California', county: 'Alameda' },
  { name: 'Piedmont', wikipedia: 'Piedmont, California', county: 'Alameda' },
  { name: 'Pleasanton', wikipedia: 'Pleasanton, California', county: 'Alameda' },
  { name: 'San Leandro', wikipedia: 'San Leandro, California', county: 'Alameda' },
  { name: 'Union City', wikipedia: 'Union City, California', county: 'Alameda' },

  // Contra Costa County (19 cities)
  { name: 'Antioch', wikipedia: 'Antioch, California', county: 'Contra Costa' },
  { name: 'Brentwood', wikipedia: 'Brentwood, California', county: 'Contra Costa' },
  { name: 'Clayton', wikipedia: 'Clayton, California', county: 'Contra Costa' },
  { name: 'Concord', wikipedia: 'Concord, California', county: 'Contra Costa' },
  { name: 'Danville', wikipedia: 'Danville, California', county: 'Contra Costa' },
  { name: 'El Cerrito', wikipedia: 'El Cerrito, California', county: 'Contra Costa' },
  { name: 'Hercules', wikipedia: 'Hercules, California', county: 'Contra Costa' },
  { name: 'Lafayette', wikipedia: 'Lafayette, California', county: 'Contra Costa' },
  { name: 'Martinez', wikipedia: 'Martinez, California', county: 'Contra Costa' },
  { name: 'Moraga', wikipedia: 'Moraga, California', county: 'Contra Costa' },
  { name: 'Oakley', wikipedia: 'Oakley, California', county: 'Contra Costa' },
  { name: 'Orinda', wikipedia: 'Orinda, California', county: 'Contra Costa' },
  { name: 'Pinole', wikipedia: 'Pinole, California', county: 'Contra Costa' },
  { name: 'Pittsburg', wikipedia: 'Pittsburg, California', county: 'Contra Costa' },
  { name: 'Pleasant Hill', wikipedia: 'Pleasant Hill, California', county: 'Contra Costa' },
  { name: 'Richmond', wikipedia: 'Richmond, California', county: 'Contra Costa' },
  { name: 'San Pablo', wikipedia: 'San Pablo, California', county: 'Contra Costa' },
  { name: 'San Ramon', wikipedia: 'San Ramon, California', county: 'Contra Costa' },
  { name: 'Walnut Creek', wikipedia: 'Walnut Creek, California', county: 'Contra Costa' },

  // Marin County (11 cities)
  { name: 'Belvedere', wikipedia: 'Belvedere, California', county: 'Marin' },
  { name: 'Corte Madera', wikipedia: 'Corte Madera, California', county: 'Marin' },
  { name: 'Fairfax', wikipedia: 'Fairfax, California', county: 'Marin' },
  { name: 'Larkspur', wikipedia: 'Larkspur, California', county: 'Marin' },
  { name: 'Mill Valley', wikipedia: 'Mill Valley, California', county: 'Marin' },
  { name: 'Novato', wikipedia: 'Novato, California', county: 'Marin' },
  { name: 'Ross', wikipedia: 'Ross, California', county: 'Marin' },
  { name: 'San Anselmo', wikipedia: 'San Anselmo, California', county: 'Marin' },
  { name: 'San Rafael', wikipedia: 'San Rafael, California', county: 'Marin' },
  { name: 'Sausalito', wikipedia: 'Sausalito, California', county: 'Marin' },
  { name: 'Tiburon', wikipedia: 'Tiburon, California', county: 'Marin' },

  // Napa County (5 cities)
  { name: 'American Canyon', wikipedia: 'American Canyon, California', county: 'Napa' },
  { name: 'Calistoga', wikipedia: 'Calistoga, California', county: 'Napa' },
  { name: 'Napa', wikipedia: 'Napa, California', county: 'Napa' },
  { name: 'St. Helena', wikipedia: 'St. Helena, California', county: 'Napa' },
  { name: 'Yountville', wikipedia: 'Yountville, California', county: 'Napa' },

  // San Francisco County (1 city)
  { name: 'San Francisco', wikipedia: 'San Francisco', county: 'San Francisco' },

  // San Mateo County (20 cities)
  { name: 'Atherton', wikipedia: 'Atherton, California', county: 'San Mateo' },
  { name: 'Belmont', wikipedia: 'Belmont, California', county: 'San Mateo' },
  { name: 'Brisbane', wikipedia: 'Brisbane, California', county: 'San Mateo' },
  { name: 'Burlingame', wikipedia: 'Burlingame, California', county: 'San Mateo' },
  { name: 'Colma', wikipedia: 'Colma, California', county: 'San Mateo' },
  { name: 'Daly City', wikipedia: 'Daly City, California', county: 'San Mateo' },
  { name: 'East Palo Alto', wikipedia: 'East Palo Alto, California', county: 'San Mateo' },
  { name: 'Foster City', wikipedia: 'Foster City, California', county: 'San Mateo' },
  { name: 'Half Moon Bay', wikipedia: 'Half Moon Bay, California', county: 'San Mateo' },
  { name: 'Hillsborough', wikipedia: 'Hillsborough, California', county: 'San Mateo' },
  { name: 'Menlo Park', wikipedia: 'Menlo Park, California', county: 'San Mateo' },
  { name: 'Millbrae', wikipedia: 'Millbrae, California', county: 'San Mateo' },
  { name: 'Pacifica', wikipedia: 'Pacifica, California', county: 'San Mateo' },
  { name: 'Portola Valley', wikipedia: 'Portola Valley, California', county: 'San Mateo' },
  { name: 'Redwood City', wikipedia: 'Redwood City, California', county: 'San Mateo' },
  { name: 'San Bruno', wikipedia: 'San Bruno, California', county: 'San Mateo' },
  { name: 'San Carlos', wikipedia: 'San Carlos, California', county: 'San Mateo' },
  { name: 'San Mateo', wikipedia: 'San Mateo, California', county: 'San Mateo' },
  {
    name: 'South San Francisco',
    wikipedia: 'South San Francisco, California',
    county: 'San Mateo',
  },
  { name: 'Woodside', wikipedia: 'Woodside, California', county: 'San Mateo' },

  // Santa Clara County (15 cities)
  { name: 'Campbell', wikipedia: 'Campbell, California', county: 'Santa Clara' },
  { name: 'Cupertino', wikipedia: 'Cupertino, California', county: 'Santa Clara' },
  { name: 'Gilroy', wikipedia: 'Gilroy, California', county: 'Santa Clara' },
  { name: 'Los Altos', wikipedia: 'Los Altos, California', county: 'Santa Clara' },
  { name: 'Los Altos Hills', wikipedia: 'Los Altos Hills, California', county: 'Santa Clara' },
  { name: 'Los Gatos', wikipedia: 'Los Gatos, California', county: 'Santa Clara' },
  { name: 'Milpitas', wikipedia: 'Milpitas, California', county: 'Santa Clara' },
  { name: 'Monte Sereno', wikipedia: 'Monte Sereno, California', county: 'Santa Clara' },
  { name: 'Morgan Hill', wikipedia: 'Morgan Hill, California', county: 'Santa Clara' },
  { name: 'Mountain View', wikipedia: 'Mountain View, California', county: 'Santa Clara' },
  { name: 'Palo Alto', wikipedia: 'Palo Alto, California', county: 'Santa Clara' },
  { name: 'San Jose', wikipedia: 'San Jose, California', county: 'Santa Clara' },
  { name: 'Santa Clara', wikipedia: 'Santa Clara, California', county: 'Santa Clara' },
  { name: 'Saratoga', wikipedia: 'Saratoga, California', county: 'Santa Clara' },
  { name: 'Sunnyvale', wikipedia: 'Sunnyvale, California', county: 'Santa Clara' },

  // Solano County (7 cities)
  { name: 'Benicia', wikipedia: 'Benicia, California', county: 'Solano' },
  { name: 'Dixon', wikipedia: 'Dixon, California', county: 'Solano' },
  { name: 'Fairfield', wikipedia: 'Fairfield, California', county: 'Solano' },
  { name: 'Rio Vista', wikipedia: 'Rio Vista, California', county: 'Solano' },
  { name: 'Suisun City', wikipedia: 'Suisun City, California', county: 'Solano' },
  { name: 'Vacaville', wikipedia: 'Vacaville, California', county: 'Solano' },
  { name: 'Vallejo', wikipedia: 'Vallejo, California', county: 'Solano' },

  // Sonoma County (9 cities)
  { name: 'Cloverdale', wikipedia: 'Cloverdale, California', county: 'Sonoma' },
  { name: 'Cotati', wikipedia: 'Cotati, California', county: 'Sonoma' },
  { name: 'Healdsburg', wikipedia: 'Healdsburg, California', county: 'Sonoma' },
  { name: 'Petaluma', wikipedia: 'Petaluma, California', county: 'Sonoma' },
  { name: 'Rohnert Park', wikipedia: 'Rohnert Park, California', county: 'Sonoma' },
  { name: 'Santa Rosa', wikipedia: 'Santa Rosa, California', county: 'Sonoma' },
  { name: 'Sebastopol', wikipedia: 'Sebastopol, California', county: 'Sonoma' },
  { name: 'Sonoma', wikipedia: 'Sonoma, California', county: 'Sonoma' },
  { name: 'Windsor', wikipedia: 'Windsor, California', county: 'Sonoma' },
];

const USER_AGENT = 'BayNavigatorBot/1.0 (civic data collection; https://baynavigator.org)';

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
    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      timeout: 30000,
    };

    https
      .get(url, options, (res) => {
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
      })
      .on('error', reject);
  });
}

function cleanWikiText(value) {
  if (!value) return '';
  // First pass: strip script/style/comment blocks safely (loops until stable).
  let cleaned = stripBlocks(value);
  cleaned = cleaned
    // Remove refs first (they can contain templates)
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\b[^>]*>/gi, '') // refs with content
    .replace(/<ref\b[^>]*\/>/gi, '') // self-closing refs
    .replace(/<ref\s+[^/]*$/gi, '') // incomplete refs (at end of line)
    // Handle wiki links
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2') // [[link|text]] -> text
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // [[link]] -> link
    // Remove templates (order matters - nested templates)
    .replace(/\{\{nowrap\|([^}]+)\}\}/gi, '$1') // nowrap template
    .replace(/\{\{small\|([^}]+)\}\}/gi, '$1') // small template
    .replace(/\{\{plainlist[^}]*\}\}/gi, '') // plainlist template
    .replace(/\{\{unbulleted list[^}]*\}\}/gi, '') // unbulleted list
    .replace(/\{\{flatlist[^}]*\}\}/gi, '') // flatlist
    .replace(/\{\{[^{}]*\}\}/g, '') // simple templates
    .replace(/\{\{[^{}]*\}\}/g, '') // second pass for nested
    // Clean HTML
    .replace(/<br\s*\/?>/gi, ', ') // br tags
    .replace(/<[^>]+>/g, '') // any remaining HTML tags
    // Clean up whitespace and special chars
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',') // double commas
    .replace(/^\s*,\s*/g, '') // leading comma
    .replace(/\s*,\s*$/g, '') // trailing comma
    .trim();

  // Skip if it looks like unparsed template garbage
  if (cleaned.includes('{{') || cleaned.includes('}}')) {
    return '';
  }

  return cleaned;
}

function extractPersonWikiLink(value) {
  // Extract first [[Person Name]] or [[Person Name|Display]] link
  const match = value.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (match) {
    return {
      page: match[1].trim(),
      display: (match[2] || match[1]).trim(),
    };
  }
  return null;
}

function parseInfobox(wikitext) {
  // Extract infobox settlement data
  const infoboxMatch = wikitext.match(/\{\{Infobox settlement([\s\S]*?)\n\}\}/i);
  if (!infoboxMatch) return null;

  const infoboxText = infoboxMatch[1];
  const data = {};
  const personLinks = {};

  // Parse key-value pairs from infobox
  const lines = infoboxText.split('\n');
  for (const line of lines) {
    const match = line.match(/\|\s*([\w_]+)\s*=\s*([\s\S]*)/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const rawValue = match[2].trim();

      // Store person wiki link for photo lookup
      const personLink = extractPersonWikiLink(rawValue);
      if (
        personLink &&
        (key.includes('leader') || key.includes('mayor') || key.includes('manager'))
      ) {
        personLinks[key] = personLink;
      }

      // Clean and store value
      const cleanedValue = cleanWikiText(rawValue);
      if (cleanedValue) {
        data[key] = cleanedValue;
      }
    }
  }

  return { data, personLinks };
}

/**
 * Fetch a person's Wikipedia page and extract their photo
 * @param {string} personPage - Wikipedia page title (e.g., "Sheng Thao")
 * @returns {Promise<string|null>} - Image URL or null
 */
async function fetchPersonPhoto(personPage) {
  const title = encodeURIComponent(personPage);
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=wikitext&format=json`;

  try {
    const response = await fetchJson(url);

    if (!response.parse || !response.parse.wikitext) {
      return null;
    }

    const wikitext = response.parse.wikitext['*'];

    // Look for image in person infobox
    // Common patterns: |image = Filename.jpg, |image_name = Filename.jpg
    const imageMatch = wikitext.match(/\|\s*(?:image|image_name)\s*=\s*([^\n|]+)/i);
    if (!imageMatch) {
      return null;
    }

    let imageName = imageMatch[1].trim();

    // Clean up the image name
    imageName = stripBlocks(imageName)
      .replace(/\[\[File:([^\]|]+).*\]\]/i, '$1') // [[File:name.jpg|...]]
      .replace(/\[\[([^\]|]+).*\]\]/i, '$1') // [[name.jpg|...]]
      .replace(/<ref\b[^>]*>.*?<\/ref\b[^>]*>/gi, '') // Remove refs
      .replace(/<ref\b[^>]*\/>/gi, '') // Remove self-closing refs
      .trim();

    if (!imageName || imageName.length < 5) {
      return null;
    }

    // Get the actual image URL from Wikimedia Commons
    const imageInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url&format=json`;

    const imageResponse = await fetchJson(imageInfoUrl);

    if (!imageResponse.query || !imageResponse.query.pages) {
      return null;
    }

    const pages = Object.values(imageResponse.query.pages);
    if (pages.length === 0 || !pages[0].imageinfo || pages[0].imageinfo.length === 0) {
      return null;
    }

    return pages[0].imageinfo[0].url;
  } catch (e) {
    return null;
  }
}

/**
 * Parse a wikitable to extract council members
 * @param {string} wikitext - The wikitext containing the table
 * @returns {Array} - Array of {name, title, district}
 */
function parseCouncilTable(wikitext) {
  const members = [];

  // Find the Current Council section (various naming patterns)
  const currentMatch = wikitext.match(
    /==\s*Current\s+(?:Council|Members|City Council|councilmembers|composition)\s*==\s*([\s\S]*?)(?:==\s*[^=]|$)/i
  );
  if (!currentMatch) return members;

  const tableSection = currentMatch[1];

  // Parse wikitable rows
  // Format varies:
  // 1. |- {{party shading}} \n|District\n| [[Name]]\n|Party\n|Year
  // 2. |- |District || [[File:...]]<br>[[Name]] || Areas || Party || Year
  const rows = tableSection.split(/\|-/);

  for (const row of rows) {
    // Skip header rows and empty rows
    if (
      !row.trim() ||
      row.includes('!District') ||
      row.includes('!Councilmember') ||
      row.includes('!Member')
    )
      continue;

    // Try to extract district and name from this row
    let name = null;
    let district = null;
    let isMayor = false;

    // Check for Mayor row
    if (/\|Mayor\s*\|/i.test(row) || row.trim().startsWith('Mayor')) {
      isMayor = true;
    }

    // Look for district number at start of row or in cells
    const districtMatch = row.match(/\|\s*([1-9]|10|At-?large)\s*(?:\||\n)/i);
    if (districtMatch) {
      district = districtMatch[1].trim();
      if (/at-?large/i.test(district)) {
        district = 'At-Large';
      }
    }

    // Look for all wiki links in the row and find person names
    const wikiLinks = [...row.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)];
    for (const match of wikiLinks) {
      const linkTarget = match[1].trim();
      const linkText = (match[2] || match[1]).trim();

      // Skip file links, party links, area links
      if (/^(?:File|Image|Category):/i.test(linkTarget)) continue;
      if (/Party|Democratic|Republican/i.test(linkTarget)) continue;
      if (/,\s*(?:California|San Jose|Oakland)/i.test(linkTarget)) continue;

      // Skip area/neighborhood names (they usually have specific patterns)
      if (
        /(?:San Jose|Valley|Hills?|Creek|Park|Town|Village|District|Heights|Beach|East|West|North|South|Downtown|Central)\s*$/i.test(
          linkText
        )
      )
        continue;
      if (/^(?:East|West|North|South|Central|Downtown)\s+/i.test(linkText)) continue;

      // Check if it looks like a person name (First Last pattern, not a place)
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(linkText) && linkText.split(' ').length <= 4) {
        name = linkText.replace(/\s*\(.*?\)\s*/g, '').trim();
        break;
      }
    }

    // Also look for plain text names after <br> tags (some tables don't wikilink names)
    if (!name) {
      const brMatch = row.match(/<br\s*\/?>\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (brMatch) {
        name = brMatch[1].trim();
      }
    }

    if (name) {
      // Skip mayor if we already have them from the city infobox
      if (isMayor) {
        district = null; // Mayor isn't a district
      }

      members.push({
        name,
        title: isMayor
          ? 'Mayor'
          : district
            ? `Council Member, District ${district}`
            : 'Council Member',
        district: isMayor ? null : district,
        isMayor,
      });
    }
  }

  return members;
}

/**
 * Fetch San Francisco Board of Supervisors from Wikipedia
 * SF has a unique structure - 11 supervisors instead of a city council
 * @returns {Promise<Object>} - { members, sourceUrl } or null
 */
async function fetchSFSupervisors() {
  const pageName = 'San_Francisco_Board_of_Supervisors';
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json`;

  try {
    const response = await fetchJson(url);

    if (!response.parse || !response.parse.wikitext) {
      return null;
    }

    const wikitext = response.parse.wikitext['*'];
    const members = [];

    // Look for the current members table - wikitable with District and Supervisor columns
    const tableMatch = wikitext.match(/\{\|\s*class\s*=\s*"wikitable"[\s\S]*?\|\}/);
    if (!tableMatch) return null;

    const tableText = tableMatch[0];
    const rows = tableText.split(/\|-/);

    for (const row of rows) {
      // Skip header rows
      if (row.includes('!District') || row.includes('!Supervisor')) continue;
      if (!row.trim()) continue;

      // Look for district anchor like {{vanchor|District 1}}
      const districtMatch = row.match(/\{\{vanchor\|District\s+(\d{1,2})\}\}/i);
      if (!districtMatch) continue;

      const district = parseInt(districtMatch[1], 10);
      if (isNaN(district) || district < 1 || district > 11) continue;

      // Find supervisor name - it's in a wiki link after <br> like:
      // [[File:...]]<br> [[Connie Chan (politician)|Connie Chan]]
      // or [[File:...]]<br> [[Stephen Sherrill]]
      let name = null;

      // First try: Look for wiki links that are person names (after File: links)
      // The pattern is: [[File:...]]<br> [[Name (politician)|Display Name]] or [[Name]]
      const afterBrMatch = row.match(/<br>\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/i);
      if (afterBrMatch) {
        const linkTarget = afterBrMatch[1].trim();
        const linkText = (afterBrMatch[2] || afterBrMatch[1]).trim();

        // Skip if it's a file or location
        if (!/^(?:File|Image|Category):/i.test(linkTarget)) {
          // Clean up the name - remove "(politician)" suffix if present
          name = linkText.replace(/\s*\(politician\)\s*/gi, '').trim();
        }
      }

      // Fallback: look for all wiki links and find person names
      if (!name) {
        const wikiLinks = [...row.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)];
        for (const match of wikiLinks) {
          const linkTarget = match[1].trim();
          const linkText = (match[2] || match[1]).trim();

          // Skip file/image links, district links, party links, neighborhood links
          if (/^(?:File|Image|Category):/i.test(linkTarget)) continue;
          if (/Party|Democratic|Republican/i.test(linkTarget)) continue;
          if (/San Francisco|District|Heights|Hollow|Marina|Richmond/i.test(linkTarget)) continue;

          // Check if it looks like a person name (First Last or First Middle Last)
          if (/^[A-Z][a-z]+\s+[A-Z]/.test(linkText) && linkText.split(' ').length <= 4) {
            name = linkText.replace(/\s*\(politician\)\s*/gi, '').trim();
            break;
          }
        }
      }

      if (name) {
        members.push({
          name,
          title: `Supervisor, District ${district}`,
          district,
        });
      }
    }

    if (members.length > 0) {
      // Sort by district
      members.sort((a, b) => a.district - b.district);
      return {
        members,
        sourceUrl: `https://en.wikipedia.org/wiki/${pageName}`,
      };
    }
  } catch (e) {
    // Page doesn't exist or parse failed
  }

  return null;
}

/**
 * Fetch city council page from Wikipedia if it exists
 * @param {string} cityName - City name (e.g., "Oakland")
 * @returns {Promise<Array>} - Array of council members or empty array
 */
async function fetchCouncilPage(cityName) {
  // Common patterns for city council Wikipedia pages
  const pageNames = [
    `${cityName}_City_Council`,
    `${cityName},_California_City_Council`,
    `${cityName}_Town_Council`,
  ];

  for (const pageName of pageNames) {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json`;

    try {
      const response = await fetchJson(url);

      if (response.parse && response.parse.wikitext) {
        const wikitext = response.parse.wikitext['*'];
        const members = parseCouncilTable(wikitext);

        if (members.length > 0) {
          return {
            members,
            sourceUrl: `https://en.wikipedia.org/wiki/${pageName}`,
          };
        }
      }
    } catch (e) {
      // Page doesn't exist, try next pattern
    }
  }

  return null;
}

async function fetchWikipediaData(cityInfo, downloadPhotos = true) {
  const title = encodeURIComponent(cityInfo.wikipedia);
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=wikitext&format=json`;

  try {
    const response = await fetchJson(url);

    if (!response.parse || !response.parse.wikitext) {
      return null;
    }

    const wikitext = response.parse.wikitext['*'];
    const infoboxResult = parseInfobox(wikitext);

    if (!infoboxResult) {
      return null;
    }

    const { data: infobox, personLinks } = infoboxResult;
    const officials = [];

    // Extract mayor info
    const mayorFields = ['leader_name', 'leader_name1', 'mayor', 'mayor_name'];
    for (const field of mayorFields) {
      if (infobox[field]) {
        let rawName = infobox[field];

        // Clean up names that are actually council lists
        // Extract just the mayor if the name starts with "Mayor"
        if (rawName.includes(',') && rawName.toLowerCase().includes('mayor')) {
          const mayorMatch = rawName.match(/Mayor\s+([^,]+)/i);
          if (mayorMatch) {
            rawName = mayorMatch[1].trim();
          }
        }

        // Remove party affiliation in parentheses
        rawName = rawName.replace(/\s*\([^)]*(?:party|democrat|republican)[^)]*\)/gi, '').trim();

        // Skip if it still looks like a list or garbage
        if (
          rawName.includes('Vice Mayor') ||
          rawName.includes('Councilmember') ||
          rawName.length > 50
        ) {
          continue;
        }

        const official = {
          name: rawName,
          title: 'Mayor',
          source: 'Wikipedia',
          sourceUrl: `https://en.wikipedia.org/wiki/${title}`,
        };

        // Try to get photo from person's Wikipedia page
        if (downloadPhotos && personLinks[field]) {
          const photoUrl = await fetchPersonPhoto(personLinks[field].page);
          if (photoUrl) {
            official.photoUrl = photoUrl;
            // Download the photo
            const countySlug = slugify(cityInfo.county);
            const citySlug = slugify(cityInfo.name);
            const nameSlug = slugify(official.name).replace(/-+/g, '_');
            const localPath = await downloadPhoto(photoUrl, countySlug, citySlug, nameSlug);
            if (localPath) {
              official.localPhotoPath = localPath;
              console.log(`    Downloaded photo for ${official.name}`);
            }
          }
          // Rate limit between photo requests
          await new Promise((r) => setTimeout(r, 300));
        }

        officials.push(official);
        break;
      }
    }

    // Extract city manager if present
    const managerName = infobox['leader_name2'] || infobox['city_manager'];
    if (managerName) {
      const managerTitle = infobox['leader_title2'] || 'City Manager';
      const official = {
        name: managerName,
        title: managerTitle,
        source: 'Wikipedia',
        sourceUrl: `https://en.wikipedia.org/wiki/${title}`,
      };

      // Try to get photo for city manager too
      const managerField = infobox['leader_name2'] ? 'leader_name2' : 'city_manager';
      if (downloadPhotos && personLinks[managerField]) {
        const photoUrl = await fetchPersonPhoto(personLinks[managerField].page);
        if (photoUrl) {
          official.photoUrl = photoUrl;
          const countySlug = slugify(cityInfo.county);
          const citySlug = slugify(cityInfo.name);
          const nameSlug = slugify(official.name).replace(/-+/g, '_');
          const localPath = await downloadPhoto(photoUrl, countySlug, citySlug, nameSlug);
          if (localPath) {
            official.localPhotoPath = localPath;
            console.log(`    Downloaded photo for ${official.name}`);
          }
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      officials.push(official);
    }

    // Try to fetch city council page for additional members
    // Special handling for San Francisco - fetch Board of Supervisors
    let councilData = null;
    if (cityInfo.name === 'San Francisco') {
      councilData = await fetchSFSupervisors();
      if (councilData && councilData.members.length > 0) {
        console.log(
          `    Found ${councilData.members.length} supervisors from SF Board of Supervisors page`
        );
      }
    } else {
      councilData = await fetchCouncilPage(cityInfo.name);
      if (councilData && councilData.members.length > 0) {
        console.log(`    Found ${councilData.members.length} council members from dedicated page`);
      }
    }

    if (councilData && councilData.members.length > 0) {
      for (const member of councilData.members) {
        // Don't duplicate if we already have this person
        if (!officials.some((o) => o.name === member.name)) {
          officials.push({
            name: member.name,
            title: member.title,
            source: 'Wikipedia',
            sourceUrl: councilData.sourceUrl,
          });
        }
      }
    }

    return {
      city: cityInfo.name,
      county: cityInfo.county,
      officials,
      personLinks,
      councilPageFound: !!councilData,
      scrapedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      city: cityInfo.name,
      county: cityInfo.county,
      officials: [],
      error: e.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

async function main() {
  const skipPhotos = process.argv.includes('--skip-photos');
  const downloadPhotos = !skipPhotos;

  console.log('Wikipedia City Officials Scraper');
  console.log('================================');
  console.log(`Looking up ${WIKIPEDIA_CITIES.length} cities...`);
  if (downloadPhotos) {
    console.log('Photo downloads: ENABLED (use --skip-photos to disable)');
  } else {
    console.log('Photo downloads: DISABLED');
  }
  console.log('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = {};

  for (const city of WIKIPEDIA_CITIES) {
    console.log(`[${city.name}] Fetching from Wikipedia...`);

    const data = await fetchWikipediaData(city, downloadPhotos);
    results[city.name] = data;

    if (data && data.officials.length > 0) {
      console.log(`  Found: ${data.officials.map((o) => `${o.name} (${o.title})`).join(', ')}`);
    } else if (data && data.error) {
      console.log(`  Error: ${data.error}`);
    } else {
      console.log('  No officials found in infobox');
    }

    // Rate limit - be respectful to Wikipedia
    await new Promise((r) => setTimeout(r, 500));
  }

  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'wikipedia-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Summary
  console.log('\n================================');
  console.log(`Saved results to ${outputPath}`);

  let citiesWithMayor = 0;
  let totalOfficials = 0;
  let totalPhotos = 0;

  for (const [name, data] of Object.entries(results)) {
    if (data.officials && data.officials.length > 0) {
      citiesWithMayor++;
      totalOfficials += data.officials.length;
      totalPhotos += data.officials.filter((o) => o.localPhotoPath).length;
    }
  }

  console.log(`Cities with mayor info: ${citiesWithMayor}/${WIKIPEDIA_CITIES.length}`);
  console.log(`Total officials found: ${totalOfficials}`);
  console.log(`Photos downloaded: ${totalPhotos}`);
  console.log('\nNote: Wikipedia typically only has mayor info, not full council lists.');
  console.log('Photos are from Wikipedia/Wikimedia Commons (verify licensing for use).');
}

main().catch(console.error);
