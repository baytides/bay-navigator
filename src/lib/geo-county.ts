/**
 * Resolve a GPS fix to a Bay Area county.
 *
 * WHY: "Use my location" previously asked for the browser geolocation
 * permission, received real coordinates, wrote "Near me" into the location box
 * — and then `handleSearch` treated "Near me" as an empty location, so the
 * search ran with NO county filter at all. The coordinates were forwarded to the
 * search function as `geoPoint`, which never read them. Pressing the button
 * prompted for a sensitive permission and then did strictly less than typing
 * your own city.
 *
 * WHY COUNTY AND NOT DISTANCE: only ~30% of programs carry coordinates, but 100%
 * carry `counties[]`. Ranking by distance would float the geocoded 30% above the
 * rest, burying CalFresh, Medi-Cal, SSI and 211 — the statewide programs that
 * are roughly half the directory and the ones people most need — underneath
 * whichever local pantry happened to have a pin. County is the only unit the
 * data actually supports, and the existing filter already keeps `county OR
 * 'all'` so statewide help survives a local search.
 */

export interface CountyHit {
  name: string;
  slug: string;
}

interface CountyFeature {
  name: string;
  slug: string;
  polygons: number[][][][];
}

let cache: CountyFeature[] | null = null;
let inflight: Promise<CountyFeature[] | null> | null = null;

/** 35 KB, fetched only when someone actually asks to use their location. */
async function loadCounties(url = '/data/county-lookup.json'): Promise<CountyFeature[] | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      cache = (j && j.counties) || null;
      return cache;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Ray casting. Mirrored by the Swift and Dart ports — keep them in step. */
function inRing(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function countyForPoint(
  latitude: number,
  longitude: number,
  counties: CountyFeature[]
): CountyHit | null {
  for (const c of counties) {
    for (const poly of c.polygons) {
      if (!poly.length || !inRing(longitude, latitude, poly[0])) continue;
      let inHole = false;
      for (let k = 1; k < poly.length; k++) {
        if (inRing(longitude, latitude, poly[k])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return { name: c.name, slug: c.slug };
    }
  }
  return null;
}

/**
 * Ask the browser where we are, then map that to a county.
 *
 * Resolves to null for every failure mode — denied, unavailable, timed out, or
 * outside the nine counties — so the caller can say something true instead of
 * guessing a county. Someone in Sacramento should be told this covers the Bay
 * Area, not quietly handed Solano's programs.
 */
export async function detectCounty(opts: { timeoutMs?: number; url?: string } = {}) {
  const { timeoutMs = 8000, url } = opts;
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { ok: false as const, reason: 'unsupported' as const };
  }

  const position = await new Promise<GeolocationPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 300000, enableHighAccuracy: false }
    );
  });
  if (!position) return { ok: false as const, reason: 'denied' as const };

  const counties = await loadCounties(url);
  if (!counties) return { ok: false as const, reason: 'lookup-unavailable' as const };

  const hit = countyForPoint(position.coords.latitude, position.coords.longitude, counties);
  if (!hit) return { ok: false as const, reason: 'outside-bay-area' as const };

  return { ok: true as const, county: hit };
}
