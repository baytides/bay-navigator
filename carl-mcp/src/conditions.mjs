/**
 * Live Bay Area conditions — air quality, weather, and sports.
 *
 * These come from Azure Blob rather than the site, because the syncs that
 * produce them publish straight to blob and never commit. That makes them the
 * freshest thing Carl can offer: air quality is regenerated continuously, and
 * "is it safe to be outside in Oakland today" is a question with real stakes for
 * someone with asthma, working outdoors, or sleeping rough during a smoke event.
 *
 * Blob is also not behind Cloudflare, so unlike the site data these need no
 * fallback chain — see sources.mjs for why that matters.
 */

import { fetchJSON } from './sources.mjs';

export const BLOB_BASE = (
  process.env.CARL_CONDITIONS_BASE || 'https://baytidesstorage.blob.core.windows.net/api-data'
).replace(/\/+$/, '');

/**
 * Per-feed cache lifetimes, deliberately not one number.
 *
 * A single TTL forces a bad trade: short enough for air quality means
 * needlessly re-fetching the forecast, and long enough for the forecast means
 * stale air quality. They are weighted opposite to their size, which is why
 * splitting them wins twice.
 *
 *   air-quality (37 KB)  — smallest payload, fastest to change, and the one
 *                          with real stakes. During a wildfire, an hour-old AQI
 *                          is worse than no AQI. Stays short.
 *   weather     (167 KB) — largest payload by far, and a 3-day forecast does
 *                          not meaningfully change within an hour. Longest
 *                          practical TTL, which is where most of the saving is.
 *   sports      (67 KB)  — records move after games, not minutes. Hours is fine.
 *
 * Together these cut worst-case fetch volume by roughly 70% versus a flat 15
 * minutes, without making the safety-critical feed any staler.
 *
 * CARL_CONDITIONS_TTL_MS overrides all three, for anyone who wants one knob.
 */
const TTL_OVERRIDE = Number(process.env.CARL_CONDITIONS_TTL_MS) || null;
const TTL_MS = {
  'air-quality': 15 * 60 * 1000, // 15 min
  'weather-forecast': 60 * 60 * 1000, // 1 hour
  'sports-data': 6 * 60 * 60 * 1000, // 6 hours
};
const DEFAULT_TTL_MS = 30 * 60 * 1000;

export function ttlFor(name) {
  return TTL_OVERRIDE || TTL_MS[name] || DEFAULT_TTL_MS;
}

const cache = new Map(); // name -> { at, value }

async function load(name) {
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < ttlFor(name)) return hit.value;

  try {
    const value = await fetchJSON(`${BLOB_BASE}/${name}.json`);
    cache.set(name, { at: Date.now(), value });
    return value;
  } catch (err) {
    // Serve a stale copy rather than nothing. A forecast from earlier today
    // still answers the question; an error does not. The caller surfaces the
    // feed's own `generated` timestamp, so staleness stays visible.
    if (hit) return hit.value;
    throw err;
  }
}

/** Case-insensitive, punctuation-tolerant city match. */
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function findCity(cities, query) {
  const want = normalize(query);
  if (!want) return null;
  return (
    cities.find((c) => normalize(c.name) === want) ||
    cities.find((c) => normalize(c.name).startsWith(want)) ||
    cities.find((c) => normalize(c.name).includes(want)) ||
    null
  );
}

/**
 * US AQI bands, with the guidance that actually matters to someone deciding
 * whether to go outside. Deliberately plain-language: the official category
 * names ("Unhealthy for Sensitive Groups") do not tell a person what to do.
 */
function aqiAdvice(aqi) {
  if (aqi == null || Number.isNaN(aqi))
    return { label: 'Unknown', advice: 'No reading available.' };
  if (aqi <= 50) return { label: 'Good', advice: 'Fine to be outside.' };
  if (aqi <= 100)
    return {
      label: 'Moderate',
      advice: 'Fine for most people. If you have asthma or heart or lung problems, take it easy.',
    };
  if (aqi <= 150)
    return {
      label: 'Unhealthy for sensitive groups',
      advice:
        'Children, older adults, pregnant people, and anyone with asthma or heart or lung problems should limit time outdoors.',
    };
  if (aqi <= 200)
    return {
      label: 'Unhealthy',
      advice:
        'Everyone should limit time outdoors. Sensitive groups should stay inside. Clean-air centers may open — call 2-1-1 to ask.',
    };
  if (aqi <= 300)
    return {
      label: 'Very unhealthy',
      advice:
        'Stay indoors with windows closed if you can. Call 2-1-1 to ask about clean-air centers and respite locations.',
    };
  return {
    label: 'Hazardous',
    advice: 'Stay indoors. This is an emergency for anyone without shelter — call 2-1-1.',
  };
}

