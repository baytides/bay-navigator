# Accessibility Statement for Bay Navigator

## Conformance Status

Bay Navigator is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

### WCAG 2.2 AAA Compliance

This website aims to conform to the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AAA**. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.

## Accessibility Features

### Visual Accessibility

- **High Contrast Ratios**: All text meets AAA standards (7:1 for normal text, 4.5:1 for large text)
- **Color Customization**: Built-in accessibility toolbar allows users to adjust:
  - Font size (up to 200% zoom)
  - High contrast mode
  - Grayscale mode
  - Dark mode
- **Visible Focus Indicators**: 3px solid outlines with high contrast for keyboard navigation
- **Responsive Design**: Works on all screen sizes from mobile (375px) to desktop (4K+)
- **No Flash Content**: Site contains no flashing or auto-playing animations

### Keyboard Navigation

- **Full Keyboard Support**: All interactive elements accessible via keyboard
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + K` - Focus global search
  - `/` - Focus search bar
  - `Escape` - Clear filters or blur input
  - `?` - Show keyboard help
  - `Tab` - Navigate forward through interactive elements
  - `Shift + Tab` - Navigate backward
- **Skip Links**: "Skip to main content" link for screen reader users
- **Logical Tab Order**: Follows document structure

### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy (h1 → h2 → h3)
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Alt Text**: All images include descriptive alt text
- **Live Regions**: Search results update announced to screen readers
- **Landmark Regions**: Proper use of header, main, nav, footer elements
- **Form Labels**: All form inputs have associated labels

### Motion & Timing

- **Reduced Motion Support**: Respects `prefers-reduced-motion` media query
- **No Time Limits**: Users have unlimited time to interact with content
- **Pause/Stop Control**: All animations respect user motion preferences
- **No Auto-Refresh**: Content does not auto-refresh

### Mobile Accessibility

- **Touch Target Size**: All interactive elements minimum 44x44px
- **Portrait & Landscape**: Works in both orientations
- **Pinch-to-Zoom**: Enabled for all users
- **No Horizontal Scroll**: Content fits within viewport width

### Content Accessibility

- **Clear Link Text**: No "click here" or ambiguous link text
- **Descriptive Headings**: Headings describe following content
- **Language Declaration**: HTML lang attribute set to "en"
- **Consistent Navigation**: Navigation structure consistent across pages
- **Error Identification**: Form errors clearly identified and described

## Compatibility

### Supported Browsers

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Supported Screen Readers

- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS, iOS)
- **TalkBack** (Android)

## Testing Methodology

This website has been tested with:

- Automated accessibility testing tools (Playwright, axe-core)
- Manual keyboard navigation testing
- Screen reader testing (VoiceOver, NVDA)
- Color contrast analysis
- Mobile device testing (iPhone SE, Android devices)
- Vision Pro spatial computing compatibility

## Release Checklist (Manual)

- Keyboard-only navigation across home + directory (visible focus, logical order)
- Screen reader spot-check (VoiceOver/NVDA): search input, filters, results count
- Reduced motion check (prefers-reduced-motion enabled)
- Color contrast spot-check (light + dark)
- Skip link + landmark regions verified

## Known Limitations

We are actively working to address any accessibility issues. If you encounter any barriers, please let us know.

## Feedback

We welcome your feedback on the accessibility of Bay Navigator. Please let us know if you encounter accessibility barriers:

- **GitHub Issues**: [https://github.com/baytides/baynavigator/issues](https://github.com/baytides/baynavigator/issues)
- **Email**: accessibility [at] baytides [dot] org

We try to respond to feedback within 5 business days.

## Technical Specifications

Bay Navigator's accessibility relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:

- HTML5
- CSS3
- JavaScript (progressive enhancement)
- ARIA (Accessible Rich Internet Applications)

These technologies are relied upon for conformance with the accessibility standards used.

## Assessment Approach

Bay Navigator assessed the accessibility of this website by the following approaches:

- Self-evaluation
- Automated testing with Playwright and accessibility tools
- Manual testing with screen readers and keyboard navigation
- User testing with people with disabilities

## Formal Complaints

If you wish to report a complaint regarding our accessibility, please contact us through the methods listed above.

## Last Updated

This accessibility statement was last reviewed on: **December 2025**

---

_This statement was created using the [W3C Accessibility Statement Generator](https://www.w3.org/WAI/planning/statements/)._
