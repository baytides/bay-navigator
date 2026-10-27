/**
 * Unit tests for azure-functions/shared/rate-limit.js
 *
 * Covers token exhaustion, window reset, per-caller isolation, the x-forwarded-for
 * parsing that identifies a caller behind the Azure front end, and the shape of
 * the 429 response. No real endpoint is invoked and no network call is made —
 * requests are synthetic header bags.
 *
 * Run with: node --test tests/unit/rate-limit.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} = require('../../azure-functions/shared/rate-limit.js');

/** Minimal stand-in for an Azure Functions request. */
function reqFrom(ip) {
  return { headers: { 'x-forwarded-for': ip } };
}

describe('getClientIp', () => {
  it('takes the left-most entry and strips the port', () => {
    assert.strictEqual(getClientIp(reqFrom('203.0.113.7:51234, 10.0.0.1')), '203.0.113.7');
  });

  it('keeps IPv6 addresses intact', () => {
    assert.strictEqual(getClientIp(reqFrom('2001:db8::1')), '2001:db8::1');
  });

  it('returns null when the header is absent', () => {
    assert.strictEqual(getClientIp({ headers: {} }), null);
  });
});

describe('checkRateLimit', () => {
  it('allows up to the limit, then rejects', () => {
    // Unique IP per test so buckets never collide across cases.
    const req = reqFrom('198.51.100.1');
    const opts = { limit: 3, windowMs: 60_000 };

    assert.strictEqual(checkRateLimit(req, opts).allowed, true);
    assert.strictEqual(checkRateLimit(req, opts).allowed, true);

    const third = checkRateLimit(req, opts);
    assert.strictEqual(third.allowed, true);
    assert.strictEqual(third.remaining, 0, 'last allowed request leaves no tokens');

    const fourth = checkRateLimit(req, opts);
    assert.strictEqual(fourth.allowed, false, 'fourth request over a limit of 3 is rejected');
    assert.ok(fourth.retryAfterSeconds >= 1, 'a rejection always advises a retry delay');
  });

  it('counts each caller separately', () => {
    const opts = { limit: 1, windowMs: 60_000 };

    assert.strictEqual(checkRateLimit(reqFrom('198.51.100.2'), opts).allowed, true);
    assert.strictEqual(checkRateLimit(reqFrom('198.51.100.2'), opts).allowed, false);

    // A different caller must be unaffected by the first one's exhaustion.
    assert.strictEqual(
      checkRateLimit(reqFrom('198.51.100.3'), opts).allowed,
      true,
      'one abusive caller must not throttle everybody else'
    );
  });

  it('refills once the window elapses', () => {
    const req = reqFrom('198.51.100.4');

    // A 1ms window expires between calls, which exercises the reset branch
    // without needing a fake clock.
    assert.strictEqual(checkRateLimit(req, { limit: 1, windowMs: 1 }).allowed, true);
    const after = Date.now() + 2;
    while (Date.now() < after) {
      /* spin ~2ms */
    }
    assert.strictEqual(
      checkRateLimit(req, { limit: 1, windowMs: 1 }).allowed,
      true,
      'tokens come back after the window rolls over'
    );
  });

  it('reports remaining tokens as it counts down', () => {
    const req = reqFrom('198.51.100.5');
    const opts = { limit: 2, windowMs: 60_000 };

    assert.strictEqual(checkRateLimit(req, opts).remaining, 1);
    assert.strictEqual(checkRateLimit(req, opts).remaining, 0);
  });
});

describe('rateLimitResponse', () => {
  it('returns a 429 that tells clients to back off and is never cached', () => {
    const verdict = { allowed: false, remaining: 0, retryAfterSeconds: 42, limit: 60 };
    const res = rateLimitResponse(verdict, { 'Access-Control-Allow-Origin': '*' });

    assert.strictEqual(res.status, 429);
    assert.strictEqual(res.headers['Retry-After'], '42');
    assert.strictEqual(res.headers['X-RateLimit-Limit'], '60');
    // A cached 429 at the CDN would be served to every user, not just the abuser.
    assert.strictEqual(res.headers['Cache-Control'], 'no-store');
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], '*');

    const body = JSON.parse(res.body);
    assert.strictEqual(body.retryAfter, 42);
    // The message must not disclose anything about upstream providers.
    assert.ok(!/azure|maps|511/i.test(body.error), 'error text stays generic');
  });
});
