#!/usr/bin/env node
/**
 * Comprehensive Bay Area City & County Website Scraper
 *
 * Extracts useful city information for Carl the AI assistant:
 * - City services and departments
 * - Contact information
 * - Emergency resources
 * - Community programs
 * - Public services (libraries, recreation, etc.)
 *
 * Usage: node scripts/scrape-city-info.cjs [--quick] [--county=NAME]
 *   --quick: Only scrape first 5 cities (for testing)
 *   --county=NAME: Only scrape cities in specified county
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 */

const fs = require('fs');
const path = require('path');

// Output directories
const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'city-info');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'all-cities.json');
const OUTPUT_BY_COUNTY = path.join(OUTPUT_DIR, 'cities-by-county.json');

// All Bay Area cities and counties
const BAY_AREA_ENTITIES = [
  // Alameda County
  { county: 'Alameda', name: 'Alameda County', type: 'County', url: 'https://www.acgov.org' },
  { county: 'Alameda', name: 'Alameda', type: 'City', url: 'https://www.alamedaca.gov' },
  { county: 'Alameda', name: 'Albany', type: 'City', url: 'https://www.albanyca.gov' },
  { county: 'Alameda', name: 'Berkeley', type: 'City', url: 'https://berkeleyca.gov' },
  { county: 'Alameda', name: 'Dublin', type: 'City', url: 'https://dublin.ca.gov' },
  { county: 'Alameda', name: 'Emeryville', type: 'City', url: 'https://www.emeryville.org' },
  { county: 'Alameda', name: 'Fremont', type: 'City', url: 'https://www.fremont.gov' },
  { county: 'Alameda', name: 'Hayward', type: 'City', url: 'https://www.hayward-ca.gov' },
  { county: 'Alameda', name: 'Livermore', type: 'City', url: 'https://www.livermoreca.gov' },
  { county: 'Alameda', name: 'Newark', type: 'City', url: 'https://www.newarkca.gov' },
  { county: 'Alameda', name: 'Oakland', type: 'City', url: 'https://www.oaklandca.gov' },
  { county: 'Alameda', name: 'Piedmont', type: 'City', url: 'https://piedmont.ca.gov' },
  { county: 'Alameda', name: 'Pleasanton', type: 'City', url: 'https://www.cityofpleasantonca.gov' },
  { county: 'Alameda', name: 'San Leandro', type: 'City', url: 'https://www.sanleandro.org' },
  { county: 'Alameda', name: 'Union City', type: 'City', url: 'https://www.unioncityca.gov' },

  // Contra Costa County
  { county: 'Contra Costa', name: 'Contra Costa County', type: 'County', url: 'https://www.contracosta.ca.gov' },
  { county: 'Contra Costa', name: 'Antioch', type: 'City', url: 'https://www.antiochca.gov' },
  { county: 'Contra Costa', name: 'Brentwood', type: 'City', url: 'https://www.brentwoodca.gov' },
  { county: 'Contra Costa', name: 'Clayton', type: 'City', url: 'https://claytonca.gov' },
  { county: 'Contra Costa', name: 'Concord', type: 'City', url: 'https://cityofconcord.org' },
  { county: 'Contra Costa', name: 'Danville', type: 'Town', url: 'https://www.danville.ca.gov' },
  { county: 'Contra Costa', name: 'El Cerrito', type: 'City', url: 'https://www.el-cerrito.org' },
  { county: 'Contra Costa', name: 'Hercules', type: 'City', url: 'https://www.ci.hercules.ca.us' },
  { county: 'Contra Costa', name: 'Lafayette', type: 'City', url: 'https://www.lovelafayette.org' },
  { county: 'Contra Costa', name: 'Martinez', type: 'City', url: 'https://www.cityofmartinez.org' },
  { county: 'Contra Costa', name: 'Moraga', type: 'Town', url: 'https://www.moraga.ca.us' },
  { county: 'Contra Costa', name: 'Oakley', type: 'City', url: 'https://www.ci.oakley.ca.us' },
  { county: 'Contra Costa', name: 'Orinda', type: 'City', url: 'https://cityoforinda.org' },
  { county: 'Contra Costa', name: 'Pinole', type: 'City', url: 'https://www.ci.pinole.ca.us' },
  { county: 'Contra Costa', name: 'Pittsburg', type: 'City', url: 'https://www.pittsburgca.gov' },
  { county: 'Contra Costa', name: 'Pleasant Hill', type: 'City', url: 'https://www.pleasanthillca.org' },
  { county: 'Contra Costa', name: 'Richmond', type: 'City', url: 'https://www.ci.richmond.ca.us' },
  { county: 'Contra Costa', name: 'San Pablo', type: 'City', url: 'https://www.sanpabloca.gov' },
  { county: 'Contra Costa', name: 'San Ramon', type: 'City', url: 'https://www.sanramon.ca.gov' },
  { county: 'Contra Costa', name: 'Walnut Creek', type: 'City', url: 'https://www.walnutcreekca.gov' },

  // Marin County
  { county: 'Marin', name: 'Marin County', type: 'County', url: 'https://www.marincounty.org' },
  { county: 'Marin', name: 'Belvedere', type: 'City', url: 'https://www.cityofbelvedere.org' },
  { county: 'Marin', name: 'Corte Madera', type: 'Town', url: 'https://www.townofcortemadera.org' },
  { county: 'Marin', name: 'Fairfax', type: 'Town', url: 'https://www.townoffairfaxca.gov' },
  { county: 'Marin', name: 'Larkspur', type: 'City', url: 'https://www.cityoflarkspur.org' },
  { county: 'Marin', name: 'Mill Valley', type: 'City', url: 'https://www.cityofmillvalley.gov' },
  { county: 'Marin', name: 'Novato', type: 'City', url: 'https://www.novato.org' },
  { county: 'Marin', name: 'Ross', type: 'Town', url: 'https://www.townofrossca.gov' },
  { county: 'Marin', name: 'San Anselmo', type: 'Town', url: 'https://www.sananselmo.gov' },
  { county: 'Marin', name: 'San Rafael', type: 'City', url: 'https://www.cityofsanrafael.org' },
  { county: 'Marin', name: 'Sausalito', type: 'City', url: 'https://www.sausalito.gov' },
  { county: 'Marin', name: 'Tiburon', type: 'Town', url: 'https://www.townoftiburon.org' },

  // Napa County
  { county: 'Napa', name: 'Napa County', type: 'County', url: 'https://www.napacounty.gov' },
  { county: 'Napa', name: 'American Canyon', type: 'City', url: 'https://www.americancanyon.gov' },
  { county: 'Napa', name: 'Calistoga', type: 'City', url: 'https://ci.calistoga.ca.us' },
  { county: 'Napa', name: 'Napa', type: 'City', url: 'https://www.cityofnapa.org' },
  { county: 'Napa', name: 'St. Helena', type: 'City', url: 'https://www.cityofsthelena.org' },
  { county: 'Napa', name: 'Yountville', type: 'Town', url: 'https://www.townofyountville.com' },

  // San Francisco
  { county: 'San Francisco', name: 'San Francisco', type: 'City-County', url: 'https://sf.gov' },

  // San Mateo County
  { county: 'San Mateo', name: 'San Mateo County', type: 'County', url: 'https://www.smcgov.org' },
  { county: 'San Mateo', name: 'Atherton', type: 'Town', url: 'https://www.athertonca.gov' },
  { county: 'San Mateo', name: 'Belmont', type: 'City', url: 'https://www.belmont.gov' },
  { county: 'San Mateo', name: 'Brisbane', type: 'City', url: 'https://www.brisbaneca.org' },
  { county: 'San Mateo', name: 'Burlingame', type: 'City', url: 'https://www.burlingame.org' },
  { county: 'San Mateo', name: 'Colma', type: 'Town', url: 'https://www.colma.ca.gov' },
  { county: 'San Mateo', name: 'Daly City', type: 'City', url: 'https://www.dalycity.org' },
  { county: 'San Mateo', name: 'East Palo Alto', type: 'City', url: 'https://www.cityofepa.org' },
  { county: 'San Mateo', name: 'Foster City', type: 'City', url: 'https://www.fostercity.org' },
  { county: 'San Mateo', name: 'Half Moon Bay', type: 'City', url: 'https://www.halfmoonbay.gov' },
  { county: 'San Mateo', name: 'Hillsborough', type: 'Town', url: 'https://www.hillsborough.net' },
  { county: 'San Mateo', name: 'Menlo Park', type: 'City', url: 'https://www.menlopark.org' },
  { county: 'San Mateo', name: 'Millbrae', type: 'City', url: 'https://www.ci.millbrae.ca.us' },
  { county: 'San Mateo', name: 'Pacifica', type: 'City', url: 'https://www.cityofpacifica.org' },
  { county: 'San Mateo', name: 'Portola Valley', type: 'Town', url: 'https://www.portolavalley.net' },
  { county: 'San Mateo', name: 'Redwood City', type: 'City', url: 'https://www.redwoodcity.org' },
  { county: 'San Mateo', name: 'San Bruno', type: 'City', url: 'https://www.sanbruno.ca.gov' },
  { county: 'San Mateo', name: 'San Carlos', type: 'City', url: 'https://www.cityofsancarlos.org' },
  { county: 'San Mateo', name: 'San Mateo', type: 'City', url: 'https://www.cityofsanmateo.org' },
  { county: 'San Mateo', name: 'South San Francisco', type: 'City', url: 'https://www.ssf.net' },
  { county: 'San Mateo', name: 'Woodside', type: 'Town', url: 'https://www.woodsideca.gov' },

  // Santa Clara County
  { county: 'Santa Clara', name: 'Santa Clara County', type: 'County', url: 'https://www.sccgov.org' },
  { county: 'Santa Clara', name: 'Campbell', type: 'City', url: 'https://www.campbellca.gov' },
  { county: 'Santa Clara', name: 'Cupertino', type: 'City', url: 'https://www.cupertino.org' },
  { county: 'Santa Clara', name: 'Gilroy', type: 'City', url: 'https://www.cityofgilroy.org' },
  { county: 'Santa Clara', name: 'Los Altos', type: 'City', url: 'https://www.losaltosca.gov' },
  { county: 'Santa Clara', name: 'Los Altos Hills', type: 'Town', url: 'https://www.losaltoshills.ca.gov' },
  { county: 'Santa Clara', name: 'Los Gatos', type: 'Town', url: 'https://www.losgatosca.gov' },
  { county: 'Santa Clara', name: 'Milpitas', type: 'City', url: 'https://www.milpitas.gov' },
  { county: 'Santa Clara', name: 'Monte Sereno', type: 'City', url: 'https://www.cityofmontesereno.org' },
  { county: 'Santa Clara', name: 'Morgan Hill', type: 'City', url: 'https://www.morgan-hill.ca.gov' },
  { county: 'Santa Clara', name: 'Mountain View', type: 'City', url: 'https://www.mountainview.gov' },
  { county: 'Santa Clara', name: 'Palo Alto', type: 'City', url: 'https://www.paloalto.gov' },
  { county: 'Santa Clara', name: 'San Jose', type: 'City', url: 'https://www.sanjoseca.gov' },
  { county: 'Santa Clara', name: 'Santa Clara', type: 'City', url: 'https://www.santaclaraca.gov' },
  { county: 'Santa Clara', name: 'Saratoga', type: 'City', url: 'https://www.saratoga.ca.us' },
  { county: 'Santa Clara', name: 'Sunnyvale', type: 'City', url: 'https://www.sunnyvale.ca.gov' },

  // Solano County
  { county: 'Solano', name: 'Solano County', type: 'County', url: 'https://www.solanocounty.gov' },
  { county: 'Solano', name: 'Benicia', type: 'City', url: 'https://www.ci.benicia.ca.us' },
  { county: 'Solano', name: 'Dixon', type: 'City', url: 'https://www.cityofdixonca.gov' },
  { county: 'Solano', name: 'Fairfield', type: 'City', url: 'https://www.fairfield.ca.gov' },
  { county: 'Solano', name: 'Rio Vista', type: 'City', url: 'https://www.riovistacity.com' },
  { county: 'Solano', name: 'Suisun City', type: 'City', url: 'https://www.suisun.com' },
  { county: 'Solano', name: 'Vacaville', type: 'City', url: 'https://www.cityofvacaville.gov' },
  { county: 'Solano', name: 'Vallejo', type: 'City', url: 'https://www.cityofvallejo.net' },

  // Sonoma County
  { county: 'Sonoma', name: 'Sonoma County', type: 'County', url: 'https://www.sonomacounty.gov' },
  { county: 'Sonoma', name: 'Cloverdale', type: 'City', url: 'https://www.cloverdale.net' },
  { county: 'Sonoma', name: 'Cotati', type: 'City', url: 'https://www.cotaticity.gov' },
  { county: 'Sonoma', name: 'Healdsburg', type: 'City', url: 'https://healdsburg.gov' },
  { county: 'Sonoma', name: 'Petaluma', type: 'City', url: 'https://cityofpetaluma.org' },
  { county: 'Sonoma', name: 'Rohnert Park', type: 'City', url: 'https://www.rpcity.org' },
  { county: 'Sonoma', name: 'Santa Rosa', type: 'City', url: 'https://srcity.org' },
  { county: 'Sonoma', name: 'Sebastopol', type: 'City', url: 'https://www.cityofsebastopol.gov' },
  { county: 'Sonoma', name: 'Sonoma', type: 'City', url: 'https://www.sonomacity.org' },
  { county: 'Sonoma', name: 'Windsor', type: 'Town', url: 'https://www.townofwindsor.com' },

  // Regional Agencies (serve entire Bay Area)
  { county: 'Regional', name: 'Association of Bay Area Governments (ABAG)', type: 'Regional Agency', url: 'https://abag.ca.gov' },
  { county: 'Regional', name: 'Metropolitan Transportation Commission (MTC)', type: 'Regional Agency', url: 'https://mtc.ca.gov' },
  { county: 'Regional', name: 'Bay Area Air Quality Management District (BAAQMD)', type: 'Regional Agency', url: 'https://www.baaqmd.gov' },
  { county: 'Regional', name: 'Bay Conservation and Development Commission (BCDC)', type: 'Regional Agency', url: 'https://www.bcdc.ca.gov' },
  { county: 'Regional', name: 'Bay Area Rapid Transit (BART)', type: 'Regional Agency', url: 'https://www.bart.gov' },
  { county: 'Regional', name: 'Caltrain', type: 'Regional Agency', url: 'https://www.caltrain.com' },
  { county: 'Regional', name: 'AC Transit', type: 'Regional Agency', url: 'https://www.actransit.org' },
  { county: 'Regional', name: 'Golden Gate Transit', type: 'Regional Agency', url: 'https://www.goldengate.org' },
  { county: 'Regional', name: 'San Francisco Municipal Transportation Agency (SFMTA)', type: 'Regional Agency', url: 'https://www.sfmta.com' },
  { county: 'Regional', name: 'Valley Transportation Authority (VTA)', type: 'Regional Agency', url: 'https://www.vta.org' },
  { county: 'Regional', name: 'SamTrans', type: 'Regional Agency', url: 'https://www.samtrans.com' },
  { county: 'Regional', name: 'Bay Area Toll Authority', type: 'Regional Agency', url: 'https://www.bayareatolls.com' },
  { county: 'Regional', name: '511 SF Bay', type: 'Regional Agency', url: 'https://511.org' },
  { county: 'Regional', name: 'Bay Area Water Supply & Conservation Agency (BAWSCA)', type: 'Regional Agency', url: 'https://bawsca.org' },
  { county: 'Regional', name: 'East Bay Municipal Utility District (EBMUD)', type: 'Regional Agency', url: 'https://www.ebmud.com' },
  { county: 'Regional', name: 'San Francisco Public Utilities Commission (SFPUC)', type: 'Regional Agency', url: 'https://www.sfpuc.org' },
];

