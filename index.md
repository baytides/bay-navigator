---
layout: default
---
<style>
.site-logo {
  text-align: center;
  display: block;
  margin: 0 auto 2rem;
}

.site-logo img {
  max-width: 100%;
  height: auto;
  display: block;
  max-width: 500px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .site-logo img {
    max-width: 300px;
    margin: 0 auto;
  }
}

@media (prefers-color-scheme: dark) {
  h1, h2, h3, h4, h5, h6 {
    color: #79d8eb;
  }

  p {
    color: #c9d1d9;
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
    color: #c9d1d9;
  }
}
</style>
<h1 style="display:none">Bay Area Discounts</h1>

<a href="https://bayareadiscounts.com" class="site-logo">
  <img src="/assets/images/logo/banner.svg" 
       alt="Bay Area Discounts logo">
</a>

Stretch your budget and discover more of what your community has to offer.

This guide features free and low cost services, programs, and benefits across the counties commonly recognized as the San Francisco Bay Area: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma. Resources are highlighted for public benefit recipients such as SNAP or EBT and Medi Cal, seniors, youth, college students, military members and veterans, and anyone looking to reduce everyday expenses, including local nonprofit organizations.

As a community driven project, we work to keep information current. However, availability and eligibility can change, and some listings may occasionally be out of date. Always refer to the program’s website for the most up to date details.

  <div style="margin-bottom: 30px;">
    <h3 style="color: var(--text-heading, #333); font-size: 1.1em; margin-bottom: 10px;">💡 Support This Project</h3>
    <p>If this guide helps you save, consider supporting us here:</p>
    <!-- WCAG 2.2: Button image has sufficient touch target with link wrapping -->
    <a href="https://www.buymeacoffee.com/bayareadiscounts" target="_blank" rel="noopener noreferrer" style="display: inline-block; min-height: 48px; min-width: auto; padding: 0;">
      <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=bayareadiscounts&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" alt="Buy Me a Coffee" style="display: block; min-height: 48px;" />
    </a>
  </div>

---

<br>

{% include search-filter-ui.html %}

<div id="search-results" class="programs-container">

{% for category in site.data.programs %}
  {% for program in category[1] %}
    {% include program-card.html program=program %}
  {% endfor %}
{% endfor %}

</div>
