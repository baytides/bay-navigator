/**
 * Bay Area Discounts - Search & Filter System
 * Provides client-side full-text search and dynamic filtering
 * Optimized for Vision Pro and responsive design
 */

const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Simple fuzzy matching - allows for typos and partial matches
 * Returns a score (higher = better match), or 0 for no match
 */
function fuzzyMatch(text, query) {
  if (!text || !query) return 0;

  text = text.toLowerCase();
  query = query.toLowerCase();

  // Exact match gets highest score
  if (text.includes(query)) {
    return 100 + (query.length / text.length) * 50;
  }

  // Check if all query characters appear in order (fuzzy)
  let textIndex = 0;
  let queryIndex = 0;
  let matchedChars = 0;
  let consecutiveBonus = 0;
  let lastMatchIndex = -2;

  while (textIndex < text.length && queryIndex < query.length) {
    if (text[textIndex] === query[queryIndex]) {
      matchedChars++;
      // Bonus for consecutive matches
      if (textIndex === lastMatchIndex + 1) {
        consecutiveBonus += 5;
      }
      lastMatchIndex = textIndex;
      queryIndex++;
    }
    textIndex++;
  }

  // All query characters must be found
  if (queryIndex < query.length) {
    return 0;
  }

  // Calculate score based on match quality
  const matchRatio = matchedChars / query.length;
  const positionPenalty = (textIndex - matchedChars) / text.length;

  return Math.max(0, (matchRatio * 50) + consecutiveBonus - (positionPenalty * 20));
}

/**
 * Recent searches manager
 */
const RecentSearches = {
  STORAGE_KEY: 'bayarea_recent_searches',
  MAX_ITEMS: 5,

  get() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  add(query) {
    if (!query || query.length < 2) return;

    let searches = this.get();
    // Remove if already exists
    searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    // Add to front
    searches.unshift(query);
    // Keep only MAX_ITEMS
    searches = searches.slice(0, this.MAX_ITEMS);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(searches));
    } catch (e) {
      // Storage full or unavailable
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  }
};

class DiscountSearchFilter {
  constructor(options = {}) {
    this.programs = [];
    this.filteredPrograms = [];
    this.searchIndex = new Map();
    this.currentSort = 'name-asc';
    
    this.options = {
      containerSelector: options.containerSelector || '#search-results',
      searchInputSelector: options.searchInputSelector || '#search-input',
      filterButtonsSelector: options.filterButtonsSelector || '.filter-btn',
      resultsSelector: options.resultsSelector || '#search-results',
      sortSelectSelector: options.sortSelectSelector || '#sort-select',
      minChars: options.minChars || 1,
      ...options
    };

    this.init();
  }

  init() {
    this.container = document.querySelector(this.options.containerSelector);
    this.searchInput = document.querySelector(this.options.searchInputSelector);
    this.resultsContainer = document.querySelector(this.options.resultsSelector) || this.container;
    this.sortSelect = document.querySelector(this.options.sortSelectSelector);
    this.currentQuery = '';

    if (this.searchInput) {
      const debouncedSearch = debounce((e) => this.handleSearch(e));
      this.searchInput.addEventListener('input', debouncedSearch);
      this.searchInput.addEventListener('focus', () => {
        this.showSearchUI();
        this.showSuggestions();
      });
      this.searchInput.addEventListener('blur', () => {
        // Delay hiding to allow clicking on suggestions
        setTimeout(() => this.hideSuggestions(), 200);
      });
      this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));

