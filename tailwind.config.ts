import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0c0a09', // stone-950
          raised: '#1c1917', // stone-900
          overlay: '#292524', // stone-800
        },
        accent: {
          DEFAULT: '#34d399', // emerald-400
          strong: '#10b981', // emerald-500
          soft: '#065f46', // emerald-800
        },
      },
      maxWidth: {
        shell: '28rem',
      },
    },
  },
  plugins: [],
};

export default config;
