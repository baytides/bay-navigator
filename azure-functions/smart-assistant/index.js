/**
 * Smart Assistant Azure Function with RAG (Retrieval-Augmented Generation)
 *
 * Environment-first architecture prioritizing local/cached responses:
 * 1. Quick Answer Cache - instant responses for common queries ($0)
 * 2. Local pattern matching - synonyms, best bets ($0)
 * 3. Cloudflare Workers AI - free tier (10K neurons/day, hard stop)
 * 4. Azure GPT-4o-mini - capped at $30/month
 *
 * Cost optimization: Uses reference documents to reduce LLM calls
 * - quick-answers.json: Pre-built responses for common queries
 * - common-queries.json: Pattern matching for frequent questions
 * - program-categories.json: Category-specific keyword expansion
 * - eligibility-groups.json: Demographic trigger keywords
 *
 * Privacy: Only query text is sent to AI - no personal data collected
 */

const { createLogger, createTimer, extractErrorInfo } = require('../shared/logger');
const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

// Load AI reference documents at startup (cost optimization)
let commonQueries = null;
let programCategories = null;
let eligibilityGroups = null;
let quickAnswers = null;

try {
  const refPath = path.join(__dirname, '../shared/ai-reference');
  commonQueries = JSON.parse(fs.readFileSync(path.join(refPath, 'common-queries.json'), 'utf8'));
  programCategories = JSON.parse(
    fs.readFileSync(path.join(refPath, 'program-categories.json'), 'utf8')
  );
  eligibilityGroups = JSON.parse(
    fs.readFileSync(path.join(refPath, 'eligibility-groups.json'), 'utf8')
  );
  quickAnswers = JSON.parse(fs.readFileSync(path.join(refPath, 'quick-answers.json'), 'utf8'));
  console.log('AI reference documents loaded successfully');
} catch (err) {
  console.warn('Could not load AI reference documents:', err.message);
}

// =============================================================================
// COST CONTROL CONFIGURATION
// =============================================================================

// Daily budget limits
const AZURE_DAILY_BUDGET_CENTS = 100; // $1/day = ~$30/month
const AZURE_COST_PER_REQUEST_CENTS = 0.0024; // ~$0.000024 per request
const AZURE_MAX_DAILY_REQUESTS = Math.floor(
  AZURE_DAILY_BUDGET_CENTS / AZURE_COST_PER_REQUEST_CENTS
);

// Azure Table Storage for tracking (uses existing storage account)
const STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT || 'bayaboratoragestorage';
const STORAGE_KEY = process.env.AZURE_STORAGE_KEY;
const USAGE_TABLE = 'aiusage';

let tableClient = null;
if (STORAGE_KEY) {
  try {
    const credential = new AzureNamedKeyCredential(STORAGE_ACCOUNT, STORAGE_KEY);
    tableClient = new TableClient(
      `https://${STORAGE_ACCOUNT}.table.core.windows.net`,
      USAGE_TABLE,
      credential
    );
  } catch (err) {
    console.warn('Could not initialize Table Storage client:', err.message);
  }
}

// Cloudflare Workers AI configuration (Tier 3 - free)
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_MODEL = '@cf/meta/llama-3.1-8b-instruct';

// Azure OpenAI configuration (Tier 4 - capped)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

// Azure AI Search configuration (for program search)
const AZURE_SEARCH_ENDPOINT =
  process.env.AZURE_SEARCH_ENDPOINT || 'https://baynavigator-search.search.windows.net';
const AZURE_SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const SEARCH_INDEX = 'programs';

// =============================================================================
// QUICK ANSWER FUNCTIONS
// =============================================================================

/**
 * Check for quick answer match (Tier 1 - instant, $0)
 * Returns { matched: true, response: {...} } or { matched: false }
 */