// Pages specific to regional transit/utility agencies
const REGIONAL_PAGES_TO_SCRAPE = [
  // Common
  { path: '/', name: 'Homepage', priority: 1 },
  { path: '/about', name: 'About', priority: 2 },
  { path: '/contact', name: 'Contact', priority: 1 },
  { path: '/news', name: 'News', priority: 1 },
  { path: '/alerts', name: 'Alerts', priority: 1 },
  { path: '/faq', name: 'FAQ', priority: 1 },

  // Transit-specific
  { path: '/schedules', name: 'Schedules', priority: 1 },
  { path: '/maps', name: 'Maps', priority: 1 },
  { path: '/fares', name: 'Fares', priority: 1 },
  { path: '/tickets', name: 'Tickets', priority: 1 },
  { path: '/clipper', name: 'Clipper', priority: 1 },
  { path: '/stations', name: 'Stations', priority: 1 },
  { path: '/routes', name: 'Routes', priority: 1 },
  { path: '/accessibility', name: 'Accessibility', priority: 1 },
  { path: '/bike', name: 'Bikes', priority: 2 },
  { path: '/parking', name: 'Parking', priority: 2 },
  { path: '/service-alerts', name: 'Service Alerts', priority: 1 },
  { path: '/rider-guide', name: 'Rider Guide', priority: 2 },
  { path: '/plan-your-trip', name: 'Trip Planner', priority: 1 },

  // Regional planning
  { path: '/planning', name: 'Planning', priority: 2 },
  { path: '/projects', name: 'Projects', priority: 2 },
  { path: '/programs', name: 'Programs', priority: 2 },
  { path: '/funding', name: 'Funding', priority: 2 },
  { path: '/data', name: 'Data', priority: 2 },
  { path: '/reports', name: 'Reports', priority: 2 },
  { path: '/meetings', name: 'Meetings', priority: 2 },

  // Air quality specific
  { path: '/air-quality', name: 'Air Quality', priority: 1 },
  { path: '/spare-the-air', name: 'Spare the Air', priority: 1 },
  { path: '/permits', name: 'Permits', priority: 2 },
  { path: '/compliance', name: 'Compliance', priority: 2 },

  // Water/utilities
  { path: '/water-quality', name: 'Water Quality', priority: 1 },
  { path: '/billing', name: 'Billing', priority: 1 },
  { path: '/rates', name: 'Rates', priority: 1 },
  { path: '/conservation', name: 'Conservation', priority: 1 },
  { path: '/outages', name: 'Outages', priority: 1 },
  { path: '/rebates', name: 'Rebates', priority: 2 },

  // Tolls
  { path: '/tolls', name: 'Tolls', priority: 1 },
  { path: '/fastrak', name: 'FasTrak', priority: 1 },
  { path: '/bridges', name: 'Bridges', priority: 1 },
  { path: '/express-lanes', name: 'Express Lanes', priority: 1 },

  // Jobs
  { path: '/careers', name: 'Careers', priority: 2 },
  { path: '/jobs', name: 'Jobs', priority: 2 },
];

