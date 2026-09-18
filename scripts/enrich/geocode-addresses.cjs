#!/usr/bin/env node
/**
 * Add latitude/longitude to programs that have a street address but no coords.
 *
 * Geocoder: the US Census Bureau's public geocoder. No API key, no billing, no
 * per-request quota to babysit in CI, and it is purpose-built for US street
 * addresses — which is all this dataset contains. OpenStreetMap's Nominatim is
 * the fallback for the handful Census cannot match; its usage policy asks for
 * 1 req/sec and a real User-Agent, so both are honoured below.
 *
 * EVERY RESULT IS VERIFIED BEFORE IT IS WRITTEN. A geocoder that silently
 * returns the centroid of the wrong city is worse than no coordinate at all:
 * the program already declares which counties it serves, so any fix that lands
 * outside those counties is rejected rather than saved. That check uses the same
 * point-in-polygon lookup the apps use.
 *
 *   node scripts/enrich/geocode-addresses.cjs --dry-run
 *   node scripts/enrich/geocode-addresses.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(ROOT, 'src', 'data');
const LOOKUP = path.join(ROOT, 'public', 'api', 'county-lookup.json');
const CACHE = path.join(ROOT, '.geocode-cache.json');

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();

const NON_PROGRAM = new Set([
  'cities.yml',
  'groups.yml',
  'zipcodes.yml',
  'suppressed.yml',
  'search-config.yml',
  'transit-agencies.yml',
  'county-supervisors.yml',
  'site-config.yml',
  'bay-area-jurisdictions.yml',
  'city-profiles.yml',
  'helplines.yml',
  'custom-themes.yml',
  'chat-messages.yml',
  'homepage-pills.yml',
]);

// --- county verification -----------------------------------------------------
const counties = JSON.parse(fs.readFileSync(LOOKUP, 'utf8')).counties;

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function countyOf(lat, lng) {
  for (const c of counties) {
    for (const poly of c.polygons) {
      if (!poly.length || !inRing(lng, lat, poly[0])) continue;
      let hole = false;
      for (let k = 1; k < poly.length; k++)
        if (inRing(lng, lat, poly[k])) {
          hole = true;
          break;
        }
      if (!hole) return c.slug;
    }
  }
  return null;
}

// --- geocoders ---------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'BayNavigator/1.0 (+https://baynavigator.org; community resource directory)';

async function census(address) {
  const url =
    'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress' +
    `?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const j = await res.json();
  const m = j?.result?.addressMatches?.[0];
  if (!m?.coordinates) return null;
  return { lat: m.coordinates.y, lng: m.coordinates.x, via: 'census', matched: m.matchedAddress };
}

async function nominatim(address) {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const j = await res.json();
  if (!Array.isArray(j) || !j.length) return null;
  return {
    lat: parseFloat(j[0].lat),
    lng: parseFloat(j[0].lon),
    via: 'osm',
    matched: j[0].display_name,
  };
}

// --- main --------------------------------------------------------------------
async function main() {
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  const targets = [];
  for (const file of fs.readdirSync(DATA)) {
    if (!file.endsWith('.yml') || NON_PROGRAM.has(file)) continue;
    const raw = fs.readFileSync(path.join(DATA, file), 'utf8');
    const doc = yaml.load(raw);
    if (!doc) continue;
    const list = Array.isArray(doc) ? doc : doc.programs || [];
    for (const p of list) {
      const hasCoord = typeof p.latitude === 'number' && typeof p.longitude === 'number';
      const addr = typeof p.address === 'string' ? p.address.trim() : '';
      if (hasCoord || addr.length < 6) continue;
      targets.push({ file, id: p.id, address: addr, counties: p.counties || [] });
    }
  }

  console.log(`${targets.length} program(s) have an address but no coordinates.\n`);
  const todo = targets.slice(0, LIMIT);

  const results = [];
  let hit = 0,
    missed = 0,
    rejected = 0,
    cached = 0;

  for (const t of todo) {
    let geo = cache[t.address];
    if (geo) cached++;
    else {
      geo = await census(t.address);
      if (!geo) {
        await sleep(1100); // Nominatim asks for <= 1 req/sec.
        geo = await nominatim(t.address);
      }
      if (geo) cache[t.address] = geo;
      await sleep(250);
    }

    if (!geo) {
      missed++;
      console.log(`  ✗ ${t.id}: no match for "${t.address}"`);
      continue;
    }

    // Verify: does the fix land in a county this program says it serves?
    const landed = countyOf(geo.lat, geo.lng);
    const declared = t.counties.filter((c) => c !== 'all');
    const plausible = !landed ? false : declared.length === 0 || declared.includes(landed);

    if (!plausible) {
      rejected++;
      console.log(
        `  ⚠ ${t.id}: geocoded into ${landed || 'outside the Bay Area'} but it serves ` +
          `${declared.join('/') || '(unspecified)'} — rejected`
      );
      continue;
    }

    hit++;
    results.push({ ...t, ...geo, landed });
  }

  if (!DRY_RUN) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));

  console.log(
    `\nmatched ${hit}  ·  no match ${missed}  ·  rejected as implausible ${rejected}  ·  from cache ${cached}`
  );

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written. Sample:');
    results
      .slice(0, 8)
      .forEach((r) =>
        console.log(
          `  ${r.id}  ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}  [${r.landed}, via ${r.via}]`
        )
      );
    return;
  }

  // Line-based insertion, not a js-yaml round-trip: dumping the parsed document
  // reflows every array and strips every comment in the file.
  const byFile = new Map();
  for (const r of results) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r);
  }

  let written = 0;
  for (const [file, rows] of byFile) {
    const full = path.join(DATA, file);
    const before = fs.readFileSync(full, 'utf8');
    const lines = before.split('\n');
    const out = [];

    for (let i = 0; i < lines.length; i++) {
      out.push(lines[i]);
      const m = lines[i].match(/^(\s*)(-?\s*)address:\s/);
      if (!m) continue;
      // Which record is this? Find the nearest preceding `id:`.
      let id = null;
      for (let k = i; k >= 0; k--) {
        const idm = lines[k].match(/^\s*-?\s*id:\s*(.+?)\s*$/);
        if (idm) {
          id = idm[1].replace(/^['"]|['"]$/g, '');
          break;
        }
      }
      const row = rows.find((r) => r.id === id);
      if (!row) continue;
      const indent = m[1] + (m[2].includes('-') ? '  ' : '');
      out.push(`${indent}latitude: ${row.lat.toFixed(6)}`);
      out.push(`${indent}longitude: ${row.lng.toFixed(6)}`);
      written++;
    }

    const after = out.join('\n');
    // Refuse to write if the record count changed — that would mean the
    // line-based edit corrupted the structure.
    const countBefore = (yaml.load(before) || []).length ?? 0;
    const parsed = yaml.load(after);
    const countAfter = (parsed || []).length ?? 0;
    if (countBefore !== countAfter) {
      console.error(`❌ ${file}: record count changed ${countBefore} -> ${countAfter}, skipping.`);
      continue;
    }
    fs.writeFileSync(full, after);
    console.log(`  ✓ ${file}: +${rows.length} coordinate pair(s)`);
  }

  console.log(`\n✅ wrote ${written} coordinate pair(s) across ${byFile.size} file(s)`);
}

main().catch((e) => {
  console.error('geocoding failed:', e.message);
  process.exit(1);
});
