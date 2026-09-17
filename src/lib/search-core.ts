/**
 * Bay Navigator search core.
 *
 * Framework-agnostic and DOM-free, so the same ranking serves every surface:
 * the homepage, the directory, and the MCP connector. Previously the homepage
 * and directory each carried their own copy of rewriteQuery/expandSynonyms/
 * getBestBets with different semantics and different result limits, so the two
 * returned materially different answers for the same query by construction.
 *
 * WHY THIS REPLACES FUSE
 * ----------------------
 * Fuse's `threshold` conflates two independent questions:
 *   (a) how loosely may ONE term match?   — typo tolerance
 *   (b) how MANY of my terms must match?  — strictness
 * One knob cannot answer both, which is why tuning oscillated between "too
 * narrow" (typos die) and "too broad" (fuzzy noise floods in). Fuse also has
 * no IDF and no real AND semantics, so common words dominate.
 *
 * Here those are separate controls:
 *   (a) FUZZY / prefix          — per-term tolerance
 *   (b) progressive AND -> OR   — term strictness
 *   (c) stage-dependent gap     — tail trimming
 */

import MiniSearch from 'minisearch';

export interface ProgramLike {
  id: string;
  name: string;
  description?: string | null;
  fullDescription?: string | null;
  keywords?: string | string[] | null;
  category?: string | null;
  areas?: string[] | null;
  counties?: string[] | null;
  city?: string | null;
}

export interface SearchConfig {
  synonyms?: Record<string, string[] | string>;
  best_bets?: Record<string, string[] | string>;
  query_rewrites?: Record<string, string>;
}

export interface SearchResult<T extends ProgramLike> {
  results: T[];
  stage: string;
  rewritten: string | null;
  county: string | null;
  /** No document contains all of the user's actual words — present as "closest matches". */
  lowConfidence: boolean;
  /** Ids promoted by a validated best-bet pin, in pin order. */
  pinned: string[];
  total: number;
  /** best_bets entries pointing at programs that no longer exist. */
  deadBets: string[];
}

export const FIELD_BOOST = { name: 4, keywords: 2.5, category: 2, description: 1, area: 1 };
export const FUZZY = 0.2;
export const MAX_RESULTS = 50;

/**
 * Three tiers, not two. The corpus is 823 records but only ~359 are
 * assistance; recreation alone is 191 and retail 56. Without this, "food"
 * surfaces museums and "rent" surfaces EV rebates.
 */
const CORE_NEED = new Set([
  'food', 'housing', 'health', 'utilities', 'legal',
  'employment', 'finance', 'federal-benefits', 'safety',
]);
const NEUTRAL = new Set([
  'education', 'community', 'transportation', 'lgbtq',
  'technology', 'library-resources', 'equipment',
]);
const NEED_BOOST = 1.6;
const NEED_PENALTY = 0.28;

/**
 * Off-domain categories are suppressed unless the query names that domain.
 * "i need food" must not return pet food — the word matches, the domain does
 * not — while "free pet food" still must.
 */
const OFF_DOMAIN: Record<string, RegExp> = {
  'pet-resources': /\b(pet|pets|dog|dogs|cat|cats|animal|puppy|kitten|vet|veterinary)\b/,
  recreation: /\b(park|parks|hike|hiking|camp|camping|museum|trail|recreation|visit)\b/,
  retail: /\b(discount|deal|deals|coupon|shopping|store|sale)\b/,
};

const NEED_RE =
  /\b(help|assist|afford|cant|cheap|free|low income|emergency|pay|bill|rent|evict|hungry|food|shelter|homeless|sick|doctor|medicine|benefit)\b/;

const STOP = new Set([
  'i', 'me', 'my', 'a', 'an', 'the', 'is', 'are', 'to', 'for', 'of', 'in', 'on',
  'need', 'want', 'get', 'find', 'looking', 'help', 'please', 'near', 'some',
  'any', 'im', 'am', 'and', 'with', 'how', 'do', 'can', 'where',
]);

/**
 * "cant pay rent", "can't pay rent" and "CAN NOT PAY RENT" must resolve to one
 * key. This also strips the characters Fuse treated as query operators, where
 * a leading "!" turned a search into a 777-result negation.
 */
