#!/usr/bin/env node
/**
 * Azure Translator Script for Bay Navigator i18n
 *
 * Generates TypeScript translation files for:
 * 1. UI strings (src/i18n/en.json)
 * 2. Program data (names, descriptions from YAML files)
 *
 * Output: Single TypeScript file per language (e.g., es.ts, zh-Hans.ts)
 *
 * Usage:
 *   AZURE_TRANSLATOR_KEY=xxx node scripts/translate-i18n.cjs
 *
 * Environment variables:
 *   AZURE_TRANSLATOR_KEY    - Azure Translator API key
 *   AZURE_TRANSLATOR_REGION - Azure region (default: westus2)
 *
 * Incremental translation: Only translates changed strings using hash tracking.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const yaml = require('js-yaml');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Output to shared/i18n so Flutter, web, and other apps can access translations
const I18N_DIR = path.join(__dirname, '..', 'shared', 'i18n');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const UI_STRINGS_FILE = path.join(__dirname, '..', 'src', 'i18n', 'en.json');
const HASH_FILE = path.join(__dirname, '..', '.i18n-hashes.json');
const SOURCE_LANG = 'en';

// Rate limiting configuration for Azure free tier (F0: 2M chars/month)
// S1 tier has 10M chars/month - upgrade if needed
const RATE_LIMIT_DELAY_MS = 500; // Delay between batches
const BATCH_SIZE = 50; // Smaller batches to avoid rate limits

// Target languages with Azure Translator codes
// Bay Area demographics: Spanish, Chinese (Simplified + Traditional), Vietnamese,
// Filipino, Korean, Russian, French, Arabic
const TARGET_LANGUAGES = [
  { code: 'es', name: 'Spanish', file: 'es' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', file: 'zh-Hans' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', file: 'zh-Hant' },
  { code: 'vi', name: 'Vietnamese', file: 'vi' },
  { code: 'fil', name: 'Filipino', file: 'fil' }, // Azure uses 'fil' not 'tl'
  { code: 'ko', name: 'Korean', file: 'ko' },
  { code: 'ru', name: 'Russian', file: 'ru' },
  { code: 'fr', name: 'French', file: 'fr' },
  { code: 'ar', name: 'Arabic', file: 'ar' },
];

// Azure Translator API endpoint
const TRANSLATOR_ENDPOINT = 'api.cognitive.microsofttranslator.com';

// Program YAML files to translate (excludes config files)
const PROGRAM_FILES = [
  'community.yml',
  'education.yml',
  'equipment.yml',
  'federal-benefits.yml',
  'finance.yml',
  'food.yml',
  'health.yml',
  'legal.yml',
  'library_resources.yml',
  'pet_resources.yml',
  'recreation.yml',
  'technology.yml',
  'transportation.yml',
  'utilities.yml',
];

// Fields to translate in program data
const TRANSLATABLE_FIELDS = [
  'name',
  'description',
  'what_they_offer',
  'how_to_get_it',
  'eligibility',
  'timeframe',
  'link_text',
];

// Strings that should NOT be translated (brand names, technical terms)
const DO_NOT_TRANSLATE = [
  'Bay Navigator',
  'CalFresh',
  'Medi-Cal',
  'BenefitsCal',
  'GetCalFresh.org',
  'Bay Area Legal Aid',
  'LGBTQ+',
  '511.org',
  'Caltrans',
  'Azure Maps',
  '2-1-1',
  '911',
  '988',
  'EBT',
  'SNAP',
  'WIC',
  'SSI',
  'SSDI',
  'Medicare',
  'Medicaid',
  'BART',
  'Muni',
  'Caltrain',
  'AC Transit',
  'VTA',
  'SamTrans',
  'Golden Gate Transit',
  'EITC',
  'VITA',
  'PG&E',
  'CARE',
  'FERA',
  'LIHEAP',
  'Section 8',
  'HUD',
  'VA',
  'COVID-19',
  'Wi-Fi',
  'WiFi',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a hash of a string for change detection
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

/**
 * Flatten nested object to dot-notation keys
 */
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }
  return result;
}

/**
 * Unflatten dot-notation keys back to nested object
 */
function unflattenObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  return result;
}

/**
 * Protect strings that shouldn't be translated
 */
