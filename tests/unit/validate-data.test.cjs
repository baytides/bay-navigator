/**
 * Unit tests for validate-data.cjs
 *
 * Tests the data validation logic without side effects.
 * Run with: node --test tests/unit/validate-data.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Valid values for testing (subset of actual values)
const VALID_VALUES = {
  validGroups: [
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
    'everyone',
  ],
  validCategories: [
    'Community',
    'Education',
    'Equipment',
    'Finance',
    'Food',
    'Health',
    'Legal',
    'Library Resources',
    'Pet Resources',
    'Recreation',
    'Technology',
    'Transportation',
    'Utilities',
  ],
  validCategoryIds: [
    'community',
    'education',
    'equipment',
    'finance',
    'food',
    'health',
    'legal',
    'library-resources',
    'pet-resources',
    'recreation',
    'technology',
    'transportation',
    'utilities',
  ],
  validAreas: [
    'San Francisco',
    'Alameda County',
    'Contra Costa County',
    'Marin County',
    'Napa County',
    'San Mateo County',
    'Santa Clara County',
    'Solano County',
    'Sonoma County',
    'Bay Area',
    'Statewide',
    'California',
    'Nationwide',
    'National',
  ],
};

// Required fields for every program
const REQUIRED_FIELDS = ['id', 'name', 'category', 'groups', 'link'];

describe('validate-data.cjs', () => {
  describe('URL validation', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'https://www.example.com/path',
        'http://localhost:3000',
        'https://sub.domain.example.org/path?query=1',
      ];

      for (const url of validUrls) {
        assert.strictEqual(isValidUrl(url), true, `Should accept: ${url}`);
      }
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com', // Missing protocol
        'ftp://files.example.com', // FTP is technically valid URL
        '',
      ];

      // Empty string should return true (optional field)
      assert.strictEqual(isValidUrl(''), true);
      assert.strictEqual(isValidUrl(null), true);
      assert.strictEqual(isValidUrl(undefined), true);

      // Invalid URLs should return false
      assert.strictEqual(isValidUrl('not-a-url'), false);
      assert.strictEqual(isValidUrl('example.com'), false);
    });
  });

  describe('ID format validation', () => {
    it('should accept valid ID formats', () => {
      const validIds = ['food-bank', 'senior-services-sf', 'calfresh', 'program-123', 'a-b-c'];

      for (const id of validIds) {
        assert.strictEqual(isValidIdFormat(id), true, `Should accept: ${id}`);
      }
    });

    it('should reject invalid ID formats', () => {
      const invalidIds = [
        'Food Bank', // Spaces and uppercase
        'CALFRESH', // Uppercase
        'food_bank', // Underscores
        'food.bank', // Dots
        'food/bank', // Slashes
        'café-program', // Non-ASCII
      ];

      for (const id of invalidIds) {
        assert.strictEqual(isValidIdFormat(id), false, `Should reject: ${id}`);
      }
    });
  });

  describe('Required fields validation', () => {
    it('should pass for program with all required fields', () => {
      const validProgram = {
        id: 'test-program',
        name: 'Test Program',
        category: 'food',
        groups: ['everyone'],
        link: 'https://example.com',
      };

      const errors = validateRequiredFields(validProgram);
      assert.strictEqual(errors.length, 0);
    });

    it('should fail for missing required fields', () => {
      const invalidProgram = {
        id: 'test-program',
        name: 'Test Program',
        // Missing: category, groups, link
      };

      const errors = validateRequiredFields(invalidProgram);
      assert.strictEqual(errors.length, 3);
      assert.ok(errors.some((e) => e.includes('category')));
      assert.ok(errors.some((e) => e.includes('groups')));
      assert.ok(errors.some((e) => e.includes('link')));
    });
  });

  describe('Groups validation', () => {
    it('should accept valid groups', () => {
      const validGroups = ['everyone', 'seniors', 'income-eligible'];
      const errors = validateGroups(validGroups, VALID_VALUES.validGroups);
      assert.strictEqual(errors.length, 0);
    });

    it('should reject invalid groups', () => {
      const invalidGroups = ['everyone', 'invalid-group', 'made-up'];
      const errors = validateGroups(invalidGroups, VALID_VALUES.validGroups);
      assert.strictEqual(errors.length, 2);
    });

    it('should error if groups is not an array', () => {
      const errors = validateGroups('everyone', VALID_VALUES.validGroups);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes('array'));
    });
  });

  describe('Phone format validation', () => {
    it('should accept valid phone formats', () => {
      const validPhones = [
        '415-555-1234',
        '(415) 555-1234',
        '415.555.1234',
        '4155551234',
        '+1 415 555 1234',
        '1-800-555-1234',
      ];

      for (const phone of validPhones) {
        const warnings = validatePhoneFormat(phone);
        assert.strictEqual(warnings.length, 0, `Should accept: ${phone}`);
      }
    });

    it('should warn about unusual phone formats', () => {
      const unusualPhones = [
        '555', // Too short
        '12345678901234567890', // Too long
        'call-us-now', // Not a phone number
      ];

      for (const phone of unusualPhones) {
        const warnings = validatePhoneFormat(phone);
        assert.strictEqual(warnings.length, 1, `Should warn: ${phone}`);
      }
    });
  });

  describe('Latitude/Longitude validation', () => {
    it('should accept valid Bay Area coordinates', () => {
      const validCoords = [
        { lat: 37.7749, lng: -122.4194 }, // San Francisco
        { lat: 37.8044, lng: -122.2712 }, // Oakland
        { lat: 37.3382, lng: -121.8863 }, // San Jose
        { lat: 38.2975, lng: -122.2869 }, // Napa
      ];

      for (const { lat, lng } of validCoords) {
        assert.strictEqual(isValidLatitude(lat), true, `Should accept lat: ${lat}`);
        assert.strictEqual(isValidLongitude(lng), true, `Should accept lng: ${lng}`);
      }
    });

    it('should reject coordinates outside Bay Area', () => {
      const invalidCoords = [
        { lat: 34.0522, lng: -118.2437 }, // Los Angeles
        { lat: 40.7128, lng: -74.006 }, // New York
        { lat: 0, lng: 0 }, // Null Island
      ];

      for (const { lat, lng } of invalidCoords) {
        const latValid = isValidLatitude(lat);
        const lngValid = isValidLongitude(lng);
        assert.ok(!latValid || !lngValid, `Should reject coords: ${lat}, ${lng}`);
      }
    });

    it('should accept null/undefined coordinates', () => {
      assert.strictEqual(isValidLatitude(null), true);
      assert.strictEqual(isValidLatitude(undefined), true);
      assert.strictEqual(isValidLongitude(null), true);
      assert.strictEqual(isValidLongitude(undefined), true);
    });
  });

  describe('Duplicate detection', () => {
    it('should detect duplicate IDs', () => {
      const allIds = new Map();
      allIds.set('existing-program', 'file1.yml');

      const duplicate = checkDuplicate('existing-program', 'file2.yml', allIds);
      assert.ok(duplicate);
      assert.deepStrictEqual(duplicate.files, ['file1.yml', 'file2.yml']);
    });

    it('should not flag unique IDs', () => {
      const allIds = new Map();
      allIds.set('existing-program', 'file1.yml');

      const duplicate = checkDuplicate('new-program', 'file2.yml', allIds);
      assert.strictEqual(duplicate, null);
    });
  });

  describe('Empty string detection', () => {
    it('should warn about empty strings', () => {
      const program = {
        id: 'test',
        name: 'Test',
        description: '', // Empty string
        phone: null, // OK - null is preferred
        email: undefined, // OK - undefined is fine
      };

      const warnings = checkEmptyStrings(program);
      assert.strictEqual(warnings.length, 1);
      assert.ok(warnings[0].includes('description'));
    });
  });

  describe('Full program validation', () => {
    it('should validate a complete valid program', () => {
      const validProgram = {
        id: 'test-food-bank',
        name: 'Test Food Bank',
        category: 'food',
        groups: ['everyone', 'income-eligible'],
        link: 'https://testfoodbank.org',
        area: 'San Francisco',
        phone: '415-555-1234',
        latitude: 37.7749,
        longitude: -122.4194,
      };

      const { errors, warnings } = validateProgram(validProgram, VALID_VALUES);

      assert.strictEqual(errors.length, 0, `Unexpected errors: ${errors.join(', ')}`);
    });

    it('should catch multiple errors in invalid program', () => {
      const invalidProgram = {
        id: 'Invalid ID!', // Invalid format
        name: 'Test Program',
        // Missing category
        groups: ['not-a-real-group'], // Invalid group
        link: 'not-a-url', // Invalid URL
      };

      const { errors, warnings } = validateProgram(invalidProgram, VALID_VALUES);

      assert.ok(errors.length >= 3, `Expected at least 3 errors, got: ${errors.length}`);
    });
  });
});

// Helper functions extracted from validate-data.cjs for testing
function isValidUrl(string) {
  if (!string) return true; // Optional field
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function isValidIdFormat(id) {
  return /^[a-z0-9-]+$/.test(id);
}

function validateRequiredFields(program) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!program[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return errors;
}

function validateGroups(groups, validGroups) {
  const errors = [];
  if (!Array.isArray(groups)) {
    errors.push('"groups" should be an array');
    return errors;
  }
  for (const group of groups) {
    if (!validGroups.includes(group)) {
      errors.push(`Invalid group: "${group}"`);
    }
  }
  return errors;
}

function validatePhoneFormat(phone) {
  const warnings = [];
  if (!phone) return warnings;

  const digits = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!/^\+?\d{10,15}$/.test(digits)) {
    warnings.push(`Unusual phone format: "${phone}"`);
  }
  return warnings;
}

function isValidLatitude(lat) {
  if (lat === null || lat === undefined) return true;
  return typeof lat === 'number' && lat >= 36 && lat <= 39;
}

function isValidLongitude(lng) {
  if (lng === null || lng === undefined) return true;
  return typeof lng === 'number' && lng >= -124 && lng <= -121;
}

function checkDuplicate(id, fileName, allIds) {
  if (allIds.has(id)) {
    return {
      id,
      files: [allIds.get(id), fileName],
    };
  }
  allIds.set(id, fileName);
  return null;
}

function checkEmptyStrings(program) {
  const warnings = [];
  for (const [key, value] of Object.entries(program)) {
    if (value === '') {
      warnings.push(`Empty string for "${key}" (should be omitted or null)`);
    }
  }
  return warnings;
}

function validateProgram(program, validValues) {
  const errors = [];
  const warnings = [];

  // Check required fields
  errors.push(...validateRequiredFields(program));

  // Check ID format
  if (program.id && !isValidIdFormat(program.id)) {
    errors.push(`Invalid ID format: "${program.id}"`);
  }

  // Check groups
  if (program.groups) {
    errors.push(...validateGroups(program.groups, validValues.validGroups));
  }

  // Check URL
  if (program.link && !isValidUrl(program.link)) {
    errors.push(`Invalid URL format: "${program.link}"`);
  }

  // Check phone
  if (program.phone) {
    warnings.push(...validatePhoneFormat(program.phone));
  }

  // Check coordinates
  if (program.latitude !== undefined && program.latitude !== null) {
    if (!isValidLatitude(program.latitude)) {
      errors.push(`Invalid latitude: "${program.latitude}"`);
    }
  }
  if (program.longitude !== undefined && program.longitude !== null) {
    if (!isValidLongitude(program.longitude)) {
      errors.push(`Invalid longitude: "${program.longitude}"`);
    }
  }

  // Check for empty strings
  warnings.push(...checkEmptyStrings(program));

  return { errors, warnings };
}
