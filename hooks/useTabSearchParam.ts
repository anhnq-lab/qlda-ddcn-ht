/**
 * useTabSearchParam — Sync tab state ↔ URL search param + sessionStorage
 *
 * Priority on read: URL param → sessionStorage → default
 * On write: updates both URL and sessionStorage.
 *
 * This ensures the active tab persists across:
 *  - Page reloads (URL param)
 *  - Navigate away → sidebar → come back (sessionStorage)
 *
 * Uses window.history.replaceState (not react-router setSearchParams)
 * to avoid conflicts with SlidePanelContext URL tracking.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * @param defaultTab – fallback when no param in URL or storage
 * @param validTabs  – whitelist of allowed tab values
 * @param paramName  – URL param name (default: 'tab')
 * @returns [activeTab, setActiveTab] — drop-in replacement for useState
 */
export function useTabSearchParam<T extends string>(
    defaultTab: T,
    validTabs: readonly T[],
    paramName = 'tab',
): [T, (tab: T) => void] {

    // sessionStorage key: scoped by pathname + paramName
    // pathname is fixed for the lifetime of this component instance
    const storageKey = `tab_${window.location.pathname}_${paramName}`;

    const getInitialTab = (): T => {
        // 1. Try URL param first (reload case)
        const params = new URLSearchParams(window.location.search);
        const urlVal = params.get(paramName) as T | null;
        if (urlVal && (validTabs as readonly string[]).includes(urlVal)) return urlVal;

        // 2. Try sessionStorage (navigate-away-and-back case)
        try {
            const stored = sessionStorage.getItem(storageKey) as T | null;
            if (stored && (validTabs as readonly string[]).includes(stored)) return stored;
        } catch { /* ignore */ }

        // 3. Default
        return defaultTab;
    };

    const [activeTab, setActiveTabState] = useState<T>(getInitialTab);
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    // On mount: write current tab to URL so reload restores it
    useEffect(() => {
        const url = new URL(window.location.href);
        const current = url.searchParams.get(paramName);
        const tab = activeTabRef.current;
        if (current !== tab) {
            url.searchParams.set(paramName, tab);
            window.history.replaceState(null, '', url.pathname + url.search);
        }
        // Also ensure sessionStorage is up to date
        try { sessionStorage.setItem(storageKey, tab); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramName, storageKey]);

    // Listen for popstate (browser back/forward) to sync
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const val = params.get(paramName) as T | null;
            const next = val && (validTabs as readonly string[]).includes(val) ? val : defaultTab;
            if (next !== activeTabRef.current) {
                setActiveTabState(next);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [paramName, validTabs, defaultTab]);

    // Update state + URL + sessionStorage
    const setActiveTab = useCallback(
        (tab: T) => {
            setActiveTabState(tab);
            activeTabRef.current = tab;

            // Write to URL
            const url = new URL(window.location.href);
            url.searchParams.set(paramName, tab);
            window.history.replaceState(null, '', url.pathname + url.search);

            // Write to sessionStorage as navigation fallback
            try { sessionStorage.setItem(storageKey, tab); } catch { /* ignore */ }
        },
        [paramName, storageKey],
    );

    return [activeTab, setActiveTab];
}
