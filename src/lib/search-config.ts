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
  /**
   * Whether to try the hosted search server at all.
   *
   * Disabled 2026-09-16: the Mac Mini behind the Cloudflare Tunnel was shut
   * down along with Carl's Ollama backend, so `baseUrl` now returns 502. Search
   * already falls back to Fuse.js over the prebuilt index, but with this left
   * on, EVERY search first fires a doomed request and waits for it to fail —
   * a slow path for every visitor, in exchange for nothing.
   *
   * Set back to true if a search server is ever restored. Remember to re-add
   * the host to connect-src in public/staticwebapp.config.json.
   */
  enabled: false,
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
