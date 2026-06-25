/**
 * Search Engine — synonym expansion, query rewriting, best bets, Fuse.js search,
 * location boosting, and result ranking logic for the program directory.
 * Extracted from SearchBar.astro for modularity.
 *
 * Exposes: window.SearchEngine = { init, expandWithSynonyms, rewriteQuery,
 *   getBestBets, buildSearchDocumentsFromDom, loadSearchIndex, ensureFuseReady,
 *   collectSearchResults, getLocationBoost, rankSearchResults, performFuzzySearch,
 *   searchWithMeilisearch, tryMeilisearchSearch }
 */

(function () {
  'use strict';

  // --- Config (set via init) ---
  var SYNONYMS = {};
  var BEST_BETS = {};
  var QUERY_REWRITES = {};
  var ZIP_TO_CITY = {};
  var CITY_TO_COUNTY = {};

  // Category name mappings for category-based search matching
  var CATEGORY_MAPPINGS = {
    food: {
      categories: ['Food'],
      boostKeywords: [
        'calfresh',
        'food bank',
        'pantry',
        'snap',
        'wic',
        'meals',
        'groceries',
        'hungry',
      ],
    },
    housing: {
      categories: ['Housing'],
      boostKeywords: ['shelter', 'rent', 'section 8', 'homeless', 'housing', 'eviction'],
    },
    health: {
      categories: ['Health'],
      boostKeywords: ['medi-cal', 'clinic', 'medical', 'doctor', 'healthcare'],
    },
    healthcare: {
      categories: ['Health'],
      boostKeywords: ['medi-cal', 'clinic', 'medical', 'doctor', 'healthcare'],
    },
    medical: {
      categories: ['Health'],
      boostKeywords: ['medi-cal', 'clinic', 'doctor', 'hospital'],
    },
    jobs: {
      categories: ['Employment'],
      boostKeywords: ['employment', 'job', 'career', 'workforce', 'hiring'],
    },
    employment: {
      categories: ['Employment'],
      boostKeywords: ['job', 'career', 'workforce', 'hiring', 'work'],
    },
    legal: {
      categories: ['Legal Services'],
      boostKeywords: ['lawyer', 'attorney', 'legal aid', 'court'],
    },
    utilities: {
      categories: ['Utilities'],
      boostKeywords: ['pge', 'care program', 'liheap', 'energy', 'electric', 'gas'],
    },
  };

  var MAX_CATEGORY_RESULTS = 25;

  // --- State (set via init) ---
  /** @type {any[]} */
  var programs = [];
  /** @type {Map<string, any>} */
  var programById = new Map();
  /** @type {Function} */
  var matchesActiveFilters = function () {
    return true;
  };
  /** @type {Function} */
  var getProgramName = function () {
    return '';
  };

  // Fuse.js state
  var Fuse = null; // Fuse constructor — set via init
  var searchDocuments = [];
  var searchDocumentsById = new Map();
  var fuse = null;
  var searchIndexReady = null;

  // Shared Meilisearch helpers (set via init)
  var sharedSearchMeilisearch = null;
  var resolveLocationInput = null;
  var buildCountiesFilter = null;
  var MEILI_BASE_URL = '';
  var USE_MEILISEARCH = true;
  var DEFAULT_SEARCH_KEYS = [];
  var DEFAULT_FUSE_OPTIONS = {};
  var SEARCH_INDEX_URL = '/data/search-index.json';

  // Location state — managed by main script, passed to us
  var _getCurrentLocation = function () {
    return null;
  };
  var _getActiveFilters = function () {
    return { category: 'all', group: null, verifiedOnly: false };
  };

  // ========== Pure logic functions ==========

  /**
   * Expand query with synonyms — more selective to reduce noise.
   * @param {string} query
   * @returns {string[]}
   */
  function expandWithSynonyms(query) {
    var queryLower = query.toLowerCase();
    var terms = queryLower.split(/\s+/).filter(function (t) {
      return t.length >= 2;
    });
    var expanded = new Set([queryLower]);

    // Multi-word phrase matches (more specific, higher priority)
    for (var phrase in SYNONYMS) {
      if (!Object.prototype.hasOwnProperty.call(SYNONYMS, phrase)) continue;
      var phraseRegex = new RegExp(
        '\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
        'i'
      );
      if (phraseRegex.test(queryLower)) {
        SYNONYMS[phrase].slice(0, 3).forEach(function (syn) {
          expanded.add(syn);
        });
      }
    }

    // Individual terms
    var stopWords = ['help', 'need', 'get', 'find', 'how', 'can', 'the', 'for', 'and', 'with'];
    terms.forEach(function (term) {
      if (stopWords.indexOf(term) !== -1) return;
      if (SYNONYMS[term]) {
        SYNONYMS[term].slice(0, 3).forEach(function (syn) {
          expanded.add(syn);
        });
      }
    });

    return Array.from(expanded);
  }

  /**
   * Rewrite natural language queries — augment instead of replace.
   * @param {string} query
   * @returns {string}
   */
  function rewriteQuery(query) {
    var queryLower = query.toLowerCase().trim();

    if (QUERY_REWRITES[queryLower]) {
      return QUERY_REWRITES[queryLower];
    }

    for (var pattern in QUERY_REWRITES) {
      if (!Object.prototype.hasOwnProperty.call(QUERY_REWRITES, pattern)) continue;
      var patternRegex = new RegExp(
        '\\b' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
        'i'
      );
      if (patternRegex.test(queryLower)) {
        var rewrite = QUERY_REWRITES[pattern];
        if (rewrite.toLowerCase() !== queryLower && !queryLower.includes(rewrite.toLowerCase())) {
          return query + ' ' + rewrite;
        }
        return rewrite;
      }
    }

    return query;
  }

  /**
   * Get best bets for a query.
   * @param {string} query
   * @returns {string[]}
   */
  function getBestBets(query) {
    var queryLower = query.toLowerCase().trim();
    var terms = queryLower.split(/\s+/);

    if (BEST_BETS[queryLower]) {
      return BEST_BETS[queryLower];
    }

    for (var i = 0; i < terms.length; i++) {
      if (BEST_BETS[terms[i]]) {
        return BEST_BETS[terms[i]];
      }
    }

    return [];
  }

  // ========== Index management ==========

  function buildSearchDocumentsFromDom() {
    var documents = programs.map(function (program) {
      var nameEl = program.element.querySelector('[data-program-name]');
      var descEl = program.element.querySelector('p');
      var areaEl = program.element.querySelector(
        '[class*="text-neutral-700"], [class*="text-neutral-600"]'
      );
      var keywords = program.element.getAttribute('data-keywords') || '';
      var city = program.element.getAttribute('data-city') || '';

      return {
        id: program.id,
        name: nameEl && nameEl.textContent ? nameEl.textContent.trim() : '',
        description: descEl && descEl.textContent ? descEl.textContent.trim() : '',
        category: program.category || '',
        area: areaEl && areaEl.textContent ? areaEl.textContent.trim() : '',
        keywords: keywords,
        city: city,
      };
    });

    searchDocuments = documents;
    searchDocumentsById = new Map(
      documents.map(function (doc) {
        return [doc.id, doc];
      })
    );
    fuse = new Fuse(searchDocuments, DEFAULT_FUSE_OPTIONS);
  }

  function loadSearchIndex() {
    return fetch(SEARCH_INDEX_URL, { cache: 'force-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Search index request failed: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data && data.documents)) {
          throw new Error('Search index payload missing documents');
        }

        var keys = data.keys || DEFAULT_SEARCH_KEYS;
        var index =
          data.index && typeof Fuse.parseIndex === 'function' ? Fuse.parseIndex(data.index) : null;

        searchDocuments = data.documents;
        searchDocumentsById = new Map(
          searchDocuments.map(function (doc) {
            return [doc.id, doc];
          })
        );
        var opts = Object.assign({}, DEFAULT_FUSE_OPTIONS, { keys: keys });
        fuse = index ? new Fuse(searchDocuments, opts, index) : new Fuse(searchDocuments, opts);
      })
      .catch(function (error) {
        console.warn('Search index unavailable, falling back to DOM search.', error);
        buildSearchDocumentsFromDom();
      });
  }

  function ensureFuseReady() {
    if (fuse) return Promise.resolve();
    return (searchIndexReady || Promise.resolve()).then(function () {
      if (!fuse) {
        buildSearchDocumentsFromDom();
      }
    });
  }

  // ========== Meilisearch ==========

  function searchWithMeilisearch(query, filters) {
    if (!sharedSearchMeilisearch) return Promise.resolve([]);

    var currentLocation = _getCurrentLocation();
    var countiesFilter;
    if (currentLocation && currentLocation.county) {
      var resolved = resolveLocationInput(
        currentLocation.city || currentLocation.county,
        ZIP_TO_CITY,
        CITY_TO_COUNTY
      );
      if (resolved) {
        countiesFilter = buildCountiesFilter(resolved.countySlug);
      }
    }

    return sharedSearchMeilisearch(query, {
      limit: 50,
      counties: countiesFilter,
      category:
        filters && filters.category && filters.category !== 'all' ? filters.category : undefined,
      baseUrl: MEILI_BASE_URL,
    })
      .then(function (results) {
        return results.map(function (r) {
          return r.id;
        });
      })
      .catch(function (error) {
        console.warn('Meilisearch search failed, falling back to Fuse.js:', error);
        return [];
      });
  }

  function tryMeilisearchSearch(query) {
    if (!USE_MEILISEARCH) return Promise.resolve(null);

    var filters = _getActiveFilters();
    return searchWithMeilisearch(query, { category: filters.category })
      .then(function (ids) {
        if (ids.length === 0) return null;

        var resultsById = new Map();
        ids.forEach(function (id, index) {
          var program = programById.get(id);
          if (program && matchesActiveFilters(program)) {
            resultsById.set(id, { id: id, score: index * 0.01 });
          }
        });

        return resultsById.size > 0 ? resultsById : null;
      })
      .catch(function (error) {
        console.warn('Meilisearch search failed:', error);
        return null;
      });
  }

  // ========== Fuse.js search ==========

  function collectSearchResults(terms) {
    var resultsById = new Map();

    // Primary fuzzy search
    terms.forEach(function (term) {
      var results = fuse.search(term);
      results.forEach(function (result) {
        var id = result.item.id;
        var program = programById.get(id);
        if (!program || !matchesActiveFilters(program)) return;

        var score = result.score != null ? result.score : 1;
        var existing = resultsById.get(id);
        if (!existing || score < existing.score) {
          resultsById.set(id, { id: id, score: score });
        }
      });
    });

    // Category-based boost when few results
    terms.forEach(function (term) {
      var termLower = term.toLowerCase();
      var mapping = CATEGORY_MAPPINGS[termLower];

      if (mapping && resultsById.size < 10) {
        var categoryPrograms = [];

        programs.forEach(function (program) {
          if (!matchesActiveFilters(program)) return;
          if (resultsById.has(program.id)) return;

          var programCategory = program.category || '';
          var matches = mapping.categories.some(function (cat) {
            return programCategory.toLowerCase() === cat.toLowerCase();
          });
          if (!matches) return;

          var name = (program.name || '').toLowerCase();
          var desc = (program.description || '').toLowerCase();
          var keywords = (program.keywords || []).join(' ').toLowerCase();

          var relevanceScore = 0.5;
          mapping.boostKeywords.forEach(function (kw) {
            if (name.includes(kw)) relevanceScore -= 0.15;
            else if (keywords.includes(kw)) relevanceScore -= 0.08;
            else if (desc.includes(kw)) relevanceScore -= 0.03;
          });

          relevanceScore = Math.max(0.1, Math.min(0.9, relevanceScore));
          categoryPrograms.push({ program: program, relevanceScore: relevanceScore });
        });

        categoryPrograms
          .sort(function (a, b) {
            return a.relevanceScore - b.relevanceScore;
          })
          .slice(0, MAX_CATEGORY_RESULTS)
          .forEach(function (item) {
            resultsById.set(item.program.id, {
              id: item.program.id,
              score: item.relevanceScore,
            });
          });
      }
    });

    return resultsById;
  }

  // ========== Ranking / boosting ==========

  function getLocationBoost(programId) {
    var currentLocation = _getCurrentLocation();
    if (!currentLocation || !currentLocation.county) return 0;

    var program = programById.get(programId);
    if (!program) return 0;

    var area = (program.area || '').toLowerCase();
    var userCounty = currentLocation.county.toLowerCase();
    var userCity = (currentLocation.city || '').toLowerCase();

    if (userCity && area.includes(userCity)) return -0.15;
    if (area.includes(userCounty)) return -0.1;
    if (area.includes('bay area') || area.includes('statewide') || area.includes('california'))
      return -0.02;
    return 0;
  }

  function rankSearchResults(resultsById, bestBetIds) {
    var bestBetRank = new Map();
    bestBetIds.forEach(function (id, index) {
      bestBetRank.set(id, index);
    });

    var bestBets = bestBetIds
      .map(function (id) {
        var program = programById.get(id);
        if (!program || !matchesActiveFilters(program)) return null;
        return { id: id, score: -1, bestBetRank: bestBetRank.get(id) || 0 };
      })
      .filter(Boolean);

    var regularResults = Array.from(resultsById.values()).filter(function (result) {
      return !bestBetRank.has(result.id);
    });

    // Apply location boost
    regularResults.forEach(function (result) {
      result.score += getLocationBoost(result.id);
    });

    regularResults.sort(function (a, b) {
      if (a.score !== b.score) return a.score - b.score;
      var nameA = getProgramName(a.id).toLowerCase();
      var nameB = getProgramName(b.id).toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      return a.id.localeCompare(b.id);
    });

    var rankedResults = bestBets
      .sort(function (a, b) {
        return a.bestBetRank - b.bestBetRank;
      })
      .concat(regularResults);

    return rankedResults.map(function (result) {
      return result.id;
    });
  }

  // ========== Convenience accessors ==========

  /**
   * Get the searchDocumentsById map (used by main script's getProgramName).
   * @returns {Map}
   */
  function getSearchDocumentsById() {
    return searchDocumentsById;
  }

  // ========== Init ==========

  /**
   * @param {Object} deps
   * @param {Object} deps.searchConfig - { synonyms, best_bets, query_rewrites }
   * @param {Object} deps.zipToCityMap
   * @param {Object} deps.cityToCountyMap
   * @param {any[]} deps.programs - Array of program objects with .id, .element, .category, etc.
   * @param {Map} deps.programById
   * @param {Function} deps.matchesActiveFilters
   * @param {Function} deps.getProgramName
   * @param {Function} deps.FuseConstructor - Fuse.js constructor
   * @param {Object} deps.fuseSearchKeys - FUSE_SEARCH_KEYS from search-config
   * @param {Object} deps.fuseOptions - FUSE_OPTIONS from search-config
   * @param {Function} [deps.sharedSearchMeilisearch]
   * @param {Function} [deps.resolveLocationInput]
   * @param {Function} [deps.buildCountiesFilter]
   * @param {string} [deps.meiliBaseUrl]
   * @param {boolean} [deps.useMeilisearch]
   * @param {Function} deps.getCurrentLocation - returns current location object or null
   * @param {Function} deps.getActiveFilters - returns { category, group, verifiedOnly }
   */
  function init(deps) {
    SYNONYMS = (deps.searchConfig && deps.searchConfig.synonyms) || {};
    BEST_BETS = (deps.searchConfig && deps.searchConfig.best_bets) || {};
    QUERY_REWRITES = (deps.searchConfig && deps.searchConfig.query_rewrites) || {};
    ZIP_TO_CITY = deps.zipToCityMap || {};
    CITY_TO_COUNTY = deps.cityToCountyMap || {};
    programs = deps.programs || [];
    programById = deps.programById || new Map();
    matchesActiveFilters =
      deps.matchesActiveFilters ||
      function () {
        return true;
      };
    getProgramName =
      deps.getProgramName ||
      function () {
        return '';
      };
    Fuse = deps.FuseConstructor;
    DEFAULT_SEARCH_KEYS = deps.fuseSearchKeys ? [].concat(deps.fuseSearchKeys) : [];
    DEFAULT_FUSE_OPTIONS = deps.fuseOptions ? Object.assign({}, deps.fuseOptions) : {};
    sharedSearchMeilisearch = deps.sharedSearchMeilisearch || null;
    resolveLocationInput = deps.resolveLocationInput || null;
    buildCountiesFilter = deps.buildCountiesFilter || null;
    MEILI_BASE_URL = deps.meiliBaseUrl || '';
    USE_MEILISEARCH = deps.useMeilisearch !== undefined ? deps.useMeilisearch : true;
    _getCurrentLocation =
      deps.getCurrentLocation ||
      function () {
        return null;
      };
    _getActiveFilters =
      deps.getActiveFilters ||
      function () {
        return { category: 'all' };
      };

    // Start loading search index
    searchIndexReady = loadSearchIndex();
  }

  window.SearchEngine = {
    init: init,
    expandWithSynonyms: expandWithSynonyms,
    rewriteQuery: rewriteQuery,
    getBestBets: getBestBets,
    buildSearchDocumentsFromDom: buildSearchDocumentsFromDom,
    loadSearchIndex: loadSearchIndex,
    ensureFuseReady: ensureFuseReady,
    searchWithMeilisearch: searchWithMeilisearch,
    tryMeilisearchSearch: tryMeilisearchSearch,
    collectSearchResults: collectSearchResults,
    getLocationBoost: getLocationBoost,
    rankSearchResults: rankSearchResults,
    getSearchDocumentsById: getSearchDocumentsById,
  };
})();
