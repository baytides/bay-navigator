#!/usr/bin/env node
/**
 * Generate Simple Language Descriptions for Bay Navigator
 *
 * Uses Carl (self-hosted Llama) to pre-generate 8th-grade reading level
 * versions of program descriptions at build time.
 *
 * Usage:
 *   CARL_API_KEY=xxx node scripts/generate-simple-language-descriptions.cjs
 *
 * Options:
 *   --force    Force regeneration of all descriptions
 *   --limit N  Only process N programs (for testing)
 *
 * Environment variables:
 *   CARL_API_KEY       - API key for Carl (ai.baytides.org)
 *   CARL_ENDPOINT      - Custom endpoint (default: https://ai.baytides.org/api/chat)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'simple-descriptions.json');
const HASH_FILE = path.join(__dirname, '..', '.simple-language-hashes.json');

// Carl (Ollama) configuration
const CARL_ENDPOINT = process.env.CARL_ENDPOINT || 'https://ai.baytides.org/api/chat';
const CARL_API_KEY = process.env.CARL_API_KEY || process.env.PUBLIC_OLLAMA_API_KEY || '';
const CARL_MODEL = 'qwen2.5:3b-instruct';

// Rate limiting
const RATE_LIMIT_DELAY_MS = 500;
const BATCH_SIZE = 5;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRIES = 3;

// Program YAML files to process
const PROGRAM_FILES = [
  'community.yml',
  'education.yml',
  'employment.yml',
  'equipment.yml',
  'federal-benefits.yml',
  'finance.yml',
  'food.yml',
  'health.yml',
  'housing.yml',
  'legal.yml',
  'library_resources.yml',
  'pet_resources.yml',
  'recreation.yml',
  'technology.yml',
  'transportation.yml',
  'utilities.yml',
  'sfserviceguide.yml',
];

// Fields to simplify
const FIELDS_TO_SIMPLIFY = ['description', 'what_they_offer', 'how_to_get_it'];

// Brand names and terms to preserve (don't simplify these)
const PRESERVE_TERMS = [
  'CalFresh',
  'Medi-Cal',
  'BenefitsCal',
  'Medicare',
  'Medicaid',
  'SNAP',
  'WIC',
  'EBT',
  'SSI',
  'SSDI',
  'EITC',
  'VITA',
  'BART',
  'Muni',
  'Caltrain',
  'AC Transit',
  'VTA',
  'SamTrans',
  'PG&E',
  'CARE',
  'FERA',
  'LIHEAP',
  'Section 8',
  'HUD',
  'VA',
  'Bay Area',
  'San Francisco',
  'Oakland',
  'San Jose',
  '2-1-1',
  '211',
  '911',
  '988',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a hash of a string for change detection
 */
function hashString(str) {
  if (!str) return '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

/**
 * Load hash file
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

/**
 * Load existing simple descriptions
 */
function loadExistingDescriptions() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      return data.programs || {};
    }
  } catch (e) {
    console.warn('Could not load existing descriptions, starting fresh');
  }
  return {};
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CARL API
// ============================================================================

/**
 * Check if Carl is available
 */
