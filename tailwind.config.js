/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        panel: token('panel'),
        raised: token('raised'),
        hover: token('hover'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        accent: token('accent'),
        'accent-solid': token('accent-solid'),
        'accent-fg': token('accent-fg'),
        danger: token('danger'),
        'danger-solid': token('danger-solid'),
        warn: token('warn'),
        ok: token('ok'),
        emphasis: token('emphasis'),
        glyph: token('glyph'),
        slot: token('slot')
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px']
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable Text', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        pop: '0 8px 24px -4px rgb(0 0 0 / 0.35), 0 0 0 1px rgb(var(--c-line) / 1)'
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } }
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'pop-in': 'pop-in 120ms ease-out',
        'slide-up': 'slide-up 160ms ease-out'
      }
    }
  },
  plugins: []
}
