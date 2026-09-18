/**
 * Carl — Bay Navigator's community-resource assistant, as an MCP server.
 *
 * Carl used to be a self-hosted two-call LLM pipeline (Ollama on a GPU VM).
 * This server keeps Carl's knowledge and character while dropping the model:
 * the host chatbot brings its own intelligence, Carl brings the grounding.
 *
 * Design rules for the tool surface:
 *   - Few, sharp tools. Six well-described tools beat twenty overlapping ones.
 *   - Every result carries its source URL and corpus id, so the host model can
 *     cite and drill down rather than paraphrase from memory.
 *   - No tool ever returns an empty string; see guidance.noMatch().
 *   - Read-only. Carl answers questions; he never mutates anything.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { listAll, search, getById, facets, getCorpus } from './corpus.mjs';
import { formatResults, formatDetail, formatRoster } from './format.mjs';
import { noMatch, emergencyContacts, HUMAN_FALLBACK } from './guidance.mjs';
import { transitDirections } from './transit.mjs';
import { localConditions, sports } from './conditions.mjs';
import { DATA_BASE } from './sources.mjs';

export const SERVER_NAME = 'carl';
export const SERVER_VERSION = '0.1.0';

/** Shown to hosts that surface server-level guidance to their model. */
export const INSTRUCTIONS = `Carl helps people find free and low-cost community resources in the San Francisco Bay Area — \
social services, public benefits, discounts, California state law, and city ordinances.

Ground every Bay Area answer in these tools. Do not answer from memory: programs close, \
phone numbers change, and eligibility rules are specific. Quote what the tools return and \
link the source URL.

Start with search_resources. For air quality, smoke, heat or cold, use get_local_conditions — that matters most for people who are unhoused, work outdoors, or have asthma. Use find_local_code for "is X legal in <city>" questions — \
always pass the city, because ordinances differ between neighbouring cities. If a tool finds \
nothing, say so plainly and point to 2-1-1 rather than guessing.

Carl's voice: warm, plain-language, non-judgmental. Many people asking are in a hard moment. \
Lead with the concrete next step — a phone number, an address, what to bring.`;

/** A read-only, non-destructive tool hint set (all of Carl's tools are reads). */
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const textResult = (text) => ({ content: [{ type: 'text', text }] });
const errorResult = (text) => ({ content: [{ type: 'text', text }], isError: true });

