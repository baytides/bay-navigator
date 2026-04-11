/**
 * Carl Legal Codes - California state law and municipal ordinance text
 * Loads and searches actual law text from pre-scraped content files
 * and deep-scraped municipal codes from Azure Blob Storage.
 */

(function () {
  'use strict';

  // ============================================
  // CALIFORNIA CODES CONTENT (Actual law text)
  // ============================================

  var californiaCodesContentCache = null;

  async function loadCaliforniaCodesContent() {
    if (californiaCodesContentCache) return californiaCodesContentCache;
    try {
      var response = await fetch('/data/california-codes-content.json', {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        californiaCodesContentCache = await response.json();
        console.log(
          'Loaded California codes content:',
          californiaCodesContentCache.totals?.sections,
          'sections'
        );
      }
    } catch (error) {
      console.warn('Failed to load California codes content:', error);
    }
    return californiaCodesContentCache;
  }

  async function searchCaliforniaCodesContent(query) {
    var cache = await loadCaliforniaCodesContent();
    if (!cache || !cache.sections) return null;

    var queryLower = query.toLowerCase();
    var matchedSections = [];

    // First, check keyword index for direct matches
    if (cache.byKeyword) {
      for (var keyword in cache.byKeyword) {
        if (queryLower.includes(keyword.toLowerCase())) {
          var refs = cache.byKeyword[keyword];
          for (var i = 0; i < refs.length; i++) {
            var ref = refs[i];
            var section = cache.sections.find(function (s) {
              return s.code === ref.code && s.section === ref.section;
            });
            if (
              section &&
              !matchedSections.find(function (m) {
                return m.section === section.section;
              })
            ) {
              matchedSections.push(section);
            }
          }
        }
      }
    }

    // If no keyword matches, search section titles and text
    if (matchedSections.length === 0) {
      for (var j = 0; j < cache.sections.length; j++) {
        var sect = cache.sections[j];
        var titleMatch = sect.title && sect.title.toLowerCase().includes(queryLower);
        var textMatch = sect.text && sect.text.toLowerCase().includes(queryLower);
        var keywordMatch =
          sect.keywords &&
          sect.keywords.some(function (k) {
            return queryLower.includes(k.toLowerCase());
          });
        if (titleMatch || textMatch || keywordMatch) {
          matchedSections.push(sect);
        }
      }
    }

    return matchedSections.slice(0, 3);
  }

  function formatCaliforniaCodesContentForContext(sections) {
    if (!sections || sections.length === 0) return '';

    var codeNameMap = {
      CIV: 'Civil Code',
      LAB: 'Labor Code',
      FAM: 'Family Code',
      VEH: 'Vehicle Code',
      UIC: 'Unemployment Insurance Code',
      WIC: 'Welfare and Institutions Code',
    };

    var context = '\n\n[CALIFORNIA LAW - ACTUAL TEXT]:\n';
    context += 'The following are excerpts from official California state law:\n\n';

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var codeName = codeNameMap[section.code] || section.code;

      context +=
        '**California ' + codeName + ' Section ' + section.section + '** - ' + section.title + '\n';
      var excerpt = section.text ? section.text.substring(0, 800) : '';
      var ellipsis = section.text && section.text.length > 800 ? '...' : '';
      context += '"' + excerpt + ellipsis + '"\n';
      context += 'Source: ' + section.url + '\n\n';
    }

    context +=
      'IMPORTANT: Quote this actual law text in your response. Cite the specific code section (e.g., "California Civil Code Section 1950.5 states..."). You now have the real law text - do NOT make up information. If the user\'s question isn\'t covered by these sections, tell them these are the closest matches and they should consult the full code.';
    return context;
  }

  // ============================================
  // MUNICIPAL DEEP CONTENT (from Azure Blob)
  // ============================================

  var MUNICIPAL_DEEP_BLOB_BASE = 'https://baytidesstorage.blob.core.windows.net/municipal-codes';
  var municipalDeepIndexCache = null;
  var municipalDeepContentCache = {};

  async function loadMunicipalDeepIndex() {
    if (municipalDeepIndexCache) return municipalDeepIndexCache;
    try {
      var response = await fetch(MUNICIPAL_DEEP_BLOB_BASE + '/_index.json', {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        municipalDeepIndexCache = await response.json();
        console.log(
          '[Carl] Municipal deep index loaded:',
          Object.keys(municipalDeepIndexCache.cities || {}).length,
          'cities'
        );
      }
    } catch (error) {
      console.warn('[Carl] Municipal deep index unavailable:', error.message);
    }
    return municipalDeepIndexCache;
  }

  async function loadMunicipalDeepContent(citySlug) {
    if (municipalDeepContentCache[citySlug]) return municipalDeepContentCache[citySlug];
    try {
      var response = await fetch(MUNICIPAL_DEEP_BLOB_BASE + '/' + citySlug + '.json', {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        municipalDeepContentCache[citySlug] = await response.json();
        return municipalDeepContentCache[citySlug];
      }
    } catch (error) {
      console.warn('[Carl] Deep content unavailable for ' + citySlug + ':', error.message);
    }
    return null;
  }

  var TOPIC_NAME_TO_KEY = {
    'noise ordinances': 'noise',
    'parking regulations': 'parking',
    'ADU/accessory dwelling units': 'adu',
    'rental/tenant protections': 'rental',
    'business regulations': 'business',
    'animal regulations': 'pets',
    'fence/wall height limits': 'fences',
    'tree regulations': 'trees',
    'short-term rentals': 'shortterm',
    'sign regulations': 'signs',
    'building permits': 'building',
    zoning: 'zoning',
  };

  async function searchMunicipalDeepContent(cityName, topics) {
    var index = await loadMunicipalDeepIndex();
    if (!index || !index.cities) return null;

    var citySlug = Object.keys(index.cities).find(function (slug) {
      return (
        index.cities[slug].city && index.cities[slug].city.toLowerCase() === cityName.toLowerCase()
      );
    });

    if (!citySlug) return null;

    var cityData = await loadMunicipalDeepContent(citySlug);
    if (!cityData || !cityData.topics) return null;

    var matchedSections = [];
    var topicKeys = (topics || []).map(function (t) {
      return TOPIC_NAME_TO_KEY[t] || t.toLowerCase();
    });

    for (var i = 0; i < topicKeys.length; i++) {
      var topicData = cityData.topics[topicKeys[i]];
      if (topicData && topicData.sections) {
        for (var j = 0; j < topicData.sections.length; j++) {
          var section = topicData.sections[j];
          if (
            !matchedSections.find(function (s) {
              return s.url === section.url && s.title === section.title;
            })
          ) {
            matchedSections.push(section);
          }
        }
      }
    }

    // If no topic-specific match, try all topics
    if (matchedSections.length === 0) {
      for (var key in cityData.topics) {
        var td = cityData.topics[key];
        for (var k = 0; k < (td.sections || []).length; k++) {
          matchedSections.push(td.sections[k]);
        }
      }
    }

    return matchedSections.length > 0
      ? { city: cityData.city, baseUrl: cityData.baseUrl, sections: matchedSections.slice(0, 3) }
      : null;
  }

  function formatMunicipalDeepContentForContext(deepResult) {
    if (!deepResult || !deepResult.sections || !deepResult.sections.length) return '';

    var context = '\n\n[MUNICIPAL CODE - ACTUAL TEXT]:\n';
    context += 'The following are excerpts from ' + deepResult.city + "'s municipal code:\n\n";

    for (var i = 0; i < deepResult.sections.length; i++) {
      var section = deepResult.sections[i];
      if (section.sectionId) {
        context +=
          '**' +
          deepResult.city +
          ' Municipal Code Section ' +
          section.sectionId +
          '** - ' +
          section.title +
          '\n';
      } else {
        context += '**' + deepResult.city + ' Municipal Code** - ' + section.title + '\n';
      }
      var excerpt = section.text ? section.text.substring(0, 800) : '';
      var ellipsis = section.text && section.text.length > 800 ? '...' : '';
      context += '"' + excerpt + ellipsis + '"\n';
      context += 'Source: ' + section.url + '\n\n';
    }

    context +=
      'IMPORTANT: Quote this actual ordinance text and cite the section number. Include the source URL. Do NOT make up additional rules beyond what is quoted above.';
    return context;
  }

  // Expose globally
  window.CarlLegalCodes = {
    loadCaliforniaCodesContent: loadCaliforniaCodesContent,
    searchCaliforniaCodesContent: searchCaliforniaCodesContent,
    formatCaliforniaCodesContentForContext: formatCaliforniaCodesContentForContext,
    loadMunicipalDeepIndex: loadMunicipalDeepIndex,
    loadMunicipalDeepContent: loadMunicipalDeepContent,
    searchMunicipalDeepContent: searchMunicipalDeepContent,
    formatMunicipalDeepContentForContext: formatMunicipalDeepContentForContext,
  };
})();
