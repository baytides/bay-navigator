/**
 * Keyboard shortcut for search.
 *
 * Replaces a 321-line predecessor that targeted markup which no longer exists
 * (#accessibility-panel, #accessibility-button, #keyboard-help-modal) and was
 * not loaded by any page, so the Ctrl/Cmd+K shortcut the README advertised had
 * not worked for some time.
 *
 * WHY "/" AND NOT A MODIFIER CHORD
 *
 * Ctrl/Cmd+K is taken: Firefox focuses its search bar, Chrome and Edge focus
 * the address bar in search mode. A site that swallows it breaks a browser
 * function people already rely on.
 *
 * Ctrl/Cmd+F is worse. Find-in-page is an assistive feature — it is how people
 * with low vision, cognitive differences or a screen reader locate text on a
 * long page. Overriding it to open a site search would actively remove an
 * accessibility affordance, which is the opposite of the point.
 *
 * "/" is the established convention for jumping to site search (GitHub,
 * Wikipedia, Reddit) and collides with nothing in Chrome, Edge or Safari. It
 * overlaps Firefox's Quick Find, which is why this only calls preventDefault
 * when it actually moved focus — if there is no search box on the page, the
 * keystroke falls through to the browser untouched.
 *
 * WCAG 2.1.4 CHARACTER KEY SHORTCUTS (Level A)
 *
 * A shortcut bound to a single printable character has to be switchable off,
 * remappable, or active only while a component has focus. This one is
 * switchable off, from Settings; `baynavigator_shortcuts_enabled` set to "false"
 * disables it. It also stays inert whenever focus is already in a field, so it cannot
 * swallow a "/" someone is typing into an address.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'baynavigator_shortcuts_enabled';

  function enabled() {
    try {
      // Absent means on. Settings writes 'true'/'false' through its shared
      // setupToggle helper, and seeds this key to 'true' on first visit so the
      // switch reflects the real default rather than showing "off" for a
      // shortcut that works.
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch (e) {
      // Private mode or blocked site data: default to on rather than silently
      // removing the shortcut.
      return true;
    }
  }

  /** True when the keystroke belongs to whatever the person is typing into. */
  function isTyping(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    var tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function findSearchInput() {
    return (
      document.getElementById('search-input') ||
      document.querySelector('input[type="search"]') ||
      null
    );
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== '/') return;
    // Let Ctrl+/, Cmd+/ and friends through to the browser.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTyping(e.target)) return;
    if (!enabled()) return;

    var input = findSearchInput();
    if (!input) return; // Nothing to focus — leave the keystroke alone.

    e.preventDefault();
    input.focus();
    if (typeof input.select === 'function') input.select();
  });
})();
