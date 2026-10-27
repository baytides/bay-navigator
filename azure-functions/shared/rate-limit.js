/**
 * Rate Limiting Utility for Azure Functions
 *
 * Protects anonymous, CORS-open endpoints that spend money upstream. `geocode`
 * and `traffic-tiles` both forward to a metered Azure Maps subscription, so
 * without a throttle anyone with a shell loop can exhaust the quota or run up
 * the bill.
 *
 * PRIVACY: buckets are keyed by the daily-salted hash from `logger.hashIP`,
 * never a raw IP. Keys therefore cannot be correlated across days, and no
 * plaintext address is ever held in memory. This matches the privacy posture
 * documented in logger.js — it matters because people reach this site looking
 * for safety, legal, and LGBTQ resources.
 *
 * SCOPE — read before relying on this: the bucket store is per-instance and
 * in-memory. On a consumption plan the effective ceiling is roughly
 * (limit x live instances), and a cold start forgets every bucket. That makes
 * this a deterrent against casual scraping and runaway scripts, NOT a hard
 * global cap. If you need a true ceiling, front these endpoints with
 * Cloudflare or Azure API Management rate-limiting rules.
 *
 * Usage:
 *   const { checkRateLimit, rateLimitResponse } = require('../shared/rate-limit');
 *   const verdict = checkRateLimit(req, { limit: 30, windowMs: 60_000 });
 *   if (!verdict.allowed) { context.res = rateLimitResponse(verdict, corsHeaders); return; }
 */

const { hashIP } = require('./logger');

/** Bucket store: hashedIp -> { tokens, resetAt }. Per-instance, see SCOPE above. */
const buckets = new Map();

/** Hard ceiling on tracked buckets, so a spray of unique IPs cannot grow memory without bound. */
const MAX_BUCKETS = 10_000;

/**
 * Best-effort client IP. Azure Functions sits behind a front end, so the
 * original address arrives in x-forwarded-for as "ip:port, proxy, proxy".
 * We take the left-most entry and drop any :port suffix.
 *
 * x-forwarded-for is client-spoofable. That is acceptable here: the goal is to
 * slow down unsophisticated abuse, and a spoofing attacker just lands in a
 * different bucket rather than escaping the limiter entirely.
 */
function getClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'] || req?.headers?.['X-Forwarded-For'] || '';
  const first = String(forwarded).split(',')[0].trim();
  if (!first) return null;
  // Strip :port, but leave bare IPv6 (which contains colons) intact.
  const isIpv6 = first.includes('::') || first.split(':').length > 2;
  return isIpv6 ? first.replace(/^\[|\]$/g, '') : first.split(':')[0];
}

/** Drop expired buckets; called opportunistically so there is no timer to leak. */
function sweep(now) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Consume one token for this caller.
 *
 * @param {object} req - the Functions request (for headers)
 * @param {object} options
 * @param {number} options.limit    - requests allowed per window
 * @param {number} options.windowMs - window length in milliseconds
 * @returns {{allowed: boolean, remaining: number, retryAfterSeconds: number, limit: number}}
 */
function checkRateLimit(req, { limit, windowMs }) {
  const now = Date.now();
  const key = hashIP(getClientIp(req));

  if (buckets.size > MAX_BUCKETS) sweep(now);

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { tokens: limit, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.tokens <= 0) {
    return { allowed: false, remaining: 0, retryAfterSeconds, limit };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens, retryAfterSeconds, limit };
}

/**
 * Standard 429 for a rejected caller. Includes Retry-After so well-behaved
 * clients back off instead of hammering.
 */
function rateLimitResponse(verdict, extraHeaders = {}) {
  return {
    status: 429,
    headers: {
      ...extraHeaders,
      'Content-Type': 'application/json',
      'Retry-After': String(verdict.retryAfterSeconds),
      'X-RateLimit-Limit': String(verdict.limit),
      'X-RateLimit-Remaining': '0',
      // Never cache a throttle response, or a CDN will serve it to everyone.
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({
      error: 'Too many requests. Please slow down.',
      retryAfter: verdict.retryAfterSeconds,
    }),
  };
}

module.exports = {
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
};
