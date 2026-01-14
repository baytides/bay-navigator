#!/usr/bin/env node
/**
 * Sync USAGov Benefit Finder data into BayNavigator
 *
 * Fetches federal benefits from usa.gov and converts them to our YAML format.
 * These are federal programs available nationwide (including the Bay Area).
 *
 * Source: https://www.usa.gov/s3/files/benefit-finder/api/life-event/all_benefits.json
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const USAGOV_API = 'https://www.usa.gov/s3/files/benefit-finder/api/life-event/all_benefits.json';
const OUTPUT_FILE = path.join(__dirname, '../src/data/federal-benefits.yml');

// Life event keywords - these map to searchable terms users might use
// Based on USA.gov Benefit Finder's three life event categories
const LIFE_EVENT_KEYWORDS = {
  disability: [
    'disability',
    'disabled',
    'impairment',
    'special needs',
    'ada',
    'unable to work',
    'ssdi',
    'ssi',
    'accessibility',
    'chronic illness',
    'blind',
    'deaf',
    'mobility',
    'mental health',
  ],
  death: [
    'death',
    'deceased',
    'survivor',
    'survivors',
    'bereavement',
    'grief',
    'widow',
    'widower',
    'funeral',
    'burial',
    'memorial',
    'loss of loved one',
    'passing',
    'died',
    'dependents',
    'beneficiary',
  ],
  retirement: [
    'retirement',
    'retired',
    'retiree',
    'pension',
    'senior',
    'elderly',
    'social security',
    'medicare',
    '65',
    'aging',
    'golden years',
    'fixed income',
    'post-career',
  ],
};

// Map USAGov agencies to our category system (fallback)
const AGENCY_TO_CATEGORY = {
  'Social Security Administration (SSA)': 'Finance',
  'Veterans Affairs Department (VA)': 'Finance', // Default, overridden by keywords
  'Department of Defense (DOD)': 'Finance',
  'Centers for Medicare and Medicaid (CMS)': 'Health',
  'Federal Emergency Management Agency (FEMA)': 'Community Services',
  'Department of Labor (DOL)': 'Finance',
  'Department of Justice (DOJ)': 'Legal Services',
  'Department of Housing and Urban Development (HUD)': 'Community Services', // No housing category
  'Internal Revenue Service (IRS)': 'Finance',
  'Department of Interior (DOI) - Indian Affairs': 'Community Services',
  'Library of Congress (LOC)': 'Education',
  'Federal Retirement Thrift Investment Board (FRTIB)': 'Finance',
};

// Short agency names for display
const AGENCY_SHORT_NAMES = {
  'Social Security Administration (SSA)': 'Social Security',
  'Veterans Affairs Department (VA)': 'VA',
  'Department of Defense (DOD)': 'DOD',
  'Centers for Medicare and Medicaid (CMS)': 'Medicare/Medicaid',
  'Federal Emergency Management Agency (FEMA)': 'FEMA',
  'Department of Labor (DOL)': 'Dept of Labor',
  'Department of Justice (DOJ)': 'DOJ',
  'Department of Housing and Urban Development (HUD)': 'HUD',
  'Internal Revenue Service (IRS)': 'IRS',
  'Department of Interior (DOI) - Indian Affairs': 'BIA',
  'Library of Congress (LOC)': 'Library of Congress',
  'Federal Retirement Thrift Investment Board (FRTIB)': 'TSP',
};

// Categorize based on benefit title/description keywords (more accurate than agency)
function categorizeByKeywords(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();

  // Health/Medical
  if (
    text.includes('medicare') ||
    text.includes('medicaid') ||
    text.includes('health') ||
    text.includes('medical') ||
    text.includes('champva') ||
    text.includes('prescription')
  ) {
    return 'Health';
  }

  // Education
  if (
    text.includes('education') ||
    text.includes('gi bill') ||
    text.includes('school') ||
    text.includes('braille') ||
    text.includes('library')
  ) {
    return 'Education';
  }

  // Legal
  if (text.includes('legal') || text.includes('court') || text.includes('justice')) {
    return 'Legal Services';
  }

  // Community services (burial, emergency, social services)
  if (
    text.includes('burial') ||
    text.includes('funeral') ||
    text.includes('cemetery') ||
    text.includes('headstone') ||
    text.includes('grave') ||
    text.includes('memorial') ||
    text.includes('flag')
  ) {
    return 'Community Services';
  }

  // Finance is the default for most benefits (pension, disability payments, SSI, etc.)
  return null; // Will use agency fallback
}

// Format benefit name to be clearer
// e.g. "Retirement benefits for child" -> "Social Security: Retirement Benefits for Children"
function formatBenefitName(title, agencyTitle) {
  const agencyShort = AGENCY_SHORT_NAMES[agencyTitle] || 'Federal';

  // Capitalize title properly
  let formattedTitle = title
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Fix common plural/clarity issues
  formattedTitle = formattedTitle
    .replace(/\bFor Child\b/gi, 'for Children')
    .replace(/\bFor Spouse\b/gi, 'for Spouses')
    .replace(/\bFor Parents\b/gi, 'for Parents')
    .replace(/\bFor Adults\b/gi, 'for Adults')
    .replace(/\bWith Disability\b/gi, 'with Disabilities')
    .replace(/\bWith Disabilities\b/gi, 'with Disabilities')
    .replace(/\bFor Veteran\b/gi, 'for Veterans')
    .replace(/\bFor Survivors\b/gi, 'for Survivors');

  return `${agencyShort}: ${formattedTitle}`;
}

// Map eligibility criteria to our target groups (using group IDs from groups.yml)
const CRITERIA_TO_GROUPS = {
  applicant_served_in_active_military: 'veterans',
  applicant_service_disability: 'veterans',
  applicant_disability: 'disability',
  applicant_ability_to_work: 'disability',
  applicant_american_indian: 'everyone', // No specific group, use everyone
  applicant_income: 'income-eligible',
  applicant_dolo: 'families', // Survivors → families (closest match)
  deceased_: 'families', // Survivors → families (closest match)
};

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Detect which life events apply to a benefit and generate keywords
function detectLifeEventsAndKeywords(title, summary, eligibility) {
  const text = `${title} ${summary}`.toLowerCase();
  const eligibilityText = (eligibility || []).map((e) => (e.label || '').toLowerCase()).join(' ');
  const fullText = `${text} ${eligibilityText}`;

  const detectedEvents = new Set();
  const keywords = new Set();

  // Check for disability-related content
  if (
    fullText.includes('disab') ||
    fullText.includes('impair') ||
    fullText.includes('unable to work') ||
    fullText.includes('ssdi') ||
    fullText.includes('blind') ||
    fullText.includes('deaf')
  ) {
    detectedEvents.add('disability');
  }

  // Check for death/survivor-related content
  if (
    fullText.includes('surviv') ||
    fullText.includes('deceas') ||
    fullText.includes('death') ||
    fullText.includes('burial') ||
    fullText.includes('funeral') ||
    fullText.includes('widow') ||
    fullText.includes('memorial') ||
    fullText.includes('died')
  ) {
    detectedEvents.add('death');
  }

  // Check for retirement-related content
  if (
    fullText.includes('retire') ||
    fullText.includes('pension') ||
    fullText.includes('medicare') ||
    fullText.includes('65 years') ||
    fullText.includes('62 years') ||
    fullText.includes('social security')
  ) {
    detectedEvents.add('retirement');
  }

  // Add relevant keywords based on detected events
  for (const event of detectedEvents) {
    LIFE_EVENT_KEYWORDS[event].forEach((kw) => keywords.add(kw));
  }

  // Add agency-specific keywords
  if (fullText.includes('veteran') || fullText.includes('military') || fullText.includes(' va ')) {
    keywords.add('veteran');
    keywords.add('military');
    keywords.add('service member');
    keywords.add('armed forces');
  }

  if (fullText.includes('medicare') || fullText.includes('medicaid')) {
    keywords.add('health insurance');
    keywords.add('medical coverage');
  }

  if (fullText.includes('housing') || fullText.includes('section 8') || fullText.includes('rent')) {
    keywords.add('housing assistance');
    keywords.add('rental help');
    keywords.add('housing voucher');
  }

  if (
    fullText.includes('education') ||
    fullText.includes('gi bill') ||
    fullText.includes('school')
  ) {
    keywords.add('education benefits');
    keywords.add('tuition assistance');
    keywords.add('college');
  }

  return {
    lifeEvents: Array.from(detectedEvents),
    keywords: Array.from(keywords),
  };
}

// Track generated IDs to ensure uniqueness
const generatedIds = new Set();

function generateId(title, agency) {
  const agencyShort = agency
    .replace(/\([^)]+\)/g, '')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join('-')
    .toLowerCase();

  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50); // Increased from 40 to reduce collisions

  let baseId = `federal-${agencyShort}-${titleSlug}`;
  let finalId = baseId;
  let counter = 2;

  // Ensure uniqueness by appending a counter if needed
  while (generatedIds.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }

  generatedIds.add(finalId);
  return finalId;
}

function extractGroups(eligibility) {
  const groups = new Set();

  for (const criterion of eligibility) {
    const key = criterion.criteriaKey || '';

    for (const [pattern, group] of Object.entries(CRITERIA_TO_GROUPS)) {
      if (key.includes(pattern) || key.startsWith(pattern)) {
        groups.add(group);
      }
    }

    // Check for age-related criteria
    if (key.includes('date_of_birth') || key.includes('age')) {
      // Could be seniors or children depending on context
      const label = (criterion.label || '').toLowerCase();
      if (label.includes('65') || label.includes('senior') || label.includes('retire')) {
        groups.add('seniors');
      }
      if (label.includes('child') || label.includes('under 18')) {
        groups.add('families');
      }
    }
  }

  return Array.from(groups);
}

function transformBenefit(benefitWrapper) {
  const benefit = benefitWrapper.benefit;
  if (!benefit || !benefit.title) return null;

  const agency = benefit.agency || {};
  const agencyTitle = (agency.title || 'Federal Government').trim();

  // First try keyword-based categorization, then fall back to agency mapping
  const summary = stripHtml(benefit.summary || '');
  const category =
    categorizeByKeywords(benefit.title, summary) || AGENCY_TO_CATEGORY[agencyTitle] || 'community';
  const groups = extractGroups(benefit.eligibility || []);

  // Detect life events and generate searchable keywords
  const { lifeEvents, keywords } = detectLifeEventsAndKeywords(
    benefit.title,
    benefit.summary || '',
    benefit.eligibility || []
  );

  // Add general groups based on title/summary (using group IDs from groups.yml)
  const titleLower = benefit.title.toLowerCase();
  const summaryLower = (benefit.summary || '').toLowerCase();

  if (titleLower.includes('veteran') || summaryLower.includes('veteran')) {
    if (!groups.includes('veterans')) groups.push('veterans');
  }
  if (
    titleLower.includes('disability') ||
    titleLower.includes('disabled') ||
    summaryLower.includes('disability')
  ) {
    if (!groups.includes('disability')) groups.push('disability');
  }
  if (
    titleLower.includes('senior') ||
    titleLower.includes('retire') ||
    titleLower.includes('medicare')
  ) {
    if (!groups.includes('seniors')) groups.push('seniors');
  }
  if (titleLower.includes('child') || summaryLower.includes('child')) {
    if (!groups.includes('families')) groups.push('families');
  }
  if (
    titleLower.includes('survivor') ||
    summaryLower.includes('survivor') ||
    summaryLower.includes('death')
  ) {
    if (!groups.includes('families')) groups.push('families'); // Survivors → families
  }

  // Build eligibility description
  const eligibilityItems = (benefit.eligibility || [])
    .map((e) => e.label)
    .filter(Boolean)
    .slice(0, 5);

  const howToGetIt =
    eligibilityItems.length > 0
      ? `Eligibility requirements:\n${eligibilityItems.map((e) => `- ${e}`).join('\n')}\n\nVisit the official website or call for more information.`
      : 'Visit the official website or call for more information about eligibility and how to apply.';

  return {
    id: generateId(benefit.title, agencyTitle),
    name: formatBenefitName(benefit.title, agencyTitle),
    category: category,
    area: 'Nationwide',
    description:
      stripHtml(benefit.summary) || `Federal benefit program administered by ${agencyTitle}.`,
    whatTheyOffer: stripHtml(agency.summary || agency.lede || ''),
    howToGetIt: howToGetIt,
    link: benefit.SourceLink || '',
    linkText: 'Official Website',
    groups: groups.length > 0 ? groups : ['everyone'],
    source: 'federal',
    agency: agencyTitle,
    lifeEvents: lifeEvents,
    keywords: keywords,
  };
}

async function syncBenefits() {
  console.log('Fetching USAGov benefits data...');

  try {
    const response = await fetch(USAGOV_API);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const benefits = data?.data?.benefits || [];

    console.log(`Found ${benefits.length} federal benefits`);

    const programs = benefits.map(transformBenefit).filter(Boolean);

    console.log(`Transformed ${programs.length} programs`);

    // Generate sync date for verification
    const syncDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Generate YAML content - format matches existing files (array, not object with programs key)
    const yamlContent = `# Federal Benefits from USAGov
# Auto-generated from https://www.usa.gov/benefit-finder
# Last synced: ${new Date().toISOString()}
#
# These are federal programs available nationwide, including the Bay Area.
# Source: USA.gov Benefit Finder API
#
# DO NOT EDIT MANUALLY - This file is regenerated by sync-usagov-benefits.cjs

${programs
  .map((p) => {
    // Helper to quote strings that need it
    // Must escape backslashes before quotes to prevent malformed YAML
    const quote = (s) =>
      s && (s.includes(':') || s.includes('#'))
        ? `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
        : s;

    const lines = [
      `- id: ${p.id}`,
      `  name: ${quote(p.name)}`,
      `  category: ${p.category}`,
      `  area: ${p.area}`,
      `  source: federal`,
      `  agency: ${quote(p.agency)}`,
      `  verified_by: USA.gov`,
      `  verified_date: '${syncDate}'`,
    ];

    if (p.groups && p.groups.length > 0) {
      lines.push(`  groups:`);
      // Groups should already be in correct ID format (lowercase with hyphens)
      p.groups.forEach((g) => lines.push(`    - ${g}`));
    }

    // Use > for folded scalar (single line)
    lines.push(`  description: >`);
    lines.push(`    ${p.description}`);

    if (p.whatTheyOffer) {
      lines.push(`  what_they_offer: >`);
      lines.push(`    ${p.whatTheyOffer}`);
    }

    if (p.howToGetIt) {
      lines.push(`  how_to_get_it: |`);
      p.howToGetIt.split('\n').forEach((line) => {
        lines.push(`    ${line}`);
      });
    }

    if (p.link) {
      lines.push(`  link: ${p.link}`);
      lines.push(`  link_text: ${p.linkText}`);
    }

    // Add life events as hidden tags for search
    if (p.lifeEvents && p.lifeEvents.length > 0) {
      lines.push(`  life_events:`);
      p.lifeEvents.forEach((e) => lines.push(`    - ${e}`));
    }

    // Add keywords for enhanced search (hidden from display, used by Fuse.js)
    if (p.keywords && p.keywords.length > 0) {
      lines.push(`  keywords:`);
      p.keywords.forEach((kw) => lines.push(`    - ${kw}`));
    }

    return lines.join('\n');
  })
  .join('\n\n')}
`;

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, yamlContent, 'utf8');
    console.log(`Written to ${OUTPUT_FILE}`);

    // Summary
    const categories = {};
    const groupCounts = {};
    const lifeEventCounts = {};
    programs.forEach((p) => {
      categories[p.category] = (categories[p.category] || 0) + 1;
      p.groups.forEach((g) => {
        groupCounts[g] = (groupCounts[g] || 0) + 1;
      });
      (p.lifeEvents || []).forEach((e) => {
        lifeEventCounts[e] = (lifeEventCounts[e] || 0) + 1;
      });
    });

    console.log('\nBy category:');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count}`);
      });

    console.log('\nBy target group:');
    Object.entries(groupCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([group, count]) => {
        console.log(`  ${group}: ${count}`);
      });

    console.log('\nBy life event:');
    Object.entries(lifeEventCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([event, count]) => {
        console.log(`  ${event}: ${count}`);
      });

    const keywordCount = programs.reduce((sum, p) => sum + (p.keywords?.length || 0), 0);
    console.log(`\nTotal searchable keywords added: ${keywordCount}`);

    return programs.length;
  } catch (error) {
    console.error('Error syncing benefits:', error);
    process.exit(1);
  }
}

syncBenefits();
