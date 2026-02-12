# WCAG 2.2 AAA Style Guide

Bay Navigator follows WCAG 2.2 Level AA with many AAA enhancements. This guide documents the color palette, typography, and component standards that meet or exceed AAA requirements.

## Color Contrast Requirements

WCAG AAA requires:

- **Normal text**: 7:1 contrast ratio minimum
- **Large text** (18pt+ or 14pt+ bold): 4.5:1 contrast ratio minimum
- **UI components and graphical objects**: 3:1 contrast ratio minimum

## Approved Color Palette

### Light Mode (White Background #FFFFFF)

| Color           | Hex       | Use Case                      | Contrast on White |
| --------------- | --------- | ----------------------------- | ----------------- |
| **Primary 700** | `#005a5f` | Primary text, links, buttons  | 7.5:1             |
| **Primary 800** | `#004346` | Hover states, emphasized text | 9.5:1             |
| **Primary 900** | `#002c2e` | Strong emphasis               | 12.5:1            |
| **Neutral 900** | `#111827` | Body text, headings           | 16:1              |
| **Neutral 700** | `#374151` | Secondary text                | 9.1:1             |
| **Neutral 600** | `#4b5563` | Tertiary text, captions       | 7.0:1             |
| **Green 800**   | `#166534` | Success states                | 7.1:1             |
| **Red 800**     | `#991b1b` | Error states                  | 7.1:1             |
| **Purple 900**  | `#581c87` | Accent (e.g., Tor link)       | 10.7:1            |

### Dark Mode (Neutral 900 Background #111827)

| Color           | Hex       | Use Case                 | Contrast on Dark |
| --------------- | --------- | ------------------------ | ---------------- |
| **White**       | `#FFFFFF` | Headings, important text | 16:1             |
| **Neutral 100** | `#f3f4f6` | Body text                | 13.8:1           |
| **Neutral 300** | `#d1d5db` | Secondary text           | 9.7:1            |
| **Primary 200** | `#99f6e4` | Links                    | 13.1:1           |
| **Primary 300** | `#5eead4` | Link hover               | 10.5:1           |
| **Green 400**   | `#4ade80` | Success states           | 8.3:1            |
| **Red 400**     | `#f87171` | Error states             | 5.5:1            |
| **Purple 300**  | `#c4b5fd` | Accent (e.g., Tor link)  | 8.9:1            |

### Colors to AVOID (Don't meet AAA)

These colors fail AAA contrast on their respective backgrounds:

