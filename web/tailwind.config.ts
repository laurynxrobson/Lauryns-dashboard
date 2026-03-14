import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#E5E5E5',
        surface: '#FFFFFF',
        muted: '#F7F7F7',
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
        },
        accent: {
          green: '#4ADE80',
          blue: '#60A5FA',
          purple: '#A78BFA',
          orange: '#FB923C',
          pink: '#F472B6',
        },
        heatmap: {
          empty: '#EBEDF0',
          low: '#9BE9A8',
          mid: '#40C463',
          high: '#30A14E',
          full: '#216E39',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
