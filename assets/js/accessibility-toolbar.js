/* ============================================
   ACCESSIBILITY TOOLBAR
   Provides comprehensive accessibility features
   with persistent localStorage preferences
   ============================================ */

(function() {
  'use strict';

  // Default settings
  const defaults = {
    fontSize: 100,
    highContrast: false,
    dyslexiaFont: false,
    focusMode: false,
    keyboardNavHelper: false,
    simpleLanguage: false
  };

  // Load saved settings or use defaults
  let settings = { ...defaults };
  try {
    const stored = localStorage.getItem('a11y-settings');
    if (stored) {
      settings = { ...defaults, ...JSON.parse(stored) };
    }
  } catch (err) {
    // Ignore corrupted storage and fall back to defaults
    settings = { ...defaults };
  }

  // Create and inject the accessibility toolbar
  function createToolbar() {
    // Find the footer button (created in footer.html)
    const button = document.getElementById('accessibility-button');
    if (!button) {
      console.warn('Accessibility button not found in footer');
      return;
    }

    button.setAttribute('aria-label', 'Open accessibility options');
    button.setAttribute('aria-expanded', 'false');

    // Create panel
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'a11y-title');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('inert', '');
    
    panel.innerHTML = `
      <button class="a11y-close" aria-label="Close accessibility options">×</button>
      <h3 id="a11y-title">♿ Accessibility Options</h3>
      
      <div class="a11y-control-group">
        <span id="font-size-label">Text Size</span>
        <div class="a11y-buttons" id="font-size-control" role="group" aria-labelledby="font-size-label">
          <button class="a11y-btn" id="decrease-font" aria-label="Decrease text size">A-</button>
          <span class="a11y-value" id="font-size-display" aria-live="polite">${settings.fontSize}%</span>
          <button class="a11y-btn" id="increase-font" aria-label="Increase text size">A+</button>
        </div>
      </div>
      
      <div class="a11y-control-group">
        <div class="a11y-toggle">
          <span id="high-contrast-label">High Contrast</span>
          <div class="toggle-switch ${settings.highContrast ? 'active' : ''}" 
               role="switch" 
               aria-checked="${settings.highContrast}"
               aria-labelledby="high-contrast-label"
               tabindex="0"
               id="high-contrast-toggle"></div>
        </div>
        
        <div class="a11y-toggle">
          <span id="dyslexia-font-label">Dyslexia-Friendly Font</span>
          <div class="toggle-switch ${settings.dyslexiaFont ? 'active' : ''}" 
               role="switch" 
               aria-checked="${settings.dyslexiaFont}"
               aria-labelledby="dyslexia-font-label"
               tabindex="0"
               id="dyslexia-font-toggle"></div>
        </div>
        
        <div class="a11y-toggle">
          <span id="focus-mode-label">Enhanced Focus Indicators</span>
          <div class="toggle-switch ${settings.focusMode ? 'active' : ''}" 
               role="switch" 
               aria-checked="${settings.focusMode}"
               aria-labelledby="focus-mode-label"
               tabindex="0"
               id="focus-mode-toggle"></div>
        </div>
        
        <div class="a11y-toggle">
          <span id="keyboard-nav-label">Keyboard Navigation Helper</span>
          <div class="toggle-switch ${settings.keyboardNavHelper ? 'active' : ''}" 
               role="switch" 
               aria-checked="${settings.keyboardNavHelper}"
               aria-labelledby="keyboard-nav-label"
               tabindex="0"
               id="keyboard-nav-toggle"></div>
        </div>
      </div>

      <div class="a11y-control-group">
        <div class="a11y-toggle">
          <span id="simple-language-label">Simple Language (beta)</span>
          <div class="toggle-switch ${settings.simpleLanguage ? 'active' : ''}" 
               role="switch" 
               aria-checked="${settings.simpleLanguage}"
               aria-labelledby="simple-language-label"
               tabindex="0"
               id="simple-language-toggle"></div>
        </div>
      </div>

      <button class="a11y-reset" id="reset-settings">Reset to Defaults</button>
    `;
    
    // Append panel to body (button is already in footer)
    document.body.appendChild(panel);
    
    // Apply saved settings on load
    applySettings();
    
    // Event listeners
    setupEventListeners(button, panel);
  }

  function setupEventListeners(button, panel) {
    // Toggle panel
    button.addEventListener('click', () => togglePanel(button, panel));
    
    // Close button
    panel.querySelector('.a11y-close').addEventListener('click', () => {
      closePanel(button, panel);
    });
    
    // Font size controls
    document.getElementById('decrease-font').addEventListener('click', () => {
      adjustFontSize(-10);
    });
    
    document.getElementById('increase-font').addEventListener('click', () => {
      adjustFontSize(10);
    });
    
    // Toggle switches
    setupToggle('high-contrast-toggle', 'highContrast', toggleHighContrast);
    setupToggle('dyslexia-font-toggle', 'dyslexiaFont', toggleDyslexiaFont);
    setupToggle('focus-mode-toggle', 'focusMode', toggleFocusMode);
    setupToggle('keyboard-nav-toggle', 'keyboardNavHelper', toggleKeyboardNavHelper);
    setupToggle('simple-language-toggle', 'simpleLanguage', toggleSimpleLanguage);
    
    // Reset button
    document.getElementById('reset-settings').addEventListener('click', resetSettings);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== button) {
        closePanel(button, panel);
      }
    });
    
    // Close on Escape key
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePanel(button, panel);
        button.focus();
      }
    });
  }

  function togglePanel(button, panel) {
    const isOpen = panel.classList.contains('open');
    
    if (isOpen) {
      closePanel(button, panel);
    } else {
      openPanel(button, panel);
    }
  }

  function openPanel(button, panel) {
    panel.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.removeAttribute('inert');
    
    // Focus first interactive element
    setTimeout(() => {
      const firstButton = panel.querySelector('button:not(.a11y-close)');
      if (firstButton) firstButton.focus();
    }, 100);
    
    // Announce to screen readers
    announce('Accessibility options opened');
  }

  function closePanel(button, panel) {
    // Remove focus from any focused element inside the panel
    const focusedElement = panel.querySelector(':focus');
    if (focusedElement) {
      focusedElement.blur();
    }
    
    panel.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('inert', '');
    
    // Announce to screen readers
    announce('Accessibility options closed');
  }

  function setupToggle(elementId, settingKey, callback) {
    const toggle = document.getElementById(elementId);
    
    // Click handler
    toggle.addEventListener('click', () => {
      settings[settingKey] = !settings[settingKey];
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-checked', settings[settingKey]);
      callback(settings[settingKey]);
      saveSettings();
    });
    
    // Keyboard handler (Enter/Space)
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  }

  function adjustFontSize(change) {
    settings.fontSize = Math.max(80, Math.min(200, settings.fontSize + change));
    document.documentElement.style.fontSize = settings.fontSize + '%';
    document.getElementById('font-size-display').textContent = settings.fontSize + '%';
    saveSettings();
    announce(`Text size set to ${settings.fontSize}%`);
  }

  function toggleHighContrast(enabled) {
    document.body.classList.toggle('high-contrast', enabled);
    announce(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  function toggleDyslexiaFont(enabled) {
    document.body.classList.toggle('dyslexia-font', enabled);
    announce(`Dyslexia-friendly font ${enabled ? 'enabled' : 'disabled'}`);
  }

  function toggleFocusMode(enabled) {
    document.body.classList.toggle('focus-mode', enabled);
    announce(`Enhanced focus indicators ${enabled ? 'enabled' : 'disabled'}`);
  }

  function toggleKeyboardNavHelper(enabled) {
    document.body.classList.toggle('keyboard-nav-helper', enabled);
    announce(`Keyboard navigation helper ${enabled ? 'enabled' : 'disabled'}`);
  }

  function toggleSimpleLanguage(enabled) {
    document.body.classList.toggle('simple-language', enabled);
    announce(`Simple language ${enabled ? 'enabled' : 'disabled'}`);
  }

  function resetSettings() {
    if (confirm('Reset all accessibility settings to defaults?')) {
      settings = { ...defaults };
      saveSettings();
      applySettings();
      updateUI();
      
      announce('All accessibility settings reset to defaults');
    }
  }

  function applySettings() {
    // Apply font size
    document.documentElement.style.fontSize = settings.fontSize + '%';
    
    // Apply toggles
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('dyslexia-font', settings.dyslexiaFont);
    document.body.classList.toggle('focus-mode', settings.focusMode);
    document.body.classList.toggle('keyboard-nav-helper', settings.keyboardNavHelper);
    document.body.classList.toggle('simple-language', settings.simpleLanguage);
  }

  function updateUI() {
    // Update font size display
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) {
      fontDisplay.textContent = settings.fontSize + '%';
    }
    
    // Update toggle switches
    updateToggleUI('high-contrast-toggle', settings.highContrast);
    updateToggleUI('dyslexia-font-toggle', settings.dyslexiaFont);
    updateToggleUI('focus-mode-toggle', settings.focusMode);
    updateToggleUI('keyboard-nav-toggle', settings.keyboardNavHelper);
    updateToggleUI('simple-language-toggle', settings.simpleLanguage);
  }

  function updateToggleUI(elementId, isActive) {
    const toggle = document.getElementById(elementId);
    if (toggle) {
      toggle.classList.toggle('active', isActive);
      toggle.setAttribute('aria-checked', isActive);
    }
  }

  function saveSettings() {
    localStorage.setItem('a11y-settings', JSON.stringify(settings));
  }

  function handleKeyboardShortcuts(e) {
    // Alt + A: Toggle accessibility panel
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      const button = document.getElementById('accessibility-button');
      const panel = document.getElementById('accessibility-panel');
      if (button && panel) togglePanel(button, panel);
    }

    // Alt + L: Toggle simple language
    if (e.altKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      const toggle = document.getElementById('simple-language-toggle');
      if (toggle) toggle.click();
    }
    
    // Alt + +: Increase font size
    if (e.altKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      adjustFontSize(10);
    }
    
    // Alt + -: Decrease font size
    if (e.altKey && e.key === '-') {
      e.preventDefault();
      adjustFontSize(-10);
    }
    
    // Alt + C: Toggle high contrast
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      const toggle = document.getElementById('high-contrast-toggle');
      if (toggle) toggle.click();
    }
  }

  // Announce to screen readers
  function announce(message) {
    const announcer = document.getElementById('a11y-announcer') || createAnnouncer();
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }

  function createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
    return announcer;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToolbar);
  } else {
    createToolbar();
  }

  // Track usage analytics (if Google Analytics is present)
  function trackA11yEvent(action, label) {
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        'event_category': 'Accessibility',
        'event_label': label
      });
    }
  }

  // Export for potential external use
  window.AccessibilityToolbar = {
    getSettings: () => ({ ...settings }),
    resetSettings,
    adjustFontSize,
    announce
  };

})();
