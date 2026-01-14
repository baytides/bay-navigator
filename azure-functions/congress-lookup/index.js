/**
 * Congress Lookup Azure Function
 * Proxies requests to Congress.gov API, CA Legislature API, and geocoding services
 * Returns member info for a given state and congressional/state district
 */

const https = require('https');

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const CA_LEGISLATURE_BASE = 'https://findyourrep.legislature.ca.gov';
const CENSUS_GEOCODER_BASE = 'https://geocoding.geo.census.gov/geocoder/geographies/address';
const ARCGIS_DISTRICTS_BASE =
  'https://services5.arcgis.com/0CGHmi5SBMvfD65u/arcgis/rest/services/AD_SD_2021_DistrictOverlay/FeatureServer/2/query';

// Bay Area City Council Data (2026)
// Key is Census Place GEOID (state FIPS + place FIPS)
// For district-based cities: arcgis endpoint returns council member for a location
// For at-large cities: all members represent the entire city
// Data sources: Cicero API (cicerodata.com), city websites, ArcGIS services
const CITY_COUNCILS = {
  // ========== ALAMEDA COUNTY ==========
  '0600562': {
    // Alameda
    name: 'Alameda',
    type: 'at-large',
    website: 'https://www.alamedaca.gov/GOVERNMENT/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Trish Herrera Spencer, Tony Daysog elected
      mayor: { name: 'Marilyn Ezzy Ashcraft' },
    },
  },
  '0600674': {
    // Albany
    name: 'Albany',
    type: 'at-large',
    website: 'https://www.albanyca.org/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: RCV election
      mayor: { name: 'Aaron Tiedemann' },
    },
  },
  '0606000': {
    // Berkeley
    name: 'Berkeley',
    type: 'district',
    website: 'https://berkeleyca.gov/your-government/city-council',
    arcgis: null,
    members: {
      // Nov 2024 winners
      mayor: { name: 'Adena Ishii' },
      2: { name: 'Terry Taplin' },
      3: { name: 'Deborah Matthews' },
      5: { name: 'Nilang Gor' },
      6: { name: 'Brent Blackaby' },
    },
  },
  '0620018': {
    // Dublin
    name: 'Dublin',
    type: 'at-large',
    website: 'https://dublin.ca.gov/148/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Kashef Qaadri (Mayor), Jon Gunderson, Melissa Hernandez elected
      mayor: { name: 'Kashef Qaadri' },
    },
  },
  '0622594': {
    // Emeryville
    name: 'Emeryville',
    type: 'at-large',
    website: 'https://www.emeryville.org/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Matthew Solomon, Sukhdeep Kaur, Sam Gould elected
      mayor: { name: 'John Bauters' },
    },
  },
  '0626000': {
    // Fremont
    name: 'Fremont',
    type: 'district',
    website: 'https://www.fremont.gov/government/mayor-city-council',
    arcgis: null,
    members: {
      mayor: {
        name: 'Raj Salwan',
        photoUrl: 'https://www.fremont.gov/home/showpublishedimage/482/638791182509370000',
        website: 'https://www.fremont.gov/government/mayor-city-council',
      },
      1: { name: 'Teresa Keng' },
      2: { name: 'Desrie Campbell' },
      3: {
        name: 'Kathy Kimberlin',
        photoUrl: 'https://www.fremont.gov/home/showpublishedimage/9621/638767001732970000',
        website: 'https://www.fremont.gov/government/mayor-city-council',
      },
      4: { name: 'Yang Shao' },
      5: { name: 'Yajing Zhang' },
      6: { name: 'Raymond Liu' },
    },
  },
  '0633000': {
    // Hayward
    name: 'Hayward',
    type: 'at-large', // Transitioning to districts in Nov 2026
    website: 'https://www.hayward-ca.gov/your-government/city-council',
    arcgis: null,
    members: {
      mayor: { name: 'Mark Salinas' },
      1: {
        name: 'Angela Andrews',
        photoUrl:
          'https://www.hayward-ca.gov/sites/default/files/pictures/MMC-Staff-Councilmember-Andrews-Angela-2025.png',
        website:
          'https://www.hayward-ca.gov/your-government/city-council/council-member-angela-andrews',
      },
      2: {
        name: 'Ray Bonilla Jr.',
        photoUrl:
          'https://www.hayward-ca.gov/sites/default/files/pictures/MCC-Staff-Councilmember-Bonilla-Ray-2025.png',
        website:
          'https://www.hayward-ca.gov/your-government/city-council/council-member-ray-bonilla-jr',
      },
      3: {
        name: 'Dan Goldstein',
        photoUrl:
          'https://www.hayward-ca.gov/sites/default/files/pictures/MCC-Staff-Councilmember-Goldstein-Dan-2025.png',
        website: 'https://www.hayward-ca.gov/your-government/city-council/dan-goldstein',
      },
      4: {
        name: 'Julie Roche',
        photoUrl:
          'https://www.hayward-ca.gov/sites/default/files/pictures/MCC-Staff-Councilmember-Roche-Julie-2025.png',
        website:
          'https://www.hayward-ca.gov/your-government/city-council/council-member-julie-roche',
      },
      5: { name: 'George Syrop' },
      6: { name: 'Francisco Zermeño' },
    },
  },
  '0640438': {
    // Livermore
    name: 'Livermore',
    type: 'at-large',
    website: 'https://www.cityoflivermore.net/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: John Marchand (Mayor), Brittni Kiick, Evan Branning elected
      mayor: { name: 'John Marchand' },
    },
  },
  '0651182': {
    // Newark
    name: 'Newark',
    type: 'at-large',
    website: 'https://www.newark.org/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Michael Hannon (Mayor), Luis Freitas, Mike Bucci elected
      mayor: { name: 'Michael Hannon' },
    },
  },
  '0653000': {
    // Oakland
    name: 'Oakland',
    type: 'hybrid', // 7 districts + 1 at-large
    website: 'https://www.oaklandca.gov/departments/city-council',
    arcgis: {
      url: 'https://services5.arcgis.com/ROBnTHSNjoZ2Wm1P/arcgis/rest/services/City_Council_District_Boundaries/FeatureServer/0',
      districtField: 'DISTRICT_ID',
      districtMapping: { 111: 1, 112: 2, 113: 3, 114: 4, 115: 5, 116: 6, 117: 7 },
    },
    members: {
      'at-large': {
        name: 'Rowena Brown',
        photoUrl:
          'https://www.oaklandca.gov/files/assets/city/v/2/city-administrator/images/leadership/rowena-brown.jpg?dimension=pageimage&w=480',
        website:
          'https://www.oaklandca.gov/Government/City-Council-Leadership/Council-Members/Councilmember-At-Large',
      },
      1: { name: 'Zac Unger' },
      2: { name: 'Charlene Wang' },
      3: {
        name: 'Carroll Fife',
        photoUrl:
          'https://www.oaklandca.gov/files/assets/city/v/1/city-administrator/images/leadership/carroll-fife.jpg?dimension=pageimage&w=480',
        website:
          'https://www.oaklandca.gov/Government/City-Council-Leadership/Council-Members/District-3',
      },
      4: { name: 'Janani Ramachandran' },
      5: { name: 'Noel Gallo' },
      6: { name: 'Kevin Jenkins' },
      7: { name: 'Ken Houston' },
    },
  },
  '0656784': {
    // Piedmont
    name: 'Piedmont',
    type: 'at-large',
    website: 'https://www.piedmont.ca.gov/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Conna McCarthy, Rosalind Robertson elected
      mayor: { name: 'Jennifer Cavenaugh' },
    },
  },
  '0657792': {
    // Pleasanton
    name: 'Pleasanton',
    type: 'at-large',
    website: 'https://www.cityofpleasantonca.gov/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Karla Brown (Mayor), Valerie Arkin, Jack Balch elected
      mayor: { name: 'Karla Brown' },
    },
  },
  '0668084': {
    // San Leandro
    name: 'San Leandro',
    type: 'district',
    website: 'https://www.sanleandro.org/depts/cityclerk/council/default.asp',
    arcgis: null,
    members: {
      // Nov 2024: Juan Gonzalez (D1), Victor Aguilar (D3), Corina Lopez (D5) elected
      mayor: { name: 'Juan Gonzalez' },
      1: { name: 'Juan Gonzalez' },
      3: { name: 'Victor Aguilar' },
      5: { name: 'Corina Lopez' },
    },
  },
  '0680812': {
    // Union City
    name: 'Union City',
    type: 'at-large',
    website: 'https://www.unioncity.org/214/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Gary Singh (Mayor), Scott Sakakihara elected
      mayor: { name: 'Gary Singh' },
    },
  },

  // ========== CONTRA COSTA COUNTY ==========
  '0602252': {
    // Antioch
    name: 'Antioch',
    type: 'district',
    website: 'https://www.antiochca.gov/government/mayor-and-city-council/',
    arcgis: null,
    members: {
      // Nov 2024: Ron Bernal (Mayor), Louie Rocha (D2), Don Freitas (D3)
      mayor: {
        name: 'Ron Bernal',
        photoUrl: 'https://www.antiochca.gov/ImageRepository/Document?documentID=1944',
        website: 'https://www.antiochca.gov/directory.aspx?eid=78',
      },
      2: { name: 'Louie Rocha' },
      3: { name: 'Don Freitas' },
    },
  },
  '0608142': {
    // Brentwood
    name: 'Brentwood',
    type: 'district',
    website: 'https://www.brentwoodca.gov/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Susannah Meyer (Mayor), Faye Maloney (D1), Jovita Mendoza (D3)
      mayor: { name: 'Susannah Meyer' },
      1: { name: 'Faye Maloney' },
      3: { name: 'Jovita Mendoza' },
    },
  },
  '0613882': {
    // Clayton
    name: 'Clayton',
    type: 'at-large',
    website: 'https://www.claytonca.gov/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Richard Enea, Holly Tillman, Jim Diaz elected
      1: { name: 'Richard Enea' },
      2: { name: 'Holly Tillman' },
      3: { name: 'Jim Diaz' },
    },
  },
  '0616000': {
    // Concord
    name: 'Concord',
    type: 'district',
    website: 'https://www.cityofconcord.org/235/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Carlyn Obringer (D2), Pablo Benavente (D4)
      2: {
        name: 'Carlyn Obringer',
        photoUrl: 'https://www.cityofconcord.org/ImageRepository/Document?documentID=2176',
        website: 'https://www.cityofconcord.org/238/Mayor-Carlyn-Obringer',
      },
      4: { name: 'Pablo Benavente' },
    },
  },
  '0617988': {
    // Danville (Town)
    name: 'Danville',
    type: 'at-large',
    website: 'https://www.danville.ca.gov/town-council',
    arcgis: null,
    members: {
      // Nov 2024: Newell Arnerich, Renee Morgan, Mark Belotz elected
      1: { name: 'Newell Arnerich' },
      2: { name: 'Renee Morgan' },
      3: { name: 'Mark Belotz' },
    },
  },
  '0621796': {
    // El Cerrito
    name: 'El Cerrito',
    type: 'at-large',
    website: 'https://www.el-cerrito.org/175/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Lisa Motoyama, Rebecca Saltzman, William Ktsanes elected
      1: { name: 'Lisa Motoyama' },
      2: { name: 'Rebecca Saltzman' },
      3: { name: 'William Ktsanes' },
    },
  },
  '0633798': {
    // Hercules
    name: 'Hercules',
    type: 'at-large',
    website: 'https://www.ci.hercules.ca.us/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Alex Walker-Griffin, Dilli Bhattarai, Tiffany Grimsley elected
      1: { name: 'Alex Walker-Griffin' },
      2: { name: 'Dilli Bhattarai' },
      3: { name: 'Tiffany Grimsley' },
    },
  },
  '0639122': {
    // Lafayette
    name: 'Lafayette',
    type: 'at-large',
    website: 'https://www.lovelafayette.org/city-hall/city-government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: John McCormick, Gina Dawson, Carl Anduri (full), Jim Cervantes (short)
      1: { name: 'John McCormick' },
      2: { name: 'Gina Dawson' },
      3: { name: 'Carl Anduri' },
      4: { name: 'Jim Cervantes' },
    },
  },
  '0645484': {
    // Martinez
    name: 'Martinez',
    type: 'at-large',
    website: 'https://www.cityofmartinez.org/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Greg Young elected
      1: { name: 'Greg Young' },
    },
  },
  '0649278': {
    // Moraga (Town)
    name: 'Moraga',
    type: 'at-large',
    website: 'https://www.moraga.ca.us/town-council',
    arcgis: null,
    members: {},
  },
  '0653070': {
    // Oakley
    name: 'Oakley',
    type: 'district',
    website: 'https://www.oakleyinfo.com/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: George Fuller (D5)
      5: { name: 'George Fuller' },
    },
  },
  '0654232': {
    // Orinda
    name: 'Orinda',
    type: 'at-large',
    website: 'https://www.cityoforinda.org/138/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Darlene Gee, Cara Hoxie elected
      1: { name: 'Darlene Gee' },
      2: { name: 'Cara Hoxie' },
    },
  },
  '0657288': {
    // Pinole
    name: 'Pinole',
    type: 'at-large',
    website: 'https://www.ci.pinole.ca.us/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Devin Murphy, Maureen Toms elected
      1: { name: 'Devin Murphy' },
      2: { name: 'Maureen Toms' },
    },
  },
  '0657456': {
    // Pittsburg
    name: 'Pittsburg',
    type: 'at-large',
    website: 'https://www.pittsburgca.gov/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Juan Banales, Jelani Killings elected
      1: { name: 'Juan Banales' },
      2: { name: 'Jelani Killings' },
    },
  },
  '0657764': {
    // Pleasant Hill
    name: 'Pleasant Hill',
    type: 'district',
    website: 'https://www.pleasanthillca.org/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Bella La (D1), Amanda Szakats (D5)
      1: { name: 'Bella La' },
      5: { name: 'Amanda Szakats' },
    },
  },
  '0660620': {
    // Richmond
    name: 'Richmond',
    type: 'district',
    website: 'https://www.ci.richmond.ca.us/149/Biographies-Terms',
    arcgis: null,
    members: {
      // Nov 2024: Jamelia Brown (D1), Sue Wilson (D5), Claudia Jimenez (D6)
      mayor: {
        name: 'Eduardo Martinez',
        photoUrl: 'https://www.ci.richmond.ca.us/ImageRepository/Document?documentId=64486',
        website: 'https://ca-richmond3.civicplus.com/directory.aspx?EID=1072',
      },
      1: {
        name: 'Jamelia Brown',
        photoUrl: 'https://www.ci.richmond.ca.us/ImageRepository/Document?documentId=72948',
        website: 'https://www.ci.richmond.ca.us/149/Biographies-Terms',
      },
      5: { name: 'Sue Wilson' },
      6: { name: 'Claudia Jimenez' },
    },
  },
  '0668252': {
    // San Pablo
    name: 'San Pablo',
    type: 'at-large',
    website: 'https://www.sanpabloca.gov/117/City-Council',
    arcgis: null,
    members: {},
  },
  '0668294': {
    // San Ramon
    name: 'San Ramon',
    type: 'district',
    website: 'https://www.sanramon.ca.gov/our_city/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Robert Jweinat (D1)
      1: { name: 'Robert Jweinat' },
    },
  },
  '0683346': {
    // Walnut Creek
    name: 'Walnut Creek',
    type: 'at-large',
    website: 'https://www.walnutcreek.gov/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Cindy Darling, Kevin Wilk, Craig Devinney elected
      1: { name: 'Cindy Darling' },
      2: { name: 'Kevin Wilk' },
      3: { name: 'Craig Devinney' },
    },
  },

  // ========== MARIN COUNTY ==========
  '0604870': {
    // Belvedere
    name: 'Belvedere',
    type: 'at-large',
    website: 'https://www.cityofbelvedere.org/city-council/',
    arcgis: null,
    members: {},
  },
  '0616350': {
    // Corte Madera (Town)
    name: 'Corte Madera',
    type: 'at-large',
    website: 'https://www.townofcortemadera.org/161/Town-Council',
    arcgis: null,
    members: {},
  },
  '0623392': {
    // Fairfax (Town)
    name: 'Fairfax',
    type: 'at-large',
    website: 'https://www.townoffairfax.org/town-council/',
    arcgis: null,
    members: {},
  },
  '0639864': {
    // Larkspur
    name: 'Larkspur',
    type: 'at-large',
    website: 'https://www.cityoflarkspur.org/167/City-Council',
    arcgis: null,
    members: {},
  },
  '0647710': {
    // Mill Valley
    name: 'Mill Valley',
    type: 'at-large',
    website: 'https://www.cityofmillvalley.org/government/city_council',
    arcgis: null,
    members: {},
  },
  '0651714': {
    // Novato
    name: 'Novato',
    type: 'at-large',
    website: 'https://www.novato.org/government/city-council',
    arcgis: null,
    members: {},
  },
  '0662546': {
    // Ross (Town)
    name: 'Ross',
    type: 'at-large',
    website: 'https://www.townofross.org/towncouncil',
    arcgis: null,
    members: {},
  },
  '0665014': {
    // San Anselmo (Town)
    name: 'San Anselmo',
    type: 'at-large',
    website: 'https://www.townofsananselmo.org/89/Town-Council',
    arcgis: null,
    members: {},
  },
  '0668364': {
    // San Rafael
    name: 'San Rafael',
    type: 'at-large',
    website: 'https://www.cityofsanrafael.org/city-council/',
    arcgis: null,
    members: {},
  },
  '0670098': {
    // Sausalito
    name: 'Sausalito',
    type: 'at-large',
    website: 'https://www.sausalito.gov/city-government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Ian Sobieski, Steven Woodside, Melissa Blaustein elected
      1: { name: 'Ian Sobieski' },
      2: { name: 'Steven Woodside' },
      3: { name: 'Melissa Blaustein' },
    },
  },
  '0678582': {
    // Tiburon (Town)
    name: 'Tiburon',
    type: 'at-large',
    website: 'https://www.townoftiburon.org/172/Town-Council',
    arcgis: null,
    members: {},
  },

  // ========== NAPA COUNTY ==========
  '0600870': {
    // American Canyon
    name: 'American Canyon',
    type: 'at-large',
    website: 'https://www.cityofamericancanyon.org/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Pierre Washington (Mayor), Melissa Lamattina, Brando R. Cruz elected
      mayor: { name: 'Pierre Washington' },
      1: { name: 'Melissa Lamattina' },
      2: { name: 'Brando R. Cruz' },
    },
  },
  '0610345': {
    // Calistoga
    name: 'Calistoga',
    type: 'at-large',
    website: 'https://www.calistogacity.net/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Donald Williams (Mayor), Irais Lopez-Ortega, Lisa Gift re-elected
      mayor: { name: 'Donald Williams' },
      1: { name: 'Irais Lopez-Ortega' },
      2: { name: 'Lisa Gift' },
    },
  },
  '0650258': {
    // Napa
    name: 'Napa',
    type: 'at-large',
    website: 'https://www.cityofnapa.org/106/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Scott Sedgley (Mayor) re-elected
      mayor: { name: 'Scott Sedgley' },
    },
  },
  '0669088': {
    // St. Helena
    name: 'St. Helena',
    type: 'at-large',
    website: 'https://www.cityofsthelena.org/bc-cc',
    arcgis: null,
    members: {
      // Nov 2024: Paul Dohring (Mayor), Aaron Barak, Michelle Deasy elected
      mayor: { name: 'Paul Dohring' },
      1: { name: 'Aaron Barak' },
      2: { name: 'Michelle Deasy' },
    },
  },
  '0687042': {
    // Yountville (Town)
    name: 'Yountville',
    type: 'at-large',
    website: 'https://www.yountville.com/government/town-council',
    arcgis: null,
    members: {
      // Nov 2024: Eric Knight, Pam Reeves re-elected
      1: { name: 'Eric Knight' },
      2: { name: 'Pam Reeves' },
    },
  },

  // ========== SAN FRANCISCO ==========
  // San Francisco (0667000) is a consolidated city-county
  // Supervisors are handled via COUNTY_SUPERVISORS['06075']

  // ========== SAN MATEO COUNTY ==========
  '0602364': {
    // Atherton (Town)
    name: 'Atherton',
    type: 'at-large',
    website: 'https://www.ci.atherton.ca.us/41/Town-Council',
    arcgis: null,
    members: {},
  },
  '0604982': {
    // Belmont
    name: 'Belmont',
    type: 'district',
    website: 'https://www.belmont.gov/city-hall/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Cathy M. Jordan (D2), Tom McCune (D4)
      2: { name: 'Cathy M. Jordan' },
      4: { name: 'Tom McCune' },
    },
  },
  '0608590': {
    // Brisbane
    name: 'Brisbane',
    type: 'at-large',
    website: 'https://www.brisbaneca.org/citycouncil',
    arcgis: null,
    members: {
      // Nov 2024: Cliff Lentz, Frank Kern, Coleen Mackin elected
      1: { name: 'Cliff Lentz' },
      2: { name: 'Frank Kern' },
      3: { name: 'Coleen Mackin' },
    },
  },
  '0609066': {
    // Burlingame
    name: 'Burlingame',
    type: 'district',
    website: 'https://www.burlingame.org/city_council/',
    arcgis: null,
    members: {
      // Nov 2024: Andrea Pappajohn (D1 short), Desiree Thayer (D2), Donna Colson (D4)
      1: { name: 'Andrea Pappajohn' },
      2: { name: 'Desiree Thayer' },
      4: { name: 'Donna Colson' },
    },
  },
  '0614274': {
    // Colma (Town)
    name: 'Colma',
    type: 'at-large',
    website: 'https://www.colma.ca.gov/city-council/',
    arcgis: null,
    members: {
      // Nov 2024: Ken Gonzalez, Carrie Slaughter, Thomas Walsh elected
      1: { name: 'Ken Gonzalez' },
      2: { name: 'Carrie Slaughter' },
      3: { name: 'Thomas Walsh' },
    },
  },
  '0617918': {
    // Daly City
    name: 'Daly City',
    type: 'at-large',
    website: 'https://www.dalycity.org/140/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Juslyn Cabrera Manalo, Glenn R. Sylvester (full), Teresa Proaño (short)
      mayor: {
        name: 'Rod Daus-Magbual',
        photoUrl: 'https://www.dalycity.org/ImageRepository/Document?documentID=8987',
        website: 'https://www.dalycity.org/711/Dr-Rod-Daus-Magbual',
      },
      1: {
        name: 'Pamela DiGiovanni',
        photoUrl: 'https://www.dalycity.org/ImageRepository/Document?documentID=1804',
        website: 'https://www.dalycity.org/708/Pamela-DiGiovanni',
      },
      2: {
        name: 'Juslyn Manalo',
        photoUrl: 'https://www.dalycity.org/ImageRepository/Document?documentID=1809',
        website: 'https://www.dalycity.org/713/Juslyn-C-Manalo',
      },
      3: {
        name: 'Teresa Proaño',
        photoUrl: 'https://www.dalycity.org/ImageRepository/Document?documentID=9573',
        website: 'https://www.dalycity.org/707/Teresa-G-Proao',
      },
      4: { name: 'Glenn R. Sylvester' },
    },
  },
  '0620956': {
    // East Palo Alto
    name: 'East Palo Alto',
    type: 'at-large',
    website: 'https://www.cityofepa.org/citycouncil',
    arcgis: null,
    members: {
      // Nov 2024: Carlos Romero, Mark Dinan, Webster Lincoln elected
      1: { name: 'Carlos Romero' },
      2: { name: 'Mark Dinan' },
      3: { name: 'Webster Lincoln' },
    },
  },
  '0624638': {
    // Foster City
    name: 'Foster City',
    type: 'at-large',
    website: 'https://www.fostercity.org/citycouncil',
    arcgis: null,
    members: {
      // Nov 2024: Suzy Niederhofer, Patrick J. Sullivan, Phoebe Shin Venkat elected
      1: { name: 'Suzy Niederhofer' },
      2: { name: 'Patrick J. Sullivan' },
      3: { name: 'Phoebe Shin Venkat' },
    },
  },
  '0631708': {
    // Half Moon Bay
    name: 'Half Moon Bay',
    type: 'district',
    website: 'https://www.hmbcity.com/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Patric Bo Jonsson (D2), Paul Nagengast (D3)
      2: { name: 'Patric Bo Jonsson' },
      3: { name: 'Paul Nagengast' },
    },
  },
  '0633854': {
    // Hillsborough (Town)
    name: 'Hillsborough',
    type: 'at-large',
    website: 'https://www.hillsborough.net/87/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Christine Krolik, Sophie Cole, Laurie Davies Adams elected
      1: { name: 'Christine Krolik' },
      2: { name: 'Sophie Cole' },
      3: { name: 'Laurie Davies Adams' },
    },
  },
  '0646870': {
    // Menlo Park
    name: 'Menlo Park',
    type: 'district',
    website: 'https://menlopark.gov/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Jeff Schmidt (D3), Jennifer Wise (D5)
      3: { name: 'Jeff Schmidt' },
      4: {
        name: 'Betsy Nash',
        photoUrl:
          'https://menlopark.gov/files/sharedassets/public/v/1/city-council/images/betsy-nash.jpg?dimension=pageimage&w=480',
        website: 'https://menlopark.gov/City-Council/Betsy-Nash',
      },
      5: { name: 'Jennifer Wise' },
    },
  },
  '0647486': {
    // Millbrae
    name: 'Millbrae',
    type: 'district',
    website: 'https://www.ci.millbrae.ca.us/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Stephen Rainaldi (D1), Reuben D. Holober (D3), Anders Fung (D5)
      1: { name: 'Stephen Rainaldi' },
      3: { name: 'Reuben D. Holober' },
      5: { name: 'Anders Fung' },
    },
  },
  '0656000': {
    // Pacifica
    name: 'Pacifica',
    type: 'district',
    website: 'https://www.cityofpacifica.org/government/city_council',
    arcgis: null,
    members: {
      // Nov 2024: Mayra Espinosa (D1), Greg Wright (D4)
      1: { name: 'Mayra Espinosa' },
      4: { name: 'Greg Wright' },
    },
  },
  '0657736': {
    // Portola Valley (Town)
    name: 'Portola Valley',
    type: 'at-large',
    website: 'https://www.portolavalley.net/town-government/town-council',
    arcgis: null,
    members: {
      // Nov 2024: Rebecca Flynn, Helen Wolter elected
      1: { name: 'Rebecca Flynn' },
      2: { name: 'Helen Wolter' },
    },
  },
  '0660102': {
    // Redwood City
    name: 'Redwood City',
    type: 'district',
    website: 'https://www.redwoodcity.org/departments/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Jeff Gee (D1), Isabella Chu (D3), Elmer Martínez Saballos (D4), Marcella Padilla (D7)
      1: { name: 'Jeff Gee' },
      3: { name: 'Isabella Chu' },
      4: { name: 'Elmer Martínez Saballos' },
      7: { name: 'Marcella Padilla' },
    },
  },
  '0665028': {
    // San Bruno
    name: 'San Bruno',
    type: 'district',
    website: 'https://www.sanbruno.ca.gov/gov/city_council/default.htm',
    arcgis: null,
    members: {
      // Nov 2024: Rico E. Medina (Mayor), Tom Hamilton (D2), Michael Salazar (D3)
      mayor: { name: 'Rico E. Medina' },
      2: { name: 'Tom Hamilton' },
      3: { name: 'Michael Salazar' },
    },
  },
  '0665070': {
    // San Carlos
    name: 'San Carlos',
    type: 'at-large',
    website: 'https://www.cityofsancarlos.org/government/city_council/city_council_members',
    arcgis: null,
    members: {
      // Nov 2024: John Dugan, Neil Layton elected
      1: { name: 'John Dugan' },
      2: { name: 'Neil Layton' },
    },
  },
  '0668252': {
    // San Mateo
    name: 'San Mateo',
    type: 'district',
    website: 'https://www.cityofsanmateo.org/42/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Nicole Fernandez (D2), Danielle Cwirko-Godycki (D4)
      2: {
        name: 'Nicole Fernandez',
        photoUrl: 'https://www.cityofsanmateo.org/ImageRepository/Document?documentID=96289',
        website: 'https://www.cityofsanmateo.org/4160/Council-Member-Nicole-Fernandez',
      },
      4: { name: 'Danielle Cwirko-Godycki' },
    },
  },
  '0673262': {
    // South San Francisco
    name: 'South San Francisco',
    type: 'district',
    website: 'https://www.ssf.net/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Mark Nagales (D2), James Hsu Coleman (D4)
      2: { name: 'Mark Nagales' },
      4: { name: 'James Hsu Coleman' },
    },
  },
  '0684550': {
    // Woodside (Town)
    name: 'Woodside',
    type: 'district',
    website: 'https://www.woodsidetown.org/town-council',
    arcgis: null,
    members: {},
  },

  // ========== SANTA CLARA COUNTY ==========
  '0611194': {
    // Campbell
    name: 'Campbell',
    type: 'at-large',
    website: 'https://www.campbellca.gov/138/City-Council',
    arcgis: null,
    members: {},
  },
  '0617610': {
    // Cupertino
    name: 'Cupertino',
    type: 'at-large',
    website: 'https://www.cupertino.org/our-city/departments/city-council',
    arcgis: null,
    members: {
      // Cupertino council from official website
      mayor: { name: 'Kitty Moore' },
      1: { name: 'Liang-Fang Chao' },
      2: { name: 'Sheila Mohan' },
      3: { name: 'J.R. Fruen' },
      4: { name: 'R Ray Wang' },
    },
  },
  '0629504': {
    // Gilroy
    name: 'Gilroy',
    type: 'at-large',
    website: 'https://www.cityofgilroy.org/252/City-Council',
    arcgis: null,
    members: {},
  },
  '0643280': {
    // Los Altos
    name: 'Los Altos',
    type: 'at-large',
    website: 'https://www.losaltosca.gov/citycouncil',
    arcgis: null,
    members: {},
  },
  '0643294': {
    // Los Altos Hills (Town)
    name: 'Los Altos Hills',
    type: 'at-large',
    website: 'https://www.losaltoshills.ca.gov/111/Town-Council',
    arcgis: null,
    members: {},
  },
  '0644112': {
    // Los Gatos (Town)
    name: 'Los Gatos',
    type: 'at-large',
    website: 'https://www.losgatosca.gov/87/Town-Council',
    arcgis: null,
    members: {},
  },
  '0648198': {
    // Milpitas
    name: 'Milpitas',
    type: 'at-large',
    website: 'https://www.milpitas.gov/government/city-council/',
    arcgis: null,
    members: {},
  },
  '0649054': {
    // Monte Sereno
    name: 'Monte Sereno',
    type: 'at-large',
    website: 'https://www.montesereno.org/citycouncil',
    arcgis: null,
    members: {},
  },
  '0649670': {
    // Morgan Hill
    name: 'Morgan Hill',
    type: 'at-large',
    website: 'https://www.morgan-hill.ca.gov/1068/City-Council',
    arcgis: null,
    members: {},
  },
  '0649278': {
    // Mountain View
    name: 'Mountain View',
    type: 'at-large',
    website: 'https://www.mountainview.gov/council',
    arcgis: null,
    members: {},
  },
  '0655282': {
    // Palo Alto
    name: 'Palo Alto',
    type: 'at-large',
    website: 'https://www.cityofpaloalto.org/Departments/City-Council',
    arcgis: null,
    members: {},
  },
  '0668000': {
    // San Jose
    name: 'San Jose',
    type: 'district',
    website: 'https://www.sanjoseca.gov/your-government/departments-offices/city-council',
    arcgis: {
      url: 'https://geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120',
      districtField: 'DISTRICTINT',
      nameField: 'COUNCILMEMBER',
      phoneField: 'PHONE',
      websiteField: 'DISTRICTURL',
    },
    members: {
      mayor: {
        name: 'Matt Mahan',
        photoUrl: 'https://www.sanjoseca.gov/home/showpublishedimage/18704/638182739952470000',
        website: 'https://www.sjmayormatt.com/',
      },
      1: { name: 'Rosemary Kamei' },
      2: { name: 'Pamela Campos' },
      3: { name: 'Anthony Tordillos' },
      4: { name: 'David Cohen' },
      5: { name: 'Peter Ortiz' },
      6: { name: 'Michael Mulcahy' },
      7: { name: 'Bien Doan' },
      8: { name: 'Domingo Candelas' },
      9: { name: 'Pam Foley' },
      10: { name: 'George Casey' },
    },
  },
  '0669000': {
    // Santa Clara
    name: 'Santa Clara',
    type: 'district',
    website: 'https://www.santaclaraca.gov/our-city/government/mayor-and-council',
    arcgis: null,
    members: {
      mayor: {
        name: 'Lisa Gillmor',
        photoUrl: 'https://www.santaclaraca.gov/home/showpublishedimage/75017/638205346625770000',
        website:
          'https://www.santaclaraca.gov/our-city/government/mayor-and-council/mayor-lisa-m-gillmor',
      },
      2: {
        name: 'Raj Chahal',
        photoUrl: 'https://www.santaclaraca.gov/home/showpublishedimage/75019/638204323827570000',
        website:
          'https://www.santaclaraca.gov/our-city/government/mayor-and-council/councilmembers/raj-chahal',
      },
    },
  },
  '0670280': {
    // Saratoga
    name: 'Saratoga',
    type: 'at-large',
    website: 'https://www.saratoga.ca.us/185/City-Council',
    arcgis: null,
    members: {},
  },
  '0677000': {
    // Sunnyvale
    name: 'Sunnyvale',
    type: 'district',
    website: 'https://www.sunnyvale.ca.gov/your-government/governance/city-council',
    arcgis: null,
    members: {
      mayor: {
        name: 'Larry Klein',
        photoUrl: 'https://www.sunnyvale.ca.gov/home/showpublishedimage/364/637819987988230000',
        website: 'https://www.sunnyvale.ca.gov/your-government/governance/city-council',
      },
      2: {
        name: 'Alysa Cisneros',
        photoUrl: 'https://www.sunnyvale.ca.gov/home/showpublishedimage/358/637819987976870000',
        website: 'https://www.sunnyvale.ca.gov/your-government/governance/city-council',
      },
    },
  },

  // ========== SOLANO COUNTY ==========
  '0604982': {
    // Benicia
    name: 'Benicia',
    type: 'at-large',
    website: 'https://www.ci.benicia.ca.us/citycouncil',
    arcgis: null,
    members: {},
  },
  '0619402': {
    // Dixon
    name: 'Dixon',
    type: 'at-large',
    website: 'https://www.cityofdixon.us/citycouncil',
    arcgis: null,
    members: {},
  },
  '0623182': {
    // Fairfield
    name: 'Fairfield',
    type: 'district',
    website: 'https://www.fairfield.ca.gov/government/city-council',
    arcgis: null,
    members: {
      mayor: {
        name: 'Catherine Moy',
        photoUrl: 'https://www.fairfield.ca.gov/home/showpublishedimage/10467/638790320819170000',
        website:
          'https://www.fairfield.ca.gov/government/city-council/city-councilmembers/councilmember-catherine-moy',
      },
      2: {
        name: 'Scott Tonnesen',
        photoUrl: 'https://www.fairfield.ca.gov/home/showpublishedimage/10469/638790320885830000',
        website:
          'https://www.fairfield.ca.gov/government/city-council/city-councilmembers/councilmember-scott-tonnesen',
      },
    },
  },
  '0661922': {
    // Rio Vista
    name: 'Rio Vista',
    type: 'at-large',
    website: 'https://www.riovistacity.com/city-council/',
    arcgis: null,
    members: {},
  },
  '0675630': {
    // Suisun City
    name: 'Suisun City',
    type: 'at-large',
    website: 'https://www.suisun.com/city-government/city-council/',
    arcgis: null,
    members: {},
  },
  '0681554': {
    // Vacaville
    name: 'Vacaville',
    type: 'district',
    website: 'https://www.cityofvacaville.gov/government/city-council',
    arcgis: null,
    members: {
      mayor: {
        name: 'John Carli',
        photoUrl:
          'https://www.cityofvacaville.gov/home/showpublishedimage/17216/638066063923070000',
        website: 'https://www.cityofvacaville.gov/government/city-council',
      },
      3: {
        name: 'Michael Silva',
        photoUrl:
          'https://www.cityofvacaville.gov/home/showpublishedimage/14918/637756826501370000',
        website: 'https://www.cityofvacaville.gov/government/city-council',
      },
    },
  },
  '0681666': {
    // Vallejo
    name: 'Vallejo',
    type: 'district',
    website: 'https://www.ci.vallejo.ca.us/our_city/city_government/mayor_city_council',
    arcgis: null,
    members: {
      // Nov 2024: Andrea Sorce (Mayor), Alexander Matias (D1), Tonia Lediju (D3), Helen-Marie Gordon (D6)
      mayor: {
        name: 'Andrea Sorce',
        photoUrl:
          'https://cdnsm5-hosted.civiclive.com/UserFiles/Servers/Server_16925367/Image/City%20Hall/City%20Government/Mayor%20&%20City%20Council/Mayor%20Sorce%20web.jpg',
        website: 'https://www.ci.vallejo.ca.us/our_city/city_government/mayor_city_council',
      },
      1: { name: 'Alexander Matias' },
      3: { name: 'Tonia Lediju' },
      4: {
        name: 'Charles Palmares',
        photoUrl:
          'https://cdnsm5-hosted.civiclive.com/UserFiles/Servers/Server_16925367/Image/City%20Hall/City%20Government/Mayor%20&%20City%20Council/palmares-d4.jpg',
        website: 'https://www.ci.vallejo.ca.us/our_city/city_government/mayor_city_council',
      },
      6: { name: 'Helen-Marie Gordon' },
    },
  },

  // ========== SONOMA COUNTY ==========
  '0614190': {
    // Cloverdale
    name: 'Cloverdale',
    type: 'at-large',
    website: 'https://www.cloverdale.net/131/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Todd Lands elected
      1: { name: 'Todd Lands' },
    },
  },
  '0616462': {
    // Cotati
    name: 'Cotati',
    type: 'at-large',
    website: 'https://www.cotaticity.org/government/city-council',
    arcgis: null,
    members: {
      // Nov 2024: Susan Harvey, Laura Sparks, Ben Ford elected
      1: { name: 'Susan Harvey' },
      2: { name: 'Laura Sparks' },
      3: { name: 'Ben Ford' },
    },
  },
  '0632548': {
    // Healdsburg
    name: 'Healdsburg',
    type: 'at-large',
    website: 'https://www.ci.healdsburg.ca.us/167/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Ariel Kelley, Ron Edwards, David Hagele elected
      1: { name: 'Ariel Kelley' },
      2: { name: 'Ron Edwards' },
      3: { name: 'David Hagele' },
    },
  },
  '0656784': {
    // Petaluma
    name: 'Petaluma',
    type: 'district',
    website: 'https://cityofpetaluma.org/city-council/',
    arcgis: null,
    members: {
      // Nov 2024: Frank Quint (D4), Alexander DeCarli (D5), Brian Barnacle (D6)
      4: { name: 'Frank Quint' },
      5: { name: 'Alexander DeCarli' },
      6: { name: 'Brian Barnacle' },
    },
  },
  '0662182': {
    // Rohnert Park
    name: 'Rohnert Park',
    type: 'at-large',
    website: 'https://www.rpcity.org/government/city_council',
    arcgis: null,
    members: {},
  },
  '0670098': {
    // Santa Rosa
    name: 'Santa Rosa',
    type: 'district',
    website: 'https://www.srcity.org/172/City-Council',
    arcgis: null,
    members: {
      // Nov 2024: Eddie Alvarez (D1), Dianna MacDonald (D3), Caroline Bañuelos (D5), Natalie Rogers (D7)
      1: { name: 'Eddie Alvarez' },
      3: { name: 'Dianna MacDonald' },
      5: {
        name: 'Caroline Bañuelos',
        photoUrl: 'https://www.srcity.org/ImageRepository/Document?documentID=45051',
        website: 'https://www.srcity.org/directory.aspx?EID=378',
      },
      7: { name: 'Natalie Rogers' },
    },
  },
  '0670588': {
    // Sebastopol
    name: 'Sebastopol',
    type: 'at-large',
    website: 'https://www.ci.sebastopol.ca.us/city-council/',
    arcgis: null,
    members: {
      // Nov 2024: Neysa Hinton elected
      1: { name: 'Neysa Hinton' },
    },
  },
  '0672646': {
    // Sonoma
    name: 'Sonoma',
    type: 'at-large',
    website: 'https://www.sonomacity.org/city-council/',
    arcgis: null,
    members: {
      // Nov 2024: Sandra M. Lowe elected
      1: { name: 'Sandra M. Lowe' },
    },
  },
  '0685922': {
    // Windsor (Town)
    name: 'Windsor',
    type: 'district',
    website: 'https://www.townofwindsor.com/148/Town-Council',
    arcgis: null,
    members: {
      // Nov 2024: Rosa Reynoza (Mayor), Sam Salmon (D2), J.B. Leep (D3)
      mayor: { name: 'Rosa Reynoza' },
      2: { name: 'Sam Salmon' },
      3: { name: 'J.B. Leep' },
    },
  },
};

