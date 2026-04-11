/**
 * Search Refinement Bar — category-based guided search refinement.
 * Extracted from SearchBar.astro for modularity.
 *
 * Exposes: window.SearchRefinement = { init, checkAndShowRefinement,
 *   shouldShowRefinement, showRefinementBarFull, hideRefinementBar,
 *   selectCategory, selectSubOption, performRefinedSearch }
 */

(function () {
  'use strict';

  // --- Config ---
  var REFINEMENT_TRIGGER = {
    min_results: 12,
    max_query_length: 10,
    vague_terms: ['help', 'assistance', 'need', 'program', 'benefit', 'services', 'resources'],
  };

  var REFINEMENT_CATEGORIES = [
    {
      id: 'food',
      label: 'Food',
      icon: '\uD83C\uDF4E',
      search_terms: ['food', 'calfresh', 'snap', 'meals'],
      best_bets: ['calfresh-food-assistance', 'sf-marin-food-bank', 'second-harvest-food-bank'],
      sub_options: [
        {
          label: "Can't afford groceries",
          search_terms: ['calfresh', 'food stamps', 'snap'],
          best_bets: ['calfresh-food-assistance'],
        },
        {
          label: 'Need food right now',
          search_terms: ['food bank', 'food pantry', 'emergency food'],
          best_bets: ['sf-marin-food-bank', 'second-harvest-food-bank'],
        },
        {
          label: 'Baby food or formula',
          search_terms: ['wic', 'baby food', 'formula', 'infant nutrition'],
          best_bets: ['wic-program'],
        },
        {
          label: 'Senior meals',
          search_terms: ['meals on wheels', 'senior meals', 'congregate meals'],
          best_bets: ['meals-on-wheels'],
        },
      ],
    },
    {
      id: 'housing',
      label: 'Housing',
      icon: '\uD83C\uDFE0',
      search_terms: ['housing', 'rent', 'shelter', 'homeless'],
      best_bets: ['federal-department-of-housing-choice-voucher-section-8'],
      sub_options: [
        {
          label: "Can't pay rent",
          search_terms: ['rental assistance', 'rent help', 'emergency rental'],
          best_bets: ['rental-assistance-program', 'eviction-prevention'],
        },
        {
          label: 'Facing eviction',
          search_terms: ['eviction', 'eviction defense', 'tenant rights'],
          best_bets: ['bay-area-legal-aid', 'eviction-defense-collaborative'],
        },
        {
          label: 'Need a place to stay',
          search_terms: ['shelter', 'homeless', 'navigation center', 'coordinated entry'],
          best_bets: ['coordinated-entry', 'navigation-centers'],
        },
        {
          label: 'Looking to buy a home',
          search_terms: ['first-time homebuyer', 'down payment', 'mortgage assistance'],
          best_bets: ['calhfa-first-time-homebuyer'],
        },
      ],
    },
    {
      id: 'healthcare',
      label: 'Healthcare',
      icon: '\uD83D\uDC8A',
      search_terms: ['healthcare', 'medical', 'health insurance', 'doctor'],
      best_bets: ['medi-cal', 'covered-california'],
      sub_options: [
        {
          label: 'Need health insurance',
          search_terms: ['medi-cal', 'covered california', 'health insurance'],
          best_bets: ['medi-cal', 'covered-california'],
        },
        {
          label: 'Mental health support',
          search_terms: ['mental health', 'counseling', 'therapy', 'crisis'],
          best_bets: ['988-suicide-crisis-lifeline', 'county-behavioral-health'],
        },
        {
          label: 'Dental care',
          search_terms: ['dental', 'dentist', 'denti-cal'],
          best_bets: ['denti-cal'],
        },
        {
          label: 'Need to see a doctor',
          search_terms: ['clinic', 'community health', 'primary care'],
          best_bets: ['community-health-centers'],
        },
      ],
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: '\uD83D\uDCBC',
      search_terms: ['job', 'employment', 'work', 'career'],
      best_bets: ['caljobs', 'sf-jobsnow'],
      sub_options: [
        {
          label: 'Looking for a job',
          search_terms: ['job search', 'caljobs', 'employment'],
          best_bets: ['caljobs', 'sf-jobsnow'],
        },
        {
          label: 'Lost my job',
          search_terms: ['unemployment', 'edd', 'laid off'],
          best_bets: ['edd-unemployment-insurance'],
        },
        {
          label: 'Need job training',
          search_terms: ['job training', 'workforce', 'vocational'],
          best_bets: ['nova-workforce', 'job-corps'],
        },
        {
          label: 'Resume help',
          search_terms: ['resume', 'interview', 'job search'],
          best_bets: ['career-counseling-centers'],
        },
      ],
    },
    {
      id: 'money',
      label: 'Money',
      icon: '\uD83D\uDCB0',
      search_terms: ['cash', 'money', 'welfare', 'bills'],
      best_bets: ['calworks-cash-assistance'],
      sub_options: [
        {
          label: 'Need cash assistance',
          search_terms: ['calworks', 'welfare', 'cash aid', 'general assistance'],
          best_bets: ['calworks-cash-assistance', 'general-assistance'],
        },
        {
          label: 'Disability benefits',
          search_terms: ['ssi', 'ssdi', 'disability'],
          best_bets: ['federal-social-security-supplemental-security-income-ssi'],
        },
        {
          label: 'Help with utility bills',
          search_terms: ['utility', 'liheap', 'care', 'pgcap', 'energy'],
          best_bets: ['care-program-pge', 'liheap'],
        },
        {
          label: 'Retirement/Social Security',
          search_terms: ['retirement', 'social security', 'pension'],
          best_bets: ['federal-social-security-retirement-benefits'],
        },
      ],
    },
    {
      id: 'legal',
      label: 'Legal',
      icon: '\u2696\uFE0F',
      search_terms: ['legal', 'lawyer', 'attorney', 'rights'],
      best_bets: ['bay-area-legal-aid'],
      sub_options: [
        {
          label: 'Free legal help',
          search_terms: ['legal aid', 'free lawyer', 'legal services'],
          best_bets: ['bay-area-legal-aid', 'legal-aid-at-work'],
        },
        {
          label: 'Tenant/landlord issues',
          search_terms: ['tenant rights', 'eviction', 'landlord'],
          best_bets: ['bay-area-legal-aid', 'tenants-union'],
        },
        {
          label: 'Immigration help',
          search_terms: ['immigration', 'citizenship', 'daca', 'visa'],
          best_bets: ['centro-legal-de-la-raza', 'immigration-legal-services'],
        },
      ],
    },
    {
      id: 'family',
      label: 'Family',
      icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67',
      search_terms: ['family', 'children', 'childcare', 'senior'],
      best_bets: ['head-start-bay-area'],
      sub_options: [
        {
          label: 'Childcare/preschool',
          search_terms: ['childcare', 'daycare', 'preschool', 'head start'],
          best_bets: ['head-start-bay-area', 'subsidized-childcare'],
        },
        {
          label: 'After school programs',
          search_terms: ['after school', 'youth programs', 'tutoring'],
          best_bets: ['after-school-all-stars'],
        },
        {
          label: 'Senior services',
          search_terms: ['senior', 'elderly', 'aging', 'meals on wheels'],
          best_bets: ['senior-center', 'meals-on-wheels'],
        },
        {
          label: 'Diapers/baby supplies',
          search_terms: ['diapers', 'baby', 'infant', 'wic'],
          best_bets: ['diaper-bank', 'wic-program'],
        },
      ],
    },
    {
      id: 'education',
      label: 'Education',
      icon: '\uD83C\uDF93',
      search_terms: ['education', 'school', 'college', 'ged'],
      best_bets: ['cal-grant'],
      sub_options: [
        {
          label: 'Paying for college',
          search_terms: ['financial aid', 'fafsa', 'cal grant', 'scholarship'],
          best_bets: ['cal-grant', 'fafsa-help'],
        },
        {
          label: 'GED/Adult education',
          search_terms: ['ged', 'adult education', 'adult school'],
          best_bets: ['career-online-high-school', 'adult-school-sf'],
        },
        {
          label: 'ESL/English classes',
          search_terms: ['esl', 'english', 'language'],
          best_bets: ['esl-classes'],
        },
        {
          label: 'School meals',
          search_terms: ['school meals', 'free lunch', 'summer meals'],
          best_bets: ['national-school-lunch-program'],
        },
      ],
    },
  ];

  // --- Dependencies (set via init) ---
  var _announceToScreenReader = null;
  var _searchEngine = null; // window.SearchEngine
  var _programs = [];
  var _programById = new Map();
  var _matchesActiveFilters = function () {
    return true;
  };
  var _setRelevanceRanks = function () {};
  var _applyRelevanceOrder = function () {};
  var _updateResultsCount = function () {};
  var _searchInput = null;

  // Selected category state
  var selectedCategory = null;

  // DOM refs (cached on init)
  var refinementBar = null;
  var locationDisplay = null;
  var locationPrompt = null;
  var locationValue = null;
  var locationSource = null;
  var categoryButtons = null;
  var categoryRefinement = null;
  var suboptionRefinement = null;
  var suboptionPrompt = null;
  var suboptionButtons = null;

  // Location helpers (set via init)
  var _currentLocation = null;
  var _getCurrentLocation = function () {
    return null;
  };
  var COUNTY_TO_CITY = {};

  function capitalizeCityName(city) {
    return city
      .split(' ')
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  // ========== Core functions ==========

  function shouldShowRefinement(query, resultCount) {
    var isVague = REFINEMENT_TRIGGER.vague_terms.some(function (term) {
      return query.toLowerCase().includes(term);
    });
    var isShort = query.length <= REFINEMENT_TRIGGER.max_query_length;
    var hasManyResults = resultCount >= REFINEMENT_TRIGGER.min_results;
    return (isVague || isShort) && hasManyResults && query.length > 0;
  }

  function checkAndShowRefinement(query, resultCount) {
    if (!refinementBar) return;
    if (!query) {
      refinementBar.classList.add('hidden');
      return;
    }
    if (shouldShowRefinement(query, resultCount)) {
      showRefinementBarFull();
    } else {
      refinementBar.classList.add('hidden');
    }
  }

  function updateLocationDisplay() {
    var currentLocation = _getCurrentLocation();
    if (currentLocation) {
      if (locationValue) {
        var fallbackCity = COUNTY_TO_CITY[currentLocation.county];
        var displayName = currentLocation.city
          ? capitalizeCityName(currentLocation.city)
          : fallbackCity || currentLocation.county;
        locationValue.textContent = displayName;
      }
      if (locationSource) {
        locationSource.textContent =
          currentLocation.source === 'gps'
            ? '(GPS)'
            : currentLocation.source === 'profile'
              ? '(from profile)'
              : '';
      }
      if (locationDisplay) locationDisplay.classList.remove('hidden');
      if (locationPrompt) locationPrompt.classList.add('hidden');
    } else {
      if (locationDisplay) locationDisplay.classList.add('hidden');
      if (locationPrompt) locationPrompt.classList.remove('hidden');
    }
  }

  function showRefinementBarFull() {
    if (!refinementBar) return;

    updateLocationDisplay();

    // Build category buttons
    if (categoryButtons) {
      categoryButtons.textContent = '';
      // WCAG: Parent needs role="list" for child role="listitem" to be valid
      categoryButtons.setAttribute('role', 'list');

      REFINEMENT_CATEGORIES.forEach(function (cat) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-600 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition-colors';
        btn.setAttribute('role', 'listitem');
        btn.setAttribute('data-category-id', cat.id);

        var icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = cat.icon;
        btn.appendChild(icon);

        var label = document.createElement('span');
        label.textContent = cat.label;
        btn.appendChild(label);

        btn.addEventListener('click', function () {
          selectCategory(cat);
        });
        categoryButtons.appendChild(btn);
      });
    }

    // Reset to category view
    if (categoryRefinement) categoryRefinement.classList.remove('hidden');
    if (suboptionRefinement) suboptionRefinement.classList.add('hidden');
    selectedCategory = null;

    refinementBar.classList.remove('hidden');
    if (_announceToScreenReader) {
      _announceToScreenReader(
        'Refinement options are now available. Select a category to narrow your search.'
      );
    }
  }

  function hideRefinementBar() {
    if (refinementBar) {
      refinementBar.classList.add('hidden');
    }
  }

  function selectCategory(category) {
    selectedCategory = category;

    var query = category.search_terms.join(' ');
    performRefinedSearch(query, category.best_bets);

    // Show sub-options
    if (categoryRefinement) categoryRefinement.classList.add('hidden');
    if (suboptionRefinement) suboptionRefinement.classList.remove('hidden');

    if (suboptionPrompt) {
      suboptionPrompt.textContent = category.label + " - What's your situation?";
    }

    if (suboptionButtons) {
      suboptionButtons.textContent = '';
      // WCAG: Parent needs role="list" for child role="listitem" to be valid
      suboptionButtons.setAttribute('role', 'list');

      category.sub_options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'px-3 py-2 text-sm font-medium rounded-lg bg-white dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-600 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition-colors';
        btn.setAttribute('role', 'listitem');
        btn.textContent = opt.label;
        btn.addEventListener('click', function () {
          selectSubOption(opt);
        });
        suboptionButtons.appendChild(btn);
      });
    }

    if (_announceToScreenReader) {
      _announceToScreenReader(
        'Selected ' + category.label + '. Choose your specific situation to see relevant programs.'
      );
    }
  }

  function selectSubOption(option) {
    var query = option.search_terms.join(' ');
    performRefinedSearch(query, option.best_bets);
    hideRefinementBar();
    if (_announceToScreenReader) {
      _announceToScreenReader('Showing results for "' + option.label + '".');
    }
  }

  function performRefinedSearch(query, bestBetIds) {
    if (!_searchEngine) return;

    _searchEngine.ensureFuseReady().then(function () {
      if (_searchInput) {
        _searchInput.value = query;
      }

      var rewrittenQuery = _searchEngine.rewriteQuery(query);
      var expandedTerms = _searchEngine.expandWithSynonyms(rewrittenQuery);
      var resultsById = _searchEngine.collectSearchResults(expandedTerms);
      var rankedIds = _searchEngine.rankSearchResults(resultsById, bestBetIds);
      var matchedIds = new Set(rankedIds);
      var bestBetSet = new Set(bestBetIds);
      _setRelevanceRanks(rankedIds);
      _applyRelevanceOrder(rankedIds);

      var visibleCount = 0;
      _programs.forEach(function (p) {
        var matchesSearch = matchedIds.has(p.id);
        var isBestBet = bestBetSet.has(p.id);
        var shouldShow = matchesSearch;

        p.element.style.display = shouldShow ? '' : 'none';

        if (isBestBet && shouldShow) {
          p.element.classList.add('best-bet');
        } else {
          p.element.classList.remove('best-bet');
        }

        if (shouldShow) visibleCount++;
      });

      _updateResultsCount(visibleCount, query);
      if (_announceToScreenReader) {
        _announceToScreenReader(
          'Found ' + visibleCount + ' program' + (visibleCount !== 1 ? 's' : '') + '.'
        );
      }
    });
  }

  // ========== Init ==========

  /**
   * @param {Object} deps
   * @param {Function} deps.announceToScreenReader
   * @param {Object} deps.searchEngine - window.SearchEngine
   * @param {any[]} deps.programs
   * @param {Map} deps.programById
   * @param {Function} deps.matchesActiveFilters
   * @param {Function} deps.setRelevanceRanks
   * @param {Function} deps.applyRelevanceOrder
   * @param {Function} deps.updateResultsCount
   * @param {HTMLInputElement} deps.searchInput
   * @param {Function} deps.getCurrentLocation
   * @param {Object} deps.countyToCity
   */
  function init(deps) {
    _announceToScreenReader = deps.announceToScreenReader || null;
    _searchEngine = deps.searchEngine || null;
    _programs = deps.programs || [];
    _programById = deps.programById || new Map();
    _matchesActiveFilters =
      deps.matchesActiveFilters ||
      function () {
        return true;
      };
    _setRelevanceRanks = deps.setRelevanceRanks || function () {};
    _applyRelevanceOrder = deps.applyRelevanceOrder || function () {};
    _updateResultsCount = deps.updateResultsCount || function () {};
    _searchInput = deps.searchInput || null;
    _getCurrentLocation =
      deps.getCurrentLocation ||
      function () {
        return null;
      };
    COUNTY_TO_CITY = deps.countyToCity || {};

    // Cache DOM refs
    refinementBar = document.getElementById('refinement-bar');
    locationDisplay = document.getElementById('location-display');
    locationPrompt = document.getElementById('location-prompt');
    locationValue = document.getElementById('location-value');
    locationSource = document.getElementById('location-source');
    categoryButtons = document.getElementById('category-buttons');
    categoryRefinement = document.getElementById('category-refinement');
    suboptionRefinement = document.getElementById('suboption-refinement');
    suboptionPrompt = document.getElementById('suboption-prompt');
    suboptionButtons = document.getElementById('suboption-buttons');

    // Back button handler
    var backToCategories = document.getElementById('back-to-categories');
    if (backToCategories) {
      backToCategories.addEventListener('click', function () {
        if (suboptionRefinement) suboptionRefinement.classList.add('hidden');
        if (categoryRefinement) categoryRefinement.classList.remove('hidden');
        selectedCategory = null;
        if (_announceToScreenReader) {
          _announceToScreenReader('Returned to category selection.');
        }
      });
    }
  }

  window.SearchRefinement = {
    init: init,
    checkAndShowRefinement: checkAndShowRefinement,
    shouldShowRefinement: shouldShowRefinement,
    showRefinementBarFull: showRefinementBarFull,
    hideRefinementBar: hideRefinementBar,
    selectCategory: selectCategory,
    selectSubOption: selectSubOption,
    performRefinedSearch: performRefinedSearch,
    updateLocationDisplay: updateLocationDisplay,
  };
})();
