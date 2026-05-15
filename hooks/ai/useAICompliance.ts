import { useState, useCallback } from 'react';
import { checkProjectCompliance, FullComplianceReport, EnrichedComplianceCheck } from '../../services/ai/complianceChecker';
export type { FullComplianceReport, EnrichedComplianceCheck };

export function useAICompliance(projectId: string) {
    const [report, setReport] = useState<FullComplianceReport | null>(null);
    const [loading, setLoading] = useState(false);

    const loadCompliance = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const result = await checkProjectCompliance(projectId);
            setReport(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    return { report, loading, loadCompliance };
}