// Bay Area County Supervisor Data (2025)
// FIPS codes: 06075=SF, 06081=San Mateo, 06085=Santa Clara, 06001=Alameda,
//             06013=Contra Costa, 06041=Marin, 06097=Sonoma, 06055=Napa, 06095=Solano
const COUNTY_SUPERVISORS = {
  '06075': {
    // San Francisco
    name: 'San Francisco',
    arcgis:
      'https://services.arcgis.com/Zs2aNLFN00jrS4gG/arcgis/rest/services/Current_Supervisor_Districts/FeatureServer/0',
    districtField: 'supervisor',
    supervisors: {
      1: { name: 'Connie Chan', website: 'https://sfbos.org/supervisor-chan-district-1' },
      2: { name: 'Stephen Sherrill', website: 'https://sfbos.org/supervisor-sherrill-district-2' },
      3: { name: 'Danny Sauter', website: 'https://sfbos.org/supervisor-sauter-district-3' },
      4: { name: 'Alan Wong', website: 'https://sfbos.org/supervisor-wong-district-4' },
      5: { name: 'Bilal Mahmood', website: 'https://sfbos.org/supervisor-mahmood-district-5' },
      6: { name: 'Matt Dorsey', website: 'https://sfbos.org/supervisor-dorsey-district-6' },
      7: { name: 'Myrna Melgar', website: 'https://sfbos.org/supervisor-melgar-district-7' },
      8: { name: 'Rafael Mandelman', website: 'https://sfbos.org/supervisor-mandelman-district-8' },
      9: { name: 'Jackie Fielder', website: 'https://sfbos.org/supervisor-fielder-district-9' },
      10: { name: 'Shamann Walton', website: 'https://sfbos.org/supervisor-walton-district-10' },
      11: { name: 'Chyanne Chen', website: 'https://sfbos.org/supervisor-chen-district-11' },
    },
  },
  '06081': {
    // San Mateo
    name: 'San Mateo County',
    arcgis:
      'https://services.arcgis.com/yq3FgOI44hYHAFVZ/arcgis/rest/services/Supervisor_Districts/FeatureServer/0',
    districtField: 'District',
    supervisors: {
      1: { name: 'Jackie Speier', website: 'https://www.smcgov.org/district-1' },
      2: { name: 'Noelia Corzo', website: 'https://www.smcgov.org/district-2' },
      3: { name: 'Ray Mueller', website: 'https://www.smcgov.org/district-3' },
      4: { name: 'Lisa Gauthier', website: 'https://www.smcgov.org/district-4' },
      5: { name: 'David Canepa', website: 'https://www.smcgov.org/district-5' },
    },
  },
  '06085': {
    // Santa Clara
    name: 'Santa Clara County',
    arcgis:
      'https://services1.arcgis.com/4QPaqCJqF1UIaPbN/arcgis/rest/services/Santa_Clara_County_Supervisorial_Districts/FeatureServer/0',
    districtField: 'district',
    nameField: 'supervisor',
    supervisors: {
      1: { name: 'Sylvia Arenas', website: 'https://supervisorarenas.org/' },
      2: { name: 'Cindy Chavez', website: 'https://www.sccgov.org/sites/d2/' },
      3: { name: 'Otto Lee', website: 'https://www.sccgov.org/sites/d3/' },
      4: { name: 'Susan Ellenberg', website: 'https://www.sccgov.org/sites/d4/' },
      5: { name: 'Margaret Abe-Koga', website: 'https://www.sccgov.org/sites/d5/' },
    },
  },
  '06001': {
    // Alameda
    name: 'Alameda County',
    arcgis:
      'https://services5.arcgis.com/ROBnTHSNjoZ2Wm1P/arcgis/rest/services/Board_of_Supervisors_District_Boundaries/FeatureServer/0',
    districtField: 'DISTRICT_ID',
    districtMapping: { 644: 1, 645: 2, 646: 3, 647: 4, 648: 5 },
    supervisors: {
      1: { name: 'David Haubert', website: 'https://bos.alamedacountyca.gov/district-1/' },
      2: { name: 'Elisa Márquez', website: 'https://bos.alamedacountyca.gov/district-2/' },
      3: { name: 'Rebecca Kaplan', website: 'https://bos.alamedacountyca.gov/district-3/' },
      4: { name: 'Nate Miley', website: 'https://bos.alamedacountyca.gov/district-4/' },
      5: { name: 'Keith Carson', website: 'https://bos.alamedacountyca.gov/district-5/' },
    },
  },
  '06013': {
    // Contra Costa
    name: 'Contra Costa County',
    arcgis:
      'https://services3.arcgis.com/42Dx6OWonqK9LoEE/arcgis/rest/services/BOS_Find_My_Supervisor/FeatureServer/0',
    districtField: 'SUP_DIST',
    supervisors: {
      1: {
        name: 'John Gioia',
        website: 'https://www.contracosta.ca.gov/5216/District-1-Supervisor-John-M-Gioia',
        phone: '510-942-2220',
      },
      2: {
        name: 'Candace Andersen',
        website: 'https://www.contracosta.ca.gov/4668/District-2-Supervisor-Candace-Andersen',
        phone: '925-655-2300',
      },
      3: {
        name: 'Diane Burgis',
        website: 'https://www.contracosta.ca.gov/6437/District-3-Supervisor-Diane-Burgis',
        phone: '925-655-2330',
      },
      4: {
        name: 'Ken Carlson',
        website: 'https://www.contracosta.ca.gov/6291/District-4-Supervisor-Ken-Carlson',
        phone: '925-655-2350',
      },
      5: {
        name: 'Federal Glover',
        website: 'https://www.contracosta.ca.gov/781/District-5-Supervisor-Federal-Glover',
        phone: '925-608-4200',
      },
    },
  },
  '06041': {
    // Marin
    name: 'Marin County',
    arcgis:
      'https://gis.marincounty.gov/server/rest/services/PARCEL_BASED/SUPERVISOR_DIST/FeatureServer/0',
    districtField: 'SUPERVISOR_DIST',
    supervisors: {
      1: {
        name: 'Mary Sackett',
        website:
          'https://www.marincounty.gov/departments/county-administrator/board-of-supervisors/district-1',
      },
      2: {
        name: 'Brian Colbert',
        website:
          'https://www.marincounty.gov/departments/county-administrator/board-of-supervisors/district-2',
      },
      3: {
        name: 'Stephanie Moulton-Peters',
        website:
          'https://www.marincounty.gov/departments/county-administrator/board-of-supervisors/district-3',
      },
      4: {
        name: 'Dennis Rodoni',
        website:
          'https://www.marincounty.gov/departments/county-administrator/board-of-supervisors/district-4',
      },
      5: {
        name: 'Eric Lucan',
        website:
          'https://www.marincounty.gov/departments/county-administrator/board-of-supervisors/district-5',
      },
    },
  },
  '06097': {
    // Sonoma
    name: 'Sonoma County',
    arcgis:
      'https://services1.arcgis.com/P5Mv5GY5S66M8Z1Q/arcgis/rest/services/Supervisor_Districts/FeatureServer/0',
    districtField: 'DISTRICT',
    supervisors: {
      1: { name: 'Rebecca Hermosillo', website: 'https://sonomacounty.ca.gov/first-district' },
      2: { name: 'David Rabbitt', website: 'https://sonomacounty.ca.gov/second-district' },
      3: { name: 'Chris Coursey', website: 'https://sonomacounty.ca.gov/third-district' },
      4: { name: 'James Gore', website: 'https://sonomacounty.ca.gov/fourth-district' },
      5: { name: 'Lynda Hopkins', website: 'https://sonomacounty.ca.gov/fifth-district' },
    },
  },
  '06055': {
    // Napa
    name: 'Napa County',
    arcgis:
      'https://gis.countyofnapa.org/arcgis/rest/services/Hosted/Supervisor_Districts_2022/FeatureServer/0',
    districtField: 'sup_dist',
    supervisors: {
      1: { name: 'Joelle Gallagher', website: 'https://www.countyofnapa.org/1350/District-1' },
      2: { name: 'Liz Alessio', website: 'https://www.countyofnapa.org/1358/District-2' },
      3: { name: 'Anne Cottrell', website: 'https://www.countyofnapa.org/1366/District-3' },
      4: { name: 'Amber Manfree', website: 'https://www.countyofnapa.org/1372/District-4' },
      5: { name: 'Belia Ramos', website: 'https://www.countyofnapa.org/1379/District-5' },
    },
  },
  '06095': {
    // Solano
    name: 'Solano County',
    arcgis:
      'https://services2.arcgis.com/SCn6czzcqKAFwdGU/arcgis/rest/services/BOS_District_Boundaries_2021/FeatureServer/0',
    districtField: 'district',
    supervisors: {
      1: { name: 'Cassandra James', website: 'https://www.solanocounty.gov/depts/bos/district1/' },
      2: { name: 'Monica Brown', website: 'https://www.solanocounty.gov/depts/bos/district2/' },
      3: { name: 'Wanda Williams', website: 'https://www.solanocounty.gov/depts/bos/district3/' },
      4: { name: 'John Vasquez', website: 'https://www.solanocounty.gov/depts/bos/district4/' },
      5: { name: 'Mitch Mashburn', website: 'https://www.solanocounty.gov/depts/bos/district5/' },
    },
  },
};