function checkQuickAnswer(query, location) {
  if (!quickAnswers) return { matched: false };

  const lowerQuery = query.toLowerCase().trim();

  // 1. Check crisis patterns first (highest priority)
  for (const crisis of quickAnswers.crisisPatterns || []) {
    for (const pattern of crisis.patterns) {
      if (lowerQuery.includes(pattern.toLowerCase())) {
        return {
          matched: true,
          response: {
            type: 'crisis',
            ...crisis.response,
            search: crisis.response.search || null,
          },
        };
      }
    }
  }

  // 2. Check clarify patterns (vague queries)
  for (const clarify of quickAnswers.clarifyPatterns || []) {
    for (const pattern of clarify.patterns) {
      // Match exact or as primary content
      if (lowerQuery === pattern || lowerQuery.startsWith(pattern + ' ')) {
        return {
          matched: true,
          response: clarify.response,
        };
      }
    }
  }

  // 3. Check trouble/application help patterns
  const troublePatterns = quickAnswers.troublePatterns;
  if (troublePatterns) {
    const hasTroubleTrigger = troublePatterns.triggers.some((t) =>
      lowerQuery.includes(t.toLowerCase())
    );

    if (hasTroubleTrigger) {
      for (const [programKey, programInfo] of Object.entries(troublePatterns.programs)) {
        const matchesProgram = programInfo.keywords.some((k) =>
          lowerQuery.includes(k.toLowerCase())
        );

        if (matchesProgram) {
          // If we have location, include county contact
          let countyContact = null;
          if (location?.county) {
            const countyKey = location.county
              .toLowerCase()
              .replace(' county', '')
              .replace(/\s+/g, '_');
            countyContact = quickAnswers.countyContacts?.[countyKey] || null;
          }

          return {
            matched: true,
            response: {
              type: countyContact ? 'guide_with_contact' : 'guide',
              title: programInfo.fallbackMessage,
              message: programInfo.fallbackAction,
              guideUrl: programInfo.guideUrl,
              guideTitle: programInfo.guideTitle,
              countyContact,
            },
          };
        }
      }
    }
  }

  // 4. Check program info queries
  for (const programQuery of quickAnswers.programQueries || []) {
    for (const pattern of programQuery.patterns) {
      if (lowerQuery.includes(pattern.toLowerCase())) {
        return {
          matched: true,
          response: programQuery.response,
        };
      }
    }
  }

  // 5. Check eligibility queries
  const eligibilityQueries = quickAnswers.eligibilityQueries;
  if (eligibilityQueries) {
    const hasEligibilityTrigger = eligibilityQueries.triggers.some((t) =>
      lowerQuery.includes(t.toLowerCase())
    );

    if (hasEligibilityTrigger) {
      for (const [, programInfo] of Object.entries(eligibilityQueries.programs)) {
        const matchesProgram = programInfo.keywords.some((k) =>
          lowerQuery.includes(k.toLowerCase())
        );

        if (matchesProgram) {
          return {
            matched: true,
            response: {
              type: 'eligibility',
              title: programInfo.title,
              guideUrl: programInfo.url,
            },
          };
        }
      }
    }
  }

  return { matched: false };
}

/**
 * Resolve city to county for contact lookup
 */
function getCityCounty(city) {
  if (!quickAnswers?.cityToCounty || !city) return null;
  const cityKey = city.toLowerCase().trim();
  return quickAnswers.cityToCounty[cityKey] || null;
}

// =============================================================================
// USAGE TRACKING FUNCTIONS
// =============================================================================

/**
 * Get today's date key for usage tracking (UTC)
 */
function getTodayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Get current usage count for today
 */
async function getUsageCount(service) {
  if (!tableClient) return 0;

  try {
    const entity = await tableClient.getEntity(getTodayKey(), service);
    return entity.count || 0;
  } catch (err) {
    if (err.statusCode === 404) return 0;
    console.warn(`Failed to get usage count for ${service}:`, err.message);
    return 0;
  }
}

/**
 * Increment usage count for today
 */
