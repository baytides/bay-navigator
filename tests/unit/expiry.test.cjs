/**
 * Unit tests for src/lib/expiry.ts
 *
 * Covers the full time-limited-offer lifecycle of getExpiryFlare() and the
 * directory auto-hide rule isExpiredHidden(). Every case uses a fixed `now`
 * and a synthetic expiry date — no real program data is touched.
 *
 * Run with: node --test tests/unit/expiry.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Node 24 strips TS types and supports require() of ES modules, so we can load
// the source module directly rather than a compiled copy.
const {
  getExpiryFlare,
  isExpiredHidden,
  SOON_DAYS,
  URGENT_DAYS,
  GRACE_DAYS,
} = require('../../src/lib/expiry.ts');

// Fixed reference "today" for deterministic results. Noon avoids midnight/DST edges.
const NOW = new Date('2026-06-17T12:00:00');

// Helper: an ISO date `n` calendar days from NOW (negative = past).
function dateOffset(n) {
  const d = new Date('2026-06-17T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

describe('exported thresholds', () => {
  it('match the documented lifecycle windows', () => {
    assert.strictEqual(SOON_DAYS, 30);
    assert.strictEqual(URGENT_DAYS, 7);
    assert.strictEqual(GRACE_DAYS, 7);
  });
});

describe('getExpiryFlare', () => {
  it('returns null when there is no expiry date', () => {
    assert.strictEqual(getExpiryFlare(undefined, null, NOW), null);
    assert.strictEqual(getExpiryFlare(null, null, NOW), null);
    assert.strictEqual(getExpiryFlare('', null, NOW), null);
  });

  it('returns null for an unparseable date', () => {
    assert.strictEqual(getExpiryFlare('not-a-date', null, NOW), null);
  });

  it('returns null when expiry is more than SOON_DAYS away', () => {
    assert.strictEqual(getExpiryFlare(dateOffset(31), null, NOW), null);
  });

  it('shows a non-urgent "soon" flare exactly at the SOON_DAYS boundary', () => {
    const flare = getExpiryFlare(dateOffset(30), null, NOW);
    assert.ok(flare);
    assert.strictEqual(flare.state, 'soon');
    assert.strictEqual(flare.daysLeft, 30);
    assert.strictEqual(flare.urgent, false);
  });

  it('uses the default "Ends" prefix when no custom label is given', () => {
    const flare = getExpiryFlare(dateOffset(19), null, NOW);
    assert.match(flare.label, /^Ends /);
    assert.strictEqual(flare.srText, 'Only 19 days left');
  });

  it('uses a custom label prefix when provided', () => {
    const flare = getExpiryFlare(dateOffset(19), 'Free download ends', NOW);
    assert.strictEqual(flare.state, 'soon');
    assert.strictEqual(flare.urgent, false);
    assert.match(flare.label, /^Free download ends /);
  });

  it('escalates to urgent at or under URGENT_DAYS', () => {
    const flare = getExpiryFlare(dateOffset(7), null, NOW);
    assert.strictEqual(flare.state, 'soon');
    assert.strictEqual(flare.daysLeft, 7);
    assert.strictEqual(flare.urgent, true);
  });

  it('treats the expiry day itself as still live ("Ends today")', () => {
    const flare = getExpiryFlare(dateOffset(0), null, NOW);
    assert.strictEqual(flare.state, 'soon');
    assert.strictEqual(flare.daysLeft, 0);
    assert.strictEqual(flare.urgent, true);
    assert.strictEqual(flare.srText, 'Ends today');
  });

  it('shows an "Expired" flare the day after expiry', () => {
    const flare = getExpiryFlare(dateOffset(-1), 'Free download ends', NOW);
    assert.ok(flare);
    assert.strictEqual(flare.state, 'expired');
    assert.strictEqual(flare.urgent, false);
    assert.match(flare.label, /^Expired /); // custom prefix is ignored once expired
    assert.strictEqual(flare.srText, 'Expired yesterday');
  });

  it('still shows "Expired" at the GRACE_DAYS boundary', () => {
    const flare = getExpiryFlare(dateOffset(-7), null, NOW);
    assert.ok(flare);
    assert.strictEqual(flare.state, 'expired');
    assert.strictEqual(flare.srText, 'Expired 7 days ago');
  });

  it('returns null once past expiry by more than GRACE_DAYS', () => {
    assert.strictEqual(getExpiryFlare(dateOffset(-8), null, NOW), null);
    assert.strictEqual(getExpiryFlare(dateOffset(-100), null, NOW), null);
  });
});

describe('isExpiredHidden', () => {
  it('is false when there is no expiry date', () => {
    assert.strictEqual(isExpiredHidden(undefined, NOW), false);
    assert.strictEqual(isExpiredHidden(null, NOW), false);
  });

  it('is false for an unparseable date', () => {
    assert.strictEqual(isExpiredHidden('nope', NOW), false);
  });

  it('is false for upcoming and just-expired (within grace) listings', () => {
    assert.strictEqual(isExpiredHidden(dateOffset(19), NOW), false); // upcoming
    assert.strictEqual(isExpiredHidden(dateOffset(0), NOW), false); // expires today
    assert.strictEqual(isExpiredHidden(dateOffset(-1), NOW), false); // 1 day past
    assert.strictEqual(isExpiredHidden(dateOffset(-7), NOW), false); // grace boundary
  });

  it('is true once past expiry by more than GRACE_DAYS', () => {
    assert.strictEqual(isExpiredHidden(dateOffset(-8), NOW), true);
    assert.strictEqual(isExpiredHidden(dateOffset(-365), NOW), true);
  });
});
