/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#0B0E14',
          800: '#121824',
          700: '#1A2332',
          600: '#243044',
          500: '#334155',
        },
        trade: {
          green: '#10B981',
          red: '#EF4444',
          blue: '#3B82F6',
          yellow: '#F59E0B',
          purple: '#8B5CF6',
        },
        border: {
          dark: '#1E293B',
          light: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
