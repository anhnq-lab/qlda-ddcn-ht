import { useState, useCallback } from 'react';
import { getDashboardSummary, getProjectSummary, getPersonalSummary, PersonalSummaryContext } from '../../services/ai/smartSummary';
import { isAIAvailable } from '../../services/aiService';

export function useAISummary(projectId?: string, personalContext?: PersonalSummaryContext) {
    const cacheKey = projectId 
        ? `ai_summary_project_${projectId}` 
        : personalContext 
            ? `ai_summary_personal_${personalContext.fullName}` 
            : 'ai_summary_dashboard';

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

    const personalContextStr = JSON.stringify(personalContext);

    const loadSummary = useCallback(async (force = false) => {
        if (!isAIAvailable()) return;
        setLoading(true);
        try {
            const parsedContext = personalContextStr ? JSON.parse(personalContextStr) : undefined;
            const result = projectId
                ? await getProjectSummary(projectId, force)
                : parsedContext
                    ? await getPersonalSummary(parsedContext, force)
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
    }, [projectId, personalContextStr, cacheKey]);

    return { summary, loading, loadSummary, isAIAvailable, updatedAt };
}
