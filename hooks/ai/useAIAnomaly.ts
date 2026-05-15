import { useState, useCallback } from 'react';
import { scanAllAnomalies, AnomalyReport, Anomaly } from '../../services/ai/anomalyDetector';
export type { AnomalyReport, Anomaly };

export function useAIAnomaly() {
    const [report, setReport] = useState<AnomalyReport | null>(null);
    const [loading, setLoading] = useState(false);

    const scan = useCallback(async () => {
        setLoading(true);
        try {
            const data = await scanAllAnomalies();
            setReport(data);
        } catch (e) {
            console.error('Anomaly scan error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return { report, loading, scan };
}
