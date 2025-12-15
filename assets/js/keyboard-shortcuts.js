// Keyboard Shortcuts for Bay Area Discounts

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = {
      '/': this.focusSearch.bind(this),
      'Escape': this.clearFilters.bind(this),
      '?': this.showHelp.bind(this)
    };
    
    this.init();
  }
  
  init() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Allow Escape to blur input
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }
      
      const handler = this.shortcuts[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }
  
  focusSearch() {
    const searchInput = document.getElementById('search-input') || document.getElementById('search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  clearFilters() {
    // Trigger clear filters if the function exists
    if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
      window.searchFilter.resetFilters();
    }
    
    // Also clear search input
    const searchInput = document.getElementById('search-input') || document.getElementById('search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  showHelp() {
    const helpModal = document.getElementById('keyboard-help-modal');
    if (helpModal) {
      helpModal.classList.add('show');
    }
  }
}

// Initialize keyboard shortcuts
document.addEventListener('DOMContentLoaded', function() {
  new KeyboardShortcuts();
});
