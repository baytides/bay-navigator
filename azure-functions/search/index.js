/**
 * Typesense Search Proxy Azure Function
 *
 * Proxies search requests to self-hosted Typesense server, keeping the API key secure.
 * Supports typo-tolerant search with faceting by category, area, and city.
 *
 * Endpoints:
 *   GET /api/search?q={query}                    - Search programs
 *   GET /api/search?q={query}&category={cat}    - Search with category filter
 *   GET /api/search?q={query}&area={area}       - Search with area filter
 *   GET /api/search?q={query}&lat={lat}&lng={lng}&radius={km} - Geo search
 */

// Typesense configuration
// Typesense now runs on Mac Mini via Cloudflare Tunnel
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'https://search.baytides.org';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY;
const COLLECTION_NAME = 'programs';

/**
 * Search Typesense for programs
 */
async function searchTypesense(params) {
  const url = new URL(`${TYPESENSE_HOST}/collections/${COLLECTION_NAME}/documents/search`);

  // Required params
  url.searchParams.set('q', params.query || '*');
  url.searchParams.set('query_by', 'name,keywords,description');
  url.searchParams.set('per_page', params.limit || '50');

  // Enable typo tolerance
  url.searchParams.set('num_typos', '2');
  url.searchParams.set('typo_tokens_threshold', '1');

  // Enable highlighting
  url.searchParams.set('highlight_full_fields', 'name,description');

  // Build filter string
  const filters = [];

  if (params.category && params.category !== 'all') {
    filters.push(`category:=${params.category}`);
  }

  if (params.area) {
    filters.push(`area:=${params.area}`);
  }

  if (params.city) {
    filters.push(`city:=${params.city}`);
  }

  if (params.groups) {
    // Groups is an array field, use exact match
    filters.push(`groups:=[${params.groups}]`);
  }

  if (filters.length > 0) {
    url.searchParams.set('filter_by', filters.join(' && '));
  }

  // Geo search
  if (params.lat && params.lng) {
    const radius = params.radius || 50; // km
    url.searchParams.set('filter_by', `location:(${params.lat}, ${params.lng}, ${radius} km)`);
    url.searchParams.set('sort_by', `location(${params.lat}, ${params.lng}):asc`);
  }

  // Faceting for filters
  url.searchParams.set('facet_by', 'category,area,city');

  const response = await fetch(url.toString(), {
    headers: {
      'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Typesense search error:', errorText);
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Transform Typesense response to client-friendly format
 */
function transformResults(data) {
  const hits = data.hits || [];

  return {
    results: hits.map((hit) => ({
      id: hit.document.id,
      name: hit.document.name,
      description: hit.document.description,
      category: hit.document.category,
      area: hit.document.area,
      city: hit.document.city,
      groups: hit.document.groups,
      phone: hit.document.phone,
      link: hit.document.link,
      // Search metadata
      score: hit.text_match || 0,
      highlights: hit.highlights || [],
    })),
    found: data.found || 0,
    page: data.page || 1,
    // Facets for filter UI
    facets: transformFacets(data.facet_counts || []),
    // Search time
    searchTimeMs: data.search_time_ms || 0,
  };
}

/**
 * Transform facet counts for filter UI
 */
function transformFacets(facetCounts) {
  const facets = {};

  facetCounts.forEach((facet) => {
    facets[facet.field_name] = facet.counts.map((c) => ({
      value: c.value,
      count: c.count,
    }));
  });

  return facets;
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
    'Cache-Control': 'public, max-age=60', // Cache for 1 minute
  };

  try {
    // Check configuration
    if (!TYPESENSE_API_KEY) {
      console.error('Typesense API key not configured');
      context.res = {
        status: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Search service not configured',
          results: [],
          found: 0,
        }),
      };
      return;
    }

    const query = req.query.q || req.query.query || '';
    const category = req.query.category;
    const area = req.query.area;
    const city = req.query.city;
    const groups = req.query.groups;
    const lat = req.query.lat;
    const lng = req.query.lng || req.query.lon;
    const radius = req.query.radius;
    const limit = req.query.limit || req.query.per_page;

    // Minimum query length check
    if (!query || query.trim().length < 1) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Query too short. Provide at least 1 character.',
          results: [],
          found: 0,
        }),
      };
      return;
    }

    console.log(`Searching: "${query}" category=${category} area=${area}`);

    const data = await searchTypesense({
      query: query.trim(),
      category,
      area,
      city,
      groups,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      radius: radius ? parseFloat(radius) : null,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    const response = transformResults(data);
    console.log(`Search returned ${response.found} results in ${response.searchTimeMs}ms`);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Search error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Search failed. Please try again.',
        results: [],
        found: 0,
      }),
    };
  }
};
