/**
 * Bay Navigator - Saved Filter Presets
 * Allows users to save and quickly apply filter combinations
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'bayarea_filter_presets';
  const MAX_PRESETS = 10;

  const FilterPresets = {
    presets: [],

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.presets = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.presets)) this.presets = [];
      } catch (err) {
        this.presets = [];
      }
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
      } catch (err) {
        this.showToast('Unable to save presets in this browser/session.');
      }
    },

    getAll() {
      return this.presets;
    },

    add(name, filters) {
      if (!name || !name.trim()) return null;

      // Check limit
      if (this.presets.length >= MAX_PRESETS) {
        this.showToast(`Maximum ${MAX_PRESETS} presets allowed. Delete one first.`);
        return null;
      }

      const preset = {
        id: Date.now().toString(),
        name: name.trim(),
        filters: filters,
        createdAt: new Date().toISOString(),
      };

      this.presets.unshift(preset);
      this.save();
      this.updateUI();
      this.dispatchUpdate();
      return preset;
    },

    delete(id) {
      this.presets = this.presets.filter((p) => p.id !== id);
      this.save();
      this.updateUI();
      this.dispatchUpdate();
    },

    apply(id) {
      const preset = this.presets.find((p) => p.id === id);
      if (!preset) return;

      // Reset all filters first
      if (window.searchFilter) {
        window.searchFilter.resetFilters();
      }

      // Apply search term
      if (preset.filters.search) {
        const searchInput = document.querySelector('#search-input');
        if (searchInput) {
          searchInput.value = preset.filters.search;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // Apply filter buttons
      ['eligibility', 'category', 'area'].forEach((type) => {
        const values = preset.filters[type] || [];
        values.forEach((value) => {
          const btn = document.querySelector(
            `[data-filter-type="${type}"][data-filter-value="${value}"]`
          );
          if (btn && !btn.classList.contains('active')) {
            btn.click();
          }
        });
      });

      this.showToast(`Applied "${preset.name}" filters`);
    },

    getCurrentFilters() {
      const filters = {
        search: '',
        eligibility: [],
        category: [],
        area: [],
      };

      // Get search term
      const searchInput = document.querySelector('#search-input');
      if (searchInput && searchInput.value.trim()) {
        filters.search = searchInput.value.trim();
      }

      // Get active filters
      document.querySelectorAll('.filter-btn.active:not([data-all="true"])').forEach((btn) => {
        const type = btn.getAttribute('data-filter-type');
        const value = btn.getAttribute('data-filter-value');
        if (type && value && filters[type]) {
          filters[type].push(value);
        }
      });

      return filters;
    },

    hasActiveFilters() {
      const filters = this.getCurrentFilters();
      return (
        filters.search ||
        filters.eligibility.length > 0 ||
        filters.category.length > 0 ||
        filters.area.length > 0
      );
    },

    showToast(message) {
      const toastId = 'preset-toast';
      let toast = document.getElementById(toastId);
      if (toast) toast.remove();

      toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'toast-message';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    },

    dispatchUpdate() {
      document.dispatchEvent(new CustomEvent('presetsUpdated'));
    },

    // UI Management
    createUI() {
      // Add save preset button after the reset button
      const resetBtn = document.querySelector('.reset-btn');
      if (!resetBtn || document.getElementById('save-preset-btn')) return;

      // Create save button
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.id = 'save-preset-btn';
      saveBtn.className = 'preset-btn save-preset-btn';
      saveBtn.innerHTML = `
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save Filters
      `;
      saveBtn.setAttribute('aria-label', 'Save Filters - Save current filters as a preset');
      saveBtn.addEventListener('click', () => this.showSaveModal());

      // Create presets dropdown button
      const presetsBtn = document.createElement('button');
      presetsBtn.type = 'button';
      presetsBtn.id = 'load-preset-btn';
      presetsBtn.className = 'preset-btn load-preset-btn';
      presetsBtn.innerHTML = `
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        My Presets
        <span class="preset-count" id="preset-count">${this.presets.length}</span>
      `;
      presetsBtn.setAttribute('aria-label', 'My Presets - View saved filter presets');
      presetsBtn.setAttribute('aria-haspopup', 'true');
      presetsBtn.setAttribute('aria-expanded', 'false');
      presetsBtn.addEventListener('click', (e) => this.togglePresetsDropdown(e));

      // Create presets dropdown
      const dropdown = document.createElement('div');
      dropdown.id = 'presets-dropdown';
      dropdown.className = 'presets-dropdown';
      dropdown.setAttribute('role', 'menu');
      dropdown.style.display = 'none';

      // Create container
      const container = document.createElement('div');
      container.className = 'preset-buttons';
      container.appendChild(saveBtn);
      container.appendChild(presetsBtn);
      container.appendChild(dropdown);

      resetBtn.parentNode.insertBefore(container, resetBtn.nextSibling);

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.preset-buttons')) {
          this.closeDropdown();
        }
      });
    },

    togglePresetsDropdown(e) {
      e.stopPropagation();
      const dropdown = document.getElementById('presets-dropdown');
      const btn = document.getElementById('load-preset-btn');

      if (dropdown.style.display === 'none') {
        this.renderDropdown();
        dropdown.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
      } else {
        this.closeDropdown();
      }
    },

    closeDropdown() {
      const dropdown = document.getElementById('presets-dropdown');
      const btn = document.getElementById('load-preset-btn');
      if (dropdown) {
        dropdown.style.display = 'none';
      }
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
      }
    },

    renderDropdown() {
      const dropdown = document.getElementById('presets-dropdown');
      if (!dropdown) return;

      if (this.presets.length === 0) {
        dropdown.innerHTML = `
          <p class="presets-empty">No saved presets yet.<br>Apply some filters and click "Save Filters" to create one.</p>
        `;
        return;
      }

      let html = '<ul class="presets-list" role="listbox">';
      this.presets.forEach((preset) => {
        const filterSummary = this.getFilterSummary(preset.filters);
        html += `
          <li class="preset-item" role="option">
            <button type="button" class="preset-apply-btn" data-preset-id="${this.escapeHtml(preset.id)}" aria-label="Apply ${this.escapeHtml(preset.name)} filters">
              <span class="preset-name">${this.escapeHtml(preset.name)}</span>
              <span class="preset-summary">${filterSummary}</span>
            </button>
            <button type="button" class="preset-delete-btn" data-preset-id="${this.escapeHtml(preset.id)}" aria-label="Delete ${this.escapeHtml(preset.name)} preset">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </li>
        `;
      });
      html += '</ul>';

      dropdown.innerHTML = html;

      // Wire up event listeners
      dropdown.querySelectorAll('.preset-apply-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-preset-id');
          this.apply(id);
          this.closeDropdown();
        });
      });

      dropdown.querySelectorAll('.preset-delete-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-preset-id');
          if (confirm('Delete this preset?')) {
            this.delete(id);
            this.renderDropdown();
          }
        });
      });
    },

    // Returns escaped markup: the result is interpolated straight into
    // innerHTML by renderDropdown() and showSaveModal().
    getFilterSummary(filters) {
      const parts = [];
      if (filters.search) parts.push(`"${this.escapeHtml(filters.search)}"`);
      if (filters.eligibility?.length) parts.push(this.escapeHtml(filters.eligibility.join(', ')));
      if (filters.category?.length) parts.push(this.escapeHtml(filters.category.join(', ')));
      if (filters.area?.length) parts.push(this.escapeHtml(filters.area.join(', ')));
      return parts.length > 0 ? parts.join(' + ') : 'No filters';
    },

    showSaveModal() {
      if (!this.hasActiveFilters()) {
        this.showToast('Apply some filters first before saving.');
        return;
      }

      // Remove existing modal if any
      const existing = document.getElementById('save-preset-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'save-preset-modal';
      modal.className = 'preset-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'save-preset-title');
      modal.innerHTML = `
        <div class="preset-modal-backdrop"></div>
        <div class="preset-modal-content">
          <h3 id="save-preset-title">Save Filter Preset</h3>
          <p class="preset-modal-summary">Current filters: ${this.getFilterSummary(this.getCurrentFilters())}</p>
          <label for="preset-name-input" class="sr-only">Preset name</label>
          <input type="text" id="preset-name-input" class="preset-name-input" placeholder="Enter preset name (e.g., Senior Food Programs)" maxlength="50" autocomplete="off">
          <div class="preset-modal-actions">
            <button type="button" class="preset-modal-cancel">Cancel</button>
            <button type="button" class="preset-modal-save">Save Preset</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const input = modal.querySelector('#preset-name-input');
      const saveBtn = modal.querySelector('.preset-modal-save');
      const cancelBtn = modal.querySelector('.preset-modal-cancel');
      const backdrop = modal.querySelector('.preset-modal-backdrop');

      // Focus input
      setTimeout(() => input.focus(), 100);

      // Save handler
      const doSave = () => {
        const name = input.value.trim();
        if (!name) {
          input.focus();
          return;
        }
        const filters = this.getCurrentFilters();
        const result = this.add(name, filters);
        if (result) {
          this.showToast(`Saved "${name}" preset`);
          modal.remove();
        }
      };

      saveBtn.addEventListener('click', doSave);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSave();
        if (e.key === 'Escape') modal.remove();
      });
      cancelBtn.addEventListener('click', () => modal.remove());
      backdrop.addEventListener('click', () => modal.remove());
    },

    updateUI() {
      const countEl = document.getElementById('preset-count');
      if (countEl) {
        countEl.textContent = this.presets.length;
        countEl.style.display = this.presets.length > 0 ? '' : 'none';
      }
    },

    // Escapes for both text and attribute contexts. Quotes must be escaped
    // because preset names and search terms are interpolated into attributes
    // such as aria-label, and the search term can arrive from the ?q= URL
    // parameter rather than from the user's own typing.
    escapeHtml(text) {
      return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    init() {
      this.load();
      this.createUI();
      this.updateUI();
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FilterPresets.init());
  } else {
    FilterPresets.init();
  }

  // Export for external use
  window.filterPresets = FilterPresets;
})();
