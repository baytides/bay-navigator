# Accessibility Features

This document outlines the accessibility features implemented in the Bay Navigator website to ensure WCAG 2.2 AAA compliance and progressive adoption of WCAG 3.0 draft standards.

## WCAG 2.2 AAA Compliance

### Visual Accessibility

- **High Contrast Mode**: Comprehensive high contrast styling that works across all color themes (light, dark, auto)
  - Accessible via the Accessibility Toolbar (♿ button, top-left)
  - Overrides all CSS custom properties with AAA-compliant colors
  - Enhanced borders, shadows, and interactive elements

- **Text Spacing Toggle**: Enhanced text spacing meets WCAG 2.1.4 AAA requirements
  - Line height: minimum 1.5× font size
  - Paragraph spacing: minimum 2× font size
  - Letter spacing: minimum 0.12× font size
  - Word spacing: minimum 0.16× font size
  - Toggle via Utility Bar "Spacing" button

- **Theme Support**: Three theme modes with proper contrast
  - Auto (follows system preference)
  - Light mode
  - Dark mode
  - Accessible via Utility Bar theme selector

### Interaction Accessibility

- **Touch Targets**: All interactive elements meet WCAG 2.5.5 AAA minimum size (44×44px)
  - Utility bar buttons
  - Accessibility toolbar controls
  - Step flow modal buttons
  - Navigation elements

- **Keyboard Navigation**:
  - Focus trap in modal dialogs prevents keyboard escape
  - Skip to main content link
  - Visible focus indicators
  - Tab order follows logical reading flow
  - Keyboard shortcuts: Ctrl/Cmd + K for global search

- **Focus Indicators**: Enhanced focus mode available in Accessibility Toolbar
  - 4px solid outlines
  - 4px outline offset
  - Additional 6px shadow for visibility

### Screen Reader Support

- Proper ARIA labels on all interactive elements
- ARIA live regions for dynamic content
- Screen reader-only text for context
- Semantic HTML structure
- Descriptive link text

## WCAG 3.0 Draft Features

### APCA Contrast Checker

The Advanced Perceptual Contrast Algorithm (APCA) is implemented as a progressive enhancement for WCAG 3.0 compatibility.

**JavaScript API** (available globally as `window.APCA`):

```javascript
// Calculate APCA Lc value
const lc = window.APCA.calculate(textColor, bgColor);

// Get conformance rating
const rating = window.APCA.getRating(lc, fontSize, isBold);

// Check element contrast
const result = window.APCA.checkElement(element);

// Scan entire page for issues
const issues = window.APCA.scanPage();

// Parse CSS color to RGB
const rgb = window.APCA.parseColor('#00acc1');
```

**APCA Conformance Levels**:

- **AAA+** (Lc ≥ 90): Excellent contrast for all text sizes
- **AAA** (Lc ≥ 75): Very good contrast, suitable for body text (12px+)
- **AA** (Lc ≥ 60): Good contrast for regular body text (14px+)
- **A** (Lc ≥ 45): Adequate for large text only (18px+)
- **Sub** (Lc ≥ 30): Only suitable for very large text (24px+)
- **Fail** (Lc < 30): Insufficient contrast

## Accessibility Toolbar Features

The floating accessibility button (♿) in the top-left provides:

1. **Text Size Control**: Increase/decrease font size from 50% to 200%
2. **High Contrast Mode**: Toggle high contrast colors
3. **Dyslexia-Friendly Font**: Switch to OpenDyslexic/Comic Sans MS
4. **Focus Mode**: Enhanced focus indicators (4px outlines + shadows)
5. **Keyboard Navigation Helper**: Visual "You are here" indicators
6. **Simple Language Mode**: Shows simplified summaries (when available)
7. **Reset**: Restore all settings to defaults

All preferences are saved to localStorage and persist across sessions.

## Color Theme System

The site uses CSS custom properties for theming:

**Light Mode Variables**:

- Background: `--bg-main: white`
- Text: `--text-primary: #24292e`
- Links: `--text-link: #00838f`
- Borders: `--border-color: #e1e4e8`

**Dark Mode Variables**:

- Background: `--bg-main: #0d1117`
- Text: `--text-primary: #e8eef5`
- Links: `--text-link: #79d8eb`
- Borders: `--border-color: #30363d`

**High Contrast Overrides**:

- Light: Pure black text (#000) on white background
- Dark: Pure white text (#fff) on black background
- Links: Blue (#0000ff) in light mode, Yellow (#ffff00) in dark mode

## Testing Accessibility

### Manual Testing

1. Navigate using only keyboard (Tab, Shift+Tab, Enter, Escape)
2. Toggle high contrast mode and verify all content is visible
3. Test with screen reader (NVDA, JAWS, VoiceOver)
4. Verify touch targets are easily clickable on mobile
5. Test color themes (light, dark, auto)

### Automated Testing

Use the APCA checker to scan for contrast issues:

```javascript
const issues = window.APCA.scanPage();
console.table(
  issues.map((i) => ({
    element: i.element.tagName,
    text: i.element.textContent.substring(0, 50),
    lc: i.lc.toFixed(2),
    passes: i.rating.passes,
    rating: i.rating.rating,
  }))
);
```

## Browser Support

All accessibility features are tested and supported in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 5+)

Progressive enhancement ensures graceful degradation in older browsers.

## Recent Updates (December 2025)

### Enhancements

1. **PWA install moved to utility bar**: Cleaner mobile experience with install button in utility bar instead of footer/floating pill
2. **Theme override system**: Manual light/dark/auto theme selection in utility bar
3. **Text spacing toggle**: WCAG 2.1.4 AAA compliant text spacing available in utility bar

### Bug Fixes

1. **Dark mode gradient typo**: Corrected hex color `#0d2626a15` → `#0d262615`
2. **Spacing toggle visual state**: Added visual styling synchronization on page load
3. **Focus trap in step-flow modal**: Implemented keyboard navigation containment

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/)
- [APCA Documentation](https://github.com/Myndex/apca-w3)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Reporting Accessibility Issues

If you encounter any accessibility barriers, please report them via:

- GitHub Issues: [github.com/baytides/baynavigator/issues](https://github.com/baytides/baynavigator/issues)
- Email: [accessibility contact through the site]

We are committed to maintaining WCAG 2.2 AAA compliance and continuously improving accessibility.