// Custom fetch for CA Legislature (handles SSL issues)
// SECURITY: Certificate validation is disabled ONLY for leginfo.legislature.ca.gov
// which has known SSL configuration issues. This is safe because:
// 1. We only call this for the specific CA Legislature domain
// 2. The data is public legislative information, not sensitive
// 3. We validate the URL before calling this function
function fetchCALegislature(url) {
  // Validate URL is actually the CA Legislature site
  const parsedUrl = new URL(url);
  if (
    !parsedUrl.hostname.endsWith('.legislature.ca.gov') &&
    parsedUrl.hostname !== 'legislature.ca.gov'
  ) {
    return Promise.reject(new Error('fetchCALegislature only supports legislature.ca.gov domains'));
  }

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false, // CA Legislature has SSL certificate chain issues
        headers: {
          'User-Agent': 'BayNavigator/1.0',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            ok: res.statusCode === 200,
            status: res.statusCode,
            text: () => Promise.resolve(data),
          })
        );
      }
    );
    req.on('error', reject);
  });
}

module.exports = async function (context, req) {
  // CORS headers
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours (reps don't change often)
    },
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 204;
    return;
  }

  try {
    const state = req.query.state || 'CA';
    const district = req.query.district;
    const type = req.query.type || 'house'; // 'house', 'senate', 'state-assembly', 'state-senate', 'geocode'

    // Handle geocoding (address to districts)
    if (type === 'geocode') {
      const street = req.query.street;
      const city = req.query.city;
      const zip = req.query.zip;

      if (!street || !city || !zip) {
        context.res.status = 400;
        context.res.body = JSON.stringify({ error: 'street, city, and zip are required' });
        return;
      }

      const result = await geocodeAddress(street, city, zip, context);
      context.res.body = JSON.stringify(result);
      return;
    }

    // Handle CA State Legislature lookups (no API key needed)
    if (type === 'state-assembly' || type === 'state-senate') {
      const house = type === 'state-assembly' ? 'AD' : 'SD';
      const result = await getCALegislator(house, district, context);
      context.res.body = JSON.stringify(result);
      return;
    }

    // Handle county supervisor lookup
    if (type === 'county-supervisor') {
      const countyFips = req.query.county;
      const x = parseFloat(req.query.x);
      const y = parseFloat(req.query.y);

      if (!countyFips || isNaN(x) || isNaN(y)) {
        context.res.status = 400;
        context.res.body = JSON.stringify({
          error: 'county FIPS and coordinates (x, y) are required',
        });
        return;
      }

      const result = await getCountySupervisor(countyFips, x, y, context);
      context.res.body = JSON.stringify(result);
      return;
    }

    // Handle city council lookup
    if (type === 'city-council') {
      const placeGeoid = req.query.place;
      const x = parseFloat(req.query.x);
      const y = parseFloat(req.query.y);

      if (!placeGeoid) {
        context.res.status = 400;
        context.res.body = JSON.stringify({ error: 'place GEOID is required' });
        return;
      }

      const result = await getCityCouncil(placeGeoid, x, y, context);
      context.res.body = JSON.stringify(result);
      return;
    }

    // Federal lookups require API key
    if (!CONGRESS_API_KEY) {
      context.res.status = 500;
      context.res.body = JSON.stringify({ error: 'Congress API key not configured' });
      return;
    }

    let members = [];

    if (type === 'senate') {
      // Get both CA senators
      members = await getSenatorsForState(state, context);
    } else if (district) {
      // Get House rep for specific district
      members = await getHouseRepForDistrict(state, district, context);
    } else {
      context.res.status = 400;
      context.res.body = JSON.stringify({ error: 'District required for House lookup' });
      return;
    }

    context.res.body = JSON.stringify({
      state,
      district: district || null,
      type,
      members,
    });
  } catch (error) {
    context.log.error('Congress lookup error:', error);
    context.res.status = 500;
    context.res.body = JSON.stringify({ error: 'Failed to fetch member data' });
  }
};