export function normalize(q: string): string {
  return String(q || '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bcan ?not\b/g, 'cant')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse trivial plurals so "food banks" matches "food bank". */
function processTerm(term: string): string | null {
  const t = term.toLowerCase();
  if (t.length < 2) return null;
  if (t.length > 3 && t.endsWith('ies')) return `${t.slice(0, -3)}y`;
  if (t.length > 3 && t.endsWith('es')) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

export function buildIndex<T extends ProgramLike>(programs: T[]): MiniSearch {
  const mini = new MiniSearch({
    idField: 'id',
    fields: ['name', 'keywords', 'description', 'category', 'area'],
    storeFields: ['id'],
    searchOptions: { boost: FIELD_BOOST, prefix: true, fuzzy: FUZZY },
    processTerm,
  });

  mini.addAll(
    programs.map((p) => ({
      id: p.id,
      name: p.name || '',
      keywords: Array.isArray(p.keywords) ? p.keywords.join(' ') : p.keywords || '',
      description: [p.description, p.fullDescription].filter(Boolean).join(' '),
      category: p.category || '',
      area: [(p.areas || []).join(' '), p.city || ''].join(' '),
    }))
  );

  return mini;
}

export interface SearcherOptions {
  /** Resolve a normalised query to a county slug, e.g. "oakland" -> "alameda". */
  countyOf?: (normalizedQuery: string) => string | null;
}

export function makeSearcher<T extends ProgramLike>(
  programs: T[],
  config: SearchConfig = {},
  { countyOf }: SearcherOptions = {}
) {
  const mini = buildIndex(programs);
  const byId = new Map(programs.map((p) => [p.id, p]));

  // Validate best bets up front. 33 of 86 pins pointed at programs that no
  // longer exist, and a dead pin silently promotes the wrong program — the
  // reason "pge bill help" led with Medical Baseline Allowance.
  const bestBets = new Map<string, string[]>();
  const deadBets: string[] = [];
  for (const [q, raw] of Object.entries(config.best_bets || {})) {
    const ids = Array.isArray(raw) ? raw : [raw];
    const live = ids.filter((id) => {
      if (byId.has(id)) return true;
      deadBets.push(`${q} -> ${id}`);
      return false;
    });
    if (live.length) bestBets.set(normalize(q), live);
  }

  const rewrites = new Map(
    Object.entries(config.query_rewrites || {}).map(([k, v]) => [normalize(k), v])
  );
  const synonyms = new Map(
    Object.entries(config.synonyms || {}).map(([k, v]) => [
      normalize(k),
      (Array.isArray(v) ? v : [v]).map(normalize),
    ])
  );

  /**
   * Draws on BOTH the rewritten query and the user's own words. A rewrite
   * narrows intent for ranking but must not discard the original wording for
   * recall — otherwise "can't pay rent" -> "rental assistance" loses "rent",
   * and with it every eviction-defense program.
   */
  function expand(effective: string, original: string) {
    const terms = effective.split(' ').filter((t) => t && !STOP.has(t));
    const extra = new Set<string>();
    for (const src of new Set([effective, original])) {
      synonyms.get(src)?.forEach((s) => extra.add(s));
      for (const t of src.split(' ')) {
        if (t && !STOP.has(t)) synonyms.get(t)?.forEach((s) => extra.add(s));
      }
    }
    terms.forEach((t) => extra.delete(t));
    return { terms, extra: [...extra] };
  }

  return function search(rawQuery: string, opts: { limit?: number; county?: string } = {}): SearchResult<T> {
    const limit = opts.limit || MAX_RESULTS;
    const norm = normalize(rawQuery);
    const empty = (stage: string): SearchResult<T> => ({
      results: [], stage, rewritten: null, county: null,
      lowConfidence: false, pinned: [], total: 0, deadBets,
    });
    if (!norm) return empty('empty');

    const rewritten = rewrites.get(norm) || null;
    const effective = normalize(rewritten || norm);
    const { terms, extra } = expand(effective, norm);
    if (!terms.length) return empty('stopwords-only');

    const need = Boolean(rewritten) || NEED_RE.test(norm);
    const core = terms.join(' ');

    // Does ANY document contain all of the user's actual words? Score
    // magnitude cannot answer this: "need a lawyer" scores 20 and is right,
    // "hearing aids" scores 60 and is wrong because the corpus has no
    // hearing-aid program and "hearing" fuzzy-matched "heating".
    const exactEvidence = mini.search(core, {
      boost: FIELD_BOOST, combineWith: 'AND', prefix: false, fuzzy: false,
    }).length;

    // Strict first; loosen only if starved. The AND stages run on core terms
    // ONLY — synonyms broaden recall and must never become requirements.
    const stages = [
      { name: 'and-exact', gap: 0.15, o: { combineWith: 'AND' as const, prefix: false, fuzzy: false } },
      { name: 'and-fuzzy', gap: 0.15, o: { combineWith: 'AND' as const, prefix: true, fuzzy: FUZZY } },
      { name: 'or-syn', gap: 0.3, o: { combineWith: 'OR' as const, prefix: true, fuzzy: FUZZY } },
    ];

    let hits: Array<{ id: string; score: number }> = [];
    let stage = 'none';
    let gap = 0.3;
    for (const s of stages) {
      const q = s.name === 'or-syn' ? [...terms, ...extra].join(' ') : core;
      hits = mini.search(q, { boost: FIELD_BOOST, ...s.o }) as never;
      stage = s.name;
      gap = s.gap;
      if (hits.length >= 3) break;
    }

    // Synonyms always contribute, never merely as a fallback. A precise AND
    // match on the rewritten intent would otherwise never surface a related
    // answer, because the strict stage succeeded and the loose one never ran.
    // Related hits merge in BELOW core hits, at a discount: after, not instead.
    if (extra.length && stage !== 'or-syn' && hits.length) {
      const seen = new Set(hits.map((h) => h.id));
      const top = hits[0].score;
      const related = (
        mini.search(extra.join(' '), {
          boost: FIELD_BOOST, combineWith: 'OR', prefix: true, fuzzy: FUZZY,
        }) as never as Array<{ id: string; score: number }>
      ).filter((h) => !seen.has(h.id));
      const relTop = related.length ? related[0].score : 1;
      for (const h of related) hits.push({ ...h, score: (h.score / relTop) * top * 0.5 });
    }

    if (!hits.length) return { ...empty('no-match'), rewritten };

    if (need) {
      for (const h of hits) {
        const cat = byId.get(h.id)?.category || '';
        if (CORE_NEED.has(cat)) { h.score *= NEED_BOOST; continue; }
        if (NEUTRAL.has(cat)) continue;
        const gate = OFF_DOMAIN[cat];
        h.score *= gate && gate.test(norm) ? 1 : NEED_PENALTY;
      }
    }

    // Location is a facet, not free text. Typing a city previously did nothing
    // but add a term to the bag of words.
    const county = opts.county || (countyOf ? countyOf(norm) : null) || null;
    if (county) {
      hits = hits.filter((h) => {
        const c = byId.get(h.id)?.counties || [];
        return c.includes(county) || c.includes('all');
      });
      for (const h of hits) {
        if ((byId.get(h.id)?.counties || []).includes(county)) h.score *= 1.25;
      }
    }
    if (!hits.length) return { ...empty('no-match-in-county'), rewritten, county };

    hits.sort((a, b) => b.score - a.score);

    // Tail trim, stage-dependent: AND results matched every term so keep them;
    // OR results carry a long noise tail so cut harder. This is what kills
    // "too broad" without touching typo tolerance.
    const top = hits[0].score;
    const kept = hits.filter((h) => h.score >= top * gap);

    const pinned = (bestBets.get(norm) || bestBets.get(effective) || []).filter((id) => byId.has(id));
    const rest = kept.map((h) => h.id).filter((id) => !pinned.includes(id));
    const ordered = [...pinned, ...rest].slice(0, limit);

    return {
      results: ordered.map((id) => byId.get(id)!).filter(Boolean),
      stage,
      rewritten,
      county,
      lowConfidence: exactEvidence === 0,
      pinned,
      total: ordered.length,
      deadBets,
    };
  };
}
