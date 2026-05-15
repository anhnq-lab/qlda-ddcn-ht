import { useState, useCallback } from 'react';
import { rankAllContractors, ContractorRanking, ContractorScore } from '../../services/ai/contractorScoring';
export type { ContractorRanking, ContractorScore };

export function useAIContractorScore() {
    const [ranking, setRanking] = useState<ContractorRanking | null>(null);
    const [loading, setLoading] = useState(false);

    const loadRanking = useCallback(async () => {
        setLoading(true);
        try {
            const result = await rankAllContractors();
            setRanking(result);
        } catch (e) {
            console.error('Ranking error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return { ranking, loading, loadRanking };
}
