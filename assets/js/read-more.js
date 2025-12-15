/**
 * Read More / Show Less Functionality
 * Automatically truncates long program descriptions and adds toggle buttons
 */

(function() {
  'use strict';

  // Configuration
  const MAX_LENGTH = 200; // Characters to show before truncating
  const ELLIPSIS = '...';

  function initReadMore() {
    // Find all program benefit descriptions
    const benefitElements = document.querySelectorAll('.program-benefit');

    benefitElements.forEach((element, index) => {
      const fullText = element.textContent.trim();
      
      // Skip if text is short enough
      if (fullText.length <= MAX_LENGTH) {
        return;
      }

      // Find a good breaking point (end of sentence or word)
      let truncateAt = MAX_LENGTH;
      const lastPeriod = fullText.lastIndexOf('.', MAX_LENGTH);
      const lastSpace = fullText.lastIndexOf(' ', MAX_LENGTH);

      // Prefer breaking at sentence end, then word boundary
      if (lastPeriod > MAX_LENGTH * 0.7) {
        truncateAt = lastPeriod + 1;
      } else if (lastSpace > MAX_LENGTH * 0.7) {
        truncateAt = lastSpace;
      }

      const truncatedText = fullText.substring(0, truncateAt).trim() + ELLIPSIS;

      // Create wrapper for managing visibility
      const wrapper = document.createElement('span');
      wrapper.className = 'benefit-text-wrapper';
      
      const shortText = document.createElement('span');
      shortText.className = 'benefit-short';
      shortText.textContent = truncatedText;
      
      const fullTextSpan = document.createElement('span');
      fullTextSpan.className = 'benefit-full';
      fullTextSpan.textContent = fullText;
      fullTextSpan.style.display = 'none';

      // Create Read more button
      const readMoreBtn = document.createElement('button');
      readMoreBtn.className = 'read-more-btn';
      readMoreBtn.textContent = 'Read more';
      readMoreBtn.setAttribute('aria-expanded', 'false');
      readMoreBtn.setAttribute('aria-label', `Read more about ${element.closest('.program-card')?.querySelector('.program-name')?.textContent || 'this program'}`);

      // Clear original content and add new structure
      element.textContent = '';
      wrapper.appendChild(shortText);
      wrapper.appendChild(fullTextSpan);
      element.appendChild(wrapper);
      element.appendChild(readMoreBtn);

      // Toggle functionality
      readMoreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent card click if card is clickable
        
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          // Show short version
          shortText.style.display = 'inline';
          fullTextSpan.style.display = 'none';
          this.textContent = 'Read more';
          this.setAttribute('aria-expanded', 'false');
        } else {
          // Show full version
          shortText.style.display = 'none';
          fullTextSpan.style.display = 'inline';
          this.textContent = 'Show less';
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadMore);
  } else {
    initReadMore();
  }

  // Re-run when search results are updated (if using dynamic filtering)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        // Check if program cards were added
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && (node.classList.contains('program-card') || node.querySelector('.program-card'))) {
            setTimeout(initReadMore, 100);
          }
        });
      }
    });
  });

  // Observe the search results container
  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer) {
    observer.observe(resultsContainer, {
      childList: true,
      subtree: true
    });
  }

})();
