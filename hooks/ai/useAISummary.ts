import { useState, useCallback } from 'react';
import { getDashboardSummary, getProjectSummary } from '../../services/ai/smartSummary';
import { isAIAvailable } from '../../services/aiService';

export function useAISummary(projectId?: string) {
    const cacheKey = projectId ? `ai_summary_project_${projectId}` : 'ai_summary_dashboard';

    const [summary, setSummary] = useState<string | null>(() => {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                return data.text || null;
            }
        } catch (e) {
            console.error('Error reading AI summary cache from localStorage:', e);
        }
        return null;
    });

    const [updatedAt, setUpdatedAt] = useState<number | null>(() => {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                return data.updatedAt || null;
            }
        } catch (e) {
            console.error('Error reading AI summary cache timestamp from localStorage:', e);
        }
        return null;
    });

    const [loading, setLoading] = useState(false);

    const loadSummary = useCallback(async (force = false) => {
        if (!isAIAvailable()) return;
        setLoading(true);
        try {
            const result = projectId
                ? await getProjectSummary(projectId, force)
                : await getDashboardSummary(force);
            setSummary(result);
            const now = Date.now();
            setUpdatedAt(now);
            localStorage.setItem(cacheKey, JSON.stringify({ text: result, updatedAt: now }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [projectId, cacheKey]);

    return { summary, loading, loadSummary, isAIAvailable, updatedAt };
}

