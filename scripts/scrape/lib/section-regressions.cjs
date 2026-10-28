/**
 * Compare two municipal-code index snapshots and report material losses.
 *
 * Pure logic only — no network, no filesystem, no exit codes — so it can be
 * unit-tested without running the scraper. The scraper
 * (scripts/scrape/deep-scrape-municipal-codes.cjs) fetches the published index
 * and turns these findings into log output and an exit code.
 *
 * Why this exists: a scrape that collects almost nothing still exits 0 and
 * still uploads, so a city quietly going dark is indistinguishable from a
 * healthy run. Berkeley fell from 5 sections to 1 and Oakland from 103 to 96
 * across four consecutive green weekly runs, and it was only noticed when a
 * Carl test that happened to assert a section count started failing. Counting
 * is the scrape pipeline's job, not a downstream test's.
 */

/** A city losing more than this share of its sections is treated as a regression. */
const DEFAULT_TOLERANCE = 0.25;

/** At or below this many sections, a city's source is probably broken. */
const DEFAULT_SUSPICIOUS_MIN = 5;

/**
 * @param {Record<string, {city?: string, sections?: number}>} before - published index cities
 * @param {Record<string, {city?: string, sections?: number}>} after  - this run's cities
 * @param {{tolerance?: number, suspiciousMin?: number}} [opts]
 * @returns {{
 *   regressions: Array<{slug: string, city: string, before: number, after: number, pct: number}>,
 *   vanished: string[],
 *   suspicious: Array<{slug: string, city: string, sections: number}>
 * }}
 */
function findRegressions(before = {}, after = {}, opts = {}) {
  const tolerance = opts.tolerance ?? DEFAULT_TOLERANCE;
  const suspiciousMin = opts.suspiciousMin ?? DEFAULT_SUSPICIOUS_MIN;

  const regressions = [];
  const suspicious = [];

  for (const [slug, entry] of Object.entries(after)) {
    const city = entry.city || slug;
    const now = entry.sections ?? 0;

    if (now <= suspiciousMin) suspicious.push({ slug, city, sections: now });

    const prev = before[slug]?.sections;
    // No previous figure, or a previous zero, gives nothing to compare against:
    // a city appearing or recovering is not a regression.
    if (typeof prev !== 'number' || prev <= 0) continue;

    if (now < prev * (1 - tolerance)) {
      regressions.push({
        slug,
        city,
        before: prev,
        after: now,
        pct: Math.round((1 - now / prev) * 100),
      });
    }
  }

  // A city present before and absent now is the most severe case: its file is
  // gone rather than merely thin, so a count comparison would never see it.
  const vanished = Object.keys(before).filter((slug) => !(slug in after));

  return { regressions, vanished, suspicious };
}

module.exports = { findRegressions, DEFAULT_TOLERANCE, DEFAULT_SUSPICIOUS_MIN };
