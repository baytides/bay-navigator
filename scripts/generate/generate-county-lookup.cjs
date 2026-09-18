#!/usr/bin/env node
/**
 * Build a small point-in-polygon lookup for "which Bay Area county is this?".
 *
 * WHY THIS EXISTS: both apps resolved a GPS fix to a county by finding the
 * nearest county *centroid*. Measured against the real boundaries that is wrong
 * for 10 of 27 actual Bay Area cities — Oakland and Berkeley resolve to San
 * Francisco, Fremont to Santa Clara, Daly City to San Francisco, Palo Alto to
 * San Mateo. Someone in Oakland was being shown San Francisco's programs.
 *
 * The real boundary file is 853 KB, too much to ship to a phone for one lookup,
 * so the rings are simplified with Douglas–Peucker until they are small enough
 * to bundle. The build asserts the simplified rings still classify a fixture of
 * real cities correctly, so a tighter tolerance can never silently trade
 * accuracy for bytes.
 *
 * Run: node scripts/generate/generate-county-lookup.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'public', 'api', 'county-boundaries.json');
const OUT = path.join(ROOT, 'public', 'api', 'county-lookup.json');

/** Perpendicular distance from p to the segment a→b, in degrees. */
function perpDistance(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Douglas–Peucker. Keeps the ring closed. */
function simplify(ring, tolerance) {
  if (ring.length < 4) return ring;
  const keep = new Uint8Array(ring.length);
  keep[0] = 1;
  keep[ring.length - 1] = 1;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = perpDistance(ring[i], ring[first], ring[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > tolerance && index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  const out = ring.filter((_, i) => keep[i]);
  // Re-close if simplification dropped the closing point.
  const [fx, fy] = out[0];
  const [lx, ly] = out[out.length - 1];
  if (fx !== lx || fy !== ly) out.push([fx, fy]);
  return out;
}

/** Round coordinates. 4dp is ~11 m, far finer than a county edge needs. */
const round = (ring) =>
  ring.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);

function ringsOf(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

// --- point in polygon (mirrored by the Swift and Dart ports) ---
function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function countyAt(features, lat, lng) {
  const pt = [lng, lat];
  for (const f of features) {
    for (const poly of f.polygons) {
      if (!inRing(pt, poly[0])) continue;
      let inHole = false;
      for (let k = 1; k < poly.length; k++) {
        if (inRing(pt, poly[k])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return f.name;
    }
  }
  return null;
}

// Real cities with their real counties. The fixture is the contract: if a
// simplification tolerance breaks any of these, it is too aggressive.
const FIXTURE = [
  ['Oakland', 37.8044, -122.2712, 'Alameda'],
  ['Fremont', 37.5485, -121.9886, 'Alameda'],
  ['Berkeley', 37.8715, -122.273, 'Alameda'],
  ['Hayward', 37.6688, -122.0808, 'Alameda'],
  ['Livermore', 37.6819, -121.768, 'Alameda'],
  ['Concord', 37.978, -122.0311, 'Contra Costa'],
  ['Richmond', 37.9358, -122.3477, 'Contra Costa'],
  ['Antioch', 38.0049, -121.8058, 'Contra Costa'],
  ['Walnut Creek', 37.9101, -122.0652, 'Contra Costa'],
  ['San Rafael', 37.9735, -122.5311, 'Marin'],
  ['Novato', 38.1074, -122.5697, 'Marin'],
  ['Sausalito', 37.8591, -122.4853, 'Marin'],
  ['Napa', 38.2975, -122.2869, 'Napa'],
  ['St. Helena', 38.5052, -122.4703, 'Napa'],
  ['San Francisco', 37.7749, -122.4194, 'San Francisco'],
  ['Daly City', 37.6879, -122.4702, 'San Mateo'],
  ['Redwood City', 37.4852, -122.2364, 'San Mateo'],
  ['San Mateo', 37.563, -122.3255, 'San Mateo'],
  ['Palo Alto', 37.4419, -122.143, 'Santa Clara'],
  ['San Jose', 37.3382, -121.8863, 'Santa Clara'],
  ['Sunnyvale', 37.3688, -122.0363, 'Santa Clara'],
  ['Mountain View', 37.3861, -122.0839, 'Santa Clara'],
  ['Gilroy', 37.0058, -121.5683, 'Santa Clara'],
  ['Vallejo', 38.1041, -122.2566, 'Solano'],
  ['Fairfield', 38.2494, -122.04, 'Solano'],
  ['Santa Rosa', 38.4404, -122.7141, 'Sonoma'],
  ['Petaluma', 38.2324, -122.6367, 'Sonoma'],
];

function build(tolerance) {
  const gj = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  return gj.features.map((f) => ({
    name: f.properties.name,
    slug: f.properties.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    polygons: ringsOf(f.geometry).map((poly) =>
      poly.map((ring) => round(simplify(ring, tolerance))).filter((ring) => ring.length >= 4)
    ),
  }));
}

function score(features) {
  let ok = 0;
  const wrong = [];
  for (const [city, lat, lng, truth] of FIXTURE) {
    const got = countyAt(features, lat, lng);
    if (got === truth) ok++;
    else wrong.push(`${city}: got ${got}, expected ${truth}`);
  }
  return { ok, wrong };
}

function main() {
  // Precision target, not a size target. County membership decides which
  // programs someone is eligible for, so the tolerance is chosen for how far
  // off it can put a county line (~111 m here), and the fixture then has to
  // pass at that tolerance. Picking "smallest file that happens to pass" would
  // have shipped 1.1 km of slop on a boundary — fine for the 27 city centres in
  // the fixture, not fine for someone living on the Oakland/Berkeley line.
  const TOLERANCE = 0.001; // degrees ≈ 111 m
  const features = build(TOLERANCE);
  const { ok, wrong } = score(features);
  const bytes = Buffer.byteLength(JSON.stringify(features));

  console.log(
    `  tolerance ${TOLERANCE} (~${Math.round(TOLERANCE * 111000)} m), ${(bytes / 1024).toFixed(0)} KB, ` +
      `${ok}/${FIXTURE.length} fixture cities correct`
  );

  if (ok !== FIXTURE.length) {
    console.error('❌ simplification broke county classification — refusing to write:');
    wrong.forEach((w) => console.error('   - ' + w));
    process.exit(1);
  }

  const payload = {
    generated: new Date().toISOString(),
    tolerance: TOLERANCE,
    note: 'Simplified Bay Area county boundaries for point-in-polygon lookup. Generated by scripts/generate/generate-county-lookup.cjs — do not hand-edit.',
    counties: features,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload));
  console.log(
    `\n✅ county lookup written: ${(bytes / 1024).toFixed(0)} KB ` +
      `(from ${(fs.statSync(SRC).size / 1024).toFixed(0)} KB source)`
  );
}

main();
