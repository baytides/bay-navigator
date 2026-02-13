/**
 * Bay Area Cities — coordinates for all incorporated cities and towns
 * across the 9-county San Francisco Bay Area.
 *
 * Source: src/data/cities.yml (type: City or Town only, CDPs excluded)
 * Used by: sync-air-quality.cjs, sync-weather-forecast.cjs
 */

'use strict';

const BAY_AREA_CITIES = [
  // ── Alameda County (14 cities) ──
  { name: 'Alameda', county: 'Alameda', lat: 37.7652, lon: -122.2416 },
  { name: 'Albany', county: 'Alameda', lat: 37.8869, lon: -122.2978 },
  { name: 'Berkeley', county: 'Alameda', lat: 37.8716, lon: -122.2727 },
  { name: 'Dublin', county: 'Alameda', lat: 37.7022, lon: -121.9358 },
  { name: 'Emeryville', county: 'Alameda', lat: 37.8313, lon: -122.2852 },
  { name: 'Fremont', county: 'Alameda', lat: 37.5485, lon: -121.9886 },
  { name: 'Hayward', county: 'Alameda', lat: 37.6688, lon: -122.0808 },
  { name: 'Livermore', county: 'Alameda', lat: 37.6819, lon: -121.768 },
  { name: 'Newark', county: 'Alameda', lat: 37.5296, lon: -122.0402 },
  { name: 'Oakland', county: 'Alameda', lat: 37.8044, lon: -122.2712 },
  { name: 'Piedmont', county: 'Alameda', lat: 37.8244, lon: -122.2317 },
  { name: 'Pleasanton', county: 'Alameda', lat: 37.6604, lon: -121.8758 },
  { name: 'San Leandro', county: 'Alameda', lat: 37.7249, lon: -122.1561 },
  { name: 'Union City', county: 'Alameda', lat: 37.5934, lon: -122.0439 },

  // ── Contra Costa County (19 cities + 2 towns) ──
  { name: 'Antioch', county: 'Contra Costa', lat: 38.0049, lon: -121.8058 },
  { name: 'Brentwood', county: 'Contra Costa', lat: 37.9317, lon: -121.6958 },
  { name: 'Clayton', county: 'Contra Costa', lat: 37.941, lon: -121.9355 },
  { name: 'Concord', county: 'Contra Costa', lat: 37.978, lon: -122.0311 },
  { name: 'Danville', county: 'Contra Costa', lat: 37.8216, lon: -121.9999 },
  { name: 'El Cerrito', county: 'Contra Costa', lat: 37.9161, lon: -122.3103 },
  { name: 'Hercules', county: 'Contra Costa', lat: 38.0171, lon: -122.2886 },
  { name: 'Lafayette', county: 'Contra Costa', lat: 37.8858, lon: -122.118 },
  { name: 'Martinez', county: 'Contra Costa', lat: 38.0194, lon: -122.1341 },
  { name: 'Moraga', county: 'Contra Costa', lat: 37.8349, lon: -122.1297 },
  { name: 'Oakley', county: 'Contra Costa', lat: 37.9974, lon: -121.7125 },
  { name: 'Orinda', county: 'Contra Costa', lat: 37.8771, lon: -122.1797 },
  { name: 'Pinole', county: 'Contra Costa', lat: 38.0044, lon: -122.2989 },
  { name: 'Pittsburg', county: 'Contra Costa', lat: 38.028, lon: -121.8847 },
  { name: 'Pleasant Hill', county: 'Contra Costa', lat: 37.948, lon: -122.0608 },
  { name: 'Richmond', county: 'Contra Costa', lat: 37.9358, lon: -122.3478 },
  { name: 'San Pablo', county: 'Contra Costa', lat: 37.9621, lon: -122.3458 },
  { name: 'San Ramon', county: 'Contra Costa', lat: 37.7799, lon: -121.978 },
  { name: 'Walnut Creek', county: 'Contra Costa', lat: 37.9101, lon: -122.0652 },

  // ── Marin County (7 cities + 5 towns) ──
  { name: 'Belvedere', county: 'Marin', lat: 37.8727, lon: -122.4643 },
  { name: 'Corte Madera', county: 'Marin', lat: 37.9257, lon: -122.5275 },
  { name: 'Fairfax', county: 'Marin', lat: 37.9871, lon: -122.5889 },
  { name: 'Larkspur', county: 'Marin', lat: 37.9341, lon: -122.5353 },
  { name: 'Mill Valley', county: 'Marin', lat: 37.906, lon: -122.5419 },
  { name: 'Novato', county: 'Marin', lat: 38.1074, lon: -122.5697 },
  { name: 'Ross', county: 'Marin', lat: 37.9624, lon: -122.555 },
  { name: 'San Anselmo', county: 'Marin', lat: 37.9746, lon: -122.5614 },
  { name: 'San Rafael', county: 'Marin', lat: 37.9735, lon: -122.5311 },
  { name: 'Sausalito', county: 'Marin', lat: 37.8591, lon: -122.4853 },
  { name: 'Tiburon', county: 'Marin', lat: 37.8734, lon: -122.4567 },

  // ── Napa County (4 cities + 1 town) ──
  { name: 'American Canyon', county: 'Napa', lat: 38.1749, lon: -122.2608 },
  { name: 'Calistoga', county: 'Napa', lat: 38.5788, lon: -122.5797 },
  { name: 'Napa', county: 'Napa', lat: 38.2975, lon: -122.2869 },
  { name: 'St. Helena', county: 'Napa', lat: 38.5052, lon: -122.4703 },
  { name: 'Yountville', county: 'Napa', lat: 38.4013, lon: -122.3608 },

  // ── San Francisco (1 city-county) ──
  { name: 'San Francisco', county: 'San Francisco', lat: 37.7749, lon: -122.4194 },

  // ── San Mateo County (14 cities + 6 towns) ──
  { name: 'Atherton', county: 'San Mateo', lat: 37.4613, lon: -122.1978 },
  { name: 'Belmont', county: 'San Mateo', lat: 37.5202, lon: -122.2758 },
  { name: 'Brisbane', county: 'San Mateo', lat: 37.6808, lon: -122.3999 },
  { name: 'Burlingame', county: 'San Mateo', lat: 37.5841, lon: -122.3661 },
  { name: 'Colma', county: 'San Mateo', lat: 37.6769, lon: -122.4517 },
  { name: 'Daly City', county: 'San Mateo', lat: 37.6879, lon: -122.4702 },
  { name: 'East Palo Alto', county: 'San Mateo', lat: 37.4688, lon: -122.1411 },
  { name: 'Foster City', county: 'San Mateo', lat: 37.5585, lon: -122.2711 },
  { name: 'Half Moon Bay', county: 'San Mateo', lat: 37.4636, lon: -122.4286 },
  { name: 'Hillsborough', county: 'San Mateo', lat: 37.5741, lon: -122.3794 },
  { name: 'Menlo Park', county: 'San Mateo', lat: 37.453, lon: -122.1817 },
  { name: 'Millbrae', county: 'San Mateo', lat: 37.5985, lon: -122.3872 },
  { name: 'Pacifica', county: 'San Mateo', lat: 37.6138, lon: -122.4869 },
  { name: 'Portola Valley', county: 'San Mateo', lat: 37.3842, lon: -122.2353 },
  { name: 'Redwood City', county: 'San Mateo', lat: 37.4852, lon: -122.2364 },
  { name: 'San Bruno', county: 'San Mateo', lat: 37.6305, lon: -122.4111 },
  { name: 'San Carlos', county: 'San Mateo', lat: 37.5072, lon: -122.2608 },
  { name: 'San Mateo', county: 'San Mateo', lat: 37.563, lon: -122.3255 },
  { name: 'South San Francisco', county: 'San Mateo', lat: 37.6547, lon: -122.4077 },
  { name: 'Woodside', county: 'San Mateo', lat: 37.4299, lon: -122.2539 },

  // ── Santa Clara County (13 cities + 2 towns) ──
  { name: 'Campbell', county: 'Santa Clara', lat: 37.2872, lon: -121.95 },
  { name: 'Cupertino', county: 'Santa Clara', lat: 37.3229, lon: -122.0322 },
  { name: 'Gilroy', county: 'Santa Clara', lat: 37.0058, lon: -121.5683 },
  { name: 'Los Altos', county: 'Santa Clara', lat: 37.3852, lon: -122.1141 },
  { name: 'Los Altos Hills', county: 'Santa Clara', lat: 37.3795, lon: -122.1375 },
  { name: 'Los Gatos', county: 'Santa Clara', lat: 37.2358, lon: -121.9624 },
  { name: 'Milpitas', county: 'Santa Clara', lat: 37.4323, lon: -121.8996 },
  { name: 'Monte Sereno', county: 'Santa Clara', lat: 37.2363, lon: -121.9928 },
  { name: 'Morgan Hill', county: 'Santa Clara', lat: 37.1305, lon: -121.6544 },
  { name: 'Mountain View', county: 'Santa Clara', lat: 37.3861, lon: -122.0839 },
  { name: 'Palo Alto', county: 'Santa Clara', lat: 37.4419, lon: -122.143 },
  { name: 'San Jose', county: 'Santa Clara', lat: 37.3382, lon: -121.8863 },
  { name: 'Santa Clara', county: 'Santa Clara', lat: 37.3541, lon: -121.9552 },
  { name: 'Saratoga', county: 'Santa Clara', lat: 37.2639, lon: -122.0231 },
  { name: 'Sunnyvale', county: 'Santa Clara', lat: 37.3688, lon: -122.0363 },

  // ── Solano County (7 cities) ──
  { name: 'Benicia', county: 'Solano', lat: 38.0494, lon: -122.1586 },
  { name: 'Dixon', county: 'Solano', lat: 38.4455, lon: -121.8233 },
  { name: 'Fairfield', county: 'Solano', lat: 38.2494, lon: -122.04 },
  { name: 'Rio Vista', county: 'Solano', lat: 38.1693, lon: -121.6925 },
  { name: 'Suisun City', county: 'Solano', lat: 38.2388, lon: -122.0172 },
  { name: 'Vacaville', county: 'Solano', lat: 38.3566, lon: -121.9877 },
  { name: 'Vallejo', county: 'Solano', lat: 38.1041, lon: -122.2566 },

  // ── Sonoma County (8 cities + 1 town) ──
  { name: 'Cloverdale', county: 'Sonoma', lat: 38.806, lon: -123.017 },
  { name: 'Cotati', county: 'Sonoma', lat: 38.3288, lon: -122.7072 },
  { name: 'Healdsburg', county: 'Sonoma', lat: 38.6099, lon: -122.8697 },
  { name: 'Petaluma', county: 'Sonoma', lat: 38.2324, lon: -122.6367 },
  { name: 'Rohnert Park', county: 'Sonoma', lat: 38.3396, lon: -122.7011 },
  { name: 'Santa Rosa', county: 'Sonoma', lat: 38.4404, lon: -122.7141 },
  { name: 'Sebastopol', county: 'Sonoma', lat: 38.4021, lon: -122.8239 },
  { name: 'Sonoma', county: 'Sonoma', lat: 38.2919, lon: -122.458 },
  { name: 'Windsor', county: 'Sonoma', lat: 38.5469, lon: -122.8167 },
];

module.exports = { BAY_AREA_CITIES };
