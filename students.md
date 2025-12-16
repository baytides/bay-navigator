---
layout: default
title: College & University Student Resources
description: Free and discounted benefits for Bay Area college and university students
permalink: /students.html
actions: true
---

{% include site-header.html %}

<script>
  // Mark current page as active
  document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath || linkPath + '.html' === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  });
</script>

<div class="heading-dark-adjust">

## College & University Student Resources

Stretch your budget and find free and discounted benefits available to Bay Area college and university students.

This guide highlights 150+ free and low-cost programs, services, and benefits available exclusively to students enrolled at Bay Area colleges and universities across all institution types—community colleges, California State Universities (CSU), University of California (UC), and private universities.

Programs span across the Bay Area (Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, and Sonoma counties) with some available online or statewide. 

As a community driven project, we work to keep information current. However, availability and eligibility can change, and some listings may occasionally be out of date. Always refer to the program's website for the most current details.

---

<br>

<!-- Action buttons are rendered by layout via actions: true -->

<div id="app">
  <div class="search-panel active" aria-label="Search and filter programs">
    <div class="search-container">
      <!-- Search Input -->
      <div class="search-field">
        <label for="search" class="sr-only">Search programs</label>
        <input 
          type="search" 
          id="search" 
          placeholder="Search by program name, school, or benefit type..." 
          aria-label="Search programs"
          class="search-input">
        <span class="results-count" aria-live="polite" aria-atomic="true"></span>
      </div>
      
      <!-- Filter Section -->
      <div class="filters-section">
        <!-- Institution Type Filters -->
        <div class="filter-group">
          <h3 class="filter-group-label">Institution Type</h3>
          <div class="filter-buttons">
            <button type="button" class="filter-btn active" data-filter="type" data-value="">All</button>
            <button type="button" class="filter-btn" data-filter="type" data-value="community-college">Community Colleges</button>
            <button type="button" class="filter-btn" data-filter="type" data-value="csu">CSU</button>
            <button type="button" class="filter-btn" data-filter="type" data-value="uc">UC</button>
            <button type="button" class="filter-btn" data-filter="type" data-value="private">Private</button>
          </div>
        </div>

        <!-- Location Filters -->
        <div class="filter-group">
          <h3 class="filter-group-label">Location</h3>
          <div class="filter-buttons">
            <button type="button" class="filter-btn active" data-filter="location" data-value="">All</button>
            <button type="button" class="filter-btn" data-filter="location" data-value="san-francisco">San Francisco</button>
            <button type="button" class="filter-btn" data-filter="location" data-value="east-bay">East Bay</button>
            <button type="button" class="filter-btn" data-filter="location" data-value="peninsula">Peninsula</button>
            <button type="button" class="filter-btn" data-filter="location" data-value="south-bay">South Bay</button>
            <button type="button" class="filter-btn" data-filter="location" data-value="north-bay">North Bay</button>
          </div>
        </div>

        <!-- Program Type Filters -->
        <div class="filter-group">
          <h3 class="filter-group-label">Program Type</h3>
          <div class="filter-buttons">
            <button type="button" class="filter-btn active" data-filter="tag" data-value="">All</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="food">Food</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="transit">Transit</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="housing">Housing</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="financial">Financial</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="technology">Technology</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="wellness">Wellness</button>
            <button type="button" class="filter-btn" data-filter="tag" data-value="emergency">Emergency</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="results" class="programs-container" role="region" aria-live="polite" aria-label="Search results"></div>
</div>

{% include mobile-filter-drawer.html %}
{% include back-to-top.html %}

<!-- Load CSS -->
<style>
:root {
  /* Spacing for Vision Pro interaction */
  --touch-target-min: 60px;
  --interaction-padding: 1.25rem;
  
  /* Colors */
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-400: #9ca3af;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-900: #111827;

  /* Typography */
  --font-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  
  /* Responsive typography */
  --text-sm: clamp(0.875rem, 2.5vw, 1rem);
  --text-base: clamp(1rem, 3vw, 1.125rem);
  --text-lg: clamp(1.125rem, 3.5vw, 1.375rem);

  /* Shadow for depth */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

#app {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.search-panel {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  padding: var(--interaction-padding);
  margin-bottom: 2rem;
  border-radius: var(--radius-lg);
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-field {
  position: relative;
}

#search {
  width: 100%;
  padding: var(--interaction-padding);
  font-size: var(--text-base);
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-md);
  min-height: var(--touch-target-min);
  background: white;
  color: var(--neutral-900);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

