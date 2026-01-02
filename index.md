---
layout: default
actions: true
---

{% include welcome.html %}

<!-- Hero Section -->
<section class="hero">
  <div class="container">
    <h1>Find programs and services in the Bay Area</h1>
    <p>Discover free and low-cost resources for food, housing, healthcare, and more.</p>
    <div class="hero-search">
      <input type="search" id="program-search" class="hero-search-input" placeholder="Search programs..." aria-label="Search programs">
    </div>
  </div>
</section>

<!-- Quick Links Section -->
<section class="quick-links">
  <h2>Popular Resources</h2>
  <div class="quick-links-grid">
    <a href="/eligibility/public-assistance.html" class="quick-link-card">
      <div class="quick-link-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </div>
      <div class="quick-link-content">
        <h3>Food Assistance</h3>
        <p>CalFresh, food banks, and meal programs</p>
      </div>
    </a>
    <a href="/eligibility/utility-programs.html" class="quick-link-card">
      <div class="quick-link-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div class="quick-link-content">
        <h3>Utility Assistance</h3>
        <p>Help with electricity, gas, and water bills</p>
      </div>
    </a>
    <a href="/eligibility/" class="quick-link-card">
      <div class="quick-link-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <div class="quick-link-content">
        <h3>Eligibility Guides</h3>
        <p>Find out what programs you qualify for</p>
      </div>
    </a>
  </div>
</section>

<!-- Programs Section -->
<section class="programs-section">
  <div class="programs-header">
    <div class="programs-search-bar">
      <input type="search" id="program-search-inline" class="programs-search-input" placeholder="Search all programs..." aria-label="Search programs">
      <button type="button" class="programs-filter-btn" data-open-onboarding aria-label="Update your preferences">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
        Filters
      </button>
    </div>
    <div class="programs-active-filters" id="active-filters"></div>
  </div>

  <div id="programs-list" class="programs-container" role="region" aria-live="polite" aria-label="Programs">
    {% assign all_programs = "" | split: "" %}
    {% for category in site.data.programs %}
      {% for program in category[1] %}
        {% assign all_programs = all_programs | push: program %}
      {% endfor %}
    {% endfor %}
    {% assign sorted_programs = all_programs | sort: "name" %}
    {% for program in sorted_programs %}
      {% include program-card.html program=program %}
    {% endfor %}
  </div>
</section>