async function incrementUsage(service) {
  if (!tableClient) return;

  try {
    const partitionKey = getTodayKey();
    const rowKey = service;

    try {
      const entity = await tableClient.getEntity(partitionKey, rowKey);
      await tableClient.updateEntity(
        {
          partitionKey,
          rowKey,
          count: (entity.count || 0) + 1,
          lastUpdated: new Date().toISOString(),
        },
        'Merge'
      );
    } catch (err) {
      if (err.statusCode === 404) {
        await tableClient.createEntity({
          partitionKey,
          rowKey,
          count: 1,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.warn(`Failed to increment usage for ${service}:`, err.message);
  }
}

/**
 * Check if Azure OpenAI budget is available
 */
async function isAzureBudgetAvailable() {
  const count = await getUsageCount('azure_openai');
  return count < AZURE_MAX_DAILY_REQUESTS;
}

// Bay Area ZIP codes to city mapping
const ZIP_TO_CITY = {
  // Alameda County
  94501: 'Alameda',
  94502: 'Alameda',
  94536: 'Fremont',
  94537: 'Fremont',
  94538: 'Fremont',
  94539: 'Fremont',
  94540: 'Hayward',
  94541: 'Hayward',
  94542: 'Hayward',
  94543: 'Hayward',
  94544: 'Hayward',
  94545: 'Hayward',
  94546: 'Castro Valley',
  94550: 'Livermore',
  94551: 'Livermore',
  94552: 'Castro Valley',
  94555: 'Fremont',
  94557: 'Hayward',
  94560: 'Newark',
  94566: 'Pleasanton',
  94568: 'Dublin',
  94577: 'San Leandro',
  94578: 'San Leandro',
  94579: 'San Leandro',
  94580: 'San Lorenzo',
  94586: 'Sunol',
  94587: 'Union City',
  94588: 'Pleasanton',
  94601: 'Oakland',
  94602: 'Oakland',
  94603: 'Oakland',
  94605: 'Oakland',
  94606: 'Oakland',
  94607: 'Oakland',
  94608: 'Emeryville',
  94609: 'Oakland',
  94610: 'Oakland',
  94611: 'Oakland',
  94612: 'Oakland',
  94613: 'Oakland',
  94618: 'Oakland',
  94619: 'Oakland',
  94620: 'Piedmont',
  94621: 'Oakland',
  94702: 'Berkeley',
  94703: 'Berkeley',
  94704: 'Berkeley',
  94705: 'Berkeley',
  94706: 'Albany',
  94707: 'Berkeley',
  94708: 'Berkeley',
  94709: 'Berkeley',
  94710: 'Berkeley',
  // Contra Costa County
  94505: 'Discovery Bay',
  94506: 'Danville',
  94507: 'Alamo',
  94509: 'Antioch',
  94511: 'Bethel Island',
  94513: 'Brentwood',
  94514: 'Byron',
  94516: 'Canyon',
  94517: 'Clayton',
  94518: 'Concord',
  94519: 'Concord',
  94520: 'Concord',
  94521: 'Concord',
  94522: 'Concord',
  94523: 'Pleasant Hill',
  94524: 'Concord',
  94525: 'Crockett',
  94526: 'Danville',
  94527: 'Concord',
  94528: 'Diablo',
  94529: 'Concord',
  94530: 'El Cerrito',
  94531: 'Antioch',
  94547: 'Hercules',
  94548: 'Knightsen',
  94549: 'Lafayette',
  94553: 'Martinez',
  94556: 'Moraga',
  94561: 'Oakley',
  94563: 'Orinda',
  94564: 'Pinole',
  94565: 'Pittsburg',
  94569: 'Port Costa',
  94570: 'Moraga',
  94572: 'Rodeo',
  94575: 'Moraga',
  94582: 'San Ramon',
  94583: 'San Ramon',
  94595: 'Walnut Creek',
  94596: 'Walnut Creek',
  94597: 'Walnut Creek',
  94598: 'Walnut Creek',
  94801: 'Richmond',
  94802: 'Richmond',
  94803: 'El Sobrante',
  94804: 'Richmond',
  94805: 'Richmond',
  94806: 'San Pablo',
  94820: 'Richmond',
  94850: 'Richmond',
  // Marin County
  94901: 'San Rafael',
  94903: 'San Rafael',
  94904: 'Greenbrae',
  94920: 'Belvedere Tiburon',
  94925: 'Corte Madera',
  94930: 'Fairfax',
  94939: 'Larkspur',
  94941: 'Mill Valley',
  94945: 'Novato',
  94947: 'Novato',
  94949: 'Novato',
  94957: 'Ross',
  94960: 'San Anselmo',
  94965: 'Sausalito',
  // Napa County
  94503: 'American Canyon',
  94558: 'Napa',
  94559: 'Napa',
  94574: 'St. Helena',
  94599: 'Yountville',
  94515: 'Calistoga',
  // San Francisco
  94102: 'San Francisco',
  94103: 'San Francisco',
  94104: 'San Francisco',
  94105: 'San Francisco',
  94107: 'San Francisco',
  94108: 'San Francisco',
  94109: 'San Francisco',
  94110: 'San Francisco',
  94111: 'San Francisco',
  94112: 'San Francisco',
  94114: 'San Francisco',
  94115: 'San Francisco',
  94116: 'San Francisco',
  94117: 'San Francisco',
  94118: 'San Francisco',
  94121: 'San Francisco',
  94122: 'San Francisco',
  94123: 'San Francisco',
  94124: 'San Francisco',
  94127: 'San Francisco',
  94129: 'San Francisco',
  94130: 'San Francisco',
  94131: 'San Francisco',
  94132: 'San Francisco',
  94133: 'San Francisco',
  94134: 'San Francisco',
  94158: 'San Francisco',
  // San Mateo County
  94002: 'Belmont',
  94005: 'Brisbane',
  94010: 'Burlingame',
  94014: 'Daly City',
  94015: 'Daly City',
  94019: 'Half Moon Bay',
  94025: 'Menlo Park',
  94027: 'Atherton',
  94028: 'Portola Valley',
  94030: 'Millbrae',
  94044: 'Pacifica',
  94061: 'Redwood City',
  94062: 'Redwood City',
  94063: 'Redwood City',
  94065: 'Redwood City',
  94066: 'San Bruno',
  94070: 'San Carlos',
  94080: 'South San Francisco',
  94303: 'East Palo Alto',
  94401: 'San Mateo',
  94402: 'San Mateo',
  94403: 'San Mateo',
  94404: 'Foster City',
  // Santa Clara County
  94022: 'Los Altos',
  94024: 'Los Altos',
  94040: 'Mountain View',
  94041: 'Mountain View',
  94043: 'Mountain View',
  94085: 'Sunnyvale',
  94086: 'Sunnyvale',
  94087: 'Sunnyvale',
  94089: 'Sunnyvale',
  94301: 'Palo Alto',
  94304: 'Palo Alto',
  94306: 'Palo Alto',
  95002: 'Alviso',
  95008: 'Campbell',
  95014: 'Cupertino',
  95020: 'Gilroy',
  95030: 'Los Gatos',
  95032: 'Los Gatos',
  95035: 'Milpitas',
  95037: 'Morgan Hill',
  95050: 'Santa Clara',
  95051: 'Santa Clara',
  95054: 'Santa Clara',
  95070: 'Saratoga',
  95110: 'San Jose',
  95111: 'San Jose',
  95112: 'San Jose',
  95113: 'San Jose',
  95116: 'San Jose',
  95117: 'San Jose',
  95118: 'San Jose',
  95119: 'San Jose',
  95120: 'San Jose',
  95121: 'San Jose',
  95122: 'San Jose',
  95123: 'San Jose',
  95124: 'San Jose',
  95125: 'San Jose',
  95126: 'San Jose',
  95127: 'San Jose',
  95128: 'San Jose',
  95129: 'San Jose',
  95130: 'San Jose',
  95131: 'San Jose',
  95132: 'San Jose',
  95133: 'San Jose',
  95134: 'San Jose',
  95135: 'San Jose',
  95136: 'San Jose',
  95138: 'San Jose',
  95139: 'San Jose',
  95148: 'San Jose',
  // Solano County
  94510: 'Benicia',
  94533: 'Fairfield',
  94534: 'Fairfield',
  94585: 'Suisun City',
  94589: 'Vallejo',
  94590: 'Vallejo',
  94591: 'Vallejo',
  95687: 'Vacaville',
  95688: 'Vacaville',
  95620: 'Dixon',
  94571: 'Rio Vista',
  // Sonoma County
  94928: 'Rohnert Park',
  94931: 'Cotati',
  94952: 'Petaluma',
  94954: 'Petaluma',
  95401: 'Santa Rosa',
  95403: 'Santa Rosa',
  95404: 'Santa Rosa',
  95405: 'Santa Rosa',
  95407: 'Santa Rosa',
  95409: 'Santa Rosa',
  95425: 'Cloverdale',
  95436: 'Forestville',
  95446: 'Guerneville',
  95448: 'Healdsburg',
  95472: 'Sebastopol',
  95476: 'Sonoma',
  95492: 'Windsor',
};

// City to county mapping
const CITY_TO_COUNTY = {
  // Alameda County
  Alameda: 'Alameda County',
  Albany: 'Alameda County',
  Berkeley: 'Alameda County',
  'Castro Valley': 'Alameda County',
  Dublin: 'Alameda County',
  Emeryville: 'Alameda County',
  Fremont: 'Alameda County',
  Hayward: 'Alameda County',
  Livermore: 'Alameda County',
  Newark: 'Alameda County',
  Oakland: 'Alameda County',
  Piedmont: 'Alameda County',
  Pleasanton: 'Alameda County',
  'San Leandro': 'Alameda County',
  'San Lorenzo': 'Alameda County',
  Sunol: 'Alameda County',
  'Union City': 'Alameda County',
  // Contra Costa County
  Alamo: 'Contra Costa County',
  Antioch: 'Contra Costa County',
  'Bethel Island': 'Contra Costa County',
  Brentwood: 'Contra Costa County',
  Byron: 'Contra Costa County',
  Canyon: 'Contra Costa County',
  Clayton: 'Contra Costa County',
  Concord: 'Contra Costa County',
  Crockett: 'Contra Costa County',
  Danville: 'Contra Costa County',
  Diablo: 'Contra Costa County',
  'Discovery Bay': 'Contra Costa County',
  'El Cerrito': 'Contra Costa County',
  'El Sobrante': 'Contra Costa County',
  Hercules: 'Contra Costa County',
  Knightsen: 'Contra Costa County',
  Lafayette: 'Contra Costa County',
  Martinez: 'Contra Costa County',
  Moraga: 'Contra Costa County',
  Oakley: 'Contra Costa County',
  Orinda: 'Contra Costa County',
  Pinole: 'Contra Costa County',
  Pittsburg: 'Contra Costa County',
  'Pleasant Hill': 'Contra Costa County',
  'Port Costa': 'Contra Costa County',
  Richmond: 'Contra Costa County',
  Rodeo: 'Contra Costa County',
  'San Pablo': 'Contra Costa County',
  'San Ramon': 'Contra Costa County',
  'Walnut Creek': 'Contra Costa County',
  // Marin County
  Belvedere: 'Marin County',
  'Belvedere Tiburon': 'Marin County',
  'Corte Madera': 'Marin County',
  Fairfax: 'Marin County',
  Greenbrae: 'Marin County',
  Larkspur: 'Marin County',
  'Mill Valley': 'Marin County',
  Novato: 'Marin County',
  Ross: 'Marin County',
  'San Anselmo': 'Marin County',
  'San Rafael': 'Marin County',
  Sausalito: 'Marin County',
  Tiburon: 'Marin County',
  // Napa County
  'American Canyon': 'Napa County',
  Calistoga: 'Napa County',
  Napa: 'Napa County',
  'St. Helena': 'Napa County',
  Yountville: 'Napa County',
  // San Francisco
  'San Francisco': 'San Francisco',
  SF: 'San Francisco',
  // San Mateo County
  Atherton: 'San Mateo County',
  Belmont: 'San Mateo County',
  Brisbane: 'San Mateo County',
  Burlingame: 'San Mateo County',
  'Daly City': 'San Mateo County',
  'East Palo Alto': 'San Mateo County',
  'Foster City': 'San Mateo County',
  'Half Moon Bay': 'San Mateo County',
  'Menlo Park': 'San Mateo County',
  Millbrae: 'San Mateo County',
  Pacifica: 'San Mateo County',
  'Portola Valley': 'San Mateo County',
  'Redwood City': 'San Mateo County',
  'San Bruno': 'San Mateo County',
  'San Carlos': 'San Mateo County',
  'San Mateo': 'San Mateo County',
  'South San Francisco': 'San Mateo County',
  // Santa Clara County
  Alviso: 'Santa Clara County',
  Campbell: 'Santa Clara County',
  Cupertino: 'Santa Clara County',
  Gilroy: 'Santa Clara County',
  'Los Altos': 'Santa Clara County',
  'Los Gatos': 'Santa Clara County',
  Milpitas: 'Santa Clara County',
  'Morgan Hill': 'Santa Clara County',
  'Mountain View': 'Santa Clara County',
  'Palo Alto': 'Santa Clara County',
  'San Jose': 'Santa Clara County',
  'Santa Clara': 'Santa Clara County',
  Saratoga: 'Santa Clara County',
  Sunnyvale: 'Santa Clara County',
  // Solano County
  Benicia: 'Solano County',
  Dixon: 'Solano County',
  Fairfield: 'Solano County',
  'Rio Vista': 'Solano County',
  'Suisun City': 'Solano County',
  Vacaville: 'Solano County',
  Vallejo: 'Solano County',
  // Sonoma County
  Cloverdale: 'Sonoma County',
  Cotati: 'Sonoma County',
  Forestville: 'Sonoma County',
  Guerneville: 'Sonoma County',
  Healdsburg: 'Sonoma County',
  Petaluma: 'Sonoma County',
  'Rohnert Park': 'Sonoma County',
  'Santa Rosa': 'Sonoma County',
  Sebastopol: 'Sonoma County',
  Sonoma: 'Sonoma County',
  Windsor: 'Sonoma County',
};

// All valid Bay Area counties
const BAY_AREA_COUNTIES = [
  'Alameda County',
  'Contra Costa County',
  'Marin County',
  'Napa County',
  'San Francisco',
  'San Mateo County',
  'Santa Clara County',
  'Solano County',
  'Sonoma County',
];

/**
 * Extract geographic info from query (zip code or city name)
 * Returns { city, county } if found, or null
 */
function extractLocation(query) {
  // Check for zip code (5 digits)
  const zipMatch = query.match(/\b(\d{5})\b/);
  if (zipMatch) {
    const zip = zipMatch[1];
    const city = ZIP_TO_CITY[zip];
    if (city) {
      const county = CITY_TO_COUNTY[city];
      return { zip, city, county };
    }
  }

  // Check for city name (case-insensitive)
  const lowerQuery = query.toLowerCase();
  for (const [city, county] of Object.entries(CITY_TO_COUNTY)) {
    if (lowerQuery.includes(city.toLowerCase())) {
      return { city, county };
    }
  }

  // Check for county name directly
  for (const county of BAY_AREA_COUNTIES) {
    if (
      lowerQuery.includes(county.toLowerCase()) ||
      lowerQuery.includes(county.replace(' County', '').toLowerCase())
    ) {
      return { county };
    }
  }

  return null;
}

// Format programs as structured cards for the response
function formatProgramsAsCards(programs) {
  if (!programs || programs.length === 0) return [];

  return programs.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description?.slice(0, 150) + (p.description?.length > 150 ? '...' : ''),
    phone: p.phone || null,
    website: p.website || null,
    areas: p.areas || [],
  }));
}

/**
 * Search Azure AI Search for relevant programs
 */
// Essential synonym mappings for common search terms
// Kept minimal to avoid performance issues while covering key terms
const SYNONYMS = {
  // Demographics
  senior: ['seniors', 'elderly', '65+', '60+'],
  seniors: ['senior', 'elderly', '65+'],
  veteran: ['veterans', 'military', 'vet'],
  veterans: ['veteran', 'military'],
  disabled: ['disability', 'disabilities'],
  disability: ['disabled', 'disabilities'],
  child: ['children', 'kids', 'youth'],
  children: ['child', 'kids', 'youth'],
  infant: ['baby', 'newborn', 'toddler'],
  baby: ['infant', 'newborn', 'toddler'],
  student: ['students', 'college'],
  family: ['families', 'parents'],
  pregnant: ['pregnancy', 'prenatal', 'expecting'],
  homeless: ['unhoused', 'houseless', 'shelter'],
  unhoused: ['homeless', 'houseless'],
  immigrant: ['immigrants', 'refugee'],

  // Food
  food: ['groceries', 'meals', 'hungry', 'calfresh', 'snap', 'ebt'],
  hungry: ['hunger', 'food', 'meals'],
  snap: ['calfresh', 'ebt', 'food stamps'],
  calfresh: ['snap', 'ebt', 'food stamps'],

  // Housing & Utilities
  housing: ['rent', 'shelter', 'apartment'],
  rent: ['rental', 'housing', 'apartment'],
  utility: ['utilities', 'electric', 'gas', 'water'],
  utilities: ['utility', 'electric', 'gas', 'bills'],
  electric: ['electricity', 'power', 'pge'],

  // Transportation
  transportation: ['transit', 'bus', 'bart', 'muni', 'clipper'],
  transit: ['transportation', 'bus', 'bart'],
  bus: ['transit', 'muni'],

  // Healthcare
  health: ['healthcare', 'medical', 'clinic'],
  medical: ['health', 'healthcare', 'doctor'],
  dental: ['dentist', 'teeth'],
  mental: ['mental health', 'therapy', 'counseling'],

  // Childcare & Education
  childcare: ['child care', 'daycare', 'preschool'],
  daycare: ['childcare', 'preschool'],

  // Financial
  bills: ['bill', 'payment'],
  tax: ['taxes', 'vita', 'tax preparation'],
  free: ['discount', 'low cost'],
  discount: ['discounts', 'free', 'reduced'],

  // Legal
  legal: ['lawyer', 'attorney'],
  lawyer: ['attorney', 'legal'],

  // General
  help: ['assistance', 'support', 'program'],
  'low-income': ['income-eligible', 'low income'],
};

/**
 * Check if query matches a common query pattern (cost optimization)
 * Returns { matched: true, keywords } if matched, or { matched: false } if not
 */
function matchCommonQuery(query) {
  if (!commonQueries) return { matched: false };

  const lowerQuery = query.toLowerCase();

  // Check all pattern categories
  for (const [categoryName, patterns] of Object.entries(commonQueries.query_patterns || {})) {
    for (const [patternName, patternData] of Object.entries(patterns)) {
      // Check if any trigger patterns match
      const triggers = patternData.patterns || [];
      for (const trigger of triggers) {
        if (lowerQuery.includes(trigger.toLowerCase())) {
          console.log(`Common query match: ${categoryName}/${patternName} via "${trigger}"`);
          return {
            matched: true,
            keywords: patternData.keywords_to_search || '',
          };
        }
      }
    }
  }

  return { matched: false };
}

/**
 * Detect eligibility group from query (cost optimization)
 * Returns array of detected group IDs with their search keywords
 */
function detectEligibilityGroups(query) {
  if (!eligibilityGroups) return [];

  const lowerQuery = query.toLowerCase();
  const detected = [];

  for (const [groupId, groupData] of Object.entries(eligibilityGroups.groups || {})) {
    const triggers = groupData.trigger_keywords || [];
    for (const trigger of triggers) {
      if (lowerQuery.includes(trigger.toLowerCase())) {
        detected.push({
          id: groupId,
          name: groupData.name,
          matchedTrigger: trigger,
          searchKeywords: groupData.search_keywords || '',
        });
        break; // Only need one match per group
      }
    }
  }

  return detected;
}

/**
 * Detect program category from query (cost optimization)
 * Returns array of detected categories with their search keywords
 */
function detectProgramCategories(query) {
  if (!programCategories) return [];

  const lowerQuery = query.toLowerCase();
  const detected = [];

  for (const [categoryId, categoryData] of Object.entries(programCategories.categories || {})) {
    const triggers = categoryData.trigger_keywords || [];
    for (const trigger of triggers) {
      if (lowerQuery.includes(trigger.toLowerCase())) {
        detected.push({
          id: categoryId,
          name: categoryData.name,
          matchedKeyword: trigger,
          searchKeywords: categoryData.search_keywords || '',
        });
        break;
      }
    }
  }

  return detected;
}

/**
 * Expand query with synonyms and reference document keywords for better matching
 */
function expandQueryWithSynonyms(query) {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);
  const expansions = new Set(words);

  // Add synonyms for each word
  for (const word of words) {
    if (SYNONYMS[word]) {
      SYNONYMS[word].forEach((syn) => expansions.add(syn));
    }
  }

  // Expand using reference documents (cost optimization)
  const detectedCategories = detectProgramCategories(query);
  for (const cat of detectedCategories) {
    // Add category-specific search keywords
    if (cat.searchKeywords) {
      cat.searchKeywords.split(' ').forEach((k) => expansions.add(k));
    }
  }

  const detectedGroups = detectEligibilityGroups(query);
  for (const group of detectedGroups) {
    // Add group-specific search keywords
    if (group.searchKeywords) {
      group.searchKeywords.split(' ').forEach((k) => expansions.add(k));
    }
  }

  // Return expanded terms (limit to avoid overly long queries)
  const expandedTerms = Array.from(expansions).slice(0, 30).join(' ');
  return expandedTerms;
}

