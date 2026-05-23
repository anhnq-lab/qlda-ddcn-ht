import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Theme system — 3 chế độ:
 *  - 'nature'  → Bảo vệ mắt (nền cát ấm #FCF9F2)
 *  - 'light'   → Sáng (nền trắng thuần #ffffff)
 *  - 'dark'    → Tối (Navy slate)
 *
 * Architecture: Dùng CSS custom properties trên :root thay vì
 * MutationObserver patching → hiệu năng tốt hơn, không lag DOM
 */
export type Theme = 'light' | 'nature' | 'dark';
type DataDensity = 'compact' | 'comfortable';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    density: DataDensity;
    setDensity: (density: DataDensity) => void;
    stickyHeader: boolean;
    setStickyHeader: (val: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
    theme: 'nature',
    setTheme: () => { },
    density: 'comfortable',
    setDensity: () => { },
    stickyHeader: false,
    setStickyHeader: () => { },
});

export const useTheme = () => useContext(ThemeContext);

// ============================================================
// THEME TOKENS — CSS custom properties per theme
// ============================================================
const THEME_TOKENS: Record<Theme, Record<string, string>> = {
    nature: {
        // Backgrounds
        '--bg-app':       '#F0ECE1',   // App background
        '--bg-surface':   '#FCF9F2',   // Card / Panel surface
        '--bg-subtle':    '#F5EFE6',   // Subtle tint (table header, sidebar)
        '--bg-muted':     '#EDE8DF',   // Muted (hover, alt rows)
        '--bg-elevated':  '#FDFAF4',   // Elevated modal / tooltip
        // Borders
        '--border-default': '#ece7de',
        '--border-subtle':  '#e5dfd4',
        // Text
        '--text-primary':   '#1d1c1c',
        '--text-secondary': '#4a3426',
        '--text-muted':     '#78716c',
        '--text-placeholder': '#a8a29e',
        // Inputs
        '--input-bg':       '#FCF9F2',
        '--input-border':   '#d6cfc4',
    },
    light: {
        // Backgrounds
        '--bg-app':       '#f1f5f9',   // App background (slate-100)
        '--bg-surface':   '#ffffff',   // Card / Panel surface
        '--bg-subtle':    '#f8fafc',   // Subtle tint (slate-50)
        '--bg-muted':     '#f1f5f9',   // Muted (slate-100)
        '--bg-elevated':  '#ffffff',   // Elevated
        // Borders
        '--border-default': '#e2e8f0',
        '--border-subtle':  '#f1f5f9',
        // Text
        '--text-primary':   '#0f172a',
        '--text-secondary': '#334155',
        '--text-muted':     '#64748b',
        '--text-placeholder': '#94a3b8',
        // Inputs
        '--input-bg':       '#ffffff',
        '--input-border':   '#e2e8f0',
    },
    dark: {
        // Backgrounds
        '--bg-app':       '#0f1117',   // App background (deep navy)
        '--bg-surface':   '#1f2332',   // Card / Panel surface
        '--bg-subtle':    '#1a1e2e',   // Subtle tint
        '--bg-muted':     '#252a3b',   // Muted
        '--bg-elevated':  '#252a3b',   // Elevated modal
        // Borders
        '--border-default': '#222533',
        '--border-subtle':  '#191b26',
        // Text
        '--text-primary':   '#f8fafc',
        '--text-secondary': '#e2e8f0',
        '--text-muted':     '#94a3b8',
        '--text-placeholder': '#64748b',
        // Inputs
        '--input-bg':       '#1a1e2e',
        '--input-border':   '#262b3b',
    },
};

// ============================================================
// DATA DENSITY — CSS variables cho table row height, padding
// ============================================================
const DENSITY_TOKENS: Record<DataDensity, Record<string, string>> = {
    comfortable: {
        '--density-row-h':     '3rem',       // table row height
        '--density-cell-py':   '0.75rem',    // table cell vertical padding
        '--density-cell-px':   '1rem',       // table cell horizontal padding
        '--density-card-p':    '1.5rem',     // card padding (p-6)
        '--density-form-gap':  '1.25rem',    // form field gap
        '--density-section-gap': '2rem',     // section gap
    },
    compact: {
        '--density-row-h':     '2.25rem',
        '--density-cell-py':   '0.375rem',
        '--density-cell-px':   '0.75rem',
        '--density-card-p':    '1rem',
        '--density-form-gap':  '0.75rem',
        '--density-section-gap': '1.25rem',
    },
};

function applyDensity(density: DataDensity) {
    const root = document.documentElement;
    const tokens = DENSITY_TOKENS[density];
    Object.entries(tokens).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
    root.dataset.density = density;
}

// ============================================================
// applyTheme — Inject CSS variables vào :root
// ============================================================
function applyTheme(theme: Theme) {
    const root = document.documentElement;

    // 1. Xoá các theme class cũ
    root.classList.remove('dark', 'theme-light', 'theme-nature');

    // 2. Đặt class mới
    if (theme === 'dark') {
        root.classList.add('dark');
    } else if (theme === 'light') {
        root.classList.add('theme-light');
    } else {
        root.classList.add('theme-nature');
    }

    // 3. Inject CSS variables (dùng bởi các component dùng var(--bg-surface))
    const tokens = THEME_TOKENS[theme];
    Object.entries(tokens).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

// ============================================================
// ThemeProvider
// ============================================================
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light' || saved === 'nature') return saved as Theme;
        return 'nature';
    });

    const [density, setDensityState] = useState<DataDensity>(() => {
        const saved = localStorage.getItem('data_density');
        return (saved === 'compact' ? 'compact' : 'comfortable') as DataDensity;
    });

    const [stickyHeader, setStickyHeaderState] = useState<boolean>(() => {
        const saved = localStorage.getItem('sticky_header');
        return saved === 'true';
    });

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Apply density on mount (initial value from localStorage)
    useEffect(() => {
        applyDensity(density);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem('data_density', density);
        applyDensity(density);
    }, [density]);

    useEffect(() => {
        localStorage.setItem('sticky_header', String(stickyHeader));
    }, [stickyHeader]);

    const setTheme = (newTheme: Theme) => setThemeState(newTheme);
    const setDensity = (newDensity: DataDensity) => setDensityState(newDensity);
    const setStickyHeader = (newVal: boolean) => setStickyHeaderState(newVal);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, density, setDensity, stickyHeader, setStickyHeader }}>
            {children}
        </ThemeContext.Provider>
    );
};
