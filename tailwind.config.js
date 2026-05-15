/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./features/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./layouts/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./types/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        {
            pattern: /^(bg|text|border|shadow)-(red|amber|purple|blue|cyan|emerald|slate|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
            variants: ['hover', 'dark', 'dark:hover']
        }
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // ─── BRAND PALETTE (HCMA / Ban DDCN) ─────────────────────────
                // Primary = Theme Color (được bind từ index.css variable để dễ tùy chỉnh)
                primary: {
                    50:  'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    200: 'var(--color-primary-200)',
                    300: 'var(--color-primary-300)',
                    400: 'var(--color-primary-400)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                    800: 'var(--color-primary-800)',
                    900: 'var(--color-primary-900)',
                },

                // Accent = Đỏ cờ (branding, tiêu đề tổ chức)
                accent: {
                    50:      '#fef2f2',
                    100:     '#fde3e3',
                    200:     '#f9b4b6',
                    300:     '#e85457',
                    400:     '#D42A30',
                    light:   '#D42A30',
                    DEFAULT: '#AE1E23',
                    dark:    '#8B181C',
                },

                // Gold alias (dùng cho gradient, border)
                gold: {
                    50:  '#FEFCE8',
                    100: '#FEF7CD',
                    200: '#F0D68A',
                    300: '#E4C45A',
                    400: '#D4A843',
                    500: '#D4A017',
                    600: '#B8860B',
                    700: '#996515',
                    800: '#7A5012',
                },

                // ─── SEMANTIC STATUS COLORS (giữ nguyên native Tailwind) ───
                success: {
                    50:  '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                },

                warning: {
                    50:  '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },

                danger: {
                    50:  '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },

                info: {
                    50:  '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },

                // ─── SURFACE & TEXT TOKENS (CSS Variables — theme-aware) ────────
                // Dùng bg-surface, bg-subtle, bg-muted thay hardcoded #FCF9F2
                surface: {
                    // Legacy fixed tokens (giữ backward compat)
                    primary:   '#F0ECE1',
                    secondary: '#E6E0D4',
                    tertiary:  '#DBD4C4',
                    elevated:  '#FCF9F2',
                },

                // Theme-aware background tokens — thay đổi theo theme CSS variable
                bg: {
                    app:      'var(--bg-app)',       // App background
                    surface:  'var(--bg-surface)',   // Card / Panel
                    subtle:   'var(--bg-subtle)',    // Table header, sidebar
                    muted:    'var(--bg-muted)',     // Hover, alt rows
                    elevated: 'var(--bg-elevated)',  // Modal, tooltip
                },

                // Theme-aware border tokens
                border: {
                    DEFAULT: 'var(--border-default)',
                    subtle:  'var(--border-subtle)',
                },

                // Theme-aware text tokens
                txt: {
                    primary:     'var(--text-primary)',
                    secondary:   'var(--text-secondary)',
                    muted:       'var(--text-muted)',
                    placeholder: 'var(--text-placeholder)',
                },

                content: {
                    primary:   '#1d1c1c',
                    secondary: '#313d44',
                    tertiary:  '#6b7280',
                    muted:     '#9ca3af',
                    inverse:   '#ffffff',
                },

                // ─── NEUTRAL SCALES (giữ nguyên standard Tailwind) ───────────
                gray: {
                    50:  '#f5f4f1',
                    100: '#f5f4f1',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },

                slate: {
                    50:  'var(--color-slate-50)',
                    100: 'var(--color-slate-100)',
                    200: 'var(--color-slate-200)',
                    300: 'var(--color-slate-300)',
                    400: 'var(--color-slate-400)',
                    500: 'var(--color-slate-500)',
                    600: 'var(--color-slate-600)',
                    700: 'var(--color-slate-700)',
                    800: 'var(--color-slate-800)',
                    900: 'var(--color-slate-900)',
                    950: 'var(--color-slate-950)',
                },
            },

            fontFamily: {
                sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
            },

            fontSize: {
                '2xs':  ['0.625rem', { lineHeight: '0.875rem' }],
                'xs':   ['0.75rem',  { lineHeight: '1rem' }],
                'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem',     { lineHeight: '1.5rem' }],
                'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
                'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
                '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
                '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
                '5xl':  ['3rem',     { lineHeight: '1' }],
            },

            spacing: {
                '4.5': '1.125rem',
                '13':  '3.25rem',
                '15':  '3.75rem',
                '18':  '4.5rem',
                '22':  '5.5rem',
                '26':  '6.5rem',
                '30':  '7.5rem',
            },

            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },

            boxShadow: {
                'xs':           '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'soft':         '0 2px 8px -2px rgb(0 0 0 / 0.1)',
                'glow':         '0 0 20px rgb(212 160 23 / 0.2)',
                'glow-lg':      '0 0 40px rgb(184 134 11 / 0.25)',
                'inner-sm':     'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'button':       '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'button-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'card':         '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                'card-hover':   '0 8px 20px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
                'dropdown':     '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'modal':        '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            },

            animation: {
                'fade-in':        'fadeIn 0.2s ease-out',
                'fade-in-up':     'fadeInUp 0.3s ease-out',
                'fade-in-down':   'fadeInDown 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-left':  'slideInLeft 0.3s ease-out',
                'scale-in':       'scaleIn 0.2s ease-out',
                'bounce-in':      'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
                'spin-slow':      'spin 3s linear infinite',
                'shimmer':        'shimmer 2s infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%':   { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%':   { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%':   { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%':   { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%':   { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                bounceIn: {
                    '0%':   { opacity: '0', transform: 'scale(0.3)' },
                    '50%':  { transform: 'scale(1.05)' },
                    '70%':  { transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%':      { opacity: '0.7' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
            },

            transitionTimingFunction: {
                'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            backdropBlur: {
                xs: '2px',
            },

            zIndex: {
                '60':  '60',
                '70':  '70',
                '80':  '80',
                '90':  '90',
                '100': '100',
            },
        },
    },
    plugins: [],
}
