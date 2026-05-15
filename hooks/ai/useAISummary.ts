import { useState, useCallback } from 'react';
import { getDashboardSummary, getProjectSummary } from '../../services/ai/smartSummary';
import { isAIAvailable } from '../../services/aiService';

export function useAISummary(projectId?: string) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadSummary = useCallback(async (force = false) => {
        if (!isAIAvailable()) return;
        setLoading(true);
        try {
            const result = projectId
                ? await getProjectSummary(projectId, force)
                : await getDashboardSummary(force);
            setSummary(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    return { summary, loading, loadSummary, isAIAvailable };
}
