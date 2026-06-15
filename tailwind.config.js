/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  darkMode: ['selector', ':root.dark'],
  theme: {
    extend: {
      colors: {
        // ── Mapeados a variables CSS del tema ──────────────────────
        // Todos usan var() para que el tema ciruela/índigo funcione
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          muted:   'var(--color-primary-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          muted:   'var(--color-accent-muted)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          muted:   'var(--color-danger-muted)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          muted:   'var(--color-warning-muted)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          muted:   'var(--color-info-muted)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          2:       'var(--color-surface-2)',
        },
        // sidebar propio (oscuro independiente del tema)
        rail: '#0f0f12',
        border: {
          DEFAULT: 'var(--color-border)',
          2:       'var(--color-border-2)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          2:       'var(--color-text-2)',
          3:       'var(--color-text-3)',
          inverse: 'var(--color-text-inverse)',
        },
        'app-bg': 'var(--color-bg)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px', md: '6px', lg: '8px', xl: '12px', '2xl': '16px',
      },
      boxShadow: {
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        glow: '0 0 20px rgba(129,140,248,0.18)',
      },
    },
  },
  plugins: [],
};
