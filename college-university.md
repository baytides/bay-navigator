---
layout: default
title: College & University Student Resources
description: Free and discounted benefits for Bay Area college and university students including food assistance, transit passes, emergency grants, recreation access, and more.
permalink: /college-university.html
---

<style>
/* College & University Student Programs - Filter UI Styles */
.search-panel {
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--neutral-50, #f9fafb);
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid var(--neutral-200, #e5e7eb);
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.table-search {
  padding: 0.75rem 1rem;
  border: 2px solid var(--neutral-300, #d1d5db);
  border-radius: var(--radius-md, 0.5rem);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.table-search:focus {
  outline: none;
  border-color: var(--primary, #0969da);
  box-shadow: 0 0 0 3px var(--primary-light, rgba(9, 105, 218, 0.1));
}

.results-count {
  font-size: var(--text-sm, 0.875rem);
  color: var(--neutral-600, #4b5563);
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-group-label {
  font-weight: 600;
  color: var(--neutral-900, #1f2937);
  font-size: var(--text-sm, 0.875rem);
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--neutral-300, #d1d5db);
  background: white;
  border-radius: var(--radius-md, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: var(--primary, #0969da);
  background: var(--primary-light, rgba(9, 105, 218, 0.05));
}

.filter-btn.active {
  background: var(--primary, #0969da);
  color: white;
  border-color: var(--primary, #0969da);
}

.filter-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-light, rgba(9, 105, 218, 0.1));
}

.reset-btn {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  background: var(--neutral-600, #4b5563);
  color: white;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  cursor: pointer;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: var(--neutral-700, #374151);
}

.reset-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--neutral-300, #d1d5db);
}

.programs-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.program-card {
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  transition: all 0.2s;
}

.program-card:hover {
  border-color: var(--neutral-300, #d1d5db);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.program-card-header {
  margin-bottom: 1rem;
}

.program-name {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--neutral-900, #1f2937);
}

.program-meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.program-college {
  background: var(--neutral-100);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
}

.program-location {
  color: var(--neutral-600);
  font-size: var(--text-sm);
}

.program-benefit {
  margin: 1rem 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--neutral-700, #374151);
  line-height: 1.6;
}

.program-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--neutral-100, #f3f4f6);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.program-details {
  margin: 0.75rem 0;
}

.program-details strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--neutral-900);
}

.program-details p {
  font-size: var(--text-sm);
  margin: 0;
  line-height: 1.5;
}

.program-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--primary, #0969da);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-sm, 0.375rem);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  transition: background 0.2s;
}

.program-link:hover {
  background: var(--primary-dark, #0860ca);
}

.program-timeframe {
  font-size: var(--text-xs, 0.75rem);
  color: var(--neutral-500, #6b7280);
  font-style: italic;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .search-panel {
    background: #0d1117;
    border-color: #30363d;
  }

  .table-search {
    background: #0d1117;
    border-color: #30363d;
    color: #c9d1d9;
  }

  .table-search:focus {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }

  .results-count,
  .filter-group-label {
    color: #c9d1d9;
  }

  .filter-btn {
    background: #161b22;
    border-color: #30363d;
    color: #c9d1d9;
  }

  .filter-btn:hover {
    border-color: #58a6ff;
    background: rgba(88, 166, 255, 0.1);
  }

  .filter-btn.active {
    background: #1f6feb;
    border-color: #1f6feb;
  }

  .program-card {
    background: #0d1117;
    border-color: #30363d;
  }

  .program-card:hover {
    border-color: #58a6ff;
  }

  .program-name {
    color: #e8eef5;
  }

  .program-benefit,
  .program-footer {
    color: #c9d1d9;
  }

  .program-footer {
    border-color: #21262d;
  }

  .program-link {
    background: #1f6feb;
  }

  .program-link:hover {
    background: #388bfd;
  }

  .program-timeframe {
    color: #8b949e;
  }

  .program-college {
    background: #30363d;
    color: #c9d1d9;
  }

  .program-location {
    color: #8b949e;
  }

  .program-details strong {
    color: #e8eef5;
  }

  .program-details p {
    color: #c9d1d9;
  }
}

@media (max-width: 768px) {
  .programs-container {
    grid-template-columns: 1fr;
  }

  .filter-buttons {
    flex-direction: column;
  }

  .filter-btn {
    width: 100%;
  }
}
</style>

<h1 style="display:none">College & University Student Resources</h1>

<a href="https://bayareadiscounts.com" class="site-logo">
  <img src="https://raw.githubusercontent.com/bayareadiscounts/bayareadiscounts/refs/heads/main/logo.png" 
       alt="Bay Area Discounts logo">
</a>

# College & University Student Resources

Comprehensive guide to 150+ free and discounted benefits available exclusively to students enrolled at Bay Area colleges and universities. Benefits include transit passes, food assistance, emergency grants, recreation access, wellness services, and more.

_Always verify benefits and eligibility with your college or university as programs and requirements may change._

---

## 🔍 Search All Programs

{% include college-filter-ui.html %}

<div id="search-results" class="programs-container">
  {% for program in site.data.college-programs.programs %}
    <div 
      class="program-card"
      data-program-card="true"
      data-title="{{ program.title }}"
      data-institution="{{ program.institution }}"
      data-location="{{ program.location }}"
      data-tags="{{ program.tags }}"
      data-type="{{ program.type }}"
      data-benefit="{{ program.benefit }}"
      role="article"
    >
      <h3 class="program-name">{{ program.title }}</h3>
      <p class="program-meta">
        <span class="program-college">{{ program.institution }}</span>
        <span class="program-location">{{ program.location }}</span>
      </p>
      <p class="program-benefit">{{ program.benefit }}</p>
      <div class="program-footer">
        <div class="program-details">
          <strong>How to Use:</strong>
          <p>{{ program.how_to_use }}</p>
        </div>
        <span class="program-timeframe">{{ program.timeframe }}</span>
        <a href="{{ program.link }}" class="program-link" target="_blank" rel="noopener noreferrer">Learn More</a>
      </div>
    </div>
  {% endfor %}
</div>

---

_Last updated: December 12, 2025_  
_This is a community-maintained resource. [Contribute on GitHub](https://github.com/bayareadiscounts/bayareadiscounts)_

<script src="/assets/js/college-filter-script.js"></script>
