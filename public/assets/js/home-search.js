/**
 * Home Search — handles search submission and result rendering.
 * Extracted from index.astro for modularity.
 *
 * Exposes: window.HomeSearch = { init }
 */

(function () {
  'use strict';

  var _config = {
    synonyms: {},
    bestBets: {},
    queryRewrites: {},
    zipToCity: {},
    cityToCounty: {},
    totalPrograms: '0',
    searchFn: null, // async (query, options) => results[]
    rewriteQueryFn: null,
    expandSynonymsFn: null,
    getBestBetsFn: null,
    resolveLocationFn: null,
    buildCountiesFilterFn: null,
  };

  var detectedGeoPoint = null;

  // --- Search execution ---
  async function executeSearch(query, location) {
    var searchQuery = query;

    if (_config.rewriteQueryFn) {
      searchQuery = _config.rewriteQueryFn(searchQuery, _config.queryRewrites);
    }
    if (_config.expandSynonymsFn) {
      searchQuery = _config.expandSynonymsFn(searchQuery, _config.synonyms);
    }

    var bestBetIds = [];
    if (_config.getBestBetsFn) {
      bestBetIds = _config.getBestBetsFn(query, _config.bestBets);
    }

    var countiesFilter;
    if (location && _config.resolveLocationFn && _config.buildCountiesFilterFn) {
      var resolved = _config.resolveLocationFn(location, _config.zipToCity, _config.cityToCounty);
      if (resolved) {
        countiesFilter = _config.buildCountiesFilterFn(resolved.countySlug);
      }
    }

    var results = [];
    if (_config.searchFn) {
      results = await _config.searchFn(searchQuery, {
        limit: 12,
        counties: countiesFilter,
        geoPoint: detectedGeoPoint || undefined,
      });
    }

    // Promote best-bet results
    if (bestBetIds.length > 0) {
      var bestBetSet = new Set(bestBetIds);
      var bests = results.filter(function (r) {
        return bestBetSet.has(r.id);
      });
      var others = results.filter(function (r) {
        return !bestBetSet.has(r.id);
      });
      return bests.concat(others);
    }

    return results;
  }

  // --- DOM rendering (safe methods only) ---
  function renderResults(results, query, location) {
    var container = document.getElementById('search-results-section');
    if (!container) {
      container = document.createElement('section');
      container.id = 'search-results-section';
      container.setAttribute('aria-label', 'Search results');
      var hero = document.getElementById('hero-section');
      if (hero && hero.parentNode) {
        hero.parentNode.insertBefore(container, hero.nextSibling);
      }
    }

    // Clear previous
    container.textContent = '';
    container.className = 'mt-6 mb-4';

    // Header
    var header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4 gap-3';

    var headerLeft = document.createElement('div');
    var heading = document.createElement('h2');
    heading.className = 'text-lg font-bold text-neutral-900 dark:text-white';
    heading.textContent = location
      ? 'Results for \u201c' + query + '\u201d in ' + location
      : 'Results for \u201c' + query + '\u201d';
    headerLeft.appendChild(heading);

    var countText = document.createElement('p');
    countText.className = 'text-sm text-neutral-600 dark:text-neutral-300';
    countText.textContent =
      results.length + ' program' + (results.length !== 1 ? 's' : '') + ' found';
    headerLeft.appendChild(countText);
    header.appendChild(headerLeft);

    var closeBtn = document.createElement('button');
    closeBtn.className =
      'flex-shrink-0 p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors';
    closeBtn.setAttribute('aria-label', 'Clear search results');
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', function () {
      container.remove();
    });
    header.appendChild(closeBtn);
    container.appendChild(header);

    // Grid
    var grid = document.createElement('div');
    grid.className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

    results.forEach(function (r) {
      var card = document.createElement('a');
      card.href = r.link || '/directory?program=' + encodeURIComponent(r.id);
      if (r.link) {
        card.target = '_blank';
        card.rel = 'noopener';
      }
      card.className =
        'block rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all no-underline';

      if (r.category) {
        var pill = document.createElement('span');
        pill.className =
          'inline-block text-[11px] font-medium uppercase tracking-wide text-primary-900 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/40 px-2 py-0.5 rounded-md mb-2';
        pill.textContent = r.category;
        card.appendChild(pill);
      }

      var name = document.createElement('h3');
      name.className = 'font-semibold text-sm text-neutral-900 dark:text-white leading-tight';
      name.textContent = r.name;
      card.appendChild(name);

      if (r.description) {
        var desc = document.createElement('p');
        desc.className = 'text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2';
        desc.textContent = r.description;
        card.appendChild(desc);
      }

      if (r.area || r.city) {
        var meta = document.createElement('div');
        meta.className = 'text-xs text-primary-700 dark:text-primary-400 mt-2';
        meta.textContent = r.area || r.city;
        card.appendChild(meta);
      }

      grid.appendChild(card);
    });

    container.appendChild(grid);

    // Suggestion
    var suggestion = document.createElement('p');
    suggestion.className = 'mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400';
    suggestion.textContent =
      'Not finding what you need? Try fewer words, or browse by category below.';
    container.appendChild(suggestion);

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderLoading(query, location) {
    var container = document.getElementById('search-results-section');
    if (!container) {
      container = document.createElement('section');
      container.id = 'search-results-section';
      var hero = document.getElementById('hero-section');
      if (hero && hero.parentNode) {
        hero.parentNode.insertBefore(container, hero.nextSibling);
      }
    }
    container.textContent = '';
    container.className = 'mt-6 mb-4';

    var loading = document.createElement('div');
    loading.className =
      'rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center';
    loading.setAttribute('role', 'status');
    loading.setAttribute('aria-label', 'Searching');

    var spinner = document.createElement('div');
    spinner.className =
      'inline-block w-6 h-6 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin mb-3';
    loading.appendChild(spinner);

    var text = document.createElement('p');
    text.className = 'text-sm text-neutral-600 dark:text-neutral-300';
    text.textContent =
      'Searching for \u201c' + query + '\u201d' + (location ? ' in ' + location : '') + '\u2026';
    loading.appendChild(text);

    container.appendChild(loading);
  }

  function renderError() {
    var container = document.getElementById('search-results-section');
    if (container) {
      container.textContent = '';
      var msg = document.createElement('div');
      msg.className =
        'rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4 text-sm text-amber-800 dark:text-amber-200';
      msg.textContent =
        'Could not load the search index. Check your connection, or browse by category below.';
      container.appendChild(msg);
    }
  }

  // --- Main handler ---
  function handleSearch() {
    var input = document.getElementById('search-input');
    var query = input ? input.value.trim() : '';
    if (!query) {
      if (input) input.focus();
      return;
    }

    var locationInput = document.getElementById('location-input');
    var locationRaw = locationInput ? locationInput.value.trim() : '';
    var location = /^near\s+me$/i.test(locationRaw) ? '' : locationRaw;

    var cleanQuery = query;
    if (location) {
      cleanQuery = query.replace(/\s*near\s+me\s*/gi, ' ').trim() || query;
    }

    var displayQuery = location ? cleanQuery : query;
    renderLoading(displayQuery, location);

    executeSearch(displayQuery, location)
      .then(function (results) {
        renderResults(results, displayQuery, location);
      })
      .catch(function () {
        renderError();
      });
  }

  // --- Location detection ---
  function handleDetectLocation() {
    var input = document.getElementById('location-input');
    if (!input || !navigator.geolocation) return;
    input.value = 'Detecting\u2026';
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        input.value = 'Near me';
        detectedGeoPoint = [pos.coords.latitude, pos.coords.longitude];
      },
      function () {
        input.value = '';
        input.placeholder = 'Location unavailable';
        detectedGeoPoint = null;
      },
      { timeout: 5000 }
    );
  }

  // --- Init ---
  function init(config) {
    Object.assign(_config, config);

    var searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearch();
        }
      });
    }

    var submitBtn = document.getElementById('search-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSearch);
    }

    var detectBtn = document.getElementById('detect-location-btn');
    if (detectBtn) {
      detectBtn.addEventListener('click', handleDetectLocation);
    }
  }

  window.HomeSearch = { init: init };
})();