/**
 * Get CA State Legislator info (Assembly or Senate)
 */
async function getCALegislator(house, district, context) {
  try {
    const apiUrl = `${CA_LEGISLATURE_BASE}/GetLegislatorInfo.php?House=${house}&districtNum=${district}`;
    context.log('Fetching CA legislator from:', apiUrl);

    const response = await fetchCALegislature(apiUrl);

    context.log('CA Legislature response status:', response.status);

    if (!response.ok) {
      throw new Error(`CA Legislature API error: ${response.status}`);
    }

    const html = await response.text();
    context.log('CA Legislature response:', html.substring(0, 200));

    // Parse: <a href='http://assembly.ca.gov/ad17' target='_blank'>Assemblymember Matt Haney</a>-DEM
    const match = html.match(/<a href='([^']+)'[^>]*>([^<]+)<\/a>-?(\w*)/);

    if (!match) {
      return { error: 'Could not parse legislator info', raw: html };
    }

    const [, websiteUrl, name, party] = match;
    const partyAbbrev = party === 'DEM' ? 'D' : party === 'REP' ? 'R' : party;

    // Generate photo URL(s)
    // Assembly: consistent URL pattern
    // Senate: varies by senator's website - provide multiple options for frontend to try
    const paddedDistrict = String(district).padStart(2, '0');
    let photoUrl = null;
    let photoUrlFallbacks = null;

    if (house === 'AD') {
      photoUrl = `https://webapi.assembly.ca.gov/district-media/assets/members/assembly_member_${paddedDistrict}.jpg`;
    } else {
      // Senate sites have inconsistent photo locations - try multiple patterns
      const senateBase = `https://sd${paddedDistrict}.senate.ca.gov/sites/sd${paddedDistrict}.senate.ca.gov/files`;
      photoUrl = `${senateBase}/images/sd${paddedDistrict}_headshot.jpg`;
      photoUrlFallbacks = [
        `${senateBase}/website/sd${paddedDistrict}_headshot.jpeg`,
        `${senateBase}/website/sd${paddedDistrict}_headshot.jpg`,
        `${senateBase}/images/sd${paddedDistrict}_headshot.jpeg`,
      ];
    }

    return {
      house,
      district,
      name: name.trim(),
      party,
      partyAbbrev,
      officialWebsite: websiteUrl,
      photoUrl,
      photoUrlFallbacks,
      termLength: house === 'AD' ? '2-year term' : '4-year term',
    };
  } catch (error) {
    context.log.error(
      `Error getting CA legislator for ${house}-${district}:`,
      error.message,
      error.stack
    );
    return { error: 'Failed to fetch CA legislator info', details: error.message };
  }
}