// Pages to scrape from each city website
const PAGES_TO_SCRAPE = [
  // Main/About pages
  { path: '/', name: 'Homepage', priority: 1 },
  { path: '/about', name: 'About', priority: 2 },
  { path: '/about-us', name: 'About', priority: 2 },

  // Contact/Directory
  { path: '/contact', name: 'Contact', priority: 1 },
  { path: '/contact-us', name: 'Contact', priority: 1 },
  { path: '/directory', name: 'Directory', priority: 1 },
  { path: '/departments', name: 'Departments', priority: 1 },
  { path: '/city-departments', name: 'Departments', priority: 1 },

  // Services
  { path: '/services', name: 'Services', priority: 1 },
  { path: '/residents', name: 'Residents', priority: 2 },
  { path: '/resident-services', name: 'Resident Services', priority: 2 },
  { path: '/community-services', name: 'Community Services', priority: 1 },

  // Government
  { path: '/government', name: 'Government', priority: 2 },
  { path: '/city-government', name: 'Government', priority: 2 },
  { path: '/city-council', name: 'City Council', priority: 2 },

  // Emergency/Safety
  { path: '/emergency', name: 'Emergency', priority: 1 },
  { path: '/emergency-services', name: 'Emergency', priority: 1 },
  { path: '/police', name: 'Police', priority: 1 },
  { path: '/fire', name: 'Fire', priority: 1 },

  // Parks/Recreation
  { path: '/parks', name: 'Parks', priority: 2 },
  { path: '/parks-recreation', name: 'Parks & Rec', priority: 2 },
  { path: '/recreation', name: 'Recreation', priority: 2 },

  // Housing
  { path: '/housing', name: 'Housing', priority: 1 },
  { path: '/affordable-housing', name: 'Affordable Housing', priority: 1 },

  // Community Resources
  { path: '/resources', name: 'Resources', priority: 1 },
  { path: '/community', name: 'Community', priority: 2 },
  { path: '/social-services', name: 'Social Services', priority: 1 },
  { path: '/human-services', name: 'Human Services', priority: 1 },

  // Library
  { path: '/library', name: 'Library', priority: 2 },

  // Permits/Business
  { path: '/permits', name: 'Permits', priority: 3 },
  { path: '/building', name: 'Building', priority: 3 },
  { path: '/planning', name: 'Planning', priority: 3 },

  // CALENDAR & EVENTS
  { path: '/calendar', name: 'Calendar', priority: 1 },
  { path: '/events', name: 'Events', priority: 1 },
  { path: '/community-calendar', name: 'Community Calendar', priority: 1 },
  { path: '/meetings', name: 'Meetings', priority: 2 },
  { path: '/public-meetings', name: 'Public Meetings', priority: 2 },
  { path: '/city-meetings', name: 'City Meetings', priority: 2 },
  { path: '/agendas', name: 'Agendas', priority: 2 },
  { path: '/calendar-events', name: 'Calendar & Events', priority: 2 },

  // NEWS & ANNOUNCEMENTS
  { path: '/news', name: 'News', priority: 1 },
  { path: '/newsroom', name: 'Newsroom', priority: 1 },
  { path: '/announcements', name: 'Announcements', priority: 1 },
  { path: '/press-releases', name: 'Press Releases', priority: 2 },
  { path: '/alerts', name: 'Alerts', priority: 1 },
  { path: '/emergency-alerts', name: 'Emergency Alerts', priority: 1 },
  { path: '/notify-me', name: 'Notifications', priority: 2 },
  { path: '/enews', name: 'E-Newsletter', priority: 2 },

  // MUNICIPAL CODE & LAWS
  { path: '/municipal-code', name: 'Municipal Code', priority: 1 },
  { path: '/city-code', name: 'City Code', priority: 1 },
  { path: '/ordinances', name: 'Ordinances', priority: 1 },
  { path: '/code', name: 'Code', priority: 2 },
  { path: '/laws', name: 'Laws', priority: 2 },
  { path: '/regulations', name: 'Regulations', priority: 2 },
  { path: '/zoning', name: 'Zoning', priority: 2 },
  { path: '/general-plan', name: 'General Plan', priority: 2 },

  // UTILITIES & BILLS
  { path: '/utilities', name: 'Utilities', priority: 1 },
  { path: '/water', name: 'Water', priority: 2 },
  { path: '/garbage', name: 'Garbage', priority: 2 },
  { path: '/trash', name: 'Trash', priority: 2 },
  { path: '/recycling', name: 'Recycling', priority: 2 },
  { path: '/sewer', name: 'Sewer', priority: 2 },
  { path: '/pay-bills', name: 'Pay Bills', priority: 1 },
  { path: '/billing', name: 'Billing', priority: 2 },

  // TRANSPORTATION & PARKING
  { path: '/transportation', name: 'Transportation', priority: 2 },
  { path: '/parking', name: 'Parking', priority: 2 },
  { path: '/transit', name: 'Transit', priority: 2 },
  { path: '/streets', name: 'Streets', priority: 2 },
  { path: '/traffic', name: 'Traffic', priority: 2 },

  // JOBS & EMPLOYMENT
  { path: '/jobs', name: 'Jobs', priority: 2 },
  { path: '/employment', name: 'Employment', priority: 2 },
  { path: '/careers', name: 'Careers', priority: 2 },
  { path: '/human-resources', name: 'Human Resources', priority: 3 },

  // BUSINESS
  { path: '/business', name: 'Business', priority: 2 },
  { path: '/economic-development', name: 'Economic Development', priority: 3 },
  { path: '/business-license', name: 'Business License', priority: 2 },
  { path: '/starting-a-business', name: 'Starting a Business', priority: 3 },

  // PUBLIC SAFETY
  { path: '/public-safety', name: 'Public Safety', priority: 1 },
  { path: '/crime-prevention', name: 'Crime Prevention', priority: 2 },
  { path: '/neighborhood-watch', name: 'Neighborhood Watch', priority: 2 },
  { path: '/disaster-preparedness', name: 'Disaster Preparedness', priority: 2 },
  { path: '/emergency-preparedness', name: 'Emergency Preparedness', priority: 2 },

  // YOUTH & SENIORS
  { path: '/youth', name: 'Youth', priority: 2 },
  { path: '/seniors', name: 'Seniors', priority: 2 },
  { path: '/senior-services', name: 'Senior Services', priority: 1 },
  { path: '/senior-center', name: 'Senior Center', priority: 2 },
  { path: '/youth-programs', name: 'Youth Programs', priority: 2 },

  // DOCUMENTS & FORMS
  { path: '/forms', name: 'Forms', priority: 2 },
  { path: '/documents', name: 'Documents', priority: 2 },
  { path: '/public-records', name: 'Public Records', priority: 2 },
  { path: '/records-request', name: 'Records Request', priority: 2 },

  // FAQ & HELP
  { path: '/faq', name: 'FAQ', priority: 1 },
  { path: '/faqs', name: 'FAQs', priority: 1 },
  { path: '/help', name: 'Help', priority: 2 },
  { path: '/how-do-i', name: 'How Do I', priority: 1 },
];

