/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '72rem',
      },
    },
    fontFamily: {
      sans: ['"EB Garamond"', 'Georgia', 'serif'],
    },
    extend: {
      colors: {
        primary: {
          50: '#eef7f1',
          100: '#d3eedd',
          200: '#a8dbb8',
          600: '#208f44',
          700: '#15803d',
          800: '#166534',
        },
        neutral: {
          50: '#faf8f4',
          100: '#f2ede6',
          200: '#e3dcd2',
          300: '#c2b5ab',
          400: '#9b8e84',
          500: '#796d63',
          600: '#5c5248',
          700: '#3c3028',
          900: '#1c1610',
        },
        success: {
          50: '#f0fdf4',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(28, 22, 16, 0.07), 0 1px 2px rgba(28, 22, 16, 0.04)',
        'card-hover': '0 8px 24px rgba(28, 22, 16, 0.12), 0 2px 8px rgba(28, 22, 16, 0.06)',
      },
      borderRadius: {
        card: '0.5rem',
      },
    },
  },
  plugins: [],
}

