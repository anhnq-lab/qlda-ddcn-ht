/**
 * useTabSearchParam — Sync tab state ↔ URL search param `?tab=`
 *
 * Ensures the active tab persists across page reloads by storing it
 * in the URL search params instead of component state alone.
 *
 * Uses window.history.replaceState directly (not react-router setSearchParams)
 * to avoid conflicts with SlidePanelContext URL tracking.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * @param defaultTab – fallback when no `?tab=` in URL
 * @param validTabs  – whitelist of allowed tab values
 * @param paramName  – URL param name (default: 'tab')
 * @returns [activeTab, setActiveTab] — drop-in replacement for useState
 */
export function useTabSearchParam<T extends string>(
    defaultTab: T,
    validTabs: readonly T[],
    paramName = 'tab',
): [T, (tab: T) => void] {

    // Read initial value from URL, fall back to default
    const getTabFromUrl = useCallback((): T => {
        const params = new URLSearchParams(window.location.search);
        const val = params.get(paramName) as T | null;
        return val && validTabs.includes(val) ? val : defaultTab;
    }, [paramName, validTabs, defaultTab]);

    const [activeTab, setActiveTabState] = useState<T>(getTabFromUrl);
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    // Listen for popstate (browser back/forward) to sync
    useEffect(() => {
        const handlePopState = () => {
            const current = getTabFromUrl();
            if (current !== activeTabRef.current) {
                setActiveTabState(current);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [getTabFromUrl]);

    // Update both state and URL — uses replaceState to preserve all other params
    const setActiveTab = useCallback(
        (tab: T) => {
            setActiveTabState(tab);
            const url = new URL(window.location.href);
            if (tab === defaultTab) {
                url.searchParams.delete(paramName); // clean URL when on default tab
            } else {
                url.searchParams.set(paramName, tab);
            }
            window.history.replaceState(null, '', url.pathname + url.search);
        },
        [defaultTab, paramName],
    );

    return [activeTab, setActiveTab];
}