**On white (#FFFFFF):**

- `text-purple-600` (#9333ea) - 4.5:1 (fails AAA)
- `text-purple-500` (#a855f7) - 3.5:1 (fails AAA)
- `text-yellow-600` (#ca8a04) - 3.1:1 (fails AAA)
- `text-neutral-500` (#6b7280) - 4.6:1 (fails AAA)
- `text-neutral-400` (#9ca3af) - 3.0:1 (fails AAA)

**On dark (#111827):**

- `text-purple-400` (#a78bfa) - 5.0:1 (fails AAA)
- `text-neutral-400` (#9ca3af) - 3.9:1 (fails AAA)

## Typography

### Font Sizes

All font sizes support user customization via CSS custom properties:

```css
:root {
  --text-size-scale: 1; /* User can adjust 0.8 to 1.5 */
}

main {
  font-size: calc(1rem * var(--text-size-scale));
}
main h1 {
  font-size: calc(2.25rem * var(--text-size-scale));
}
main h2 {
  font-size: calc(1.875rem * var(--text-size-scale));
}
main h3 {
  font-size: calc(1.5rem * var(--text-size-scale));
}
```

### Line Height

Default line height is 1.6 (WCAG recommends 1.5 minimum). Users can adjust:

- Normal: 1.6
- Wide: 2.0
- Extra Wide: 2.5

### Letter & Word Spacing

Users can adjust spacing for readability:

- Letter spacing: 0em, 0.05em, 0.1em
- Word spacing: 0em, 0.1em, 0.2em

## Buttons & Interactive Elements

### Minimum Target Size (WCAG 2.5.5)

All interactive elements must have a minimum touch target of 44x44 CSS pixels:

```css
.btn {
  min-height: 44px;
  padding: 0.75rem 1.25rem;
}

button:not(.btn) {
  min-height: 44px;
  min-width: 44px;
}
```

### Focus Indicators (WCAG 2.4.12, 2.4.13)

Focus must be clearly visible with a minimum 2px outline:

```css
:focus-visible {
  outline: 2px solid #005a5f;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 90, 95, 0.3);
}
```

## Links

Links must have:

1. Sufficient color contrast (7:1 for AAA)
2. Underline decoration (not relying on color alone)
3. Clear hover/focus states

```html
<!-- Correct -->
<a href="/about" class="text-primary-700 underline hover:text-primary-900"> About us </a>

<!-- Incorrect (no underline, relies on color alone) -->
<a href="/about" class="text-primary-700">About us</a>
```

## Abbreviations (WCAG 3.1.4)

All abbreviations must have expanded forms:

```html
<!-- Using <abbr> tag -->
<abbr title="Supplemental Nutrition Assistance Program">SNAP</abbr>

<!-- Using Abbr component -->
<abbr term="SNAP" />
```

Style abbreviations with a dotted underline:

```css
abbr[title] {
  border-bottom: 1px dotted currentColor;
  text-decoration: none;
  cursor: help;
}
```

## Simple Language (WCAG 3.1.5)

Content should be written at an 8th grade reading level or simpler alternatives provided.

### Manual Dual-Content

```html
<span class="text-normal">Supplemental Nutrition Assistance Program</span>
<span class="text-simple">Food help program</span>
```

### Automated Simplification

The site loads `/data/simple-language.json` which contains word mappings. When Simple Language mode is enabled, complex words are automatically replaced.

## Dark Mode Support

All colors must work in both light and dark modes:

```html
<p class="text-neutral-900 dark:text-white">Heading</p>
<p class="text-neutral-600 dark:text-neutral-300">Body text</p>
<a class="text-primary-700 dark:text-primary-200">Link</a>
```

## Badge Colors by Category

Each category has approved AAA-compliant badge colors:

| Category  | Light Mode                      | Dark Mode |
| --------- | ------------------------------- | --------- |
| Food      | `bg-green-100 text-green-900`   | Same      |
| Health    | `bg-red-100 text-red-900`       | Same      |
| Housing   | `bg-blue-100 text-blue-900`     | Same      |
| Utilities | `bg-yellow-100 text-yellow-900` | Same      |
| Transit   | `bg-purple-100 text-purple-900` | Same      |
| Education | `bg-indigo-100 text-indigo-900` | Same      |

## Images

All images must have alt text:

```html
<!-- Decorative (hidden from screen readers) -->
<img src="decorative.svg" alt="" aria-hidden="true" />

<!-- Informative -->
<img src="logo.png" alt="Bay Navigator logo" />

<!-- Complex (with longer description) -->
<img src="chart.png" alt="Chart showing..." aria-describedby="chart-desc" />
<p id="chart-desc" class="sr-only">Detailed description...</p>
```

## Forms

### Labels

All form inputs must have associated labels:

```html
<label for="email">Email address</label> <input type="email" id="email" name="email" />
```

### Error Messages

Error messages must be:

1. Associated with the input via `aria-describedby`
2. Announced to screen readers
3. Visible with sufficient contrast

```html
<input type="email" id="email" aria-describedby="email-error" aria-invalid="true" />
<p id="email-error" class="text-red-800 dark:text-red-400">Please enter a valid email address</p>
```

## Motion & Animation

Respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing Checklist

Before committing changes, verify:

- [ ] Color contrast meets 7:1 ratio (use browser DevTools or axe)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (2px minimum)
- [ ] Touch targets are at least 44x44px
- [ ] Images have appropriate alt text
- [ ] Abbreviations have title attributes
- [ ] Headings follow proper hierarchy (h1 → h2 → h3)
- [ ] Links have underlines (not relying on color alone)
- [ ] Form inputs have labels
- [ ] Error messages are associated with inputs
- [ ] Content works with 200% zoom
- [ ] Animations respect reduced motion preference

## Tools

- **Playwright + axe-core**: Automated accessibility testing (`npm test`)
- **axe DevTools**: Browser extension for manual testing
- **Colour Contrast Analyser**: Desktop app for checking contrast
- **WAVE**: Web accessibility evaluation tool
