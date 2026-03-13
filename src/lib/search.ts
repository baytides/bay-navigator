/**
 * Shared search utilities — single source of truth for all Meilisearch calls.
 *
 * Every search surface (homepage, directory, Carl AI) should call
 * `searchMeilisearch()` from this module instead of crafting its own fetch.
 */

import { MEILISEARCH_CONFIG, MEILISEARCH_QUERY } from './search-config';

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
  /** Lat/lng pair — enables geo-proximity sorting. */
  geoPoint?: [number, number];
  /** Only return results within this radius (km) of `geoPoint`. Default 50. */
  geoRadiusKm?: number;
  /** Override the Meilisearch base URL (e.g. localhost for dev). */
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
  /** Meilisearch ranking score (when available). */
  score?: number;
}

// ---------------------------------------------------------------------------
// Meilisearch search
// ---------------------------------------------------------------------------

/**
 * Search the Meilisearch `programs` index.
 *
 * This is the **only** function that should issue Meilisearch search requests
 * across the entire codebase. All search surfaces delegate here so that
 * searchable attributes, filtering, and geo stay consistent.
 */
export async function searchMeilisearch(
  query: string,
  options: SearchOptions = {}
): Promise<ProgramResult[]> {
  const baseUrl = options.baseUrl || MEILISEARCH_CONFIG.baseUrl;
  const limit = options.limit || 12;

  // Build filter string — Meilisearch uses SQL-like syntax
  const filterParts: string[] = [];

  if (options.category) {
    filterParts.push(`category = "${options.category}"`);
  }
  if (options.groups?.length) {
    const groupList = options.groups.map((g) => `"${g}"`).join(', ');
    filterParts.push(`groups IN [${groupList}]`);
  }
  if (options.counties?.length) {
    const countyList = options.counties.map((c) => `"${c}"`).join(', ');
    filterParts.push(`counties IN [${countyList}]`);
  }
  if (options.geoPoint) {
    const [lat, lng] = options.geoPoint;
    const radiusM = (options.geoRadiusKm ?? 50) * 1000;
    filterParts.push(`_geoRadius(${lat}, ${lng}, ${radiusM})`);
  }

  const body: Record<string, unknown> = {
    q: query,
    limit,
    attributesToSearchOn: MEILISEARCH_QUERY.attributesToSearchOn,
    showRankingScore: true,
  };

  if (filterParts.length) {
    body.filter = filterParts.join(' AND ');
  }

  // Geo-proximity sort: closest first, relevance as tiebreaker
  if (options.geoPoint) {
    const [lat, lng] = options.geoPoint;
    body.sort = [`_geoPoint(${lat}, ${lng}):asc`];
  }

  const url = `${baseUrl}/indexes/${MEILISEARCH_CONFIG.index}/search`;

  const response = await fetch(url, {
    method: 'POST',
    signal: options.signal ?? AbortSignal.timeout(5000),
    headers: {
      Authorization: `Bearer ${MEILISEARCH_CONFIG.searchKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Meilisearch ${response.status}`);
  }

  const data = await response.json();

  return (data.hits || []).map((hit: Record<string, unknown>) => ({
    id: hit.id,
    name: hit.name || '',
    description: hit.description || '',
    category: hit.category || '',
    area: hit.area || '',
    city: hit.city || '',
    keywords: hit.keywords || '',
    groups: hit.groups || [],
    counties: hit.counties || [],
    phone: hit.phone || '',
    link: hit.link || '',
    score: hit._rankingScore as number | undefined,
  }));
}

// ---------------------------------------------------------------------------
// Query helpers (synonym expansion, rewrites, best bets)
// ---------------------------------------------------------------------------

/**
 * Apply natural-language query rewrites.
 *
 * Maps conversational phrases ("I need food", "can't pay rent") to
 * effective search terms ("food assistance", "rental assistance").
 */
export function rewriteQuery(query: string, rewrites: Record<string, string>): string {
  const normalized = query.toLowerCase().trim();
  return rewrites[normalized] || query;
}

/**
 * Expand a query with its top synonyms for broader recall.
 *
 * Appends up to 3 synonym terms so Meilisearch considers related vocabulary.
 */
export function expandSynonyms(query: string, synonyms: Record<string, string[]>): string {
  const normalized = query.toLowerCase().trim();
  const terms = normalized.split(/\s+/);

  const synonymValues =
    synonyms[normalized] || (terms.length === 1 ? synonyms[terms[0]] : undefined);

  if (!synonymValues) return query;

  return `${query} ${synonymValues.slice(0, 3).join(' ')}`;
}

/**
 * Return program IDs that should be promoted for a given query.
 *
 * Best-bet results are shown first, before Meilisearch-ranked results.
 */
export function getBestBets(query: string, bestBets: Record<string, string[]>): string[] {
  const normalized = query.toLowerCase().trim();

  if (bestBets[normalized]) {
    return bestBets[normalized];
  }

  for (const [key, ids] of Object.entries(bestBets)) {
    if (normalized.startsWith(key) || key.startsWith(normalized)) {
      return ids;
    }
  }

  return [];
}
