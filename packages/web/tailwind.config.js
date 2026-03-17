/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0EA5E9',
        hotspring: '#FF6B6B',
        cave: '#7C3AED',
        waterfall: '#0EA5E9',
      },
    },
  },
  plugins: [],
}
