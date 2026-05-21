/**
 * useMediaQuery — SSR-safe responsive breakpoint hook
 *
 * Uses window.matchMedia API with proper cleanup.
 * Falls back to `false` during SSR or when matchMedia is unavailable.
 *
 * @example
 * const isMobile = useIsMobile();
 * const isWide = useMediaQuery('(min-width: 1280px)');
 */
import { useState, useEffect } from 'react';

// ─── Core Hook ─────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        // SSR-safe: check if window exists
        if (typeof window === 'undefined') return false;
        if (typeof window.matchMedia !== 'function') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (typeof window.matchMedia !== 'function') return;

        const mediaQueryList = window.matchMedia(query);

        // Set initial value (may differ from SSR)
        setMatches(mediaQueryList.matches);

        // Modern API: addEventListener (Safari 14+, Chrome 56+)
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQueryList.addEventListener('change', handler);
        return () => mediaQueryList.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// ─── Breakpoints ───────────────────────────────────────
const BREAKPOINTS = {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)',
} as const;

// ─── Convenience Hooks ─────────────────────────────────

/** Returns true when viewport width < 768px */
export function useIsMobile(): boolean {
    return useMediaQuery(BREAKPOINTS.mobile);
}

/** Returns true when viewport width is 768px–1024px */
export function useIsTablet(): boolean {
    return useMediaQuery(BREAKPOINTS.tablet);
}

/** Returns true when viewport width > 1024px */
export function useIsDesktop(): boolean {
    return useMediaQuery(BREAKPOINTS.desktop);
}

export default useMediaQuery;
