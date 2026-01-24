/**
 * Bay Navigator - Unified Onboarding
 * Single onboarding flow for the entire site
 */

(function () {
  'use strict';

  let currentStep = 1;
  const TOTAL_STEPS = 2;

  // Will be populated from data or defaults
  let GROUPS = [];
  let COUNTIES = [];

  // Default data (used if Jekyll data not available)
  const DEFAULT_GROUPS = [
    { id: 'income-eligible', name: 'Income-Eligible', icon: '💳' },
    { id: 'seniors', name: 'Seniors (60+)', icon: '👵' },
    { id: 'youth', name: 'Youth', icon: '🧒' },
    { id: 'college-students', name: 'College Students', icon: '🎓' },
    { id: 'veterans', name: 'Veterans / Active Duty', icon: '🎖️' },
    { id: 'families', name: 'Families', icon: '👨‍👩‍👧' },
    { id: 'disability', name: 'People with Disabilities', icon: '🧑‍🦽' },
    { id: 'lgbtq', name: 'LGBT+', icon: '🌈' },
    { id: 'first-responders', name: 'First Responders', icon: '🚒' },
    { id: 'teachers', name: 'Teachers/Educators', icon: '👩‍🏫' },
    { id: 'unemployed', name: 'Job Seekers', icon: '💼' },
    { id: 'immigrants', name: 'Immigrants/Refugees', icon: '🌍' },
    { id: 'unhoused', name: 'Unhoused', icon: '🏠' },
    { id: 'pregnant', name: 'Pregnant Women', icon: '🤰' },
    { id: 'caregivers', name: 'Caregivers', icon: '🤲' },
    { id: 'foster-youth', name: 'Foster Youth', icon: '🏡' },
    { id: 'reentry', name: 'Formerly Incarcerated', icon: '🔓' },
    { id: 'nonprofits', name: 'Nonprofits', icon: '🤝' },
    { id: 'everyone', name: 'Everyone', icon: '🌎' },
  ];

  const DEFAULT_COUNTIES = [
    { id: 'san-francisco', name: 'San Francisco' },
    { id: 'alameda', name: 'Alameda County' },
    { id: 'contra-costa', name: 'Contra Costa County' },
    { id: 'san-mateo', name: 'San Mateo County' },
    { id: 'santa-clara', name: 'Santa Clara County' },
    { id: 'marin', name: 'Marin County' },
    { id: 'napa', name: 'Napa County' },
    { id: 'solano', name: 'Solano County' },
    { id: 'sonoma', name: 'Sonoma County' },
  ];

  /**
   * Initialize data from Jekyll or use defaults
   */
  function initData() {
    // Check if Jekyll data is available
    if (window.siteData && window.siteData.groups) {
      GROUPS = window.siteData.groups;
      COUNTIES = window.siteData.counties || DEFAULT_COUNTIES;
    } else {
      GROUPS = DEFAULT_GROUPS;
      COUNTIES = DEFAULT_COUNTIES;
    }
  }

  /**
   * Create the onboarding modal
   */
  function createModal() {
    if (document.getElementById('onboarding-modal')) {
      return; // Already exists
    }

    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'onboarding-title');

    modal.innerHTML = `
      <div class="onboarding-backdrop"></div>
      <div class="onboarding-container">
        <div class="onboarding-content">
          <header class="onboarding-header">
            <div class="onboarding-progress">
              <div class="onboarding-progress-bar">
                <div class="onboarding-progress-fill" style="width: 50%"></div>
              </div>
              <span class="onboarding-progress-text">Step 1 of 2</span>
            </div>
            <button class="onboarding-close" type="button" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <div class="onboarding-body" id="onboarding-body">
            <!-- Steps rendered here -->
          </div>

          <footer class="onboarding-footer">
            <button class="onboarding-btn onboarding-btn-secondary" id="onboarding-skip" type="button">
              Skip for now
            </button>
            <button class="onboarding-btn onboarding-btn-secondary" id="onboarding-back" type="button">
              Back
            </button>
            <button class="onboarding-btn onboarding-btn-primary" id="onboarding-next" type="button">
              Continue
            </button>
          </footer>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.onboarding-backdrop').addEventListener('click', close);
    modal.querySelector('.onboarding-close').addEventListener('click', close);
    modal.querySelector('#onboarding-skip').addEventListener('click', finish);
    modal.querySelector('#onboarding-back').addEventListener('click', prevStep);
    modal.querySelector('#onboarding-next').addEventListener('click', nextStep);

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  /**
   * Render current step
   */
  function renderStep() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    const body = modal.querySelector('#onboarding-body');
    const backBtn = modal.querySelector('#onboarding-back');
    const nextBtn = modal.querySelector('#onboarding-next');
    const progressFill = modal.querySelector('.onboarding-progress-fill');
    const progressText = modal.querySelector('.onboarding-progress-text');

    // Update progress
    progressFill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
    progressText.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

    // Update buttons
    backBtn.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
    nextBtn.textContent = currentStep === TOTAL_STEPS ? 'Done' : 'Continue';

    // Get current preferences
    const prefs = window.Preferences ? window.Preferences.get() : { groups: [], county: null };

    if (currentStep === 1) {
      // Step 1: Select groups
      body.innerHTML = `
        <div class="onboarding-step">
          <h2 class="onboarding-title" id="onboarding-title">Which of these apply to you?</h2>
          <p class="onboarding-description">Select all that apply to see relevant programs.</p>

          <div class="onboarding-grid" role="group" aria-label="Select groups that apply to you">
            ${GROUPS.map(
              (g) => `
              <label class="onboarding-option ${prefs.groups.includes(g.id) ? 'selected' : ''}">
                <input type="checkbox" name="groups" value="${g.id}" ${prefs.groups.includes(g.id) ? 'checked' : ''}>
                <span class="onboarding-option-icon">${g.icon}</span>
                <span class="onboarding-option-label">${g.name}</span>
              </label>
            `
            ).join('')}
          </div>
        </div>
      `;

      // Add click handlers for checkboxes (multiple selection)
      body.querySelectorAll('.onboarding-option').forEach((option) => {
        const checkbox = option.querySelector('input[type="checkbox"]');

        option.addEventListener('click', (e) => {
          // Prevent double-toggling when clicking directly on the checkbox
          if (e.target === checkbox) {
            option.classList.toggle('selected', checkbox.checked);
            return;
          }
          // Toggle checkbox when clicking the label
          checkbox.checked = !checkbox.checked;
          option.classList.toggle('selected', checkbox.checked);
        });

        // Also listen for change events on the checkbox itself
        checkbox.addEventListener('change', () => {
          option.classList.toggle('selected', checkbox.checked);
        });
      });
    } else if (currentStep === 2) {
      // Step 2: Select county
      body.innerHTML = `
        <div class="onboarding-step">
          <h2 class="onboarding-title">Where do you live?</h2>
          <p class="onboarding-description">This helps us show programs in your area. Bay Area, statewide, and nationwide programs are always included.</p>

          <div class="onboarding-county-grid" role="radiogroup" aria-label="Select your county">
            ${COUNTIES.map(
              (c) => `
              <label class="onboarding-county-option ${prefs.county === c.id ? 'selected' : ''}">
                <input type="radio" name="county" value="${c.id}" ${prefs.county === c.id ? 'checked' : ''}>
                <span class="onboarding-county-label">${c.name}</span>
              </label>
            `
            ).join('')}
            <label class="onboarding-county-option ${prefs.county === 'none' || !prefs.county ? 'selected' : ''}">
              <input type="radio" name="county" value="none" ${prefs.county === 'none' || !prefs.county ? 'checked' : ''}>
              <span class="onboarding-county-label">Skip / Not in Bay Area</span>
            </label>
          </div>
        </div>
      `;

      // Add click handlers
      body.querySelectorAll('.onboarding-county-option').forEach((option) => {
        option.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            option.querySelector('input').checked = true;
          }
          body.querySelectorAll('.onboarding-county-option').forEach((o) => {
            o.classList.toggle('selected', o.querySelector('input').checked);
          });
        });
      });
    }
  }

  /**
   * Save current step selections
   */
  function saveCurrentStep() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    if (currentStep === 1) {
      const checked = modal.querySelectorAll('input[name="groups"]:checked');
      const groups = Array.from(checked).map((cb) => cb.value);
      if (window.Preferences) {
        window.Preferences.setGroups(groups);
      }
    } else if (currentStep === 2) {
      const selected = modal.querySelector('input[name="county"]:checked');
      const county = selected ? selected.value : null;
      if (window.Preferences) {
        window.Preferences.setCounty(county === 'none' ? null : county);
      }
    }
  }

  /**
   * Go to previous step
   */
  function prevStep() {
    if (currentStep > 1) {
      saveCurrentStep();
      currentStep--;
      renderStep();
    }
  }

  /**
   * Go to next step or finish
   */
  function nextStep() {
    saveCurrentStep();

    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      renderStep();
    } else {
      // Complete onboarding
      finish();
    }
  }

  /**
   * Finish onboarding
   */
  function finish() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    // Save the current step (step 2 - county) first
    saveCurrentStep();

    // Get the already-saved preferences (groups were saved when leaving step 1)
    const prefs = window.Preferences ? window.Preferences.get() : { groups: [], county: null };

    // Mark onboarding as complete
    if (window.Preferences) {
      window.Preferences.completeOnboarding(prefs.groups, prefs.county);
    }

    // Close modal
    close();

    // Dispatch completion event
    document.dispatchEvent(
      new CustomEvent('onboardingComplete', {
        detail: { groups: prefs.groups, county: prefs.county },
      })
    );

    // Apply filters if on main page
    applyFilters(prefs.groups, prefs.county);
  }

  /**
   * Apply filters to search results
   */
  function applyFilters(groups, county) {
    // Wait for searchFilter to be ready
    const tryApply = (attempts = 0) => {
      if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
        window.searchFilter.resetFilters();

        // Apply group filters
        groups.forEach((group) => {
          const btn = document.querySelector(
            `[data-filter-type="groups"][data-filter-value="${group}"]`
          );
          if (btn && !btn.classList.contains('active')) {
            btn.click();
          }
        });

        // Apply area filters
        const areas = ['Bay Area', 'Statewide', 'Nationwide'];
        if (county) {
          // Map county ID to display name
          const countyMap = {
            'san-francisco': 'San Francisco',
            alameda: 'Alameda County',
            'contra-costa': 'Contra Costa County',
            'san-mateo': 'San Mateo County',
            'santa-clara': 'Santa Clara County',
            marin: 'Marin County',
            napa: 'Napa County',
            solano: 'Solano County',
            sonoma: 'Sonoma County',
          };
          if (countyMap[county]) {
            areas.push(countyMap[county]);
          }
        }

        areas.forEach((area) => {
          const btn = document.querySelector(
            `[data-filter-type="area"][data-filter-value="${area}"]`
          );
          if (btn && !btn.classList.contains('active')) {
            btn.click();
          }
        });

        // No longer using hash-based navigation
      } else if (attempts < 50) {
        setTimeout(() => tryApply(attempts + 1), 100);
      }
    };

    tryApply();
  }

  /**
   * Open the onboarding modal
   */
  function open() {
    initData();
    createModal();

    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    currentStep = 1;
    renderStep();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus first element
    setTimeout(() => {
      const firstOption = modal.querySelector('.onboarding-option');
      if (firstOption) firstOption.focus();
    }, 100);
  }

  /**
   * Close the onboarding modal
   */
  function close() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = '';
  }

  /**
   * Check if onboarding should auto-show
   */
  function shouldAutoShow() {
    // Don't auto-show if already completed
    if (window.Preferences && window.Preferences.hasCompletedOnboarding()) {
      return false;
    }

    // Don't show in automation/testing
    if (navigator.webdriver) {
      return false;
    }

    // Check URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('no-onboarding') === '1') {
      return false;
    }

    return true;
  }

  /**
   * Initialize
   */
  function init() {
    initData();

    // Listen for manual trigger
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-onboarding]');
      if (trigger) {
        e.preventDefault();
        open();
      }
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  // Expose globally
  window.Onboarding = {
    open,
    close,
    shouldAutoShow,
  };
})();