async function searchPrograms(query, location = null) {
  if (!AZURE_SEARCH_KEY) {
    console.log('Azure Search not configured, skipping search');
    return [];
  }

  // Expand query with synonyms
  const expandedQuery = expandQueryWithSynonyms(query);
  console.log(`Original query: "${query}" -> Expanded: "${expandedQuery}"`);

  const searchParams = {
    search: expandedQuery,
    queryType: 'simple',
    searchMode: 'any',
    top: 10,
    select: 'id,name,category,description,whatTheyOffer,howToGetIt,groups,areas,city,website,phone',
    searchFields: 'name,category,description,whatTheyOffer,howToGetIt,groups',
  };

  // If location detected, filter to show:
  // 1. Programs in their specific city/county
  // 2. Bay Area-wide programs (always eligible)
  // 3. Statewide programs (always eligible)
  // 4. Nationwide programs (always eligible)
  if (location && location.county) {
    const county = location.county;
    const city = location.city;

    // Build filter: match specific area OR regional/state/national programs
    const areaFilters = [
      `areas/any(a: a eq 'Bay Area')`,
      `areas/any(a: a eq 'Statewide')`,
      `areas/any(a: a eq 'California')`,
      `areas/any(a: a eq 'Nationwide')`,
      `areas/any(a: a eq '${county}')`,
    ];

    // Add city filter if we have it
    if (city) {
      areaFilters.push(`city eq '${city}'`);
      areaFilters.push(`areas/any(a: a eq '${city}')`);
    }

    searchParams.filter = `(${areaFilters.join(' or ')})`;
    console.log(`Location filter applied: ${searchParams.filter}`);
  }

  try {
    const response = await fetch(
      `${AZURE_SEARCH_ENDPOINT}/indexes/${SEARCH_INDEX}/docs/search?api-version=2023-11-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_SEARCH_KEY,
        },
        body: JSON.stringify(searchParams),
      }
    );

    if (!response.ok) {
      console.error('Search error:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Use Cloudflare Workers AI (Llama 3.1 8B) to extract search keywords from natural language query
 * This function is ONLY called when Smart Search is enabled by the user.
 * If Smart Search is off (or offline), the client uses local fuzzy search instead.
 *
 * Cost optimization: Uses reference documents to skip LLM calls when possible
 */
async function extractSearchQuery(userMessage, conversationHistory = []) {
  // Cost optimization #1: Check for common query patterns first
  // This can completely skip the LLM call for frequent questions
  const commonMatch = matchCommonQuery(userMessage);
  if (commonMatch.matched && commonMatch.keywords) {
    console.log(`Common query matched, skipping LLM. Keywords: "${commonMatch.keywords}"`);
    return {
      keywords: commonMatch.keywords,
      skippedLLM: true,
    };
  }

  // Cost optimization #2: For short queries (≤3 words), skip AI and use synonym expansion
  // This saves an API call for simple searches like "food stamps" or "senior transportation"
  const wordCount = userMessage.trim().split(/\s+/).length;
  if (wordCount <= 3) {
    console.log(`Short query (${wordCount} words), using synonym expansion only`);
    return { keywords: expandQueryWithSynonyms(userMessage), skippedLLM: true };
  }

  // Cost optimization #3: If we detected categories/groups, use those keywords
  const detectedCategories = detectProgramCategories(userMessage);
  const detectedGroups = detectEligibilityGroups(userMessage);
  if (detectedCategories.length > 0 || detectedGroups.length > 0) {
    console.log(
      `Detected ${detectedCategories.length} categories, ${detectedGroups.length} groups - using reference keywords`
    );
    return { keywords: expandQueryWithSynonyms(userMessage), skippedLLM: true };
  }

  // =========================================================================
  // TIER 3: Cloudflare Workers AI (free tier - hard stops at 10K neurons/day)
  // =========================================================================
  const cloudflareResult = await tryCloudflareAI(userMessage);
  if (cloudflareResult.success) {
    return {
      keywords: cloudflareResult.keywords,
      skippedLLM: false,
      usedAzure: false,
    };
  }

  // =========================================================================
  // TIER 4: Azure OpenAI (capped at $30/month)
  // =========================================================================
  const azureResult = await tryAzureOpenAI(userMessage);
  if (azureResult.success) {
    return {
      keywords: azureResult.keywords,
      skippedLLM: false,
      usedAzure: true,
    };
  }

  // Final fallback: synonym expansion only
  console.log('All AI tiers exhausted or unavailable, using synonym expansion');
  return { keywords: expandQueryWithSynonyms(userMessage), skippedLLM: true };
}

/**
 * Try Cloudflare Workers AI (Tier 3 - free, hard stops at limit)
 */
async function tryCloudflareAI(userMessage) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.log('Cloudflare Workers AI not configured');
    return { success: false };
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`;

  const extractionPrompt = `You help extract search keywords from natural language queries about assistance programs.

User query: "${userMessage}"

Extract and return ONLY a space-separated list of search terms that would match relevant programs. Include:
- The main topic (childcare, food, housing, transportation, utilities, healthcare, etc.)
- Target demographics if mentioned (seniors, veterans, children, disabled, low-income, infant, youth, elderly, 65+, etc.)
- Specific program types (subsidy, discount, free, emergency, assistance, etc.)
- Related terms that programs might use

Examples:
- "I need affordable childcare for my infant" → "childcare infant child care affordable subsidy preschool daycare baby toddler"
- "I'm a senior who needs help with transportation" → "senior seniors elderly 65+ transportation transit bus ride discount paratransit clipper"
- "Help paying electric bill" → "utility utilities electric energy bill payment assistance LIHEAP PG&E low-income"

Return ONLY the keywords separated by spaces, nothing else:`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You extract search keywords from queries. Return only space-separated keywords, nothing else.',
          },
          { role: 'user', content: extractionPrompt },
        ],
        max_tokens: 60,
        temperature: 0.1,
      }),
    });

    // Check for rate limit (free tier exhausted)
    if (response.status === 429) {
      console.log('Cloudflare free tier exhausted for today');
      return { success: false, rateLimited: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare Workers AI error:', errorText);
      return { success: false };
    }

    const data = await response.json();
    const keywords = data.result?.response?.trim() || '';

    if (keywords) {
      console.log(`Cloudflare Llama 3.1 extracted keywords: "${keywords}"`);
      return { success: true, keywords };
    }

    return { success: false };
  } catch (error) {
    console.error('Cloudflare AI error:', error.message);
    return { success: false };
  }
}

