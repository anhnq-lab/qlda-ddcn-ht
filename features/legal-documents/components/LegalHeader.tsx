import React from 'react';
import { Search, Scale, Filter, X, FileText, Layers, ShieldCheck } from 'lucide-react';
import { DocType, DOC_TYPE_LABELS } from '../../../services/LegalDocumentService';
import { DeepSearchResult, DeepSearchItem } from './LegalUI';
import { StatCard } from '../../../components/ui';

interface LegalHeaderProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterType: DocType | 'all';
    setFilterType: (type: DocType | 'all') => void;
    stats: any;
    showDeepSearch: boolean;
    setShowDeepSearch: (val: boolean) => void;
    deepSearchResults: DeepSearchItem[];
    navigateDeepSearch: (docId: string, chapterId: string, articleId: string) => void;
    readingMode: boolean;
}

export const LegalHeader: React.FC<LegalHeaderProps> = ({
    searchQuery, setSearchQuery, filterType, setFilterType, stats,
    showDeepSearch, setShowDeepSearch, deepSearchResults, navigateDeepSearch,
    readingMode
}) => {
    if (readingMode) return null;

    return (
        <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-txt-primary tracking-tight uppercase flex items-center gap-2">
                        <Scale className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        Văn bản Pháp luật Xây dựng
                    </h2>
                    <p className="text-[11px] text-txt-muted mt-0.5 font-medium ml-7 hidden sm:block">
                        Tra cứu thông minh Luật, Nghị định, Thông tư, Quy chuẩn về xây dựng và đầu tư công
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-subtle border border-border rounded-lg text-txt-muted">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Tổng: <span className="text-txt-primary">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-warning-50 dark:bg-warning-900 border border-warning-200 dark:border-warning-800 rounded-lg text-warning-700 dark:text-warning-300">
                        <Layers className="w-3.5 h-3.5 text-warning-500" />
                        Điều khoản: <span className="text-warning-900 dark:text-warning-200">{stats.totalArticles}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-success-50 dark:bg-success-900 border border-success-200 dark:border-success-800 rounded-lg text-success-700 dark:text-success-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-success-500" />
                        Hiệu lực: <span className="text-success-900 dark:text-success-200">{stats.active}</span>
                    </div>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <div className="bg-bg-surface rounded-xl shadow-sm border border-border flex items-center px-3 h-10 transition-all focus-within:ring-2 focus-within:ring-primary-100 dark:focus-within:ring-primary-900/40 focus-within:border-primary-400">
                        <Search className="w-4 h-4 text-txt-placeholder mr-2" />
                        <input
                            type="text"
                            placeholder="Tìm theo số hiệu, tên văn bản, nội dung điều khoản..."
                            className="flex-1 h-full outline-none text-[13px] font-medium text-txt-secondary placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowDeepSearch(e.target.value.length >= 2); }}
                            onFocus={() => { if (searchQuery.length >= 2) setShowDeepSearch(true); }}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setShowDeepSearch(false); }} className="p-1 text-gray-400 hover:text-danger-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Deep Search Dropdown */}
                    {showDeepSearch && deepSearchResults.length > 0 && (
                        <div className="absolute top-14 left-0 right-0 z-50 bg-bg-surface rounded-2xl shadow-sm border border-border max-h-96 overflow-y-auto p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between px-2 pb-2 border-b border-border">
                                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                                    <Search className="w-3.5 h-3.5 inline" /> Tìm thấy {deepSearchResults.length} điều khoản
                                </span>
                                <button onClick={() => setShowDeepSearch(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            {deepSearchResults.map(r => (
                                <DeepSearchResult key={r.articleId} result={r} query={searchQuery} onNavigate={navigateDeepSearch} />
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-txt-placeholder mr-1" />
                    {(['all', 'luat', 'nghi-dinh', 'thong-tu', 'qcvn', 'quyet-dinh'] as const).map(type => {
                        const isActive = filterType === type;
                        const label = type === 'all' ? 'Tất cả' : DOC_TYPE_LABELS[type];
                        const count = type === 'all' ? stats.total : stats.byType[type];
                        return (
                            <button key={type} onClick={() => setFilterType(type)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${isActive
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200 dark:shadow-primary-900/30'
                                    : 'bg-bg-surface text-txt-muted border-gray-200 dark:border-slate-600 hover:bg-bg-subtle dark:hover:bg-slate-700'}`}>
                                {label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20' : 'bg-bg-muted'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
