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
  if (row.body) lines.push('', row.body);
  return lines.join('\n');
}

/** Render a list of hits, or the no-match guidance when there are none. */
export function formatResults(hits, { query, bodyChars, noMatch }) {
  if (!hits || hits.length === 0) return noMatch(query);
  const header = `Found ${hits.length} match${hits.length === 1 ? '' : 'es'} for "${query}".`;
  return [header, '', hits.map((h) => formatHit(h, { bodyChars })).join('\n\n')].join('\n');
}