/**
 * Try Azure OpenAI (Tier 4 - capped at $30/month)
 */
async function tryAzureOpenAI(userMessage) {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    console.log('Azure OpenAI not configured');
    return { success: false };
  }

  // Check budget before making the call
  const budgetAvailable = await isAzureBudgetAvailable();
  if (!budgetAvailable) {
    console.log('Azure OpenAI daily budget exhausted');
    return { success: false, budgetExhausted: true };
  }

  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;

  const extractionPrompt = `Extract search keywords from this query about assistance programs.

Query: "${userMessage}"

Return ONLY space-separated keywords that would match relevant programs. Include topics, demographics, and program types.

Keywords:`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You extract search keywords from queries. Return only space-separated keywords, nothing else.',
          },
          { role: 'user', content: extractionPrompt },
        ],
        max_tokens: 60,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      return { success: false };
    }

    const data = await response.json();
    const keywords = data.choices?.[0]?.message?.content?.trim() || '';

    if (keywords) {
      // Track usage for budget control
      await incrementUsage('azure_openai');
      console.log(`Azure GPT-4o-mini extracted keywords: "${keywords}"`);
      return { success: true, keywords };
    }

    return { success: false };
  } catch (error) {
    console.error('Azure OpenAI error:', error.message);
    return { success: false };
  }
}

