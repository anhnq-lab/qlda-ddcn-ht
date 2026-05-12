import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { Brain } from 'lucide-react';

const AIRiskDashboard = lazy(() => import('../../../components/ai/AIRiskDashboard').then(m => ({ default: m.AIRiskDashboard })));
const AIAnomalyDetector = lazy(() => import('../../../components/ai/AIAnomalyDetector').then(m => ({ default: m.AIAnomalyDetector })));
const AIContractorScoring = lazy(() => import('../../../components/ai/AIContractorScoring').then(m => ({ default: m.AIContractorScoring })));
const AIResourceOptimizer = lazy(() => import('../../../components/ai/AIResourceOptimizer').then(m => ({ default: m.AIResourceOptimizer })));

export const AITab: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in fade-in-up">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}>
                        <ErrorBoundary>
                            <AIRiskDashboard />
                        </ErrorBoundary>
                    </Suspense>
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}>
                        <ErrorBoundary>
                            <AIAnomalyDetector />
                        </ErrorBoundary>
                    </Suspense>
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}>
                        <ErrorBoundary>
                            <AIContractorScoring />
                        </ErrorBoundary>
                    </Suspense>
                    <Suspense fallback={<div className="h-48 bg-gray-50 dark:bg-slate-800 rounded-xl animate-pulse" />}>
                        <ErrorBoundary>
                            <AIResourceOptimizer />
                        </ErrorBoundary>
                    </Suspense>
                </div>
            </div>
        </div>
    );
};