async function checkCarlHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(CARL_ENDPOINT.replace('/api/chat', '/api/tags'), {
      method: 'GET',
      headers: {
        'X-API-Key': CARL_API_KEY,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Call Carl to simplify text
 */
async function simplifyText(text, programName) {
  const preserveList = PRESERVE_TERMS.join(', ');

  const systemPrompt = `You are a plain language expert. Rewrite text at an 8th grade reading level (Flesch-Kincaid grade 8 or below).

Rules:
- Use short sentences (15-20 words max)
- Use common, everyday words
- Keep the same meaning
- Keep bullet points and numbered lists if present
- Keep these terms unchanged: ${preserveList}
- Keep phone numbers, addresses, and URLs unchanged
- Output ONLY the simplified text, no explanations`;

  const userPrompt = `Simplify this program description for "${programName}":

${text}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(CARL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CARL_API_KEY,
      },
      body: JSON.stringify({
        model: CARL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Carl API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.message?.content || data.response || '';
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Simplify with retry logic
 */
async function simplifyWithRetry(text, programName, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await simplifyText(text, programName);
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`      Retry ${attempt}/${retries} for "${programName.slice(0, 30)}..."`);
      await sleep(1000 * attempt);
    }
  }
}

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load all program data from YAML files
 */
function loadProgramData() {
  const programs = [];

  for (const filename of PROGRAM_FILES) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);

      if (!Array.isArray(data)) continue;

      for (const program of data) {
        if (!program.id || !program.name) continue;

        // Build content hash from all simplifiable fields
        const contentParts = FIELDS_TO_SIMPLIFY.map((f) => program[f] || '').join('|');
        const contentHash = hashString(contentParts);

        programs.push({
          id: program.id,
          name: program.name,
          description: program.description || '',
          what_they_offer: program.what_they_offer || '',
          how_to_get_it: program.how_to_get_it || '',
          contentHash,
          source: filename,
        });
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${filename}: ${e.message}`);
    }
  }

  return programs;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

  console.log('📝 Bay Navigator Simple Language Generator\n');

  // Check Carl availability
  console.log('🔍 Checking Carl availability...');
  const carlAvailable = await checkCarlHealth();

  if (!carlAvailable) {
    console.log('⚠️  Carl AI server unavailable - skipping generation');
    console.log('   Build will use existing simple-descriptions.json');
    process.exit(0);
  }
  console.log('   ✓ Carl is available\n');

  // Load data
  console.log('📖 Loading program data...');
  const programs = loadProgramData();
  console.log(`   Found ${programs.length} programs\n`);

  // Load existing data
  const existingHashes = loadHashes();
  const existingDescriptions = loadExistingDescriptions();

  // Find programs that need processing
  let toProcess = [];

  for (const program of programs) {
    const existingHash = existingHashes[program.id];
    const hasExisting = existingDescriptions[program.id];

    if (forceRegenerate || !existingHash || existingHash !== program.contentHash || !hasExisting) {
      toProcess.push(program);
    }
  }

  // Apply limit if specified
  if (limit && limit > 0) {
    toProcess = toProcess.slice(0, limit);
    console.log(`   (Limited to ${limit} programs for testing)\n`);
  }

  if (toProcess.length === 0) {
    console.log('✓ All programs up to date - nothing to generate\n');

    // Still write output file to ensure it exists
    writeOutput(existingDescriptions, existingHashes, programs);
    return;
  }

  console.log(`🔄 Processing ${toProcess.length} programs...\n`);

  // Process in batches
  const results = { ...existingDescriptions };
  const newHashes = { ...existingHashes };
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);

    console.log(`   Batch ${batchNum}/${totalBatches}...`);

    for (const program of batch) {
      try {
        const simplified = {};

        for (const field of FIELDS_TO_SIMPLIFY) {
          const text = program[field];
          if (text && text.trim().length > 50) {
            // Only simplify substantial text
            const simplifiedText = await simplifyWithRetry(text, program.name);
            if (simplifiedText) {
              simplified[field] = simplifiedText.trim();
            }
          } else if (text) {
            // Keep short text as-is
            simplified[field] = text;
          }
        }

        if (Object.keys(simplified).length > 0) {
          results[program.id] = simplified;
          newHashes[program.id] = program.contentHash;
          processed++;
        }

        // Rate limiting
        await sleep(RATE_LIMIT_DELAY_MS);
      } catch (error) {
        console.warn(`      ✗ Failed: ${program.name.slice(0, 40)}... - ${error.message}`);

        // Keep existing if available
        if (existingDescriptions[program.id]) {
          results[program.id] = existingDescriptions[program.id];
        }
        failed++;
      }
    }
  }

  console.log(`\n✅ Processed ${processed} programs (${failed} failed)\n`);

  // Write output
  writeOutput(results, newHashes, programs);
}

/**
 * Write output files
 */
function writeOutput(results, hashes, allPrograms) {
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean up: remove programs that no longer exist
  const validIds = new Set(allPrograms.map((p) => p.id));
  const cleanedResults = {};
  const cleanedHashes = {};

  for (const id of Object.keys(results)) {
    if (validIds.has(id)) {
      cleanedResults[id] = results[id];
      cleanedHashes[id] = hashes[id];
    }
  }

  // Write output JSON
  const output = {
    generated: new Date().toISOString(),
    version: '1.0.0',
    model: CARL_MODEL,
    readingLevel: '8th grade',
    totalPrograms: Object.keys(cleanedResults).length,
    programs: cleanedResults,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`📁 Written to ${OUTPUT_FILE}`);
  console.log(`   ${Object.keys(cleanedResults).length} programs with simplified descriptions\n`);

  // Save hashes
  saveHashes(cleanedHashes);
  console.log(`📁 Updated ${HASH_FILE}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
