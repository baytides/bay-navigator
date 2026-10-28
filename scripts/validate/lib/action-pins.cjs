/**
 * Action pin parsing and classification.
 *
 * Pure logic only: no filesystem, no network, no process exit. The CLI that
 * reads .github/workflows/ and prints results lives in
 * scripts/validate/validate-action-pins.cjs; everything here is unit-tested in
 * tests/unit/action-pins.test.cjs.
 *
 * Split out for two reasons. The decision logic is the part that matters — if
 * it silently stops recognising `uses:` lines, or starts calling a tag object a
 * commit, the guard passes while checking nothing. And keeping the CLI's
 * console output out of this module keeps the coverage denominator honest:
 * c8 only counts files the tests load.
 *
 * Background on what this guards against is in the CLI's header.
 */

// `uses: owner/repo[/path]@ref`, ignoring local (./) and docker:// references.
const USES_RE =
  /^\s*(?:-\s*)?uses:\s*["']?([A-Za-z0-9][\w.-]*\/[\w.-]+(?:\/[\w./-]+)?)@([^\s"'#]+)/;

// Git object names are lowercase hex. An uppercase 40-char ref is a tag or
// branch name, not a SHA.
const SHA_RE = /^[0-9a-f]{40}$/;

/**
 * Parse one workflow line into { repo, ref, isSha }, or null if it is not an
 * action reference. `repo` is reduced to owner/repo because that is what the
 * GitHub API needs, even when the reference points at a path inside the repo.
 *
 * @param {string} line
 * @returns {{repo: string, ref: string, isSha: boolean} | null}
 */
function parseUsesLine(line) {
  if (/^\s*#/.test(line)) return null; // commented-out `uses:`
  const match = USES_RE.exec(line);
  if (!match) return null;

  const [, actionPath, ref] = match;
  const [owner, repo] = actionPath.split('/');
  return { repo: `${owner}/${repo}`, ref, isSha: SHA_RE.test(ref) };
}

/**
 * Collect unique repo+ref pairs across workflow files, remembering every
 * file:line where each was seen.
 *
 * @param {Array<{file: string, lines: string[]}>} files
 * @returns {Array<{repo: string, ref: string, isSha: boolean, sources: string[]}>}
 */
function collectPins(files) {
  const pins = new Map(); // "repo@ref" -> { repo, ref, isSha, sources: Set }

  for (const { file, lines } of files) {
    lines.forEach((line, i) => {
      const parsed = parseUsesLine(line);
      if (!parsed) return;

      const key = `${parsed.repo}@${parsed.ref}`;
      if (!pins.has(key)) pins.set(key, { ...parsed, sources: new Set() });
      pins.get(key).sources.add(`${file}:${i + 1}`);
    });
  }

  return [...pins.values()].map((p) => ({ ...p, sources: [...p.sources] }));
}

/**
 * Decide what a SHA pin actually points at.
 *
 * `apiFn(route)` is injected so this is testable without network access. It
 * must resolve to { ok, status, body }.
 *
 * Verdicts:
 *   commit      - correctly pinned
 *   tag-object  - 40 hex chars, but an annotated tag object; carries the commit
 *                 SHA to use instead
 *   missing     - no such object in that repo
 *   unverifiable- could not tell (rate limit, 5xx, transport). Deliberately
 *                 distinct from a bad pin so nobody chases a problem that is
 *                 not there.
 *
 * @param {{repo: string, ref: string}} pin
 * @param {(route: string) => Promise<{ok: boolean, status: number, body: any}>} apiFn
 */
async function classifyPin(pin, apiFn) {
  const asCommit = await apiFn(`/repos/${pin.repo}/git/commits/${pin.ref}`);
  if (asCommit.ok) return { kind: 'commit' };

  // 404/422 means "not a commit object". Anything else is an access or
  // transport problem and must not be reported as a bad pin.
  if (asCommit.status !== 404 && asCommit.status !== 422) {
    return { kind: 'unverifiable', detail: `HTTP ${asCommit.status} checking commit` };
  }

  const asTag = await apiFn(`/repos/${pin.repo}/git/tags/${pin.ref}`);
  if (asTag.ok && asTag.body?.object?.sha) {
    return { kind: 'tag-object', tag: asTag.body.tag, commit: asTag.body.object.sha };
  }
  if (!asTag.ok && asTag.status !== 404 && asTag.status !== 422) {
    return { kind: 'unverifiable', detail: `HTTP ${asTag.status} checking tag` };
  }
  return { kind: 'missing' };
}

module.exports = { USES_RE, SHA_RE, parseUsesLine, collectPins, classifyPin };
