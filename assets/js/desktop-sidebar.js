/**
 * Desktop Sidebar Navigation
 * Handles sidebar navigation, view switching, and state management
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', initSidebar);

  function initSidebar() {
    const sidebar = document.getElementById('desktop-sidebar');
    if (!sidebar) return;

    // Initialize components
    initNavigation();
    initThemeToggle();
    initSpacingToggle();
    initSavedCount();
    initProgramCount();
    initActionButtons();
  }

  /**
   * Initialize navigation between views
   */
  function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav-item[data-view]');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Allow normal navigation for external links
        if (item.getAttribute('href') && !item.getAttribute('href').startsWith('#')) {
          return;
        }

        e.preventDefault();

        const view = item.dataset.view;
        switchView(view);

        // Update active state
        navItems.forEach(nav => {
          nav.classList.remove('active');
          nav.setAttribute('aria-current', 'false');
        });
        item.classList.add('active');
        item.setAttribute('aria-current', 'true');

        // Update URL hash
        if (view) {
          history.pushState({ view }, '', `#${view}`);
        }
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        switchView(e.state.view);
        updateActiveNav(e.state.view);
      } else {
        // Default to For You
        const hash = window.location.hash.slice(1);
        const view = hash || 'for-you';
        switchView(view);
        updateActiveNav(view);
      }
    });

    // Check initial hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash && ['for-you', 'directory', 'saved'].includes(initialHash)) {
      switchView(initialHash);
      updateActiveNav(initialHash);
    }
  }

  /**
   * Switch between views (For You, Directory, etc.)
   */
  function switchView(view) {
    // Dispatch custom event for other scripts to handle
    document.dispatchEvent(new CustomEvent('viewChange', {
      detail: { view }
    }));

    // Show/hide relevant sections
    const forYouSection = document.getElementById('for-you-section');
    const directorySection = document.getElementById('directory-section');
    const searchFilters = document.querySelector('.search-panel');

    if (view === 'for-you') {
      if (forYouSection) forYouSection.hidden = false;
      if (directorySection) directorySection.hidden = true;
      if (searchFilters) searchFilters.hidden = true;
    } else if (view === 'directory') {
      if (forYouSection) forYouSection.hidden = true;
      if (directorySection) directorySection.hidden = false;
      if (searchFilters) searchFilters.hidden = false;
    }

    // Update page title
    const titles = {
      'for-you': 'For You - Bay Area Discounts',
      'directory': 'Directory - Bay Area Discounts',
      'saved': 'Saved Programs - Bay Area Discounts'
    };
    if (titles[view]) {
      document.title = titles[view];
    }
  }

  /**
   * Update active nav item
   */
  function updateActiveNav(view) {
    const navItems = document.querySelectorAll('.sidebar-nav-item[data-view]');
    navItems.forEach(item => {
      const isActive = item.dataset.view === view;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  /**
   * Initialize theme toggle in sidebar
   */
  function initThemeToggle() {
    const themeToggle = document.getElementById('sidebar-theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    if (!themeToggle) return;

    // Update label based on current theme
    function updateThemeLabel() {
      const theme = localStorage.getItem('theme-preference') || 'auto';
      const labels = {
        'auto': 'System',
        'light': 'Light',
        'dark': 'Dark'
      };
      if (themeLabel) {
        themeLabel.textContent = labels[theme] || 'System';
      }
    }

    updateThemeLabel();

    themeToggle.addEventListener('click', () => {
      // Cycle through: auto -> light -> dark -> auto
      const current = localStorage.getItem('theme-preference') || 'auto';
      let next;
      if (current === 'auto') {
        next = 'light';
      } else if (current === 'light') {
        next = 'dark';
      } else {
        next = 'auto';
      }

      localStorage.setItem('theme-preference', next);

      // Apply theme
      const isDark = next === 'dark' || (next === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');

      updateThemeLabel();
    });
  }

  /**
   * Initialize text spacing toggle in sidebar
   */
  function initSpacingToggle() {
    const spacingToggle = document.getElementById('sidebar-spacing-toggle');
    const spacingLabel = document.getElementById('spacing-label');
    if (!spacingToggle) return;

    // Update label based on current spacing
    function updateSpacingLabel() {
      const spacing = localStorage.getItem('text-spacing-preference') || 'normal';
      if (spacingLabel) {
        spacingLabel.textContent = spacing === 'enhanced' ? 'Enhanced' : 'Normal';
      }
      spacingToggle.setAttribute('aria-pressed', spacing === 'enhanced' ? 'true' : 'false');

      // Update visual state
      if (spacing === 'enhanced') {
        spacingToggle.classList.add('active');
      } else {
        spacingToggle.classList.remove('active');
      }
    }

    // Apply spacing on load
    const currentSpacing = localStorage.getItem('text-spacing-preference') || 'normal';
    if (currentSpacing === 'enhanced') {
      document.body.setAttribute('data-text-spacing', 'enhanced');
    }
    updateSpacingLabel();

    spacingToggle.addEventListener('click', () => {
      const current = localStorage.getItem('text-spacing-preference') || 'normal';
      const next = current === 'enhanced' ? 'normal' : 'enhanced';

      localStorage.setItem('text-spacing-preference', next);

      // Apply spacing
      if (next === 'enhanced') {
        document.body.setAttribute('data-text-spacing', 'enhanced');
      } else {
        document.body.removeAttribute('data-text-spacing');
      }

      updateSpacingLabel();

      // Also update utility bar toggle if it exists
      const utilitySpacingToggle = document.getElementById('spacing-toggle');
      if (utilitySpacingToggle) {
        utilitySpacingToggle.setAttribute('aria-pressed', next === 'enhanced' ? 'true' : 'false');
        if (next === 'enhanced') {
          utilitySpacingToggle.style.background = 'var(--primary, #1e40af)';
          utilitySpacingToggle.style.color = 'white';
          utilitySpacingToggle.style.borderColor = 'var(--primary, #1e40af)';
        } else {
          utilitySpacingToggle.style.background = '';
          utilitySpacingToggle.style.color = '';
          utilitySpacingToggle.style.borderColor = '';
        }
      }
    });
  }

  /**
   * Initialize saved programs count
   */
  function initSavedCount() {
    const badge = document.getElementById('saved-badge');
    const label = document.getElementById('saved-count-label');
    if (!badge && !label) return;

    function updateCount() {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const count = favorites.length;

      if (badge) {
        badge.textContent = count;
        badge.hidden = count === 0;
      }

      if (label) {
        label.textContent = count === 0 ? 'No saved' : `${count} saved`;
      }
    }

    // Initial count
    updateCount();

    // Listen for favorites changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'favorites') {
        updateCount();
      }
    });

    // Also listen for custom events from favorites.js
    document.addEventListener('favoritesUpdated', updateCount);
  }

  /**
   * Initialize program count
   */
  function initProgramCount() {
    const label = document.getElementById('program-count-label');
    if (!label) return;

    // Count programs from DOM
    const programs = document.querySelectorAll('[data-program]');
    const count = programs.length;

    if (count > 0) {
      label.textContent = `${count} programs`;
    }
  }

  /**
   * Initialize action buttons (Share, Clear Data, Update Filters, Install)
   */
  function initActionButtons() {
    // Update Filters button
    const updateFiltersBtn = document.getElementById('sidebar-update-filters');
    if (updateFiltersBtn) {
      updateFiltersBtn.addEventListener('click', () => {
        // Trigger the step flow wizard if available
        const stepFlowWizard = document.getElementById('step-flow-wizard');
        if (stepFlowWizard) {
          stepFlowWizard.style.display = '';
          stepFlowWizard.hidden = false;
        }
        // Or trigger the utility bar's update filters
        const utilityUpdateBtn = document.getElementById('update-filters-btn');
        if (utilityUpdateBtn) {
          utilityUpdateBtn.click();
        }
      });
    }

    // Share button
    const shareBtn = document.getElementById('sidebar-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        let shareUrl = window.location.href;
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('utm_source', 'sidebar');
          url.searchParams.set('utm_medium', 'share_button');
          url.searchParams.set('utm_campaign', 'user_share');
          shareUrl = url.toString();
        } catch (e) {
          // Use original URL if parsing fails
        }

        const shareData = {
          title: document.title || 'Bay Area Discounts',
          text: 'Check out Bay Area Discounts for local discount programs!',
          url: shareUrl
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
          }
        } catch (err) {
          console.log('Error sharing:', err);
        }
      });
    }

    // Install App button
    const installBtn = document.getElementById('sidebar-install');
    const installItem = document.getElementById('sidebar-install-item');
    if (installBtn && installItem) {
      // Show install button when PWA install is available
      window.addEventListener('beforeinstallprompt', () => {
        installItem.style.display = '';
      });

      installBtn.addEventListener('click', async () => {
        if (typeof window.triggerPWAInstall === 'function') {
          await window.triggerPWAInstall();
        }
      });

      // Hide after app is installed
      window.addEventListener('appinstalled', () => {
        installItem.style.display = 'none';
      });
    }

    // Clear Data button
    const clearDataBtn = document.getElementById('sidebar-clear-data');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        const confirmed = confirm(
          'This will clear all your saved data including:\n\n' +
          '• Saved/bookmarked programs\n' +
          '• Your filter preferences\n' +
          '• Theme and display settings\n\n' +
          'Are you sure you want to clear all data?'
        );

        if (confirmed) {
          try {
            localStorage.clear();

            // Reset theme to auto
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.setAttribute('data-theme', 'light');

            // Reset text spacing
            document.body.removeAttribute('data-text-spacing');

            alert('All saved data has been cleared successfully!\n\nThe page will now reload.');
            window.location.reload();
          } catch (err) {
            console.error('Error clearing data:', err);
            alert('There was an error clearing your data. Please try again.');
          }
        }
      });
    }
  }
})();
