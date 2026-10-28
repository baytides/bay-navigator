#!/usr/bin/env node
/**
 * Bay Navigator GitHub Action Pin Validation
 *
 * Checks that every SHA-pinned action in .github/workflows/ is pinned to a
 * COMMIT, not to something that merely looks like one.
 *
 * Why this exists: an annotated tag's object SHA is also 40 hex characters, so
 * `uses: google/osv-scanner-action/...@<tag-object-sha>` looks correctly pinned
 * and passes review. GitHub Actions cannot resolve a reusable-workflow
 * reference to a tag object, so the workflow produces conclusion "failure",
 * ZERO jobs and no logs — indistinguishable at a glance from a scanner that
 * simply found problems. That disabled OSV scanning here for a week in
 * October 2026 while the repo was reported as clean.
 *
 * The trap is that `gh api repos/O/R/git/refs/tags/vX --jq .object.sha` returns
 * the tag object for an annotated tag; the commit needs a second hop through
 * `git/tags/<sha>`. Lightweight tags return the commit directly, which is why
 * most pins are fine and the broken one looked no different.
 *
 * Non-SHA refs (e.g. @v4) are reported but never fail: this repo pins
 * third-party actions by SHA and leaves first-party actions/* and azure/* on
 * major tags.
 *
 * Usage: node scripts/validate/validate-action-pins.cjs
 *
 * Auth: uses GITHUB_TOKEN or GH_TOKEN when set, otherwise falls back to
 * `gh auth token`. Unauthenticated requests are limited to 60/hour and will
 * usually report pins as unverifiable rather than valid.
 *
 * Exit codes:
 *   0 - Every SHA pin resolves to a commit
 *   1 - A pin is not a commit, a pin could not be verified, or no SHA pins were
 *       found at all (see MIN_EXPECTED_SHA_PINS)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const WORKFLOWS_DIR = path.join(__dirname, '..', '..', '.github', 'workflows');

// DECISION (flip this one line): what to do when a pin cannot be checked at all
// — a 403 from rate limiting, a 5xx, or no network.
//   true  -> fail the run. A guard that goes quiet exactly when it cannot see
//            is the failure mode this script was written to prevent, and the
//            message distinguishes "unverifiable" from "bad pin" so nobody
//            hunts for a pin problem that is not there.
//   false -> warn and pass. Keeps CI green through upstream flakiness, at the
//            cost of a window where a bad pin slips by unnoticed.
// Both paths are implemented below; `true` is the safer default.
const FAIL_ON_UNVERIFIABLE = true;

// A guard that finds nothing must not report success. If the `uses:` regex ever
// stops matching — a syntax this script does not anticipate, a renamed
// workflows directory — then zero pins are checked and every one of them
// "passes", which is the exact silent-green failure this script exists to stop.
// This repo pins its third-party actions by SHA, so finding none means the
// parser is broken, not that the pins are clean.
const MIN_EXPECTED_SHA_PINS = 1;

// `uses: owner/repo[/path]@ref`, ignoring local (./) and docker:// references.
const USES_RE =
  /^\s*(?:-\s*)?uses:\s*["']?([A-Za-z0-9][\w.-]*\/[\w.-]+(?:\/[\w./-]+)?)@([^\s"'#]+)/;
const SHA_RE = /^[0-9a-f]{40}$/;

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

const TOKEN = githubToken();

async function api(route) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'baynavigator-validate-action-pins',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch(`https://api.github.com${route}`, { headers });
  return { ok: res.ok, status: res.status, body: res.ok ? await res.json() : null };
}

/**
 * Parse one workflow line into { repo, ref, isSha }, or null if it is not an
 * action reference. Kept pure and exported so tests can cover the matching
 * without touching the filesystem or the network — if this regex silently stops
 * matching, the whole guard passes vacuously.
 */
