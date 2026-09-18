/**
 * Simple Language — plain-word alternatives, rendered at build time.
 *
 * WHY THIS IS NOT THE OLD IMPLEMENTATION
 *
 * The previous version fetched /data/simple-descriptions.json in the browser
 * and rewrote text nodes after load. That failed in every way a feature can:
 * the file it fetched no longer existed, the script was loaded by no page, its
 * selectors pointed at markup that had been replaced, and the words it needed
 * came from an Ollama server retired in September 2026. Toggling the control in
 * Settings changed nothing at all.
 *
 * This one substitutes nothing at runtime. Both wordings are rendered into the
 * page at build time and global.css decides which is visible:
 *
 *   <span class="text-normal">eligibility</span><span class="text-simple">who can apply</span>
 *
 * That contract is not invented here — it is documented in global.css and was
 * already implemented there, waiting for markup that never came.
 *
 * What it buys: the switch is instant with no fetch and no flash of the wrong
 * wording, it works offline and with JavaScript disabled, it cannot drift from
 * a data file that goes missing, and it needs no inference server ever again.
 *
 * What it costs: page weight, since every simplified word ships twice. At 891
 * matches across 808 programmes that is a few KB before compression, which is
 * the right trade for text someone reads during a hard week.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type WordMap = Record<string, string>;

let cached: WordMap | null = null;

/** The authored word list. Read once per build. */
export function loadSimplifications(): WordMap {
  if (cached) return cached;
  try {
    const file = path.join(process.cwd(), 'src/data/simple-language.yml');
    const parsed = yaml.load(fs.readFileSync(file, 'utf8')) as { words?: WordMap };
    cached = parsed?.words ?? {};
  } catch {
    cached = {};
  }
  return cached;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape before interpolation. The output of this module is injected with
 * set:html, so programme text — which comes from scrapers and third-party
 * feeds — must not be able to introduce markup.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * Carry the original capitalisation onto the replacement, so "Eligibility
 * requirements" opens a sentence as "Who can apply", not "who can apply".
 * Only the first letter is considered; an all-caps word is left alone rather
 * than shouting a whole phrase back.
 */
function matchCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  const isCapitalised = original[0] === original[0].toUpperCase();
  if (!isCapitalised) return replacement;
  return replacement[0].toUpperCase() + replacement.slice(1);
}

/** Build one alternation over the word list, longest first so "eligibility" wins over "eligible". */
function buildPattern(words: WordMap): RegExp | null {
  const keys = Object.keys(words).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return null;
  const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

let pattern: RegExp | null | undefined;

/**
 * Render text with both wordings in place.
 *
 * Returns escaped HTML. When nothing matches, returns the escaped text with no
 * extra markup at all, so the overwhelming majority of strings are unchanged
 * and pay nothing.
 */
export function simpleLanguageHtml(text: string | null | undefined): string {
  const source = String(text ?? '');
  if (!source) return '';

  const words = loadSimplifications();
  if (pattern === undefined) pattern = buildPattern(words);
  if (!pattern) return escapeHtml(source);

  let out = '';
  let last = 0;
  // Fresh lastIndex per call: the regex is global and shared across pages.
  pattern.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(source)) !== null) {
    const original = m[0];
    const replacement = words[original.toLowerCase()];
    if (!replacement) continue;
    out += escapeHtml(source.slice(last, m.index));
    out +=
      `<span class="text-normal">${escapeHtml(original)}</span>` +
      `<span class="text-simple">${escapeHtml(matchCase(original, replacement))}</span>`;
    last = m.index + original.length;
  }
  if (last === 0) return escapeHtml(source);
  out += escapeHtml(source.slice(last));
  return out;
}

/** True when the text contains at least one word we can simplify. */
export function hasSimplification(text: string | null | undefined): boolean {
  const source = String(text ?? '');
  if (!source) return false;
  const words = loadSimplifications();
  if (pattern === undefined) pattern = buildPattern(words);
  if (!pattern) return false;
  pattern.lastIndex = 0;
  return pattern.test(source);
}
