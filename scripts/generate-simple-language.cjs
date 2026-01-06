/**
 * Generate Simple Language Script
 * WCAG 2.2 AAA: 3.1.5 Reading Level
 *
 * Scans user-facing content for complex words (above 8th grade reading level)
 * and generates simplified alternatives using Azure OpenAI.
 *
 * Run weekly via GitHub Actions to update public/data/simple-language.json
 *
 * Usage: AZURE_OPENAI_ENDPOINT=xxx AZURE_OPENAI_KEY=xxx node scripts/generate-simple-language.cjs
 */

const fs = require('fs');
const path = require('path');

// Azure OpenAI configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const AZURE_OPENAI_API_VERSION = '2024-02-15-preview';

// Directories to scan for user-facing content
const CONTENT_DIRS = [
  'src/pages',
  'src/components',
  'src/data'
];

// File extensions to scan
const FILE_EXTENSIONS = ['.astro', '.yml', '.yaml', '.md'];

// Words to skip (common simple words, proper nouns, technical terms that can't be simplified)
const SKIP_WORDS = new Set([
  // Common words
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its',
  'may', 'new', 'now', 'old', 'see', 'way', 'who', 'boy', 'did', 'own', 'say',
  'she', 'too', 'use', 'your', 'each', 'from', 'have', 'been', 'call', 'come',
  'could', 'first', 'into', 'just', 'know', 'like', 'look', 'make', 'more',
  'need', 'over', 'only', 'other', 'people', 'some', 'take', 'than', 'that',
  'them', 'then', 'there', 'these', 'they', 'this', 'time', 'very', 'want',
  'well', 'what', 'when', 'which', 'will', 'with', 'work', 'year', 'about',
  'after', 'back', 'being', 'between', 'both', 'down', 'even', 'find', 'good',
  'great', 'here', 'help', 'home', 'last', 'left', 'life', 'little', 'live',
  'long', 'made', 'might', 'most', 'much', 'must', 'name', 'never', 'next',
  'number', 'part', 'place', 'right', 'same', 'school', 'should', 'small',
  'still', 'such', 'thing', 'think', 'through', 'under', 'while', 'world',
  'would', 'write', 'years',

  // Proper nouns & brand names (don't simplify)
  'bay', 'area', 'navigator', 'california', 'francisco', 'oakland', 'jose',
  'mateo', 'clara', 'alameda', 'contra', 'costa', 'marin', 'sonoma', 'napa',
  'solano', 'bart', 'muni', 'caltrain', 'clipper', 'medicare', 'medicaid',
  'calfresh', 'calworks', 'baytides', 'github', 'cloudflare', 'azure',

  // Technical terms that need to stay (use abbr tags instead)
  'wcag', 'aria', 'html', 'css', 'api', 'url', 'pdf', 'wifi', 'gps',

  // Program acronyms (handled by Abbr component)
  'snap', 'wic', 'ssi', 'ssdi', 'ebt', 'liheap', 'tanf', 'eitc', 'vita',
  'hud', 'aca', 'chip', 'pge', 'fafsa', 'pell', 'ged', 'esl', 'irs', 'ctc',
  'dol', 'usda', 'dmv', 'edd', 'pfl', 'sdi', 'nps', 'imls', 'acp'
]);

