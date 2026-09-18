/**
 * Turning corpus rows into text an assistant can quote accurately.
 *
 * Every formatter here exists to fight one specific failure: a chatbot
 * paraphrasing a social service into something subtly wrong. Phone numbers,
 * eligibility caveats and source URLs travel WITH the result so the model can
 * cite rather than recall.
 */

const TYPE_LABEL = {
  resource: 'Program',
  ca_code: 'California law',
  muni_code: 'Local ordinance',
  museum_venue: 'Museum',
  museum_program: 'Museum program',
};

/** Trim body text to a quotable excerpt without cutting mid-word. */
export function excerpt(text, max = 400) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

/** One search hit as a compact, citable block. */
export function formatHit(row, { bodyChars = 300 } = {}) {
  const lines = [`### ${row.title}`];
  const facets = [TYPE_LABEL[row.type] || row.type, row.category, row.city || row.area].filter(
    Boolean
  );
  lines.push(`_${facets.join(' · ')}_`);

  const body = excerpt(row.body, bodyChars);
  if (body) lines.push(body);

  const meta = row.meta || {};
  const contact = [
    meta.phone && `Phone: ${meta.phone}`,
    meta.email && `Email: ${meta.email}`,
    meta.address && `Address: ${meta.address}`,
    meta.cost && `Cost: ${meta.cost}`,
  ].filter(Boolean);
  if (contact.length) lines.push(contact.join(' · '));

  // An ordinance the scraper cut short must never read as the complete rule.
  // The end is where exceptions, penalties and "does not apply if..." clauses
  // live, so a partial quote can invert the answer.
  if (row.meta?.truncated) {
    lines.push(
      '**This text is incomplete** — it was cut off mid-ordinance. Say so, and send the person to the source link for the full rule, especially before telling them something is or is not allowed.'
    );
  }

  if (row.url) lines.push(`Source: ${row.url}`);
  lines.push(`\`id: ${row.id}\``);
  return lines.join('\n');
}

/** Full detail for a single record — everything we know, nothing summarized. */
export function formatDetail(row) {
  const lines = [`# ${row.title}`, ''];
  const facts = [
    ['Type', TYPE_LABEL[row.type] || row.type],
    ['Category', row.category],
    ['Area', row.area],
    ['City', row.city],
  ].filter(([, v]) => v);
  for (const [k, v] of facts) lines.push(`**${k}:** ${v}`);

  const meta = row.meta || {};
  for (const [k, label] of [
    ['phone', 'Phone'],
    ['email', 'Email'],
    ['address', 'Address'],
    ['agency', 'Agency'],
    ['cost', 'Cost'],
    ['howToApply', 'How to apply'],
  ]) {
    if (meta[k]) lines.push(`**${label}:** ${meta[k]}`);
  }

  if (row.url) lines.push(`**Source:** ${row.url}`);
  if (row.meta?.truncated) {
    lines.push(
      '',
      '**This text is incomplete** — the ordinance was cut off. Do not present it as the full rule; link the source.'
    );
  }
  if (row.body) lines.push('', row.body);
  return lines.join('\n');
}

/** Render a list of hits, or the no-match guidance when there are none. */
export function formatResults(hits, { query, bodyChars, noMatch }) {
  if (!hits || hits.length === 0) return noMatch(query);

  // Say plainly when this is a page rather than the whole answer.
  //
  // A host model asked which museums take Museums for All, received the top 10,
  // and told the user "Carl had nothing for San Mateo County". Filoli was match
  // 29. The response gave no hint it was partial, so the model presented a page
  // as an exhaustive list — which for a benefits directory means telling someone
  // no help exists near them when it does.
  const total = typeof hits.totalMatches === 'number' ? hits.totalMatches : hits.length;
  const shown = hits.length;

  // Legal text gets a sharper warning. Summarising 5 of 40 ordinance sections
  // as "the rule" is the same defect as the museum case, but the consequence is
  // someone acting on a prohibition whose exemption was on page two.
  const isLaw = hits.some((h) => h.type === 'muni_code' || h.type === 'ca_code');
  const header =
    total > shown
      ? `Showing ${shown} of ${total} matches for "${query}". This is NOT the full list. ` +
        `Call list_all_matching with the same filters to get every match in one go. Do NOT state ` +
        `that something does not exist based on this page.` +
        (isLaw
          ? ` These are individual sections, not the whole rule: do not summarise them as "the law ` +
            `says X" while matches remain unread, and link the source so the reader can check.`
          : '')
      : `Found ${shown} match${shown === 1 ? '' : 'es'} for "${query}".`;

  return [header, '', hits.map((h) => formatHit(h, { bodyChars })).join('\n\n')].join('\n');
}

/**
 * One compact line per match, for enumeration rather than reading.
 *
 * A ranked page of rich entries is the wrong shape for "which museums take
 * Museums for All?". That question wants the whole set, and a host model given
 * a truncated page will confidently present it as the whole set — which is how
 * "Carl had nothing for San Mateo County" got said about a county that has
 * Filoli and CuriOdyssey in it.
 *
 * Roughly 15 tokens per row, so all 57 museum venues cost less than eight rich
 * entries do.
 */
export function formatRoster(hits, { query, filters = {}, noMatch }) {
  if (!hits || hits.length === 0) return noMatch(query);

  const applied = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  const total = typeof hits.totalMatches === 'number' ? hits.totalMatches : hits.length;
  const capped = total > hits.length;
  const head = capped
    ? `${hits.length} of ${total} match${total === 1 ? '' : 'es'}` +
      (query ? ` for "${query}"` : '') +
      (applied ? ` (${applied})` : '') +
      `. This hit the \`max\` cap and is STILL not the full set — raise \`max\`, or narrow the ` +
      `filters, before drawing any conclusion about what does or does not exist.`
    : `Complete list: ${hits.length} match${hits.length === 1 ? '' : 'es'}` +
      (query ? ` for "${query}"` : '') +
      (applied ? ` (${applied})` : '') +
      `. This IS the full set — nothing is truncated.`;

  const rows = hits.map((h) => {
    const where = h.city || h.area || '';
    const gist = String(h.body || '')
      .replace(/\s+/g, ' ')
      .slice(0, 110)
      .trim();
    return `- ${h.title}${where ? ` — ${where}` : ''}${gist ? `: ${gist}` : ''}`;
  });

  return [
    head,
    '',
    ...rows,
    '',
    `Use get_resource with an id, or search_resources, for full detail on any of these.`,
  ].join('\n');
}
