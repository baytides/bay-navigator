#!/usr/bin/env node
/**
 * Generate municipal codes API for Carl
 * Creates /public/api/municipal-codes.json
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'data-exports', 'municipal-codes.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'municipal-codes.json');

// Fix known URL issues
const URL_FIXES = {
  'San Francisco': 'https://codelibrary.amlegal.com/codes/san_francisco/latest/overview',
  Berkeley: 'https://berkeley.municipal.codes/',
  'Palo Alto': 'https://codelibrary.amlegal.com/codes/paloalto/latest/overview',
};

// Common code sections people ask about
const COMMON_SECTIONS = {
  noise: {
    title: 'Noise Ordinance',
    keywords: ['noise', 'loud', 'music', 'party', 'quiet hours', 'sound'],
  },
  parking: {
    title: 'Parking Regulations',
    keywords: ['parking', 'RV', 'vehicle', 'street parking', 'overnight'],
  },
  pets: {
    title: 'Animal Regulations',
    keywords: ['dog', 'cat', 'pet', 'animal', 'license', 'barking'],
  },
  building: {
    title: 'Building & Construction',
    keywords: ['permit', 'construction', 'building', 'remodel', 'addition'],
  },
  adu: {
    title: 'ADU/Granny Units',
    keywords: ['ADU', 'granny unit', 'accessory dwelling', 'in-law'],
  },
  rental: {
    title: 'Rental/Tenant Laws',
    keywords: ['rent control', 'tenant', 'landlord', 'eviction', 'rental'],
  },
  business: {
    title: 'Business Licenses',
    keywords: ['business license', 'home business', 'food truck', 'vendor'],
  },
  trees: {
    title: 'Tree Regulations',
    keywords: ['tree', 'removal', 'heritage tree', 'protected tree'],
  },
  fences: { title: 'Fence & Property', keywords: ['fence', 'setback', 'property line', 'height'] },
  shortterm: {
    title: 'Short-Term Rentals',
    keywords: ['airbnb', 'short-term', 'vacation rental', 'VRBO'],
  },
  cannabis: {
    title: 'Cannabis Regulations',
    keywords: ['cannabis', 'marijuana', 'dispensary', 'cultivation'],
  },
  signs: { title: 'Sign Regulations', keywords: ['sign', 'signage', 'banner', 'advertising'] },
};

function main() {
  console.log('Generating municipal codes API...\n');

  if (!fs.existsSync(INPUT_PATH)) {
    console.error('Run discover-municipal-codes.cjs first!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));

  // Process and fix URLs
  const codes = data.codes.map((code) => {
    let url = code.municipalCodeUrl;

    // Apply fixes
    if (URL_FIXES[code.name]) {
      url = URL_FIXES[code.name];
    }

    return {
      name: code.name,
      type: code.type,
      county: code.county,
      municipalCodeUrl: url,
      platform: code.platform,
    };
  });

  // Create output
  const output = {
    generated: new Date().toISOString(),
    total: codes.length,
    commonSections: COMMON_SECTIONS,
    description:
      'Municipal code URLs for Bay Area cities and counties. Use these to help users find local laws and regulations.',
    codes: codes,
  };

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log('Generated municipal codes API with ' + codes.length + ' entries');
  console.log('Output: ' + OUTPUT_PATH);

  // Summary
  const byCounty = {};
  for (const c of codes) {
    byCounty[c.county] = (byCounty[c.county] || 0) + 1;
  }
  console.log('\nBy county:');
  for (const [county, count] of Object.entries(byCounty).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + county + ': ' + count);
  }
}

main();

// California State Codes
const CALIFORNIA_CODES = {
  constitution: {
    name: 'California Constitution',
    url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=CONS',
    description: 'The fundamental law of the State of California',
  },
  codes: [
    {
      code: 'BPC',
      name: 'Business and Professions Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=BPC',
    },
    {
      code: 'CCP',
      name: 'Code of Civil Procedure',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=CCP',
    },
    {
      code: 'CIV',
      name: 'Civil Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=CIV',
    },
    {
      code: 'COM',
      name: 'Commercial Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=COM',
    },
    {
      code: 'CORP',
      name: 'Corporations Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=CORP',
    },
    {
      code: 'EDC',
      name: 'Education Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=EDC',
    },
    {
      code: 'ELEC',
      name: 'Elections Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=ELEC',
    },
    {
      code: 'EVID',
      name: 'Evidence Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=EVID',
    },
    {
      code: 'FAM',
      name: 'Family Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=FAM',
    },
    {
      code: 'FIN',
      name: 'Financial Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=FIN',
    },
    {
      code: 'FGC',
      name: 'Fish and Game Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=FGC',
    },
    {
      code: 'FAC',
      name: 'Food and Agricultural Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=FAC',
    },
    {
      code: 'GOV',
      name: 'Government Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=GOV',
    },
    {
      code: 'HNC',
      name: 'Harbors and Navigation Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=HNC',
    },
    {
      code: 'HSC',
      name: 'Health and Safety Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=HSC',
    },
    {
      code: 'INS',
      name: 'Insurance Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=INS',
    },
    {
      code: 'LAB',
      name: 'Labor Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=LAB',
    },
    {
      code: 'MVC',
      name: 'Military and Veterans Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=MVC',
    },
    {
      code: 'PEN',
      name: 'Penal Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=PEN',
    },
    {
      code: 'PROB',
      name: 'Probate Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=PROB',
    },
    {
      code: 'PCC',
      name: 'Public Contract Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=PCC',
    },
    {
      code: 'PRC',
      name: 'Public Resources Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=PRC',
    },
    {
      code: 'PUC',
      name: 'Public Utilities Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=PUC',
    },
    {
      code: 'RTC',
      name: 'Revenue and Taxation Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=RTC',
    },
    {
      code: 'SHC',
      name: 'Streets and Highways Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=SHC',
    },
    {
      code: 'UIC',
      name: 'Unemployment Insurance Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=UIC',
    },
    {
      code: 'VEH',
      name: 'Vehicle Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=VEH',
    },
    {
      code: 'WAT',
      name: 'Water Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=WAT',
    },
    {
      code: 'WIC',
      name: 'Welfare and Institutions Code',
      url: 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=WIC',
    },
  ],
  search: 'https://leginfo.legislature.ca.gov/faces/codes.xhtml',
};