// Common complex words with pre-defined simple alternatives
// This reduces API calls for frequently occurring terms
const PRESET_SIMPLIFICATIONS = {
  'eligibility': 'who can apply',
  'eligible': 'able to get',
  'requirements': 'what you need',
  'documentation': 'papers',
  'assistance': 'help',
  'application': 'sign-up form',
  'participate': 'take part',
  'participation': 'taking part',
  'benefits': 'help you can get',
  'beneficiary': 'person who gets help',
  'enrollment': 'signing up',
  'enroll': 'sign up',
  'supplement': 'extra',
  'supplemental': 'extra',
  'nutrition': 'food and eating',
  'comprehensive': 'complete',
  'accessibility': 'easy to use for everyone',
  'accommodation': 'changes to help you',
  'verification': 'checking if true',
  'verify': 'check',
  'determination': 'decision',
  'determine': 'decide',
  'qualification': 'what you need to qualify',
  'qualify': 'be able to get',
  'reimburse': 'pay back',
  'reimbursement': 'getting paid back',
  'authorization': 'permission',
  'authorize': 'give permission',
  'compliance': 'following the rules',
  'comply': 'follow the rules',
  'regulation': 'rule',
  'regulatory': 'about rules',
  'jurisdiction': 'area in charge',
  'municipality': 'city or town',
  'municipal': 'city or town',
  'infrastructure': 'basic systems',
  'sustainability': 'being green',
  'sustainable': 'good for the planet',
  'confidential': 'private',
  'confidentiality': 'keeping things private',
  'demographic': 'group of people',
  'demographics': 'groups of people',
  'socioeconomic': 'money and social',
  'utilization': 'use',
  'utilize': 'use',
  'facilitate': 'help with',
  'implementation': 'putting into action',
  'implement': 'put into action',
  'subsequently': 'after that',
  'approximately': 'about',
  'preliminary': 'first',
  'comprehensive': 'complete',
  'modification': 'change',
  'modify': 'change',
  'substantially': 'a lot',
  'substantial': 'large',
  'predominant': 'main',
  'predominantly': 'mostly',
  'acquisition': 'getting',
  'acquire': 'get',
  'deteriorate': 'get worse',
  'deterioration': 'getting worse',
  'accommodate': 'fit',
  'procurement': 'buying',
  'procure': 'buy',
  'disseminate': 'share',
  'dissemination': 'sharing',
  'expedite': 'speed up',
  'terminate': 'end',
  'termination': 'ending',
  'commencement': 'start',
  'commence': 'start',
  'pursuant': 'according to',
  'aforementioned': 'mentioned before',
  'notwithstanding': 'even though',
  'hereinafter': 'from now on called',
  'wherein': 'where',
  'thereof': 'of it',
  'hereby': 'by this',
  'hereunder': 'under this',
  'inasmuch': 'since',
  'insofar': 'as much as',
  'forthwith': 'right away',
  'heretofore': 'before now',
  'endeavor': 'try',
  'remuneration': 'payment',
  'compensation': 'payment',
  'disbursement': 'payment',
  'disburse': 'pay out',
  'reimburse': 'pay back',
  'stipend': 'small payment',
  'subsidy': 'money help',
  'subsidize': 'help pay for',
  'allotment': 'share',
  'allocation': 'share given',
  'allocate': 'give out',
  'delineate': 'describe',
  'delineation': 'description',
  'adjudicate': 'decide',
  'adjudication': 'decision process',
  'corroborate': 'confirm',
  'corroboration': 'confirmation',
  'substantiate': 'prove',
  'substantiation': 'proof',
  'promulgate': 'make official',
  'promulgation': 'making official',
};

/**
 * Extract text content from Astro files
 */
function extractTextFromAstro(content) {
  // Remove frontmatter
  content = content.replace(/^---[\s\S]*?---/m, '');

  // Remove code blocks and scripts
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove HTML tags but keep text
  content = content.replace(/<[^>]+>/g, ' ');

  // Remove template expressions
  content = content.replace(/\{[^}]+\}/g, ' ');

  return content;
}

/**
 * Extract text content from YAML files
 */
