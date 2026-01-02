---
layout: default
title: My Saved Programs
description: View your saved Bay Area programs
actions: false
permalink: /favorites.html
---

<div class="container heading-dark-adjust favorites-page">
  <h1>My Saved Programs</h1>
  <p class="favorites-subtitle">Saved programs stay on this device only.</p>

  {% include favorites-view.html %}
</div>

<style>
.favorites-page h1 {
  margin-bottom: 0.25rem;
}

.favorites-subtitle {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .favorites-page h1 {
    font-size: 1.5rem;
    margin-top: 0;
  }

  .favorites-subtitle {
    margin-bottom: 1rem;
  }
}
</style>

<script src="{{ '/assets/js/favorites.js' | relative_url }}" defer></script>
<script>
  document.addEventListener('favoritesReady', () => {
    const view = document.getElementById('favorites-view');
    const toggle = document.getElementById('view-favorites');
    if (view) view.style.display = 'block';
    if (toggle) toggle.style.display = 'none';
    document.dispatchEvent(new Event('favoritesUpdated'));
  }, { once: true });
</script>
