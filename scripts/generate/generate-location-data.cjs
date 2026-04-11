#!/usr/bin/env node
/**
 * Generate a location data JSON file for Carl to use
 *
 * Creates /public/api/location-data.json with ZIP code to city mapping
 * and city to county mapping for location-based responses
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ZIPCODES_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'zipcodes.yml');
const CITIES_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'cities.yml');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'public', 'api', 'location-data.json');

// ZIP code coordinates (approximate center points)
// Data sourced from USGS and Census Bureau
const zipCoordinates = {
  // Alameda County
  94501: { lat: 37.7712, lng: -122.2824 }, // Alameda
  94502: { lat: 37.739, lng: -122.2458 }, // Alameda
  94536: { lat: 37.5741, lng: -122.0017 }, // Fremont
  94537: { lat: 37.5485, lng: -121.9886 }, // Fremont
  94538: { lat: 37.5046, lng: -121.9625 }, // Fremont
  94539: { lat: 37.5192, lng: -121.9296 }, // Fremont
  94540: { lat: 37.6688, lng: -122.0808 }, // Hayward
  94541: { lat: 37.6688, lng: -122.0808 }, // Hayward
  94542: { lat: 37.6579, lng: -122.0467 }, // Hayward
  94543: { lat: 37.6688, lng: -122.0808 }, // Hayward
  94544: { lat: 37.633, lng: -122.0575 }, // Hayward
  94545: { lat: 37.6189, lng: -122.1053 }, // Hayward
  94546: { lat: 37.7088, lng: -122.0863 }, // Castro Valley
  94550: { lat: 37.6819, lng: -121.768 }, // Livermore
  94551: { lat: 37.7193, lng: -121.7236 }, // Livermore
  94552: { lat: 37.718, lng: -122.0366 }, // Castro Valley
  94555: { lat: 37.5519, lng: -122.0597 }, // Fremont
  94557: { lat: 37.6688, lng: -122.0808 }, // Hayward
  94560: { lat: 37.5297, lng: -122.0402 }, // Newark
  94566: { lat: 37.6624, lng: -121.8747 }, // Pleasanton
  94568: { lat: 37.7022, lng: -121.9358 }, // Dublin
  94577: { lat: 37.7249, lng: -122.1561 }, // San Leandro
  94578: { lat: 37.7056, lng: -122.1244 }, // San Leandro
  94579: { lat: 37.6951, lng: -122.1464 }, // San Leandro
  94580: { lat: 37.6808, lng: -122.1431 }, // San Lorenzo
  94586: { lat: 37.5972, lng: -121.8847 }, // Sunol
  94587: { lat: 37.5934, lng: -122.0439 }, // Union City
  94588: { lat: 37.6897, lng: -121.9 }, // Pleasanton
  94601: { lat: 37.7781, lng: -122.2194 }, // Oakland
  94602: { lat: 37.8016, lng: -122.2108 }, // Oakland
  94603: { lat: 37.7385, lng: -122.1867 }, // Oakland
  94605: { lat: 37.7619, lng: -122.1608 }, // Oakland
  94606: { lat: 37.7897, lng: -122.2436 }, // Oakland
  94607: { lat: 37.8081, lng: -122.2908 }, // Oakland
  94608: { lat: 37.8313, lng: -122.2852 }, // Emeryville
  94609: { lat: 37.833, lng: -122.2633 }, // Oakland
  94610: { lat: 37.8119, lng: -122.2381 }, // Oakland
  94611: { lat: 37.833, lng: -122.2208 }, // Oakland
  94612: { lat: 37.8044, lng: -122.2712 }, // Oakland
  94613: { lat: 37.7819, lng: -122.1869 }, // Oakland
  94618: { lat: 37.8455, lng: -122.2394 }, // Oakland
  94619: { lat: 37.7919, lng: -122.1811 }, // Oakland
  94620: { lat: 37.8244, lng: -122.2317 }, // Piedmont
  94621: { lat: 37.7519, lng: -122.2133 }, // Oakland
  94702: { lat: 37.8652, lng: -122.2839 }, // Berkeley
  94703: { lat: 37.8641, lng: -122.2767 }, // Berkeley
  94704: { lat: 37.8688, lng: -122.2567 }, // Berkeley
  94705: { lat: 37.8594, lng: -122.2439 }, // Berkeley
  94706: { lat: 37.8894, lng: -122.2975 }, // Albany
  94707: { lat: 37.8927, lng: -122.2758 }, // Berkeley
  94708: { lat: 37.8994, lng: -122.2647 }, // Berkeley
  94709: { lat: 37.8794, lng: -122.2658 }, // Berkeley
  94710: { lat: 37.8641, lng: -122.3008 }, // Berkeley

  // Contra Costa County
  94505: { lat: 37.9086, lng: -121.6008 }, // Discovery Bay
  94506: { lat: 37.8216, lng: -121.9999 }, // Danville
  94507: { lat: 37.8508, lng: -122.0322 }, // Alamo
  94509: { lat: 38.0049, lng: -121.8058 }, // Antioch
  94511: { lat: 38.0189, lng: -121.6408 }, // Bethel Island
  94513: { lat: 37.9317, lng: -121.6958 }, // Brentwood
  94514: { lat: 37.8672, lng: -121.6339 }, // Byron
  94516: { lat: 37.8333, lng: -122.15 }, // Canyon
  94517: { lat: 37.9408, lng: -121.9358 }, // Clayton
  94518: { lat: 37.9544, lng: -122.0169 }, // Concord
  94519: { lat: 37.9875, lng: -122.0125 }, // Concord
  94520: { lat: 37.978, lng: -122.0311 }, // Concord
  94521: { lat: 37.9608, lng: -121.9708 }, // Concord
  94522: { lat: 37.978, lng: -122.0311 }, // Concord
  94523: { lat: 37.9486, lng: -122.0608 }, // Pleasant Hill
  94524: { lat: 37.978, lng: -122.0311 }, // Concord
  94525: { lat: 38.0533, lng: -122.2239 }, // Crockett
  94526: { lat: 37.8216, lng: -121.9999 }, // Danville
  94527: { lat: 37.9608, lng: -121.9708 }, // Concord
  94528: { lat: 37.835, lng: -121.9583 }, // Diablo
  94529: { lat: 37.978, lng: -122.0311 }, // Concord
  94530: { lat: 37.9158, lng: -122.3103 }, // El Cerrito
  94531: { lat: 37.978, lng: -121.7708 }, // Antioch
  94547: { lat: 38.0172, lng: -122.2886 }, // Hercules
  94548: { lat: 37.9667, lng: -121.6667 }, // Knightsen
  94549: { lat: 37.8933, lng: -122.1186 }, // Lafayette
  94553: { lat: 38.0194, lng: -122.1341 }, // Martinez
  94556: { lat: 37.8347, lng: -122.1272 }, // Moraga
  94561: { lat: 37.9975, lng: -121.7131 }, // Oakley
  94563: { lat: 37.8772, lng: -122.1797 }, // Orinda
  94564: { lat: 37.9933, lng: -122.3647 }, // Pinole
  94565: { lat: 38.028, lng: -121.8847 }, // Pittsburg
  94567: { lat: 37.9419, lng: -121.8281 }, // Clayton
  94569: { lat: 38.0194, lng: -122.1341 }, // Martinez
  94570: { lat: 37.8108, lng: -121.9536 }, // Moraga
  94572: { lat: 38.0583, lng: -122.3967 }, // Rodeo
  94575: { lat: 37.8347, lng: -122.1272 }, // Moraga
  94582: { lat: 37.7799, lng: -121.978 }, // San Ramon
  94583: { lat: 37.7799, lng: -121.978 }, // San Ramon
  94595: { lat: 37.9101, lng: -122.0652 }, // Walnut Creek
  94596: { lat: 37.9006, lng: -122.0519 }, // Walnut Creek
  94597: { lat: 37.9101, lng: -122.0652 }, // Walnut Creek
  94598: { lat: 37.9101, lng: -122.0652 }, // Walnut Creek
  94801: { lat: 37.9358, lng: -122.3477 }, // Richmond
  94802: { lat: 37.9358, lng: -122.3477 }, // Richmond
  94803: { lat: 37.9619, lng: -122.3444 }, // El Sobrante
  94804: { lat: 37.9258, lng: -122.3658 }, // Richmond
  94805: { lat: 37.9297, lng: -122.3333 }, // Richmond
  94806: { lat: 37.9494, lng: -122.3519 }, // San Pablo
  94807: { lat: 37.9358, lng: -122.3477 }, // Richmond
  94808: { lat: 37.9358, lng: -122.3477 }, // Richmond
  94820: { lat: 37.9358, lng: -122.3477 }, // Richmond
  94850: { lat: 37.9358, lng: -122.3477 }, // Richmond

  // Marin County
  94901: { lat: 37.9735, lng: -122.5311 }, // San Rafael
  94903: { lat: 38.0158, lng: -122.5458 }, // San Rafael
  94904: { lat: 37.9558, lng: -122.5122 }, // Greenbrae
  94912: { lat: 37.9735, lng: -122.5311 }, // San Rafael
  94913: { lat: 37.9735, lng: -122.5311 }, // San Rafael
  94914: { lat: 37.9408, lng: -122.5611 }, // Kentfield
  94915: { lat: 37.9735, lng: -122.5311 }, // San Rafael
  94920: { lat: 37.883, lng: -122.4869 }, // Belvedere Tiburon
  94922: { lat: 38.2667, lng: -122.9333 }, // Bodega
  94923: { lat: 38.3333, lng: -123.0333 }, // Bodega Bay
  94924: { lat: 37.9186, lng: -122.6803 }, // Bolinas
  94925: { lat: 37.9236, lng: -122.5089 }, // Corte Madera
  94929: { lat: 38.0172, lng: -122.7681 }, // Dillon Beach
  94930: { lat: 38.0, lng: -122.5708 }, // Fairfax
  94931: { lat: 38.25, lng: -122.7167 }, // Cotati
  94933: { lat: 38.0333, lng: -122.7333 }, // Forest Knolls
  94937: { lat: 38.0467, lng: -122.8022 }, // Inverness
  94938: { lat: 38.0333, lng: -122.7333 }, // Lagunitas
  94939: { lat: 37.9341, lng: -122.535 }, // Larkspur
  94940: { lat: 37.9867, lng: -122.6544 }, // Marshall
  94941: { lat: 37.906, lng: -122.5449 }, // Mill Valley
  94942: { lat: 37.906, lng: -122.5449 }, // Mill Valley
  94945: { lat: 38.093, lng: -122.5542 }, // Novato
  94946: { lat: 38.0333, lng: -122.6833 }, // Nicasio
  94947: { lat: 38.1074, lng: -122.5697 }, // Novato
  94948: { lat: 38.1074, lng: -122.5697 }, // Novato
  94949: { lat: 38.0697, lng: -122.5308 }, // Novato
  94950: { lat: 38.0539, lng: -122.7875 }, // Olema
  94951: { lat: 38.2324, lng: -122.6367 }, // Penngrove
  94952: { lat: 38.2324, lng: -122.6367 }, // Petaluma
  94953: { lat: 38.2324, lng: -122.6367 }, // Petaluma
  94954: { lat: 38.2522, lng: -122.6078 }, // Petaluma
  94955: { lat: 38.2324, lng: -122.6367 }, // Petaluma
  94956: { lat: 37.9997, lng: -122.7839 }, // Point Reyes Station
  94957: { lat: 37.9533, lng: -122.5389 }, // Ross
  94960: { lat: 37.9894, lng: -122.5825 }, // San Anselmo
  94963: { lat: 38.0167, lng: -122.7 }, // San Geronimo
  94964: { lat: 37.9333, lng: -122.4833 }, // San Quentin
  94965: { lat: 37.8591, lng: -122.4852 }, // Sausalito
  94966: { lat: 37.8591, lng: -122.4852 }, // Sausalito
  94970: { lat: 37.8833, lng: -122.5833 }, // Stinson Beach
  94971: { lat: 38.1167, lng: -122.9 }, // Tomales
  94972: { lat: 38.2167, lng: -122.8833 }, // Valley Ford
  94973: { lat: 38.0044, lng: -122.6486 }, // Woodacre

  // Napa County
  94503: { lat: 38.1749, lng: -122.2608 }, // American Canyon
  94508: { lat: 38.5472, lng: -122.4583 }, // Angwin
  94515: { lat: 38.5788, lng: -122.5797 }, // Calistoga
  94558: { lat: 38.2975, lng: -122.2869 }, // Napa
  94559: { lat: 38.2975, lng: -122.2869 }, // Napa
  94562: { lat: 38.3833, lng: -122.3 }, // Oakville
  94567: { lat: 38.4833, lng: -122.35 }, // Pope Valley
  94573: { lat: 38.4167, lng: -122.3667 }, // Rutherford
  94574: { lat: 38.5052, lng: -122.4702 }, // St. Helena
  94576: { lat: 38.2975, lng: -122.2869 }, // Deer Park
  94581: { lat: 38.3333, lng: -122.4167 }, // Yountville
  94599: { lat: 38.3333, lng: -122.4167 }, // Yountville

  // San Francisco
  94102: { lat: 37.7813, lng: -122.4167 }, // Downtown/Civic Center
  94103: { lat: 37.7725, lng: -122.4108 }, // South of Market
  94104: { lat: 37.7914, lng: -122.4019 }, // Financial District
  94105: { lat: 37.7894, lng: -122.3936 }, // Rincon Hill
  94107: { lat: 37.7658, lng: -122.3967 }, // South Beach
  94108: { lat: 37.7919, lng: -122.4075 }, // Chinatown
  94109: { lat: 37.7925, lng: -122.4214 }, // Nob Hill
  94110: { lat: 37.7486, lng: -122.4158 }, // Mission
  94111: { lat: 37.7997, lng: -122.3997 }, // Embarcadero
  94112: { lat: 37.7208, lng: -122.4422 }, // Ingleside
  94114: { lat: 37.7589, lng: -122.435 }, // Castro
  94115: { lat: 37.7858, lng: -122.4369 }, // Pacific Heights
  94116: { lat: 37.7439, lng: -122.4858 }, // Sunset
  94117: { lat: 37.7708, lng: -122.4483 }, // Haight-Ashbury
  94118: { lat: 37.7822, lng: -122.4622 }, // Inner Richmond
  94119: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94120: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94121: { lat: 37.7786, lng: -122.4892 }, // Outer Richmond
  94122: { lat: 37.7589, lng: -122.4839 }, // Sunset
  94123: { lat: 37.8003, lng: -122.4369 }, // Marina
  94124: { lat: 37.7319, lng: -122.3878 }, // Bayview
  94125: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94126: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94127: { lat: 37.7358, lng: -122.4567 }, // St. Francis Wood
  94128: { lat: 37.6213, lng: -122.379 }, // SFO
  94129: { lat: 37.8003, lng: -122.4633 }, // Presidio
  94130: { lat: 37.8225, lng: -122.37 }, // Treasure Island
  94131: { lat: 37.7436, lng: -122.4378 }, // Twin Peaks
  94132: { lat: 37.7239, lng: -122.4783 }, // Lake Merced
  94133: { lat: 37.8003, lng: -122.4097 }, // North Beach
  94134: { lat: 37.7194, lng: -122.4117 }, // Visitacion Valley
  94139: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94140: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94141: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94142: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94143: { lat: 37.7631, lng: -122.4586 }, // UCSF
  94144: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94145: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94146: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94147: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94151: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94158: { lat: 37.7706, lng: -122.3872 }, // Mission Bay
  94159: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94160: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94161: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94163: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94164: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94172: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94177: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  94188: { lat: 37.7749, lng: -122.4194 }, // San Francisco

  // San Mateo County
  94002: { lat: 37.5202, lng: -122.2758 }, // Belmont
  94005: { lat: 37.6808, lng: -122.3999 }, // Brisbane
  94010: { lat: 37.5841, lng: -122.3661 }, // Burlingame
  94011: { lat: 37.5841, lng: -122.3661 }, // Burlingame
  94014: { lat: 37.6879, lng: -122.4702 }, // Daly City
  94015: { lat: 37.6879, lng: -122.4702 }, // Daly City
  94016: { lat: 37.6879, lng: -122.4702 }, // Daly City
  94017: { lat: 37.6879, lng: -122.4702 }, // Daly City
  94018: { lat: 37.5167, lng: -122.4667 }, // El Granada
  94019: { lat: 37.4636, lng: -122.4286 }, // Half Moon Bay
  94020: { lat: 37.2667, lng: -122.2167 }, // La Honda
  94021: { lat: 37.3167, lng: -122.35 }, // Loma Mar
  94025: { lat: 37.453, lng: -122.1817 }, // Menlo Park
  94026: { lat: 37.453, lng: -122.1817 }, // Menlo Park
  94027: { lat: 37.4613, lng: -122.1979 }, // Atherton
  94028: { lat: 37.3841, lng: -122.2352 }, // Portola Valley
  94030: { lat: 37.5985, lng: -122.3872 }, // Millbrae
  94037: { lat: 37.5333, lng: -122.5 }, // Montara
  94038: { lat: 37.5333, lng: -122.5167 }, // Moss Beach
  94044: { lat: 37.6138, lng: -122.4869 }, // Pacifica
  94060: { lat: 37.2667, lng: -122.3667 }, // Pescadero
  94061: { lat: 37.4852, lng: -122.2364 }, // Redwood City
  94062: { lat: 37.4655, lng: -122.255 }, // Redwood City
  94063: { lat: 37.4852, lng: -122.2023 }, // Redwood City
  94064: { lat: 37.4852, lng: -122.2364 }, // Redwood City
  94065: { lat: 37.533, lng: -122.2483 }, // Redwood Shores
  94066: { lat: 37.6305, lng: -122.4111 }, // San Bruno
  94070: { lat: 37.5072, lng: -122.2608 }, // San Carlos
  94074: { lat: 37.3167, lng: -122.3667 }, // San Gregorio
  94080: { lat: 37.6547, lng: -122.4077 }, // South San Francisco
  94083: { lat: 37.6547, lng: -122.4077 }, // South San Francisco
  94128: { lat: 37.6213, lng: -122.379 }, // SFO
  94401: { lat: 37.563, lng: -122.3255 }, // San Mateo
  94402: { lat: 37.5439, lng: -122.332 }, // San Mateo
  94403: { lat: 37.5386, lng: -122.3092 }, // San Mateo
  94404: { lat: 37.5585, lng: -122.2711 }, // Foster City
  94497: { lat: 37.563, lng: -122.3255 }, // San Mateo

  // Santa Clara County
  94022: { lat: 37.3852, lng: -122.1141 }, // Los Altos
  94023: { lat: 37.3852, lng: -122.1141 }, // Los Altos
  94024: { lat: 37.3586, lng: -122.0883 }, // Los Altos
  94035: { lat: 37.4161, lng: -122.055 }, // Moffett Field
  94039: { lat: 37.3861, lng: -122.0839 }, // Mountain View
  94040: { lat: 37.3861, lng: -122.0839 }, // Mountain View
  94041: { lat: 37.3861, lng: -122.0839 }, // Mountain View
  94042: { lat: 37.3861, lng: -122.0839 }, // Mountain View
  94043: { lat: 37.4197, lng: -122.0878 }, // Mountain View
  94085: { lat: 37.3881, lng: -122.0172 }, // Sunnyvale
  94086: { lat: 37.3769, lng: -122.0361 }, // Sunnyvale
  94087: { lat: 37.3528, lng: -122.0356 }, // Sunnyvale
  94088: { lat: 37.3688, lng: -122.0363 }, // Sunnyvale
  94089: { lat: 37.4089, lng: -122.0178 }, // Sunnyvale
  94301: { lat: 37.4419, lng: -122.143 }, // Palo Alto
  94302: { lat: 37.4419, lng: -122.143 }, // Palo Alto
  94303: { lat: 37.4522, lng: -122.1133 }, // Palo Alto
  94304: { lat: 37.3875, lng: -122.1478 }, // Palo Alto
  94305: { lat: 37.4275, lng: -122.1697 }, // Stanford
  94306: { lat: 37.4178, lng: -122.1278 }, // Palo Alto
  95002: { lat: 37.43, lng: -121.9058 }, // Alviso
  95008: { lat: 37.2872, lng: -121.95 }, // Campbell
  95009: { lat: 37.2872, lng: -121.95 }, // Campbell
  95011: { lat: 37.2872, lng: -121.95 }, // Campbell
  95013: { lat: 37.1833, lng: -121.7333 }, // Coyote
  95014: { lat: 37.323, lng: -122.0322 }, // Cupertino
  95015: { lat: 37.323, lng: -122.0322 }, // Cupertino
  95020: { lat: 37.0136, lng: -121.5672 }, // Gilroy
  95021: { lat: 37.0136, lng: -121.5672 }, // Gilroy
  95030: { lat: 37.2358, lng: -121.9624 }, // Los Gatos
  95031: { lat: 37.2358, lng: -121.9624 }, // Los Gatos
  95032: { lat: 37.2472, lng: -121.9339 }, // Los Gatos
  95033: { lat: 37.1458, lng: -122.05 }, // Los Gatos
  95035: { lat: 37.4323, lng: -121.8996 }, // Milpitas
  95036: { lat: 37.4323, lng: -121.8996 }, // Milpitas
  95037: { lat: 37.1275, lng: -121.6533 }, // Morgan Hill
  95038: { lat: 37.1275, lng: -121.6533 }, // Morgan Hill
  95042: { lat: 37.0333, lng: -121.5833 }, // New Almaden
  95044: { lat: 37.0833, lng: -121.4667 }, // Redwood Estates
  95046: { lat: 37.0833, lng: -121.4667 }, // San Martin
  95050: { lat: 37.3541, lng: -121.9552 }, // Santa Clara
  95051: { lat: 37.35, lng: -121.9847 }, // Santa Clara
  95052: { lat: 37.3541, lng: -121.9552 }, // Santa Clara
  95053: { lat: 37.3493, lng: -121.9381 }, // Santa Clara (SCU)
  95054: { lat: 37.3903, lng: -121.9775 }, // Santa Clara
  95055: { lat: 37.3541, lng: -121.9552 }, // Santa Clara
  95056: { lat: 37.3541, lng: -121.9552 }, // Santa Clara
  95070: { lat: 37.2638, lng: -122.023 }, // Saratoga
  95071: { lat: 37.2638, lng: -122.023 }, // Saratoga
  95101: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95102: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95103: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95106: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95108: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95109: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95110: { lat: 37.3436, lng: -121.9047 }, // San Jose
  95111: { lat: 37.2856, lng: -121.8275 }, // San Jose
  95112: { lat: 37.3511, lng: -121.8839 }, // San Jose
  95113: { lat: 37.3336, lng: -121.8892 }, // San Jose
  95116: { lat: 37.3533, lng: -121.8508 }, // San Jose
  95117: { lat: 37.3117, lng: -121.9519 }, // San Jose
  95118: { lat: 37.2517, lng: -121.8889 }, // San Jose
  95119: { lat: 37.2275, lng: -121.7839 }, // San Jose
  95120: { lat: 37.215, lng: -121.8639 }, // San Jose
  95121: { lat: 37.3044, lng: -121.8172 }, // San Jose
  95122: { lat: 37.33, lng: -121.8333 }, // San Jose
  95123: { lat: 37.2439, lng: -121.8356 }, // San Jose
  95124: { lat: 37.2578, lng: -121.9236 }, // San Jose
  95125: { lat: 37.2931, lng: -121.8958 }, // San Jose
  95126: { lat: 37.3242, lng: -121.9136 }, // San Jose
  95127: { lat: 37.3706, lng: -121.8069 }, // San Jose
  95128: { lat: 37.3133, lng: -121.9333 }, // San Jose
  95129: { lat: 37.3042, lng: -121.9928 }, // San Jose
  95130: { lat: 37.2878, lng: -121.9778 }, // San Jose
  95131: { lat: 37.3878, lng: -121.89 }, // San Jose
  95132: { lat: 37.4031, lng: -121.8594 }, // San Jose
  95133: { lat: 37.3703, lng: -121.8636 }, // San Jose
  95134: { lat: 37.4311, lng: -121.9436 }, // San Jose
  95135: { lat: 37.2975, lng: -121.7597 }, // San Jose
  95136: { lat: 37.2717, lng: -121.855 }, // San Jose
  95138: { lat: 37.2456, lng: -121.7539 }, // San Jose
  95139: { lat: 37.2333, lng: -121.7667 }, // San Jose
  95140: { lat: 37.25, lng: -121.6 }, // Mt. Hamilton
  95141: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95148: { lat: 37.3308, lng: -121.7767 }, // San Jose
  95150: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95151: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95152: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95153: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95154: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95155: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95156: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95157: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95158: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95159: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95160: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95161: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95164: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95170: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95171: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95172: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95173: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95190: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95191: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95192: { lat: 37.3382, lng: -121.8863 }, // San Jose (SJSU)
  95193: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95194: { lat: 37.3382, lng: -121.8863 }, // San Jose
  95196: { lat: 37.3382, lng: -121.8863 }, // San Jose

  // Solano County
  94510: { lat: 38.0494, lng: -122.158 }, // Benicia
  94512: { lat: 38.2583, lng: -121.7833 }, // Birds Landing
  94533: { lat: 38.2494, lng: -122.04 }, // Fairfield
  94534: { lat: 38.2494, lng: -122.04 }, // Fairfield
  94535: { lat: 38.2625, lng: -121.9356 }, // Travis AFB
  94571: { lat: 38.1539, lng: -121.6731 }, // Rio Vista
  94585: { lat: 38.2383, lng: -122.04 }, // Suisun City
  94589: { lat: 38.1041, lng: -122.2566 }, // Vallejo
  94590: { lat: 38.1041, lng: -122.2566 }, // Vallejo
  94591: { lat: 38.1244, lng: -122.2175 }, // Vallejo
  94592: { lat: 38.0833, lng: -122.2333 }, // Vallejo (Mare Island)
  95620: { lat: 38.4241, lng: -121.9525 }, // Dixon
  95625: { lat: 38.2667, lng: -121.7333 }, // Elmira
  95687: { lat: 38.3566, lng: -121.9877 }, // Vacaville
  95688: { lat: 38.3566, lng: -121.9877 }, // Vacaville
  95696: { lat: 38.3566, lng: -121.9877 }, // Vacaville

  // Sonoma County
  94926: { lat: 38.4404, lng: -122.7141 }, // Boyes Hot Springs
  94927: { lat: 38.3396, lng: -122.7011 }, // Rohnert Park
  94928: { lat: 38.3396, lng: -122.7011 }, // Rohnert Park
  94931: { lat: 38.25, lng: -122.7167 }, // Cotati
  94951: { lat: 38.2324, lng: -122.6367 }, // Penngrove
  94952: { lat: 38.2324, lng: -122.6367 }, // Petaluma
  94953: { lat: 38.2324, lng: -122.6367 }, // Petaluma
  94954: { lat: 38.2522, lng: -122.6078 }, // Petaluma
  94999: { lat: 38.2324, lng: -122.6367 }, // Petaluma
  95401: { lat: 38.4404, lng: -122.7141 }, // Santa Rosa
  95402: { lat: 38.4404, lng: -122.7141 }, // Santa Rosa
  95403: { lat: 38.4647, lng: -122.7461 }, // Santa Rosa
  95404: { lat: 38.4517, lng: -122.6928 }, // Santa Rosa
  95405: { lat: 38.4267, lng: -122.6783 }, // Santa Rosa
  95406: { lat: 38.4404, lng: -122.7141 }, // Santa Rosa
  95407: { lat: 38.41, lng: -122.7356 }, // Santa Rosa
  95409: { lat: 38.4589, lng: -122.6556 }, // Santa Rosa
  95412: { lat: 38.7333, lng: -123.4167 }, // Annapolis
  95416: { lat: 38.4372, lng: -122.4922 }, // Boyes Hot Springs
  95419: { lat: 38.5833, lng: -122.9167 }, // Camp Meeker
  95421: { lat: 38.4667, lng: -123.0333 }, // Cazadero
  95425: { lat: 38.7086, lng: -122.8528 }, // Cloverdale
  95430: { lat: 38.5333, lng: -123.05 }, // Duncans Mills
  95431: { lat: 38.325, lng: -122.4833 }, // Eldridge
  95433: { lat: 38.25, lng: -122.4583 }, // El Verano
  95436: { lat: 38.5, lng: -122.9333 }, // Forestville
  95439: { lat: 38.5083, lng: -122.7806 }, // Fulton
  95441: { lat: 38.75, lng: -123.0 }, // Geyserville
  95442: { lat: 38.2967, lng: -122.4611 }, // Glen Ellen
  95444: { lat: 38.5, lng: -122.8833 }, // Graton
  95446: { lat: 38.5333, lng: -122.8833 }, // Guerneville
  95448: { lat: 38.6105, lng: -122.8694 }, // Healdsburg
  95450: { lat: 38.5833, lng: -123.3167 }, // Jenner
  95452: { lat: 38.35, lng: -122.5 }, // Kenwood
  95462: { lat: 38.4583, lng: -123.0083 }, // Monte Rio
  95465: { lat: 38.4, lng: -122.9333 }, // Occidental
  95471: { lat: 38.45, lng: -122.9167 }, // Rio Nido
  95472: { lat: 38.4028, lng: -122.8233 }, // Sebastopol
  95473: { lat: 38.4028, lng: -122.8233 }, // Sebastopol
  95476: { lat: 38.2919, lng: -122.4578 }, // Sonoma
  95480: { lat: 38.5167, lng: -123.0667 }, // Stewarts Point
  95486: { lat: 38.4667, lng: -123.0 }, // Villa Grande
  95487: { lat: 38.2833, lng: -122.45 }, // Vineburg
  95492: { lat: 38.5469, lng: -122.8166 }, // Windsor
  95497: { lat: 38.75, lng: -123.3333 }, // The Sea Ranch
};

// Neighborhood aliases that map to their parent city
const neighborhoodAliases = {
  'redwood shores': 'Redwood City',
  'foster city': 'Foster City',
  'silicon valley': 'San Jose',
  soma: 'San Francisco',
  'the mission': 'San Francisco',
  castro: 'San Francisco',
  marina: 'San Francisco',
  'financial district': 'San Francisco',
  'downtown oakland': 'Oakland',
  temescal: 'Oakland',
  rockridge: 'Oakland',
  fruitvale: 'Oakland',
  'north beach': 'San Francisco',
  haight: 'San Francisco',
  'noe valley': 'San Francisco',
  'bernal heights': 'San Francisco',
  'potrero hill': 'San Francisco',
  dogpatch: 'San Francisco',
  'inner sunset': 'San Francisco',
  'outer sunset': 'San Francisco',
  'richmond district': 'San Francisco',
  excelsior: 'San Francisco',
  'visitacion valley': 'San Francisco',
  bayview: 'San Francisco',
  'hunters point': 'San Francisco',
  'diamond heights': 'San Francisco',
  'glen park': 'San Francisco',
  'twin peaks': 'San Francisco',
  'west portal': 'San Francisco',
  parkside: 'San Francisco',
  'sea cliff': 'San Francisco',
};

function main() {
  console.log('Generating location data API...\n');

  // Load zipcodes
  const zipcodesContent = fs.readFileSync(ZIPCODES_PATH, 'utf-8');
  const zipToCity = yaml.load(zipcodesContent);

  // Load cities
  const citiesContent = fs.readFileSync(CITIES_PATH, 'utf-8');
  const cities = yaml.load(citiesContent);

  // Build city to county map
  const cityToCounty = {};
  for (const city of cities) {
    cityToCounty[city.name.toLowerCase()] = city.county;
  }

  // Create output
  const output = {
    generated: new Date().toISOString(),
    zipToCity,
    cityToCounty,
    neighborhoodAliases,
    zipCoordinates,
  };

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`Generated location data API`);
  console.log(`  ZIP codes: ${Object.keys(zipToCity).length}`);
  console.log(`  ZIP coordinates: ${Object.keys(zipCoordinates).length}`);
  console.log(`  Cities: ${Object.keys(cityToCounty).length}`);
  console.log(`  Neighborhoods: ${Object.keys(neighborhoodAliases).length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main();
