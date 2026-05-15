import { useState, useCallback } from 'react';
import { forecastProject, calculateSimpleForecast } from '../../services/ai/forecasting';
import { ForecastResult } from '../../services/aiService';
export type { ForecastResult };

export function useAIForecast(projectId: string, disbursed: number, planned: number) {
    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [loading, setLoading] = useState(false);

    const simpleForecast = calculateSimpleForecast(disbursed, planned);

    const loadAIForecast = useCallback(async () => {
        setLoading(true);
        try {
            const result = await forecastProject(projectId);
            setForecast(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    return { forecast, simpleForecast, loading, loadAIForecast };
}
