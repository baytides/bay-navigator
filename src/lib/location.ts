/**
 * Shared location utilities — single source of truth for location resolution.
 *
 * Resolves user input (ZIP code, city name, county name) to a county slug
 * that can be used for Typesense `counties` filtering.
 *
 * Data flow:
 *   User types "94112" or "San Jose" or "Alameda County"
 *   → resolveLocationInput() returns { countySlug: 'san-francisco', ... }
 *   → searchTypesense(query, { counties: ['san-francisco', 'all'] })
 *   → Typesense returns local + regional programs (Yelp-like behavior)
 */

// ---------------------------------------------------------------------------
// County name → slug mapping (matches program data `counties` field slugs)
// ---------------------------------------------------------------------------

export const COUNTY_NAME_TO_SLUG: Record<string, string> = {
  'Alameda County': 'alameda',
  'Contra Costa County': 'contra-costa',
  'Marin County': 'marin',
  'Napa County': 'napa',
  'San Francisco': 'san-francisco',
  'San Mateo County': 'san-mateo',
  'Santa Clara County': 'santa-clara',
  'Solano County': 'solano',
  'Sonoma County': 'sonoma',
};

/** Reverse mapping: slug → county display name. */
export const COUNTY_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTY_NAME_TO_SLUG).map(([name, slug]) => [slug, name]),
);

// ---------------------------------------------------------------------------
// Location resolution
// ---------------------------------------------------------------------------

export interface ResolvedLocation {
  /** County slug matching program data (e.g. 'santa-clara', 'san-francisco'). */
  countySlug: string;
  /** Display-friendly county name (e.g. 'Santa Clara County'). */
  countyName: string;
  /** City name if resolved (e.g. 'San Jose'). */
  city?: string;
}

/**
 * Resolve user input (ZIP, city, or county name) to a county slug.
 *
 * @param input       Raw user input (e.g. '94112', 'San Jose', 'oakland').
 * @param zipToCity   ZIP → city name map (from zipcodes.yml).
 * @param cityToCounty  Lowercase city name → county name map (from cities.yml).
 * @returns Resolved location or null if input doesn't match.
 */
export function resolveLocationInput(
  input: string,
  zipToCity: Record<string, string>,
  cityToCounty: Record<string, string>,
): ResolvedLocation | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Try ZIP code lookup
  if (/^\d{5}$/.test(trimmed)) {
    const city = zipToCity[trimmed];
    if (city) {
      const countyName = cityToCounty[city.toLowerCase()];
      if (countyName) {
        const countySlug = COUNTY_NAME_TO_SLUG[countyName];
        if (countySlug) {
          return { countySlug, countyName, city };
        }
      }
    }
    return null;
  }

  // 2. Try city name lookup (case-insensitive)
  const normalizedInput = trimmed.toLowerCase();
  const countyFromCity = cityToCounty[normalizedInput];
  if (countyFromCity) {
    const countySlug = COUNTY_NAME_TO_SLUG[countyFromCity];
    if (countySlug) {
      return { countySlug, countyName: countyFromCity, city: trimmed };
    }
  }

  // 3. Try direct county name match (user typed "Alameda County", etc.)
  for (const [name, slug] of Object.entries(COUNTY_NAME_TO_SLUG)) {
    if (name.toLowerCase() === normalizedInput || slug === normalizedInput) {
      return { countySlug: slug, countyName: name };
    }
  }

  return null;
}

/**
 * Build the counties filter array for Typesense search.
 *
 * Returns `[countySlug, 'all']` so that both local programs and
 * Bay Area / Statewide programs (counties: ['all']) are included.
 */
export function buildCountiesFilter(countySlug: string): string[] {
  return [countySlug, 'all'];
}
