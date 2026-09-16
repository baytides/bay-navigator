/**
 * What Carl says when he doesn't know.
 *
 * This is the highest-stakes text in the whole server. Carl runs inside someone
 * else's chatbot, which means an empty tool result is an invitation for that
 * model to fill the silence — and a confidently invented food bank address
 * sends a hungry person to a locked door.
 *
 * So a no-match result is never empty. It says plainly that Bay Navigator has
 * no entry, and it routes to a human.
 */

import { DATA_BASE, ENDPOINTS, fetchData } from './sources.mjs';

/** Always-true escalation paths, independent of any data fetch. */
export const HUMAN_FALLBACK = [
  '**2-1-1** — dial 211, free 24/7, 180+ languages. Live referral to food, housing, health and utility help anywhere in the Bay Area.',
  '**988** — Suicide & Crisis Lifeline, 24/7 call or text.',
  '**911** — immediate danger.',
];

/**
 * TODO(steven): tune the no-match contract — see the request in chat.
 *
 * Called whenever a search returns zero hits. Whatever this returns is the ONLY
 * thing the host model sees, so it doubles as the instruction that stops it from
 * improvising. Trade-offs to weigh:
 *   - How hard to push the model to stop vs. let it offer general knowledge.
 *   - Whether to suggest broader retries (drop the city/category filter).
 *   - How prominent 211 should be for a low-stakes query ("museum free days").
 *
 * @param {string} query the user's original search text
 * @returns {string} text returned to the calling model
 */
export function noMatch(query) {
  return [
    `Bay Navigator has no entry matching "${query}".`,
    '',
    'Do not invent a program, phone number, or address to fill this gap — say plainly that nothing was found, then offer these:',
    '',
    ...HUMAN_FALLBACK.map((l) => `- ${l}`),
    '',
    'You may also retry `search_resources` with a broader query or without the category/city filter.',
  ].join('\n');
}

/** Crisis and emergency contacts, straight from the published feed. */
export async function emergencyContacts() {
  const data = await fetchData(ENDPOINTS.emergency, { fallback: null });
  if (!data) {
    return [
      'Could not reach the live emergency feed. Always-valid fallbacks:',
      '',
      ...HUMAN_FALLBACK.map((l) => `- ${l}`),
    ].join('\n');
  }

  const section = (title, list) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const items = list.map((h) => {
      const contact = [h.phone && `call ${h.phone}`, h.text && h.text, h.chat && `chat ${h.chat}`]
        .filter(Boolean)
        .join(' · ');
      const langs = Array.isArray(h.languages) ? h.languages.join(', ') : h.languages;
      return [
        `- **${h.name}** — ${contact || 'see website'}`,
        h.description && `  ${h.description}`,
        (h.available || langs) && `  _${[h.available, langs].filter(Boolean).join(' · ')}_`,
      ]
        .filter(Boolean)
        .join('\n');
    });
    return [`## ${title}`, ...items].join('\n');
  };

  return [
    '# Emergency & crisis contacts',
    '',
    '**If someone is in immediate danger, call 911.**',
    '',
    section('National hotlines', data.national_hotlines),
    section('Bay Area crisis lines', data.bay_area_crisis),
    '',
    data.note ? `_${data.note}_` : '',
    `_Source: ${DATA_BASE}/emergency.json — last updated ${data.updated || 'unknown'}._`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
