// Step Flow: Prefilter programs by eligibility and county
// Applies selections to existing filter buttons and shows results

(function() {
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function showStep(n) {
    const current = qs(`#step-${n}`);
    const other = qsa('.step').filter(el => el.id !== `step-${n}`);
    if (current) current.hidden = false;
    other.forEach(el => el.hidden = true);
  }

  function closeOverlay() {
    const overlay = qs('#step-flow');
    if (overlay) overlay.style.display = 'none';
    // Show standard filters after overlay closes
    const filterUI = qs('.filter-controls');
    if (filterUI) filterUI.style.display = 'block';
  }

  function restartOverlay() {
    // Clear all selections
    qsa('input[name="eligibility"]:checked').forEach(i => { i.checked = false; });
    const countyChecked = qs('input[name="county"]:checked');
    if (countyChecked) countyChecked.checked = false;

    // Return to step 1
    showStep(1);
  }

  function waitForSearchFilter(cb, tries = 0) {
    if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
      cb();
      return;
    }
    if (tries > 50) { cb(); return; }
    setTimeout(() => waitForSearchFilter(cb, tries + 1), 100);
  }

  function clickFilter(type, value) {
    const btn = qs(`[data-filter-type="${type}"][data-filter-value="${value}"]`);
    if (btn && !btn.classList.contains('active')) {
      btn.click();
    } else if (btn && btn.classList.contains('active')) {
      // already active, do nothing
    }
  }

  function applySelections(eligValues, countyValue) {
    waitForSearchFilter(() => {
      try {
        // Reset everything to a known state
        if (window.searchFilter && typeof window.searchFilter.resetFilters === 'function') {
          window.searchFilter.resetFilters();
        }

        // Apply eligibility (multi-select)
        eligValues.forEach(val => clickFilter('eligibility', val));

        // Areas always include Bay Area-wide, Statewide, Nationwide
        const baseAreas = ['Bay Area', 'Statewide', 'Nationwide'];
        baseAreas.forEach(val => clickFilter('area', val));

        // County (if provided and not none)
        if (countyValue && countyValue !== 'none') {
          clickFilter('area', countyValue);
        }

        // Ensure results render and count updates
        if (window.searchFilter && typeof window.searchFilter.render === 'function') {
          window.searchFilter.render();
          window.searchFilter.updateResultsCount();
        }

        // Scroll to results
        const results = qs('#search-results');
        if (results) {
          results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

      } catch (e) {
        console.error('Step Flow applySelections error:', e);
      }
    });
  }

  function getPrefs() {
    try {
      const raw = localStorage.getItem('bad_prefs');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function savePrefs(eligValues, countyValue) {
    const prefs = { eligibility: eligValues, county: countyValue, ts: Date.now() };
    try { localStorage.setItem('bad_prefs', JSON.stringify(prefs)); } catch {}
  }

  document.addEventListener('DOMContentLoaded', function() {
    const overlay = qs('#step-flow');
    if (!overlay) return;

    // Hide standard filter UI initially
    const filterUI = qs('.filter-controls');
    if (filterUI) filterUI.style.display = 'none';

    // Avoid interrupting automated tests or explicit opt-out
    const params = new URLSearchParams(window.location.search);
    const isAutomation = !!navigator.webdriver;
    const optOut = params.get('no-step') === '1';
    if (isAutomation || optOut) {
      closeOverlay();
      return;
    }

    // Show overlay on first load. Allow skip.
    const skip = qs('.step-flow-skip');
    const reset = qs('.step-flow-reset');
    if (skip) skip.addEventListener('click', () => closeOverlay());
    if (reset) reset.addEventListener('click', () => restartOverlay());

    // Navigation
    qsa('.step-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.getAttribute('data-next');
        showStep(next);
      });
    });

    qsa('.step-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const back = btn.getAttribute('data-back');
        showStep(back);
      });
    });

    const submit = qs('.step-submit');
    if (submit) {
      submit.addEventListener('click', () => {
        // Gather eligibility selections
        const eligValues = qsa('input[name="eligibility"]:checked').map(i => i.value);
        // Gather county selection (allow none)
        const countyInput = qs('input[name="county"]:checked');
        const countyValue = countyInput ? countyInput.value : 'none';

        savePrefs(eligValues, countyValue);
        applySelections(eligValues, countyValue);
        closeOverlay();
      });
    }

    // Preferences hooks
    const prefSave = qs('.pref-save');
    const prefApplySaved = qs('.pref-apply-saved');
    if (prefSave) {
      prefSave.addEventListener('click', () => {
        const eligValues = qsa('input[name="eligibility"]:checked').map(i => i.value);
        const countyInput = qs('input[name="county"]:checked');
        const countyValue = countyInput ? countyInput.value : 'none';
        savePrefs(eligValues, countyValue);
      });
    }
    if (prefApplySaved) {
      prefApplySaved.addEventListener('click', () => {
        const prefs = getPrefs();
        if (!prefs) return;
        // Pre-check inputs
        qsa('input[name="eligibility"]').forEach(i => { i.checked = prefs.eligibility.includes(i.value); });
        qsa('input[name="county"]').forEach(i => { i.checked = (prefs.county === i.value); });
      });
    }

    // Show saved preferences button if present
    const prefs = getPrefs();
    if (prefs && prefApplySaved) {
      prefApplySaved.hidden = false;
    }

    // Update Filters button opens overlay
    document.addEventListener('click', (e) => {
      const t = e.target.closest('#update-filters-btn');
      if (t) {
        overlay.style.display = 'flex';
        showStep(1);
      }
    });

    // Start at step 1
    showStep(1);
  });
})();
