/**
 * Transit Alerts Azure Function
 *
 * Fetches and parses service alerts from the 511.org API for Bay Area transit agencies.
 * Returns a simplified format suitable for display on the /transit page.
 *
 * Environment variable: API_511_KEY (required)
 */

const https = require('https');
const http = require('http');
const zlib = require('zlib');

// Agency metadata for display
const AGENCIES = {
  BA: { name: 'BART', color: '#009bda', type: 'rail' },
  CT: { name: 'Caltrain', color: '#e31837', type: 'rail' },
  SF: { name: 'SF Muni', color: '#bc2026', type: 'bus' },
  AC: { name: 'AC Transit', color: '#00a94f', type: 'bus' },
  SC: { name: 'VTA', color: '#0065b8', type: 'bus' },
  SM: { name: 'SamTrans', color: '#e31837', type: 'bus' },
  GG: { name: 'Golden Gate Transit', color: '#c41230', type: 'bus' },
  SA: { name: 'SMART', color: '#0072bc', type: 'rail' },
  GF: { name: 'Golden Gate Ferry', color: '#c41230', type: 'ferry' },
  SB: { name: 'SF Bay Ferry', color: '#1e3a5f', type: 'ferry' },
  CC: { name: 'County Connection', color: '#0072bb', type: 'bus' },
  WH: { name: 'Wheels', color: '#00a859', type: 'bus' },
  MA: { name: 'Marin Transit', color: '#00529b', type: 'bus' },
  '3D': { name: 'Tri Delta Transit', color: '#e21f26', type: 'bus' },
  WC: { name: 'WestCAT', color: '#ed1c24', type: 'bus' },
  UC: { name: 'Union City Transit', color: '#0072bc', type: 'bus' },
  CE: { name: 'ACE Rail', color: '#8b4513', type: 'rail' },
  AM: { name: 'Capitol Corridor', color: '#00467f', type: 'rail' },
};

// Fetch data from 511 API
async function fetchAlerts(apiKey) {
  return new Promise((resolve, reject) => {
    const url = `http://api.511.org/transit/servicealerts?api_key=${apiKey}&format=json`;

    http
      .get(url, (res) => {
        const chunks = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          let buffer = Buffer.concat(chunks);

          // Check if response is gzip compressed
          const encoding = res.headers['content-encoding'];
          if (encoding === 'gzip') {
            zlib.gunzip(buffer, (err, decoded) => {
              if (err) {
                reject(err);
                return;
              }
              try {
                // Remove BOM if present
                let str = decoded.toString('utf8');
                if (str.charCodeAt(0) === 0xfeff) {
                  str = str.slice(1);
                }
                resolve(JSON.parse(str));
              } catch (e) {
                reject(new Error(`Failed to parse JSON: ${e.message}`));
              }
            });
          } else {
            try {
              // Remove BOM if present
              let str = buffer.toString('utf8');
              if (str.charCodeAt(0) === 0xfeff) {
                str = str.slice(1);
              }
              resolve(JSON.parse(str));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          }
        });
      })
      .on('error', reject);
  });
}

// Calculate time ago string
function getTimeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  }
}

// Parse and filter alerts
function parseAlerts(data) {
  if (!data?.Entities) return [];

  const now = Math.floor(Date.now() / 1000);
  const alerts = [];

  for (const entity of data.Entities) {
    if (!entity.Alert) continue;

    const alert = entity.Alert;

    // Skip if no active period or if expired
    const activePeriods = alert.ActivePeriods || [];
    const isActive = activePeriods.some((period) => {
      const start = period.Start || 0;
      const end = period.End || Infinity;
      return now >= start && now <= end;
    });

    if (!isActive) continue;

    // Get agency ID from informed entities
    const informedEntities = alert.InformedEntities || [];
    const agencyIds = new Set();

    for (const entity of informedEntities) {
      if (entity.AgencyId && AGENCIES[entity.AgencyId]) {
        agencyIds.add(entity.AgencyId);
      }
    }

    if (agencyIds.size === 0) continue;

    // Get alert text
    const headerTranslations = alert.HeaderText?.Translations || [];
    const title =
      headerTranslations.find((t) => t.Language === 'en')?.Text || headerTranslations[0]?.Text;

    if (!title) continue;

    // Get URL if available
    const urlTranslations = alert.Url?.Translations || [];
    const url = urlTranslations.find((t) => t.Language === 'en')?.Text || urlTranslations[0]?.Text;

    // Get start time for sorting
    const startTime = activePeriods[0]?.Start || now;

    // Create alert entry for each agency
    for (const agencyId of agencyIds) {
      const agency = AGENCIES[agencyId];

      alerts.push({
        id: entity.Id,
        agencyId,
        agency: agency.name,
        color: agency.color,
        type: agency.type,
        title: title.trim(),
        url: url || null,
        startTime,
        timeAgo: getTimeAgo(startTime),
      });
    }
  }

  // Sort by start time (newest first) and dedupe by title
  const seen = new Set();
  return alerts
    .sort((a, b) => b.startTime - a.startTime)
    .filter((alert) => {
      const key = `${alert.agencyId}:${alert.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50); // Limit to 50 alerts
}

module.exports = async function (context, req) {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=300', // 5 minute cache
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers };
    return;
  }

  const apiKey = process.env.API_511_KEY;

  if (!apiKey) {
    context.res = {
      status: 500,
      headers,
      body: JSON.stringify({ error: 'API key not configured' }),
    };
    return;
  }

  try {
    const data = await fetchAlerts(apiKey);
    const alerts = parseAlerts(data);

    context.res = {
      status: 200,
      headers,
      body: JSON.stringify({
        alerts,
        timestamp: new Date().toISOString(),
        source: '511.org',
      }),
    };
  } catch (error) {
    context.log.error('Failed to fetch transit alerts:', error);

    context.res = {
      status: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch alerts',
        message: error.message,
      }),
    };
  }
};
