(function() {
  'use strict';

  const STORAGE_KEY = 'bayarea_favorites';

  const favorites = {
    favorites: [],
    list() {
      return this.favorites.map(id => {
        const el = document.querySelector(`.program-card[data-program-id="${id}"]`) || document.querySelector(`[data-program-id="${id}"]`);
        const title = el?.querySelector('.program-name')?.textContent?.trim() || (window.i18n ? i18n.t('favorites.empty') : 'Saved program');
        const linkEl = el?.querySelector('.program-link');
        const url = linkEl?.getAttribute('href') || '#';
        const linkText = linkEl?.textContent?.trim() || (window.i18n ? i18n.t('program.learn_more') : 'View program');
        return { id, title, url, linkText };
      });
    },
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
        this.dispatchStorageError();
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
    dispatchStorageError() {
      document.dispatchEvent(new CustomEvent('favoritesStorageError'));
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

  document.addEventListener('favoritesStorageError', () => {
    const toastId = 'favorites-storage-error';
    if (document.getElementById(toastId)) return;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'toast-message';
    toast.role = 'status';
    toast.ariaLive = 'polite';
    toast.textContent = 'Saving favorites is unavailable in this browser/session.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.favorite-toggle');
    if (!btn) return;
    const id = btn.dataset.programId;
    favorites.toggle(id);
  });

  window.favorites = favorites;
  document.dispatchEvent(new Event('favoritesReady'));
})();