// Rate limiting
const DELAY_BETWEEN_PAGES = 1500; // 1.5 seconds
const DELAY_BETWEEN_CITIES = 3000; // 3 seconds

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract useful information from a page
 */
async function extractPageInfo(page) {
  return await page.evaluate(() => {
    const info = {
      title: document.title || '',
      description: '',
      phones: [],
      emails: [],
      addresses: [],
      hours: [],
      departments: [],
      services: [],
      links: [],
    };

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      info.description = metaDesc.content;
    }

    // Extract phone numbers
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const pageText = document.body.innerText;
    const phones = [...new Set((pageText.match(phoneRegex) || []))];
    info.phones = phones.slice(0, 10); // Limit to 10

    // Extract emails
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    const emails = new Set();
    emailLinks.forEach(a => {
      const email = a.href.replace('mailto:', '').split('?')[0];
      if (email && email.includes('@')) {
        emails.add(email.toLowerCase());
      }
    });
    info.emails = [...emails].slice(0, 15);

    // Extract addresses (look for common patterns)
    const addressPatterns = [
      /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln|Court|Ct|Place|Pl)\.?[,\s]+[\w\s]+,\s*CA\s*\d{5}/gi,
    ];
    const addresses = new Set();
    addressPatterns.forEach(pattern => {
      const matches = pageText.match(pattern) || [];
      matches.forEach(m => addresses.add(m.trim()));
    });
    info.addresses = [...addresses].slice(0, 5);

    // Extract hours of operation (look for common patterns)
    const hoursPatterns = [
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:-]+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
      /(?:m-f|mon-fri|monday-friday)[\s:]+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
    ];
    const hours = new Set();
    hoursPatterns.forEach(pattern => {
      const matches = pageText.match(pattern) || [];
      matches.forEach(m => hours.add(m.trim()));
    });
    info.hours = [...hours].slice(0, 5);

    // Extract department names from headings and lists
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    const deptKeywords = ['department', 'office', 'division', 'services', 'bureau', 'agency'];
    headings.forEach(h => {
      const text = h.innerText.toLowerCase();
      if (deptKeywords.some(kw => text.includes(kw))) {
        info.departments.push(h.innerText.trim());
      }
    });
    info.departments = [...new Set(info.departments)].slice(0, 20);

    // Extract service names
    const serviceKeywords = ['apply', 'request', 'report', 'pay', 'register', 'schedule', 'submit', 'file'];
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      const text = link.innerText.toLowerCase();
      if (serviceKeywords.some(kw => text.includes(kw)) && text.length < 100) {
        info.services.push({
          name: link.innerText.trim(),
          url: link.href,
        });
      }
    });
    info.services = info.services.slice(0, 20);

    // Extract important links (police, fire, library, parks, etc.)
    const importantKeywords = ['police', 'fire', 'library', 'parks', 'recreation', 'housing', 'permit', 'utility', 'water', 'trash', 'garbage', 'emergency', 'council', 'meeting'];
    links.forEach(link => {
      const text = link.innerText.toLowerCase();
      const href = link.href.toLowerCase();
      if ((importantKeywords.some(kw => text.includes(kw) || href.includes(kw))) && link.href.startsWith('http')) {
        info.links.push({
          name: link.innerText.trim().substring(0, 100),
          url: link.href,
        });
      }
    });
    // Dedupe by URL
    const seenUrls = new Set();
    info.links = info.links.filter(l => {
      if (seenUrls.has(l.url)) return false;
      seenUrls.add(l.url);
      return true;
    }).slice(0, 30);

    return info;
  });
}

