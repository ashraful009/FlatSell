/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary — retuned from indigo to a blue light-theme scale
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea670c',
        },
        // "dark" scale repurposed as light surface tokens so every existing
        // bg-dark-* / *-dark-900 reference flips to the light theme at once.
        dark: {
          800: '#ffffff', // elevated surface / cards
          900: '#f8fafc', // app background (slate-50)
          950: '#eef2f7', // deepest panel
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
        glass: '0 8px 32px 0 rgba(37, 99, 235, 0.08)',
        card:  '0 4px 24px rgba(15, 23, 42, 0.06)',
        glow:  '0 0 20px rgba(37, 99, 235, 0.25)',
      },
    },
  },
  plugins: [],
};
