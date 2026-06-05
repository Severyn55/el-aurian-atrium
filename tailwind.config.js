/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'kk-bg': '#0F0D0A',
        'kk-surface': '#1A1714',
        'kk-surface-2': '#25221E',
        'kk-text': '#F4EDE3',
        'kk-text-muted': '#A89F90',
        'kk-gold': '#C5A46E',
        'kk-gold-dark': '#A68A5F',
        'kk-border': '#3A3630',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },

      /* ============================================
         TYPOGRAPHY SCALE - Luxury Craft System (Strict)
         All sizes must come from here. No arbitrary values.
         ============================================ */
      fontSize: {
        // Display / Hero (Desktop only for largest)
        'display': ['96px', { lineHeight: '0.92', letterSpacing: '-4.5px' }],
        'display-sm': ['62px', { lineHeight: '0.92', letterSpacing: '-2.8px' }],

        // Section Headings
        'heading': ['48px', { lineHeight: '0.95', letterSpacing: '-1.5px' }],
        'heading-sm': ['40px', { lineHeight: '0.95', letterSpacing: '-1.25px' }],

        // Sub-headings / Card titles
        'subhead': ['32px', { lineHeight: '1.0', letterSpacing: '-0.5px' }],
        'subhead-sm': ['28px', { lineHeight: '1.05', letterSpacing: '-0.25px' }],

        // Mobile-constrained sizes (max ~42-44px on mobile per Craft Standards)
        'heading-mobile': ['42px', { lineHeight: '0.95', letterSpacing: '-1.2px' }],
        'subhead-mobile': ['26px', { lineHeight: '1.05', letterSpacing: '-0.3px' }],

        // UI / Small text
        'ui': ['14px', { lineHeight: '1.3', letterSpacing: '0' }],
        'ui-sm': ['12px', { lineHeight: '1.3', letterSpacing: '0.5px' }],
      },

      letterSpacing: {
        // Premium label style (uppercase small text)
        'label': '3.5px',
        'label-tight': '2.5px',

        // Button / UI text
        'button': '1.5px',
        'button-wide': '2px',
      },
    },
  },
  plugins: [],
};