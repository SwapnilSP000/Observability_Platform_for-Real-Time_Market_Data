/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Page scaffolding ──────────────────────────────────────
        page:    '#F0F2F5',   // very light blue-gray page background
        surface: '#FFFFFF',   // card/panel backgrounds
        'surface-raised': '#FAFBFC', // slightly off-white for nested panels
        divider: '#E4E8EE',   // subtle dividers
        border:  '#D1D9E0',   // standard borders

        // ── Typography ───────────────────────────────────────────
        ink:     '#0A0F1E',   // deep black headings
        'ink-2': '#1A2A3A',   // dark secondary text
        'ink-3': '#374151',   // medium-dark captions (was too light #6B7E94)
        'ink-4': '#6B7280',   // muted placeholder (was too light)

        // ── Brand blue ──────────────────────────────────────────
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1D4ED8',  // deep blue (was too light #0073E6)
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#1E3070',
          900: '#172554',
        },

        // ── Status / semantic ────────────────────────────────────
        // green
        ok: {
          DEFAULT: '#065F2C',  // dark green
          light:   '#D1FAE5',  // visible light bg
          mid:     '#6EE7B7',  // border
          text:    '#065F2C',  // dark readable text
          dark:    '#044020',
        },
        // amber / warning
        warn: {
          DEFAULT: '#92400E',  // dark amber
          light:   '#FEF3C7',
          mid:     '#FCD34D',
          text:    '#78350F',  // very dark amber text
          dark:    '#5C2D07',
        },
        // red
        crit: {
          DEFAULT: '#991B1B',  // dark red
          light:   '#FEE2E2',
          mid:     '#FCA5A5',
          text:    '#7F1D1D',  // very dark red text
          dark:    '#6B1212',
        },
        // purple
        violet: {
          DEFAULT: '#4C1D95',  // dark violet
          light:   '#EDE9FE',
          mid:     '#A78BFA',
          text:    '#3B0764',
        },
        // cyan / teal
        teal: {
          DEFAULT: '#134E4A',  // dark teal
          light:   '#CCFBF1',
          mid:     '#5EEAD4',
          text:    '#0F3D3A',
        },
        // orange / peach
        coral: {
          DEFAULT: '#9A3412',  // dark coral
          light:   '#FFEDD5',
          mid:     '#FED7AA',
          text:    '#7C2D12',
        },
        // bright lime
        lime: {
          DEFAULT: '#166534',  // dark lime/green
          light:   '#DCFCE7',
          mid:     '#86EFAC',
          text:    '#14532D',
        },
        // magenta / pink
        fuchsia: {
          DEFAULT: '#86198F',  // dark fuchsia
          light:   '#FAE8FF',
          mid:     '#E879F9',
          text:    '#701A75',
        },
        // sky
        sky: {
          DEFAULT: '#075985',  // dark sky
          light:   '#E0F2FE',
          mid:     '#7DD3FC',
          text:    '#0C4A6E',
        },

        // ── Financial ─────────────────────────────────────────────
        bull: '#065F2C',  // dark green
        bear: '#991B1B',  // dark red
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.25rem' }],
      },

      borderRadius: {
        'xs': '3px',
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },

      boxShadow: {
        'card':   '0 1px 3px 0 rgba(10,22,40,0.08), 0 0 0 1px rgba(10,22,40,0.04)',
        'card-hover': '0 4px 16px 0 rgba(10,22,40,0.12), 0 0 0 1px rgba(10,22,40,0.06)',
        'panel':  '0 2px 8px 0 rgba(10,22,40,0.10)',
        'ring':   '0 0 0 3px rgba(0,115,230,0.25)',
        'ring-ok':   '0 0 0 3px rgba(13,138,78,0.25)',
        'ring-crit': '0 0 0 3px rgba(217,48,37,0.25)',
      },

      backgroundImage: {
        'gradient-blue':    'linear-gradient(135deg, #0073E6 0%, #0058B8 100%)',
        'gradient-green':   'linear-gradient(135deg, #0D8A4E 0%, #096B3C 100%)',
        'gradient-red':     'linear-gradient(135deg, #D93025 0%, #B02418 100%)',
        'gradient-violet':  'linear-gradient(135deg, #6B2FF2 0%, #5A27CC 100%)',
        'gradient-teal':    'linear-gradient(135deg, #007B8A 0%, #006270 100%)',
        'gradient-coral':   'linear-gradient(135deg, #E85D26 0%, #C44A18 100%)',
        'gradient-amber':   'linear-gradient(135deg, #C97500 0%, #8F5000 100%)',
        'gradient-page':    'linear-gradient(160deg, #EEF2FF 0%, #F0F2F5 60%, #F5F7FA 100%)',
      },

      keyframes: {
        pulse2:    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        flashGreen:{ '0%': { background: '#B3E6CB' }, '100%': { background: 'transparent' } },
        flashRed:  { '0%': { background: '#F5A8A4' }, '100%': { background: 'transparent' } },
      },
      animation: {
        pulse2:     'pulse2 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.2s ease-out',
        'flash-up': 'flashGreen 0.6s ease-out forwards',
        'flash-dn': 'flashRed 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