function extractTextFromYaml(content) {
  // Extract string values from YAML
  const strings = [];
  const stringMatches = content.match(/:\s*["']([^"']+)["']/g) || [];
  const unquotedMatches = content.match(/:\s+([^#\n]+)/g) || [];

  stringMatches.forEach(m => {
    const match = m.match(/:\s*["']([^"']+)["']/);
    if (match) strings.push(match[1]);
  });

  unquotedMatches.forEach(m => {
    const match = m.match(/:\s+([^#\n]+)/);
    if (match && !match[1].startsWith('[') && !match[1].startsWith('{')) {
      strings.push(match[1].trim());
    }
  });

  return strings.join(' ');
}

/**
 * Extract words from text
 */
function extractWords(text) {
  // Get all words, lowercase
  const words = text.toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3) // Skip very short words
    .filter(w => !SKIP_WORDS.has(w))
    .filter(w => !/^\d+$/.test(w)); // Skip numbers

  // Count word frequency
  const wordCounts = {};
  words.forEach(w => {
    wordCounts[w] = (wordCounts[w] || 0) + 1;
  });

  return wordCounts;
}

/**
 * Use Azure OpenAI to identify complex words and get simplifications
 */
async function identifyComplexWords(words) {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    console.log('Azure OpenAI not configured, using preset simplifications only');
    return {};
  }

  // Filter out words we already have simplifications for
  const unknownWords = words.filter(w => !PRESET_SIMPLIFICATIONS[w]);

  if (unknownWords.length === 0) {
    console.log('All words have preset simplifications');
    return {};
  }

  // Process in batches to avoid token limits
  const batchSize = 100; // Azure OpenAI can handle larger batches
  const results = {};

  for (let i = 0; i < unknownWords.length; i += batchSize) {
    const batch = unknownWords.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(unknownWords.length / batchSize)} (${batch.length} words)`);

    const prompt = `You are helping make a government benefits website easier to read for people with lower literacy.

Analyze these words and identify which ones are above an 8th grade reading level (Flesch-Kincaid grade 8 or higher). For each complex word, provide a simpler alternative that an 8th grader would understand.

Words to analyze: ${batch.join(', ')}

For each COMPLEX word (above 8th grade level), respond with ONLY this format on separate lines:
word: simple alternative

Rules:
- Skip simple words that an 8th grader would know
- Use 1-3 simple words as alternatives
- Keep the same meaning
- If a word is already simple (8th grade or below), don't include it

Example output:
eligibility: who can apply
reimbursement: getting paid back
jurisdiction: area in charge

Only output the complex words with their simplifications, nothing else:`;

    try {
      const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_KEY
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You identify complex words above 8th grade reading level and provide simpler alternatives. Only output word: simplification pairs, one per line.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Azure OpenAI API error:', error);
        continue;
      }

      const data = await response.json();
      const output = data.choices?.[0]?.message?.content || '';

      // Parse the output
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/^([a-z-]+):\s*(.+)$/i);
        if (match) {
          const word = match[1].toLowerCase().trim();
          const simple = match[2].trim();
          if (word && simple && word !== simple) {
            results[word] = simple;
          }
        }
      }

      // Rate limiting - wait between batches (Azure has rate limits)
      if (i + batchSize < unknownWords.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error('Azure OpenAI request error:', error.message);
    }
  }

  return results;
}

/**
 * Scan all content files and extract unique words
 */
function scanContent() {
  const allWords = {};

  for (const dir of CONTENT_DIRS) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) continue;

    scanDirectory(fullPath, allWords);
  }

  // Sort by frequency and return top words
  return Object.entries(allWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 500) // Top 500 most frequent words
    .map(([word]) => word);
}

function scanDirectory(dir, allWords) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, allWords);
    } else if (FILE_EXTENSIONS.some(ext => item.endsWith(ext))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let text = '';

      if (item.endsWith('.astro')) {
        text = extractTextFromAstro(content);
      } else if (item.endsWith('.yml') || item.endsWith('.yaml')) {
        text = extractTextFromYaml(content);
      } else if (item.endsWith('.md')) {
        text = content;
      }

      const words = extractWords(text);
      for (const [word, count] of Object.entries(words)) {
        allWords[word] = (allWords[word] || 0) + count;
      }
    }
  }
}

async function main() {
  console.log('=== Simple Language Generator ===');
  console.log('WCAG 2.2 AAA: 3.1.5 Reading Level\n');

  // Step 1: Scan content
  console.log('Scanning content files...');
  const words = scanContent();
  console.log(`Found ${words.length} unique words to analyze\n`);

  // Step 2: Identify complex words via AI
  console.log('Identifying complex words via AI...');
  const aiSimplifications = await identifyComplexWords(words);
  console.log(`AI identified ${Object.keys(aiSimplifications).length} additional complex words\n`);

  // Step 3: Merge preset and AI simplifications
  const allSimplifications = {
    ...PRESET_SIMPLIFICATIONS,
    ...aiSimplifications
  };

  // Step 4: Filter to only words that appear in our content
  const contentWords = new Set(words);
  const relevantSimplifications = {};

  for (const [word, simple] of Object.entries(allSimplifications)) {
    if (contentWords.has(word)) {
      relevantSimplifications[word] = simple;
    }
  }

  // Step 5: Create output
  const output = {
    generated: new Date().toISOString(),
    description: 'Simplified alternatives for complex words (WCAG 2.2 AAA 3.1.5)',
    readingLevel: '8th grade or below',
    totalWords: Object.keys(relevantSimplifications).length,
    simplifications: relevantSimplifications
  };

  // Step 6: Write to file
  const outputDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'simple-language.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('=== Results ===');
  console.log(`Total simplifications: ${output.totalWords}`);
  console.log(`Output: ${outputPath}`);
  console.log('\nSample simplifications:');

  const samples = Object.entries(relevantSimplifications).slice(0, 10);
  samples.forEach(([word, simple]) => {
    console.log(`  ${word} → ${simple}`);
  });
}

main().catch(console.error);
