/**
 * Client-side i18n Translation Script
 *
 * Applies translations to elements with data-i18n attributes.
 * Falls back to English if translation is missing.
 *
 * Usage:
 *   <span data-i18n="common.search">Search</span>
 *   <input data-i18n-placeholder="common.searchPlaceholder" placeholder="Search...">
 *   <button data-i18n-aria-label="common.close" aria-label="Close">X</button>
 */

(function () {
  const STORAGE_KEY = 'baynavigator_locale';
  const DEFAULT_LOCALE = 'en';
  const SUPPORTED_LOCALES = ['en', 'es'];

  // Translation data cache
  let translations = {};
  let currentLocale = DEFAULT_LOCALE;

  /**
   * Get current locale from storage or browser preference
   */
  function getLocale() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES.includes(stored)) {
        return stored;
      }
    } catch {
      // localStorage not available
    }

    // Check browser language
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && SUPPORTED_LOCALES.includes(browserLang)) {
      return browserLang;
    }

    return DEFAULT_LOCALE;
  }

  /**
   * Get nested value from object using dot notation
   */
  function getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }
      current = current[key];
      if (current === undefined) {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Load translation file for a locale
   */
  async function loadTranslations(locale) {
    if (translations[locale]) {
      return translations[locale];
    }

    try {
      const response = await fetch(`/i18n/${locale}.json`);
      if (response.ok) {
        translations[locale] = await response.json();
        return translations[locale];
      }
    } catch (e) {
      console.warn(`Failed to load translations for ${locale}:`, e);
    }

    return null;
  }

  /**
   * Translate a key
   */
  function t(key, params) {
    let text = getNestedValue(translations[currentLocale], key);

    // Fallback to English
    if (text === undefined && currentLocale !== 'en') {
      text = getNestedValue(translations.en, key);
    }

    if (text === undefined) {
      return null;
    }

    // Interpolate parameters
    if (params) {
      text = text.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }

    return text;
  }

  /**
   * Apply translations to all elements with data-i18n attributes
   */
  function applyTranslations() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const params = el.getAttribute('data-i18n-params');
      const parsedParams = params ? JSON.parse(params) : undefined;
      const text = t(key, parsedParams);
      if (text !== null) {
        el.textContent = text;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = t(key);
      if (text !== null) {
        el.setAttribute('placeholder', text);
      }
    });

    // Translate aria-labels
    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const text = t(key);
      if (text !== null) {
        el.setAttribute('aria-label', text);
      }
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const text = t(key);
      if (text !== null) {
        el.setAttribute('title', text);
      }
    });

    // Translate alt text
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-alt');
      const text = t(key);
      if (text !== null) {
        el.setAttribute('alt', text);
      }
    });

    // Translate tooltips (data-tooltip attribute used by CSS)
    document.querySelectorAll('[data-i18n-tooltip]').forEach((el) => {
      const key = el.getAttribute('data-i18n-tooltip');
      const text = t(key);
      if (text !== null) {
        el.setAttribute('data-tooltip', text);
      }
    });
  }

  /**
   * Initialize i18n
   */
  async function initI18n() {
    currentLocale = getLocale();

    // Set HTML lang attribute
    document.documentElement.lang = currentLocale;

    // Load translations (current locale and English fallback)
    await Promise.all([loadTranslations(currentLocale), loadTranslations('en')]);

    // Apply translations
    applyTranslations();

    // Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              // Element node
              if (
                node.hasAttribute &&
                (node.hasAttribute('data-i18n') ||
                  node.hasAttribute('data-i18n-placeholder') ||
                  node.hasAttribute('data-i18n-aria-label') ||
                  node.hasAttribute('data-i18n-title') ||
                  node.hasAttribute('data-i18n-alt') ||
                  node.querySelector('[data-i18n], [data-i18n-placeholder]'))
              ) {
                shouldTranslate = true;
                break;
              }
            }
          }
        }
        if (shouldTranslate) break;
      }

      if (shouldTranslate) {
        applyTranslations();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Listen for locale changes
    window.addEventListener('locale-changed', async (e) => {
      const { locale } = e.detail;
      if (locale && SUPPORTED_LOCALES.includes(locale)) {
        currentLocale = locale;
        await loadTranslations(locale);
        applyTranslations();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }

  // Expose translate function globally for dynamic use
  window.i18n = {
    t: t,
    getLocale: () => currentLocale,
    setLocale: async (locale) => {
      if (SUPPORTED_LOCALES.includes(locale)) {
        currentLocale = locale;
        try {
          localStorage.setItem(STORAGE_KEY, locale);
        } catch {}
        document.documentElement.lang = locale;
        await loadTranslations(locale);
        applyTranslations();
        window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
      }
    },
  };
})();
