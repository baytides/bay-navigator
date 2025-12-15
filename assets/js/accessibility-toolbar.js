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
    keyboardNavHelper: false
  };

  // Load saved settings or use defaults
  let settings = JSON.parse(localStorage.getItem('a11y-settings')) || { ...defaults };

  // Create and inject the accessibility toolbar
  function createToolbar() {
    // Create floating button
    const button = document.createElement('button');
    button.id = 'accessibility-button';
    button.setAttribute('aria-label', 'Open accessibility options');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '♿';
    
    // Force positioning with inline styles to override any conflicts
    button.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #00acc1 0%, #00bcd4 100%);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 172, 193, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    `;
    
    // Adjust for mobile
    if (window.innerWidth <= 768) {
      button.style.top = '16px';
      button.style.left = '16px';
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'a11y-title');
    panel.setAttribute('aria-hidden', 'true');
    
    panel.innerHTML = `
      <button class="a11y-close" aria-label="Close accessibility options">×</button>
      <h3 id="a11y-title">♿ Accessibility Options</h3>
      
      <div class="a11y-control-group">
        <label for="font-size-control">Text Size</label>
        <div class="a11y-buttons" id="font-size-control" role="group" aria-label="Text size controls">
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
      
      <button class="a11y-reset" id="reset-settings">Reset to Defaults</button>
    `;
    
    // Append to body
    document.body.appendChild(button);
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
      togglePanel(button, panel);
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
