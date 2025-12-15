// Back to Top Button Functionality
(function() {
  'use strict';
  
  const backToTopButton = document.getElementById('back-to-top');
  if (!backToTopButton) return;
  
  const SCROLL_THRESHOLD = 500; // Show button after scrolling 500px
  
  // Show/hide button based on scroll position
  function toggleBackToTop() {
    if (window.pageYOffset > SCROLL_THRESHOLD) {
      backToTopButton.classList.add('visible');
      backToTopButton.setAttribute('aria-hidden', 'false');
    } else {
      backToTopButton.classList.remove('visible');
      backToTopButton.setAttribute('aria-hidden', 'true');
    }
  }
  
  // Smooth scroll to top
  function scrollToTop() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    // Focus on main content or first heading for accessibility
    const mainContent = document.querySelector('main') || document.querySelector('h1');
    if (mainContent) {
      mainContent.focus();
    }
  }
  
  // Event listeners
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTopButton.addEventListener('click', scrollToTop);
  
  // Initial check
  toggleBackToTop();
})();
