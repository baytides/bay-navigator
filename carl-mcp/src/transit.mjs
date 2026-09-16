/**
 * Transit handoff links.
 *
 * Parity note: `appleMapsURL` mirrors `TransitDirections.appleMapsURL` in
 * apps/apple/.../AITools/TransitDirections.swift — same Unified Map URL, same
 * `mode=transit`, same "omit source to mean current location" behaviour.
 *
 * Unlike the Apple build, an MCP host may be on any platform, so we also return
 * a Google Maps link and the regional trip planner.
 */

/** Apple Unified Map URL — opens the Maps app with transit preselected. */
export function appleMapsURL(destination, origin) {
  const u = new URL('https://maps.apple.com/directions');
  u.searchParams.set('destination', destination);
  u.searchParams.set('mode', 'transit');
  if (origin) u.searchParams.set('source', origin);
  return u.toString();
}

/** Google Maps transit directions. */
export function googleMapsURL(destination, origin) {
  const u = new URL('https://www.google.com/maps/dir/');
  u.searchParams.set('api', '1');
  u.searchParams.set('destination', destination);
  u.searchParams.set('travelmode', 'transit');
  if (origin) u.searchParams.set('origin', origin);
  return u.toString();
}

/** 511.org is the Bay Area's official multi-agency trip planner. */
export const TRIP_PLANNER = 'https://511.org/transit/trip-planner';

export function transitDirections({ destination, origin }) {
  const from = origin ? `from ${origin}` : 'from your current location';
  return [
    `Public-transit directions to **${destination}** (${from}):`,
    '',
    `- Apple Maps: ${appleMapsURL(destination, origin)}`,
    `- Google Maps: ${googleMapsURL(destination, origin)}`,
    `- Bay Area 511 trip planner: ${TRIP_PLANNER}`,
    '',
    "Share the link that matches the rider's device. If cost might be a barrier, run " +
      '`search_resources` for "Clipper START", "RTC discount card" or "paratransit" — discounted ' +
      'fares exist for low-income riders, seniors, youth and riders with disabilities.',
  ].join('\n');
}
