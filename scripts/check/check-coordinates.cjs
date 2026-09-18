#!/usr/bin/env node
/**
 * Cross-check every program coordinate against the county it says it serves.
 *
 * A wrong pin is invisible in the UI — the card still renders, the link still
 * works — but it silently removes the program from the county filter of the
 * people it actually serves, and inserts it into one it does not. This found 32
 * of 323 coordinates wrong on first run, including Folsom Lake (Sacramento
 * County, 90 minutes away) filed under Solano and the Channel Islands (300 miles
 * south) filed under Marin.
 *
 * Three outcomes, deliberately distinguished, because the fix differs:
 *
 *   MISPLACED  the pin sits in a Bay Area county the program does not serve.
 *              Usually the coordinate is wrong — re-geocode from the address.
 *   OFFSHORE   the pin is in open water. Marine sanctuaries and island refuges
 *              are legitimately outside every land boundary; they are reported
 *              separately rather than counted as broken.
 *   OUTSIDE    the pin is on land beyond the nine counties. Either the listing
 *              does not belong in a Bay Area directory, or its declared county
 *              is wrong. A human decides that; changing a declared county
 *              changes who the program is shown to.
 *
 * Run: npm run check:coords
 */
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(ROOT, 'src', 'data');
const LOOKUP = path.join(ROOT, 'public', 'api', 'county-lookup.json');

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

/** Great-circle distance in km. */
function haversine(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Shortest distance from a point to any county boundary vertex, in km. */
function kmToNearestCounty(lat, lng) {
  let best = Infinity;
  let name = null;
  for (const c of counties) {
    for (const poly of c.polygons) {
      for (const ring of poly) {
        for (const [x, y] of ring) {
          const d = haversine(lat, lng, y, x);
          if (d < best) {
            best = d;
            name = c.slug;
          }
        }
      }
    }
  }
  return { km: best, slug: name };
}

// Offshore sites sit outside every land polygon by definition. 25 km covers the
// Farallones and Cordell Bank without swallowing a genuinely misplaced inland pin.
const OFFSHORE_KM = 25;

function main() {
  const rows = [];
  for (const file of fs.readdirSync(DATA)) {
    if (!file.endsWith('.yml') || NON_PROGRAM.has(file)) continue;
    const doc = yaml.load(fs.readFileSync(path.join(DATA, file), 'utf8'));
    if (!doc) continue;
    for (const p of Array.isArray(doc) ? doc : doc.programs || []) {
      if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') continue;
      rows.push({
        file,
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        counties: p.counties || [],
        address: p.address,
      });
    }
  }

  const misplaced = [];
  const offshore = [];
  const outside = [];
  let agree = 0;

  for (const r of rows) {
    const landed = countyOf(r.lat, r.lng);
    const declared = r.counties.filter((c) => c !== 'all');

    if (landed) {
      if (!declared.length || declared.includes(landed)) agree++;
      else misplaced.push({ ...r, landed, declared });
      continue;
    }
    const near = kmToNearestCounty(r.lat, r.lng);
    if (near.km <= OFFSHORE_KM) offshore.push({ ...r, near, declared });
    else outside.push({ ...r, near, declared });
  }

  const pad = (s, n) => String(s).padEnd(n);
  console.log(`Coordinates checked: ${rows.length}\n`);
  console.log(`  ✓ pin matches a declared county : ${agree}`);
  console.log(`  ✗ MISPLACED (wrong county)      : ${misplaced.length}`);
  console.log(`  ~ OFFSHORE (within ${OFFSHORE_KM} km of land): ${offshore.length}`);
  console.log(`  ! OUTSIDE the Bay Area          : ${outside.length}\n`);

  if (misplaced.length) {
    console.log('MISPLACED — pin is in a county the listing does not serve:');
    for (const m of misplaced) {
      console.log(`  ${pad(m.id, 46)} pin:${pad(m.landed, 15)} declares:${m.declared.join('/')}`);
    }
    console.log('');
  }
  if (outside.length) {
    console.log('OUTSIDE — pin is on land beyond the nine counties:');
    for (const o of outside) {
      console.log(
        `  ${pad(o.id, 46)} ${o.near.km.toFixed(0).padStart(4)} km from ${pad(o.near.slug, 14)} declares:${o.declared.join('/') || '(all)'}`
      );
    }
    console.log('');
  }
  if (offshore.length) {
    console.log(`OFFSHORE — expected for marine sites (within ${OFFSHORE_KM} km):`);
    for (const o of offshore)
      console.log(`  ${pad(o.id, 46)} ${o.near.km.toFixed(1)} km from ${o.near.slug}`);
    console.log('');
  }

  // Misplaced pins are a data defect; offshore and outside need a human call.
  if (misplaced.length) {
    console.log(
      `❌ ${misplaced.length} misplaced coordinate(s). Re-geocode from the address, or correct the declared counties.`
    );
    process.exitCode = 1;
  } else {
    console.log('✅ no misplaced coordinates.');
  }
}

main();
