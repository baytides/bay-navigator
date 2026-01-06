#!/usr/bin/env node
/**
 * Verify Program URLs
 *
 * Checks all program URLs for accessibility and updates verification dates.
 * Used to process GitHub issue #41 verification tasks.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../src/data');
const RESULTS_FILE = path.join(__dirname, '../verification-results.json');

// HTTP Status Code descriptions (from MDN)
const HTTP_STATUS = {
  // Informational
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  // Success
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  // Redirection
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  // Client Errors
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Content',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  // Server Errors
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required'
};

function getStatusDescription(code) {
  return HTTP_STATUS[code] || 'Unknown Status';
}

// Files that don't contain programs
const NON_PROGRAM_FILES = [
  'cities.yml',
  'groups.yml',
  'zipcodes.yml',
  'suppressed.yml',
  'search-config.yml',
  'county-supervisors.yml'
];

// Rate limiting
const DELAY_MS = 500; // 500ms between requests
const TIMEOUT_MS = 15000; // 15 second timeout

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load all programs from YAML files
function loadAllPrograms() {
  const programs = [];

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    const data = yaml.load(content) || [];

    for (const program of data) {
      const url = program.link || program.website;
      if (url) {
        programs.push({
          id: program.id,
          name: program.name,
          file: file,
          url: url,
          verified_date: program.verified_date || null,
          category: file.replace('.yml', '')
        });
      }
    }
  }

  return programs;
}

// Check URL status with retries
async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Try HEAD first (faster)
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BayNavigator/1.0; +https://baynavigator.org)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    // Some servers don't support HEAD, try GET
    if (response.status === 405 || response.status === 403) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);

      response = await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BayNavigator/1.0; +https://baynavigator.org)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        redirect: 'follow'
      });

      clearTimeout(timeout2);
    }

    return {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      finalUrl: response.url,
      error: null
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      status: 0,
      ok: false,
      redirected: false,
      finalUrl: null,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    };
  }
}

// Update YAML file with new verification date
function updateVerificationDate(file, programId, date) {
  const filePath = path.join(DATA_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const programs = yaml.load(content) || [];

  let updated = false;
  for (const program of programs) {
    if (program.id === programId) {
      program.verified_date = date;
      updated = true;
      break;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, yaml.dump(programs, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    }));
  }

  return updated;
}

async function main() {
  console.log('🔍 Program URL Verification Tool\n');

  // Load programs
  console.log('📂 Loading programs...');
  const programs = loadAllPrograms();
  console.log(`   Found ${programs.length} programs with URLs\n`);

  // Filter to only unverified programs
  const unverified = programs.filter(p => !p.verified_date);
  console.log(`   ${unverified.length} programs need verification\n`);

  const results = {
    timestamp: new Date().toISOString(),
    total: unverified.length,
    verified: [],
    failed: [],
    redirected: [],
    timeout: []
  };

  // Check each URL
  console.log('🌐 Checking URLs...\n');

  for (let i = 0; i < unverified.length; i++) {
    const program = unverified[i];
    const progress = `[${i + 1}/${unverified.length}]`;

    process.stdout.write(`${progress} ${program.name.substring(0, 50).padEnd(50)} `);

    const result = await checkUrl(program.url);

    const statusDesc = getStatusDescription(result.status);

    if (result.ok) {
      if (result.redirected && result.finalUrl !== program.url) {
        console.log(`⚠️  ${result.status} ${statusDesc} (redirected)`);
        results.redirected.push({
          ...program,
          status: result.status,
          statusDescription: statusDesc,
          finalUrl: result.finalUrl
        });
      } else {
        console.log(`✅ ${result.status} ${statusDesc}`);
        results.verified.push({
          ...program,
          status: result.status,
          statusDescription: statusDesc
        });
      }
    } else if (result.error === 'Timeout') {
      console.log(`⏱️  Timeout`);
      results.timeout.push({
        ...program,
        status: 0,
        statusDescription: 'Request Timeout (client-side)',
        error: result.error
      });
    } else {
      console.log(`❌ ${result.status} ${statusDesc}`);
      results.failed.push({
        ...program,
        status: result.status,
        statusDescription: statusDesc,
        error: result.error
      });
    }

    // Rate limiting
    await sleep(DELAY_MS);
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   ✅ Verified: ${results.verified.length}`);
  console.log(`   ⚠️  Redirected: ${results.redirected.length}`);
  console.log(`   ⏱️  Timeout: ${results.timeout.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${RESULTS_FILE}`);

  // Print failed URLs
  if (results.failed.length > 0) {
    console.log('\n❌ Failed URLs:');
    for (const p of results.failed) {
      console.log(`   - ${p.name}`);
      console.log(`     URL: ${p.url}`);
      console.log(`     Status: ${p.status} ${p.statusDescription}`);
      if (p.error) {
        console.log(`     Error: ${p.error}`);
      }
    }
  }

  // Print significantly redirected URLs (different domain)
  const domainRedirects = results.redirected.filter(p => {
    try {
      const origDomain = new URL(p.url).hostname;
      const finalDomain = new URL(p.finalUrl).hostname;
      return origDomain !== finalDomain;
    } catch {
      return false;
    }
  });

  if (domainRedirects.length > 0) {
    console.log('\n⚠️  Domain Redirects (may need URL update):');
    for (const p of domainRedirects) {
      console.log(`   - ${p.name}`);
      console.log(`     From: ${p.url}`);
      console.log(`     To:   ${p.finalUrl}`);
    }
  }

  return results;
}

// Run
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
