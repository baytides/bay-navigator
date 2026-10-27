/**
 * Traffic Tiles Proxy Azure Function
 *
 * Proxies and caches Azure Maps Traffic Flow tile requests to reduce API costs.
 * Tiles are cached in-memory for 5 minutes (traffic data updates every few minutes).
 *
 * Environment variable: AZURE_MAPS_KEY (required)
 *
 * URL format: /api/traffic-tiles/{z}/{x}/{y}
 * Optional query param: style=relative (default) | relative-delay | reduced-sensitivity | absolute
 */

const https = require('https');
const { checkRateLimit, rateLimitResponse } = require('../shared/rate-limit');

// In-memory tile cache with TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const tileCache = new Map();

// One map viewport is already dozens of tiles, and panning or zooming adds more,
// so the ceiling has to sit well above normal interactive use. Cache hits are
// counted too: they are cheap, but counting them is what stops a scraper from
// walking the whole tile pyramid for free.
const RATE_LIMIT = 300;
const RATE_WINDOW_MS = 60_000;

// DECISION (flip this one line): what a throttled caller gets when we happen to
// hold a cached tile for the coordinates they asked for.
//   true  -> serve the stale tile. Costs nothing upstream (protecting the Azure
//            Maps budget is the whole point), and the map keeps rendering for a
//            legitimate user sharing a NAT or office IP with a noisy neighbour.
//            Downside: the limit is invisible, so an abuser never backs off.
//   false -> always 429. Honest and predictable, and the strongest discouragement
//            to a scraper, but it can break the map for innocent users behind a
//            shared address.
// Both paths are implemented below; `true` is the gentler default.
const SERVE_STALE_ON_OVERFLOW = true;

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tileCache) {
    if (now > entry.expires) {
      tileCache.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Fetch traffic tile from Azure Maps
 */
async function fetchTrafficTile(z, x, y, style, apiKey) {
  return new Promise((resolve, reject) => {
    // Azure Maps Traffic Flow Tile API
    // https://docs.microsoft.com/en-us/rest/api/maps/traffic/get-traffic-flow-tile
    const url = `https://atlas.microsoft.com/traffic/flow/tile/png?api-version=1.0&style=${style}&zoom=${z}&x=${x}&y=${y}&subscription-key=${apiKey}`;

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Azure Maps returned status ${res.statusCode}`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            data: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || 'image/png',
          });
        });
      })
      .on('error', reject);
  });
}

module.exports = async function (context, req) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  // Throttle before touching the metered upstream.
  const verdict = checkRateLimit(req, { limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });
  if (!verdict.allowed) {
    const staleKey = `${req.query.style || 'relative'}/${req.params?.z}/${req.params?.x}/${req.params?.y}`;
    const stale = SERVE_STALE_ON_OVERFLOW ? tileCache.get(staleKey) : null;
    if (stale) {
      context.res = {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': stale.contentType,
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'STALE-THROTTLED',
        },
        body: stale.data,
        isRaw: true,
      };
      return;
    }
    context.res = rateLimitResponse(verdict, corsHeaders);
    return;
  }

  const apiKey = process.env.AZURE_MAPS_KEY;

  if (!apiKey) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Azure Maps API key not configured' }),
    };
    return;
  }

  // Parse route parameters
  const { z, x, y } = req.params;

  // Validate tile coordinates
  const zoom = parseInt(z, 10);
  const tileX = parseInt(x, 10);
  const tileY = parseInt(y, 10);

  if (isNaN(zoom) || isNaN(tileX) || isNaN(tileY)) {
    context.res = {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid tile coordinates' }),
    };
    return;
  }

  // Limit zoom levels to reduce cache size and API calls
  if (zoom < 6 || zoom > 18) {
    context.res = {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Zoom level must be between 6 and 18' }),
    };
    return;
  }

  // Get style from query params (default: relative)
  const style = req.query.style || 'relative';
  const validStyles = ['relative', 'relative-delay', 'reduced-sensitivity', 'absolute'];
  if (!validStyles.includes(style)) {
    context.res = {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Invalid style. Use: ${validStyles.join(', ')}` }),
    };
    return;
  }

  // Check cache
  const cacheKey = `${style}/${z}/${x}/${y}`;
  const now = Date.now();
  const cached = tileCache.get(cacheKey);

  if (cached && now < cached.expires) {
    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'HIT',
      },
      body: cached.data,
      isRaw: true,
    };
    return;
  }

  try {
    const tile = await fetchTrafficTile(zoom, tileX, tileY, style, apiKey);

    // Cache the tile
    tileCache.set(cacheKey, {
      data: tile.data,
      contentType: tile.contentType,
      expires: now + CACHE_TTL_MS,
    });

    // Limit cache size (rough limit of ~1000 tiles)
    if (tileCache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(tileCache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      for (let i = 0; i < 200; i++) {
        tileCache.delete(entries[i][0]);
      }
    }

    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': tile.contentType,
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'MISS',
      },
      body: tile.data,
      isRaw: true,
    };
  } catch (error) {
    context.log.error('Failed to fetch traffic tile:', error);

    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch traffic tile',
      }),
    };
  }
};
