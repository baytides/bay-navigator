/**
 * Unit tests for scripts/validate/lib/action-pins.cjs
 *
 * This guard can fail silently in two ways, and both are covered here: if the
 * `uses:` regex stops matching, zero pins are collected and every pin "passes";
 * and if classifyPin mistakes a tag object for a commit, the exact bug it
 * exists to catch sails through. (The CLI also refuses to pass when it finds no
 * SHA pins at all, which is the second line of defence.)
 *
 * No network and no filesystem access — inputs are literal workflow lines, and
 * classifyPin takes its API function by injection.
 *
 * Run with: node --test tests/unit/action-pins.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  parseUsesLine,
  collectPins,
  classifyPin,
} = require('../../scripts/validate/lib/action-pins.cjs');

const SHA = 'b1d267aea5211fa648d9d442fa64b90dbdcbdd36';
const TAG_OBJECT_SHA = '6ad84ce1ef2d4124ba333b221894c133c4a970ea';

describe('parseUsesLine', () => {
  it('recognises a SHA-pinned step', () => {
    const r = parseUsesLine(`      - uses: softprops/action-gh-release@${SHA}`);
    assert.deepStrictEqual(r, { repo: 'softprops/action-gh-release', ref: SHA, isSha: true });
  });

  it('reduces a reusable-workflow path to owner/repo', () => {
    // The pin that broke OSV scanning looked exactly like this.
    const line = `    uses: google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@${SHA} # v2.7.0`;
    const r = parseUsesLine(line);
    assert.strictEqual(
      r.repo,
      'google/osv-scanner-action',
      'the API needs owner/repo, not the path'
    );
    assert.strictEqual(r.ref, SHA, 'the trailing " # v2.7.0" comment must not leak into the ref');
    assert.strictEqual(r.isSha, true);
  });

  it('treats a tag ref as a non-SHA pin', () => {
    const r = parseUsesLine('      - uses: actions/checkout@v6');
    assert.deepStrictEqual(r, { repo: 'actions/checkout', ref: 'v6', isSha: false });
  });

  it('accepts the quoted form', () => {
    const r = parseUsesLine(`      - uses: "actions/setup-node@v6"`);
    assert.strictEqual(r.repo, 'actions/setup-node');
    assert.strictEqual(r.ref, 'v6');
  });

  it('ignores commented-out references', () => {
    assert.strictEqual(
      parseUsesLine(`      # - uses: evil/action@${SHA}`),
      null,
      'a commented pin is not in effect and must not be reported'
    );
  });

  it('ignores local and docker references', () => {
    assert.strictEqual(parseUsesLine('      - uses: ./.github/actions/setup'), null);
    assert.strictEqual(parseUsesLine('      - uses: docker://alpine:3.20'), null);
  });

  it('ignores lines that merely contain the word uses', () => {
    assert.strictEqual(parseUsesLine('      run: echo "this uses: nothing@v1"'), null);
  });

  it('does not mistake a near-SHA for a SHA', () => {
    const short = 'b1d267aea5211fa648d9d442fa64b90dbdcbdd3'; // 39 chars
    assert.strictEqual(parseUsesLine(`      - uses: some/action@${short}`).isSha, false);

    const upper = SHA.toUpperCase();
    assert.strictEqual(
      parseUsesLine(`      - uses: some/action@${upper}`).isSha,
      false,
      'git SHAs are lowercase hex; an uppercase ref is a tag or branch name'
    );
  });
});

describe('collectPins', () => {
  it('deduplicates one pin used in several places but keeps every source', () => {
    const pins = collectPins([
      { file: 'a.yml', lines: ['jobs:', `  x:`, `    uses: o/r@${SHA}`] },
      { file: 'b.yml', lines: [`    uses: o/r@${SHA}`] },
    ]);

    assert.strictEqual(pins.length, 1, 'the same repo@ref is one pin to check, not two');
    assert.deepStrictEqual(pins[0].sources.sort(), ['a.yml:3', 'b.yml:1']);
  });

  it('records accurate file:line so a failure can be found', () => {
    const pins = collectPins([
      { file: 'w.yml', lines: ['name: W', 'on: push', `    uses: o/r@${SHA}`] },
    ]);
    assert.deepStrictEqual(pins[0].sources, ['w.yml:3']);
  });

  it('separates SHA pins from tag refs', () => {
    const pins = collectPins([
      { file: 'w.yml', lines: [`    uses: o/r@${SHA}`, '    uses: actions/checkout@v6'] },
    ]);
    assert.deepStrictEqual(
      pins.map((p) => p.isSha),
      [true, false]
    );
  });

  it('returns nothing when there is nothing to find', () => {
    // The CLI turns this into a hard failure rather than a pass.
    assert.deepStrictEqual(collectPins([{ file: 'w.yml', lines: ['run: echo hi'] }]), []);
  });
});

describe('classifyPin', () => {
  /** Build an apiFn that answers from a route -> response map, and record calls. */
  function stubApi(responses) {
    const calls = [];
    const fn = async (route) => {
      calls.push(route);
      return responses[route] ?? { ok: false, status: 404, body: null };
    };
    fn.calls = calls;
    return fn;
  }

  const pin = { repo: 'google/osv-scanner-action', ref: TAG_OBJECT_SHA };

  it('accepts a real commit without asking about tags', async () => {
    const api = stubApi({
      [`/repos/${pin.repo}/git/commits/${pin.ref}`]: { ok: true, status: 200, body: { sha: SHA } },
    });

    assert.deepStrictEqual(await classifyPin(pin, api), { kind: 'commit' });
    assert.strictEqual(api.calls.length, 1, 'a valid commit needs no second request');
  });

  it('catches an annotated tag object and reports the commit to use', async () => {
    // This is the real October 2026 failure, reduced to its API responses.
    const api = stubApi({
      [`/repos/${pin.repo}/git/commits/${pin.ref}`]: { ok: false, status: 422, body: null },
      [`/repos/${pin.repo}/git/tags/${pin.ref}`]: {
        ok: true,
        status: 200,
        body: { tag: 'v2.7.0', object: { sha: SHA, type: 'commit' } },
      },
    });

    assert.deepStrictEqual(await classifyPin(pin, api), {
      kind: 'tag-object',
      tag: 'v2.7.0',
      commit: SHA,
    });
  });

  it('reports a SHA that is neither commit nor tag as missing', async () => {
    const api = stubApi({}); // everything 404s
    assert.deepStrictEqual(await classifyPin(pin, api), { kind: 'missing' });
  });

  it('treats a rate-limited check as unverifiable, not a bad pin', async () => {
    const api = stubApi({
      [`/repos/${pin.repo}/git/commits/${pin.ref}`]: { ok: false, status: 403, body: null },
    });

    const verdict = await classifyPin(pin, api);
    assert.strictEqual(verdict.kind, 'unverifiable', '403 is "cannot see", not "pin is wrong"');
    assert.match(verdict.detail, /403/);
    assert.strictEqual(api.calls.length, 1, 'no point asking about tags once rate limited');
  });

  it('treats a server error on the tag lookup as unverifiable too', async () => {
    const api = stubApi({
      [`/repos/${pin.repo}/git/commits/${pin.ref}`]: { ok: false, status: 404, body: null },
      [`/repos/${pin.repo}/git/tags/${pin.ref}`]: { ok: false, status: 500, body: null },
    });

    const verdict = await classifyPin(pin, api);
    assert.strictEqual(verdict.kind, 'unverifiable');
    assert.match(verdict.detail, /500/);
  });

  it('does not treat a tag object with no target as valid', async () => {
    const api = stubApi({
      [`/repos/${pin.repo}/git/commits/${pin.ref}`]: { ok: false, status: 404, body: null },
      [`/repos/${pin.repo}/git/tags/${pin.ref}`]: { ok: true, status: 200, body: { tag: 'v1' } },
    });

    assert.deepStrictEqual(await classifyPin(pin, api), { kind: 'missing' });
  });
});
