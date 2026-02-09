#!/usr/bin/env node
/**
 * AI-Assisted Program Categorization for Bay Navigator
 *
 * Uses Carl (self-hosted Llama) to suggest category, groups, area, and keywords
 * for new or uncategorized programs.
 *
 * Usage:
 *   Interactive mode:
 *     node scripts/categorize-program.cjs --interactive
 *
 *   Single program from YAML file:
 *     node scripts/categorize-program.cjs --file src/data/new-program.yml --id program-id
 *
 *   Bulk categorize programs missing metadata:
 *     node scripts/categorize-program.cjs --audit
 *
 * Environment variables:
 *   CARL_API_KEY  - API key for Carl (ai.baytides.org)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CARL_ENDPOINT = process.env.CARL_ENDPOINT || 'https://ai.baytides.org/api/chat';
const CARL_API_KEY = process.env.CARL_API_KEY || process.env.PUBLIC_OLLAMA_API_KEY || '';
const CARL_MODEL = 'qwen2.5:3b-instruct';
const REQUEST_TIMEOUT_MS = 60000;

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Valid categories
const VALID_CATEGORIES = [
  'community',
  'education',
  'employment',
  'equipment',
  'finance',
  'food',
  'health',
  'housing',
  'legal',
  'library_resources',
  'pet_resources',
  'recreation',
  'technology',
  'transportation',
  'utilities',
];

// Valid target groups
const VALID_GROUPS = [
  'everyone',
  'income-eligible',
  'seniors',
  'youth',
  'college-students',
  'veterans',
  'families',
  'disability',
  'lgbtq',
  'first-responders',
  'teachers',
  'unemployed',
  'immigrants',
  'unhoused',
  'pregnant',
  'caregivers',
  'foster-youth',
  'reentry',
  'nonprofits',
];

// Valid areas
const VALID_AREAS = [
  'Alameda County',
  'Contra Costa County',
  'Marin County',
  'Napa County',
  'San Francisco',
  'San Mateo County',
  'Santa Clara County',
  'Solano County',
  'Sonoma County',
  'Bay Area',
  'Statewide',
  'Nationwide',
];

// ============================================================================
// CARL API
// ============================================================================

/**
 * Call Carl to categorize a program
 */
async function categorizeProgram(name, description, whatTheyOffer = '', howToGetIt = '') {
  const systemPrompt = `You are an expert at categorizing social services programs for the Bay Area.

Given a program's name and description, you must suggest:
1. A single category from this list: ${VALID_CATEGORIES.join(', ')}
2. Target groups from this list: ${VALID_GROUPS.join(', ')}
3. Geographic area from this list: ${VALID_AREAS.join(', ')}
4. 5-10 search keywords that people might use to find this program

Respond ONLY with valid JSON in this exact format:
{
  "category": "one_category",
  "groups": ["group1", "group2"],
  "area": "Area Name",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Important rules:
- Use ONLY values from the provided lists for category, groups, and area
- If a program serves everyone, use "everyone" as the only group
- If multiple groups apply, list all relevant ones
- Keywords should be lowercase and relevant to how people search`;

  const userPrompt = `Categorize this program:

Name: ${name}

Description: ${description}

${whatTheyOffer ? `What they offer: ${whatTheyOffer}` : ''}

${howToGetIt ? `How to get it: ${howToGetIt}` : ''}`;

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
          temperature: 0.2,
          num_predict: 300,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Carl API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.message?.content || data.response || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and clean up
    return validateResult(result);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Validate and clean up categorization result
 */
function validateResult(result) {
  const cleaned = {
    category: null,
    groups: [],
    area: null,
    keywords: [],
  };

  // Validate category
  if (result.category && VALID_CATEGORIES.includes(result.category)) {
    cleaned.category = result.category;
  } else {
    cleaned.category = 'community'; // Default
    cleaned.warnings = cleaned.warnings || [];
    cleaned.warnings.push(`Invalid category "${result.category}", defaulting to "community"`);
  }

  // Validate groups
  if (Array.isArray(result.groups)) {
    cleaned.groups = result.groups.filter((g) => VALID_GROUPS.includes(g));
    if (cleaned.groups.length === 0) {
      cleaned.groups = ['everyone'];
    }
  } else {
    cleaned.groups = ['everyone'];
  }

  // Validate area
  if (result.area && VALID_AREAS.includes(result.area)) {
    cleaned.area = result.area;
  } else {
    cleaned.area = 'Bay Area'; // Default
    cleaned.warnings = cleaned.warnings || [];
    cleaned.warnings.push(`Invalid area "${result.area}", defaulting to "Bay Area"`);
  }

  // Clean keywords
  if (Array.isArray(result.keywords)) {
    cleaned.keywords = result.keywords
      .map((k) => String(k).toLowerCase().trim())
      .filter((k) => k.length > 0 && k.length < 50)
      .slice(0, 10);
  }

  return cleaned;
}

// ============================================================================
// INTERACTIVE MODE
// ============================================================================

async function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

  console.log('\n📝 Bay Navigator Program Categorizer (Interactive Mode)\n');
  console.log('Enter program details to get AI-suggested categorization.\n');

  try {
    while (true) {
      const name = await question('Program name (or "quit" to exit): ');
      if (name.toLowerCase() === 'quit' || name.toLowerCase() === 'q') {
        break;
      }

      const description = await question('Description: ');
      const whatTheyOffer = await question('What they offer (optional, press Enter to skip): ');
      const howToGetIt = await question('How to get it (optional, press Enter to skip): ');

      console.log('\n🔄 Asking Carl...\n');

      try {
        const result = await categorizeProgram(name, description, whatTheyOffer, howToGetIt);

        console.log('📊 Suggested categorization:\n');
        console.log(`   Category:  ${result.category}`);
        console.log(`   Groups:    ${result.groups.join(', ')}`);
        console.log(`   Area:      ${result.area}`);
        console.log(`   Keywords:  ${result.keywords.join(', ')}`);

        if (result.warnings) {
          console.log('\n   ⚠️  Warnings:');
          result.warnings.forEach((w) => console.log(`      - ${w}`));
        }

        console.log('\n   YAML snippet:');
        console.log('   ---');
        console.log(`   category: ${result.category}`);
        console.log(`   groups:`);
        result.groups.forEach((g) => console.log(`     - ${g}`));
        console.log(`   area: ${result.area}`);
        console.log(`   keywords:`);
        result.keywords.forEach((k) => console.log(`     - ${k}`));
        console.log('   ---\n');
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
      }
    }
  } finally {
    rl.close();
  }

  console.log('\n👋 Goodbye!\n');
}

