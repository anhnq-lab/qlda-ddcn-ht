import { useState, useEffect, useCallback, useRef } from 'react';
import { TaskFilter } from '../components/TaskFilterBar';
import { TaskViewMode } from '../components/TaskFilterBar';

const STORAGE_KEY = 'qlda-plan-preferences';
const VALID_VIEWS: readonly TaskViewMode[] = ['wbs', 'gantt', 'kanban', 'resource'];
const VALID_FILTERS: readonly TaskFilter[] = ['all', 'my-tasks', 'overdue', 'this-week', 'critical', 'in-progress', 'completed'];

interface PlanPreferences {
    view: TaskViewMode;
    filter: TaskFilter;
}

export function usePlanPersist(projectID?: string) {
    const key = `${STORAGE_KEY}-${projectID || 'default'}`;

    const getInitial = (): PlanPreferences => {
        const params = new URLSearchParams(window.location.search);

        const urlView = params.get('view') as TaskViewMode | null;
        const urlFilter = params.get('filter') as TaskFilter | null;

        let savedView: TaskViewMode | null = null;
        let savedFilter: TaskFilter | null = null;
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                savedView = parsed.view;
                savedFilter = parsed.filter;
            }
        } catch {}

        return {
            view: (urlView && VALID_VIEWS.includes(urlView)) ? urlView
                : (savedView && VALID_VIEWS.includes(savedView)) ? savedView
                : 'wbs',
            filter: (urlFilter && VALID_FILTERS.includes(urlFilter)) ? urlFilter
                : (savedFilter && VALID_FILTERS.includes(savedFilter)) ? savedFilter
                : 'all',
        };
    };

    const [preferences, setPreferences] = useState<PlanPreferences>(getInitial);
    const prefsRef = useRef(preferences);
    prefsRef.current = preferences;

    const syncToUrl = useCallback((prefs: PlanPreferences) => {
        const url = new URL(window.location.href);
        url.searchParams.set('view', prefs.view);
        if (prefs.filter !== 'all') {
            url.searchParams.set('filter', prefs.filter);
        } else {
            url.searchParams.delete('filter');
        }
        window.history.replaceState(null, '', url.pathname + url.search);
    }, []);

    useEffect(() => {
        syncToUrl(prefsRef.current);
    }, [syncToUrl]);

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(preferences));
        } catch {}
        syncToUrl(preferences);
    }, [preferences, key, syncToUrl]);

    const setView = useCallback((view: TaskViewMode) => setPreferences(p => ({ ...p, view })), []);
    const setFilter = useCallback((filter: TaskFilter) => setPreferences(p => ({ ...p, filter })), []);

    return {
        currentView: preferences.view,
        currentFilter: preferences.filter,
        setView,
        setFilter,
    };
}
