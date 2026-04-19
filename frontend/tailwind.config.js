/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b8fc',
          400: '#8193f8',
          500: '#6370f1',
          600: '#4f52e6',
          700: '#4141cb',
          800: '#3636a4',
          900: '#313282',
          950: '#1e1c4c',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea670c',
        },
        dark: {
          800: '#1a1a2e',
          900: '#0f0f1a',
          950: '#07070e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        fadeIn:  'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        card:  '0 4px 24px rgba(0, 0, 0, 0.12)',
        glow:  '0 0 20px rgba(99, 112, 241, 0.4)',
      },
    },
  },
  plugins: [],
};
