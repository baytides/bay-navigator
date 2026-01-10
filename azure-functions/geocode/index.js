/**
 * Azure Maps Geocoding Azure Function
 *
 * Proxies geocoding requests to Azure Maps API, keeping the API key secure on the server.
 * Supports both address geocoding and reverse geocoding.
 *
 * Endpoints:
 *   GET /api/geocode?q={query}              - Forward geocode (address to coordinates)
 *   GET /api/geocode?lat={lat}&lon={lon}    - Reverse geocode (coordinates to address)
 */

// Azure Maps configuration
const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const AZURE_MAPS_API = 'https://atlas.microsoft.com';

// Bay Area bounding box for biasing results
const BAY_AREA_BBOX = {
  west: -123.5,
  south: 36.8,
  east: -121.0,
  north: 38.9,
};

/**
 * Forward geocode: address/query to coordinates
 * Uses Azure Maps Search Address API v1.0
 */
async function geocodeAddress(query) {
  const url = new URL(`${AZURE_MAPS_API}/search/address/json`);
  url.searchParams.set('api-version', '1.0');
  url.searchParams.set('query', query);
  url.searchParams.set('subscription-key', AZURE_MAPS_KEY);
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrySet', 'US');
  url.searchParams.set('language', 'en-US');

  // Bias results to Bay Area using bounding box (topLeft, btmRight)
  url.searchParams.set('topLeft', `${BAY_AREA_BBOX.north},${BAY_AREA_BBOX.west}`);
  url.searchParams.set('btmRight', `${BAY_AREA_BBOX.south},${BAY_AREA_BBOX.east}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Azure Maps geocode error:', errorText);
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Reverse geocode: coordinates to address
 * Uses Azure Maps Search Address Reverse API v1.0
 */
async function reverseGeocode(lat, lon) {
  const url = new URL(`${AZURE_MAPS_API}/search/address/reverse/json`);
  url.searchParams.set('api-version', '1.0');
  url.searchParams.set('query', `${lat},${lon}`);
  url.searchParams.set('subscription-key', AZURE_MAPS_KEY);
  url.searchParams.set('language', 'en-US');

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Azure Maps reverse geocode error:', errorText);
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.addresses || [];
}

/**
 * Filter results to Bay Area bounds
 */
function filterToBayArea(results) {
  return results.filter((result) => {
    if (!result.position) return false;

    const lat = result.position.lat;
    const lon = result.position.lon;
    return (
      lat >= BAY_AREA_BBOX.south &&
      lat <= BAY_AREA_BBOX.north &&
      lon >= BAY_AREA_BBOX.west &&
      lon <= BAY_AREA_BBOX.east
    );
  });
}

/**
 * Transform Azure Maps v1.0 response to simplified format for client
 */
function transformResults(results) {
  return results.map((result) => {
    const address = result.address || {};
    const position = result.position || {};

    // Build street address
    const streetParts = [];
    if (address.streetNumber) streetParts.push(address.streetNumber);
    if (address.streetName) streetParts.push(address.streetName);
    const streetAddress = streetParts.join(' ') || null;

    return {
      name: address.freeformAddress || 'Unknown',
      displayName: address.freeformAddress || '',
      lat: position.lat || 0,
      lng: position.lon || 0,
      type: result.type || 'address',
      confidence: result.matchConfidence?.score || result.score || 0,
      // Additional address components for rich display
      streetAddress: streetAddress,
      city: address.municipality || address.localName || null,
      county: address.countrySecondarySubdivision || null,
      state: address.countrySubdivision || null,
      postalCode: address.postalCode || null,
      neighborhood: address.neighbourhood || address.municipalitySubdivision || null,
    };
  });
}

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    };
    return;
  }

  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  };

  try {
    // Check configuration
    if (!AZURE_MAPS_KEY) {
      console.error('Azure Maps API key not configured');
      context.res = {
        status: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Geocoding service not configured',
          results: [],
        }),
      };
      return;
    }

    const query = req.query.q || req.query.query;
    const lat = req.query.lat;
    const lon = req.query.lon || req.query.lng;

    // Determine operation type
    let features = [];

    if (lat && lon) {
      // Reverse geocode
      console.log(`Reverse geocoding: ${lat}, ${lon}`);
      features = await reverseGeocode(parseFloat(lat), parseFloat(lon));
    } else if (query) {
      // Forward geocode
      console.log(`Geocoding query: "${query}"`);

      // Add California hint if no state specified
      let searchQuery = query;
      if (!query.match(/\b(CA|California)\b/i) && !query.match(/\d{5}/)) {
        searchQuery = `${query}, California`;
      }

      features = await geocodeAddress(searchQuery);

      // Filter to Bay Area
      features = filterToBayArea(features);
    } else {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing query parameter. Use ?q={address} or ?lat={lat}&lon={lon}',
          results: [],
        }),
      };
      return;
    }

    // Transform to client-friendly format
    const results = transformResults(features);

    console.log(`Geocoding returned ${results.length} results`);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        results: results,
        count: results.length,
      }),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Geocoding failed. Please try again.',
        results: [],
      }),
    };
  }
};
