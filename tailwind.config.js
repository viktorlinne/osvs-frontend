/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from 'tailwindcss-animate'

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
        // shadcn/ui semantic colors, backed by CSS variables in
        // src/styles/index.css (same values as the scales below).
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // NOTE: shadcn's `card` color is deliberately omitted: a `card` color
        // key would make `shadow-card` also match boxShadowColor and turn the
        // existing card shadow transparent-white. Use bg-white / ui-card.
        // Existing project scales + shadcn DEFAULT/foreground.
        // primary-600 is the exact logo green (public/osvs.png, #00a460,
        // hsl 155.1 100% 32.2%). 700/800 (hover/active) lower the lightness
        // on the same hue; 50-200 keep the old tints' S/L on the logo hue.
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eef7f3',
          100: '#d3eee3',
          200: '#a8dbc6',
          600: '#00a460',
          700: '#008a51',
          800: '#006f41',
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
        // shadcn radius keys. With --radius: 0.5rem these equal Tailwind's
        // defaults (lg 0.5rem, md 6px), so existing rounded-* are unchanged.
        // `sm` is intentionally NOT overridden (shadcn's would be 4px vs 2px).
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

