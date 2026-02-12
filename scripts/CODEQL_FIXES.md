# CodeQL Security Issues - Analysis & Fixes

**Date**: 2026-02-11
**File**: `scripts/sync-missing-persons.cjs`

## Issues Identified

### 1. Biased Random Numbers from Cryptographic Source (#80) - Line 120

**Severity**: High
**Issue**: `bytes[i] % chars.length` creates biased random selection

```javascript
// CURRENT CODE (BIASED):
function generateCaseId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'BN';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    id += chars[bytes[i] % chars.length]; // ❌ BIASED
  }
  return id;
}
```

**Problem**: Using modulo operator with cryptographic random bytes creates bias. Some characters appear more frequently than others because 256 doesn't divide evenly by 36.

**Fix**: Use rejection sampling to ensure uniform distribution:

```javascript
function generateCaseId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'BN';
  const maxValid = Math.floor(256 / chars.length) * chars.length;

  for (let i = 0; i < 6; i++) {
    let byte;
    do {
      byte = crypto.randomBytes(1)[0];
    } while (byte >= maxValid);
    id += chars[byte % chars.length];
  }
  return id;
}
```

### 2. Incomplete Multi-Character Sanitization (#79) - Line 280

**Severity**: High
**Issue**: `.replace(/<[^>]+>/g, '')` doesn't handle malformed/nested HTML

```javascript
// CURRENT CODE:
details.contactAgency = agencyMatch[1].replace(/<[^>]+>/g, '').trim();
```

**Problem**: Single-pass regex replacement can miss:

- Nested tags: `<b><i>text</i></b>`
- Malformed HTML: `< script>alert('xss')</ script>`
- Split tags: `<scr<script>ipt>`

**Fix**: Use iterative replacement or HTML entity decode:

```javascript
// Option 1: Iterative replacement
function stripHtmlTags(str) {
  let prev;
  do {
    prev = str;
    str = str.replace(/<[^>]*>/g, '');
  } while (str !== prev);
  return str.trim();
}

details.contactAgency = stripHtmlTags(agencyMatch[1]);

// Option 2: Use DOMParser (safer, but requires jsdom in Node.js)
```

### 3. Incomplete Multi-Character Sanitization (#78) - Line 269

**Severity**: High
**Issue**: Same as #79, applied to circumstances field

```javascript
// CURRENT CODE:
details.circumstances = circumstancesMatch[1]
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();
```

**Fix**: Same as #79 - use iterative replacement:

```javascript
details.circumstances = stripHtmlTags(circumstancesMatch[1]).replace(/\s+/g, ' ').trim();
```

### 4. File System Race Condition (#82) - Line 662

**Severity**: High
**Issue**: TOCTOU (Time-of-check to Time-of-use) vulnerability

```javascript
// CURRENT CODE:
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(OUTPUT_PATH, jsonString);
```

**Problem**: Between checking if directory exists and writing file, another process could:

- Delete the directory
- Change permissions
- Create a symlink (path traversal attack)

**Fix**: Use try-catch with recursive mkdir (atomic operation):

```javascript
try {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, jsonString);
} catch (err) {
  console.error(`[missing-persons] Failed to write file: ${err.message}`);
  throw err;
}
```

### 5. Log Injection (#83) - Line 66

**Severity**: Medium
**Issue**: Unsanitized user input in console.warn could inject ANSI escape codes

```javascript
// CURRENT CODE:
function warn(...args) {
  console.warn('[missing-persons]', ...args);
}
```

**Problem**: If `args` contains ANSI escape codes, it could:

- Manipulate terminal output
- Hide malicious content
- Confuse log parsers

**Fix**: Sanitize or use structured logging:

```javascript
function warn(...args) {
  const sanitized = args.map((arg) =>
    typeof arg === 'string'
      ? arg.replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI codes
      : arg
  );
  console.warn('[missing-persons]', ...sanitized);
}

// OR use structured logging:
function warn(...args) {
  console.warn(
    JSON.stringify({
      service: 'missing-persons',
      level: 'warn',
      message: args.map((a) => String(a)).join(' '),
      timestamp: new Date().toISOString(),
    })
  );
}
```

## Priority Fixes

### Critical (Fix Immediately)

1. **#82 - File System Race Condition**: Simplest fix, prevents potential security issue
2. **#80 - Biased Random Numbers**: Important for ID uniqueness/security

### High (Fix Soon)

3. **#79, #78 - HTML Sanitization**: Prevent XSS in scraped data
4. **#83 - Log Injection**: Lower risk but easy to fix

## Implementation Order

1. Fix #82 (file system race) - 2 lines changed
2. Fix #80 (random bias) - function rewrite
3. Add `stripHtmlTags()` helper function
4. Fix #79 and #78 (use stripHtmlTags)
5. Fix #83 (sanitize logging)

## Testing

After fixes, verify:

- Case IDs are still unique: `grep -o '"caseId":"BN[a-z0-9]*"' public/data/missing-persons.json | sort | uniq -d`
- HTML is stripped: Check output doesn't contain `<` or `>` in text fields
- File writes succeed: Run sync manually and verify no errors
- Logs are clean: Check logs don't contain ANSI codes

---

**Next Step**: Apply these fixes to `scripts/sync-missing-persons.cjs`
