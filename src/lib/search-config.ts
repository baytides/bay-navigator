/**
 * Shared search configuration — single source of truth for all search surfaces.
 *
 * Consumed by:
 *   - Homepage Meilisearch search (index.astro)
 *   - Directory page Fuse.js + Meilisearch search (SearchBar.astro)
 *   - Carl AI Meilisearch search (SmartAssistant.astro)
 *   - Build-time search index generation (generate-api.cjs)
 */

// ---------------------------------------------------------------------------
// Meilisearch
// ---------------------------------------------------------------------------

export const MEILISEARCH_CONFIG = {
  /** Production search endpoint (Mac Mini, port forwarded via Cloudflare Tunnel). */
  baseUrl: 'https://search.baytides.org',
  /** Local dev Meilisearch instance. */
  devBaseUrl: 'http://localhost:7700',
  /** Public search-only API key (safe to ship to client). */
  searchKey: 'caf513ab51aa88344bd460d9a103997813c479b53c60921de400c853d9ee3fc5',
  /** Index name in Meilisearch. */
  index: 'programs',
} as const;

/**
 * Searchable attribute order for Meilisearch.
 * Earlier = higher ranking weight (matches src/scripts/sync-meilisearch.cjs).
 */
export const MEILISEARCH_QUERY = {
  attributesToSearchOn: ['name', 'keywords', 'description', 'area', 'city'],
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