/** Air quality + forecast for one city, as text an assistant can read aloud. */
export async function localConditions(city) {
  const [air, weather] = await Promise.all([
    load('air-quality').catch(() => null),
    load('weather-forecast').catch(() => null),
  ]);

  if (!air && !weather) {
    throw new Error('Neither the air-quality nor weather feed is reachable');
  }

  const airCity = air && findCity(air.cities || [], city);
  const wxCity = weather && findCity(weather.cities || [], city);

  if (!airCity && !wxCity) {
    const known = (air?.cities || weather?.cities || []).map((c) => c.name);
    return [
      `No readings for "${city}".`,
      '',
      known.length
        ? `Covered cities include: ${known.slice(0, 25).join(', ')}${known.length > 25 ? `, and ${known.length - 25} more` : ''}.`
        : '',
      'Do not estimate air quality from a nearby city — smoke and inversion layers vary block to block.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const name = airCity?.name || wxCity?.name;
  const lines = [`# Conditions in ${name}`, ''];

  if (airCity) {
    const { label, advice } = aqiAdvice(airCity.aqi);
    lines.push(`**Air quality:** AQI ${airCity.aqi} — ${label}`, advice, '');
  }

  if (wxCity?.current) {
    const c = wxCity.current;
    lines.push(
      `**Now:** ${Math.round(c.temperature)}°F, ${c.description}` +
        (c.windSpeed != null ? ` · wind ${Math.round(c.windSpeed)} mph` : '') +
        (c.humidity != null ? ` · humidity ${c.humidity}%` : ''),
      ''
    );
  }

  const days = (wxCity?.daily || []).slice(0, 3);
  if (days.length) {
    lines.push('**Next few days:**');
    for (const d of days) {
      lines.push(
        `- ${d.date}: ${d.description}, ${Math.round(d.low)}–${Math.round(d.high)}°F` +
          (d.precipProbability != null ? ` · ${d.precipProbability}% chance of rain` : '')
      );
    }
    lines.push('');
  }

  // Heat and cold are the two conditions that most often need a referral.
  const high = days[0]?.high;
  const low = days[0]?.low;
  if (high != null && high >= 95) {
    lines.push(
      '_It is dangerously hot. Cooling centers open during heat waves — call 2-1-1 to find the nearest one._'
    );
  } else if (low != null && low <= 40) {
    lines.push(
      '_It is cold enough to be dangerous without shelter. Call 2-1-1 to ask about warming centers and shelter beds._'
    );
  }

  const stamp = air?.generated || weather?.generated;
  if (stamp) lines.push('', `_Readings from ${stamp}. Source: Open-Meteo._`);
  return lines.join('\n');
}

/** Bay Area pro team records and next games. */

/**
 * The feed carries first-pitch time, home/away, broadcaster and a gameday link.
 * All of it was being discarded — the line read `Next game: <date> vs <opponent>`
 * and nothing else, so a host model could not answer "what time?" and had to
 * tell the user to go and look it up.
 *
 * "vs" was the worse half of that bug: it was printed unconditionally, so an
 * AWAY game read as a home game and implied the wrong stadium.
 */
function nextGameLines(t) {
  const g = t.nextGame;
  const out = [];
  const where = g.home ? 'vs' : 'at';
  const when = [g.date, g.time].filter(Boolean).join(' ');
  out.push(`Next game: ${when} ${where} ${g.opponent || 'TBD'}${g.home ? '' : ' (away)'}`);

  const extras = [];
  if (g.venue) extras.push(g.venue);
  else if (g.home && t.homeVenue) extras.push(t.homeVenue);
  if (g.network) extras.push(`on ${g.network}`);
  if (extras.length) out.push(`  ${extras.join(' · ')}`);
  if (g.gameUrl) out.push(`  ${g.gameUrl}`);
  return out;
}

export async function sports(team) {
  const data = await load('sports-data');
  const teams = data.teams || {};
  const entries = Object.entries(teams);
  if (entries.length === 0) return 'No team data available right now.';

  const wanted = normalize(team);
  const chosen = wanted
    ? entries.filter(([key, t]) => normalize(key) === wanted || normalize(t.name).includes(wanted))
    : entries;

  if (chosen.length === 0) {
    return `No Bay Area team matching "${team}". Covered: ${entries.map(([, t]) => t.name).join(', ')}.`;
  }

  const lines = ['# Bay Area teams', ''];
  for (const [, t] of chosen) {
    lines.push(`### ${t.name} (${t.sport})`);
    if (t.record)
      lines.push(
        `Record: ${t.record.wins}-${t.record.losses}` + (t.streak ? ` · streak ${t.streak}` : '')
      );
    if (t.standings?.divisionRank)
      lines.push(
        `Division rank: ${t.standings.divisionRank}` +
          (t.standings.gamesBack ? ` (${t.standings.gamesBack} back)` : '')
      );
    if (t.nextGame) lines.push(...nextGameLines(t));
    if (t.lastGame?.result)
      lines.push(
        `Last game: ${t.lastGame.date} ${t.lastGame.home ? 'vs' : 'at'} ` +
          `${t.lastGame.opponent} — ${t.lastGame.result}`
      );
    lines.push('');
  }
  if (data.generated) lines.push(`_Updated ${data.generated}._`);
  return lines.join('\n');
}

export const __testing = { aqiAdvice, findCity, normalize };
