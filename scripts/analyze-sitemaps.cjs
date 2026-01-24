const data = require("../data-exports/city-info/sitemaps-inventory.json");
const withSitemap = data.filter(e => e.hasSitemap);
const withoutSitemap = data.filter(e => !e.hasSitemap);

console.log("=== SITEMAP INVENTORY SUMMARY ===\n");
console.log("Total entities:", data.length);
console.log("With sitemap:", withSitemap.length, "(" + Math.round(withSitemap.length/data.length*100) + "%)");
console.log("Without sitemap:", withoutSitemap.length, "(" + Math.round(withoutSitemap.length/data.length*100) + "%)");

// Total URLs available
const totalUrls = withSitemap.reduce((sum, e) => sum + e.urlCount, 0);
console.log("Total URLs in sitemaps:", totalUrls.toLocaleString());

console.log("\n--- WITH SITEMAPS (by URL count) ---");
withSitemap.sort((a,b) => b.urlCount - a.urlCount).forEach(e => {
  console.log(e.urlCount.toString().padStart(6) + " URLs | " + e.name + " (" + e.type + ")");
});

console.log("\n--- WITHOUT SITEMAPS (will use homepage crawling) ---");
withoutSitemap.forEach(e => {
  console.log("  " + e.name + " (" + e.type + ") - " + e.url);
});