/**
 * Try to fetch and parse sitemap.xml to get all URLs
 */
async function fetchSitemap(page, baseUrl) {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await page.goto(sitemapUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      if (response && response.ok()) {
        const content = await page.content();
        // Extract URLs from sitemap XML
        const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
        const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));

        if (urls.length > 0) {
          console.log(`    Found sitemap with ${urls.length} URLs`);
          return urls;
        }
      }
    } catch (e) {
      // Sitemap not found, continue
    }
  }
  return null;
}

/**
 * Discover important pages by crawling links from homepage
 */
async function discoverPagesFromHomepage(page, baseUrl) {
  const discoveredPages = new Map(); // url -> {name, category}

  // Keywords to look for in navigation links
  const importantPatterns = {
    'contact': ['contact', 'reach us', 'get in touch'],
    'departments': ['department', 'agencies', 'offices', 'divisions'],
    'services': ['service', 'resident', 'citizen', 'how do i', 'online services'],
    'calendar': ['calendar', 'events', 'meetings', 'agenda'],
    'news': ['news', 'announcement', 'press', 'alert', 'update'],
    'emergency': ['emergency', 'police', 'fire', 'safety', 'public safety'],
    'housing': ['housing', 'rent', 'affordable'],
    'library': ['library', 'libraries'],
    'parks': ['park', 'recreation', 'rec center'],
    'utilities': ['utility', 'water', 'trash', 'garbage', 'sewer', 'billing'],
    'permits': ['permit', 'license', 'building', 'planning', 'zoning'],
    'jobs': ['job', 'career', 'employment', 'work for'],
    'government': ['government', 'council', 'board', 'commission', 'mayor'],
    'faq': ['faq', 'help', 'question', 'how to'],
    'transit': ['transit', 'schedule', 'route', 'fare', 'station', 'bus', 'train'],
  };

  try {
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    await sleep(1000);

    // Extract all links from the page
    const links = await page.evaluate((base) => {
      const results = [];
      const allLinks = document.querySelectorAll('a[href]');

      allLinks.forEach(link => {
        const href = link.href;
        const text = link.innerText.trim().toLowerCase();

        // Only include internal links
        if (href && href.startsWith(base) && text && text.length < 100) {
          results.push({
            url: href,
            text: text,
            // Check if it's in navigation (nav, header, footer)
            isNav: !!(link.closest('nav') || link.closest('header') || link.closest('[role="navigation"]'))
          });
        }
      });

      return results;
    }, baseUrl);

    // Categorize discovered links
    for (const link of links) {
      for (const [category, patterns] of Object.entries(importantPatterns)) {
        if (patterns.some(p => link.text.includes(p) || link.url.toLowerCase().includes(p))) {
          // Prefer nav links, but accept any
          if (!discoveredPages.has(link.url) || link.isNav) {
            discoveredPages.set(link.url, {
              name: link.text.substring(0, 50),
              category: category,
              isNav: link.isNav
            });
          }
          break;
        }
      }
    }

    console.log(`    Discovered ${discoveredPages.size} important pages from homepage`);

  } catch (e) {
    console.log(`    Error discovering pages: ${e.message.substring(0, 50)}`);
  }

  return discoveredPages;
}

