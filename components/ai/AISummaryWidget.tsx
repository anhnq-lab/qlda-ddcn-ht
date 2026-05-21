import React, { useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAISummary } from '../../hooks/ai/useAISummary';

interface AISummaryWidgetProps {
    /** If provided, show project-specific summary. Otherwise show dashboard summary. */
    projectId?: string;
    className?: string;
}

export const AISummaryWidget: React.FC<AISummaryWidgetProps> = ({ projectId, className = '' }) => {
    const { summary, loading, loadSummary, isAIAvailable } = useAISummary(projectId);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    if (!isAIAvailable()) return null;

    return (
        <div className={`bg-bg-surface rounded-2xl shadow-sm border border-border p-[var(--density-card-p)] ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary-500" />
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300">Tóm tắt AI</span>
                </div>
                <button
                    onClick={() => loadSummary(true)}
                    disabled={loading}
                    className="p-1 hover:bg-bg-muted rounded-lg transition-colors"
                    title="Tạo lại"
                >
                    <RefreshCw size={12} className={`text-txt-muted ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && !summary && (
                <div className="flex items-center gap-2 py-2">
                    <RefreshCw size={12} className="animate-spin text-txt-muted" />
                    <span className="text-xs text-txt-muted">Đang phân tích...</span>
                </div>
            )}

            {summary && (
                <div className="text-sm text-txt-secondary leading-relaxed">
                    {summary.split('\n').map((line, index) => {
                        const trimmed = line.trim();
                        // Horizontal rules
                        if (trimmed.match(/^(---|--- |- - -|\*\*\*)$/)) {
                            return <hr key={index} className="my-3 border-border" />;
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
                                            <strong key={i} className="font-bold text-txt-primary">
                                                {part.slice(2, -2)}
                                            </strong>
                                        );
                                    }
                                    if (part.startsWith('*') && part.endsWith('*')) {
                                        return (
                                            <em key={i} className="italic text-txt-muted">
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