      // Create suggestions dropdown
      this.createSuggestionsDropdown();
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => this.handleSort(e));
    }

    // Set up filter buttons via event delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest(this.options.filterButtonsSelector);
      if (btn) {
        this.handleFilter(e, btn);
      }
    });

    this.buildSearchIndex();
  }

  /**
   * Update filter count badges
   */
  updateFilterCounts() {
    // Count programs per category
    const categoryCounts = {};
    const groupsCounts = {};

    this.programs.forEach(program => {
      // Category counts
      if (program.category) {
        categoryCounts[program.category] = (categoryCounts[program.category] || 0) + 1;
      }

      // Groups counts (formerly eligibility)
      if (program.groups) {
        const groupsList = program.groups.split(' ');
        groupsList.forEach(group => {
          if (group.trim()) {
            groupsCounts[group.trim()] = (groupsCounts[group.trim()] || 0) + 1;
          }
        });
      }
    });

    // Update category count badges
    document.querySelectorAll('.filter-count[data-count-for]').forEach(badge => {
      const countFor = badge.getAttribute('data-count-for');
      const count = categoryCounts[countFor] || groupsCounts[countFor] || 0;
      badge.textContent = count > 0 ? count : '';
    });
  }

  /**
   * Create the search suggestions dropdown
   */
  createSuggestionsDropdown() {
    if (!this.searchInput) return;

    const wrapper = this.searchInput.parentElement;
    if (!wrapper) return;

    // Make sure wrapper is positioned
    wrapper.style.position = 'relative';

    this.suggestionsEl = document.createElement('div');
    this.suggestionsEl.className = 'search-suggestions';
    this.suggestionsEl.setAttribute('role', 'listbox');
    this.suggestionsEl.setAttribute('aria-label', 'Search suggestions');
    this.suggestionsEl.style.display = 'none';

    wrapper.appendChild(this.suggestionsEl);
  }

  /**
   * Show search suggestions (recent searches + popular programs)
   */
  showSuggestions() {
    if (!this.suggestionsEl) return;

    const query = this.searchInput?.value.trim().toLowerCase() || '';
    const recentSearches = RecentSearches.get();

    // If there's a query, show matching suggestions
    if (query.length >= 1) {
      const matchingPrograms = this.programs
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 5);

      if (matchingPrograms.length === 0 && recentSearches.length === 0) {
        this.hideSuggestions();
        return;
      }

      let html = '';

      // Show matching programs as suggestions
      if (matchingPrograms.length > 0) {
        html += '<div class="suggestions-section"><span class="suggestions-label">Programs</span>';
        matchingPrograms.forEach((program, index) => {
          html += `<button class="suggestion-item" data-type="program" data-value="${this.escapeHtml(program.name)}" role="option" tabindex="-1">
            <span class="suggestion-icon">📋</span>
            <span class="suggestion-text">${this.escapeHtml(program.name)}</span>
          </button>`;
        });
        html += '</div>';
      }

      this.suggestionsEl.innerHTML = html;
      this.suggestionsEl.style.display = 'block';
      this.selectedSuggestionIndex = -1;
      return;
    }

    // Show recent searches when input is empty/focused
    if (recentSearches.length === 0) {
      this.hideSuggestions();
      return;
    }

    let html = '<div class="suggestions-section">';
    html += '<div class="suggestions-header"><span class="suggestions-label">Recent Searches</span>';
    html += '<button class="clear-recent" type="button" aria-label="Clear recent searches">Clear</button></div>';

    recentSearches.forEach((search, index) => {
      html += `<button class="suggestion-item" data-type="recent" data-value="${this.escapeHtml(search)}" role="option" tabindex="-1">
        <span class="suggestion-icon">🕐</span>
        <span class="suggestion-text">${this.escapeHtml(search)}</span>
      </button>`;
    });

    html += '</div>';
    this.suggestionsEl.innerHTML = html;
    this.suggestionsEl.style.display = 'block';
    this.selectedSuggestionIndex = -1;

    // Add click handler for clear button
    const clearBtn = this.suggestionsEl.querySelector('.clear-recent');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        RecentSearches.clear();
        this.hideSuggestions();
      });
    }

    // Add click handlers for suggestion items
    this.suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const value = item.getAttribute('data-value');
        if (value && this.searchInput) {
          this.searchInput.value = value;
          this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          this.hideSuggestions();
        }
      });
    });
  }

  /**
   * Hide suggestions dropdown
   */
  hideSuggestions() {
    if (this.suggestionsEl) {
      this.suggestionsEl.style.display = 'none';
    }
  }

  /**
   * Handle keyboard navigation in search
   */
  handleSearchKeydown(event) {
    if (!this.suggestionsEl || this.suggestionsEl.style.display === 'none') return;

    const items = this.suggestionsEl.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, items.length - 1);
        this.updateSuggestionSelection(items);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        this.updateSuggestionSelection(items);
        break;

      case 'Enter':
        if (this.selectedSuggestionIndex >= 0 && items[this.selectedSuggestionIndex]) {
          event.preventDefault();
          items[this.selectedSuggestionIndex].click();
        }
        break;

      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Update visual selection state of suggestions
   */
  updateSuggestionSelection(items) {
    items.forEach((item, index) => {
      if (index === this.selectedSuggestionIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * Build searchable index from all program cards
   */
  buildSearchIndex() {
    const cards = document.querySelectorAll('#search-results [data-program]');

    cards.forEach(card => {
      const programData = {
        id: card.getAttribute('data-program-id') || Math.random(),
        name: card.getAttribute('data-program-name') || '',
        category: card.getAttribute('data-category') || '',
        area: card.getAttribute('data-area') || '',
        city: card.getAttribute('data-city') || '',
        groups: card.getAttribute('data-groups') || card.getAttribute('data-eligibility') || '',
        benefit: card.querySelector('[data-benefit]')?.textContent || '',
        verifiedDate: card.querySelector('.verified-badge')?.getAttribute('data-verified') || '',
        element: card,
        visible: true
      };

      // Build searchable text
      const searchText = `
        ${programData.name} 
        ${programData.category} 
        ${programData.area} 
        ${programData.benefit}
      `.toLowerCase();

      this.programs.push(programData);
      this.searchIndex.set(programData.id, { ...programData, searchText });
    });

    this.filteredPrograms = [...this.programs];

    // Update filter count badges after building index
    this.updateFilterCounts();
  }

  /**
   * Handle search input
   */
  handleSearch(event) {
    const query = event.target.value.trim();
    this.currentQuery = query;

    if (query.length < this.options.minChars) {
      this.clearHighlights();
      this.resetResults();
      return;
    }

    // Score and filter programs using fuzzy matching
    const scoredPrograms = this.programs.map(program => {
      const indexed = this.searchIndex.get(program.id);
      if (!indexed) return { program, score: 0 };

      // Calculate fuzzy match scores for different fields
      const nameScore = fuzzyMatch(indexed.name, query) * 2; // Name matches are most important
      const categoryScore = fuzzyMatch(indexed.category, query) * 1.5;
      const benefitScore = fuzzyMatch(indexed.benefit, query);
      const areaScore = fuzzyMatch(indexed.area, query);

      const totalScore = nameScore + categoryScore + benefitScore + areaScore;
      return { program, score: totalScore };
    });

    // Filter to programs with positive scores and sort by score
    this.filteredPrograms = scoredPrograms
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.program);

    // Save to recent searches (debounced - only after typing stops)
    if (query.length >= 2) {
      clearTimeout(this._recentSearchTimer);
      this._recentSearchTimer = setTimeout(() => {
        if (this.filteredPrograms.length > 0) {
          RecentSearches.add(query);
        }
      }, 1000);
    }

    this.render();
    this.highlightMatches(query);
    this.updateResultsCount();
  }

  /**
   * Highlight search matches in program cards
   */
  highlightMatches(query) {
    if (!query || query.length < 2) {
      this.clearHighlights();
      return;
    }

    const lowerQuery = query.toLowerCase();

    this.filteredPrograms.forEach(program => {
      const nameEl = program.element.querySelector('.program-name');
      const benefitEl = program.element.querySelector('[data-benefit]');

      if (nameEl) {
        this.highlightText(nameEl, lowerQuery);
      }
      if (benefitEl) {
        this.highlightText(benefitEl, lowerQuery);
      }
    });
  }

  /**
   * Highlight matching text within an element
   */
  highlightText(element, query) {
    // Get original text (stored or current)
    const originalText = element.getAttribute('data-original-text') || element.textContent;
    element.setAttribute('data-original-text', originalText);

    const lowerText = originalText.toLowerCase();
    const index = lowerText.indexOf(query);

    if (index === -1) {
      element.textContent = originalText;
      return;
    }

    // Create highlighted version
    const before = originalText.slice(0, index);
    const match = originalText.slice(index, index + query.length);
    const after = originalText.slice(index + query.length);

    element.innerHTML = `${this.escapeHtml(before)}<mark class="search-highlight">${this.escapeHtml(match)}</mark>${this.escapeHtml(after)}`;
  }

  /**
   * Clear all search highlights
   */
  clearHighlights() {
    document.querySelectorAll('[data-original-text]').forEach(el => {
      el.textContent = el.getAttribute('data-original-text');
      el.removeAttribute('data-original-text');
    });
  }

  /**
   * Escape HTML to prevent XSS
   * Uses shared utility if available, falls back to local implementation
   */
  escapeHtml(text) {
    if (window.AppUtils && window.AppUtils.escapeHtml) {
      return window.AppUtils.escapeHtml(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle filter button clicks
   */
  handleFilter(event, btn) {
    const filterType = btn.getAttribute('data-filter-type');
    const filterValue = btn.getAttribute('data-filter-value');
    const isAllButton = btn.getAttribute('data-all') === 'true';

    // Handle "All" buttons as exclusive per type
    if (isAllButton) {
      document.querySelectorAll(`[data-filter-type="${filterType}"]`).forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      const allBtn = document.querySelector(`[data-filter-type="${filterType}"][data-all="true"]`);
      if (allBtn) {
        allBtn.classList.remove('active');
        allBtn.setAttribute('aria-pressed', 'false');
      }

      btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');

      // If nothing remains active for this type, restore the "All" state
      const remainingActive = document.querySelectorAll(`[data-filter-type="${filterType}"].active:not([data-all="true"])`);
      if (remainingActive.length === 0 && allBtn) {
        allBtn.classList.add('active');
        allBtn.setAttribute('aria-pressed', 'true');
      }
    }

    const activeFilters = this.getActiveFilters();
    const hasActiveFilters = Object.values(activeFilters).some(list => list.length > 0);

    // If no filters are active, show everything
    if (!hasActiveFilters) {
      this.filteredPrograms = [...this.programs];
      this.render();
      this.updateResultsCount();
      return;
    }

    // Filter programs based on active filters
    this.filteredPrograms = this.programs.filter(program => {
      let match = true;

      // Check groups filters (formerly eligibility)
      if (activeFilters.groups.length > 0) {
        const hasGroup = activeFilters.groups.some(group =>
          program.groups.includes(group)
        );
        match = match && hasGroup;
      }

      // Check category filters
      if (activeFilters.category.length > 0) {
        match = match && activeFilters.category.includes(program.category);
      }

      // Check area filters
      if (activeFilters.area.length > 0) {
        const hasArea = activeFilters.area.some(area => {
          // "Other" matches Bay Area-wide, Statewide, or Nationwide programs
          if (area === 'Other') {
            return program.area.includes('Bay Area') ||
                   program.area.includes('Statewide') ||
                   program.area.includes('Nationwide');
          }
          // For specific counties, also include Bay Area-wide, Statewide, and Nationwide programs
          // since those apply to everyone in that county
          if (program.area.includes(area)) {
            return true;
          }
          // Also show broader programs that apply to all counties
          if (program.area.includes('Bay Area') ||
              program.area.includes('Statewide') ||
              program.area.includes('Nationwide')) {
            return true;
          }
          return false;
        });
        match = match && hasArea;
      }

      return match;
    });

    this.render();
    this.updateResultsCount();
  }

  /**
   * Handle sort selection
   */
  handleSort(event) {
    this.currentSort = event.target.value;
    this.sortPrograms();
    this.render();
  }

  /**
   * Sort programs based on current sort option
   */
  sortPrograms() {
    // Handle special case for recently-verified
    if (this.currentSort === 'recently-verified') {
      this.filteredPrograms.sort((a, b) => {
        const dateA = a.verifiedDate ? new Date(a.verifiedDate).getTime() : 0;
        const dateB = b.verifiedDate ? new Date(b.verifiedDate).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
      return;
    }

    const [field, order] = this.currentSort.split('-');

    this.filteredPrograms.sort((a, b) => {
      let compareA, compareB;

      switch(field) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'category':
          compareA = a.category.toLowerCase();
          compareB = b.category.toLowerCase();
          break;
        case 'area':
          // Use city if available, otherwise use area (county)
          compareA = (a.city || a.area || '').toLowerCase();
          compareB = (b.city || b.area || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      } else {
        return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
      }
    });
  }

  /**
   * Render filtered programs
   */
  render() {
    // First, hide all programs
    this.programs.forEach(program => {
      program.element.style.display = 'none';
    });
    
    // Then show filtered programs in sorted order
    this.filteredPrograms.forEach((program, index) => {
      program.element.style.display = '';
      program.element.style.order = index;
    });

    // Show empty state message
    const emptyId = 'search-empty-state';
    let empty = document.getElementById(emptyId);
    if (!empty) {
      empty = document.createElement('div');
      empty.id = emptyId;
      empty.className = 'no-results';
      const text = window.i18n ? i18n.t('results.none') : 'No programs found. Try clearing filters.';
      empty.innerHTML = `<p>${text}</p>`;
      this.resultsContainer?.parentNode?.insertBefore(empty, this.resultsContainer);
    }
    empty.style.display = this.filteredPrograms.length ? 'none' : 'block';

    if (window.favorites && typeof window.favorites.updateUI === 'function') {
      window.favorites.updateUI();
    }
  }

  /**
   * Reset search results (but keep showing all programs)
   */
  resetResults() {
    this.filteredPrograms = [...this.programs];

    this.programs.forEach(program => {
      program.element.style.display = '';
    });

    this.updateResultsCount();

    if (window.favorites && typeof window.favorites.updateUI === 'function') {
      window.favorites.updateUI();
    }
  }

  /**
   * Reset all filters and search (shows everything)
   */
  resetFilters() {
    // Clear all filter buttons
    document.querySelectorAll(this.options.filterButtonsSelector).forEach(btn => {
      btn.classList.remove('active');
    });

    // Reactivate each "All" button to show defaults
    document.querySelectorAll(`${this.options.filterButtonsSelector}[data-all="true"]`).forEach(btn => {
      btn.classList.add('active');
    });

    // Clear search input
    if (this.searchInput) {
      this.searchInput.value = '';
    }

    // Reset to show all programs
    this.filteredPrograms = [...this.programs];
    
    // Render all programs
    this.sortPrograms();
    this.render();
    this.updateResultsCount();
  }

  /**
   * Get active filters grouped by type (excludes "All" buttons)
   */
  getActiveFilters() {
    const filtersByType = {};
    const filterButtons = document.querySelectorAll(this.options.filterButtonsSelector);

    filterButtons.forEach(btn => {
      const type = btn.getAttribute('data-filter-type');
      const isAll = btn.getAttribute('data-all') === 'true';
      if (!type) return;

      if (!filtersByType[type]) {
        filtersByType[type] = [];
      }

      if (btn.classList.contains('active') && !isAll) {
        filtersByType[type].push(btn.getAttribute('data-filter-value'));
      }
    });

    ['groups', 'category', 'area'].forEach(type => {
      if (!filtersByType[type]) {
        filtersByType[type] = [];
      }
    });

    return filtersByType;
  }
  
  /**
   * Show/hide search UI
   */
  showSearchUI() {
    const searchPanel = document.querySelector('.search-panel');
    if (searchPanel) {
      searchPanel.classList.add('active');
    }
  }

  /**
   * Update results count display
   */
  updateResultsCount() {
    const countEl = document.querySelector('.results-count');
    if (countEl) {
      const total = this.programs.length;
      const showing = this.filteredPrograms.length;
      
      if (showing === total) {
        countEl.textContent = `Showing all ${total} programs`;
      } else {
        countEl.textContent = `${showing} of ${total} program${showing !== 1 ? 's' : ''}`;
      }
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.searchFilter = new DiscountSearchFilter({
    containerSelector: '.programs-container',
    searchInputSelector: '#search-input',
    filterButtonsSelector: '.filter-btn',
    resultsSelector: '#search-results'
  });

  // Restore filters/search from URL parameters
  if (typeof URLSharing !== 'undefined') {
    const sharing = new URLSharing();
    const state = sharing.getInitialState();

    // Apply search term
    if (state.search) {
      const input = document.querySelector('#search-input');
      if (input) {
        input.value = state.search;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Apply filters for groups, category, area
    ['groups', 'category', 'area'].forEach(type => {
      const val = state[type];
      if (!val) return;
      const btn = document.querySelector(`[data-filter-type="${type}"][data-filter-value="${val}"]`);
      if (btn) {
        btn.click();
      }
    });
  }
});
