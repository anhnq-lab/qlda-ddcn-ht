import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAISummary } from '../../hooks/ai/useAISummary';

interface AISummaryWidgetProps {
    /** If provided, show project-specific summary. Otherwise show dashboard summary. */
    projectId?: string;
    className?: string;
}

const formatTime = (ts: number | null) => {
    if (!ts) return '';
    const date = new Date(ts);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
};

export const AISummaryWidget: React.FC<AISummaryWidgetProps> = ({ projectId, className = '' }) => {
    const { summary, loading, loadSummary, isAIAvailable, updatedAt } = useAISummary(projectId);

    if (!isAIAvailable()) return null;

    return (
        <div className={`bg-bg-surface rounded-2xl shadow-sm border border-border p-[var(--density-card-p)] ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary-500" />
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300">Tóm tắt AI</span>
                    {updatedAt && (
                        <span className="text-[10px] text-txt-muted font-normal">
                            ({formatTime(updatedAt)})
                        </span>
                    )}
                </div>
                <button
                    onClick={() => loadSummary(true)}
                    disabled={loading}
                    className="p-1 hover:bg-bg-muted rounded-lg transition-colors cursor-pointer"
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

            {!loading && !summary && (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center gap-2 border border-dashed border-border rounded-xl bg-bg-muted/10">
                    <Sparkles size={16} className="text-txt-muted opacity-60 animate-pulse" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-txt-primary">Chưa có tóm tắt AI</span>
                        <span className="text-[10px] text-txt-muted max-w-[200px]">
                            Bấm nút làm mới để phân tích dữ liệu dự án bằng AI.
                        </span>
                    </div>
                    <button
                        onClick={() => loadSummary(true)}
                        className="text-[10px] px-3 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/30 dark:hover:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-primary-200/50 dark:border-primary-800/30 cursor-pointer mt-1"
                    >
                        <RefreshCw size={10} />
                        Phân tích ngay
                    </button>
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