/**
 * Get current House representative for a district
 */
async function getHouseRepForDistrict(state, district, context) {
  // Get current members for this state/district
  const url = `${CONGRESS_API_BASE}/member/${state}/${district}?api_key=${CONGRESS_API_KEY}&currentMember=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Congress API error: ${response.status}`);
  }

  const data = await response.json();
  const members = data.members || [];

  // Filter to current House members only
  const currentHouseMembers = members.filter((m) => {
    const terms = m.terms?.item || [];
    // Check if they have a current House term (no endYear means current)
    return terms.some((t) => t.chamber === 'House of Representatives' && !t.endYear);
  });

  // Get detailed info for each member
  const detailedMembers = await Promise.all(
    currentHouseMembers.slice(0, 1).map((m) => getMemberDetails(m.bioguideId, context))
  );

  return detailedMembers.filter(Boolean);
}

/**
 * Get both senators for a state
 */
async function getSenatorsForState(state, context) {
  const url = `${CONGRESS_API_BASE}/member/${state}?api_key=${CONGRESS_API_KEY}&currentMember=true&limit=100`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Congress API error: ${response.status}`);
  }

  const data = await response.json();
  const members = data.members || [];

  // Filter to current Senators only
  const currentSenators = members.filter((m) => {
    const terms = m.terms?.item || [];
    return terms.some((t) => t.chamber === 'Senate' && !t.endYear);
  });

  // Get detailed info for each senator
  const detailedMembers = await Promise.all(
    currentSenators.slice(0, 2).map((m) => getMemberDetails(m.bioguideId, context))
  );

  return detailedMembers.filter(Boolean);
}

/**
 * Get detailed member info by bioguideId
 */
async function getMemberDetails(bioguideId, context) {
  try {
    const url = `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${CONGRESS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      context.log.warn(`Failed to get details for ${bioguideId}`);
      return null;
    }

    const data = await response.json();
    const member = data.member;

    if (!member) return null;

    // Get current term info
    const terms = member.terms || [];
    const currentTerm = terms.find((t) => !t.endYear) || terms[terms.length - 1];

    // Calculate next election year
    let nextElection = null;
    if (currentTerm) {
      if (currentTerm.chamber === 'Senate') {
        // Senators serve 6-year terms
        nextElection = currentTerm.startYear + 6;
      } else {
        // House members serve 2-year terms, next election is always next even year
        const currentYear = new Date().getFullYear();
        nextElection = currentYear % 2 === 0 ? currentYear : currentYear + 1;
      }
    }

    // Get party from party history
    const partyHistory = member.partyHistory || [];
    const currentParty =
      partyHistory.find((p) => !p.endYear) || partyHistory[partyHistory.length - 1];

    return {
      bioguideId: member.bioguideId,
      name: member.directOrderName || member.invertedOrderName,
      firstName: member.firstName,
      lastName: member.lastName,
      party: currentParty?.partyName || 'Unknown',
      partyAbbrev: getPartyAbbrev(currentParty?.partyName),
      state: member.state,
      district: currentTerm?.district || null,
      chamber: currentTerm?.chamber || null,
      imageUrl: member.depiction?.imageUrl || null,
      officialWebsite: member.officialWebsiteUrl || null,
      startYear: currentTerm?.startYear || null,
      nextElection,
      // Additional contact info if available
      addressInformation: member.addressInformation || null,
    };
  } catch (error) {
    context.log.error(`Error getting member details for ${bioguideId}:`, error);
    return null;
  }
}

