import React, { useState } from 'react';
import { Award, RefreshCw, Star, AlertTriangle, ChevronRight, TrendingUp, Users } from 'lucide-react';
import { useAIContractorScore, ContractorRanking, ContractorScore } from '../../hooks/ai/useAIContractorScore';

export const AIContractorScoring: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { ranking, loading, loadRanking } = useAIContractorScore();
    const [expanded, setExpanded] = useState<string | null>(null);

    const riskColors = {
        low: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
        medium: 'bg-primary-100 dark:bg-blue-950 text-primary-700 dark:text-blue-400',
        high: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400',
    };

    return (
        <div className={`bg-bg-surface rounded-xl border border-border shadow-lg overflow-hidden ${className}`}>
            <div className="px-4 py-3 bg-bg-subtle border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-warning-500 flex items-center justify-center">
                        <Award size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-txt-secondary">Đánh giá Nhà thầu AI</h3>
                        <p className="text-[10px] text-slate-400">
                            {ranking ? `${ranking.rankings.length} nhà thầu đã phân tích` : 'Nhấn để phân tích'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadRanking}
                    disabled={loading}
                    className="text-[11px] px-2.5 py-1.5 bg-primary-50 dark:bg-blue-900 text-primary-600 dark:text-blue-300 rounded-lg hover:bg-primary-100 dark:hover:bg-blue-800 transition-colors flex items-center gap-1"
                >
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                    {loading ? 'Đang phân tích...' : ranking ? 'Cập nhật' : 'Phân tích'}
                </button>
            </div>

            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {!ranking && !loading && (
                    <div className="text-center py-8 text-slate-400">
                        <Users size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nhấn "Phân tích" để đánh giá nhà thầu</p>
                    </div>
                )}

                {loading && !ranking && (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs">Đang đánh giá nhà thầu...</span>
                    </div>
                )}

                {ranking?.rankings.map((score, idx) => (
                    <div
                        key={score.contractorId}
                        className="rounded-lg border border-border hover:border-primary-300 dark:hover:border-primary-600 transition-all cursor-pointer"
                        onClick={() => setExpanded(expanded === score.contractorId ? null : score.contractorId)}
                    >
                        <div className="flex items-center gap-2.5 p-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx < 3 ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-bg-muted text-slate-500'
                                }`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-txt-secondary truncate">{score.contractorName}</p>
                                <p className="text-[10px] text-slate-400">{score.contractCount} HĐ • {(score.totalContractValue / 1e9).toFixed(1)} tỷ</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <span className="text-sm font-black text-txt-secondary">{score.overallScore}</span>
                                    <span className="text-[9px] text-slate-400">/100</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${riskColors[score.riskLevel]}`}>
                                    {score.riskLevel === 'low' ? 'Tốt' : score.riskLevel === 'medium' ? 'TB' : 'Rủi ro'}
                                </span>
                                <ChevronRight size={12} className={`text-slate-400 transition-transform ${expanded === score.contractorId ? 'rotate-90' : ''}`} />
                            </div>
                        </div>

                        {expanded === score.contractorId && (
                            <div className="px-2.5 pb-2.5 border-t border-border-subtle pt-2 space-y-2">
                                {/* Score bars */}
                                {[
                                    { label: 'Tiến độ', value: score.dimensions.deliveryScore },
                                    { label: 'Chất lượng', value: score.dimensions.qualityScore },
                                    { label: 'Tài chính', value: score.dimensions.financialScore },
                                    { label: 'Tuân thủ', value: score.dimensions.complianceScore },
                                    { label: 'Kinh nghiệm', value: score.dimensions.experienceScore },
                                ].map(d => (
                                    <div key={d.label} className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 w-16">{d.label}</span>
                                        <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${d.value >= 70 ? 'bg-emerald-500' : d.value >= 45 ? 'bg-primary-500' : 'bg-red-500'}`} style={{ width: `${d.value}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-txt-muted w-8 text-right">{Math.round(d.value)}</span>
                                    </div>
                                ))}
                                {score.highlights.length > 0 && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">✅ {score.highlights.join(' • ')}</div>
                                )}
                                {score.concerns.length > 0 && (
                                    <div className="text-[10px] text-red-500 dark:text-red-400">⚠️ {score.concerns.join(' • ')}</div>
                                )}
                                <p className="text-[10px] text-txt-muted italic">💡 {score.recommendation}</p>
                            </div>
                        )}
                    </div>
                ))}

                {ranking?.aiInsight && (
                    <div className="mt-2 p-2.5 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800/30 text-[11px] text-primary-800 dark:text-primary-300">
                        🤖 {ranking.aiInsight}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIContractorScoring;
