/**
 * Shared program statistics for the design-preview pages.
 *
 * One loader so the three directions are compared on identical real data —
 * a mockup that quietly uses different numbers is not a comparison.
 */
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';

const NON_PROGRAM_FILES = new Set([
  'cities.yml',
  'groups.yml',
  'zipcodes.yml',
  'suppressed.yml',
  'search-config.yml',
  'transit-agencies.yml',
  'county-supervisors.yml',
  'site-config.yml',
  'bay-area-jurisdictions.yml',
  'city-profiles.yml',
  'helplines.yml',
  'custom-themes.yml',
  'chat-messages.yml',
  'homepage-pills.yml',
]);

export interface ProgramLite {
  id: string;
  name: string;
  description: string;
  area: string;
  category: string;
  counties: string[];
  groups: string[];
  phone?: string;
  link?: string;
}

export interface Stats {
  total: number;
  categories: Array<{ name: string; slug: string; count: number }>;
  programs: ProgramLite[];
}

function titleFromFile(file: string) {
  return file
    .replace('.yml', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function loadStats(): Stats {
  const dataDir = path.join(process.cwd(), 'src/data');

  let suppressed = new Set<string>();
  const sPath = path.join(dataDir, 'suppressed.yml');
  if (fs.existsSync(sPath)) {
    const s = yaml.load(fs.readFileSync(sPath, 'utf8')) as Array<{ id: string }> | null;
    if (Array.isArray(s)) suppressed = new Set(s.map((x) => x.id));
  }

  const programs: ProgramLite[] = [];
  const counts = new Map<string, number>();

  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.yml') || NON_PROGRAM_FILES.has(file)) continue;
    const doc = yaml.load(fs.readFileSync(path.join(dataDir, file), 'utf8')) as any;
    if (!doc) continue;
    const list = Array.isArray(doc) ? doc : doc.programs || [];
    for (const p of list) {
      if (!p?.name) continue;
      const category = p.subcategory || titleFromFile(file);
      const id =
        p.id ||
        `${category.toLowerCase().replace(/\s+/g, '-')}-${String(p.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`;
      if (suppressed.has(id)) continue;
      const fileCategory = titleFromFile(file);
      counts.set(fileCategory, (counts.get(fileCategory) || 0) + 1);
      programs.push({
        id,
        name: p.name,
        description: p.description || '',
        area: p.area || '',
        category: fileCategory,
        counties: Array.isArray(p.counties) ? p.counties : [],
        groups: Array.isArray(p.groups) ? p.groups : [],
        phone: p.phone,
        link: p.link,
      });
    }
  }

  const categories = [...counts.entries()]
    .map(([name, count]) => ({
      name: name === 'Lgbtq' ? 'LGBTQ+' : name,
      slug: name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return { total: programs.length, categories, programs };
}
