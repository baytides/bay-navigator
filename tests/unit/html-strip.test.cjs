/**
 * The shared HTML sanitizer used by the scrape and sync scripts.
 *
 * This module had no tests at all, which is the wrong state for the one piece
 * of code standing between scraped third-party HTML and the text we publish.
 * Its own header claims some specific security properties — that block removal
 * loops until stable, that odd closing tags like `</script bar>` are still
 * treated as end tags, and that the output can never contain the literal
 * `<script` or `<style` — so these assert exactly those claims rather than
 * just exercising the happy path.
 *
 * Run: node --test tests/unit/html-strip.test.cjs
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');

const { stripHtml, stripBlocks, decodeEntities } = require('../../scripts/util/html-strip.cjs');

describe('stripHtml — ordinary content', () => {
  it('returns an empty string for empty input', () => {
    assert.equal(stripHtml(''), '');
    assert.equal(stripHtml(null), '');
    assert.equal(stripHtml(undefined), '');
  });

  it('drops tags but keeps their text', () => {
    assert.equal(stripHtml('<p>Food <strong>bank</strong></p>'), 'Food bank');
  });

  it('collapses the whitespace that tag removal leaves behind', () => {
    // Tags become a space, so a dense fragment would otherwise come out with
    // runs of blanks between every word.
    assert.equal(stripHtml('<ul><li>One</li><li>Two</li></ul>'), 'One Two');
  });

  it('decodes the entities a scraped page actually carries', () => {
    assert.equal(stripHtml('<p>Tom&nbsp;&amp; Jerry&#39;s</p>'), "Tom & Jerry's");
    assert.equal(stripHtml('<p>5 &lt; 10 &gt; 2</p>'), '5 < 10 > 2');
  });

  it('decodes numeric character references', () => {
    assert.equal(decodeEntities('caf&#233;'), 'café');
  });
});

describe('stripHtml — the security properties the module claims', () => {
  it('removes script and style blocks with their contents', () => {
    assert.equal(stripHtml('<p>a</p><script>alert(1)</script><p>b</p>'), 'a b');
    assert.equal(stripHtml('<style>.x{color:red}</style><p>b</p>'), 'b');
  });

  it('removes comments, including ones wrapping markup', () => {
    assert.equal(stripHtml('<p>a</p><!-- <script>alert(1)</script> --><p>b</p>'), 'a b');
  });

  it('keeps looping until removal is stable, so nesting cannot bypass it', () => {
    // A single pass turns this into a working <script> tag. The do/while is
    // the whole reason it does not.
    const nested = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    assert.ok(!stripBlocks(nested).includes('<script'));
    assert.ok(!stripHtml(nested).includes('<script'));
  });

  it('treats non-standard end tags as end tags', () => {
    // The HTML spec accepts anything up to `>` after the tag name, and a
    // sanitizer that insists on exactly `</script>` leaves the payload behind.
    for (const closing of ['</script bar>', '</script\n>', '</script\t>']) {
      const html = `<p>a</p><script>alert(1)${closing}<p>b</p>`;
      const out = stripHtml(html);
      assert.ok(!out.includes('alert(1)'), `payload survived ${JSON.stringify(closing)}`);
    }
  });

  it('never returns the literal <script or <style, even via entity decoding', () => {
    // `&lt;script` decodes to `<script` AFTER the tag pass, which is why the
    // final scrub exists.
    const out = stripHtml('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    assert.ok(!out.includes('<script'), `got: ${out}`);
    assert.ok(!out.includes('<style'));
  });

  it('is idempotent — sanitising twice changes nothing', () => {
    const once = stripHtml('<div><script>x</script><p>Keep &amp; hold</p></div>');
    assert.equal(stripHtml(once), once);
  });
});
