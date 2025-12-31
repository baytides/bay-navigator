/**
 * For You - Personalized Recommendations
 * Handles user preferences, onboarding wizard, and personalized program filtering
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'user-preferences';

  // Available groups for selection
  const GROUPS = [
    { id: 'low-income', name: 'Low Income' },
    { id: 'seniors', name: 'Seniors (60+)' },
    { id: 'youth', name: 'Youth/Minors' },
    { id: 'college-students', name: 'Students' },
    { id: 'veterans', name: 'Veterans' },
    { id: 'families', name: 'Families' },
    { id: 'disability', name: 'Disability' },
    { id: 'first-responders', name: 'First Responders' },
    { id: 'teachers', name: 'Teachers' },
    { id: 'unemployed', name: 'Job Seekers' },
    { id: 'immigrants', name: 'Immigrants' },
    { id: 'caregivers', name: 'Caregivers' }
  ];

  // Bay Area counties
  const COUNTIES = [
    { id: 'alameda', name: 'Alameda County' },
    { id: 'contra-costa', name: 'Contra Costa County' },
    { id: 'marin', name: 'Marin County' },
    { id: 'napa', name: 'Napa County' },
    { id: 'san-francisco', name: 'San Francisco' },
    { id: 'san-mateo', name: 'San Mateo County' },
    { id: 'santa-clara', name: 'Santa Clara County' },
    { id: 'solano', name: 'Solano County' },
    { id: 'sonoma', name: 'Sonoma County' }
  ];

  let userPrefs = null;

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    loadPreferences();
    createForYouUI();
    createOnboardingModal();

    // Listen for view changes
    document.addEventListener('viewChange', (e) => {
      const forYouSection = document.getElementById('for-you-section');
      const directorySection = document.getElementById('directory-section');
      const searchPanel = document.querySelector('.search-panel');

      if (e.detail.view === 'for-you') {
        if (forYouSection) forYouSection.hidden = false;
        if (directorySection) directorySection.hidden = true;
        if (searchPanel) searchPanel.hidden = true;
        refreshForYouView();
      } else if (e.detail.view === 'directory') {
        if (forYouSection) forYouSection.hidden = true;
        if (directorySection) directorySection.hidden = false;
        if (searchPanel) searchPanel.hidden = false;
      }
    });
  }

  /**
   * Load user preferences from localStorage
   */
  function loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      userPrefs = stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error loading preferences:', e);
      userPrefs = null;
    }
  }

  /**
   * Save user preferences to localStorage
   */
  function savePreferences(prefs) {
    userPrefs = prefs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    document.dispatchEvent(new CustomEvent('preferencesUpdated', { detail: prefs }));
  }

  /**
   * Check if user has set up their profile
   */
  function hasPreferences() {
    return userPrefs && (
      (userPrefs.groups && userPrefs.groups.length > 0) ||
      userPrefs.county
    );
  }

  /**
   * Create the For You UI structure
   */
  function createForYouUI() {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    // Create For You section (hidden by default on directory view)
    const forYouSection = document.createElement('section');
    forYouSection.id = 'for-you-section';
    forYouSection.className = 'for-you-section';
    forYouSection.setAttribute('aria-label', 'Personalized recommendations');

    // Create Directory section wrapper
    const directorySection = document.createElement('section');
    directorySection.id = 'directory-section';
    directorySection.setAttribute('aria-label', 'All programs directory');

    // Move existing content into directory section
    const parent = searchResults.parentNode;

    // Find the search panel and wrap everything after it
    const searchPanel = document.querySelector('.search-panel');

    // Wrap search results in directory section
    parent.insertBefore(directorySection, searchResults);
    directorySection.appendChild(searchResults);

    // Insert For You section before directory
    parent.insertBefore(forYouSection, directorySection);

    // Create mobile view tabs (hidden on desktop)
    createViewTabs(parent, forYouSection);

    // Populate For You section
    refreshForYouView();

    // Check initial view from URL
    const hash = window.location.hash.slice(1);
    if (hash === 'directory') {
      forYouSection.hidden = true;
      directorySection.hidden = false;
      if (searchPanel) searchPanel.hidden = false;
    } else {
      // Default to For You
      forYouSection.hidden = false;
      directorySection.hidden = true;
      if (searchPanel) searchPanel.hidden = true;
    }
  }

  /**
   * Create mobile view tabs
   */
  function createViewTabs(container, beforeElement) {
    const tabs = document.createElement('div');
    tabs.className = 'view-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'View options');

    tabs.innerHTML = `
      <button class="view-tab active" data-view="for-you" role="tab" aria-selected="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        For You
      </button>
      <button class="view-tab" data-view="directory" role="tab" aria-selected="false">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        Directory
      </button>
    `;

    container.insertBefore(tabs, beforeElement);

    // Handle tab clicks
    tabs.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;

        // Update tabs
        tabs.querySelectorAll('.view-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Trigger view change
        document.dispatchEvent(new CustomEvent('viewChange', { detail: { view } }));

        // Also update sidebar if present
        const sidebarNav = document.querySelector(`.sidebar-nav-item[data-view="${view}"]`);
        if (sidebarNav) {
          document.querySelectorAll('.sidebar-nav-item[data-view]').forEach(nav => {
            nav.classList.remove('active');
            nav.setAttribute('aria-current', 'false');
          });
          sidebarNav.classList.add('active');
          sidebarNav.setAttribute('aria-current', 'true');
        }

        // Update URL
        history.pushState({ view }, '', `#${view}`);
      });
    });
  }

  /**
   * Refresh the For You view content
   */
  function refreshForYouView() {
    const forYouSection = document.getElementById('for-you-section');
    if (!forYouSection) return;

    if (!hasPreferences()) {
      // Show profile setup card
      forYouSection.innerHTML = `
        <div class="profile-setup-card">
          <div class="profile-setup-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
          </div>
          <h2 class="profile-setup-title">Set up your profile</h2>
          <p class="profile-setup-description">Tell us about yourself to see personalized program recommendations tailored to your needs.</p>
          <button class="profile-setup-btn" id="start-onboarding" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Set up profile
          </button>
        </div>
      `;

      document.getElementById('start-onboarding')?.addEventListener('click', openOnboarding);
      return;
    }

    // Show personalized content
    const programs = getPersonalizedPrograms();
    const topPicks = programs.slice(0, 5);
    const allMatching = programs;

    // Get preference labels
    const groupNames = (userPrefs.groups || [])
      .map(id => GROUPS.find(g => g.id === id)?.name)
      .filter(Boolean);
    const countyName = COUNTIES.find(c => c.id === userPrefs.county)?.name;

    let prefsText = '';
    if (groupNames.length > 0) {
      prefsText += `<strong>${groupNames.join(', ')}</strong>`;
    }
    if (countyName) {
      prefsText += groupNames.length > 0 ? ` in <strong>${countyName}</strong>` : `<strong>${countyName}</strong>`;
    }

    forYouSection.innerHTML = `
      <!-- Preferences Summary -->
      <div class="preferences-summary">
        <span class="preferences-summary-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="preferences-summary-text">Showing programs for ${prefsText || 'you'}</span>
        <button class="preferences-edit-btn" id="edit-preferences" type="button" aria-label="Edit preferences">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      </div>

      ${topPicks.length > 0 ? `
        <!-- Top Picks -->
        <div class="for-you-section-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <h2 class="for-you-section-title">Top Picks for You</h2>
        </div>
        <div class="top-picks-scroll" id="top-picks-container">
          <!-- Cards inserted by JS -->
        </div>
      ` : ''}

      <!-- All Matching Programs -->
      <div class="for-you-section-header">
        <h2 class="for-you-section-title">All Matching Programs</h2>
        <span class="for-you-section-count">${allMatching.length}</span>
      </div>
      ${allMatching.length > 0 ? `
        <div class="matching-programs-grid" id="matching-programs-container">
          <!-- Cards inserted by JS -->
        </div>
      ` : `
        <div class="for-you-empty">
          <svg class="for-you-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3 class="for-you-empty-title">No matching programs</h3>
          <p class="for-you-empty-description">Try updating your profile preferences to see more results.</p>
        </div>
      `}
    `;

    // Add event listener for edit button
    document.getElementById('edit-preferences')?.addEventListener('click', openOnboarding);

    // Clone program cards into containers
    if (topPicks.length > 0) {
      const topPicksContainer = document.getElementById('top-picks-container');
      topPicks.forEach(card => {
        const clone = card.cloneNode(true);
        topPicksContainer.appendChild(clone);
      });
    }

    if (allMatching.length > 0) {
      const matchingContainer = document.getElementById('matching-programs-container');
      allMatching.forEach(card => {
        const clone = card.cloneNode(true);
        matchingContainer.appendChild(clone);
      });
    }

    // Re-initialize program card click handlers
    initializeCardHandlers();
  }

  /**
   * Get personalized programs based on user preferences
   */
  function getPersonalizedPrograms() {
    const allCards = document.querySelectorAll('#directory-section [data-program]');
    const matching = [];

    allCards.forEach(card => {
      const groups = (card.dataset.groups || '').toLowerCase().split(' ');
      const area = (card.dataset.area || '').toLowerCase();
      const city = (card.dataset.city || '').toLowerCase();

      let matches = false;

      // Check group match
      if (userPrefs.groups && userPrefs.groups.length > 0) {
        matches = userPrefs.groups.some(g => groups.includes(g.toLowerCase()));
      } else {
        matches = true; // No group filter
      }

      // Check area match
      if (matches && userPrefs.county) {
        const countyName = COUNTIES.find(c => c.id === userPrefs.county)?.name.toLowerCase() || '';
        // Include if matches county, or is Bay Area/Statewide/Nationwide
        const areaMatches = area.includes(countyName) ||
                           area.includes('bay area') ||
                           area.includes('statewide') ||
                           area.includes('nationwide') ||
                           area.includes('california') ||
                           city.includes(countyName);
        matches = matches && areaMatches;
      }

      // Also include "everyone" eligible programs
      if (groups.includes('everyone')) {
        matches = true;
      }

      if (matches) {
        matching.push(card);
      }
    });

    return matching;
  }

  /**
   * Initialize click handlers for cloned program cards
   */
  function initializeCardHandlers() {
    const containers = ['#top-picks-container', '#matching-programs-container'];

    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (!container) return;

      container.querySelectorAll('.program-card').forEach(card => {
        card.addEventListener('click', () => {
          const programId = card.dataset.programId;
          // Find original program data and trigger modal
          const originalData = document.querySelector(`.program-data[data-program-id="${programId}"]`);
          if (originalData && window.ProgramModal) {
            try {
              const data = JSON.parse(originalData.textContent);
              window.ProgramModal.open(data);
            } catch (e) {
              console.error('Error parsing program data:', e);
            }
          }
        });

        // Handle keyboard
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });
      });

      // Handle save buttons
      container.querySelectorAll('.card-save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const programId = btn.dataset.programId;
          if (window.Favorites) {
            window.Favorites.toggle(programId);
          }
        });
      });
    });
  }

  /**
   * Create the onboarding modal
   */
  function createOnboardingModal() {
    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'onboarding-title');

    modal.innerHTML = `
      <div class="onboarding-backdrop"></div>
      <div class="onboarding-content">
        <header class="onboarding-header">
          <h2 class="onboarding-title" id="onboarding-title">Set up your profile</h2>
          <button class="onboarding-close" type="button" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div class="onboarding-body">
          <div class="onboarding-progress">
            <div class="onboarding-progress-step current" data-step="1"></div>
            <div class="onboarding-progress-step" data-step="2"></div>
          </div>

          <!-- Step 1: Select Groups -->
          <div class="onboarding-step active" data-step="1">
            <h3 class="onboarding-step-title">Which categories apply to you?</h3>
            <p class="onboarding-step-description">Select all that apply to see relevant discount programs.</p>
            <div class="onboarding-options" id="groups-options">
              ${GROUPS.map(g => `
                <label class="onboarding-option" data-group="${g.id}">
                  <input type="checkbox" name="group" value="${g.id}">
                  <span class="onboarding-option-check">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span class="onboarding-option-label">${g.name}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Step 2: Select County -->
          <div class="onboarding-step" data-step="2">
            <h3 class="onboarding-step-title">Where do you live?</h3>
            <p class="onboarding-step-description">This helps us show programs available in your area.</p>
            <select class="onboarding-select" id="county-select">
              <option value="">Select a county (optional)</option>
              ${COUNTIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <footer class="onboarding-footer">
          <button class="onboarding-btn onboarding-btn-secondary" id="onboarding-back" type="button">Back</button>
          <button class="onboarding-btn onboarding-btn-primary" id="onboarding-next" type="button">Next</button>
        </footer>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.onboarding-backdrop').addEventListener('click', closeOnboarding);
    modal.querySelector('.onboarding-close').addEventListener('click', closeOnboarding);
    modal.querySelector('#onboarding-back').addEventListener('click', onboardingBack);
    modal.querySelector('#onboarding-next').addEventListener('click', onboardingNext);

    // Group option selection
    modal.querySelectorAll('.onboarding-option').forEach(option => {
      option.addEventListener('click', () => {
        option.classList.toggle('selected');
        option.querySelector('input').checked = option.classList.contains('selected');
      });
    });

    // Keyboard handling
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeOnboarding();
      }
    });

    // Load existing preferences
    if (userPrefs) {
      (userPrefs.groups || []).forEach(g => {
        const option = modal.querySelector(`[data-group="${g}"]`);
        if (option) {
          option.classList.add('selected');
          option.querySelector('input').checked = true;
        }
      });

      if (userPrefs.county) {
        modal.querySelector('#county-select').value = userPrefs.county;
      }
    }
  }

  let currentStep = 1;
  const totalSteps = 2;

  function openOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    currentStep = 1;
    updateOnboardingStep();
    modal.hidden = false;

    // Focus management
    const firstFocusable = modal.querySelector('.onboarding-option, button, select');
    if (firstFocusable) firstFocusable.focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  function closeOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = '';

    // Return focus
    const trigger = document.getElementById('start-onboarding') || document.getElementById('edit-preferences');
    if (trigger) trigger.focus();
  }

  function onboardingBack() {
    if (currentStep > 1) {
      currentStep--;
      updateOnboardingStep();
    }
  }

  function onboardingNext() {
    if (currentStep < totalSteps) {
      currentStep++;
      updateOnboardingStep();
    } else {
      // Save preferences
      const modal = document.getElementById('onboarding-modal');
      const selectedGroups = Array.from(modal.querySelectorAll('.onboarding-option.selected'))
        .map(opt => opt.dataset.group);
      const county = modal.querySelector('#county-select').value;

      savePreferences({
        groups: selectedGroups,
        county: county || null
      });

      closeOnboarding();
      refreshForYouView();
    }
  }

  function updateOnboardingStep() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    // Update progress indicators
    modal.querySelectorAll('.onboarding-progress-step').forEach(step => {
      const stepNum = parseInt(step.dataset.step);
      step.classList.remove('completed', 'current');
      if (stepNum < currentStep) {
        step.classList.add('completed');
      } else if (stepNum === currentStep) {
        step.classList.add('current');
      }
    });

    // Show/hide steps
    modal.querySelectorAll('.onboarding-step').forEach(step => {
      const stepNum = parseInt(step.dataset.step);
      step.classList.toggle('active', stepNum === currentStep);
    });

    // Update buttons
    const backBtn = modal.querySelector('#onboarding-back');
    const nextBtn = modal.querySelector('#onboarding-next');

    backBtn.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
    nextBtn.textContent = currentStep === totalSteps ? 'Done' : 'Next';
  }

  // Expose for external use
  window.ForYou = {
    hasPreferences,
    openOnboarding,
    refreshForYouView
  };
})();
