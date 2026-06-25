/**
 * Carl Query Classifier - Intent detection and query classification
 * Determines what type of question the user is asking and which data sources to fetch.
 * Pure logic with no DOM or define:vars dependencies.
 */

(function () {
  'use strict';

  // ============================================
  // KEYWORD DICTIONARIES
  // ============================================

  const TRANSIT_KEYWORDS = [
    'bart',
    'caltrain',
    'muni',
    'bus',
    'train',
    'transit',
    'delay',
    'delayed',
    'late',
    'running',
    'service',
    'alert',
    'vta',
    'samtrans',
    'ac transit',
    'ferry',
    'smart train',
    'commute',
    'station',
    'schedule',
  ];

  const TRAFFIC_KEYWORDS = [
    'traffic',
    'accident',
    'crash',
    'closure',
    'closed',
    'road',
    'highway',
    'freeway',
    'bridge',
    'i-80',
    'i-280',
    'i-580',
    'i-880',
    'i-680',
    '101',
    '280',
    'bay bridge',
    'golden gate',
    'san mateo bridge',
    'dumbarton',
    'richmond bridge',
  ];

  const LIBRARY_KEYWORDS = [
    'library',
    'libraries',
    'ebook',
    'audiobook',
    'free books',
    'digital books',
    'libby',
    'hoopla',
    'kanopy',
    'streaming movies',
    'free movies',
    'linkedin learning',
    'free courses',
    'online learning',
    'language learning',
    'mango languages',
    'tutoring',
    'homework help',
    'museum pass',
    'discover and go',
    'library card',
    'learn to code',
    'coding classes',
    'rosetta stone',
    'ancestry',
    'genealogy',
    'free wifi',
    'internet access',
  ];

  const FACILITIES_KEYWORDS = [
    'community center',
    'rec center',
    'recreation center',
    'senior center',
    'public pool',
    'swimming pool',
    'gym',
    'fitness center',
    'city facility',
    'public facility',
    'community space',
    'meeting room',
    'playground',
    'park',
  ];

  const FOOD_TRUCK_KEYWORDS = [
    'food truck',
    'food cart',
    'street food',
    'cheap food',
    'affordable food',
    'food vendor',
    'mobile food',
    'lunch truck',
  ];

  const COMMUNITY_RESOURCE_KEYWORDS = [
    'food pantry',
    'food bank',
    'free food',
    'free meals',
    'soup kitchen',
    'hot meals',
    'clothing',
    'free clothes',
    'shelter',
    'homeless services',
    'emergency assistance',
    'community resources',
    '211',
    'help near me',
    'where can i get',
  ];

  const PUBLIC_SERVICES_KEYWORDS = [
    'police station',
    'police department',
    'sheriff',
    'fire station',
    'fire department',
    'hospital',
    'emergency room',
    'er',
    'urgent care',
    'medical center',
    'library branch',
    'nearest library',
    'closest hospital',
    'report crime',
    'file report',
  ];

  const PARKS_KEYWORDS = [
    'park',
    'parks',
    'playground',
    'trail',
    'hiking',
    'picnic',
    'open space',
    'nature',
    'outdoors',
    'green space',
  ];

  const LOCAL_RULES_KEYWORDS = [
    'pet',
    'pets',
    'animal',
    'chicken',
    'pig',
    'livestock',
    'fence',
    'noise',
    'permit',
    'zoning',
    'adu',
    'granny flat',
    'parking',
    'rv',
    'camper',
    'tree',
    'building',
    'rental',
    'airbnb',
    'short-term',
    'ordinance',
    'code',
    'rules',
    'allowed',
    'legal',
    'can i have',
    'am i allowed',
  ];

  const BENEFITS_KEYWORDS = [
    'food',
    'hungry',
    'groceries',
    'snap',
    'calfresh',
    'ebt',
    'health',
    'insurance',
    'medi-cal',
    'medicare',
    'medicaid',
    'housing',
    'rent',
    'shelter',
    'homeless',
    'section 8',
    'utilities',
    'pge',
    'bills',
    'electric',
    'gas',
    'cash',
    'welfare',
    'calworks',
    'ssi',
    'disability',
    'unemployment',
    'childcare',
    'daycare',
    'wic',
    'help',
    'assistance',
    'benefits',
    'qualify',
    'eligible',
    'apply',
  ];

  const EMPLOYMENT_KEYWORDS = [
    'job',
    'jobs',
    'employment',
    'unemployed',
    'unemployment',
    'career',
    'resume',
    'hiring',
    'work',
    'laid off',
    'fired',
    'edd',
    'job training',
    'workforce',
  ];

  const LEGAL_KEYWORDS = [
    'lawyer',
    'attorney',
    'legal aid',
    'legal help',
    'tenant rights',
    'eviction',
    'landlord',
    'immigration lawyer',
    'custody',
    'divorce',
    'court',
    'sue',
    'lawsuit',
  ];

  const EDUCATION_KEYWORDS = [
    'college',
    'university',
    'tuition',
    'financial aid',
    'fafsa',
    'scholarship',
    'ged',
    'adult school',
    'esl',
    'english class',
    'tutoring',
    'head start',
    'preschool',
    'school meals',
  ];

  const SENIOR_KEYWORDS = [
    'senior',
    'elderly',
    'older adult',
    'medicare',
    'retirement',
    'social security',
    'aging',
    'meals on wheels',
    '65',
    'over 60',
  ];

  const VETERAN_KEYWORDS = [
    'veteran',
    'military',
    'va ',
    'va benefits',
    'gi bill',
    'service member',
    'armed forces',
    'army',
    'navy',
    'marine',
    'air force',
  ];

  const DISABILITY_KEYWORDS = [
    'disability',
    'disabled',
    'ssi',
    'ssdi',
    'ada',
    'accessible',
    'wheelchair',
    'paratransit',
    'blind',
    'deaf',
    'special needs',
  ];

  const IMMIGRANT_KEYWORDS = [
    'immigrant',
    'immigration',
    'refugee',
    'asylum',
    'daca',
    'visa',
    'citizenship',
    'naturalization',
    'undocumented',
    'green card',
    'uscis',
  ];

  const CRISIS_KEYWORDS = [
    'suicide',
    'kill myself',
    'want to die',
    'crisis',
    'domestic violence',
    'abuse',
    'assault',
    'safe surrender',
    'emergency',
    'danger',
    'threatened',
    'hurt',
    'unsafe',
  ];

  const SPORTS_KEYWORDS = [
    'giants',
    'warriors',
    '49ers',
    'niners',
    'sharks',
    'dubs',
    'dub nation',
    'niner faithful',
    'bang bang niner gang',
    'mlb',
    'nba',
    'nfl',
    'nhl',
    'baseball',
    'basketball',
    'football',
    'hockey',
    'game',
    'score',
    'standings',
    'playoff',
    'season',
    'roster',
    'schedule',
    'next game',
    'last game',
    'record',
    'oracle park',
    'chase center',
    "levi's stadium",
    'sap center',
  ];

  // ============================================
  // QUERY TYPE DETECTORS
  // ============================================

  function isTransitQuery(text) {
    var lower = text.toLowerCase();
    return TRANSIT_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isTrafficQuery(text) {
    var lower = text.toLowerCase();
    return TRAFFIC_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isLibraryQuery(text) {
    var lower = text.toLowerCase();
    return LIBRARY_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isFacilitiesQuery(text) {
    var lower = text.toLowerCase();
    return FACILITIES_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isFoodTruckQuery(text) {
    var lower = text.toLowerCase();
    return FOOD_TRUCK_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isParksQuery(text) {
    var lower = text.toLowerCase();
    return PARKS_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isCommunityResourceQuery(text) {
    var lower = text.toLowerCase();
    return COMMUNITY_RESOURCE_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  function isPublicServicesQuery(text) {
    var lower = text.toLowerCase();
    return PUBLIC_SERVICES_KEYWORDS.some(function (kw) {
      return lower.includes(kw);
    });
  }

  // ============================================
  // DATA SOURCE INFERENCE (regex fallback)
  // ============================================

  function inferDataSourcesFromRegex(message, category) {
    var sources = [];
    if (
      [
        'food',
        'health',
        'housing',
        'legal',
        'employment',
        'education',
        'seniors',
        'veterans',
        'disability',
        'pets',
        'general',
      ].includes(category)
    ) {
      sources.push('meilisearch');
    }
    if (isTransitQuery(message)) sources.push('transit_alerts');
    if (isTrafficQuery(message)) sources.push('traffic');
    if (isLibraryQuery(message)) sources.push('library');
    if (isFacilitiesQuery(message)) sources.push('facilities');
    if (isParksQuery(message)) sources.push('parks');
    if (isFoodTruckQuery(message)) sources.push('food_vendors');
    if (isCommunityResourceQuery(message)) sources.push('community_resources');
    if (isPublicServicesQuery(message) || isLibraryQuery(message)) sources.push('public_services');
    if (
      category === 'local_rules' ||
      LOCAL_RULES_KEYWORDS.some(function (kw) {
        return message.toLowerCase().includes(kw);
      })
    ) {
      sources.push('municipal_code');
    }
    if (
      category === 'legal' ||
      /california law|state law|ca law|tenant rights|landlord|eviction|wage|overtime|workers? comp/i.test(
        message
      )
    ) {
      sources.push('california_law');
    }
    if (
      category === 'sports' ||
      /giants?|warriors?|49ers?|niners?|dubs|dub nation|nfl|nba|mlb|game tonight|score|standings|playoff/i.test(
        message
      )
    ) {
      sources.push('sports');
    }
    if (
      category === 'museums' ||
      /\bmuseum|\bzoo\b|aquarium|planetarium|exploratorium|botanical garden|conservatory|\bgallery\b|museums for all|discover (and|&) go|blue star|free (admission|first (tue|wed|thu|sat|sun))/i.test(
        message
      )
    ) {
      sources.push('museums');
    }
    return sources;
  }

  // ============================================
  // QUERY CLASSIFICATION
  // ============================================

  function classifyQueryType(text) {
    var lower = text.toLowerCase();

    if (
      CRISIS_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'crisis';
    if (
      SPORTS_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'sports';
    if (isTransitQuery(text)) return 'transit';
    if (isTrafficQuery(text)) return 'traffic';
    if (
      LOCAL_RULES_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'local_rules';
    if (isPublicServicesQuery(text)) return 'public_services';
    if (isCommunityResourceQuery(text)) return 'community_resources';
    if (isFoodTruckQuery(text)) return 'food_trucks';
    if (
      SENIOR_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'senior_benefits';
    if (
      VETERAN_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'veteran_benefits';
    if (
      DISABILITY_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'disability_benefits';
    if (
      IMMIGRANT_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'immigrant_services';
    if (
      EMPLOYMENT_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'employment';
    if (
      LEGAL_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'legal';
    if (
      EDUCATION_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'education';
    if (
      BENEFITS_KEYWORDS.some(function (kw) {
        return lower.includes(kw);
      })
    )
      return 'benefits';
    if (isLibraryQuery(text)) return 'library';
    if (isFacilitiesQuery(text)) return 'facilities';

    return 'general';
  }

  // ============================================
  // CONTEXT REQUIREMENTS
  // ============================================

  function hasRequiredContext(queryType, userLocation, userProfile) {
    var hasCity = !!(userLocation && (userLocation.city || userLocation.zip));
    var hasCounty = !!(
      (userLocation && userLocation.county) ||
      (userProfile && userProfile.county)
    );

    switch (queryType) {
      case 'crisis':
      case 'transit':
      case 'traffic':
        return true;

      case 'local_rules':
      case 'public_services':
        return hasCity;

      case 'community_resources':
      case 'food_trucks':
      case 'facilities':
      case 'library':
        return hasCity || hasCounty;

      case 'senior_benefits':
      case 'veteran_benefits':
      case 'disability_benefits':
      case 'immigrant_services':
      case 'employment':
      case 'legal':
      case 'education':
      case 'benefits':
        return hasCounty;

      default:
        return true;
    }
  }

  function getContextQuestion(queryType, userLocation, userProfile) {
    var hasCity = !!(userLocation && (userLocation.city || userLocation.zip));
    var hasCounty = !!(
      (userLocation && userLocation.county) ||
      (userProfile && userProfile.county)
    );
    var hasLocation = hasCity || hasCounty;

    switch (queryType) {
      case 'crisis':
        return null;

      case 'local_rules':
        if (!hasCity)
          return "Good question! Local rules vary by city. What's your city or ZIP code?";
        break;

      case 'public_services':
        if (!hasCity) return "I can help you find that! What's your city or ZIP code?";
        break;

      case 'community_resources':
        if (!hasLocation)
          return "I'd love to help you find resources nearby. What's your city or ZIP code?";
        break;

      case 'food_trucks':
        if (!hasLocation) return "I can check what's around! What's your city or ZIP code?";
        break;

      case 'senior_benefits':
        if (!hasLocation)
          return "Happy to help! What's your city or ZIP code? That'll help me find senior programs near you.";
        break;

      case 'veteran_benefits':
        if (!hasLocation)
          return "Thank you for your service! What's your city or ZIP code? I'll find VA resources and veteran programs near you.";
        break;

      case 'disability_benefits':
        if (!hasLocation)
          return "I can help with that! What's your city or ZIP code? That'll help me find the right programs and services.";
        break;

      case 'immigrant_services':
        if (!hasLocation)
          return "I can help find resources for you. What's your city or ZIP code? Many services are available regardless of immigration status.";
        break;

      case 'employment':
        if (!hasLocation) return "Let's find job resources for you! What's your city or ZIP code?";
        break;

      case 'legal':
        if (!hasLocation)
          return "I can help you find legal assistance. What's your city or ZIP code? Many areas have free legal aid.";
        break;

      case 'education':
        if (!hasLocation)
          return "Great that you're looking into education! What's your city or ZIP code so I can find programs near you?";
        break;

      case 'benefits':
        if (!hasLocation)
          return "I can help with that! What's your city or ZIP code? And if you're comfortable sharing, your birth year can help me find the right programs.";
        break;

      case 'facilities':
      case 'library':
        if (!hasLocation)
          return "Sure! What's your city or ZIP code so I can find what's near you?";
        break;
    }

    return null;
  }

  // ============================================
  // TRANSIT AGENCY DETECTION
  // ============================================

  function detectTransitAgency(text) {
    var lower = text.toLowerCase();
    if (lower.includes('bart')) return 'BA';
    if (lower.includes('caltrain')) return 'CT';
    if (lower.includes('muni')) return 'SF';
    if (lower.includes('vta')) return 'SC';
    if (lower.includes('samtrans')) return 'SM';
    if (lower.includes('ac transit') || lower.includes('actransit')) return 'AC';
    if (lower.includes('golden gate ferry')) return 'GF';
    if (lower.includes('golden gate') && !lower.includes('bridge')) return 'GG';
    if (lower.includes('sf bay ferry') || lower.includes('bay ferry')) return 'SB';
    if (lower.includes('smart train') || lower.includes('smart rail')) return 'SA';
    if (lower.includes('ace') && lower.includes('train')) return 'CE';
    if (lower.includes('capitol corridor')) return 'AM';
    if (lower.includes('county connection')) return 'CC';
    if (lower.includes('wheels') && lower.includes('bus')) return 'WH';
    if (lower.includes('marin transit')) return 'MA';
    if (lower.includes('tri delta') || lower.includes('tridelta')) return '3D';
    if (lower.includes('westcat')) return 'WC';
    return null;
  }

  // Expose globally
  window.CarlClassifier = {
    isTransitQuery: isTransitQuery,
    isTrafficQuery: isTrafficQuery,
    isLibraryQuery: isLibraryQuery,
    isFacilitiesQuery: isFacilitiesQuery,
    isFoodTruckQuery: isFoodTruckQuery,
    isParksQuery: isParksQuery,
    isCommunityResourceQuery: isCommunityResourceQuery,
    isPublicServicesQuery: isPublicServicesQuery,
    inferDataSourcesFromRegex: inferDataSourcesFromRegex,
    classifyQueryType: classifyQueryType,
    hasRequiredContext: hasRequiredContext,
    getContextQuestion: getContextQuestion,
    detectTransitAgency: detectTransitAgency,
  };
})();
