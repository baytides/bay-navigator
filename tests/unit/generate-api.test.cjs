/**
 * Unit tests for generate-api.cjs
 *
 * Tests the API generation logic without side effects.
 * Run with: node --test tests/unit/generate-api.test.cjs
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Test fixtures
const SAMPLE_PROGRAM = {
  id: 'test-program',
  name: 'Test Program',
  category: 'food',
  groups: ['everyone'],
  description: 'A test program for unit testing',
  link: 'https://example.com',
  area: 'San Francisco',
  phone: '415-555-1234',
};

const SAMPLE_YAML_CONTENT = `
- id: program-1
  name: Food Bank A
  category: food
  groups:
    - everyone
    - income-eligible
  description: Free food distribution
  link: https://foodbank-a.org
  area: San Francisco

- id: program-2
  name: Food Bank B
  category: food
  groups:
    - seniors
  description: Senior food program
  link: https://foodbank-b.org
  area:
    - Alameda County
    - Contra Costa County
`;

// Category metadata (copied from generate-api.cjs for testing)
const CATEGORY_METADATA = {
  community: { name: 'Community', icon: '🏘️' },
  education: { name: 'Education', icon: '📚' },
  equipment: { name: 'Equipment', icon: '🔧' },
  finance: { name: 'Finance', icon: '💰' },
  food: { name: 'Food', icon: '🍎' },
  health: { name: 'Health', icon: '💊' },
  legal: { name: 'Legal', icon: '⚖️' },
  'library-resources': { name: 'Library Resources', icon: '📖' },
  'pet-resources': { name: 'Pet Resources', icon: '🐾' },
  recreation: { name: 'Recreation', icon: '⚽' },
  technology: { name: 'Technology', icon: '💻' },
  transportation: { name: 'Transportation', icon: '🚌' },
  utilities: { name: 'Utilities', icon: '🏠' },
};

const GROUPS_METADATA = {
  'income-eligible': {
    name: 'Income-Eligible',
    description: 'For people who qualify based on income',
    icon: '💳',
  },
  seniors: { name: 'Seniors (65+)', description: 'For adults age 65 and older', icon: '👵' },
  everyone: { name: 'Everyone', description: 'Available to all residents', icon: '🌎' },
};

describe('generate-api.cjs', () => {
  describe('YAML parsing', () => {
    it('should parse valid YAML program data', () => {
      const programs = yaml.load(SAMPLE_YAML_CONTENT);

      assert.strictEqual(Array.isArray(programs), true);
      assert.strictEqual(programs.length, 2);
      assert.strictEqual(programs[0].id, 'program-1');
      assert.strictEqual(programs[1].id, 'program-2');
    });

    it('should handle programs with array areas', () => {
      const programs = yaml.load(SAMPLE_YAML_CONTENT);
      const program2 = programs[1];

      assert.strictEqual(Array.isArray(program2.area), true);
      assert.strictEqual(program2.area.length, 2);
      assert.strictEqual(program2.area[0], 'Alameda County');
    });

    it('should handle programs with string areas', () => {
      const programs = yaml.load(SAMPLE_YAML_CONTENT);
      const program1 = programs[0];

      assert.strictEqual(typeof program1.area, 'string');
      assert.strictEqual(program1.area, 'San Francisco');
    });
  });

  describe('Program transformation', () => {
    it('should transform program with required fields', () => {
      const transformed = transformProgram(SAMPLE_PROGRAM, 'food');

      assert.strictEqual(transformed.id, 'test-program');
      assert.strictEqual(transformed.name, 'Test Program');
      assert.strictEqual(transformed.category, 'food');
      assert.deepStrictEqual(transformed.groups, ['everyone']);
      assert.strictEqual(transformed.website, 'https://example.com');
    });

    it('should normalize string area to array', () => {
      const transformed = transformProgram(SAMPLE_PROGRAM, 'food');

      assert.strictEqual(Array.isArray(transformed.areas), true);
      assert.deepStrictEqual(transformed.areas, ['San Francisco']);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalProgram = {
        id: 'minimal',
        name: 'Minimal Program',
        groups: ['everyone'],
        link: 'https://example.com',
      };

      const transformed = transformProgram(minimalProgram, 'community');

      assert.strictEqual(transformed.phone, null);
      assert.strictEqual(transformed.email, null);
      assert.strictEqual(transformed.address, null);
      assert.deepStrictEqual(transformed.areas, []);
    });

    it('should generate ID from name if not provided', () => {
      const programWithoutId = {
        name: 'Test Program Name',
        groups: ['everyone'],
        link: 'https://example.com',
      };

      const id = generateIdFromName(programWithoutId.name);

      assert.strictEqual(id, 'test-program-name');
    });

    it('should handle special characters in name for ID generation', () => {
      const specialNames = [
        { input: 'Food & Nutrition Program', expected: 'food-nutrition-program' },
        { input: 'Senior (65+) Benefits', expected: 'senior-65-benefits' },
        { input: 'CalFresh/SNAP', expected: 'calfresh-snap' },
        { input: '  Spaces  Around  ', expected: 'spaces-around' },
      ];

      for (const { input, expected } of specialNames) {
        const id = generateIdFromName(input);
        assert.strictEqual(id, expected, `Failed for input: "${input}"`);
      }
    });
  });

  describe('Category counts', () => {
    it('should count programs per category correctly', () => {
      const programs = [
        { category: 'food' },
        { category: 'food' },
        { category: 'health' },
        { category: 'food' },
        { category: 'education' },
      ];

      const counts = countByCategory(programs);

      assert.strictEqual(counts['food'], 3);
      assert.strictEqual(counts['health'], 1);
      assert.strictEqual(counts['education'], 1);
    });

    it('should generate categories JSON with counts', () => {
      const counts = { food: 10, health: 5, education: 3 };
      const categories = generateCategoriesJson(counts);

      assert.strictEqual(Array.isArray(categories), true);

      const foodCategory = categories.find((c) => c.id === 'food');
      assert.ok(foodCategory);
      assert.strictEqual(foodCategory.name, 'Food');
      assert.strictEqual(foodCategory.icon, '🍎');
      assert.strictEqual(foodCategory.programCount, 10);
    });
  });

  describe('Groups counts', () => {
    it('should count programs per group correctly', () => {
      const programs = [
        { groups: ['everyone', 'seniors'] },
        { groups: ['seniors'] },
        { groups: ['everyone', 'income-eligible'] },
      ];

      const counts = countByGroups(programs);

      assert.strictEqual(counts['everyone'], 2);
      assert.strictEqual(counts['seniors'], 2);
      assert.strictEqual(counts['income-eligible'], 1);
    });
  });

  describe('Area processing', () => {
    it('should count programs per area correctly', () => {
      const programs = [
        { areas: ['San Francisco'] },
        { areas: ['San Francisco', 'Alameda County'] },
        { areas: ['Alameda County'] },
      ];

      const counts = countByAreas(programs);

      assert.strictEqual(counts['San Francisco'], 2);
      assert.strictEqual(counts['Alameda County'], 2);
    });
  });

  describe('Suppressed programs', () => {
    it('should filter out suppressed program IDs', () => {
      const programs = [
        { id: 'keep-1', name: 'Keep 1' },
        { id: 'suppress-me', name: 'Should be suppressed' },
        { id: 'keep-2', name: 'Keep 2' },
      ];
      const suppressedIds = new Set(['suppress-me']);

      const filtered = filterSuppressed(programs, suppressedIds);

      assert.strictEqual(filtered.length, 2);
      assert.strictEqual(
        filtered.find((p) => p.id === 'suppress-me'),
        undefined
      );
    });
  });

  describe('Metadata generation', () => {
    it('should generate valid metadata structure', () => {
      const metadata = generateMetadata(100);

      assert.strictEqual(metadata.version, '1.0.0');
      assert.strictEqual(metadata.totalPrograms, 100);
      assert.ok(metadata.generatedAt);
      assert.ok(metadata.endpoints);
      assert.strictEqual(metadata.endpoints.programs, '/api/programs.json');
      assert.strictEqual(metadata.endpoints.categories, '/api/categories.json');
    });

    it('should use ISO date format for generatedAt', () => {
      const metadata = generateMetadata(100);
      const date = new Date(metadata.generatedAt);

      assert.ok(!isNaN(date.getTime()), 'generatedAt should be valid ISO date');
    });
  });
});

// Helper functions extracted from generate-api.cjs for testing
function transformProgram(program, categoryId) {
  const id = program.id || generateIdFromName(program.name);

  let areas = program.area || [];
  if (typeof areas === 'string') {
    areas = [areas];
  }

  return {
    id,
    name: program.name,
    category: categoryId,
    description: program.benefit || program.description || '',
    fullDescription: program.description || null,
    whatTheyOffer: program.what_they_offer || null,
    howToGetIt: program.how_to_get_it || null,
    groups: program.groups || program.eligibility || [],
    areas: areas,
    city: program.city || null,
    website: program.link || program.website || '',
    cost: program.cost || null,
    phone: program.phone || null,
    email: program.email || null,
    address: program.address || null,
    requirements: program.requirements || null,
    howToApply: program.how_to_apply || null,
    keywords: program.keywords || [],
    lifeEvents: program.life_events || [],
    agency: program.agency || null,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

function generateIdFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function countByCategory(programs) {
  const counts = {};
  programs.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
}

function countByGroups(programs) {
  const counts = {};
  programs.forEach((p) => {
    (p.groups || []).forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  return counts;
}

function countByAreas(programs) {
  const counts = {};
  programs.forEach((p) => {
    (p.areas || []).forEach((a) => {
      counts[a] = (counts[a] || 0) + 1;
    });
  });
  return counts;
}

function generateCategoriesJson(counts) {
  return Object.keys(CATEGORY_METADATA).map((id) => ({
    id,
    name: CATEGORY_METADATA[id].name,
    icon: CATEGORY_METADATA[id].icon,
    programCount: counts[id] || 0,
  }));
}

function filterSuppressed(programs, suppressedIds) {
  return programs.filter((p) => !suppressedIds.has(p.id));
}

function generateMetadata(totalPrograms) {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalPrograms,
    endpoints: {
      programs: '/api/programs.json',
      categories: '/api/categories.json',
      groups: '/api/groups.json',
      areas: '/api/areas.json',
      singleProgram: '/api/programs/{id}.json',
    },
  };
}
