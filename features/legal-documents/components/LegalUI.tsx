import React from 'react';
import { Landmark, Gavel, ScrollText, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import {
    LegalDocumentDB, DocType,
    DOC_TYPE_LABELS, DOC_STATUS_LABELS, DOC_TYPE_COLORS, DOC_STATUS_COLORS
} from '../../../services/LegalDocumentService';

// ============================================
// TYPE ICON MAP
// ============================================
export const TYPE_ICONS: Record<DocType, React.ElementType> = {
    'luat': Landmark, 'nghi-dinh': Gavel, 'thong-tu': ScrollText,
    'qcvn': ShieldCheck, 'quyet-dinh': FileText,
};

// ============================================
// HIGHLIGHT TEXT
// ============================================
export const HighlightText: React.FC<{ text: string | null; query: string }> = ({ text, query }) => {
    if (!text) return null;
    if (!query.trim()) return <>{text}</>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <mark key={i} className="bg-warning-200 dark:bg-warning-500/30 dark:text-warning-100 rounded px-0.5 font-bold">{part}</mark>
                    : part
            )}
        </>
    );
};



// ============================================
// DOCUMENT CARD (SIDEBAR)
// ============================================
export const DocSidebarItem: React.FC<{
    doc: LegalDocumentDB; isSelected: boolean; onClick: () => void;
    articleCount: { chapters: number; articles: number };
}> = ({ doc, isSelected, onClick, articleCount }) => {
    const typeColor = DOC_TYPE_COLORS[doc.type];
    const statusColor = DOC_STATUS_COLORS[doc.status];
    const Icon = TYPE_ICONS[doc.type];
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3.5 rounded-2xl transition-all group border ${isSelected
                ? `${typeColor.bg} ${typeColor.border} shadow-sm`
                : 'border-transparent hover:bg-bg-app dark:bg-slate-900 dark:hover:bg-slate-700'}`}
        >
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${isSelected
                    ? `${typeColor.bg} ${typeColor.text}`
                    : 'bg-bg-muted text-txt-placeholder group-hover:bg-bg-surface dark:group-hover:bg-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${typeColor.bg} ${typeColor.text}`}>
                            {DOC_TYPE_LABELS[doc.type]}
                        </span>
                        <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColor.bg} ${statusColor.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}></span>
                            {DOC_STATUS_LABELS[doc.status]}
                        </span>
                    </div>
                    <p className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-txt-primary' : 'text-txt-muted'}`}>
                        {doc.short_title || doc.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className={`text-[10px] font-medium ${isSelected ? 'text-txt-muted' : 'text-txt-placeholder'}`}>
                            {doc.code}
                        </p>
                        {articleCount.articles > 0 && (
                            <span className="text-[9px] font-bold text-txt-placeholder bg-bg-muted px-1.5 py-0.5 rounded">
                                {articleCount.chapters}ch · {articleCount.articles}đ
                            </span>
                        )}
                    </div>
                </div>
                {isSelected && <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${typeColor.text}`} />}
            </div>
        </button>
    );
};

// ============================================
// DEEP SEARCH RESULT
// ============================================
export interface DeepSearchItem {
    docId: string;
    docCode?: string;
    docTitle?: string;
    chapterId: string;
    articleId: string;
    articleCode: string;
    articleTitle: string;
    snippet: string;
}

export const DeepSearchResult: React.FC<{
    result: DeepSearchItem; query: string;
    onNavigate: (docId: string, chapterId: string, articleId: string) => void;
}> = ({ result, query, onNavigate }) => (
    <button
        onClick={() => onNavigate(result.docId, result.chapterId, result.articleId)}
        className="w-full text-left p-3 rounded-xl border border-border hover:bg-primary-50/50 dark:hover:bg-slate-800 transition-all group"
    >
        <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {result.docCode ? result.docCode : 'Kết quả tìm kiếm'}
            </span>
            {result.docTitle && <span className="text-[10px] font-bold text-txt-muted truncate">{result.docTitle}</span>}
        </div>
        <p className="text-xs font-bold text-txt-secondary">
            <span className="font-mono text-[10px] text-gray-400 mr-1">{result.articleCode}</span>
            <HighlightText text={result.articleTitle} query={query} />
        </p>
        <p className="text-[11px] text-txt-muted mt-0.5 line-clamp-2 leading-relaxed">
            <HighlightText text={result.snippet} query={query} />
        </p>
    </button>
);
