/**
 * Carl Data Loaders - Fetches and formats data from APIs and caches
 * Handles transit alerts, traffic events, open data (facilities, parks, food vendors),
 * city contacts, municipal codes, California codes/resources, and location parsing.
 * Pure data-fetching logic with no DOM dependencies.
 */

(function () {
  'use strict';

  // ============================================
  // TRANSIT ALERTS
  // ============================================

  var transitAlertsCache = null;
  var transitAlertsCacheTime = 0;
  var TRANSIT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  async function fetchTransitAlerts(agencyFilter) {
    agencyFilter = agencyFilter || null;
    try {
      var now = Date.now();
      if (transitAlertsCache && now - transitAlertsCacheTime < TRANSIT_CACHE_TTL) {
        var alerts = agencyFilter
          ? transitAlertsCache.filter(function (a) {
              return a.agencyId === agencyFilter;
            })
          : transitAlertsCache;
        return alerts;
      }

      var response = await fetch(
        'https://baytides-integrity.azurewebsites.net/api/transit-alerts',
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        console.warn('Transit alerts API returned', response.status);
        return [];
      }

      var data = await response.json();
      transitAlertsCache = data.alerts || [];
      transitAlertsCacheTime = now;

      if (agencyFilter) {
        return transitAlertsCache.filter(function (a) {
          return a.agencyId === agencyFilter;
        });
      }
      return transitAlertsCache;
    } catch (error) {
      console.warn('Failed to fetch transit alerts:', error);
      return [];
    }
  }

  // ============================================
  // TRAFFIC EVENTS
  // ============================================

  var trafficEventsCache = null;
  var trafficEventsCacheTime = 0;
  var TRAFFIC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async function fetchTrafficEvents() {
    try {
      var now = Date.now();
      if (trafficEventsCache && now - trafficEventsCacheTime < TRAFFIC_CACHE_TTL) {
        return trafficEventsCache;
      }

      var response = await fetch('/api/traffic-events.json', {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.warn('Traffic events API returned', response.status);
        return [];
      }

      var data = await response.json();
      trafficEventsCache = data.features || [];
      trafficEventsCacheTime = now;
      return trafficEventsCache;
    } catch (error) {
      console.warn('Failed to fetch traffic events:', error);
      return [];
    }
  }

  // ============================================
  // OPEN DATA CACHE (Pre-synced from Socrata portals)
  // ============================================

  var openDataCache = null;

  async function loadOpenDataCache() {
    if (openDataCache) return openDataCache;
    try {
      var response = await fetch('/data/open-data-cache.json', {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        openDataCache = await response.json();
        console.log('Loaded open data cache:', openDataCache.totals?.total, 'items');
      }
    } catch (error) {
      console.warn('Failed to load open data cache:', error);
    }
    return openDataCache;
  }

  async function fetchFacilities(cityOrCounty, facilityType) {
    cityOrCounty = cityOrCounty || null;
    facilityType = facilityType || null;
    var cache = await loadOpenDataCache();
    if (!cache) return [];

    var facilities = [];

    if (cityOrCounty) {
      var lower = cityOrCounty.toLowerCase();
      for (var city in cache.byCity || {}) {
        if (city.toLowerCase().includes(lower)) {
          facilities.push.apply(
            facilities,
            (cache.byCity[city] || []).filter(function (i) {
              return i.type === 'facility';
            })
          );
        }
      }
      for (var county in cache.byCounty || {}) {
        if (county.toLowerCase().includes(lower)) {
          facilities.push.apply(
            facilities,
            (cache.byCounty[county] || []).filter(function (i) {
              return i.type === 'facility';
            })
          );
        }
      }
    } else {
      facilities = cache.facilities || [];
    }

    if (facilityType) {
      var typeLower = facilityType.toLowerCase();
      facilities = facilities.filter(function (f) {
        var name = (f.name || '').toLowerCase();
        var dept = (f.department || '').toLowerCase();
        var cat = (f.category || '').toLowerCase();
        return name.includes(typeLower) || dept.includes(typeLower) || cat.includes(typeLower);
      });
    }

    return facilities.slice(0, 15);
  }

  async function fetchParks(cityOrCounty) {
    cityOrCounty = cityOrCounty || null;
    var cache = await loadOpenDataCache();
    if (!cache) return [];

    var parks = [];

    if (cityOrCounty) {
      var lower = cityOrCounty.toLowerCase();
      for (var city in cache.byCity || {}) {
        if (city.toLowerCase().includes(lower)) {
          parks.push.apply(
            parks,
            (cache.byCity[city] || []).filter(function (i) {
              return i.type === 'park';
            })
          );
        }
      }
      for (var county in cache.byCounty || {}) {
        if (county.toLowerCase().includes(lower)) {
          parks.push.apply(
            parks,
            (cache.byCounty[county] || []).filter(function (i) {
              return i.type === 'park';
            })
          );
        }
      }
    } else {
      parks = cache.parks || [];
    }

    return parks.slice(0, 15);
  }

  async function fetchFoodVendors(location) {
    location = location || null;
    var cache = await loadOpenDataCache();
    if (!cache) return [];

    var vendors = cache.food_vendors || [];

    if (location) {
      var lower = location.toLowerCase();
      var filtered = vendors.filter(function (v) {
        var loc = (v.location || '').toLowerCase();
        var addr = (v.address || '').toLowerCase();
        return loc.includes(lower) || addr.includes(lower);
      });
      if (filtered.length > 0) vendors = filtered;
    }

    return vendors.slice(0, 12);
  }

  // ============================================
  // FORMAT HELPERS
  // ============================================

  function formatFacilitiesForContext(facilities) {
    if (!facilities || facilities.length === 0) return '';

    var context = '\n\n[PUBLIC FACILITIES]:\n';
    context += 'Public facilities the user can visit:\n\n';

    facilities.slice(0, 8).forEach(function (f) {
      context += '- **' + f.name + '**';
      if (f.address) context += ' - ' + f.address;
      if (f.city) context += ', ' + f.city;
      if (f.department) context += ' (' + f.department + ')';
      context += '\n';
    });

    context += '\nMention relevant facilities by name. These are free public spaces.';
    return context;
  }

  function formatParksForContext(parks) {
    if (!parks || parks.length === 0) return '';

    var context = '\n\n[PARKS & RECREATION]:\n';
    context += 'Parks and open spaces nearby:\n\n';

    parks.slice(0, 8).forEach(function (p) {
      context += '- **' + p.name + '**';
      if (p.address) context += ' - ' + p.address;
      if (p.city) context += ', ' + p.city;
      if (p.acres) context += ' (' + p.acres + ' acres)';
      context += '\n';
    });

    context += '\nThese are free public parks and open spaces.';
    return context;
  }

  function formatFoodVendorsForContext(vendors) {
    if (!vendors || vendors.length === 0) return '';

    var context = '\n\n[FOOD VENDORS]:\n';
    context += 'Food vendors in the area:\n\n';

    vendors.slice(0, 8).forEach(function (v) {
      context += '- **' + v.name + '**';
      if (v.foodItems) context += ': ' + v.foodItems.substring(0, 60);
      if (v.location) context += ' (' + v.location + ')';
      context += '\n';
    });

    context += '\nThese are permitted food vendors. Often have affordable options.';
    return context;
  }

  // ============================================
  // CITY CONTACTS
  // ============================================

  var cityContactsCache = null;

  async function loadCityContacts() {
    if (cityContactsCache) return cityContactsCache;
    try {
      var response = await fetch('/api/city-contacts.json');
      if (response.ok) {
        var data = await response.json();
        cityContactsCache = data.contacts || [];
        return cityContactsCache;
      }
    } catch (e) {
      console.error('Failed to load city contacts:', e);
    }
    return [];
  }

  async function searchCityContacts(query, location) {
    location = location || null;
    var contacts = await loadCityContacts();
    if (!contacts.length) return null;

    var queryLower = query.toLowerCase();

    var cityQueryKeywords = [
      'city hall',
      'city council',
      'mayor',
      'clerk',
      'police',
      'fire department',
      'public works',
      'planning',
      'building',
      'permit',
      'zoning',
      'parks',
      'recreation',
      'library',
      'phone number',
      'contact',
      'email',
      'call',
      'department',
      'office',
      'government',
    ];

    var isCityQuery = cityQueryKeywords.some(function (kw) {
      return queryLower.includes(kw);
    });
    if (!isCityQuery) return null;

    var matchedCity = null;

    for (var i = 0; i < contacts.length; i++) {
      if (queryLower.includes(contacts[i].name.toLowerCase())) {
        matchedCity = contacts[i];
        break;
      }
    }

    if (!matchedCity && location && location.city) {
      matchedCity = contacts.find(function (c) {
        return c.name.toLowerCase() === location.city.toLowerCase();
      });
    }

    if (!matchedCity) return null;

    var deptKeywords = {
      police: ['Police'],
      fire: ['Fire'],
      parks: ['Parks', 'Recreation'],
      recreation: ['Parks', 'Recreation'],
      planning: ['Planning', 'Building', 'Development'],
      building: ['Planning', 'Building'],
      permit: ['Planning', 'Building'],
      'public works': ['Public Works'],
      library: ['Library'],
      'city hall': ['City Hall', 'General', 'Directory'],
      council: ['City Hall', 'General'],
      clerk: ['City Hall', 'General', 'Clerk'],
      finance: ['Finance'],
      housing: ['Housing'],
      transportation: ['Transportation'],
    };

    var relevantDepts = [];
    for (var keyword in deptKeywords) {
      if (queryLower.includes(keyword)) {
        relevantDepts.push.apply(relevantDepts, deptKeywords[keyword]);
      }
    }

    if (relevantDepts.length === 0) {
      relevantDepts = ['General', 'Directory', 'City Hall'];
    }

    var matchedDepts = matchedCity.departments.filter(function (d) {
      return relevantDepts.some(function (rd) {
        return d.name.toLowerCase().includes(rd.toLowerCase());
      });
    });

    var deptsToShow = matchedDepts.length > 0 ? matchedDepts : matchedCity.departments.slice(0, 3);

    return {
      city: matchedCity.name,
      county: matchedCity.county,
      website: matchedCity.website,
      departments: deptsToShow,
    };
  }

  // ============================================
  // MUNICIPAL CODES
  // ============================================

  var municipalCodesCache = null;

  async function loadMunicipalCodes() {
    if (municipalCodesCache) return municipalCodesCache;
    try {
      var response = await fetch('/api/municipal-codes.json');
      if (response.ok) {
        municipalCodesCache = await response.json();
        return municipalCodesCache;
      }
    } catch (e) {
      console.error('Failed to load municipal codes:', e);
    }
    return [];
  }

  async function searchMunicipalCode(query, location) {
    location = location || null;
    var data = await loadMunicipalCodes();
    var codes = data && data.codes ? data.codes : [];
    if (!codes.length) return null;

    var queryLower = query.toLowerCase();

    var codeQueryKeywords = [
      'code',
      'ordinance',
      'law',
      'regulation',
      'rule',
      'legal',
      'permit',
      'license',
      'zoning',
      'building code',
      'noise',
      'parking',
      'adu',
      'granny unit',
      'accessory dwelling',
      'rental',
      'rent control',
      'tenant',
      'landlord',
      'eviction',
      'business license',
      'home business',
      'food truck',
      'fence',
      'tree',
      'setback',
      'height limit',
      'short-term rental',
      'airbnb',
      'vrbo',
      'pet',
      'dog',
      'chicken',
      'animal',
      'sign',
      'signage',
      'billboard',
      'allowed',
      'prohibited',
      'illegal',
      'legal',
      'how many',
      'can i',
      'am i allowed',
      'is it legal',
    ];

    var isCodeQuery = codeQueryKeywords.some(function (kw) {
      return queryLower.includes(kw);
    });
    if (!isCodeQuery) return null;

    var matchedCode = null;

    for (var i = 0; i < codes.length; i++) {
      var nameLower = codes[i].name.toLowerCase();
      if (
        queryLower.includes(nameLower) ||
        (codes[i].type === 'County' &&
          queryLower.includes(codes[i].county.toLowerCase() + ' county'))
      ) {
        matchedCode = codes[i];
        break;
      }
    }

    if (!matchedCode && location) {
      if (location.city) {
        matchedCode = codes.find(function (c) {
          return c.name.toLowerCase() === location.city.toLowerCase() && c.type === 'City';
        });
      }
      if (!matchedCode && location.county) {
        matchedCode = codes.find(function (c) {
          return c.county.toLowerCase() === location.county.toLowerCase() && c.type === 'County';
        });
      }
    }

    if (!matchedCode) return null;

    var topics = [];
    if (/noise|loud|party|music|quiet hours/i.test(queryLower)) topics.push('noise ordinances');
    if (/parking|rv|vehicle|street parking/i.test(queryLower)) topics.push('parking regulations');
    if (/adu|granny|accessory dwelling|in-law/i.test(queryLower))
      topics.push('ADU/accessory dwelling units');
    if (/rent|tenant|landlord|eviction|lease/i.test(queryLower))
      topics.push('rental/tenant protections');
    if (/business|license|home occupation/i.test(queryLower)) topics.push('business regulations');
    if (/pet|dog|cat|chicken|animal/i.test(queryLower)) topics.push('animal regulations');
    if (/fence|wall|hedge|height/i.test(queryLower)) topics.push('fence/wall height limits');
    if (/tree|removal|protected/i.test(queryLower)) topics.push('tree regulations');
    if (/airbnb|vrbo|short.?term|vacation rental/i.test(queryLower))
      topics.push('short-term rentals');
    if (/sign|signage|billboard/i.test(queryLower)) topics.push('sign regulations');
    if (/building|permit|construction/i.test(queryLower)) topics.push('building permits');
    if (/zoning|land use|residential|commercial/i.test(queryLower)) topics.push('zoning');

    return {
      name: matchedCode.name,
      type: matchedCode.type,
      county: matchedCode.county,
      codeUrl: matchedCode.municipalCodeUrl,
      platform: matchedCode.platform,
      topics: topics.length > 0 ? topics : null,
    };
  }

  // ============================================
  // CALIFORNIA STATE CODES
  // ============================================

  var californiaCodesCache = null;

  async function loadCaliforniaCodes() {
    if (californiaCodesCache) return californiaCodesCache;
    try {
      var response = await fetch('/api/california-codes.json');
      if (response.ok) {
        californiaCodesCache = await response.json();
        return californiaCodesCache;
      }
    } catch (e) {
      console.error('Failed to load California codes:', e);
    }
    return null;
  }

  async function searchCaliforniaCode(query) {
    var data = await loadCaliforniaCodes();
    if (!data) return null;

    var queryLower = query.toLowerCase();

    var stateKeywords = [
      'california law',
      'state law',
      'ca law',
      'labor law',
      'employment law',
      'worker rights',
      'tenant rights',
      'landlord tenant',
      'rent control state',
      'vehicle code',
      'dmv',
      'driver license',
      'unemployment',
      'edd',
      'disability insurance',
      'paid family leave',
      'calfresh',
      'calworks',
      'medi-cal eligibility',
      'minimum wage california',
      'overtime law',
      'meal break',
      'rest break',
      'small claims',
      'eviction law california',
      'child custody',
      'child support',
      'divorce california',
      'workers comp',
      'workplace safety',
      'california constitution',
    ];

    var isStateQuery = stateKeywords.some(function (kw) {
      return queryLower.includes(kw);
    });
    if (!isStateQuery) return null;

    var relevantCodes = [];

    for (var i = 0; i < data.codes.length; i++) {
      var code = data.codes[i];
      var topics = code.topics || [];
      if (
        topics.some(function (topic) {
          return queryLower.includes(topic.toLowerCase());
        })
      ) {
        relevantCodes.push(code);
      }
    }

    if (/tenant|landlord|rent|lease|security deposit|eviction/.test(queryLower)) {
      var civCode = data.codes.find(function (c) {
        return c.code === 'CIV';
      });
      if (civCode && !relevantCodes.includes(civCode)) relevantCodes.push(civCode);
    }
    if (/wage|overtime|break|paycheck|fired|workplace|employee|employer/.test(queryLower)) {
      var labCode = data.codes.find(function (c) {
        return c.code === 'LAB';
      });
      if (labCode && !relevantCodes.includes(labCode)) relevantCodes.push(labCode);
    }
    if (/unemploy|edd|disability|paid.?family.?leave|pfl/.test(queryLower)) {
      var uicCode = data.codes.find(function (c) {
        return c.code === 'UIC';
      });
      if (uicCode && !relevantCodes.includes(uicCode)) relevantCodes.push(uicCode);
    }
    if (/dmv|license|registration|traffic|parking ticket|dui/.test(queryLower)) {
      var vehCode = data.codes.find(function (c) {
        return c.code === 'VEH';
      });
      if (vehCode && !relevantCodes.includes(vehCode)) relevantCodes.push(vehCode);
    }
    if (/divorce|custody|child support|marriage|domestic partner/.test(queryLower)) {
      var famCode = data.codes.find(function (c) {
        return c.code === 'FAM';
      });
      if (famCode && !relevantCodes.includes(famCode)) relevantCodes.push(famCode);
    }
    if (/calfresh|calworks|foster|welfare|food stamps/.test(queryLower)) {
      var wicCode = data.codes.find(function (c) {
        return c.code === 'WIC';
      });
      if (wicCode && !relevantCodes.includes(wicCode)) relevantCodes.push(wicCode);
    }
    if (/constitution/.test(queryLower)) {
      relevantCodes.unshift({
        code: 'CONS',
        name: data.constitution.name,
        url: data.constitution.url,
      });
    }

    if (relevantCodes.length === 0) return null;

    return {
      searchUrl: data.searchUrl,
      codes: relevantCodes.slice(0, 3),
    };
  }

  // ============================================
  // CALIFORNIA STATE RESOURCES
  // ============================================

  var californiaResourcesCache = null;

  async function loadCaliforniaResources() {
    if (californiaResourcesCache) return californiaResourcesCache;
    try {
      var response = await fetch('/api/california-resources.json');
      if (response.ok) {
        californiaResourcesCache = await response.json();
        return californiaResourcesCache;
      }
    } catch (e) {
      console.error('Failed to load California resources:', e);
    }
    return null;
  }

  async function searchCaliforniaResources(query) {
    var data = await loadCaliforniaResources();
    if (!data) return null;

    var queryLower = query.toLowerCase();

    var stateServiceKeywords = [
      'edd',
      'unemployment',
      'disability insurance',
      'paid family leave',
      'dmv',
      'driver license',
      'real id',
      'vehicle registration',
      'ftb',
      'state tax',
      'california tax',
      'medi-cal',
      'covered california',
      'health insurance',
      'calfresh',
      'food stamps',
      'calworks',
      'welfare',
      'birth certificate',
      'vital records',
      'wage claim',
      'labor board',
      'unpaid wages',
      'discrimination',
      'civil rights',
      'dfeh',
      'consumer complaint',
      'attorney general',
      'state agency',
      'california department',
    ];

    var isStateServiceQuery = stateServiceKeywords.some(function (kw) {
      return queryLower.includes(kw);
    });
    if (!isStateServiceQuery) return null;

    var matchedAgencies = [];
    for (var i = 0; i < data.keyAgencies.length; i++) {
      var agency = data.keyAgencies[i];
      var abbrevMatch = queryLower.includes(agency.abbrev.toLowerCase());
      var nameMatch = queryLower.includes(agency.name.toLowerCase());
      var serviceMatch =
        agency.services &&
        agency.services.some(function (s) {
          return queryLower.includes(s.toLowerCase());
        });
      if (abbrevMatch || nameMatch || serviceMatch) {
        matchedAgencies.push(agency);
      }
    }

    var matchedServices = [];
    for (var j = 0; j < data.popularServices.length; j++) {
      var service = data.popularServices[j];
      var sNameMatch = service.name
        .toLowerCase()
        .split(' ')
        .some(function (word) {
          return word.length > 3 && queryLower.includes(word);
        });
      if (sNameMatch) matchedServices.push(service);
    }

    var matchedHelplines = [];
    for (var k = 0; k < data.helplines.length; k++) {
      var helpline = data.helplines[k];
      var hNameMatch = helpline.name
        .toLowerCase()
        .split(' ')
        .some(function (word) {
          return word.length > 3 && queryLower.includes(word);
        });
      if (hNameMatch) matchedHelplines.push(helpline);
    }

    if (
      matchedAgencies.length === 0 &&
      matchedServices.length === 0 &&
      matchedHelplines.length === 0
    ) {
      return null;
    }

    return {
      agencies: matchedAgencies.slice(0, 2),
      services: matchedServices.slice(0, 3),
      helplines: matchedHelplines.slice(0, 2),
      portal: data.portals.main,
    };
  }

  // ============================================
  // LOCATION-ONLY MESSAGE DETECTION
  // ============================================

  function isLocationOnlyMessage(text, hadLocationBefore) {
    var lower = text.toLowerCase().trim();
    var words = lower.split(/\s+/).filter(function (w) {
      return w.length > 0;
    });

    if (words.length <= 3) {
      if (/^\d{5}$/.test(lower.replace(/\s/g, ''))) return true;
      var cityPatterns = [
        'oakland',
        'berkeley',
        'fremont',
        'hayward',
        'san jose',
        'sunnyvale',
        'sf',
        'san francisco',
        'daly city',
        'richmond',
        'concord',
        'vallejo',
        'santa rosa',
        'palo alto',
        'mountain view',
        'redwood city',
        'san mateo',
        'walnut creek',
        'pleasanton',
        'livermore',
        'san rafael',
        'napa',
        'petaluma',
      ];
      if (
        cityPatterns.some(function (city) {
          return lower === city || lower === city.replace(' ', '');
        })
      )
        return true;
    }

    var locationFillers = [
      'i am in',
      "i'm in",
      'im in',
      'i live in',
      'my zip is',
      'zip code is',
      'in',
    ];
    var stripped = locationFillers
      .reduce(function (s, f) {
        return s.replace(f, '');
      }, lower)
      .trim();
    if (/^[\w\s]+\s*\d{0,5}$/.test(stripped) && stripped.length < 25) return true;

    var helpKeywords = [
      'help',
      'need',
      'looking for',
      'find',
      'where',
      'how',
      'what',
      'can i',
      'food',
      'housing',
      'rent',
      'medical',
      'health',
      'bill',
      'utility',
      'job',
      'assistance',
      'program',
      'benefit',
      'apply',
      'qualify',
      'eligible',
    ];
    var hasHelpIntent = helpKeywords.some(function (kw) {
      return lower.includes(kw);
    });

    if (!hadLocationBefore && !hasHelpIntent) {
      return true;
    }

    return false;
  }

  // Expose globally
  window.CarlDataLoaders = {
    fetchTransitAlerts: fetchTransitAlerts,
    fetchTrafficEvents: fetchTrafficEvents,
    loadOpenDataCache: loadOpenDataCache,
    fetchFacilities: fetchFacilities,
    fetchParks: fetchParks,
    fetchFoodVendors: fetchFoodVendors,
    formatFacilitiesForContext: formatFacilitiesForContext,
    formatParksForContext: formatParksForContext,
    formatFoodVendorsForContext: formatFoodVendorsForContext,
    loadCityContacts: loadCityContacts,
    searchCityContacts: searchCityContacts,
    loadMunicipalCodes: loadMunicipalCodes,
    searchMunicipalCode: searchMunicipalCode,
    loadCaliforniaCodes: loadCaliforniaCodes,
    searchCaliforniaCode: searchCaliforniaCode,
    loadCaliforniaResources: loadCaliforniaResources,
    searchCaliforniaResources: searchCaliforniaResources,
    isLocationOnlyMessage: isLocationOnlyMessage,
  };
})();
