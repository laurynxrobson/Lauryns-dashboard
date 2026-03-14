/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: '#E5E5E5',
        surface: '#FFFFFF',
        muted: '#F7F7F7',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
      },
    },
  },
  plugins: [],
}
