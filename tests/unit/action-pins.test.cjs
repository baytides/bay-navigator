/**
 * Unit tests for scripts/validate/validate-action-pins.cjs
 *
 * Covers only the pure line parser, which is where this guard can fail
 * silently: if the `uses:` regex stops matching, zero pins are collected and
 * the validator reports every pin as fine. (The script also refuses to pass
 * when it finds no SHA pins at all, which is the second line of defence.)
 *
 * No network and no filesystem access — the inputs are literal workflow lines.
 *
 * Run with: node --test tests/unit/action-pins.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { parseUsesLine } = require('../../scripts/validate/validate-action-pins.cjs');

const SHA = 'b1d267aea5211fa648d9d442fa64b90dbdcbdd36';

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