function getPartyAbbrev(partyName) {
  if (!partyName) return '?';
  const lower = partyName.toLowerCase();
  if (lower.includes('democrat')) return 'D';
  if (lower.includes('republican')) return 'R';
  if (lower.includes('independent')) return 'I';
  return partyName.charAt(0);
}

/**
 * Geocode an address and return all district information
 */
async function geocodeAddress(street, city, zip, context) {
  try {
    // Step 1: Census Geocoder for address coordinates, congressional district, and county
    // layers=all returns all geographies including Counties
    const censusUrl = `${CENSUS_GEOCODER_BASE}?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=CA&zip=${zip}&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json`;
    context.log('Fetching Census Geocoder:', censusUrl);

    const censusResponse = await fetch(censusUrl);
    if (!censusResponse.ok) {
      throw new Error(`Census Geocoder error: ${censusResponse.status}`);
    }

    const censusData = await censusResponse.json();
    const matches = censusData?.result?.addressMatches;

    if (!matches || matches.length === 0) {
      return { error: 'Address not found. Please check and try again.' };
    }

    const match = matches[0];
    const coordinates = match.coordinates;
    const formattedAddress = match.matchedAddress;

    // Get congressional district and county
    const geographies = match.geographies || {};
    const congressionalDistricts = geographies['119th Congressional Districts'] || [];
    const congressDistrict = congressionalDistricts[0]?.BASENAME || null;

    // Get county FIPS (state + county = e.g., "06075" for San Francisco)
    const counties = geographies['Counties'] || [];
    const countyFips = counties[0]?.GEOID || null;
    const countyName = counties[0]?.BASENAME || null;

    // Get city/place info (Census Incorporated Places)
    const places = geographies['Incorporated Places'] || [];
    const placeGeoid = places[0]?.GEOID || null;
    const placeName = places[0]?.BASENAME || null;

    if (!congressDistrict) {
      return { error: 'Could not determine congressional district for this address.' };
    }

    // Step 2: ArcGIS for CA state districts
    const arcgisParams = new URLSearchParams({
      geometry: JSON.stringify({
        x: coordinates.x,
        y: coordinates.y,
        spatialReference: { wkid: 4269 },
      }),
      geometryType: 'esriGeometryPoint',
      returnGeometry: 'false',
      outFields: 'AD_2021,SD_2021',
      f: 'json',
    });

    const arcgisUrl = `${ARCGIS_DISTRICTS_BASE}?${arcgisParams}`;
    context.log('Fetching ArcGIS districts:', arcgisUrl);

    const arcgisResponse = await fetch(arcgisUrl);
    if (!arcgisResponse.ok) {
      throw new Error(`ArcGIS error: ${arcgisResponse.status}`);
    }

    const arcgisData = await arcgisResponse.json();
    const features = arcgisData?.features;

    if (!features || features.length === 0) {
      return { error: 'Could not determine state legislative districts for this address.' };
    }

    const stateDistricts = features[0].attributes;
    const assemblyDistrict = stateDistricts.AD_2021?.replace(/^0+/, '');
    const senateDistrict = stateDistricts.SD_2021?.replace(/^0+/, '');

    return {
      formattedAddress,
      coordinates,
      congressDistrict,
      assemblyDistrict,
      senateDistrict,
      countyFips,
      countyName,
      placeGeoid,
      placeName,
    };
  } catch (error) {
    context.log.error('Geocoding error:', error);
    return { error: error.message || 'Failed to geocode address' };
  }
}