function parseUsesLine(line) {
  if (/^\s*#/.test(line)) return null; // commented-out `uses:`
  const match = USES_RE.exec(line);
  if (!match) return null;

  const [, actionPath, ref] = match;
  const [owner, repo] = actionPath.split('/');
  return { repo: `${owner}/${repo}`, ref, isSha: SHA_RE.test(ref) };
}

/** Collect unique owner/repo + ref pairs, remembering where each was seen. */
function collectPins() {
  const pins = new Map(); // "repo@ref" -> { repo, ref, isSha, sources: Set }

  for (const file of fs.readdirSync(WORKFLOWS_DIR).sort()) {
    if (!/\.ya?ml$/.test(file)) continue;

    const lines = fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf-8').split('\n');
    lines.forEach((line, i) => {
      const parsed = parseUsesLine(line);
      if (!parsed) return;

      const key = `${parsed.repo}@${parsed.ref}`;
      if (!pins.has(key)) pins.set(key, { ...parsed, sources: new Set() });
      pins.get(key).sources.add(`${file}:${i + 1}`);
    });
  }
  return [...pins.values()];
}

/** Classify one SHA pin: commit, tag object (with the SHA to use), or unverifiable. */
async function classify(pin) {
  const asCommit = await api(`/repos/${pin.repo}/git/commits/${pin.ref}`);
  if (asCommit.ok) return { kind: 'commit' };

  // 404/422 here means "not a commit object". Anything else is an access or
  // transport problem and must not be reported as a bad pin.
  if (asCommit.status !== 404 && asCommit.status !== 422) {
    return { kind: 'unverifiable', detail: `HTTP ${asCommit.status} checking commit` };
  }

  const asTag = await api(`/repos/${pin.repo}/git/tags/${pin.ref}`);
  if (asTag.ok && asTag.body?.object?.sha) {
    return { kind: 'tag-object', tag: asTag.body.tag, commit: asTag.body.object.sha };
  }
  if (!asTag.ok && asTag.status !== 404 && asTag.status !== 422) {
    return { kind: 'unverifiable', detail: `HTTP ${asTag.status} checking tag` };
  }
  return { kind: 'missing' };
}

async function main() {
  console.log(`${colors.bold}Bay Navigator Action Pin Validation${colors.reset}\n`);
  if (!TOKEN) {
    console.log(
      `${colors.yellow}⚠${colors.reset} No GITHUB_TOKEN/GH_TOKEN and no gh auth; requests are rate limited to 60/hour.\n`
    );
  }

  const pins = collectPins();
  const shaPins = pins.filter((p) => p.isSha);
  const refPins = pins.filter((p) => !p.isSha);

  if (shaPins.length < MIN_EXPECTED_SHA_PINS) {
    console.log(
      `${colors.red}✗${colors.reset} Found ${shaPins.length} SHA-pinned actions, expected at least ${MIN_EXPECTED_SHA_PINS}.`
    );
    console.log(
      `  ${colors.red}•${colors.reset} This almost certainly means the parser stopped matching, not that the pins are clean.`
    );
    console.log(`  ${colors.dim}Checked ${WORKFLOWS_DIR}${colors.reset}`);
    process.exit(1);
  }

  let bad = 0;
  let unverifiable = 0;

  for (const pin of shaPins) {
    const where = [...pin.sources].join(', ');
    const verdict = await classify(pin);
    const short = pin.ref.slice(0, 12);

    if (verdict.kind === 'commit') {
      console.log(
        `${colors.green}✓${colors.reset} ${pin.repo}@${short} ${colors.dim}(commit)${colors.reset}`
      );
      continue;
    }

    if (verdict.kind === 'tag-object') {
      bad++;
      console.log(`${colors.red}✗${colors.reset} ${pin.repo}@${short}`);
      console.log(
        `  ${colors.red}•${colors.reset} This is the annotated tag object for ${verdict.tag}, not a commit.`
      );
      console.log(`  ${colors.blue}→${colors.reset} Replace with: ${verdict.commit}`);
      console.log(`  ${colors.dim}at ${where}${colors.reset}`);
      continue;
    }

    if (verdict.kind === 'missing') {
      bad++;
      console.log(`${colors.red}✗${colors.reset} ${pin.repo}@${short}`);
      console.log(
        `  ${colors.red}•${colors.reset} No commit or tag object with this SHA exists in ${pin.repo}.`
      );
      console.log(`  ${colors.dim}at ${where}${colors.reset}`);
      continue;
    }

    unverifiable++;
    console.log(`${colors.yellow}⚠${colors.reset} ${pin.repo}@${short}`);
    console.log(`  ${colors.yellow}•${colors.reset} Could not verify: ${verdict.detail}`);
    console.log(`  ${colors.dim}at ${where}${colors.reset}`);
  }

  for (const pin of refPins) {
    console.log(
      `${colors.dim}·${colors.reset} ${pin.repo}@${pin.ref} ${colors.dim}(tag/branch, not checked)${colors.reset}`
    );
  }

  console.log(`\n${colors.bold}Summary${colors.reset}`);
  console.log('─────────────────────────────');
  console.log(`SHA pins checked: ${shaPins.length}`);
  console.log(`Tag/branch refs:  ${refPins.length}`);
  console.log(`Invalid pins:     ${bad > 0 ? colors.red : colors.green}${bad}${colors.reset}`);
  console.log(
    `Unverifiable:     ${unverifiable > 0 ? colors.yellow : colors.green}${unverifiable}${colors.reset}`
  );

  if (bad > 0) {
    console.log(`\n${colors.red}✗ Action pin validation failed${colors.reset}`);
    process.exit(1);
  }
  if (unverifiable > 0 && FAIL_ON_UNVERIFIABLE) {
    console.log(
      `\n${colors.red}✗ Could not verify every pin, so this is being treated as a failure.${colors.reset}`
    );
    console.log(
      `${colors.dim}  These are access/transport problems, not bad pins. Re-run, or see FAIL_ON_UNVERIFIABLE.${colors.reset}`
    );
    process.exit(1);
  }
  if (unverifiable > 0) {
    console.log(
      `\n${colors.yellow}⚠ Passing with ${unverifiable} unverified pin(s)${colors.reset}`
    );
    process.exit(0);
  }
  console.log(`\n${colors.green}✓ All SHA pins resolve to commits${colors.reset}`);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`${colors.red}✗ validate-action-pins crashed: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { parseUsesLine, USES_RE, SHA_RE };
