(function() {
  'use strict';

  const STORAGE_KEY = 'bayarea_favorites';

  const favorites = {
    favorites: [],
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.favorites = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.favorites)) this.favorites = [];
      } catch (err) {
        this.favorites = [];
      }
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.favorites));
      } catch (err) {
        // ignore storage errors
      }
    },
    isFavorite(id) {
      return this.favorites.includes(id);
    },
    toggle(id) {
      if (!id) return;
      if (this.isFavorite(id)) {
        this.favorites = this.favorites.filter(f => f !== id);
      } else {
        this.favorites.push(id);
      }
      this.save();
      this.updateUI();
      this.dispatchUpdate();
    },
    clear() {
      this.favorites = [];
      this.save();
      this.updateUI();
      this.dispatchUpdate();
    },
    dispatchUpdate() {
      document.dispatchEvent(new CustomEvent('favoritesUpdated'));
    },
    updateCountDisplay() {
      const countEl = document.getElementById('favorites-count');
      if (countEl) {
        countEl.textContent = this.favorites.length;
      }
    },
    wireButtons() {
      document.querySelectorAll('.favorite-toggle').forEach(btn => {
        const id = btn.dataset.programId;
        const isFav = this.isFavorite(id);
        btn.classList.toggle('active', isFav);
        btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
        btn.setAttribute('title', isFav ? 'Saved' : 'Save');
        btn.setAttribute('aria-label', isFav ? 'Remove from saved' : 'Save program');
        btn.onclick = () => this.toggle(id);
      });
    },
    updateUI() {
      this.wireButtons();
      this.updateCountDisplay();
    }
  };

  favorites.load();
  favorites.updateUI();

  document.addEventListener('favoritesUpdated', () => favorites.updateUI());

  window.favorites = favorites;
})();
