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

class DiscountSearchFilter {
  constructor(options = {}) {
    this.programs = [];
    this.filteredPrograms = [];
    this.searchIndex = new Map();
    
    this.options = {
      containerSelector: options.containerSelector || '#search-results',
      searchInputSelector: options.searchInputSelector || '#search-input',
      filterButtonsSelector: options.filterButtonsSelector || '.filter-btn',
      resultsSelector: options.resultsSelector || '#search-results',
      minChars: options.minChars || 1,
      ...options
    };

    this.init();
  }

  init() {
    this.container = document.querySelector(this.options.containerSelector);
    this.searchInput = document.querySelector(this.options.searchInputSelector);
    this.resultsContainer = document.querySelector(this.options.resultsSelector) || this.container;
    
    if (this.searchInput) {
      const debouncedSearch = debounce((e) => this.handleSearch(e));
      this.searchInput.addEventListener('input', debouncedSearch);
      this.searchInput.addEventListener('focus', () => this.showSearchUI());
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
        eligibility: card.getAttribute('data-eligibility') || '',
        benefit: card.querySelector('[data-benefit]')?.textContent || '',
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
  }

  /**
   * Handle search input
   */
  handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (query.length < this.options.minChars) {
      this.resetResults();
      return;
    }

    this.filteredPrograms = this.programs.filter(program => {
      const indexed = this.searchIndex.get(program.id);
      return indexed.searchText.includes(query);
    });

    this.render();
    this.updateResultsCount();
  }

  /**
   * Handle filter button clicks
   */
  handleFilter(event, btn) {
    const filterType = btn.getAttribute('data-filter-type');
    const filterValue = btn.getAttribute('data-filter-value');

    // Toggle active state
    btn.classList.toggle('active');

    // Get all active filters
    const activeFilters = {
      eligibility: Array.from(document.querySelectorAll('[data-filter-type="eligibility"].active'))
        .map(b => b.getAttribute('data-filter-value')),
      category: Array.from(document.querySelectorAll('[data-filter-type="category"].active'))
        .map(b => b.getAttribute('data-filter-value')),
      area: Array.from(document.querySelectorAll('[data-filter-type="area"].active'))
        .map(b => b.getAttribute('data-filter-value'))
    };

    // Check if ANY filters are active
    const hasActiveFilters = activeFilters.eligibility.length > 0 ||
                             activeFilters.category.length > 0 ||
                             activeFilters.area.length > 0;

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

      // Check eligibility filters
      if (activeFilters.eligibility.length > 0) {
        const hasEligibility = activeFilters.eligibility.some(elig =>
          program.eligibility.includes(elig)
        );
        match = match && hasEligibility;
      }

      // Check category filters
      if (activeFilters.category.length > 0) {
        match = match && activeFilters.category.includes(program.category);
      }

      // Check area filters
      if (activeFilters.area.length > 0) {
        const hasArea = activeFilters.area.some(area =>
          program.area.includes(area)
        );
        match = match && hasArea;
      }

      return match;
    });

    this.render();
    this.updateResultsCount();
  }

  /**
   * Render filtered programs
   */
  render() {
    const visibleIds = new Set(this.filteredPrograms.map(p => p.id));

    this.programs.forEach(program => {
      const show = visibleIds.has(program.id);
      program.element.style.display = show ? '' : 'none';
    });

    // Show empty state message
    const emptyId = 'search-empty-state';
    let empty = document.getElementById(emptyId);
    if (!empty) {
      empty = document.createElement('div');
      empty.id = emptyId;
      empty.className = 'no-results';
      empty.innerHTML = '<p>No programs found. Try clearing filters.</p>';
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

    // Clear search input
    if (this.searchInput) {
      this.searchInput.value = '';
    }

    // Reset to show all programs
    this.filteredPrograms = [...this.programs];
    
    // Render all programs
    this.render();
    this.updateResultsCount();
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
});
