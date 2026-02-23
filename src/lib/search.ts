/**
 * Shared search utilities — single source of truth for all Typesense calls.
 *
 * Every search surface (homepage, directory, Carl AI) should call
 * `searchTypesense()` from this module instead of crafting its own fetch.
 */

import { TYPESENSE_CONFIG, TYPESENSE_QUERY } from './search-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchOptions {
  /** Maximum results to return (default 12). */
  limit?: number;
  /** Filter to a specific category. */
  category?: string;
  /** Filter to programs matching specific demographic groups. */
  groups?: string[];
  /**
   * Filter to programs serving specific counties (Yelp-like location filtering).
   *
   * Pass county slugs (e.g. `['santa-clara', 'all']`). Always include `'all'`
   * to also return Bay Area / Statewide programs alongside local ones.
   */
  counties?: string[];
  /** Raw Typesense `filter_by` clause appended to any generated filters. */
  filterBy?: string;
  /** Lat/lng pair — enables geo-proximity sorting. */
  geoPoint?: [number, number];
  /** Only return results within this radius (km) of `geoPoint`. Default 50. */
  geoRadiusKm?: number;
  /** Override the Typesense base URL (e.g. localhost for dev). */
  baseUrl?: string;
  /** Abort signal for request cancellation. */
  signal?: AbortSignal;
}

export interface ProgramResult {
  id: string;
  name: string;
  description: string;
  category: string;
  area: string;
  city: string;
  keywords: string;
  groups: string[];
  counties: string[];
  phone: string;
  link: string;
  /** Typesense text-match score (when available). */
  score?: number;
}

// ---------------------------------------------------------------------------
// Typesense search
// ---------------------------------------------------------------------------

/**
 * Search the Typesense `programs` collection with unified field weights.
 *
 * This is the **only** function that should issue Typesense search requests
 * across the entire codebase. All search surfaces delegate here so that
 * query_by fields, weights, typo tolerance, and filtering stay consistent.
 */
export async function searchTypesense(
  query: string,
  options: SearchOptions = {}
): Promise<ProgramResult[]> {
  const baseUrl = options.baseUrl || TYPESENSE_CONFIG.baseUrl;
  const limit = options.limit || 12;

  const params = new URLSearchParams({
    q: query,
    query_by: TYPESENSE_QUERY.queryBy,
    query_by_weights: TYPESENSE_QUERY.queryByWeights,
    per_page: String(limit),
    num_typos: TYPESENSE_QUERY.numTypos,
    typo_tokens_threshold: TYPESENSE_QUERY.typoTokensThreshold,
  });

  // Build filter_by from structured options
  const filters: string[] = [];
  if (options.category) {
    filters.push(`category:=${options.category}`);
  }
  if (options.groups?.length) {
    filters.push(`groups:=[${options.groups.join(',')}]`);
  }
  if (options.counties?.length) {
    filters.push(`counties:=[${options.counties.join(',')}]`);
  }
  if (options.filterBy) {
    filters.push(options.filterBy);
  }

  // Geo-proximity: sort by text relevance first, then distance
  if (options.geoPoint) {
    const [lat, lng] = options.geoPoint;
    params.set('sort_by', `_text_match:desc,location(${lat},${lng}):asc`);

    const radiusKm = options.geoRadiusKm ?? 50;
    if (radiusKm < 100) {
      filters.push(`location:(${lat},${lng},${radiusKm} km)`);
    }
  }

  if (filters.length) {
    params.set('filter_by', filters.join(' && '));
  }

  const url = `${baseUrl}/collections/${TYPESENSE_CONFIG.collection}/documents/search?${params.toString()}`;

  const response = await fetch(url, {
    signal: options.signal ?? AbortSignal.timeout(5000),
    headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_CONFIG.searchKey },
  });

  if (!response.ok) {
    throw new Error(`Typesense ${response.status}`);
  }

  const data = await response.json();

  return (data.hits || []).map(
    (hit: { document: Record<string, unknown>; text_match_info?: { score?: number } }) => ({
      id: hit.document.id,
      name: hit.document.name || '',
      description: hit.document.description || '',
      category: hit.document.category || '',
      area: hit.document.area || '',
      city: hit.document.city || '',
      keywords: hit.document.keywords || '',
      groups: hit.document.groups || [],
      counties: hit.document.counties || [],
      phone: hit.document.phone || '',
      link: hit.document.link || '',
      score: hit.text_match_info?.score,
    })
  );
}

// ---------------------------------------------------------------------------
// Query helpers (synonym expansion, rewrites, best bets)
// ---------------------------------------------------------------------------

/**
 * Apply natural-language query rewrites.
 *
 * Maps conversational phrases ("I need food", "can't pay rent") to
 * effective search terms ("food assistance", "rental assistance").
 *
 * @param query  Raw user input.
 * @param rewrites  Map of lowercased phrases to rewritten queries
 *                  (from search-config.yml `query_rewrites`).
 */
export function rewriteQuery(query: string, rewrites: Record<string, string>): string {
  const normalized = query.toLowerCase().trim();
  return rewrites[normalized] || query;
}

/**
 * Expand a query with its top synonyms for broader recall.
 *
 * Appends up to 3 synonym terms so Typesense considers related vocabulary.
 * Once server-side synonyms are live (Phase 7), this function becomes a
 * no-op and can be removed.
 *
 * @param query     Raw or rewritten query.
 * @param synonyms  Map of terms to synonym arrays
 *                  (from search-config.yml `synonyms`).
 */
export function expandSynonyms(query: string, synonyms: Record<string, string[]>): string {
  const normalized = query.toLowerCase().trim();
  const terms = normalized.split(/\s+/);

  // Check multi-word match first, then single-word
  const synonymValues =
    synonyms[normalized] || (terms.length === 1 ? synonyms[terms[0]] : undefined);

  if (!synonymValues) return query;

  // Append top 3 synonyms to broaden search without diluting intent
  return `${query} ${synonymValues.slice(0, 3).join(' ')}`;
}

/**
 * Return program IDs that should be promoted for a given query.
 *
 * Best-bet results are shown first, before Typesense-ranked results.
 *
 * @param query     Raw or rewritten query.
 * @param bestBets  Map of query patterns to arrays of program IDs
 *                  (from search-config.yml `best_bets`).
 */
export function getBestBets(query: string, bestBets: Record<string, string[]>): string[] {
  const normalized = query.toLowerCase().trim();

  // Exact match first
  if (bestBets[normalized]) {
    return bestBets[normalized];
  }

  // Check if query starts with any best-bet key
  for (const [key, ids] of Object.entries(bestBets)) {
    if (normalized.startsWith(key) || key.startsWith(normalized)) {
      return ids;
    }
  }

  return [];
}
