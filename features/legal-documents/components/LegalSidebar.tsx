import React from 'react';
import { Bookmark, Search, Clock, FileText } from 'lucide-react';
import { LegalDocumentDB } from '../../../services/LegalDocumentService';
import { DocSidebarItem } from './LegalUI';
import { BookmarkItem, RecentlyViewedItem } from '../useLegalStorage';

interface LegalSidebarProps {
    readingMode: boolean;
    showBookmarks: boolean;
    setShowBookmarks: (val: boolean) => void;
    filteredDocs: LegalDocumentDB[];
    bookmarks: BookmarkItem[];
    recentlyViewed: RecentlyViewedItem[];
    selectedDocId: string;
    setSelectedDocId: (id: string) => void;
    scrollToArticle: (articleId: string, chapterId: string) => void;
    setExpandedChapters: (chapters: Set<string>) => void;
    setShowPdfViewer: (val: boolean) => void;
    setShowDeepSearch: (val: boolean) => void;
}

export const LegalSidebar: React.FC<LegalSidebarProps> = ({
    readingMode, showBookmarks, setShowBookmarks, filteredDocs, bookmarks,
    recentlyViewed, selectedDocId, setSelectedDocId, scrollToArticle,
    setExpandedChapters, setShowPdfViewer, setShowDeepSearch
}) => {
    return (
        <div className={`${readingMode ? 'hidden' : 'w-80'} bg-bg-surface rounded-3xl shadow-sm border border-border flex flex-col overflow-hidden`}>
            {/* Sidebar Header with tabs */}
            <div className="px-5 py-3 border-b border-border bg-bg-subtle">
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowBookmarks(false)}
                        className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg transition-all ${!showBookmarks ? 'bg-primary-600 text-white' : 'text-txt-placeholder hover:bg-bg-muted'}`}>
                        <FileText className="w-4 h-4 inline" /> Văn bản ({filteredDocs.length})
                    </button>
                    <button onClick={() => setShowBookmarks(true)}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg transition-all ${showBookmarks ? 'bg-primary-500 text-white' : 'text-txt-placeholder hover:bg-bg-muted'}`}>
                        <Bookmark className="w-4 h-4" /> Đánh dấu ({bookmarks.length})
                    </button>
                    {recentlyViewed.length > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-txt-placeholder">
                            <Clock className="w-3 h-3" />
                            {recentlyViewed.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {showBookmarks ? (
                    bookmarks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Bookmark className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
                            <p className="text-sm font-bold text-txt-placeholder">Chưa có mục đánh dấu</p>
                            <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Nhấn nút <Bookmark className="w-3 h-3 inline" /> trên điều khoản để đánh dấu</p>
                        </div>
                    ) : (
                        bookmarks.map(bm => {
                            return (
                                <button key={bm.articleId}
                                    onClick={() => { setSelectedDocId(bm.docId); setShowBookmarks(false); if ((bm as any).chapterId) scrollToArticle(bm.articleId, (bm as any).chapterId); }}
                                    className="w-full text-left p-3 rounded-xl border border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
                                    <p className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider">{(bm as any).docShortTitle || 'Văn bản đã lưu'}</p>
                                    <p className="text-xs font-bold text-txt-secondary mt-0.5">
                                        <span className="text-gray-400 font-mono text-[10px] mr-1">{(bm as any).articleCode || ''}</span>
                                        {(bm as any).articleTitle || 'Điều khoản đã lưu'}
                                    </p>
                                </button>
                            );
                        })
                    )
                ) : (
                    filteredDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Search className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
                            <p className="text-sm font-bold text-txt-placeholder">Không tìm thấy văn bản</p>
                            <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Thử tìm với từ khóa khác</p>
                        </div>
                    ) : filteredDocs.map(doc => (
                        <DocSidebarItem key={doc.id} doc={doc} isSelected={selectedDocId === doc.id}
                            articleCount={{ chapters: 0, articles: 0 }}
                            onClick={() => { setSelectedDocId(doc.id); setShowPdfViewer(false); setExpandedChapters(new Set()); setShowDeepSearch(false); }} />
                    ))
                )}
            </div>
        </div>
    );
};