#search:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-group-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-btn {
  padding: 0.75rem 1.25rem;
  min-height: var(--touch-target-min);
  min-width: 140px;
  text-align: center;
  font-size: var(--text-sm);
  font-weight: 500;
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-md);
  background: white;
  color: var(--neutral-700);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(37, 99, 235, 0.05);
}

.filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  font-weight: 600;
}

.results-count {
  font-size: var(--text-base);
  color: var(--neutral-600);
  margin-top: 0.75rem;
  font-weight: 500;
  display: block;
}

.programs-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.program-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--interaction-padding);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  min-height: 280px;
}

.program-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.program-card h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--neutral-900);
  word-break: break-word;
}

.program-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: var(--text-sm);
  color: var(--neutral-600);
}

.program-college,
.program-location {
  background: var(--neutral-100);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
}

.program-benefit {
  flex: 1;
  font-size: var(--text-base);
  color: var(--neutral-700);
  line-height: 1.6;
  margin: 1rem 0;
}

.program-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--neutral-100);
}

.how-to-use {
  font-size: var(--text-sm);
  margin-bottom: 0.75rem;
}

.how-to-use strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--neutral-900);
}

.how-to-use p {
  margin: 0;
  color: var(--neutral-600);
}

.program-timeframe {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  padding: 0.5rem 0.75rem;
  background: var(--neutral-100);
  border-radius: var(--radius-sm);
  align-self: flex-start;
}

.program-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  min-height: var(--touch-target-min);
  background: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.program-link:hover {
  background: var(--primary-dark);
  text-decoration: none;
}

.program-link::after {
  content: ' →';
  margin-left: 0.5rem;
}

.hidden {
  display: none !important;
}

.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem var(--interaction-padding);
  color: var(--neutral-600);
}

@media (max-width: 768px) {
  .filter-buttons {
    flex-direction: column;
  }

  .filter-btn {
    width: 100%;
    min-width: auto;
  }

  .programs-container {
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --neutral-50: #1c2128;
    --neutral-100: #1c2128;
    --neutral-200: #30363d;
    --neutral-600: #79d8eb;
    --neutral-700: #c9d1d9;
    --neutral-900: #e8eef5;
  }

  body {
    background-color: #0d1117;
    color: #e8eef5;
  }

  .search-panel {
    background: #1c2128;
    border-color: #30363d;
  }

  #search {
    background: #0d1117;
    color: #e8eef5;
    border-color: #30363d;
  }

  #search::placeholder {
    color: #8b949e;
  }

  .filter-group-label {
    color: #79d8eb;
  }

  .filter-btn {
    background: #21262d;
    color: #e8eef5;
    border-color: #30363d;
  }

  .filter-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: rgba(37, 99, 235, 0.1);
  }

  .filter-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .program-card {
    background: #1c2128;
    border-color: #30363d;
  }

  .program-card:hover {
    background: #262c36;
  }

  .program-card h3 {
    color: #e8eef5;
  }

  .program-meta {
    color: #79d8eb;
  }

  .program-college,
  .program-location,
  .program-timeframe {
    background: #30363d;
    color: #c9d1d9;
  }

  .program-benefit {
    color: #c9d1d9;
  }

  .how-to-use strong {
    color: #e8eef5;
  }

  .how-to-use p {
    color: #8b949e;
  }

  .results-count {
    color: #79d8eb;
  }
}
</style>

<!-- Load JavaScript -->
<script src="{{ '/assets/js/url-sharing.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/keyboard-shortcuts.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/favorites.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/simple-analytics.js' | relative_url }}" defer></script>

