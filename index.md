---
layout: default
---
<style>
.site-logo img {
  max-width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 768px) {
  .site-logo img {
    max-width: 300px;
    margin: 0 auto;
  }
}

@media (prefers-color-scheme: dark) {
  h1, h2, h3, h4, h5, h6 {
    color: #58c4d9;
  }

  p {
    color: #c9d1d9;
  }

  a {
    color: #58c4d9;
  }

  a:visited {
    color: #79d8eb;
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
  <img src="/assets/images/logo.png" 
       alt="Bay Area Discounts logo">
</a>

Stretch your budget and explore more of your community.

This guide highlights free and low-cost services, programs, and benefits within the core counties commonly recognized as the San Francisco Bay Area (Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma counties) for public benefit recipients, seniors, youth, college students, military/veterans, families, nonprofit organizations, and anyone looking to save on everyday expenses.

Some programs are available only in specific cities or regions, while others apply to all of California or nationwide. Always check the program or resource website for the most current eligibility details.

This is a community-maintained resource—if you notice outdated information or know of programs that should be included, please contribute via our [GitHub repository](https://github.com/bayareadiscounts/bayareadiscounts).

## How to Use This Guide

- Use the search bar to find specific programs
- Filter by who the program helps, category, or area
- Check **Timeframe** for seasonal or limited offers
- Always confirm details before using or visiting

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