/**
 * Get county supervisor for a given county and coordinates
 */
async function getCountySupervisor(countyFips, x, y, context) {
  try {
    const county = COUNTY_SUPERVISORS[countyFips];

    if (!county) {
      return { error: 'County not supported', countyFips };
    }

    // Query the county's ArcGIS layer for the supervisor district
    const arcgisParams = new URLSearchParams({
      geometry: JSON.stringify({
        x: x,
        y: y,
        spatialReference: { wkid: 4269 },
      }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      returnGeometry: 'false',
      outFields: '*',
      f: 'json',
    });

    const arcgisUrl = `${county.arcgis}/query?${arcgisParams}`;
    context.log('Fetching county supervisor district:', arcgisUrl);

    const arcgisResponse = await fetch(arcgisUrl);
    if (!arcgisResponse.ok) {
      throw new Error(`ArcGIS error: ${arcgisResponse.status}`);
    }

    const arcgisData = await arcgisResponse.json();
    const features = arcgisData?.features;

    if (!features || features.length === 0) {
      return { error: 'Could not determine supervisor district for this location' };
    }

    const attrs = features[0].attributes;
    let districtNum = attrs[county.districtField];

    // Handle special district mappings (e.g., Alameda uses DISTRICT_ID 644-648)
    if (county.districtMapping && county.districtMapping[districtNum]) {
      districtNum = county.districtMapping[districtNum];
    }

    // Parse district number from string if needed (e.g., "District 1" -> 1)
    if (typeof districtNum === 'string') {
      const match = districtNum.match(/(\d+)/);
      if (match) {
        districtNum = parseInt(match[1], 10);
      }
    }

    const supervisor = county.supervisors[districtNum];

    if (!supervisor) {
      return {
        error: 'Supervisor not found for district',
        county: county.name,
        district: districtNum,
      };
    }

    // Use live name from ArcGIS if available, otherwise fall back to our data
    const liveName = county.nameField ? attrs[county.nameField] : null;

    return {
      county: county.name,
      countyFips,
      district: districtNum,
      name: liveName || supervisor.name,
      website: supervisor.website,
      phone: supervisor.phone || null,
    };
  } catch (error) {
    context.log.error('County supervisor lookup error:', error);
    return { error: error.message || 'Failed to lookup county supervisor' };
  }
}

/**
 * Get city council member(s) for a given city/place and coordinates
 */
async function getCityCouncil(placeGeoid, x, y, context) {
  try {
    const city = CITY_COUNCILS[placeGeoid];

    if (!city) {
      // City not in our database - return a generic response
      return {
        error: 'City council data not available',
        placeGeoid,
        note: 'This location may be in an unincorporated area or a city not yet in our database.',
      };
    }

    // For at-large cities, return all members (they all represent the entire city)
    if (city.type === 'at-large' || !city.arcgis) {
      const allMembers = Object.entries(city.members).map(([seat, member]) => ({
        seat: seat === 'mayor' ? 'Mayor' : member.role || `Council Member`,
        seatNumber: seat === 'mayor' ? null : isNaN(parseInt(seat)) ? seat : parseInt(seat),
        name: member.name,
        website: member.website || null,
        phone: member.phone || null,
        photoUrl: member.photoUrl || null,
      }));

      return {
        city: city.name,
        type: city.type,
        website: city.website,
        placeGeoid,
        members: allMembers,
        note:
          city.type === 'at-large'
            ? 'All council members represent the entire city.'
            : 'District lookup not available. Showing all council members.',
      };
    }

    // For district-based cities with ArcGIS, look up the specific district
    if (!x || !y || isNaN(x) || isNaN(y)) {
      // No coordinates - return all members
      const allMembers = Object.entries(city.members).map(([seat, member]) => ({
        seat: seat === 'mayor' ? 'Mayor' : `District ${seat}`,
        seatNumber: seat === 'mayor' ? null : parseInt(seat),
        name: member.name,
        website: member.website || null,
        photoUrl: member.photoUrl || null,
      }));

      return {
        city: city.name,
        type: city.type,
        website: city.website,
        placeGeoid,
        members: allMembers,
        note: 'Coordinates not provided. Showing all council members.',
      };
    }

    // Query the city's ArcGIS layer for the council district
    const arcgisParams = new URLSearchParams({
      geometry: JSON.stringify({
        x: x,
        y: y,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      returnGeometry: 'false',
      outFields: '*',
      f: 'json',
    });

    const arcgisUrl = `${city.arcgis.url}/query?${arcgisParams}`;
    context.log('Fetching city council district:', arcgisUrl);

    const arcgisResponse = await fetch(arcgisUrl);
    if (!arcgisResponse.ok) {
      throw new Error(`ArcGIS error: ${arcgisResponse.status}`);
    }

    const arcgisData = await arcgisResponse.json();
    const features = arcgisData?.features;

    if (!features || features.length === 0) {
      // Address might be outside city limits
      return {
        error: 'Could not determine council district for this location',
        city: city.name,
        note: 'This address may be outside city limits or in an unincorporated area.',
      };
    }

    const attrs = features[0].attributes;
    let districtNum = attrs[city.arcgis.districtField];

    // Handle special district mappings (e.g., Oakland uses DISTRICT_ID 111-117)
    if (city.arcgis.districtMapping && city.arcgis.districtMapping[districtNum]) {
      districtNum = city.arcgis.districtMapping[districtNum];
    }

    // Parse district number from string if needed
    if (typeof districtNum === 'string') {
      const match = districtNum.match(/(\d+)/);
      if (match) {
        districtNum = parseInt(match[1], 10);
      }
    }

    // Get council member name - try live data from ArcGIS first
    let councilMemberName = null;
    let councilMemberPhone = null;
    let councilMemberWebsite = null;

    if (city.arcgis.nameField && attrs[city.arcgis.nameField]) {
      councilMemberName = attrs[city.arcgis.nameField];
    }
    if (city.arcgis.phoneField && attrs[city.arcgis.phoneField]) {
      councilMemberPhone = attrs[city.arcgis.phoneField];
    }
    if (city.arcgis.websiteField && attrs[city.arcgis.websiteField]) {
      councilMemberWebsite = attrs[city.arcgis.websiteField];
    }

    // Fall back to our stored data if ArcGIS doesn't have the name
    const storedMember = city.members[districtNum];
    if (!councilMemberName && storedMember) {
      councilMemberName = storedMember.name;
    }
    if (!councilMemberWebsite && storedMember?.website) {
      councilMemberWebsite = storedMember.website;
    }

    // Build response with district member + mayor (if applicable)
    const members = [];

    // Add mayor if present
    if (city.members.mayor) {
      members.push({
        seat: 'Mayor',
        seatNumber: null,
        name: city.members.mayor.name,
        website: city.members.mayor.website || null,
        photoUrl: city.members.mayor.photoUrl || null,
      });
    }

    // Add district council member
    members.push({
      seat: `District ${districtNum}`,
      seatNumber: districtNum,
      name: councilMemberName || 'Unknown',
      website: councilMemberWebsite,
      phone: councilMemberPhone,
      photoUrl: storedMember?.photoUrl || null,
    });

    // For hybrid cities (like Oakland), also include at-large members
    if (city.type === 'hybrid' && city.members['at-large']) {
      members.push({
        seat: 'At-Large',
        seatNumber: 'at-large',
        name: city.members['at-large'].name,
        website: city.members['at-large'].website || null,
        photoUrl: city.members['at-large'].photoUrl || null,
      });
    }

    return {
      city: city.name,
      type: city.type,
      website: city.website,
      placeGeoid,
      district: districtNum,
      members,
    };
  } catch (error) {
    context.log.error('City council lookup error:', error);
    return { error: error.message || 'Failed to lookup city council' };
  }
}
