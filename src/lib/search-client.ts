/**
 * Browser glue for search-core.
 *
 * Fetches the static index from the CDN and builds a MiniSearch index in the
 * page. There is no server in this path at all.
 *
 * This replaces a hard dependency on `search.baytides.org` — a Meilisearch
 * instance on a Mac Mini behind a Cloudflare Tunnel — which was the single
 * point of failure for the site's primary navigation surface. The homepage had
 * NO fallback: `home-search.js` caught every error and rendered "Search is
 * temporarily unavailable", so when the Mac Mini was down (as it was, 502,
 * while this was written) homepage search simply did not work.
 *
 * 823 documents is a small corpus. MiniSearch builds the index in well under
 * 100ms, so we ship documents only and never a serialized index.
 */

import { makeSearcher, normalize, type ProgramLike, type SearchConfig } from './search-core';

export interface IndexDoc extends ProgramLike {
  link?: string;
  website?: string;
  lastUpdated?: string;
}

let searcherPromise: Promise<ReturnType<typeof makeSearcher<IndexDoc>>> | null = null;

/**
 * The city->county map holds display names ("Alameda County") but the index
 * stores slugs ("alameda"). Filtering on the display name matches nothing, so
 * every county-specific program is dropped and only `counties: ["all"]`
 * records survive — which silently removes the correct local answer. Slugify.
 */
export function countySlug(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+county$/, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Map a city or county mentioned in the query to a county slug. */
function makeCountyResolver(cityToCounty: Record<string, string>) {
  const entries = Object.entries(cityToCounty)
    .map(([city, county]) => [normalize(city), countySlug(county)] as const)
    // Longest first so "san mateo county" wins over "san mateo".
    .sort((a, b) => b[0].length - a[0].length);

  return (normalizedQuery: string): string | null => {
    for (const [city, county] of entries) {
      if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(normalizedQuery)) {
        return county;
      }
    }
    return null;
  };
}

/**
 * Load the index once per page and memoise. Safe to call repeatedly.
 * `indexUrl` is /data/search-index.json in production — Azure Static Web Apps
 * reserves /api/*, so the build relocates dist/api to dist/data.
 */
export function getSearcher(
  indexUrl: string,
  config: SearchConfig,
  cityToCounty: Record<string, string> = {}
) {
  if (!searcherPromise) {
    searcherPromise = fetch(indexUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`search index HTTP ${r.status}`);
        return r.json();
      })
      .then((payload) => {
        const docs: IndexDoc[] = payload.documents || [];
        return makeSearcher<IndexDoc>(docs, config, { countyOf: makeCountyResolver(cityToCounty) });
      })
      .catch((err) => {
        // Reset so a later attempt can retry rather than caching the failure.
        searcherPromise = null;
        throw err;
      });
  }
  return searcherPromise;
}

/**
 * Adapter matching the `searchFn(query, opts)` contract that home-search.js
 * expects. Takes the RAW query — the core does rewriting, synonym expansion
 * and best-bet pinning itself, so the caller must not pre-process it.
 */
export function makeSearchFn(
  indexUrl: string,
  config: SearchConfig,
  cityToCounty: Record<string, string> = {}
) {
  return async function searchFn(
    query: string,
    opts: { limit?: number; counties?: string | string[] } = {}
  ): Promise<IndexDoc[]> {
    const searcher = await getSearcher(indexUrl, config, cityToCounty);

    // home-search.js hands us a Meilisearch-style filter; pull the slug back out.
    let county: string | undefined;
    const raw = opts.counties;
    if (typeof raw === 'string') {
      const m = raw.match(/counties\s*=\s*"?([A-Za-z\s-]+?)"?(?:\s|$|\))/);
      if (m) county = countySlug(m[1]);
    } else if (Array.isArray(raw) && raw.length) {
      county = countySlug(String(raw[0]));
    }

    const out = searcher(query, { limit: opts.limit || 12, county });
    return out.results.map((d) => ({ ...d, link: d.link || d.website || '' }));
  };
}
