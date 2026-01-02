---
layout: default
actions: true
---

{% include welcome.html %}

<!-- Simple search and filter bar -->
<div class="programs-header">
  <div class="programs-search-bar">
    <input type="search" id="program-search" class="programs-search-input" placeholder="Search programs..." aria-label="Search programs">
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

{% include back-to-top.html %}

<style>
.programs-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary, #ffffff);
  padding: 1rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.programs-search-bar {
  display: flex;
  gap: 0.75rem;
  max-width: 600px;
  margin: 0 auto;
}

.programs-search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
  background: var(--bg-surface, #f9fafb);
  color: var(--text-primary, #111827);
  transition: all 0.2s;
}

.programs-search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: #ffffff;
}

.programs-search-input::placeholder {
  color: var(--text-secondary, #6b7280);
}

.programs-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary, #374151);
  background: var(--bg-surface, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.programs-filter-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.programs-filter-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.programs-active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.75rem;
}

.programs-active-filters:empty {
  display: none;
}

.active-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.active-filter-chip:hover {
  background: #bfdbfe;
}

.active-filter-chip svg {
  width: 14px;
  height: 14px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .programs-header {
    background: var(--dark-bg, #0d1117);
    border-color: var(--dark-border, #30363d);
  }

  .programs-search-input {
    background: var(--dark-surface, #161b22);
    border-color: var(--dark-border, #30363d);
    color: var(--dark-text, #c9d1d9);
  }

  .programs-search-input:focus {
    background: var(--dark-surface, #161b22);
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }

  .programs-filter-btn {
    background: var(--dark-surface, #161b22);
    border-color: var(--dark-border, #30363d);
    color: var(--dark-text, #c9d1d9);
  }

  .programs-filter-btn:hover {
    background: #21262d;
    border-color: #30363d;
  }

  .active-filter-chip {
    background: #1e3a5f;
    color: #58a6ff;
  }

  .active-filter-chip:hover {
    background: #264a6e;
  }
}

body[data-theme="dark"] .programs-header {
  background: var(--dark-bg, #0d1117);
  border-color: var(--dark-border, #30363d);
}

body[data-theme="dark"] .programs-search-input {
  background: var(--dark-surface, #161b22);
  border-color: var(--dark-border, #30363d);
  color: var(--dark-text, #c9d1d9);
}

body[data-theme="dark"] .programs-search-input:focus {
  background: var(--dark-surface, #161b22);
  border-color: #58a6ff;
}

body[data-theme="dark"] .programs-filter-btn {
  background: var(--dark-surface, #161b22);
  border-color: var(--dark-border, #30363d);
  color: var(--dark-text, #c9d1d9);
}

body[data-theme="dark"] .programs-filter-btn:hover {
  background: #21262d;
}

body[data-theme="dark"] .active-filter-chip {
  background: #1e3a5f;
  color: #58a6ff;
}

/* Mobile - Clean and compact */
@media (max-width: 640px) {
  .programs-header {
    padding: 0.75rem 0;
    margin-bottom: 0.75rem;
  }

  .programs-search-bar {
    padding: 0 0.5rem;
    gap: 0.5rem;
  }

  .programs-search-input {
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    border-radius: 8px;
  }

  .programs-filter-btn {
    padding: 0.625rem 0.75rem;
    border-radius: 8px;
  }

  .programs-filter-btn span {
    display: none;
  }

  .programs-active-filters {
    margin-top: 0.5rem;
    padding: 0 0.5rem;
  }

  .active-filter-chip {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
  }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('program-search');
  const programsList = document.getElementById('programs-list');
  const activeFiltersContainer = document.getElementById('active-filters');

  if (!searchInput || !programsList) return;

  // Get all program cards
  const allCards = Array.from(programsList.querySelectorAll('.program-card'));

  // Search functionality
  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    filterPrograms();
  });

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
          chip.innerHTML = `${formatGroupName(group)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
          chip.addEventListener('click', () => removeFilter('group', group));
          activeFiltersContainer.appendChild(chip);
        });
      }

      // Show county filter
      if (prefs.county) {
        const chip = document.createElement('button');
        chip.className = 'active-filter-chip';
        chip.innerHTML = `${formatCountyName(prefs.county)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
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
  function filterPrograms() {
    const query = searchInput.value.toLowerCase().trim();
    const prefs = window.Preferences ? window.Preferences.get() : { groups: [], county: null };

    let visibleCount = 0;

    allCards.forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const area = (card.dataset.area || '').toLowerCase();
      const groups = (card.dataset.groups || '').toLowerCase().split(',').map(g => g.trim());
      const description = (card.querySelector('.program-description')?.textContent || '').toLowerCase();

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
