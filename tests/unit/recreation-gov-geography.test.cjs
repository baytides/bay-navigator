/**
 * The geography guard on the recreation.gov importer.
 *
 * This decides what is allowed into a Bay Area directory. It used to be a
 * lat/lng bounding box reaching east to -121.0 — past Sacramento — plus a
 * keyword list that contained 'folsom'. Four Sacramento County sites and a
 * sanctuary off Santa Barbara got in that way, and a hand-written lat/lng
 * ladder then labelled the Sacramento ones "Solano County".
 *
 * Run: node --test tests/unit/recreation-gov-geography.test.cjs
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

const geo = require('../../scripts/sync/sync-recreation-gov.cjs');

describe('recreation.gov import — geographic gate', () => {
  const OUTSIDE = [
    ['Folsom Lake, Sacramento County', 38.7052, -121.1698],
    ['Folsom Dam, Sacramento County', 38.7016, -121.1466],
    ['Lake Natoma, Sacramento County', 38.6333, -121.2194],
    ['Nimbus Fish Hatchery, Sacramento County', 38.6355, -121.2208],
    ['Channel Islands, off Santa Barbara', 34.0783, -120.0035],
    ['San Joaquin River NWR, Stanislaus County', 37.5, -121.05],
  ];

  for (const [label, lat, lng] of OUTSIDE) {
    it(`rejects ${label}`, () => {
      assert.strictEqual(geo.isInBayArea(lat, lng), false);
    });
  }

  const INSIDE = [
    ['Oakland', 37.8044, -122.2712, 'Alameda County'],
    ['Lake Berryessa', 38.59, -122.24, 'Napa County'],
    ['Point Reyes', 38.04, -122.8, 'Marin County'],
    ['San Jose', 37.3382, -121.8863, 'Santa Clara County'],
    ['Daly City', 37.6879, -122.4702, 'San Mateo County'],
  ];

  for (const [label, lat, lng, county] of INSIDE) {
    it(`accepts ${label} and labels it ${county}`, () => {
      assert.strictEqual(geo.isInBayArea(lat, lng), true);
      assert.strictEqual(geo.determineArea(lat, lng, label), county);
    });
  }

  it('allows offshore marine sites near the coast', () => {
    // The Farallones sit outside every land polygon by definition.
    assert.strictEqual(geo.isInBayArea(37.6989, -123.0033), true);
  });

  it('does not treat an inland point as offshore', () => {
    // The offshore allowance is westward only; it must not become a back door
    // for anything east of the coast, which is where the bad imports came from.
    assert.strictEqual(geo.isOffshoreBayArea(38.7052, -121.1698), false);
  });

  it('no longer matches Folsom by name', () => {
    assert.strictEqual(geo.hasBayAreaKeyword('Folsom Lake'), false);
    assert.strictEqual(geo.hasBayAreaKeyword('Folsom Dam'), false);
  });

  it('still matches genuine Bay Area names', () => {
    assert.strictEqual(geo.hasBayAreaKeyword('Golden Gate National Recreation Area'), true);
    assert.strictEqual(geo.hasBayAreaKeyword('Point Reyes National Seashore'), true);
  });

  it('falls back to a county stated in the name, not a guessed landmark', () => {
    assert.strictEqual(geo.determineArea(null, null, 'Marin Headlands'), 'Marin County');
    assert.strictEqual(geo.determineArea(null, null, 'Folsom Lake'), 'Bay Area');
  });
});
