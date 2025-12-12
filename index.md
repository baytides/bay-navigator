<h1 style="display:none">Bay Area Discounts</h1>

<a href="https://bayareadiscounts.com" class="site-logo">
  <img src="https://raw.githubusercontent.com/bayareadiscounts/bayareadiscounts/refs/heads/main/logo.png" 
       alt="Bay Area Discounts logo">
</a>

Stretch your budget and explore more of your community.

This guide highlights free and low-cost services, programs, and benefits within the core counties commonly recognized as the San Francisco Bay Area (Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, and Sonoma counties) for public benefit recipients, seniors, youth, college students, military/veterans, families, nonprofit organizations, and anyone looking to save on everyday expenses.

Some programs are available only in specific cities or regions, while others apply to all of California or nationwide. Always check the program or resource website for the most current eligibility details.

This is a community-maintained resource—if you notice outdated information or know of programs that should be included, please contribute via our [GitHub repository](https://github.com/bayareadiscounts/bayareadiscounts).

---

## How to Use This Guide

- Browse a category below  
- Look for icons showing who the deal helps  
- Check **Timeframe** for seasonal or limited offers  
- Always confirm details before using or visiting

---

{% include search-filter-ui.html %}

## Community

<div id="search-results">
{% for program in site.data.programs.community %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Digital Services

<div class="programs-container">
{% for program in site.data.programs.digital_services %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Education

<div class="programs-container">
{% for program in site.data.programs.education %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Food

<div class="programs-container">
{% for program in site.data.programs.food %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Health

<div class="programs-container">
{% for program in site.data.programs.health %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Legal

<div class="programs-container">
{% for program in site.data.programs.legal %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Library Resources

<div class="programs-container">
{% for program in site.data.programs.library_resources %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Pet Resources

<div class="programs-container">
{% for program in site.data.programs.pet_resources %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Recreation

<div class="programs-container">
{% for program in site.data.programs.recreation %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Transportation

<div class="programs-container">
{% for program in site.data.programs.transportation %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---

## Utilities

<div class="programs-container">
{% for program in site.data.programs.utilities %}
  {% include program-card.html program=program %}
{% endfor %}
</div>

---
