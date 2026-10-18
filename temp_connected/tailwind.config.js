/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/frontend/**/*.{js,ts,jsx,tsx}",
    "./src/shared/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FBF9F5',
          warm: '#F7F4EE',
          border: '#E8E4DA',
          dark: '#111215',
          darkSurface: '#181A20',
          darkBorder: '#292C36'
        },
        lime: {
          DEFAULT: '#E2F952',
          light: '#F2FCC2',
          hover: '#D4F63D',
          dark: '#B0CE1C'
        },
        ink: {
          DEFAULT: '#111111',
          pure: '#000000',
          soft: '#242424',
          muted: '#686B74',
          faint: '#9E9EA7'
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b1120',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        volt: {
          DEFAULT: '#E2F952',
          soft: '#F2FCC2',
          deep: '#D4F63D',
        },
        paper: {
          DEFAULT: '#FBF9F5',
          deep: '#F7F4EE',
          pure: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'hard-xs': '1.5px 1.5px 0px 0px #000000',
        'hard-sm': '2.5px 2.5px 0px 0px #000000',
        'hard': '4px 4px 0px 0px #000000',
        'hard-lg': '6px 6px 0px 0px #000000',
        'hard-lime': '4px 4px 0px 0px #E2F952',
        'hard-white': '4px 4px 0px 0px #FFFFFF',
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
