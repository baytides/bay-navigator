---
layout: default
---

{% include site-header.html %}

<script>
  // Mark current page as active
  document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath || (currentPath === '/' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
      }
    });
  });
</script>

<style>
@media (prefers-color-scheme: dark) {
  h1, h2, h3, h4, h5, h6 {
    color: #79d8eb;
  }

  p {
    color: #e8eef5;
  }

  a {
    color: #79d8eb;
    text-decoration: underline;
  }

  a:visited {
    color: #79d8eb;
  }

  a:hover {
    color: #a8e6f1;
  }

  .program-card p {
    color: #c9d1d9;
  }

  .filter-section-title {
    color: #e8eef5;
  }
}
</style>

## Stretch your budget and discover more of what your community has to offer.

This guide features free and low-cost resources across the counties commonly recognized as the San Francisco Bay Area: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma. Resources are highlighted for public benefit recipients such as SNAP or EBT and Medi-Cal, and various demographic groups, families, nonprofit organizations, and anyone looking to reduce everyday expenses, including local nonprofit organizations.

As a community driven project, we work to keep information current. However, availability and eligibility can change, and some listings may occasionally be out of date. Always refer to the program's website for the most up to date details.

{% include search-filter-ui.html %}

<div id="search-results" class="programs-container">
{% for category in site.data.programs %}
  {% for program in category[1] %}
    {% include program-card.html program=program %}
  {% endfor %}
{% endfor %}
</div>
