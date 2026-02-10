// 511.org Transit API Caching Function
// Caches live transit data to stay under rate limits (60 req/hour)
// Updates every 60 seconds

const CACHE_TTL = 60000; // 60 seconds
const API_511_KEY = process.env.API_511_KEY;

// In-memory cache (persists across invocations in same container)
const cache = {
  vehiclePositions: { data: null, timestamp: 0 },
  tripUpdates: { data: null, timestamp: 0 },
  serviceAlerts: { data: null, timestamp: 0 },
};

/**
 * Fetch data from 511.org API with caching
 */
async function fetch511Data(endpoint) {
  const now = Date.now();

  // Check cache
  if (cache[endpoint].data && now - cache[endpoint].timestamp < CACHE_TTL) {
    console.log(`[511] Cache HIT for ${endpoint}`);
    return cache[endpoint].data;
  }

  // Cache miss - fetch from 511.org
  console.log(`[511] Cache MISS for ${endpoint}, fetching from API...`);

  const urls = {
    vehiclePositions: `https://api.511.org/Transit/VehiclePositions?api_key=${API_511_KEY}&agency=RG&format=json`,
    tripUpdates: `https://api.511.org/Transit/TripUpdates?api_key=${API_511_KEY}&agency=RG&format=json`,
    serviceAlerts: `https://api.511.org/transit/servicealerts?api_key=${API_511_KEY}&agency=RG&format=json`,
  };

  try {
    const response = await fetch(urls[endpoint]);

    if (!response.ok) {
      throw new Error(`511 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Update cache
    cache[endpoint] = {
      data,
      timestamp: now,
    };

    return data;
  } catch (error) {
    console.error(`[511] Failed to fetch ${endpoint}:`, error.message);

    // Return cached data if available, even if stale
    if (cache[endpoint].data) {
      console.log(`[511] Returning stale cache for ${endpoint}`);
      return cache[endpoint].data;
    }

    throw error;
  }
}

/**
 * Filter GTFS-RT data by agency code
 */
function filterByAgency(data, agencyCode) {
  if (!data || !data.entity) return data;

  return {
    ...data,
    entity: data.entity.filter((entity) => {
      // Check vehicle position
      if (entity.vehicle && entity.vehicle.vehicle) {
        return entity.vehicle.vehicle.id?.startsWith(agencyCode);
      }

      // Check trip update
      if (entity.trip_update && entity.trip_update.trip) {
        return entity.trip_update.trip.route_id?.startsWith(agencyCode);
      }

      // Check alert
      if (entity.alert) {
        return entity.alert.informed_entity?.some((ie) => ie.route_id?.startsWith(agencyCode));
      }

      return false;
    }),
  };
}

/**
 * Netlify function handler
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  try {
    const { agency } = event.queryStringParameters || {};

    // Fetch all data in parallel
    const [vehicles, trips, alerts] = await Promise.all([
      fetch511Data('vehiclePositions'),
      fetch511Data('tripUpdates'),
      fetch511Data('serviceAlerts'),
    ]);

    // Filter by agency if requested
    let response = {
      vehicles,
      trips,
      alerts,
      cachedAt: new Date(cache.vehiclePositions.timestamp).toISOString(),
      nextUpdate: new Date(cache.vehiclePositions.timestamp + CACHE_TTL).toISOString(),
    };

    if (agency) {
      response = {
        vehicles: filterByAgency(vehicles, agency),
        trips: filterByAgency(trips, agency),
        alerts: filterByAgency(alerts, agency),
        cachedAt: new Date(cache.vehiclePositions.timestamp).toISOString(),
        nextUpdate: new Date(cache.vehiclePositions.timestamp + CACHE_TTL).toISOString(),
        agency,
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Browser can cache too
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('[511] Function error:', error);

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to fetch transit data',
        message: error.message,
      }),
    };
  }
};
