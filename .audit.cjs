const fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml');
const DATA = 'src/data';
const NON_PROGRAM = new Set([
  'airports.yml',
  'bay-area-jurisdictions.yml',
  'chat-messages.yml',
  'cities.yml',
  'city-profiles.yml',
  'county-supervisors.yml',
  'custom-themes.yml',
  'groups.yml',
  'helplines.yml',
  'homepage-pills.yml',
  'quick-answers.yml',
  'search-config.yml',
  'site-config.yml',
  'suppressed.yml',
  'transit-agencies.yml',
  'zipcodes.yml',
]);

const files = fs.readdirSync(DATA).filter((f) => f.endsWith('.yml') && !NON_PROGRAM.has(f));
const all = [];
for (const f of files) {
  const docs = yaml.load(fs.readFileSync(path.join(DATA, f), 'utf8'));
  if (!Array.isArray(docs)) {
    console.log(`  (skip ${f}: not an array)`);
    continue;
  }
  for (const r of docs) all.push({ ...r, __file: f, __slug: f.replace('.yml', '') });
}
console.log(`Loaded ${all.length} records from ${files.length} files\n`);

// 1. category field vs filename
const mismatch = all.filter(
  (r) => r.category && r.category.toLowerCase().replace(/\s+/g, '-') !== r.__slug
);
console.log(`1. category field vs filename: ${mismatch.length} mismatches`);
const byPair = {};
for (const r of mismatch) {
  const k = `${r.__slug} -> "${r.category}"`;
  byPair[k] = (byPair[k] || 0) + 1;
}
Object.entries(byPair)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .forEach(([k, v]) => console.log(`     ${k}  (${v})`));

// 2. field presence
console.log('\n2. field coverage (of ' + all.length + '):');
const fields = {};
for (const r of all)
  for (const k of Object.keys(r)) if (!k.startsWith('__')) fields[k] = (fields[k] || 0) + 1;
Object.entries(fields)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    const pct = Math.round((v / all.length) * 100);
    if (pct < 100) console.log(`     ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct}%`);
  });

// 3. area values
console.log('\n3. distinct `area` values: ');
const areas = {};
for (const r of all) areas[r.area ?? '(missing)'] = (areas[r.area ?? '(missing)'] || 0) + 1;
Object.entries(areas)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`     ${String(k).padEnd(28)} ${v}`));

// 4. duplicate ids
const ids = {};
for (const r of all) {
  if (!r.id) continue;
  (ids[r.id] = ids[r.id] || []).push(r.__file);
}
const dupes = Object.entries(ids).filter(([, f]) => f.length > 1);
console.log(`\n4. duplicate ids: ${dupes.length}`);
dupes.slice(0, 10).forEach(([id, f]) => console.log(`     ${id}: ${f.join(', ')}`));

// 5. verified_date format + staleness
console.log('\n5. verified_date:');
const bad = all.filter(
  (r) => r.verified_date && !/^\d{4}-\d{2}-\d{2}$/.test(String(r.verified_date))
);
console.log(`     non ISO-8601: ${bad.length}`);
const dated = all
  .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(String(r.verified_date)))
  .map((r) => String(r.verified_date))
  .sort();
if (dated.length) {
  console.log(`     oldest: ${dated[0]}   newest: ${dated[dated.length - 1]}`);
  const cutoff = '2026-03-16';
  console.log(`     older than 6 months: ${dated.filter((d) => d < cutoff).length}`);
}

// 6. groups values
console.log('\n6. distinct `groups` values:');
const groups = {};
for (const r of all) for (const g of r.groups || []) groups[g] = (groups[g] || 0) + 1;
Object.entries(groups)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`     ${k.padEnd(24)} ${v}`));