function protectStrings(text) {
  let protected = text;
  const placeholders = [];

  // Protect DO_NOT_TRANSLATE terms
  DO_NOT_TRANSLATE.forEach((term, i) => {
    const placeholder = `[[DNT${i}]]`;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(protected)) {
      protected = protected.replace(regex, placeholder);
      placeholders.push({ placeholder, term });
    }
  });

  // Protect interpolation placeholders like {count}
  const interpolationRegex = /\{(\w+)\}/g;
  let match;
  let interpolationIndex = 0;
  while ((match = interpolationRegex.exec(text)) !== null) {
    const placeholder = `[[INT${interpolationIndex}]]`;
    protected = protected.replace(match[0], placeholder);
    placeholders.push({ placeholder, term: match[0] });
    interpolationIndex++;
  }

  // Protect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let urlIndex = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    const placeholder = `[[URL${urlIndex}]]`;
    protected = protected.replace(match[0], placeholder);
    placeholders.push({ placeholder, term: match[0] });
    urlIndex++;
  }

  // Protect phone numbers
  const phoneRegex = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{1}-\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
  let phoneIndex = 0;
  while ((match = phoneRegex.exec(text)) !== null) {
    const placeholder = `[[PHONE${phoneIndex}]]`;
    protected = protected.replace(match[0], placeholder);
    placeholders.push({ placeholder, term: match[0] });
    phoneIndex++;
  }

  return { protected, placeholders };
}

/**
 * Escape string for use in RegExp
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Restore protected strings after translation
 */
function restoreStrings(text, placeholders) {
  let restored = text;
  for (const { placeholder, term } of placeholders) {
    // Handle cases where translator might add spaces around placeholders
    // Use proper regex escaping for safety
    const escapedPlaceholder = escapeRegExp(placeholder);
    const regex = new RegExp(`\\s*${escapedPlaceholder}\\s*`, 'g');
    restored = restored.replace(regex, term);
  }
  return restored;
}

/**
 * Load or create hash file
 */
function loadHashes() {
  try {
    if (fs.existsSync(HASH_FILE)) {
      return JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load hash file, starting fresh');
  }
  return {};
}

/**
 * Save hash file
 */
function saveHashes(hashes) {
  fs.writeFileSync(HASH_FILE, JSON.stringify(hashes, null, 2));
}

// ============================================================================
// AZURE TRANSLATOR API
// ============================================================================

/**
 * Call Azure Translator API
 */
async function translateTexts(texts, targetLang, apiKey, region) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(texts.map((text) => ({ text })));

    const options = {
      hostname: TRANSLATOR_ENDPOINT,
      path: `/translate?api-version=3.0&from=${SOURCE_LANG}&to=${targetLang}`,
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Azure Translator API error: ${res.statusCode} - ${data}`));
          return;
        }
        try {
          const result = JSON.parse(data);
          const translations = result.map((item) => item.translations[0].text);
          resolve(translations);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch translate with protection and rate limiting
 */
async function batchTranslate(items, targetLang, apiKey, region) {
  const results = [];

  // Prepare texts with protection
  const protectedItems = items.map((item) => ({
    key: item.key,
    original: item.value,
    ...protectStrings(item.value),
  }));

  const textsToTranslate = protectedItems.map((p) => p.protected);
  const totalBatches = Math.ceil(textsToTranslate.length / BATCH_SIZE);

  // Batch translate with rate limiting
  for (let i = 0; i < textsToTranslate.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = textsToTranslate.slice(i, i + BATCH_SIZE);

    // Retry logic for rate limiting
    let retries = 0;
    const maxRetries = 3;
    let batchResults;

    while (retries < maxRetries) {
      try {
        batchResults = await translateTexts(batch, targetLang, apiKey, region);
        break;
      } catch (error) {
        if (error.message.includes('429') && retries < maxRetries - 1) {
          retries++;
          const waitTime = RATE_LIMIT_DELAY_MS * Math.pow(2, retries); // Exponential backoff
          console.log(
            `      Rate limited, waiting ${waitTime}ms (retry ${retries}/${maxRetries})...`
          );
          await sleep(waitTime);
        } else {
          throw error;
        }
      }
    }

    // Restore protected strings
    for (let j = 0; j < batchResults.length; j++) {
      const idx = i + j;
      const restored = restoreStrings(batchResults[j], protectedItems[idx].placeholders);
      results.push({
        key: protectedItems[idx].key,
        value: restored,
      });
    }

    // Progress indicator
    if (totalBatches > 1) {
      process.stdout.write(`\r      Batch ${batchNum}/${totalBatches}...`);
    }

    // Rate limiting: wait between batches
    if (i + BATCH_SIZE < textsToTranslate.length) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  if (totalBatches > 1) {
    process.stdout.write('\r' + ' '.repeat(40) + '\r'); // Clear progress line
  }

  return results;
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Load UI strings from en.json
 */
function loadUIStrings() {
  if (!fs.existsSync(UI_STRINGS_FILE)) {
    console.error(`Error: Source file not found: ${UI_STRINGS_FILE}`);
    process.exit(1);
  }
  const enData = JSON.parse(fs.readFileSync(UI_STRINGS_FILE, 'utf8'));
  return flattenObject(enData);
}

/**
 * Load program data from YAML files
 */
function loadProgramData() {
  const programs = {};

  for (const filename of PROGRAM_FILES) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Program file not found: ${filePath}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);

      if (!Array.isArray(data)) continue;

      for (const program of data) {
        if (!program.id) continue;

        for (const field of TRANSLATABLE_FIELDS) {
          if (program[field] && typeof program[field] === 'string') {
            const key = `programs.${program.id}.${field}`;
            programs[key] = program[field].trim();
          }
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${filename}: ${e.message}`);
    }
  }

  return programs;
}