export function createCarlServer({ log = () => {} } = {}) {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS }
  );

  // ---------------------------------------------------------------- search
  server.registerTool(
    'search_resources',
    {
      title: 'Search Bay Area resources',
      description:
        'Search 800+ Bay Area programs, benefits, discounts and services, plus California state law, ' +
        'city ordinances and museum free-admission rules. This is the main tool — start here for any ' +
        'question about help available in the Bay Area (food, housing, healthcare, legal aid, transit, ' +
        'utilities, childcare, seniors, veterans, immigration). Returns ranked entries with contact ' +
        'details and source links. Search by plain keywords, not full sentences.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe(
            'Keywords, e.g. "food bank", "rental assistance", "CalFresh", "free museum days"'
          ),
        category: z
          .string()
          .optional()
          .describe(
            'Optional exact category filter, e.g. "food", "housing", "health". Use list_filters to see valid values.'
          ),
        area: z
          .string()
          .optional()
          .describe(
            'Optional location filter. Accepts a county ("Alameda County"), a city ("Oakland", "Daly City"), or common shorthand ("SF", "East Bay") — a city resolves to its county. Statewide and Bay-Area-wide programs are always kept, so filtering by county never hides CalFresh or Medi-Cal. Use list_filters to see county values.'
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(8)
          .describe(
            'Maximum results (default 8). Raise it for "which/what/list all" questions — ' +
              'the default page can cut off real matches, and the response says when it has.'
          ),
      },
      annotations: READ_ONLY,
    },
    async ({ query, category, area, limit }) => {
      try {
        const hits = await search(query, { category, area, limit });
        return textResult(formatResults(hits, { query, bodyChars: 300, noMatch }));
      } catch (err) {
        log(`search_resources failed: ${err.stack || err.message}`);
        return errorResult(
          `Carl could not reach Bay Navigator's data (${err.message}). Do not guess an answer. ` +
            `Offer these instead:\n${HUMAN_FALLBACK.map((l) => `- ${l}`).join('\n')}`
        );
      }
    }
  );

  // ------------------------------------------------------------- get detail
  server.registerTool(
    'get_resource',
    {
      title: 'Get full resource details',
      description:
        'Fetch the complete record for one entry returned by search_resources or find_local_code, ' +
        'using the `id` shown with that result. Returns the full description, eligibility, how to apply, ' +
        'phone, address and cost — use this before telling someone how to actually access a program.',
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe('The corpus id from a previous result, e.g. "211-bay-area" or "ca:CIV-1940"'),
      },
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const row = await getById(id);
        if (!row) {
          return textResult(
            `No entry with id "${id}". Ids come from search_resources results — run a search first ` +
              `rather than guessing an id.`
          );
        }
        return textResult(formatDetail(row));
      } catch (err) {
        log(`get_resource failed: ${err.stack || err.message}`);
        return errorResult(`Carl could not load "${id}" (${err.message}).`);
      }
    }
  );

  server.registerTool(
    'list_all_matching',
    {
      title: 'List every matching entry (no truncation)',
      description:
        'Return the COMPLETE set of entries matching a category, area and/or keyword, one compact ' +
        'line each. Use this instead of search_resources whenever the question is an enumeration — ' +
        '"which/what/list all/how many ... participate|offer|accept|are there" — or whenever a ' +
        'search_resources response said it was showing only some of the matches. search_resources ' +
        'returns a RANKED PAGE and will cut off real answers; presenting that page as the full set ' +
        'is how a county with entries gets reported as having none.',
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe(
            'Exact category, e.g. "Museum Admission", "Food". Use list_filters for values.'
          ),
        area: z
          .string()
          .optional()
          .describe('County, city or shorthand. Statewide and Bay-Area-wide entries are kept.'),
        city: z
          .string()
          .optional()
          .describe('City whose ordinances to list, e.g. "Oakland". Use with type="muni_code".'),
        type: z
          .enum(['resource', 'muni_code', 'ca_code', 'museum_program', 'museum_venue'])
          .optional()
          .describe('Restrict to one kind of entry.'),
        contains: z
          .string()
          .optional()
          .describe(
            'Keep only entries whose title, body or keywords contain this text, e.g. "museums for all".'
          ),
        max: z.number().int().min(1).max(200).default(200).describe('Safety cap (default 200).'),
      },
      annotations: READ_ONLY,
    },
    async ({ category, area, city, type, contains, max }) => {
      try {
        const rows = await listAll({ category, area, city, type, contains, max });
        return textResult(
          formatRoster(rows, {
            query: contains || '',
            filters: { category, area, city, type },
            noMatch,
          })
        );
      } catch (err) {
        log(`list_all_matching failed: ${err.stack || err.message}`);
        return errorResult(
          `Carl could not reach Bay Navigator's data (${err.message}). Do not guess an answer. ` +
            `Offer these instead:\n${HUMAN_FALLBACK.map((l) => `- ${l}`).join('\n')}`
        );
      }
    }
  );

  // ----------------------------------------------------------- local codes
  server.registerTool(
    'find_local_code',
    {
      title: 'Look up a local ordinance or state law',
      description:
        'Find the actual text of a city ordinance or California state law. Use for "is X allowed in <city>", ' +
        'noise complaints, parking, pets, ADUs, short-term rentals, tenant rights, permits. ' +
        'ALWAYS pass `city` for a local question — neighbouring Bay Area cities have different rules, and an ' +
        'answer from the wrong city is worse than no answer. Omit `city` to search California state code only. ' +
        'Quote the returned text; do not summarize legal language loosely.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe(
            'The topic, e.g. "noise ordinance", "backyard chickens", "overnight RV parking"'
          ),
        city: z
          .string()
          .optional()
          .describe(
            'City name, e.g. "San Jose", "Oakland". Required for local-law questions. Use list_filters for cities with ordinance coverage.'
          ),
        limit: z.number().int().min(1).max(15).default(5).describe('Maximum results (default 5)'),
      },
      annotations: READ_ONLY,
    },
    async ({ query, city, limit }) => {
      try {
        const scope = city ? 'muni_code' : 'ca_code';
        const hits = await search(query, { city, type: scope, limit });
        if (hits.length === 0 && city) {
          const { codeCities } = await facets();
          const covered = codeCities.map((c) => c.value);
          const hasCity = covered.some((c) => c.toLowerCase() === city.toLowerCase());
          return textResult(
            hasCity
              ? `Bay Navigator has ${city} ordinances indexed, but nothing matching "${query}". ` +
                  `Try different wording, or tell the user to check the city's municipal code directly. Do not guess the rule.`
              : `Bay Navigator does not have ${city}'s municipal code indexed yet. Do not guess the rule — ` +
                  `tell the user to contact ${city} directly or call 2-1-1.\n\n` +
                  `Cities with ordinance coverage: ${covered.join(', ') || 'none currently'}.`
          );
        }
        // Legal text is quoted, so give it more room than a program blurb.
        return textResult(formatResults(hits, { query, bodyChars: 900, noMatch }));
      } catch (err) {
        log(`find_local_code failed: ${err.stack || err.message}`);
        return errorResult(
          `Carl could not search local codes (${err.message}). Do not guess the law.`
        );
      }
    }
  );

  // --------------------------------------------------------------- filters
  server.registerTool(
    'list_filters',
    {
      title: 'List valid filter values',
      description:
        'List the exact category, county/area and ordinance-city values Carl accepts, with entry counts. ' +
        'Call this when you want to filter a search and need valid values, or to tell someone what ' +
        'Bay Navigator actually covers.',
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const f = await facets();
        const list = (rows) => rows.map((r) => `${r.value} (${r.count})`).join(', ');
        return textResult(
          [
            '# Valid filter values',
            '',
            `**Categories** — for \`search_resources.category\`:`,
            list(f.categories),
            '',
            `**Areas** — for \`search_resources.area\`:`,
            list(f.areas),
            '',
            `**Cities with municipal-code coverage** — for \`find_local_code.city\`:`,
            f.codeCities.length ? list(f.codeCities) : '_none currently indexed_',
            '',
            `**Entry types:** ${list(f.types)}`,
            '',
            `_Source: ${DATA_BASE}_`,
          ].join('\n')
        );
      } catch (err) {
        log(`list_filters failed: ${err.stack || err.message}`);
        return errorResult(`Carl could not load filters (${err.message}).`);
      }
    }
  );

  // ---------------------------------------------------------------- transit
  server.registerTool(
    'transit_directions',
    {
      title: 'Get public transit directions',
      description:
        'Build a public-transit directions link for a Bay Area trip ("how do I get to X"). Returns map ' +
        'links plus a reminder to check Clipper discounts. Pair with search_resources for fare-assistance ' +
        'programs (Clipper START, RTC discount card, paratransit) when cost may be a barrier.',
      inputSchema: {
        destination: z
          .string()
          .min(1)
          .describe(
            'Where they want to go, e.g. "SFO" or "1 Dr Carlton B Goodlett Pl, San Francisco"'
          ),
        origin: z
          .string()
          .optional()
          .describe("Starting point; omit to use the rider's current location"),
      },
      annotations: READ_ONLY,
    },
    async ({ destination, origin }) => textResult(transitDirections({ destination, origin }))
  );

  // ------------------------------------------------------------- conditions
  server.registerTool(
    'get_local_conditions',
    {
      title: 'Get air quality and weather for a Bay Area city',
      description:
        'Current air quality (AQI) and the 3-day forecast for any of ~100 Bay Area cities. ' +
        'Use for "is the air bad in Oakland", smoke and wildfire questions, and heat or cold ' +
        'warnings. Returns plain-language guidance on whether it is safe to be outside, and ' +
        'flags when cooling or warming centers are likely open. Relevant whenever someone is ' +
        'unhoused, works outdoors, or has asthma or a heart or lung condition.',
      inputSchema: {
        city: z
          .string()
          .min(1)
          .describe('Bay Area city name, e.g. "Oakland", "San Jose", "Richmond"'),
      },
      annotations: READ_ONLY,
    },
    async ({ city }) => {
      try {
        return textResult(await localConditions(city));
      } catch (err) {
        log(`get_local_conditions failed: ${err.stack || err.message}`);
        return errorResult(
          `Carl could not reach the air-quality or weather feed (${err.message}). Do not estimate ` +
            `air quality — point the person to airnow.gov, or 2-1-1 if they need somewhere to go.`
        );
      }
    }
  );

  // ----------------------------------------------------------------- sports
  server.registerTool(
    'get_bay_area_sports',
    {
      title: 'Get Bay Area team records and schedules',
      description:
        'Records, standings and next games for Bay Area pro teams (Giants, Warriors, 49ers, ' +
        'Sharks, Valkyries). Omit the team name for all of them.',
      inputSchema: {
        team: z
          .string()
          .optional()
          .describe('Optional team name, e.g. "Warriors" or "giants". Omit for every team.'),
      },
      annotations: READ_ONLY,
    },
    async ({ team }) => {
      try {
        return textResult(await sports(team));
      } catch (err) {
        log(`get_bay_area_sports failed: ${err.stack || err.message}`);
        return errorResult(`Carl could not reach the sports feed (${err.message}).`);
      }
    }
  );

  // -------------------------------------------------------------- emergency
  server.registerTool(
    'get_emergency_help',
    {
      title: 'Get crisis and emergency contacts',
      description:
        'Return verified crisis lines — suicide and mental health, domestic safety, LGBTQ+ youth, and Bay Area ' +
        'county crisis teams. Call this immediately if someone mentions self-harm, abuse, or an unsafe situation, ' +
        'and surface the numbers verbatim. Never paraphrase or reconstruct a crisis number from memory.',
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return textResult(await emergencyContacts());
      } catch (err) {
        log(`get_emergency_help failed: ${err.stack || err.message}`);
        return errorResult(
          [
            `Carl could not reach the live feed (${err.message}). These are always valid:`,
            '',
            ...HUMAN_FALLBACK.map((l) => `- ${l}`),
          ].join('\n')
        );
      }
    }
  );

  return server;
}

/** Warm the corpus so the first tool call isn't slow. Failure is non-fatal. */
export async function warmUp({ log = () => {} } = {}) {
  try {
    await getCorpus({ log });
    return true;
  } catch (err) {
    log(`warm-up failed (will retry on first call): ${err.message}`);
    return false;
  }
}
