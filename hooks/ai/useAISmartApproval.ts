import { useState, useCallback } from 'react';
import { checkPaymentApproval, checkContractApproval, ApprovalCheckResult } from '../../services/ai/smartApproval';
export type { ApprovalCheckResult };

export function useAISmartApproval() {
    const [result, setResult] = useState<ApprovalCheckResult | null>(null);
    const [loading, setLoading] = useState(false);

    const runCheck = useCallback(async (type: 'payment' | 'contract', id: string, amount: number, projectId?: string) => {
        setLoading(true);
        try {
            let data: ApprovalCheckResult;
            if (type === 'payment') {
                data = await checkPaymentApproval(id, amount);
            } else {
                data = await checkContractApproval(projectId || '', amount);
            }
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    return { result, loading, runCheck };
}