// ============================================================================
// TYPESCRIPT GENERATION
// ============================================================================

/**
 * Generate TypeScript file for a language
 */
function generateTypeScriptFile(langCode, langName, uiTranslations, programTranslations) {
  const ui = unflattenObject(uiTranslations);
  const programs = {};

  // Organize program translations by program ID
  for (const [key, value] of Object.entries(programTranslations)) {
    // key format: programs.{id}.{field}
    const parts = key.split('.');
    if (parts.length === 3 && parts[0] === 'programs') {
      const [, id, field] = parts;
      if (!programs[id]) programs[id] = {};
      programs[id][field] = value;
    }
  }

  const content = `/**
 * ${langName} translations for Bay Navigator
 * Auto-generated by Azure Translator - DO NOT EDIT MANUALLY
 * Generated: ${new Date().toISOString()}
 */

import type { TranslationData, ProgramTranslations } from './types';

export const ui: TranslationData = ${JSON.stringify(ui, null, 2)};

export const programs: ProgramTranslations = ${JSON.stringify(programs, null, 2)};

export default { ui, programs };
`;

  return content;
}

/**
 * Generate types file
 */
function generateTypesFile(uiKeys) {
  const uiStructure = unflattenObject(Object.fromEntries(uiKeys.map((k) => [k, 'string'])));

  // Generate type from structure
  function generateTypeFromStructure(obj, indent = 2) {
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
      const pad = ' '.repeat(indent);
      if (typeof value === 'object') {
        lines.push(`${pad}${key}: {`);
        lines.push(generateTypeFromStructure(value, indent + 2));
        lines.push(`${pad}};`);
      } else {
        lines.push(`${pad}${key}: string;`);
      }
    }
    return lines.join('\n');
  }

  const content = `/**
 * TypeScript types for Bay Navigator i18n
 * Auto-generated - DO NOT EDIT MANUALLY
 */

export interface TranslationData {
${generateTypeFromStructure(uiStructure)}
}

export interface ProgramTranslation {
  name?: string;
  description?: string;
  what_they_offer?: string;
  how_to_get_it?: string;
  eligibility?: string;
  timeframe?: string;
  link_text?: string;
}

export type ProgramTranslations = Record<string, ProgramTranslation>;

export type Locale = 'en' | ${TARGET_LANGUAGES.map((l) => `'${l.file}'`).join(' | ')};

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
}

export const locales: Record<Locale, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  'zh-Hans': { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  'zh-Hant': { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  fil: { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
};
`;

  return content;
}

/**
 * Generate English base file
 */
function generateEnglishFile(uiStrings, programStrings) {
  const ui = unflattenObject(uiStrings);
  const programs = {};

  for (const [key, value] of Object.entries(programStrings)) {
    const parts = key.split('.');
    if (parts.length === 3 && parts[0] === 'programs') {
      const [, id, field] = parts;
      if (!programs[id]) programs[id] = {};
      programs[id][field] = value;
    }
  }

  const content = `/**
 * English (source) translations for Bay Navigator
 * This is the source of truth - edit this file to update translations
 */

import type { TranslationData, ProgramTranslations } from './types';

export const ui: TranslationData = ${JSON.stringify(ui, null, 2)};

export const programs: ProgramTranslations = ${JSON.stringify(programs, null, 2)};

export default { ui, programs };
`;

  return content;
}

/**
 * Generate index file that exports all translations
 */
