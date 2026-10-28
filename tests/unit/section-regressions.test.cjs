/**
 * Unit tests for scripts/scrape/lib/section-regressions.cjs
 *
 * The weekly municipal-code scrape exits 0 and uploads whatever it collected,
 * so a city going dark reads as a healthy run. These cases are the real
 * regressions that slipped through: Berkeley 5 -> 1 and Oakland 103 -> 96 over
 * four consecutive green runs.
 *
 * Run with: node --test tests/unit/section-regressions.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { findRegressions } = require('../../scripts/scrape/lib/section-regressions.cjs');

describe('findRegressions', () => {
  it('says nothing is wrong when counts hold steady or grow', () => {
    const before = { oakland: { city: 'Oakland', sections: 96 } };
    const after = { oakland: { city: 'Oakland', sections: 103 } };

    const r = findRegressions(before, after);
    assert.deepStrictEqual(r.regressions, []);
    assert.deepStrictEqual(r.vanished, []);
    assert.deepStrictEqual(r.suspicious, []);
  });

  it('catches the Berkeley collapse that four green runs missed', () => {
    const before = { berkeley: { city: 'Berkeley', sections: 5 } };
    const after = { berkeley: { city: 'Berkeley', sections: 1 } };

    const { regressions, suspicious } = findRegressions(before, after);
    assert.strictEqual(regressions.length, 1);
    assert.deepStrictEqual(regressions[0], {
      slug: 'berkeley',
      city: 'Berkeley',
      before: 5,
      after: 1,
      pct: 80,
    });
    // Also flagged on the absolute floor, which is what catches a city that is
    // ALREADY broken and so shows no week-on-week drop.
    assert.deepStrictEqual(suspicious, [{ slug: 'berkeley', city: 'Berkeley', sections: 1 }]);
  });

  it('tolerates ordinary drift like Oakland 103 -> 96', () => {
    const before = { oakland: { city: 'Oakland', sections: 103 } };
    const after = { oakland: { city: 'Oakland', sections: 96 } };

    // ~7%: real churn in the source, not a broken scraper. Failing on this
    // would train everyone to ignore the check.
    assert.deepStrictEqual(findRegressions(before, after).regressions, []);
  });

  it('fires once a drop passes the tolerance', () => {
    const before = { x: { city: 'X', sections: 100 } };
    assert.deepStrictEqual(
      findRegressions(before, { x: { city: 'X', sections: 76 } }).regressions,
      [],
      '24% is within the default 25% tolerance'
    );
    assert.strictEqual(
      findRegressions(before, { x: { city: 'X', sections: 74 } }).regressions.length,
      1,
      '26% is not'
    );
  });

  it('reports a city that disappeared entirely', () => {
    const before = {
      oakland: { city: 'Oakland', sections: 96 },
      richmond: { city: 'Richmond', sections: 17 },
    };
    const after = { oakland: { city: 'Oakland', sections: 96 } };

    const r = findRegressions(before, after);
    assert.deepStrictEqual(r.vanished, ['richmond']);
    assert.deepStrictEqual(r.regressions, [], 'a missing city is not also a count regression');
  });

  it('does not punish a new or recovering city', () => {
    const r = findRegressions(
      { sunnyvale: { city: 'Sunnyvale', sections: 0 } },
      {
        sunnyvale: { city: 'Sunnyvale', sections: 40 },
        hayward: { city: 'Hayward', sections: 25 },
      }
    );
    assert.deepStrictEqual(r.regressions, []);
    assert.deepStrictEqual(r.vanished, []);
  });

  it('treats a missing sections field as zero rather than crashing', () => {
    const r = findRegressions({ x: { city: 'X', sections: 50 } }, { x: { city: 'X' } });
    assert.strictEqual(r.regressions.length, 1);
    assert.strictEqual(r.regressions[0].after, 0);
    assert.strictEqual(r.regressions[0].pct, 100);
  });

  it('honours custom thresholds', () => {
    const before = { x: { city: 'X', sections: 100 } };
    const after = { x: { city: 'X', sections: 95 } };

    assert.deepStrictEqual(findRegressions(before, after).regressions, []);
    assert.strictEqual(
      findRegressions(before, after, { tolerance: 0.01 }).regressions.length,
      1,
      'a 1% tolerance should flag a 5% drop'
    );
    assert.strictEqual(
      findRegressions(before, after, { suspiciousMin: 100 }).suspicious.length,
      1,
      'suspiciousMin is configurable'
    );
  });

  it('copes with empty input from a first run', () => {
    const r = findRegressions({}, {});
    assert.deepStrictEqual(r, { regressions: [], vanished: [], suspicious: [] });
  });
});