module.exports = async function (context, req) {
  const logger = createLogger(context, 'smart-assistant');
  const timer = createTimer();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    };
    return;
  }

  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    logger.logRequest(req);

    // Validate configuration (Cloudflare Workers AI for LLM, Azure Search for retrieval)
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      logger.warn('Cloudflare Workers AI not configured, using synonym expansion fallback');
    }
    if (!AZURE_SEARCH_KEY) {
      logger.error('Azure Search not configured', { status: 503 });
      context.res = {
        status: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Smart assistant search is not configured. Please try again later.',
        }),
      };
      return;
    }

    // Parse request
    const { message, conversationHistory = [] } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      logger.warn('Invalid request: missing message', { status: 400 });
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Please provide a message.',
        }),
      };
      return;
    }

    const userMessage = message.trim().slice(0, 500);
    logger.info('Processing query', {
      queryLength: userMessage.length,
      wordCount: userMessage.split(/\s+/).length,
      hasHistory: conversationHistory.length > 0,
    });

    // Extract location from query (zip code, city, or county) - no AI needed
    const location = extractLocation(userMessage);
    if (location) {
      logger.info('Location detected', { location });
    }

    // Also check if we can resolve city to county for contacts
    if (location?.city && !location?.county) {
      const countyKey = getCityCounty(location.city);
      if (countyKey) {
        location.county = quickAnswers?.countyContacts?.[countyKey]?.name || null;
      }
    }

    // =========================================================================
    // TIER 1: Quick Answer Cache (instant, $0)
    // =========================================================================
    const quickAnswerResult = checkQuickAnswer(userMessage, location);

    if (quickAnswerResult.matched) {
      logger.info('Quick answer matched', {
        type: quickAnswerResult.response.type,
        durationMs: timer.elapsed(),
      });

      // For crisis and clarify responses, we may also want to search for programs
      let programs = [];
      let programCards = [];

      if (quickAnswerResult.response.search) {
        programs = await searchPrograms(quickAnswerResult.response.search, location);
        programCards = formatProgramsAsCards(programs);
      }

      const responseBody = {
        quickAnswer: quickAnswerResult.response,
        programs: programCards,
        programsFound: programs.length,
        searchQuery: quickAnswerResult.response.search || userMessage,
        location: location || null,
        tier: 'quick_answer',
        skippedLLM: true,
      };

      context.res = {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(responseBody),
      };

      logger.logResponse(200, responseBody, timer.elapsed());
      return;
    }

    // =========================================================================
    // TIER 2: Local pattern matching + fuzzy search ($0)
    // =========================================================================
    // Search for relevant programs using local keyword expansion
    // Cost optimization: extractSearchQuery tries to skip LLM calls
    const searchResult = await extractSearchQuery(userMessage, conversationHistory);
    const searchQuery = searchResult.keywords;

    logger.debug('Search query extracted', {
      original: userMessage,
      expanded: searchQuery,
      skippedLLM: searchResult.skippedLLM,
      tier: searchResult.skippedLLM ? 'local' : 'ai',
    });

    const programs = await searchPrograms(searchQuery, location);
    logger.info('Search completed', {
      programsFound: programs.length,
      searchQuery,
      hasLocation: !!location,
      skippedLLM: searchResult.skippedLLM,
    });

    // Determine which tier was used
    let tier = 'local';
    if (!searchResult.skippedLLM) {
      tier = searchResult.usedAzure ? 'azure_openai' : 'cloudflare';
    }

    // Return structured program cards directly (no AI response formatting needed)
    const programCards = formatProgramsAsCards(programs);

    const responseBody = {
      quickAnswer: null,
      programs: programCards,
      programsFound: programs.length,
      searchQuery: searchQuery,
      location: location || null,
      tier,
      skippedLLM: searchResult.skippedLLM,
    };

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseBody),
    };

    logger.logResponse(200, responseBody, timer.elapsed());
  } catch (error) {
    logger.error('Smart assistant error', {
      ...extractErrorInfo(error),
      durationMs: timer.elapsed(),
    });

    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Something went wrong. Please try again.',
      }),
    };
  }
};
