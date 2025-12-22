/**
 * Step Flow: Two-step onboarding wizard (Full-page experience)
 * Step 1: Select eligibility
 * Step 2: Select county (or none)
 *
 * Logic:
 * - If county selected: Show programs for that county + Bay Area-wide + Statewide + Nationwide
 * - If none selected: Show Bay Area-wide + Statewide + Nationwide only
 * - Users can then filter by category on the results page
 */

(function() {
  // Helper functions
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  // Show specific step
  function showStep(n) {
    const steps = qsa('.step-page');
    steps.forEach(step => {
      step.hidden = !step.id.endsWith(`-${n}`);
    });
  }

  // Close the page wizard and show main content
  function closeWizard() {
    const wizard = qs('#step-flow');
    if (wizard) wizard.style.display = 'none';

    // Show search results and filters after wizard completes
    const filterUI = qs('.filter-controls');
    const searchResults = qs('#search-results');
    const mobileDrawer = qs('.mobile-filter-drawer');

    if (filterUI) filterUI.style.display = 'block';
    if (searchResults) searchResults.style.display = 'block';
    if (mobileDrawer) mobileDrawer.style.display = 'block';
  }

  // Restart the wizard from step 1
  function restartWizard() {
    // Clear all selections
    qsa('input[name="eligibility"]:checked').forEach(i => { i.checked = false; });
    const countyChecked = qs('input[name="county"]:checked');
    if (countyChecked) countyChecked.checked = false;

    // Return to step 1
    showStep(1);
  }

  // Wait for searchFilter to be ready
  function waitForSearchFilter(cb, tries = 0) {
    if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
      cb();
      return;
    }
    if (tries > 50) {
      console.warn('SearchFilter not ready, applying filters anyway');
      cb();
      return;
    }
    setTimeout(() => waitForSearchFilter(cb, tries + 1), 100);
  }

  // Click a filter button
  function clickFilter(type, value) {
    const btn = qs(`[data-filter-type="${type}"][data-filter-value="${value}"]`);
    if (btn && !btn.classList.contains('active')) {
      btn.click();
    }
  }

  // Apply selected eligibility and county filters
  function applySelections(eligValues, countyValue) {
    waitForSearchFilter(() => {
      try {
        // Reset everything to a known state
        if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
          window.searchFilter.resetFilters();
        }

        // Apply eligibility filters (multi-select)
        eligValues.forEach(val => {
          clickFilter('eligibility', val);
        });

        // Areas to always include
        const alwaysInclude = ['Bay Area', 'Statewide', 'Nationwide'];
        alwaysInclude.forEach(val => {
          clickFilter('area', val);
        });

        // County-specific area (if not "none")
        if (countyValue && countyValue !== 'none') {
          clickFilter('area', countyValue);
        }

        // Ensure results render and count updates
        if (window.searchFilter) {
          if (typeof window.searchFilter.render === 'function') {
            window.searchFilter.render();
          }
          if (typeof window.searchFilter.updateResultsCount === 'function') {
            window.searchFilter.updateResultsCount();
          }
        }

        // Scroll to results
        const results = qs('#search-results');
        if (results) {
          setTimeout(() => {
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }

      } catch (e) {
        console.error('Step Flow applySelections error:', e);
      }
    });
  }

  // Get saved preferences from localStorage
  function getPrefs() {
    try {
      const raw = localStorage.getItem('bad_prefs');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Save preferences to localStorage
  function savePrefs(eligValues, countyValue) {
    const prefs = {
      eligibility: eligValues,
      county: countyValue,
      ts: Date.now()
    };
    try {
      localStorage.setItem('bad_prefs', JSON.stringify(prefs));
    } catch (err) {
      console.warn('Unable to save preferences (private browsing?)', err);
    }
  }

  // Focus trap for modal
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const wizard = qs('#step-flow');
    if (!wizard) return;

    // Set up focus trap for wizard
    trapFocus(wizard);

    // Hide search results and filters initially (wizard-first approach)
    const filterUI = qs('.filter-controls');
    const searchResults = qs('#search-results');
    const mobileDrawer = qs('.mobile-filter-drawer');

    if (filterUI) filterUI.style.display = 'none';
    if (searchResults) searchResults.style.display = 'none';
    if (mobileDrawer) mobileDrawer.style.display = 'none';

    // Skip wizard in automation/testing or if user opts out
    const params = new URLSearchParams(window.location.search);
    const isAutomation = !!navigator.webdriver;
    const optOut = params.get('no-step') === '1';

    if (isAutomation || optOut) {
      closeWizard();
      return;
    }

    // Skip buttons
    const skipBtns = qsa('.step-flow-skip');
    skipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeWizard();
      });
    });

    // Step navigation - Next buttons
    qsa('.step-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentStep = parseInt(btn.getAttribute('data-next'));

        // Validate step 1 before proceeding
        if (currentStep === 2) {
          const eligSelected = qsa('input[name="eligibility"]:checked');
          if (eligSelected.length === 0) {
            alert('Please select at least one eligibility option to continue.');
            return;
          }
        }

        showStep(currentStep);

        // Scroll to top of wizard
        wizard.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Step navigation - Back buttons
    qsa('.step-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const backStep = parseInt(btn.getAttribute('data-back'));
        showStep(backStep);

        // Scroll to top of wizard
        wizard.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Submit button - Apply selections and close wizard
    const submit = qs('.step-submit');
    if (submit) {
      submit.addEventListener('click', () => {
        // Gather eligibility selections
        const eligChecked = qsa('input[name="eligibility"]:checked');
        const eligValues = eligChecked.map(i => i.value);

        // Validate at least one eligibility selected
        if (eligValues.length === 0) {
          alert('Please select at least one eligibility option.');
          showStep(1);
          wizard.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Gather county selection
        const countyInput = qs('input[name="county"]:checked');
        const countyValue = countyInput ? countyInput.value : 'none';

        // Validate county selected
        if (!countyValue) {
          alert('Please select a county or "None of the above".');
          return;
        }

        // Save preferences
        savePrefs(eligValues, countyValue);

        // Apply selections
        applySelections(eligValues, countyValue);

        // Close wizard
        closeWizard();
      });
    }

    // Preferences - Save button
    const prefSave = qs('.pref-save');
    if (prefSave) {
      prefSave.addEventListener('click', () => {
        const eligValues = qsa('input[name="eligibility"]:checked').map(i => i.value);
        const countyInput = qs('input[name="county"]:checked');
        const countyValue = countyInput ? countyInput.value : 'none';
        savePrefs(eligValues, countyValue);
        alert('Preferences saved! They will be loaded automatically next time.');
      });
    }

    // Preferences - Apply saved button
    const prefApplySaved = qs('.pref-apply-saved');
    if (prefApplySaved) {
      prefApplySaved.addEventListener('click', () => {
        const prefs = getPrefs();
        if (!prefs) {
          alert('No saved preferences found.');
          return;
        }

        // Pre-check inputs based on saved preferences
        qsa('input[name="eligibility"]').forEach(i => {
          i.checked = prefs.eligibility && prefs.eligibility.includes(i.value);
        });
        qsa('input[name="county"]').forEach(i => {
          i.checked = (prefs.county === i.value);
        });

        alert('Saved preferences loaded!');
      });
    }

    // Show saved preferences button if available
    const prefs = getPrefs();
    if (prefs && prefApplySaved) {
      prefApplySaved.hidden = false;
    }

    // Update Filters button - reopens wizard
    document.addEventListener('click', (e) => {
      const t = e.target.closest('#update-filters-btn');
      if (t) {
        wizard.style.display = 'block';
        showStep(1);
      }
    });

    // Start at step 1
    showStep(1);
  });
})();