function generateIndexFile() {
  const imports = [
    `import type { Locale, TranslationData, ProgramTranslations, ProgramTranslation } from './types';`,
    `export type { Locale, TranslationData, ProgramTranslations, ProgramTranslation } from './types';`,
    `export { locales } from './types';`,
    ``,
    `// Static imports for English (always loaded)`,
    `import en from './en';`,
    ``,
    `// Lazy loaders for other languages`,
  ];

  for (const lang of TARGET_LANGUAGES) {
    imports.push(`const load${lang.file.replace('-', '')} = () => import('./${lang.file}');`);
  }

  const content = `${imports.join('\n')}

// Translation cache
const cache: Partial<Record<Locale, { ui: TranslationData; programs: ProgramTranslations }>> = {
  en,
};

/**
 * Load translations for a locale
 */
export async function loadTranslations(locale: Locale): Promise<{ ui: TranslationData; programs: ProgramTranslations }> {
  if (cache[locale]) {
    return cache[locale]!;
  }

  let data: { ui: TranslationData; programs: ProgramTranslations };

  switch (locale) {
${TARGET_LANGUAGES.map(
  (lang) => `    case '${lang.file}':
      data = (await load${lang.file.replace('-', '')}()).default;
      break;`
).join('\n')}
    default:
      return en;
  }

  cache[locale] = data;
  return data;
}

/**
 * Get UI translation
 */
export function t(
  key: string,
  translations: TranslationData,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: unknown = translations;

  for (const k of keys) {
    if (typeof value !== 'object' || value === null) {
      return key; // Key not found, return key itself
    }
    value = (value as Record<string, unknown>)[k];
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Interpolate parameters
  if (params) {
    return value.replace(/\\{(\\w+)\\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  }

  return value;
}

/**
 * Get program translation with fallback to English
 */
export function getProgramTranslation(
  programId: string,
  field: keyof ProgramTranslation,
  translations: ProgramTranslations,
  fallback: string
): string {
  const program = translations[programId];
  if (program && program[field]) {
    return program[field]!;
  }
  return fallback;
}

// Re-export English as default
export default en;
`;

  return content;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const apiKey = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION || 'westus2';

  if (!apiKey) {
    console.error('Error: AZURE_TRANSLATOR_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🌐 Bay Navigator i18n Translation\n');
  console.log(`Target languages: ${TARGET_LANGUAGES.map((l) => l.name).join(', ')}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(I18N_DIR)) {
    fs.mkdirSync(I18N_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${I18N_DIR}\n`);
  }

  // Load source data
  console.log('📖 Loading source data...');
  const uiStrings = loadUIStrings();
  const programStrings = loadProgramData();

  console.log(`   UI strings: ${Object.keys(uiStrings).length}`);
  console.log(`   Program strings: ${Object.keys(programStrings).length}`);

  // Combine all strings
  const allStrings = { ...uiStrings, ...programStrings };
  const allKeys = Object.keys(allStrings);

  // Calculate current hashes
  const currentHashes = {};
  for (const [key, value] of Object.entries(allStrings)) {
    currentHashes[key] = hashString(String(value));
  }

  // Load existing hashes
  const hashes = loadHashes();

  // Generate types file
  console.log('\n📝 Generating types file...');
  const typesContent = generateTypesFile(Object.keys(uiStrings));
  fs.writeFileSync(path.join(I18N_DIR, 'types.ts'), typesContent);
  console.log('   ✓ types.ts');

  // Generate English file
  console.log('\n📝 Generating English source file...');
  const enContent = generateEnglishFile(uiStrings, programStrings);
  fs.writeFileSync(path.join(I18N_DIR, 'en.ts'), enContent);
  console.log('   ✓ en.ts');

  // Process each target language
  for (const lang of TARGET_LANGUAGES) {
    console.log(`\n🔄 Processing ${lang.name} (${lang.code})...`);

    // Load existing translations if any
    const existingPath = path.join(I18N_DIR, `${lang.file}.ts`);
    let existingTranslations = { ui: {}, programs: {} };

    if (fs.existsSync(existingPath)) {
      try {
        // Parse existing file to extract translations
        const content = fs.readFileSync(existingPath, 'utf8');
        const uiMatch = content.match(/export const ui[^=]*=\s*({[\s\S]*?});/);
        const programsMatch = content.match(/export const programs[^=]*=\s*({[\s\S]*?});/);

        if (uiMatch) {
          existingTranslations.ui = flattenObject(eval(`(${uiMatch[1]})`));
        }
        if (programsMatch) {
          const programsObj = eval(`(${programsMatch[1]})`);
          for (const [id, fields] of Object.entries(programsObj)) {
            for (const [field, value] of Object.entries(fields)) {
              existingTranslations.programs[`programs.${id}.${field}`] = value;
            }
          }
        }
      } catch (e) {
        console.log(`   Warning: Could not parse existing ${lang.file}.ts`);
      }
    }

    const existingAll = { ...existingTranslations.ui, ...existingTranslations.programs };

    // Find strings that need translation
    const langHashes = hashes[lang.code] || {};
    const toTranslate = [];

    for (const [key, value] of Object.entries(allStrings)) {
      const currentHash = currentHashes[key];
      const previousHash = langHashes[key];

      // Translate if: new string, changed string, or missing translation
      if (currentHash !== previousHash || !existingAll[key]) {
        toTranslate.push({ key, value: String(value) });
      }
    }

    if (toTranslate.length === 0) {
      console.log(`   ✓ All ${allKeys.length} strings up to date`);
      continue;
    }

    console.log(`   → Translating ${toTranslate.length} strings...`);

    try {
      // Translate
      const translations = await batchTranslate(toTranslate, lang.code, apiKey, region);

      // Merge with existing
      const newTranslations = { ...existingAll };
      const newHashes = { ...langHashes };

      for (const { key, value } of translations) {
        newTranslations[key] = value;
        newHashes[key] = currentHashes[key];
      }

      // Remove keys that no longer exist in source
      for (const key of Object.keys(newTranslations)) {
        if (!(key in allStrings)) {
          delete newTranslations[key];
          delete newHashes[key];
        }
      }

      // Split back into UI and programs
      const uiTranslations = {};
      const programTranslations = {};

      for (const [key, value] of Object.entries(newTranslations)) {
        if (key.startsWith('programs.')) {
          programTranslations[key] = value;
        } else {
          uiTranslations[key] = value;
        }
      }

      // Generate TypeScript file
      const tsContent = generateTypeScriptFile(
        lang.code,
        lang.name,
        uiTranslations,
        programTranslations
      );
      fs.writeFileSync(path.join(I18N_DIR, `${lang.file}.ts`), tsContent);
      console.log(`   ✓ ${lang.file}.ts (${Object.keys(newTranslations).length} strings)`);

      // Also generate JSON files for this language (for Flutter/cross-platform)
      const langJsonDir = path.join(I18N_DIR, 'json');
      if (!fs.existsSync(langJsonDir)) {
        fs.mkdirSync(langJsonDir, { recursive: true });
      }

      // UI JSON
      fs.writeFileSync(
        path.join(langJsonDir, `${lang.file}-ui.json`),
        JSON.stringify(unflattenObject(uiTranslations), null, 2)
      );

      // Programs JSON
      const programsObj = {};
      for (const [key, value] of Object.entries(programTranslations)) {
        const parts = key.split('.');
        if (parts.length === 3 && parts[0] === 'programs') {
          const [, id, field] = parts;
          if (!programsObj[id]) programsObj[id] = {};
          programsObj[id][field] = value;
        }
      }
      fs.writeFileSync(
        path.join(langJsonDir, `${lang.file}-programs.json`),
        JSON.stringify(programsObj, null, 2)
      );

      // Update hashes
      hashes[lang.code] = newHashes;
    } catch (error) {
      console.error(`   ✗ Error: ${error.message}`);
    }
  }

  // Generate index file
  console.log('\n📝 Generating index file...');
  const indexContent = generateIndexFile();
  fs.writeFileSync(path.join(I18N_DIR, 'index.ts'), indexContent);
  console.log('   ✓ index.ts');

  // Also generate JSON versions for cross-platform compatibility (Flutter, etc.)
  console.log('\n📝 Generating JSON files for cross-platform use...');
  const jsonDir = path.join(I18N_DIR, 'json');
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  // Copy English UI strings
  fs.copyFileSync(UI_STRINGS_FILE, path.join(jsonDir, 'en-ui.json'));
  console.log('   ✓ json/en-ui.json');

  // Generate programs JSON for English
  const enProgramsPath = path.join(jsonDir, 'en-programs.json');
  const enPrograms = {};
  for (const [key, value] of Object.entries(programStrings)) {
    const parts = key.split('.');
    if (parts.length === 3 && parts[0] === 'programs') {
      const [, id, field] = parts;
      if (!enPrograms[id]) enPrograms[id] = {};
      enPrograms[id][field] = value;
    }
  }
  fs.writeFileSync(enProgramsPath, JSON.stringify(enPrograms, null, 2));
  console.log('   ✓ json/en-programs.json');

  // Save hash file
  saveHashes(hashes);

  console.log('\n✅ Translation complete!');

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Source strings: ${allKeys.length}`);
  console.log(`   Languages: ${TARGET_LANGUAGES.length + 1} (including English)`);

  const files = fs.readdirSync(I18N_DIR).filter((f) => f.endsWith('.ts'));
  console.log(`\n📁 Generated files:`);
  for (const file of files) {
    const stats = fs.statSync(path.join(I18N_DIR, file));
    console.log(`   ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
