/**
 * Shared HTML sanitization helpers for scrape/sync scripts.
 *
 * The regex patterns here are written to satisfy CodeQL's
 * js/incomplete-multi-character-sanitization and js/bad-tag-filter rules:
 *  - Removal of `<script>` / `<style>` / comment blocks loops until stable
 *    so nested or partially-overlapping injections cannot bypass.
 *  - Closing-tag patterns allow whitespace (`</script\s*>`) and are
 *    case-insensitive.
 */

const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const TAG_RE = /<[^>]+>/g;

const ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function stripBlocks(html) {
  let prev;
  let curr = html;
  do {
    prev = curr;
    curr = curr.replace(SCRIPT_RE, '').replace(STYLE_RE, '').replace(COMMENT_RE, '');
  } while (curr !== prev);
  return curr;
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m) => ENTITY_MAP[m])
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Extract plain text from an HTML fragment.
 * - Strips `<script>`, `<style>`, and HTML comments (loops until stable).
 * - Strips remaining tags.
 * - Decodes common entities.
 * - Collapses whitespace.
 */
function stripHtml(html) {
  if (!html) return '';
  const blocksRemoved = stripBlocks(html);
  const tagsRemoved = blocksRemoved.replace(TAG_RE, ' ');
  return decodeEntities(tagsRemoved).replace(/\s+/g, ' ').trim();
}

module.exports = {
  stripHtml,
  stripBlocks,
  decodeEntities,
  SCRIPT_RE,
  STYLE_RE,
  COMMENT_RE,
  TAG_RE,
};
