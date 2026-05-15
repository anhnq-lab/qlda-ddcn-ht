import { useState, useCallback } from 'react';
import { analyzeResourceAllocation, ResourceOptimizationResult } from '../../services/ai/resourceOptimizer';
export type { ResourceOptimizationResult };

export function useAIResourceOptimize() {
    const [result, setResult] = useState<ResourceOptimizationResult | null>(null);
    const [loading, setLoading] = useState(false);

    const analyze = useCallback(async () => {
        setLoading(true);
        try {
            const data = await analyzeResourceAllocation();
            setResult(data);
        } catch (e) {
            console.error('Resource analysis error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return { result, loading, analyze };
}
