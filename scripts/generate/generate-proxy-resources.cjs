#!/usr/bin/env node
/**
 * Generate Privacy Proxy Resources Page
 *
 * This script reads YAML data files and generates a resources.html page
 * for the Holy Unblocker proxy, including only programs with proxy_permitted: true
 *
 * Usage: node scripts/generate-proxy-resources.cjs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Categories to scan for proxy-permitted resources
const CATEGORIES_TO_SCAN = ['safety', 'lgbtq', 'health', 'legal', 'community'];

// Category display names and order
const CATEGORY_CONFIG = {
  Safety: { order: 1, title: 'Domestic Violence & Safety' },
  'LGBTQ+': { order: 2, title: 'LGBTQ+ Support' },
  Health: { order: 3, title: 'Health & Wellness' },
  Legal: { order: 4, title: 'Legal Support' },
  Community: { order: 5, title: 'Community Resources' },
};

function loadYamlFile(filename) {
  const filepath = path.join(__dirname, '..', '..', 'src', 'data', `${filename}.yml`);
  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: ${filepath} not found`);
    return [];
  }

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = yaml.load(content);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error loading ${filepath}:`, err.message);
    return [];
  }
}

function generateResourceCard(program) {
  const phone = program.phone ? `<span class="hotline">${program.phone}</span>` : '';

  return `              <a href="/s#${program.link}" class="fancybutton glowbutton pr-go2">${program.name}</a>`;
}

function generateCategorySection(categoryName, programs) {
  const config = CATEGORY_CONFIG[categoryName] || { title: categoryName };

  const cards = programs.map((p) => generateResourceCard(p)).join('\n');

  return `
            <!-- ${config.title} -->
            <div class="category-divider">
              <span>${config.title}</span>
            </div>
${cards}`;
}

function generateHtml(programsByCategory) {
  // Sort categories by order
  const sortedCategories = Object.entries(programsByCategory).sort((a, b) => {
    const orderA = CATEGORY_CONFIG[a[0]]?.order || 99;
    const orderB = CATEGORY_CONFIG[b[0]]?.order || 99;
    return orderA - orderB;
  });

  const categorySections = sortedCategories
    .map(([cat, programs]) => generateCategorySection(cat, programs))
    .join('\n');

  return `<!doctype html>
<html>
  <head>
    <title>{{mask}}{{Privacy Resources | Bay Navigator}}</title>
    {{ifSEO}}{{
    <meta
      name="description"
      content="Access sensitive health, safety, and support resources privately through Bay Navigator's privacy proxy."
    />
    }}
    <!--HEAD-CONTENT-->
    <script src="{{route}}{{/scram/scramjet.all.js}}" defer data-module></script>
    <script src="{{route}}{{/baremux/index.js}}" defer data-module></script>
    {{inline}}{{
    <script src="{{route}}{{/assets/js/register-sw.js}}{{inline}}" defer></script>
    }}
    <script src="https://unpkg.com/tsparticles@3.8.1/tsparticles.bundle.min.js" defer data-module></script>
    <script src="https://unpkg.com/@popperjs/core@2" defer data-module></script>
    <script src="https://unpkg.com/tippy.js@6" defer></script>
    {{inline}}{{
    <script src="{{route}}{{assets/js/csel.js}}{{inline}}" defer></script>
    <script src="{{route}}{{assets/js/common.js}}{{inline}}" defer></script>
    }}
    <style>
      .category-divider {
        width: 100%;
        text-align: center;
        margin: 2rem 0 1rem;
        position: relative;
      }
      .category-divider::before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 1px;
        background: rgba(148, 163, 184, 0.3);
      }
      .category-divider span {
        background: #1d232a;
        padding: 0 1.5rem;
        position: relative;
        color: #f87171;
        font-size: 1.1rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .safety-alert {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0 2rem;
        color: #fca5a5;
        font-size: 0.9rem;
        text-align: center;
      }
      .safety-alert strong {
        color: #f87171;
      }
      .glist {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
      }
    </style>
  </head>

  <body>
    <!-- IMPORTANT-HUCOOKINGINSERT-DONOTDELETE -->
    <!--ANTI-EXFIL-->
    <div id="header" class="fullwidth">
      <!--HEADER-->
    </div>
    <div id="background" class="fullwidth"></div>
    <!-- IMPORTANT-HUCOOKINGINSERT-DONOTDELETE -->
    <div data-aos="fade-right" class="hero-grid-container">
      <div class="box-hero">
        <div class="hero-content">
          <div class="proxy-header text-center">
            <h1 class="bigtitle">{{mask}}{{Privacy Resources}}</h1>
            <p>
              {{mask}}{{Access sensitive health, safety, and support resources privately.}}<br />
              {{mask}}{{Your browsing through this proxy leaves no trace in your browser history.}}
            </p>
            <div class="safety-alert">
              <strong>{{mask}}{{Safety Tip:}}</strong> {{mask}}{{Press Ctrl+W (Windows) or Cmd+W (Mac) to quickly close this tab. Consider using private/incognito mode.}}
            </div>
          </div>
          <div class="proxy-form text-center">
            <div class="glist">
${categorySections}
            </div>
            <!--PROXNAV-SETTINGS-->
          </div>
        </div>
      </div>
    </div>
    <!-- IMPORTANT-HUCOOKINGINSERT-DONOTDELETE -->
    <div id="footer" class="fullwidth">
      <!--FOOTER-->
    </div>
  </body>
</html>`;
}

function main() {
  console.log('Generating proxy resources page...');

  const programsByCategory = {};
  let totalPrograms = 0;

  // Load all category files and filter for proxy_permitted
  for (const category of CATEGORIES_TO_SCAN) {
    const programs = loadYamlFile(category);

    const proxyPermitted = programs.filter((p) => p.proxy_permitted === true && p.link);

    if (proxyPermitted.length > 0) {
      // Group by category field in the program
      for (const program of proxyPermitted) {
        const cat = program.category || 'Other';
        if (!programsByCategory[cat]) {
          programsByCategory[cat] = [];
        }
        programsByCategory[cat].push(program);
        totalPrograms++;
      }
    }
  }

  console.log(
    `Found ${totalPrograms} proxy-permitted programs across ${Object.keys(programsByCategory).length} categories`
  );

  // Generate HTML
  const html = generateHtml(programsByCategory);

  // Write to file
  const outputPath = path.join(__dirname, '..', '..', 'public', 'proxy-resources.html');
  fs.writeFileSync(outputPath, html);
  console.log(`Generated: ${outputPath}`);

  // Also show SCP command to deploy
  console.log('\nTo deploy to proxy server:');
  console.log(
    'scp -i ~/.ssh/id_do_ollama public/proxy-resources.html root@ai.baytides.org:/opt/holyunblocker/views/pages/nav/resources.html'
  );
  console.log(
    'Then run: ssh -i ~/.ssh/id_do_ollama root@ai.baytides.org "cd /opt/holyunblocker && npm run build && systemctl restart holyunblocker"'
  );
}

main();
