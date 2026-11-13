/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary: deep espresso brown (#3B2418 at 900)
        brand: {
          50: '#faf5f0',
          100: '#f2e8da',
          200: '#e6d6c3',
          300: '#d5bda3',
          400: '#bd9a7c',
          500: '#9c7354',
          600: '#7d5539',
          700: '#5f3f2b',
          800: '#4a3022',
          900: '#3b2418',
          950: '#24140c',
        },
        // Accent: soft sky blue (#8EC5FF at 300)
        accent: {
          50: '#f1f8ff',
          100: '#e3f2ff',
          200: '#c6e5ff',
          300: '#8ec5ff',
          400: '#66aef2',
          500: '#3f8ed8',
          600: '#2f72b4',
          700: '#275a8d',
          800: '#234b74',
          900: '#1f3f60',
          950: '#132639',
        },
        // Warm neutrals with cream (#F2E8DA) as the page background
        ink: {
          50: '#f2e8da',
          100: '#eadfce',
          200: '#dccdb8',
          300: '#c6b49c',
          400: '#9c8369',
          500: '#7a634f',
          600: '#6b5138',
          700: '#563f2e',
          800: '#422f22',
          900: '#2e2017',
          950: '#1a120c',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(59, 36, 24, 0.18)',
        lift: '0 20px 45px -20px rgba(59, 36, 24, 0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pop-in': 'pop-in 0.2s ease-out both',
        'slide-in': 'slide-in 0.3s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
