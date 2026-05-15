import { useState, useCallback } from 'react';
import { analyzeAllProjectsRisks, FullRiskReport, EnrichedRiskItem } from '../../services/ai/riskAnalyzer';
export type { FullRiskReport, EnrichedRiskItem };

export function useAIRisk() {
    const [report, setReport] = useState<FullRiskReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRisks = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const result = await analyzeAllProjectsRisks();
            setReport(result);
        } catch (e: any) {
            setError(e.message || 'Lỗi phân tích rủi ro');
        } finally {
            setLoading(false);
        }
    }, []);

    return { report, loading, error, loadRisks };
}
