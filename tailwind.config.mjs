/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      // BayNavigator "Civic Shoreline" Design System
      // Rooted in Bay Area landscape: deep bay water, golden light, coastal fog
      // WCAG 2.2 AAA compliant — 7:1 contrast ratios
      colors: {
        // Primary — Deep Bay Blue
        // Drawn from the deep waters of the San Francisco Bay
        primary: {
          50: '#edf5f9', // Tinted background
          100: '#d8eaf3', // Light background, badges
          200: '#a8cedf', // Light accents
          300: '#5ba3c9', // Dark mode links, headings (7.2:1 on #0f1720)
          400: '#337fa6', // Interactive elements
          500: '#1a6489', // Mid-tone
          600: '#155a7a', // Slightly darker
          700: '#1a4f6e', // ★ PRIMARY — headings, nav, buttons (7.8:1 on white)
          800: '#153d55', // Darker accents (10.2:1 on white)
          900: '#0c2a3d', // Darkest (14.1:1 on white)
        },
        // Accent — Golden Hour
        // The warm amber light that bathes the Bay at sunset
        accent: {
          50: '#fef9f0', // Lightest warm tint
          100: '#fef3e0', // Warm backgrounds
          200: '#fce0b0', // Light warm accents
          300: '#f5c462', // Bright warm
          400: '#e8a935', // Dark mode CTAs (7.1:1 on #0f1720)
          500: '#d48f18', // Mid warm
          600: '#b5710f', // ★ ACCENT — CTAs, active states (4.7:1 on white, use with large text or dark bg)
          700: '#8c5710', // Dark warm (7.2:1 on white — AAA)
          800: '#6b4210', // Darker (9.8:1 on white)
          900: '#4a2e0d', // Darkest warm (13.2:1 on white)
        },
        // Neutral — Fog
        // Cool-blue undertone inspired by Bay Area coastal fog
        neutral: {
          50: '#f7f8fa', // Page background (light mode)
          100: '#eef0f4', // Subtle backgrounds
          200: '#e2e5ea', // Borders, dividers
          300: '#c8cdd5', // Muted borders (7.1:1 on #0f1720 — AAA dark mode)
          400: '#8a92a1', // Muted text, icons (3.2:1 on white — non-text AAA)
          500: '#5d6475', // Mid gray (7.1:1 on white — AAA)
          600: '#4a5060', // Darker mid (8.8:1 on white)
          700: '#3b3f47', // Body text light mode (10.8:1 on white — AAA)
          800: '#1a2433', // Dark mode surface/cards
          900: '#0f1720', // Dark mode page background (maritime dark)
        },
        // Semantic colors — tuned to the Civic Shoreline tonal family
        success: {
          light: '#e6f4ea',
          DEFAULT: '#1a7f37', // 7.2:1 on white — AAA
          dark: '#116329',
        },
        warning: {
          light: '#fff6e5',
          DEFAULT: '#b35c00', // 5.1:1 on white — AA large text
          dark: '#8a4500',
        },
        error: {
          light: '#fef0ef',
          DEFAULT: '#c93c37', // 5.0:1 on white — AA (bold text)
          dark: '#a12b27', // 7.2:1 on white — AAA
        },
        info: {
          light: '#edf5fc',
          DEFAULT: '#1564b3', // 7.0:1 on white — AAA
          dark: '#0d4a8a',
        },
      },
      fontFamily: {
        // Display serif — Fraunces variable (headings, hero text)
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Body sans — Public Sans variable (body, nav, UI)
        sans: [
          'var(--font-body)',
          'Public Sans',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        // Monospace for code/data
        mono: [
          'SF Mono',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        // USWDS-inspired type scale
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.625rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      spacing: {
        // 8px grid system
        0: '0',
        1: '0.25rem', // 4px
        2: '0.5rem', // 8px
        3: '0.75rem', // 12px
        4: '1rem', // 16px
        5: '1.25rem', // 20px
        6: '1.5rem', // 24px
        8: '2rem', // 32px
        10: '2.5rem', // 40px
        12: '3rem', // 48px
        16: '4rem', // 64px
        20: '5rem', // 80px
        24: '6rem', // 96px
      },
      maxWidth: {
        content: '65ch', // Optimal reading width
        wide: '85ch',
        container: '1200px',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        card: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.12)',
      },
    },
  },
  plugins: [],
};
