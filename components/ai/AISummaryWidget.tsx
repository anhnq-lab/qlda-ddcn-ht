import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getDashboardSummary, getProjectSummary } from '../../services/ai/smartSummary';
import { isAIAvailable } from '../../services/aiService';

interface AISummaryWidgetProps {
    /** If provided, show project-specific summary. Otherwise show dashboard summary. */
    projectId?: string;
    className?: string;
}

export const AISummaryWidget: React.FC<AISummaryWidgetProps> = ({ projectId, className = '' }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadSummary = useCallback(async (force = false) => {
        if (!isAIAvailable()) return;
        setLoading(true);
        try {
            const text = projectId
                ? await getProjectSummary(projectId, force)
                : await getDashboardSummary(force);
            setSummary(text);
        } catch (e) {
            console.error('Summary error:', e);
            setSummary('⚠️ Không thể tạo tóm tắt');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    if (!isAIAvailable()) return null;

    return (
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border border-blue-100 dark:border-blue-900 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Tóm tắt AI</span>
                </div>
                <button
                    onClick={() => loadSummary(true)}
                    disabled={loading}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                    title="Tạo lại"
                >
                    <RefreshCw size={12} className={`text-blue-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && !summary && (
                <div className="flex items-center gap-2 py-2">
                    <RefreshCw size={12} className="animate-spin text-blue-400" />
                    <span className="text-xs text-blue-400">Đang phân tích...</span>
                </div>
            )}

            {summary && (
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {summary.split('\n').map((line, index) => {
                        const trimmed = line.trim();
                        // Horizontal rules
                        if (trimmed.match(/^(---|--- |- - -|\*\*\*)$/)) {
                            return <hr key={index} className="my-3 border-blue-200 dark:border-blue-800/50" />;
                        }
                        
                        // Empty lines
                        if (!trimmed) {
                            return <div key={index} className="h-2" />;
                        }

                        // Parse bold and italic
                        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);

                        return (
                            <p key={index} className="mb-1.5 last:mb-0">
                                {parts.map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                            <strong key={i} className="font-bold text-slate-900 dark:text-white">
                                                {part.slice(2, -2)}
                                            </strong>
                                        );
                                    }
                                    if (part.startsWith('*') && part.endsWith('*')) {
                                        return (
                                            <em key={i} className="italic text-slate-500 dark:text-slate-400">
                                                {part.slice(1, -1)}
                                            </em>
                                        );
                                    }
                                    return <span key={i}>{part}</span>;
                                })}
                            </p>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AISummaryWidget;
