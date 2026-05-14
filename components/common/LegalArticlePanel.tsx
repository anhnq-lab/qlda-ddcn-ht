import React, { useMemo, useState } from 'react';
import { Scale, FileText, Calendar, Shield, Building2, ExternalLink, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DOC_TYPE_LABELS, DOC_STATUS_LABELS, DOC_TYPE_COLORS, DOC_STATUS_COLORS, LegalArticleDB } from '../../services/LegalDocumentService';
import { useDocumentDetail } from '../../features/legal-documents/useLegalDocuments';

// ─── Types ───────────────────────────────────────────────────────────────────
// Trigger HMR

interface LegalArticlePanelProps {
    docId: string;
    articleId?: string;
}

// ─── Article Content Renderer ────────────────────────────────────────────────

const ArticleContent: React.FC<{ content: string }> = ({ content }) => {
    const html = useMemo(() => {
        let raw = content || '';
        raw = raw.replace(/\\n/g, '\n');

        // Handle tables
        const tableRegex = /<table[\s\S]*?<\/table>/gi;
        let lastIndex = 0;
        let match;
        let newHtml = '';

        while ((match = tableRegex.exec(raw)) !== null) {
            if (match.index > lastIndex) {
                const textPart = raw.substring(lastIndex, match.index);
                newHtml += `<div class="whitespace-pre-line break-words mb-4">${textPart}</div>`;
            }
            newHtml += `<div class="legal-table-wrapper my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-600">${match[0]}</div>`;
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < raw.length) {
            const textPart = raw.substring(lastIndex);
            newHtml += `<div class="whitespace-pre-line break-words">${textPart}</div>`;
        }

        return newHtml || raw;
    }, [content]);

    return (
        <div
            className="text-[13px] leading-relaxed text-gray-700 dark:text-slate-300 space-y-2 overflow-hidden break-words"
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

// ─── Single Article Card ─────────────────────────────────────────────────────

const ArticleCard: React.FC<{
    article: LegalArticleDB;
    isTarget: boolean;
    defaultExpanded: boolean;
}> = ({ article, isTarget, defaultExpanded }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div
            id={`panel-article-${article.id}`}
            className={`rounded-xl border transition-all duration-300 ${isTarget
                ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-300 dark:border-primary-700 shadow-lg ring-1 ring-primary-400/30'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-black shrink-0 ${isTarget ? 'text-primary-600 dark:text-primary-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {article.code}.
                    </span>
                    <span className={`text-sm font-semibold truncate ${isTarget ? 'text-primary-900 dark:text-primary-200' : 'text-gray-800 dark:text-slate-200'}`}>
                        {article.title}
                    </span>
                </div>
                <div className={`shrink-0 p-1 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-slate-700'}`}>
                    {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                    }
                </div>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3 overflow-hidden">
                    {article.summary && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 italic mb-3 pb-3 border-b border-dashed border-gray-200 dark:border-slate-600 leading-relaxed">
                            {article.summary}
                        </p>
                    )}
                    {article.content && (
                        <ArticleContent content={article.content} />
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Panel Component ────────────────────────────────────────────────────

const LegalArticlePanel: React.FC<LegalArticlePanelProps> = ({ docId, articleId }) => {
    const navigate = useNavigate();
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

    // Fetch document
    const { data: doc, isLoading } = useDocumentDetail(docId || null);

    // Find target article and its chapter
    const { targetArticle, targetChapter } = useMemo(() => {
        if (!doc || !articleId) return { targetArticle: null, targetChapter: null };
        const chapters = doc.chapters || [];
        for (const ch of chapters) {
            const articles = ch.articles || [];
            const art = articles.find(a => a.id === articleId);
            if (art) return { targetArticle: art, targetChapter: ch };
        }
        return { targetArticle: null, targetChapter: null };
    }, [doc, articleId]);

    // Auto-expand target chapter
    useMemo(() => {
        if (targetChapter) {
            setExpandedChapters(new Set([targetChapter.id]));
        }
    }, [targetChapter]);

    // Scroll to target article after mount
    React.useEffect(() => {
        if (targetArticle) {
            const timer = setTimeout(() => {
                const el = document.getElementById(`panel-article-${targetArticle.id}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [targetArticle]);

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) next.delete(chapterId);
            else next.add(chapterId);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8 h-full">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-sm font-bold text-gray-500">Đang tải văn bản...</h3>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8 h-full">
                <Scale className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
                <h3 className="text-sm font-bold text-gray-400 dark:text-slate-400">Không tìm thấy văn bản</h3>
                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">ID: {docId}</p>
            </div>
        );
    }

    const typeColor = DOC_TYPE_COLORS[doc.type] || DOC_TYPE_COLORS['other' as any];
    const statusColor = DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS['draft' as any];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Document Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-b from-gray-50/80 to-white dark:from-slate-800/80 dark:to-slate-900 shrink-0">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${typeColor.bg} ${typeColor.text} ${typeColor.border} border ${typeColor.darkBg} ${typeColor.darkText} ${typeColor.darkBorder}`}>
                        <Scale className="w-3 h-3" />
                        {DOC_TYPE_LABELS[doc.type] || doc.type}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${statusColor.bg} ${statusColor.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                        {DOC_STATUS_LABELS[doc.status] || doc.status}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug mb-2">
                    {doc.title}
                </h2>

                {/* Code */}
                <p className="text-[10px] font-mono text-gray-400 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    {doc.code}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        Ban hành: <strong className="text-gray-700 dark:text-slate-300">{doc.issued_date ? new Date(doc.issued_date).toLocaleDateString('vi-VN') : 'N/A'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        Hiệu lực: <strong className="text-gray-700 dark:text-slate-300">{doc.effective_date ? new Date(doc.effective_date).toLocaleDateString('vi-VN') : 'N/A'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-indigo-400" />
                        {doc.issued_by}
                    </span>
                </div>

                {/* Target article highlight */}
                {targetArticle && (
                    <div className="mt-3 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-primary-800 dark:text-primary-300">
                                {targetArticle.code}. {targetArticle.title}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content — Chapters & Articles */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3">
                {(doc.chapters || []).map(chapter => (
                    <div key={chapter.id}>
                        {/* Chapter Header */}
                        <button
                            onClick={() => toggleChapter(chapter.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg border transition-all group ${expandedChapters.has(chapter.id)
                                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10'
                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{chapter.code}</p>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {chapter.title}
                                    </p>
                                </div>
                                <div className="p-1 rounded-lg bg-gray-50 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
                                    {expandedChapters.has(chapter.id)
                                        ? <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                        : <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                                    }
                                </div>
                            </div>
                        </button>

                        {/* Articles */}
                        {expandedChapters.has(chapter.id) && (
                            <div className="mt-2 space-y-2 ml-1">
                                {(chapter.articles || []).map(article => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        isTarget={article.id === articleId}
                                        defaultExpanded={article.id === articleId}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer — link to full page */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800 shrink-0">
                <button
                    onClick={() => {
                        const params = new URLSearchParams({ docId });
                        if (articleId) params.set('articleId', articleId);
                        navigate(`/legal-documents?${params.toString()}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl transition-colors"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Xem toàn bộ văn bản
                </button>
            </div>
        </div>
    );
};

export default LegalArticlePanel;
