import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // dark mode is toggled by adding .dark to <html>
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All semantic colors reference CSS variables so that light/dark
        // mode just flips the variables — no component changes needed.
        border:  'var(--color-border)',
        surface: 'var(--color-surface)',
        muted:   'var(--color-muted)',
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        card: 'var(--color-card)',
        accent: {
          green:  '#4ADE80',
          blue:   '#60A5FA',
          purple: '#A78BFA',
          orange: '#FB923C',
          pink:   '#F472B6',
        },
        heatmap: {
          empty: 'var(--color-heatmap-empty)',
          low:   '#9BE9A8',
          mid:   '#40C463',
          high:  '#30A14E',
          full:  '#216E39',
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
