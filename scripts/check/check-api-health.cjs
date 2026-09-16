#!/usr/bin/env node
/**
 * Probe every service Bay Navigator depends on at runtime.
 *
 * Exists because a dependency can disappear without anything in this repo
 * changing — which is exactly what happened on 2026-09-16, when the self-hosted
 * Ollama/Typesense box was switched off and the site kept trying to call it.
 *
 * Usage:
 *   node scripts/check/check-api-health.cjs
 *   node scripts/check/check-api-health.cjs --json
 *
 * Exit code is 1 if any REQUIRED check fails, so CI can gate on it. Optional
 * checks (third-party sites we only link to, retired hosts) never fail the run.
 */
'use strict';

const TIMEOUT_MS = Number(process.env.API_CHECK_TIMEOUT_MS || 90_000);

/**
 * `required: true`  — the site is degraded without it.
 * `required: false` — informational; upstream sites we scrape or link to.
 * `expect`          — status to treat as success (default 200).
 */
const CHECKS = [
  // --- Site + static data (the site is entirely static, so this IS the API) ---
  { group: 'Site data', name: 'site root', url: 'https://baynavigator.org/', required: true },
  {
    group: 'Site data',
    name: 'metadata.json',
    url: 'https://baynavigator.org/data/metadata.json',
    required: true,
  },
  {
    group: 'Site data',
    name: 'programs.json',
    url: 'https://baynavigator.org/data/programs.json',
    required: true,
  },
  {
    group: 'Site data',
    name: 'search-index.json',
    url: 'https://baynavigator.org/data/search-index.json',
    required: true,
  },
  {
    group: 'Site data',
    name: 'SWA origin (Cloudflare bypass)',
    url: 'https://blue-pebble-00a40d41e.4.azurestaticapps.net/data/metadata.json',
    required: true,
    note: 'server-side callers fall back here; see carl-mcp/src/sources.mjs',
  },

  // --- Our own services ---
  {
    group: 'Our services',
    name: 'transit-alerts function',
    url: 'https://baytides-integrity.azurewebsites.net/api/transit-alerts',
    required: true,
  },
  {
    group: 'Our services',
    name: 'carl-mcp /health',
    url: 'https://baynavigator-carl-mcp.azurewebsites.net/health',
    required: true,
    note: 'consumption plan: a cold start can take >25s',
  },
  {
    group: 'Our services',
    name: 'municipal codes (blob)',
    url: 'https://baytidesstorage.blob.core.windows.net/municipal-codes/_index.json',
    required: true,
  },
  {
    group: 'Our services',
    name: 'missing persons (blob)',
    url: 'https://baytidesstorage.blob.core.windows.net/missing-persons/missing-persons.json',
    required: true,
  },

  // --- Third-party data sources ---
  {
    group: 'Third-party',
    name: 'Open-Meteo',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=37.77&longitude=-122.42&current=temperature_2m',
    required: true,
  },
  {
    group: 'Third-party',
    name: 'Nominatim geocoding',
    url: 'https://nominatim.openstreetmap.org/search?q=Oakland&format=json',
    required: true,
  },
  {
    group: 'Third-party',
    name: 'FAA airport status',
    url: 'https://external-api.faa.gov/asws/api/airport/status/SFO',
    required: false,
  },
  { group: 'Third-party', name: '511.org', url: 'https://511.org/', required: false },
  {
    group: 'Third-party',
    name: 'leginfo (CA codes)',
    url: 'https://leginfo.legislature.ca.gov/faces/codes.xhtml',
    required: false,
    note: 'scraped by the CA codes generator',
  },
  {
    group: 'Third-party',
    name: 'Municode',
    url: 'https://library.municode.com/',
    required: false,
    note: 'scraped by deep-scrape-municipal-codes',
  },

  // --- Retired: listed so their absence is documented, not alarming ---
  {
    group: 'Retired 2026-09-16',
    name: 'ollama.baytides.org',
    url: 'https://ollama.baytides.org/api/tags',
    required: false,
    expect: 502,
  },
  {
    group: 'Retired 2026-09-16',
    name: 'search.baytides.org',
    url: 'https://search.baytides.org/health',
    required: false,
    expect: 502,
  },
];

async function probe(check) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(check.url, {
      signal: controller.signal,
      headers: { 'user-agent': 'baynavigator-health-check' },
      redirect: 'follow',
    });
    return {
      ...check,
      status: res.status,
      ms: Date.now() - started,
      ok: res.status === (check.expect || 200),
    };
  } catch (err) {
    return { ...check, status: 0, ms: Date.now() - started, ok: false, error: err.message };
  }
}

async function main() {
  const results = await Promise.all(CHECKS.map(probe));

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  } else {
    let group = null;
    for (const r of results) {
      if (r.group !== group) {
        group = r.group;
        console.log(`\n${group}`);
      }
      const mark = r.ok ? 'ok  ' : r.required ? 'FAIL' : 'warn';
      const status = r.status || r.error || 'no response';
      console.log(`  ${mark}  ${r.name.padEnd(32)} ${String(status).padEnd(6)} ${r.ms}ms`);
      if (!r.ok && r.note) console.log(`        note: ${r.note}`);
    }
  }

  const failures = results.filter((r) => !r.ok && r.required);
  if (failures.length) {
    console.error(
      `\n${failures.length} required check(s) failed: ${failures.map((f) => f.name).join(', ')}`
    );
    process.exit(1);
  }
  console.log('\nAll required checks passed.');
}

main().catch((err) => {
  console.error(`health check crashed: ${err.stack || err.message}`);
  process.exit(1);
});