<!-- Student page JavaScript -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search');
  const resultsContainer = document.getElementById('results');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const resultsCount = document.querySelector('.results-count');
  
  let allPrograms = [];
  let activeFilters = {
    search: '',
    type: '',
    location: '',
    tag: ''
  };

  // Fetch programs from multiple Jekyll data files in college-university subfolder and combine them
  const ccPrograms = {{ site.data.college-university.college-programs-cc.programs | jsonify }};
  const csuPrograms = {{ site.data.college-university.college-programs-csu.programs | jsonify }};
  const ucPrograms = {{ site.data.college-university.college-programs-uc.programs | jsonify }};
  const privatePrograms = {{ site.data.college-university.college-programs-private.programs | jsonify }};
  allPrograms = [...ccPrograms, ...csuPrograms, ...ucPrograms, ...privatePrograms];

  console.log('Loaded', allPrograms.length, 'total programs');
  
  // URL sharing integration
  const urlSharing = new URLSharing();
  const initialState = urlSharing.getInitialState();
  
  // Apply initial search from URL
  if (initialState.search) {
    searchInput.value = initialState.search;
    activeFilters.search = initialState.search.toLowerCase();
  }

  // Handle search - supports multiple search terms
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    activeFilters.search = e.target.value.toLowerCase();
    render();
    
    // Update URL after typing stops
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateURL();
    }, 500);
  });

  // Helper function to format location names
  function formatLocation(location) {
    const locationMap = {
      'san-francisco': 'San Francisco',
      'east-bay': 'East Bay',
      'peninsula': 'Peninsula',
      'south-bay': 'South Bay',
      'north-bay': 'North Bay',
      'marin': 'Marin'
    };
    return locationMap[location] || location;
  }

  // Handle filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const filterType = this.dataset.filter;
      const filterValue = this.dataset.value;

      // Remove active class from all buttons with this filter type
      document.querySelectorAll(`.filter-btn[data-filter="${filterType}"]`).forEach(b => {
        b.classList.remove('active');
      });

      // Add active class to clicked button
      this.classList.add('active');

      // Update filter
      activeFilters[filterType] = filterValue;
      render();
      updateURL();
    });
  });
  
  // Update URL with current filters
  function updateURL() {
    const filters = {
      search: searchInput.value,
      type: activeFilters.type,
      location: activeFilters.location,
      tag: activeFilters.tag
    };
    urlSharing.updateURL(filters);
  }
  
  // Apply initial filters from URL
  if (initialState.type) {
    const typeBtn = document.querySelector(`[data-filter="type"][data-value="${initialState.type}"]`);
    if (typeBtn) typeBtn.click();
  }
  if (initialState.location) {
    const locBtn = document.querySelector(`[data-filter="location"][data-value="${initialState.location}"]`);
    if (locBtn) locBtn.click();
  }
  if (initialState.tag) {
    const tagBtn = document.querySelector(`[data-filter="tag"][data-value="${initialState.tag}"]`);
    if (tagBtn) tagBtn.click();
  }

  function render() {
    const filtered = allPrograms.filter(program => {
      // Search filter - split by spaces to search for multiple terms
      const searchTerms = activeFilters.search.split(/\s+/).filter(s => s.length > 0);
      
      if (searchTerms.length > 0) {
        const searchableText = `${program.title} ${program.benefit} ${program.institution} ${program.tags} ${program.location}`.toLowerCase();
        
        // All search terms must match somewhere in the program
        const allTermsMatch = searchTerms.every(term => searchableText.includes(term));
        
        if (!allTermsMatch) return false;
      }

      // Type filter
      if (activeFilters.type && program.type !== activeFilters.type) {
        return false;
      }

      // Location filter
      if (activeFilters.location && program.location !== activeFilters.location) {
        return false;
      }

      // Tag filter
      if (activeFilters.tag && !program.tags.includes(activeFilters.tag)) {
        return false;
      }

      return true;
    });

    // Update count
    resultsCount.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'program' : 'programs'}`;

    // Clear results
    resultsContainer.innerHTML = '';

    // Show "no results" message if needed
    if (filtered.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No programs match your search. Try different filters or search terms.</div>';
      return;
    }

    // Render filtered programs
    filtered.forEach(program => {
      const card = document.createElement('div');
      card.className = 'program-card';
      card.innerHTML = `
        <h3>${program.title}</h3>
        <div class="program-meta">
          <span class="program-college">${program.institution}</span>
          <span class="program-location">${formatLocation(program.location)}</span>
        </div>
        <p class="program-benefit">${program.benefit}</p>
        <div class="program-footer">
          <div class="how-to-use">
            <strong>How to Use:</strong>
            <p>${program.how_to_use}</p>
          </div>
          <span class="program-timeframe">${program.timeframe}</span>
          <a href="${program.link}" class="program-link" target="_blank" rel="noopener noreferrer">${program.link_text || 'Learn More'}</a>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }

  // Initial render
  render();
});
</script>
