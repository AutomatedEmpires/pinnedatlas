import type { Config } from 'tailwindcss';

// "Frontier Field Guide" design system — cinematic dark cartography with
// editorial warmth. Display serif (Fraunces) + clean sans (Inter), layered
// warm-neutral surfaces, an emerald primary with a topaz highlight, and a small
// set of tasteful, reduced-motion-aware animations.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0b0a09', // near-black, faintly warm
          raised: '#17150f', // cards
          overlay: '#211d16', // popovers / floating
          hover: '#2a251c',
        },
        accent: {
          DEFAULT: '#34d399', // emerald-400 — primary
          strong: '#10b981', // emerald-500
          soft: '#064e3b', // emerald-900 wash
          faint: '#052e26',
        },
        topaz: {
          DEFAULT: '#f5b544', // warm highlight — editor's pick, sun, premium
          soft: '#3a2c10',
        },
      },
      maxWidth: {
        shell: '28rem',
        content: '64rem',
        wide: '80rem',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 30px -18px rgba(0,0,0,0.7)',
        float: '0 20px 50px -20px rgba(0,0,0,0.8)',
        glow: '0 0 44px -12px rgba(52,211,153,0.4)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
