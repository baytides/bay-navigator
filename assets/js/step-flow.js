/**
 * Step Flow: Three-step onboarding wizard (Full-page experience)
 * Step 1: Introduction / About (Bay Tides info)
 * Step 2: Select eligibility
 * Step 3: Select county (or none)
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

  // Show specific step with screen reader announcement
  function showStep(n) {
    const steps = qsa('.step-page');
    steps.forEach(step => {
      step.hidden = !step.id.endsWith(`-${n}`);
    });

    // Announce step change to screen readers
    const announcement = qs('#step-announcement');
    if (announcement) {
      const stepTitles = {
        1: 'Step 1 of 3: Introduction. Learn about Bay Area Discounts.',
        2: 'Step 2 of 3: Eligibility. Select which groups apply to you.',
        3: 'Step 3 of 3: Location. Select your county.'
      };
      announcement.textContent = stepTitles[n] || `Step ${n} of 3`;
    }

    // Focus the step heading for keyboard users
    const currentStep = qs(`#step-${n}`);
    if (currentStep) {
      const heading = currentStep.querySelector('h1');
      if (heading) {
        // Small delay to ensure visibility change is processed
        setTimeout(() => {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }, 100);
      }
    }
  }

  // Close the page wizard and show main content with smooth transition
  function closeWizard() {
    const wizard = qs('#step-flow');
    const searchPanel = qs('.search-panel');
    const searchResults = qs('#search-results');
    const filterUI = qs('.filter-controls');
    const mobileDrawer = qs('.mobile-filter-drawer');

    // Check for reduced motion preference or automation mode
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isAutomation = !!navigator.webdriver;

    if (wizard && !prefersReducedMotion && !isAutomation) {
      // Add closing animation class
      wizard.classList.add('closing');

      // Wait for animation to complete before hiding
      setTimeout(() => {
        wizard.style.display = 'none';
        wizard.classList.remove('closing');

        // Show and animate main content
        if (filterUI) filterUI.style.display = '';
        if (mobileDrawer) mobileDrawer.style.display = '';

        // Add entrance animation to search panel
        if (searchPanel) {
          searchPanel.style.display = '';
          searchPanel.classList.add('entering');
          setTimeout(() => searchPanel.classList.remove('entering'), 600);
        }

        // Add entrance animation to results
        if (searchResults) {
          searchResults.style.display = '';
          searchResults.classList.add('entering');
          setTimeout(() => searchResults.classList.remove('entering'), 800);
        }
      }, 400);
    } else {
      // Instant transition for reduced motion, automation, or no wizard
      if (wizard) wizard.style.display = 'none';
      if (filterUI) filterUI.style.display = '';
      if (searchPanel) searchPanel.style.display = '';
      if (searchResults) searchResults.style.display = '';
      if (mobileDrawer) mobileDrawer.style.display = '';
    }
  }

  // Restart the wizard from step 1
  function restartWizard() {
    // Clear all selections
    qsa('input[name="groups"]:checked').forEach(i => { i.checked = false; });
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

        // Apply groups filters (multi-select)
        eligValues.forEach(val => {
          clickFilter('groups', val);
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

  // Get wizard progress from localStorage
  function getWizardProgress() {
    try {
      const raw = localStorage.getItem('bad_wizard_progress');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Save wizard progress to localStorage
  function saveWizardProgress(step, eligValues, countyValue) {
    const progress = {
      step: step,
      eligibility: eligValues || [],
      county: countyValue || null,
      ts: Date.now()
    };
    try {
      localStorage.setItem('bad_wizard_progress', JSON.stringify(progress));
    } catch (err) {
      // Ignore storage errors
    }
  }

  // Clear wizard progress
  function clearWizardProgress() {
    try {
      localStorage.removeItem('bad_wizard_progress');
    } catch (err) {
      // Ignore
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

    // Get elements that need to be hidden/shown
    const filterUI = qs('.filter-controls');
    const searchPanel = qs('.search-panel');
    const searchResults = qs('#search-results');
    const mobileDrawer = qs('.mobile-filter-drawer');

    // Skip wizard in automation/testing, if user opts out, or if returning visitor with saved prefs
    const params = new URLSearchParams(window.location.search);
    const isAutomation = !!navigator.webdriver;
    const optOut = params.get('no-step') === '1';
    const forceStep = params.get('force-step') === '1';
    const savedPrefs = getPrefs();
    const hasCompletedWizard = !!savedPrefs;

    // Check if we should skip the wizard BEFORE hiding elements
    if ((isAutomation || optOut || hasCompletedWizard) && !forceStep) {
      // If returning visitor with saved preferences, auto-apply them
      if (hasCompletedWizard && !optOut) {
        applySelections(savedPrefs.eligibility || [], savedPrefs.county || 'none');
      }
      // Hide wizard immediately, show content immediately (no animation for skip)
      wizard.style.display = 'none';
      // Ensure all content elements are visible
      if (filterUI) filterUI.style.display = '';
      if (searchPanel) searchPanel.style.display = '';
      if (searchResults) searchResults.style.display = '';
      if (mobileDrawer) mobileDrawer.style.display = '';
      return;
    }

    // Hide search results and filters initially (wizard-first approach)
    // Only do this if we're actually showing the wizard
    if (filterUI) filterUI.style.display = 'none';
    if (searchPanel) searchPanel.style.display = 'none';
    if (searchResults) searchResults.style.display = 'none';
    if (mobileDrawer) mobileDrawer.style.display = 'none';

    // Check for saved wizard progress (user abandoned mid-wizard)
    const savedProgress = getWizardProgress();
    if (savedProgress && savedProgress.step && !forceStep) {
      // Only restore if progress is less than 24 hours old
      const progressAge = Date.now() - (savedProgress.ts || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (progressAge < maxAge) {
        // Restore eligibility selections
        if (savedProgress.eligibility && savedProgress.eligibility.length > 0) {
          qsa('input[name="groups"]').forEach(i => {
            i.checked = savedProgress.eligibility.includes(i.value);
          });
        }

        // Restore county selection
        if (savedProgress.county) {
          qsa('input[name="county"]').forEach(i => {
            i.checked = (savedProgress.county === i.value);
          });
        }

        // Resume at saved step
        showStep(savedProgress.step);
      }
    }

    // Skip buttons
    const skipBtns = qsa('.step-flow-skip');
    skipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        closeWizard();
      });
    });

    // Quick jump to category buttons
    qsa('.quick-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        if (!category) return;

        // Close wizard
        closeWizard();

        // Wait for searchFilter to be ready, then apply category filter
        waitForSearchFilter(() => {
          try {
            // Reset filters first
            if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
              window.searchFilter.resetFilters();
            }

            // Click the category filter
            const categoryBtn = qs(`[data-filter-type="category"][data-filter-value="${category}"]`);
            if (categoryBtn) {
              categoryBtn.click();
            }

            // Scroll to results
            const results = qs('#search-results');
            if (results) {
              setTimeout(() => {
                results.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 300);
            }
          } catch (e) {
            console.error('Quick jump error:', e);
          }
        });
      });
    });

    // Step navigation - Next buttons
    qsa('.step-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.getAttribute('data-next'));

        // Validate step 2 (eligibility) before proceeding to step 3
        if (nextStep === 3) {
          const eligSelected = qsa('input[name="groups"]:checked');
          if (eligSelected.length === 0) {
            alert('Please select at least one eligibility option to continue.');
            return;
          }
        }

        // Save progress
        const eligValues = qsa('input[name="groups"]:checked').map(i => i.value);
        const countyInput = qs('input[name="county"]:checked');
        const countyValue = countyInput ? countyInput.value : null;
        saveWizardProgress(nextStep, eligValues, countyValue);

        showStep(nextStep);

        // Scroll to top of wizard
        wizard.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Step navigation - Back buttons
    qsa('.step-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const backStep = parseInt(btn.getAttribute('data-back'));

        // Save progress
        const eligValues = qsa('input[name="groups"]:checked').map(i => i.value);
        const countyInput = qs('input[name="county"]:checked');
        const countyValue = countyInput ? countyInput.value : null;
        saveWizardProgress(backStep, eligValues, countyValue);

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
        const eligChecked = qsa('input[name="groups"]:checked');
        const eligValues = eligChecked.map(i => i.value);

        // Validate at least one eligibility selected
        if (eligValues.length === 0) {
          alert('Please select at least one eligibility option.');
          showStep(2);
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

        // Save preferences and clear progress
        savePrefs(eligValues, countyValue);
        clearWizardProgress();

        // Apply selections
        applySelections(eligValues, countyValue);

        // Switch to directory view to show filtered results
        // Update URL hash to directory so for-you.js shows the search panel
        history.replaceState({ view: 'directory' }, '', '#directory');

        // Trigger view change event for for-you.js to update visibility
        document.dispatchEvent(new CustomEvent('viewChange', { detail: { view: 'directory' } }));

        // Close wizard
        closeWizard();
      });
    }

    // Preferences - Save button
    const prefSave = qs('.pref-save');
    if (prefSave) {
      prefSave.addEventListener('click', () => {
        const eligValues = qsa('input[name="groups"]:checked').map(i => i.value);
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
        qsa('input[name="groups"]').forEach(i => {
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
