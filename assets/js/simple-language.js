/**
 * Simple Language Mode - Dynamic Enhancements
 *
 * This module provides additional dynamic features for simple language mode:
 * - Adds tooltips to abbreviations and jargon
 * - Simplifies complex terms dynamically
 * - Provides glossary functionality
 * - Enhances eligibility badge explanations
 */

(function() {
  'use strict';

  // Glossary of complex terms and their simple explanations
  const glossary = {
    'EBT': 'Electronic Benefits Transfer - a card to buy food with government help',
    'SNAP': 'Supplemental Nutrition Assistance Program - food stamps, helps buy groceries',
    'CalFresh': 'California\'s food assistance program (same as SNAP/food stamps)',
    'Medi-Cal': 'California\'s free or low-cost health insurance for people with low income',
    'SSI': 'Supplemental Security Income - monthly money for people who are disabled or elderly with low income',
    'SSDI': 'Social Security Disability Insurance - monthly money for people who worked but became disabled',
    'WIC': 'Women, Infants, and Children - food help for pregnant women and young kids',
    'LIHEAP': 'Low Income Home Energy Assistance Program - help paying heating and cooling bills',
    'CARE': 'California Alternate Rates for Energy - a discount on gas and electric bills',
    'FERA': 'Family Electric Rate Assistance - a smaller discount on electric bills for families',
    'SFMTA': 'San Francisco Municipal Transportation Agency - runs Muni buses and trains',
    'BART': 'Bay Area Rapid Transit - the train system that connects Bay Area cities',
    'Caltrain': 'The train that runs from San Francisco to San Jose',
    'AC Transit': 'Alameda-Contra Costa Transit - buses in the East Bay',
    'VA': 'Veterans Affairs - the government agency that helps veterans',
    '501(c)(3)': 'A type of nonprofit organization that is tax-exempt',
    'WCAG': 'Web Content Accessibility Guidelines - rules for making websites easy to use for everyone',
    'AAA': 'Triple-A rating - the highest accessibility standard',
    'income-eligible': 'You qualify based on how much money you make',
    'means-tested': 'They check your income to see if you qualify',
    'public assistance': 'Government programs that help with money, food, or housing'
  };

  // Eligibility explanations in simple language
  const eligibilityExplanations = {
    'low-income': 'For people who don\'t make a lot of money, or who get help like SNAP, EBT, or Medi-Cal',
    'seniors': 'For older adults, usually 60 or 65 years old and up',
    'youth': 'For children and teenagers',
    'college-students': 'For people going to college or university',
    'veterans': 'For people who served in the military, and active service members',
    'families': 'For parents with children',
    'disability': 'For people with disabilities',
    'nonprofits': 'For organizations that help the community (not businesses)',
    'everyone': 'Anyone can use this - no special requirements'
  };

  // Category explanations
  const categoryExplanations = {
    'Food': 'Help getting food, like food banks, grocery money, or free meals',
    'Health': 'Medical care, health insurance, mental health, dental care',
    'Transportation': 'Help with buses, trains, cars, or getting around',
    'Public Transit': 'Discounts for buses, trains, BART, and other public transportation',
    'Utilities': 'Help paying for electricity, gas, water, phone, or internet',
    'Recreation': 'Free or cheap fun activities, parks, sports, and entertainment',
    'Education': 'Schools, classes, tutoring, and learning resources',
    'Museums': 'Free or discounted admission to museums and cultural places',
    'Library Resources': 'Free things from your local library',
    'Technology': 'Computers, internet, phones, and tech help',
    'Finance': 'Help with money, banking, taxes, and bills',
    'Legal Services': 'Free or low-cost help with legal problems',
    'Pet Resources': 'Help for pet owners - food, vet care, and supplies',
    'Community Services': 'Local help and support services',
    'Equipment': 'Borrow tools, equipment, and other items',
    'Tax Preparation': 'Free help filing your taxes',
    'Childcare Assistance': 'Help paying for daycare or childcare',
    'Clothing Assistance': 'Free or low-cost clothes'
  };

  /**
   * Initialize simple language enhancements
   */
  function init() {
    // Check if simple language mode is already active
    if (document.body.classList.contains('simple-language')) {
      applyEnhancements();
    }

    // Watch for changes to body class
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
          if (document.body.classList.contains('simple-language')) {
            applyEnhancements();
          } else {
            removeEnhancements();
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });
  }

  /**
   * Apply all simple language enhancements
   */
  function applyEnhancements() {
    addGlossaryTooltips();
    enhanceEligibilityBadges();
    addCategoryExplanations();
    enhanceAbbreviations();
  }

  /**
   * Remove enhancements when simple language mode is disabled
   */
  function removeEnhancements() {
    // Remove dynamically added tooltips
    document.querySelectorAll('.sl-tooltip').forEach(el => el.remove());

    // Remove enhanced classes
    document.querySelectorAll('.sl-enhanced').forEach(el => {
      el.classList.remove('sl-enhanced');
    });
  }

  /**
   * Add tooltips to glossary terms found in text
   */
  function addGlossaryTooltips() {
    // Only process if simple language is active
    if (!document.body.classList.contains('simple-language')) return;

    // Look for glossary terms in program benefits and descriptions
    const textElements = document.querySelectorAll('.program-benefit, .content-wrapper p, .content-wrapper li');

    textElements.forEach(el => {
      if (el.classList.contains('sl-enhanced')) return;
      el.classList.add('sl-enhanced');

      let html = el.innerHTML;

      // Replace glossary terms with tooltip spans
      Object.keys(glossary).forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        html = html.replace(regex, `<span class="sl-term" title="${glossary[term]}" tabindex="0">$1</span>`);
      });

      el.innerHTML = html;
    });
  }

  /**
   * Enhance eligibility badges with expanded explanations
   */
  function enhanceEligibilityBadges() {
    if (!document.body.classList.contains('simple-language')) return;

    document.querySelectorAll('.eligibility-badge').forEach(badge => {
      const label = badge.getAttribute('aria-label') || '';

      // Find matching eligibility and update title
      Object.keys(eligibilityExplanations).forEach(key => {
        if (label.toLowerCase().includes(key.replace('-', ' '))) {
          badge.setAttribute('title', eligibilityExplanations[key]);
        }
      });
    });
  }

  /**
   * Add explanations to category filters
   */
  function addCategoryExplanations() {
    if (!document.body.classList.contains('simple-language')) return;

    document.querySelectorAll('.filter-btn[data-filter-type="category"]').forEach(btn => {
      const category = btn.getAttribute('data-filter-value');

      if (category && categoryExplanations[category]) {
        // Check if explanation already exists
        if (!btn.querySelector('.simple-language-filter-label')) {
          const label = document.createElement('span');
          label.className = 'simple-language-filter-label';
          label.textContent = categoryExplanations[category];
          btn.appendChild(label);
        }
      }
    });
  }

  /**
   * Find and mark abbreviations for explanation
   */
  function enhanceAbbreviations() {
    if (!document.body.classList.contains('simple-language')) return;

    // Common abbreviations to look for
    const abbreviations = ['EBT', 'SNAP', 'WIC', 'SSI', 'SSDI', 'BART', 'VA'];

    document.querySelectorAll('.program-benefit, .program-name-text').forEach(el => {
      abbreviations.forEach(abbr => {
        if (el.textContent.includes(abbr) && glossary[abbr]) {
          el.setAttribute('title', (el.getAttribute('title') || '') + ' ' + abbr + ': ' + glossary[abbr]);
        }
      });
    });
  }

  /**
   * Get simple explanation for a term
   */
  function getExplanation(term) {
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const [key, value] of Object.entries(glossary)) {
      if (key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTerm) {
        return value;
      }
    }

    return null;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external use
  window.simpleLanguage = {
    getExplanation: getExplanation,
    glossary: glossary,
    eligibilityExplanations: eligibilityExplanations,
    categoryExplanations: categoryExplanations
  };
})();
