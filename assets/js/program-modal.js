/**
 * Program Modal - Handles program detail popout/modal
 * Features:
 * - Open modal on card click
 * - Display full program details with new fields
 * - Call Now / Get Directions / Learn More buttons
 * - Report an Issue functionality
 * - Save/bookmark programs
 * - Keyboard accessibility
 */

(function() {
  'use strict';

  // Create modal container once
  let modalOverlay = null;

  function createModalHTML() {
    const overlay = document.createElement('div');
    overlay.className = 'program-modal-overlay';
    overlay.id = 'program-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    overlay.innerHTML = `
      <div class="program-modal" role="document">
        <!-- Modal Header -->
        <div class="modal-header" id="modal-header">
          <div class="modal-header-gradient" id="modal-header-visual">
            <!-- Icon or image will be inserted here -->
          </div>
          <button class="modal-close-btn" type="button" aria-label="Close modal" id="modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <span class="modal-category" id="modal-category"></span>
        </div>

        <!-- Modal Body -->
        <div class="modal-body" id="modal-body">
          <h2 class="modal-title" id="modal-title"></h2>
          <div class="modal-location" id="modal-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span id="modal-location-text"></span>
          </div>

          <!-- About Section -->
          <p class="modal-description" id="modal-description"></p>

          <!-- What They Offer Section -->
          <div class="modal-section" id="modal-offer-section">
            <h3 class="modal-section-title">What They Offer</h3>
            <div class="modal-section-content modal-offer-list" id="modal-offer"></div>
          </div>

          <!-- How To Get It Section -->
          <div class="modal-section" id="modal-howto-section">
            <h3 class="modal-section-title">How to Get It</h3>
            <div class="modal-section-content" id="modal-howto"></div>
          </div>

          <!-- Eligibility Section -->
          <div class="modal-section" id="modal-eligibility-section">
            <h3 class="modal-section-title">Who's Eligible</h3>
            <div class="modal-eligibility" id="modal-eligibility"></div>
          </div>

          <!-- Contact Section -->
          <div class="modal-section" id="modal-contact-section">
            <h3 class="modal-section-title">Contact</h3>
            <div class="modal-contact" id="modal-contact"></div>
          </div>

          <!-- Meta info -->
          <div class="modal-meta" id="modal-meta"></div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="modal-actions" id="modal-actions">
            <!-- CTA buttons will be inserted here -->
          </div>
          <button class="modal-save-btn" type="button" aria-label="Save program" id="modal-save">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>

        <!-- Report Issue Link -->
        <div class="modal-report">
          <button type="button" class="modal-report-btn" id="modal-report">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            Report an Issue
          </button>
        </div>
      </div>
    `;

    return overlay;
  }

  function initModal() {
    if (modalOverlay) return;

    modalOverlay = createModalHTML();
    document.body.appendChild(modalOverlay);

    // Event listeners
    const closeBtn = document.getElementById('modal-close');
    const saveBtn = document.getElementById('modal-save');
    const reportBtn = document.getElementById('modal-report');

    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    saveBtn.addEventListener('click', toggleSaveProgram);
    reportBtn.addEventListener('click', openReportForm);

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
      }
    });
  }

  function openModal(programId) {
    initModal();

    // Find program data
    const dataScript = document.querySelector(`.program-data[data-program-id="${programId}"]`);
    if (!dataScript) {
      console.error('Program data not found for:', programId);
      return;
    }

    let program;
    try {
      program = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error('Error parsing program data:', e);
      return;
    }

    // Populate modal
    populateModal(program);

    // Show modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus management
    document.getElementById('modal-close').focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';

    // Return focus to the triggering card
    const activeCard = document.querySelector('.program-card:focus, .program-card.last-focused');
    if (activeCard) {
      activeCard.focus();
      activeCard.classList.remove('last-focused');
    }
  }

  function populateModal(program) {
    // Header visual
    const headerVisual = document.getElementById('modal-header-visual');
    headerVisual.style.setProperty('--modal-cat-color', program.catColor || '#0891b2');

    if (program.image) {
      headerVisual.innerHTML = `<img src="${program.image}" alt="" class="modal-header-image">`;
      headerVisual.className = 'modal-header-visual';
    } else {
      headerVisual.innerHTML = getCategoryIcon(program.category);
      headerVisual.className = 'modal-header-gradient';
    }

    // Category
    document.getElementById('modal-category').textContent = program.category || '';

    // Title
    const titleEl = document.getElementById('modal-title');
    titleEl.innerHTML = program.name;
    if (program.verified_date) {
      titleEl.innerHTML += `
        <span class="modal-verified" title="Verified ${program.verified_date}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>`;
    }

    // Location
    let locationText = program.city || '';
    if (!locationText && program.area) {
      locationText = Array.isArray(program.area) ? program.area.join(', ') : program.area;
    }
    document.getElementById('modal-location-text').textContent = locationText || 'Bay Area';

    // Description
    document.getElementById('modal-description').textContent = program.description || program.benefit || '';

    // What They Offer
    const offerSection = document.getElementById('modal-offer-section');
    const offerContent = document.getElementById('modal-offer');
    if (program.what_they_offer) {
      offerSection.style.display = 'block';
      // Convert markdown-style lists to HTML
      offerContent.innerHTML = formatOfferList(program.what_they_offer);
    } else if (program.benefit && program.benefit !== program.description) {
      offerSection.style.display = 'block';
      offerContent.innerHTML = `<p>${program.benefit}</p>`;
    } else {
      offerSection.style.display = 'none';
    }

    // How To Get It
    const howtoSection = document.getElementById('modal-howto-section');
    const howtoContent = document.getElementById('modal-howto');
    if (program.how_to_get_it) {
      howtoSection.style.display = 'block';
      // Parse numbered steps and render as ordered list
      const steps = program.how_to_get_it
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '')); // Remove leading numbers

      if (steps.length > 1) {
        howtoContent.innerHTML = '<ol class="modal-steps">' +
          steps.map(step => `<li>${window.AppUtils?.escapeHtml(step) || step}</li>`).join('') +
          '</ol>';
      } else {
        howtoContent.textContent = program.how_to_get_it;
      }
    } else {
      howtoSection.style.display = 'none';
    }

    // Eligibility
    const eligSection = document.getElementById('modal-eligibility-section');
    const eligContent = document.getElementById('modal-eligibility');
    if (program.eligibility && program.eligibility.length > 0) {
      eligSection.style.display = 'block';
      eligContent.innerHTML = program.eligibility
        .filter(e => e && !e.startsWith('📍')) // Filter out emoji placeholders
        .map(e => `<span class="modal-tag">${formatEligibility(e)}</span>`)
        .join('');
    } else {
      eligSection.style.display = 'none';
    }

    // Contact Section
    const contactSection = document.getElementById('modal-contact-section');
    const contactContent = document.getElementById('modal-contact');
    if (program.phone || program.address) {
      contactSection.style.display = 'block';
      let contactHTML = '';

      if (program.phone) {
        contactHTML += `
          <div class="modal-contact-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <a href="tel:${program.phone.replace(/[^0-9+]/g, '')}">${program.phone}</a>
          </div>`;
      }

      if (program.address) {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(program.address)}`;
        contactHTML += `
          <div class="modal-contact-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${program.address}</a>
          </div>`;
      }

      contactContent.innerHTML = contactHTML;
    } else {
      contactSection.style.display = 'none';
    }

    // Meta info
    const metaContent = document.getElementById('modal-meta');
    let metaHTML = '';
    if (program.timeframe) {
      metaHTML += `
        <span class="modal-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${program.timeframe}
        </span>`;
    }
    if (program.verified_date) {
      metaHTML += `
        <span class="modal-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Verified ${program.verified_date}
        </span>`;
    }
    metaContent.innerHTML = metaHTML;

    // Action buttons
    const actionsContainer = document.getElementById('modal-actions');
    let actionsHTML = '';

    // Primary CTA - depends on what we have
    if (program.phone) {
      actionsHTML += `
        <a href="tel:${program.phone.replace(/[^0-9+]/g, '')}" class="modal-cta modal-cta-phone">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Call Now
        </a>`;
    }

    if (program.address) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(program.address)}`;
      actionsHTML += `
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="modal-cta modal-cta-directions ${program.phone ? 'modal-cta-secondary' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          Get Directions
        </a>`;
    }

    if (program.link) {
      const isPrimary = !program.phone && !program.address;
      actionsHTML += `
        <a href="${program.link}" target="_blank" rel="noopener noreferrer" class="modal-cta ${isPrimary ? '' : 'modal-cta-secondary'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          ${program.link_text || 'Learn More'}
        </a>`;
    }

    actionsContainer.innerHTML = actionsHTML;

    // Update save button state
    const saveBtn = document.getElementById('modal-save');
    const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
    if (savedPrograms.includes(program.id)) {
      saveBtn.classList.add('saved');
    } else {
      saveBtn.classList.remove('saved');
    }
    saveBtn.dataset.programId = program.id;

    // Store current program for report
    modalOverlay.dataset.currentProgramId = program.id;
    modalOverlay.dataset.currentProgramName = program.name;
  }

  function formatOfferList(text) {
    if (!text) return '';

    // Split by lines and convert to list items
    const lines = text.split('\n').filter(line => line.trim());
    let html = '<ul class="modal-offer-list">';

    lines.forEach(line => {
      // Remove leading "- " if present
      const cleanLine = line.replace(/^[\s-]*/, '').trim();
      if (cleanLine) {
        html += `<li>${cleanLine}</li>`;
      }
    });

    html += '</ul>';
    return html;
  }

  function formatEligibility(elig) {
    const map = {
      'low-income': 'Low Income',
      'seniors': 'Seniors',
      'youth': 'Youth',
      'college-students': 'Students',
      'veterans': 'Veterans',
      'families': 'Families',
      'disability': 'Disability',
      'nonprofits': 'Nonprofits',
      'everyone': 'Everyone'
    };
    return map[elig] || elig;
  }

  function getCategoryIcon(category) {
    // Normalize category to lowercase for matching
    const cat = (category || '').toLowerCase().replace(/\s+/g, '_');
    const icons = {
      // Food - coffee cup
      'food': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
      // Health - heartbeat
      'health': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
      // Recreation - ticket/activity
      'recreation': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>',
      // Community / Community Services - users
      'community': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      'community_services': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      // Education - graduation cap
      'education': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
      // Finance / Financial Assistance - dollar sign
      'finance': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      'financial_assistance': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      // Transportation - car
      'transportation': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>',
      // Technology - laptop
      'technology': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>',
      // Legal - scale
      'legal': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>',
      // Pet Resources - paw print
      'pet_resources': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="4" cy="8" r="2"></circle><path d="M9 17c-1.5-1-3-3.7-3-6 0-1.2.5-2.3 1.3-3"></path><path d="M15 17c1.5-1 3-3.7 3-6 0-1.2-.5-2.3-1.3-3"></path><path d="M12 22c-2.8 0-5-2.2-5-5 0-1.5.7-2.9 1.7-3.9.5-.5 1.2-.8 1.9-.9.4-.1.8-.2 1.4-.2s1 .1 1.4.2c.7.1 1.4.4 1.9.9 1 1 1.7 2.4 1.7 3.9 0 2.8-2.2 5-5 5Z"></path></svg>',
      // Equipment - tool/wrench
      'equipment': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      // Library Resources - book
      'library_resources': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
      // Utilities - zap/lightning
      'utilities': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      // Childcare Assistance - baby/family
      'childcare_assistance': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"></path><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"></path></svg>',
      // Clothing Assistance - shirt
      'clothing_assistance': '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>'
    };
    // Default fallback - info circle
    return icons[cat] || '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
  }

  function toggleSaveProgram() {
    const saveBtn = document.getElementById('modal-save');
    const programId = saveBtn.dataset.programId;

    let savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');

    if (savedPrograms.includes(programId)) {
      savedPrograms = savedPrograms.filter(id => id !== programId);
      saveBtn.classList.remove('saved');
    } else {
      savedPrograms.push(programId);
      saveBtn.classList.add('saved');
    }

    localStorage.setItem('savedPrograms', JSON.stringify(savedPrograms));

    // Also update the card's save button
    const cardSaveBtn = document.querySelector(`.card-save-btn[data-program-id="${programId}"]`);
    if (cardSaveBtn) {
      cardSaveBtn.classList.toggle('saved', savedPrograms.includes(programId));
    }
  }

  function openReportForm() {
    const programId = modalOverlay.dataset.currentProgramId;
    const programName = modalOverlay.dataset.currentProgramName;

    // Create a simple report form modal
    const reportOverlay = document.createElement('div');
    reportOverlay.className = 'report-overlay active';
    reportOverlay.innerHTML = `
      <div class="report-modal">
        <div class="report-header">
          <h3>Report an Issue</h3>
          <button type="button" class="report-close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form class="report-form" id="report-form">
          <p class="report-program">Reporting issue with: <strong>${programName}</strong></p>
          <div class="report-field">
            <label for="report-type">What's the issue?</label>
            <select id="report-type" name="type" required>
              <option value="">Select an issue type</option>
              <option value="outdated">Information is outdated</option>
              <option value="incorrect">Information is incorrect</option>
              <option value="broken-link">Link doesn't work</option>
              <option value="program-ended">Program has ended</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="report-field">
            <label for="report-details">Details (optional)</label>
            <textarea id="report-details" name="details" rows="3" placeholder="Please describe the issue..."></textarea>
          </div>
          <div class="report-field">
            <label for="report-email">Your email (optional)</label>
            <input type="email" id="report-email" name="email" placeholder="yourname@example.com">
            <small>We'll only use this to follow up if needed</small>
          </div>
          <div class="report-actions">
            <button type="button" class="report-cancel">Cancel</button>
            <button type="submit" class="report-submit">Submit Report</button>
          </div>
        </form>
        <div class="report-success" style="display: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h4>Thank you!</h4>
          <p>Your report has been submitted. We'll review it as soon as possible.</p>
          <button type="button" class="report-done">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(reportOverlay);

    // Event listeners
    const closeBtn = reportOverlay.querySelector('.report-close');
    const cancelBtn = reportOverlay.querySelector('.report-cancel');
    const doneBtn = reportOverlay.querySelector('.report-done');
    const form = reportOverlay.querySelector('#report-form');

    const closeReport = () => {
      reportOverlay.classList.remove('active');
      setTimeout(() => reportOverlay.remove(), 300);
    };

    closeBtn.addEventListener('click', closeReport);
    cancelBtn.addEventListener('click', closeReport);
    doneBtn.addEventListener('click', closeReport);
    reportOverlay.addEventListener('click', (e) => {
      if (e.target === reportOverlay) closeReport();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const reportData = {
        programId,
        programName,
        type: formData.get('type'),
        details: formData.get('details'),
        email: formData.get('email'),
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Store in localStorage for now (could be sent to a backend later)
      const reports = JSON.parse(localStorage.getItem('programReports') || '[]');
      reports.push(reportData);
      localStorage.setItem('programReports', JSON.stringify(reports));

      // Show success message
      form.style.display = 'none';
      reportOverlay.querySelector('.report-success').style.display = 'flex';
    });
  }

  // Initialize card click handlers
  function initCardHandlers() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.program-card');
      if (card && !e.target.closest('.card-save-btn')) {
        const programId = card.dataset.programId;
        if (programId) {
          card.classList.add('last-focused');
          openModal(programId);
        }
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = e.target.closest('.program-card');
        if (card) {
          const programId = card.dataset.programId;
          if (programId) {
            card.classList.add('last-focused');
            openModal(programId);
          }
        }
      }
    });

    // Initialize save button handlers on cards
    document.addEventListener('click', (e) => {
      const saveBtn = e.target.closest('.card-save-btn');
      if (saveBtn) {
        e.stopPropagation();
        const programId = saveBtn.dataset.programId;

        let savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');

        if (savedPrograms.includes(programId)) {
          savedPrograms = savedPrograms.filter(id => id !== programId);
          saveBtn.classList.remove('saved');
        } else {
          savedPrograms.push(programId);
          saveBtn.classList.add('saved');
        }

        localStorage.setItem('savedPrograms', JSON.stringify(savedPrograms));
      }
    });

    // Restore saved state on page load
    const savedPrograms = JSON.parse(localStorage.getItem('savedPrograms') || '[]');
    savedPrograms.forEach(programId => {
      const btn = document.querySelector(`.card-save-btn[data-program-id="${programId}"]`);
      if (btn) btn.classList.add('saved');
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardHandlers);
  } else {
    initCardHandlers();
  }

  // Expose for external use if needed
  window.ProgramModal = {
    open: openModal,
    close: closeModal
  };
})();