// ============================================================================
// FILE MODE
// ============================================================================

async function processFile(filePath, programId) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(content);

  if (!Array.isArray(data)) {
    console.error('Error: YAML file should contain an array of programs');
    process.exit(1);
  }

  const program = data.find((p) => p.id === programId);
  if (!program) {
    console.error(`Error: Program with id "${programId}" not found`);
    console.log('Available IDs:', data.map((p) => p.id).join(', '));
    process.exit(1);
  }

  console.log(`\n📝 Categorizing: ${program.name}\n`);

  try {
    const result = await categorizeProgram(
      program.name,
      program.description || '',
      program.what_they_offer || '',
      program.how_to_get_it || ''
    );

    console.log('📊 Suggested categorization:\n');
    console.log(JSON.stringify(result, null, 2));

    if (result.warnings) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((w) => console.log(`   - ${w}`));
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// ============================================================================
// AUDIT MODE
// ============================================================================

async function runAudit() {
  console.log('\n📋 Bay Navigator Program Audit\n');
  console.log('Finding programs with missing or incomplete metadata...\n');

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
  ];

  const issues = [];

  for (const filename of PROGRAM_FILES) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);

      if (!Array.isArray(data)) continue;

      for (const program of data) {
        const programIssues = [];

        if (!program.category) programIssues.push('missing category');
        if (!program.groups || program.groups.length === 0) programIssues.push('missing groups');
        if (!program.area) programIssues.push('missing area');
        if (!program.keywords || program.keywords.length === 0)
          programIssues.push('missing keywords');
        if (!program.description) programIssues.push('missing description');

        if (programIssues.length > 0) {
          issues.push({
            file: filename,
            id: program.id,
            name: program.name,
            issues: programIssues,
          });
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${filename}`);
    }
  }

  if (issues.length === 0) {
    console.log('✅ All programs have complete metadata!\n');
    return;
  }

  console.log(`Found ${issues.length} programs with issues:\n`);

  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }

  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(`📁 ${file} (${fileIssues.length} issues)`);
    for (const issue of fileIssues.slice(0, 5)) {
      console.log(`   - ${issue.id}: ${issue.issues.join(', ')}`);
    }
    if (fileIssues.length > 5) {
      console.log(`   ... and ${fileIssues.length - 5} more`);
    }
    console.log();
  }

  console.log(`\nTo fix a program, run:`);
  console.log(
    `  node scripts/categorize-program.cjs --file src/data/<file>.yml --id <program-id>\n`
  );
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--interactive') || args.includes('-i')) {
    await runInteractive();
    return;
  }

  if (args.includes('--audit')) {
    await runAudit();
    return;
  }

  const fileIndex = args.indexOf('--file');
  const idIndex = args.indexOf('--id');

  if (fileIndex !== -1 && idIndex !== -1) {
    const filePath = args[fileIndex + 1];
    const programId = args[idIndex + 1];
    await processFile(filePath, programId);
    return;
  }

  // Show usage
  console.log(`
Bay Navigator Program Categorizer

Usage:
  Interactive mode:
    node scripts/categorize-program.cjs --interactive

  Single program:
    node scripts/categorize-program.cjs --file src/data/food.yml --id program-id

  Audit (find programs missing metadata):
    node scripts/categorize-program.cjs --audit

Environment:
  CARL_API_KEY - API key for Carl (ai.baytides.org)
`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
