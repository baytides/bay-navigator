/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      // BayNavigator Design System
      // Inspired by USWDS principles: accessible, professional, trustworthy
      colors: {
        // Primary - Teal (evokes Bay water, trust, professionalism)
        // WCAG 2.2 AAA compliant - 7:1 contrast ratio
        primary: {
          50: '#e0f7fa',
          100: '#b2ebf2',
          200: '#5eead4', // 7:1 on #171717 (dark bg) - AAA for dark mode text
          300: '#2dd4bf', // 8:1 on #171717 (dark bg) - AAA for dark mode text
          400: '#14b8a6', // 5:1 on #171717 (dark bg) - large text in dark mode
          500: '#00838f', // 4.54:1 on white - large text only
          600: '#006d75', // 5.9:1 on white
          700: '#005a5f', // 7.5:1 on white - AAA compliant
          800: '#004a4f', // 9.5:1 on white
          900: '#003a3d', // 12:1 on white
        },
        // Secondary - Warm gold (community, warmth, accessibility)
        secondary: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ffc107',
          600: '#c49000', // 4.5:1 on white for large text
          700: '#8a6500', // 7:1 on white - AAA compliant
          800: '#5c4300', // 10:1 on white
          900: '#3d2c00', // 13:1 on white
        },
        // Neutral - Professional grays
        // WCAG 2.2 AAA compliant - 7:1 contrast ratio
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#d4d4d4', // 7:1 on #171717 (dark bg) - AAA compliant
          400: '#949494', // 3:1 on white (AAA non-text contrast), 7:1 on #171717 (dark bg)
          500: '#5c5c5c', // 7:1 on white - AAA compliant
          600: '#4a4a4a', // 9:1 on white
          700: '#3d3d3d', // 10:1 on white
          800: '#262626', // Dark mode card background
          900: '#171717', // Dark mode page background
        },
        // Semantic colors
        success: {
          light: '#e8f5e9',
          DEFAULT: '#2e7d32',
          dark: '#1b5e20',
        },
        warning: {
          light: '#fff3e0',
          DEFAULT: '#f57c00',
          dark: '#e65100',
        },
        error: {
          light: '#ffebee',
          DEFAULT: '#c62828',
          dark: '#b71c1c',
        },
        info: {
          light: '#e3f2fd',
          DEFAULT: '#1565c0',
          dark: '#0d47a1',
        },
      },
      fontFamily: {
        // System font stack for performance and native feel
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Readable serif for long-form content
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
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