/**
 * Filter sitemap URLs to only important pages
 */
function filterSitemapUrls(urls, baseUrl, entityType) {
  const importantKeywords = entityType === 'Regional Agency'
    ? ['contact', 'schedule', 'fare', 'route', 'station', 'map', 'alert', 'news', 'accessibility', 'ticket', 'clipper', 'parking', 'bike', 'plan', 'project', 'meeting', 'about', 'service']
    : ['contact', 'department', 'service', 'calendar', 'event', 'news', 'emergency', 'police', 'fire', 'library', 'park', 'recreation', 'housing', 'utility', 'water', 'trash', 'permit', 'job', 'career', 'council', 'faq', 'meeting', 'agenda', 'about'];

  const filtered = urls.filter(url => {
    const path = url.replace(baseUrl, '').toLowerCase();
    // Include homepage
    if (path === '/' || path === '') return true;
    // Include pages matching important keywords
    return importantKeywords.some(kw => path.includes(kw));
  });

  // Limit to avoid scraping too many pages
  return filtered.slice(0, 50);
}

/**
 * Scrape a single city website
 * Priority: 1) sitemap.xml  2) crawl homepage links  3) guess paths
 */
async function scrapeCity(page, entity) {
  const result = {
    name: entity.name,
    county: entity.county,
    type: entity.type,
    url: entity.url,
    scrapedAt: new Date().toISOString(),
    discoveryMethod: null,
    pages: {},
    allPhones: [],
    allEmails: [],
    allAddresses: [],
    departments: [],
    services: [],
    importantLinks: [],
    error: null,
  };

  console.log(`\n[${entity.name}] Scraping ${entity.url}...`);

  let pagesToScrape = []; // Array of {url, name}

  // PRIORITY 1: Try sitemap.xml first
  console.log('  Method 1: Checking sitemap.xml...');
  const sitemapUrls = await fetchSitemap(page, entity.url);

  if (sitemapUrls && sitemapUrls.length > 5) {
    result.discoveryMethod = 'sitemap';
    const filtered = filterSitemapUrls(sitemapUrls, entity.url, entity.type);
    pagesToScrape = filtered.map(url => ({
      url: url,
      name: url.replace(entity.url, '').replace(/^\//, '') || 'Homepage'
    }));
    console.log(`    Using ${pagesToScrape.length} pages from sitemap`);
  }

  // PRIORITY 2: Crawl links from homepage
  if (pagesToScrape.length < 5) {
    console.log('  Method 2: Discovering pages from homepage...');
    const discoveredPages = await discoverPagesFromHomepage(page, entity.url);

    if (discoveredPages.size > 0) {
      result.discoveryMethod = result.discoveryMethod ? 'sitemap+crawl' : 'crawl';
      for (const [url, info] of discoveredPages) {
        // Don't add if already from sitemap
        if (!pagesToScrape.some(p => p.url === url)) {
          pagesToScrape.push({ url, name: info.name, category: info.category });
        }
      }
      console.log(`    Now have ${pagesToScrape.length} pages to scrape`);
    }
  }

  // PRIORITY 3: Fall back to guessing paths
  if (pagesToScrape.length < 5) {
    console.log('  Method 3: Falling back to predefined paths...');
    result.discoveryMethod = result.discoveryMethod ? result.discoveryMethod + '+fallback' : 'fallback';

    const fallbackPages = entity.type === 'Regional Agency' ? REGIONAL_PAGES_TO_SCRAPE : PAGES_TO_SCRAPE;
    const fallbackSorted = [...fallbackPages].sort((a, b) => a.priority - b.priority).slice(0, 20);

    for (const pageConfig of fallbackSorted) {
      const fullUrl = `${entity.url}${pageConfig.path}`;
      if (!pagesToScrape.some(p => p.url === fullUrl)) {
        pagesToScrape.push({ url: fullUrl, name: pageConfig.name });
      }
    }
  }

  // Always ensure homepage is included
  if (!pagesToScrape.some(p => p.url === entity.url || p.url === entity.url + '/')) {
    pagesToScrape.unshift({ url: entity.url, name: 'Homepage' });
  }

  console.log(`  Scraping ${pagesToScrape.length} pages (method: ${result.discoveryMethod})...`);

  // Scrape each discovered page
  for (const pageConfig of pagesToScrape) {
    try {
      await page.goto(pageConfig.url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      // Check if page loaded successfully (not 404)
      const title = await page.title();
      if (title && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('not found')) {
        await sleep(800);

        const pageInfo = await extractPageInfo(page);
        const pageName = pageConfig.name || pageConfig.url.replace(entity.url, '');
        result.pages[pageName] = pageInfo;

        // Aggregate data
        result.allPhones.push(...pageInfo.phones);
        result.allEmails.push(...pageInfo.emails);
        result.allAddresses.push(...pageInfo.addresses);
        result.departments.push(...pageInfo.departments);
        result.services.push(...pageInfo.services);
        result.importantLinks.push(...pageInfo.links);
      }
    } catch (e) {
      // Page doesn't exist or failed to load, that's okay
    }

    await sleep(DELAY_BETWEEN_PAGES);
  }

  // Deduplicate aggregated data
  result.allPhones = [...new Set(result.allPhones)];
  result.allEmails = [...new Set(result.allEmails)];
  result.allAddresses = [...new Set(result.allAddresses)];
  result.departments = [...new Set(result.departments)];

  // Dedupe services and links by URL
  const seenServiceUrls = new Set();
  result.services = result.services.filter(s => {
    if (seenServiceUrls.has(s.url)) return false;
    seenServiceUrls.add(s.url);
    return true;
  });

  const seenLinkUrls = new Set();
  result.importantLinks = result.importantLinks.filter(l => {
    if (seenLinkUrls.has(l.url)) return false;
    seenLinkUrls.add(l.url);
    return true;
  });

  console.log(`  Summary: ${result.allPhones.length} phones, ${result.allEmails.length} emails, ${result.departments.length} depts, ${result.services.length} services`);
  console.log(`  Pages scraped: ${Object.keys(result.pages).length}`);

  return result;
}

/**
 * Main function
 */
async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const quickMode = args.includes('--quick');
  const countyArg = args.find(a => a.startsWith('--county='));
  const filterCounty = countyArg ? countyArg.split('=')[1] : null;

  console.log('Bay Area City & County Website Scraper');
  console.log('======================================');

  // Filter entities based on arguments
  let entities = BAY_AREA_ENTITIES;

  if (filterCounty) {
    entities = entities.filter(e => e.county.toLowerCase() === filterCounty.toLowerCase());
    console.log(`Filtering to ${filterCounty} county (${entities.length} entities)`);
  }

  if (quickMode) {
    entities = entities.slice(0, 5);
    console.log('Quick mode: scraping first 5 entities only');
  }

  console.log(`Scraping ${entities.length} entities...`);

  // Check if Playwright is available
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('\nPlaywright is not installed. Install it with:');
    console.error('  npm install playwright');
    console.error('  npx playwright install chromium');
    process.exit(1);
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Launch browser
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  });

  const results = [];
  const byCounty = {};

  for (const entity of entities) {
    try {
      const result = await scrapeCity(page, entity);
      results.push(result);

      // Organize by county
      if (!byCounty[entity.county]) {
        byCounty[entity.county] = [];
      }
      byCounty[entity.county].push(result);

    } catch (e) {
      console.log(`  Error: ${e.message}`);
      results.push({
        name: entity.name,
        county: entity.county,
        type: entity.type,
        url: entity.url,
        error: e.message,
        scrapedAt: new Date().toISOString(),
      });
    }

    await sleep(DELAY_BETWEEN_CITIES);
  }

  await browser.close();

  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  fs.writeFileSync(OUTPUT_BY_COUNTY, JSON.stringify(byCounty, null, 2));

  // Summary
  console.log('\n======================================');
  console.log(`Saved results to ${OUTPUT_DIR}`);
  console.log(`Total entities scraped: ${results.length}`);

  let totalPhones = 0;
  let totalEmails = 0;
  let totalDepts = 0;
  let totalServices = 0;

  for (const r of results) {
    if (r.allPhones) totalPhones += r.allPhones.length;
    if (r.allEmails) totalEmails += r.allEmails.length;
    if (r.departments) totalDepts += r.departments.length;
    if (r.services) totalServices += r.services.length;
  }

  console.log(`Total phones: ${totalPhones}`);
  console.log(`Total emails: ${totalEmails}`);
  console.log(`Total departments: ${totalDepts}`);
  console.log(`Total services: ${totalServices}`);

  console.log('\nBy County:');
  for (const [county, data] of Object.entries(byCounty)) {
    console.log(`  ${county}: ${data.length} entities`);
  }
}

main().catch(console.error);
