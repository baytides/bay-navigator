/**
 * Shared search configuration — single source of truth for all search surfaces.
 *
 * Consumed by:
 *   - Homepage Typesense search (index.astro)
 *   - Directory page Fuse.js + Typesense search (SearchBar.astro)
 *   - Carl AI Typesense search (SmartAssistant.astro)
 *   - Build-time search index generation (generate-api.cjs)
 */

// ---------------------------------------------------------------------------
// Typesense
// ---------------------------------------------------------------------------

export const TYPESENSE_CONFIG = {
  /** Production search endpoint (Cloudflare Tunnel → Mac Mini). */
  baseUrl: 'https://search.baytides.org',
  /** Local dev Typesense instance. */
  devBaseUrl: 'http://localhost:8108',
  /** Public search-only API key (safe to ship to client). */
  searchKey: 'fOjrMAfZl4tb9Dux7ZZEdSOGXWjFzu5N',
  /** Collection name in Typesense. */
  collection: 'programs',
} as const;

/**
 * Unified query fields and relative weights for Typesense full-text search.
 *
 * All four search surfaces MUST use the same `query_by` / `query_by_weights`
 * so that identical queries return identical ranked results.
 */
export const TYPESENSE_QUERY = {
  queryBy: 'name,keywords,description,area,city',
  queryByWeights: '5,4,2,1,1',
  numTypos: '2',
  typoTokensThreshold: '1',
} as const;

// ---------------------------------------------------------------------------
// Fuse.js (client-side fallback)
// ---------------------------------------------------------------------------

export const FUSE_SEARCH_KEYS = [
  { name: 'name', weight: 0.4 },
  { name: 'keywords', weight: 0.25 },
  { name: 'description', weight: 0.2 },
  { name: 'category', weight: 0.1 },
  { name: 'area', weight: 0.05 },
] as const;

export const FUSE_OPTIONS = {
  keys: [...FUSE_SEARCH_KEYS],
  threshold: 0.3,
  distance: 60,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  useExtendedSearch: true,
} as const;