{% include back-to-top.html %}

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Sync hero search with inline search
  const heroSearch = document.getElementById('program-search');
  const inlineSearch = document.getElementById('program-search-inline');
  const programsList = document.getElementById('programs-list');
  const activeFiltersContainer = document.getElementById('active-filters');

  if (!programsList) return;

  // Get all program cards
  const allCards = Array.from(programsList.querySelectorAll('.program-card'));

  // Search functionality for both search inputs
  function handleSearch(query) {
    const lowerQuery = query.toLowerCase().trim();
    filterPrograms(lowerQuery);
  }

  if (heroSearch) {
    heroSearch.addEventListener('input', function() {
      if (inlineSearch) inlineSearch.value = this.value;
      handleSearch(this.value);
    });
  }

  if (inlineSearch) {
    inlineSearch.addEventListener('input', function() {
      if (heroSearch) heroSearch.value = this.value;
      handleSearch(this.value);
    });
  }

  // Display active filters from preferences
  function displayActiveFilters() {
    if (!activeFiltersContainer) return;

    activeFiltersContainer.innerHTML = '';

    if (window.Preferences && window.Preferences.hasPreferences()) {
      const prefs = window.Preferences.get();

      // Show group filters
      if (prefs.groups && prefs.groups.length > 0) {
        prefs.groups.forEach(group => {
          const chip = document.createElement('button');
          chip.className = 'active-filter-chip';
          chip.innerHTML = `${formatGroupName(group)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
          chip.addEventListener('click', () => removeFilter('group', group));
          activeFiltersContainer.appendChild(chip);
        });
      }

      // Show county filter
      if (prefs.county) {
        const chip = document.createElement('button');
        chip.className = 'active-filter-chip';
        chip.innerHTML = `${formatCountyName(prefs.county)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        chip.addEventListener('click', () => removeFilter('county', prefs.county));
        activeFiltersContainer.appendChild(chip);
      }
    }
  }

  function formatGroupName(id) {
    const names = {
      'income-eligible': 'Income-Eligible',
      'seniors': 'Seniors',
      'youth': 'Youth',
      'college-students': 'Students',
      'veterans': 'Veterans',
      'families': 'Families',
      'disability': 'Disability',
      'lgbtq': 'LGBT+',
      'first-responders': 'First Responders',
      'teachers': 'Teachers',
      'unemployed': 'Job Seekers',
      'immigrants': 'Immigrants',
      'unhoused': 'Unhoused',
      'pregnant': 'Pregnant',
      'caregivers': 'Caregivers',
      'foster-youth': 'Foster Youth',
      'reentry': 'Reentry',
      'nonprofits': 'Nonprofits',
      'everyone': 'Everyone'
    };
    return names[id] || id;
  }

  function formatCountyName(id) {
    const names = {
      'san-francisco': 'San Francisco',
      'alameda': 'Alameda County',
      'contra-costa': 'Contra Costa County',
      'san-mateo': 'San Mateo County',
      'santa-clara': 'Santa Clara County',
      'marin': 'Marin County',
      'napa': 'Napa County',
      'solano': 'Solano County',
      'sonoma': 'Sonoma County'
    };
    return names[id] || id;
  }

  function removeFilter(type, value) {
    if (!window.Preferences) return;

    const prefs = window.Preferences.get();

    if (type === 'group') {
      prefs.groups = prefs.groups.filter(g => g !== value);
      window.Preferences.setGroups(prefs.groups);
    } else if (type === 'county') {
      window.Preferences.setCounty(null);
    }

    displayActiveFilters();
    filterPrograms();
  }

  // Filter programs based on search and preferences
  function filterPrograms(query = '') {
    const prefs = window.Preferences ? window.Preferences.get() : { groups: [], county: null };

    let visibleCount = 0;

    allCards.forEach(card => {
      const name = (card.dataset.programName || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const area = (card.dataset.area || '').toLowerCase();
      const groups = (card.dataset.groups || '').toLowerCase().split(' ');
      const description = (card.querySelector('.card-description')?.textContent || '').toLowerCase();

      // Check search query
      const matchesSearch = !query ||
        name.includes(query) ||
        category.includes(query) ||
        area.includes(query) ||
        description.includes(query);

      // Check group filters (if any selected, card must match at least one)
      const matchesGroups = !prefs.groups || prefs.groups.length === 0 ||
        prefs.groups.some(g => groups.includes(g)) ||
        groups.includes('everyone');

      // Check county filter
      const matchesCounty = !prefs.county ||
        area.includes(prefs.county.replace('-', ' ')) ||
        area.includes('statewide') ||
        area.includes('nationwide') ||
        area.includes('bay area');

      const visible = matchesSearch && matchesGroups && matchesCounty;
      card.style.display = visible ? '' : 'none';

      if (visible) visibleCount++;
    });
  }

  // Listen for preference changes
  document.addEventListener('preferencesChanged', function() {
    displayActiveFilters();
    filterPrograms();
  });

  document.addEventListener('onboardingComplete', function() {
    displayActiveFilters();
    filterPrograms();
  });

  // Initial display
  displayActiveFilters();
  filterPrograms();
});
</script>

<style>
/* Active filter chips */
.programs-active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2, 0.5rem);
  justify-content: center;
  margin-top: var(--space-3, 0.75rem);
}

.programs-active-filters:empty {
  display: none;
}

.active-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
  padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  color: var(--color-primary, #006064);
  background: var(--color-primary-bg, #e0f7fa);
  border: none;
  border-radius: var(--radius-full, 9999px);
  cursor: pointer;
  transition: all var(--transition-fast, 150ms);
}

.active-filter-chip:hover {
  background: #b2ebf2;
}

.active-filter-chip svg {
  flex-shrink: 0;
}
</style>
