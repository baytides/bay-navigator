---
layout: default
title: My Saved Programs
description: View your saved Bay Area programs
actions: false
permalink: /favorites.html
---

<div class="container heading-dark-adjust">
  <div class="simple-language-summary" aria-label="Simple language summary">
    These are programs you clicked the heart button on. They're saved on this phone or computer only - if you use a different device, you won't see them there.
  </div>

  <h1>My Saved Programs</h1>
  <p>Saved programs stay on this device. To keep them elsewhere, save or share the program links.</p>

  {% include favorites-view.html %}
</div>

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
