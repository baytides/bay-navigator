const fs = require("fs");
const yaml = require("js-yaml");
const dataPath = "/Users/steven/Documents/Github/baynavigator/src/data";

const NON_PROGRAM_FILES = ["cities.yml", "groups.yml", "zipcodes.yml", "suppressed.yml", "search-config.yml", "county-supervisors.yml"];
const files = fs.readdirSync(dataPath).filter(f => f.endsWith(".yml") && !NON_PROGRAM_FILES.includes(f));

const allPrograms = [];
const idCounts = {};
const nameCounts = {};

files.forEach(file => {
  try {
    const content = fs.readFileSync(dataPath + "/" + file, "utf8");
    const data = yaml.load(content);

    if (Array.isArray(data)) {
      data.forEach(p => {
        allPrograms.push({ ...p, sourceFile: file });

        // Track ID duplicates
        idCounts[p.id] = (idCounts[p.id] || 0) + 1;

        // Track name duplicates (case-insensitive)
        const nameLower = p.name?.toLowerCase();
        nameCounts[nameLower] = nameCounts[nameLower] || [];
        nameCounts[nameLower].push({ name: p.name, file, id: p.id });
      });
    }
  } catch(e) {
    console.error("Error reading", file, e.message);
  }
});

// Find duplicates
console.log("=== DUPLICATE IDs ===");
let dupIds = 0;
Object.entries(idCounts).filter(([k,v]) => v > 1).forEach(([id, count]) => {
  console.log("ID:", id, "- appears", count, "times");
  dupIds++;
});
if (dupIds === 0) console.log("None found");

console.log("\n=== DUPLICATE NAMES (potential duplicates) ===");
let dupNames = 0;
Object.entries(nameCounts).filter(([k,v]) => v.length > 1).forEach(([name, items]) => {
  console.log("Name:", items[0].name);
  items.forEach(i => console.log("  - " + i.file + " (id: " + i.id + ")"));
  dupNames++;
});
if (dupNames === 0) console.log("None found");

console.log("\n=== FEDERAL BENEFITS BY CATEGORY ===");
const fedBenefits = yaml.load(fs.readFileSync(dataPath + "/federal-benefits.yml", "utf8"));
const byCat = {};
fedBenefits.forEach(b => {
  byCat[b.category] = byCat[b.category] || [];
  byCat[b.category].push(b.name);
});
Object.entries(byCat).sort((a,b) => a[0].localeCompare(b[0])).forEach(([cat, items]) => {
  console.log("\n" + cat.toUpperCase() + " (" + items.length + "):");
  items.forEach(i => console.log("  - " + i));
});
