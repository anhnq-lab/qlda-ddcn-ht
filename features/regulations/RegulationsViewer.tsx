import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FileCheck2,
    HelpCircle,
    Link2,
    Download,
    Bookmark,
    Search,
    ChevronRight,
    BookOpen,
    Layout,
    Share2,
    MessageSquare,
    User,
    Info,
    Gavel,
    Send,
    PenTool,
    ArrowLeft,
    Loader2,
    Check,
    Plus,
    Pencil,
    Trash2,
    FileText,
    BarChart3,
    Briefcase,
    TrendingUp,
    Landmark,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useRegulationBookmarks } from './hooks/useRegulationBookmarks';
import {
    useRegulationDocuments,
    useRegulationDocument,
    useUpsertDocument,
    useUpsertChapter,
    useUpsertArticle,
    useDeleteDocument,
    useDeleteChapter,
    useDeleteArticle,
    type RegDocRow,
    type RegChapterRow,
    type RegArticleRow,
} from './hooks/useRegulations';
import { useAuth } from '../../context/AuthContext';

const ICON_MAP: Record<string, React.ElementType> = {
    FileText, Layout, BarChart3, PenTool, Briefcase, TrendingUp, Landmark, BookOpen, Gavel,
};

const RegulationsViewer: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedDocumentId = searchParams.get('docId');
    const urlChapterId = searchParams.get('chapterId');
    const articleIdParam = searchParams.get('articleId');

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);

    const { addToast } = useToast();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.Role === 'Admin';
    const { bookmarkedIds, toggle: toggleBookmarkDb } = useRegulationBookmarks(selectedDocumentId);

    // --- DB Data ---
    const { data: allDocs, isLoading: docsLoading } = useRegulationDocuments();
    const { data: selectedDoc, isLoading: docLoading } = useRegulationDocument(selectedDocumentId);

    // --- Admin editing state ---
    const [editingArticle, setEditingArticle] = useState<{ id: string; title: string; content: string } | null>(null);

    const upsertArticleMut = useUpsertArticle(selectedDocumentId || '');
    const deleteArticleMut = useDeleteArticle(selectedDocumentId || '');

    const currentChapters = selectedDoc?.chapters || [];

    const selectedChapterId = useMemo(() => {
        if (urlChapterId) return urlChapterId;
        if (currentChapters.length > 0) return currentChapters[0].id;
        return '';
    }, [urlChapterId, currentChapters]);

    const filteredChapters = useMemo(() => {
        if (!searchQuery) return currentChapters;
        const lowerQ = searchQuery.toLowerCase();
        return currentChapters
            .map(chapter => {
                const matchingArticles = chapter.articles.filter(a =>
                    a.title.toLowerCase().includes(lowerQ) ||
                    a.code.toLowerCase().includes(lowerQ) ||
                    a.content.toLowerCase().includes(lowerQ)
                );
                return {
                    ...chapter,
                    articles: matchingArticles,
                    isMatch: chapter.title.toLowerCase().includes(lowerQ) || chapter.code.toLowerCase().includes(lowerQ) || matchingArticles.length > 0,
                };
            })
            .filter(c => c.isMatch);
    }, [searchQuery, currentChapters]);

    const displayChapter = filteredChapters.find(c => c.id === selectedChapterId) || filteredChapters[0];

    const toggleBookmark = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleBookmarkDb(id);
    };

    const handleCopyLink = useCallback((article: { id: string; code: string }) => {
        const url = new URL(window.location.href);
        url.searchParams.set('docId', selectedDocumentId || '');
        const parentChap = currentChapters.find(c => c.articles.some(a => a.id === article.id));
        if (parentChap) url.searchParams.set('chapterId', parentChap.id);
        url.searchParams.set('articleId', article.id);

        navigator.clipboard.writeText(url.toString()).then(() => {
            setCopiedArticleId(article.id);
            addToast({ message: `Đã sao chép liên kết ${article.code}`, type: 'success' });
            setTimeout(() => setCopiedArticleId(null), 2000);
        });
    }, [selectedDocumentId, currentChapters, addToast]);

    const handleScrollToArticle = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'), 2000);
        }
    };

    const handleDownloadOriginal = () => {
        if (!selectedDoc?.pdf_url) {
            addToast({ message: 'Chưa có file PDF cho quy chế này', type: 'warning' });
            return;
        }
        window.open(selectedDoc.pdf_url, '_blank');
    };

    const handleSaveArticle = async () => {
        if (!editingArticle) return;
        try {
            await upsertArticleMut.mutateAsync({
                id: editingArticle.id,
                chapter_id: displayChapter?.id || '',
                code: editingArticle.id,
                title: editingArticle.title,
                content: editingArticle.content,
            });
            addToast({ message: 'Đã lưu điều khoản', type: 'success' });
            setEditingArticle(null);
        } catch {
            addToast({ message: 'Lỗi khi lưu', type: 'error' });
        }
    };

    // --- Loading ---
    if (docsLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-txt-muted font-semibold">Đang tải dữ liệu quy chế...</p>
            </div>
        );
    }

    // --- Grid View ---
    if (!selectedDocumentId) {
        const filteredDocs = (allDocs || []).filter(d =>
            d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.code.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="flex flex-col h-[calc(100vh-100px)] p-6 md:p-10 gap-6 overflow-y-auto bg-transparent dark:bg-slate-950 font-sans">
                <div className="flex justify-between items-center bg-bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle">
                    <div>
                        <h1 className="text-2xl font-black text-txt-primary flex items-center gap-3">
                            <Gavel className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Hệ thống Quy chế
                        </h1>
                        <p className="text-txt-muted mt-1 text-sm font-semibold">Danh sách các quy chế nội bộ, quy trình làm việc và văn bản quản lý</p>
                    </div>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-placeholder" />
                        <input
                            type="text"
                            placeholder="Tìm quy chế..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-bg-subtle border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-txt-primary"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => {
                                setSearchParams({ docId: doc.id });
                                setSearchQuery('');
                            }}
                            className="bg-bg-surface border border-border rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${doc.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : doc.status === 'archived' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-400'}`}>
                                    {doc.status === 'active' ? 'Có Hiệu Lực' : doc.status === 'archived' ? 'Hết hiệu lực' : 'Dự Thảo'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-txt-primary mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                            <p className="text-sm text-txt-muted mb-4 flex-1 line-clamp-3">{doc.description}</p>
                            <div className="flex items-center justify-between text-xs font-bold text-txt-placeholder pt-4 border-t border-border-subtle">
                                <span>{doc.code}</span>
                                <span>{doc.date}</span>
                            </div>
                        </div>
                    ))}
                    {filteredDocs.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-bg-surface rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                            <Search className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-txt-muted font-semibold">Không tìm thấy quy chế nào.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- Detail View (3-panel) ---
    if (docLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-txt-muted font-semibold">Đang tải nội dung quy chế...</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-100px)] bg-transparent dark:bg-slate-950 font-sans gap-4">
            {/* LEFT SIDEBAR */}
            <div className="w-80 section-card flex flex-col shrink-0 overflow-hidden">
                <div className="p-5 section-card-header z-10 shrink-0">
                    <div className="mb-4">
                        <button
                            onClick={() => { setSearchParams({}); setSearchQuery(''); }}
                            className="flex items-center gap-1.5 text-xs font-bold text-txt-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
                        </button>
                        <h2 className="text-lg font-black text-txt-primary tracking-tight flex items-start gap-2">
                            <Gavel className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{selectedDoc?.title}</span>
                        </h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-placeholder" />
                        <input
                            type="text"
                            placeholder="Tìm điều khoản, quy định..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-txt-primary placeholder-gray-400 dark:placeholder-slate-500 shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {filteredChapters.map(chapter => {
                        const ChapIcon = ICON_MAP[chapter.icon || ''] || BookOpen;
                        return (
                            <button
                                key={chapter.id}
                                onClick={() => setSearchParams({ docId: selectedDocumentId || '', chapterId: chapter.id })}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${displayChapter?.id === chapter.id
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 shadow-sm'
                                    : 'hover:bg-bg-muted border border-transparent'
                                }`}
                            >
                                <div className={`mt-0.5 p-2 rounded-lg ${displayChapter?.id === chapter.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-txt-muted group-hover:bg-white dark:group-hover:bg-slate-600'}`}>
                                    <ChapIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${displayChapter?.id === chapter.id ? 'text-blue-600 dark:text-blue-400' : 'text-txt-placeholder'}`}>
                                        {chapter.code}
                                    </p>
                                    <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${displayChapter?.id === chapter.id ? 'text-txt-primary' : 'text-txt-muted'}`}>
                                        {chapter.title}
                                    </p>
                                </div>
                                {displayChapter?.id === chapter.id && <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 self-center" />}
                            </button>
                        );
                    })}
                    {filteredChapters.length === 0 && (
                        <div className="p-4 text-center mt-6">
                            <Search className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-txt-muted">Không tìm thấy nội dung</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-white/40 dark:bg-slate-900 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedDoc?.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-warning-100 dark:bg-warning-900/50 text-warning-700 dark:text-warning-400'}`}>
                            <FileCheck2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-txt-muted uppercase">Trạng thái</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${selectedDoc?.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400' : 'bg-warning-100 dark:bg-warning-900/60 text-warning-700 dark:text-warning-400'}`}>
                                    {selectedDoc?.status === 'active' ? 'Có Hiệu Lực' : 'Dự Thảo'}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-txt-primary">{selectedDoc?.code}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MIDDLE CONTENT */}
            <div className="flex-1 flex flex-col section-card overflow-hidden relative">
                <div className="h-16 border-b border-border flex items-center justify-between px-8 section-card-header backdrop-blur-md shrink-0 z-10 sticky top-0 shadow-sm">
                    {displayChapter ? (
                        <div>
                            <div className="flex items-center gap-2 text-xs text-txt-placeholder mb-1">
                                <span>Hệ thống Quy chế</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase line-clamp-1">{displayChapter.code}</span>
                            </div>
                            <h1 className="text-lg font-black text-txt-primary uppercase tracking-tight line-clamp-1">{displayChapter.title}</h1>
                        </div>
                    ) : <div />}
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={handleDownloadOriginal}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all border border-blue-200 dark:border-blue-800"
                        >
                            <Download className="w-4 h-4" />
                            <span>Tải bản gốc PDF</span>
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href).then(() => {
                                    addToast({ message: 'Đã sao chép liên kết quy chế', type: 'success' });
                                });
                            }}
                            className="p-2 text-txt-placeholder hover:text-gray-600 dark:hover:text-slate-200 hover:bg-bg-hover-row rounded-lg transition-all"
                            title="Sao chép liên kết"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-transparent dark:bg-slate-950" id="scrollable-content">
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {displayChapter?.articles.map((article, idx) => (
                            <div key={idx} id={article.id} className="group relative transition-all duration-500 scroll-mt-24">
                                <div className="flex items-center gap-3 mb-3 ml-1">
                                    <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest whitespace-nowrap shrink-0">
                                        {article.code}
                                    </span>
                                    {editingArticle?.id === article.id ? (
                                        <input
                                            value={editingArticle.title}
                                            onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                                            className="flex-1 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded bg-bg-surface text-lg font-bold text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <h3 className="text-lg font-bold text-txt-primary">{article.title}</h3>
                                    )}
                                </div>

                                <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 hover:shadow-md transition-shadow relative z-0" style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                                    <div className="absolute top-4 right-4 flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        {editingArticle?.id === article.id ? (
                                            <>
                                                <button onClick={() => setEditingArticle(null)} className="px-3 py-1.5 text-xs font-bold text-txt-muted bg-bg-muted hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-all">Huỷ</button>
                                                <button onClick={handleSaveArticle} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all">Lưu</button>
                                            </>
                                        ) : (
                                            <>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setEditingArticle({ id: article.id, title: article.title, content: article.content })}
                                                        className="p-1.5 bg-gray-50 dark:bg-slate-700 text-gray-400 hover:text-txt-muted hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-all"
                                                        title="Sửa điều khoản"
                                                    >
                                                        <PenTool className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={e => toggleBookmark(article.id, e)}
                                                    className={`p-1.5 rounded-lg transition-all ${bookmarkedIds.includes(article.id) ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-500' : 'bg-bg-subtle text-gray-400 hover:bg-bg-muted'}`}
                                                    title={bookmarkedIds.includes(article.id) ? 'Bỏ lưu' : 'Lưu điều khoản này'}
                                                >
                                                    <Bookmark className="w-4 h-4" strokeWidth={bookmarkedIds.includes(article.id) ? 3 : 2} fill={bookmarkedIds.includes(article.id) ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    onClick={() => handleCopyLink(article)}
                                                    className="p-1.5 bg-gray-50 dark:bg-slate-700 text-gray-400 hover:text-txt-muted hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-all"
                                                    title="Sao chép liên kết"
                                                >
                                                    {copiedArticleId === article.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="text-sm dark:prose-invert">
                                        {editingArticle?.id === article.id ? (
                                            <textarea
                                                value={editingArticle.content}
                                                onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                                                className="w-full min-h-[200px] p-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50/50 dark:bg-slate-800 text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed"
                                            />
                                        ) : (
                                            article.content.split('\n').map((line, i) =>
                                                line.trim() ? <p key={i} className="mb-2 text-txt-secondary text-justify">{line}</p> : <br key={i} />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!displayChapter || displayChapter.articles.length === 0) && (
                            <div className="py-16 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-txt-muted font-semibold">Chưa có điều khoản nào trong chương này.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="w-64 section-card flex flex-col shrink-0 overflow-hidden">
                {bookmarkedIds.length > 0 && (
                    <>
                        <div className="p-5 border-b border-border section-card-header shrink-0 z-10 shadow-sm">
                            <h3 className="text-xs font-black text-txt-primary uppercase tracking-widest flex items-center gap-2">
                                <Bookmark className="w-3.5 h-3.5 text-warning-500" fill="currentColor" />
                                Đã lưu ({bookmarkedIds.length})
                            </h3>
                        </div>
                        <div className="p-3 space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar bg-transparent dark:bg-slate-900 shrink-0 border-b border-border">
                            {bookmarkedIds.map(id => {
                                let articleMatch: RegArticleRow | null = null;
                                for (const chap of currentChapters) {
                                    const match = chap.articles.find(a => a.id === id);
                                    if (match) { articleMatch = match; break; }
                                }
                                if (!articleMatch) return null;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => {
                                            const parentChap = currentChapters.find(c => c.articles.some(a => a.id === id));
                                            if (parentChap) setSearchParams({ docId: selectedDocumentId || '', chapterId: parentChap.id, articleId: id });
                                        }}
                                        className="w-full text-left p-2.5 rounded-xl bg-bg-surface border border-border-subtle hover:border-blue-200 dark:hover:border-blue-700 shadow-sm transition-all flex items-center gap-2 group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">{articleMatch.code}</p>
                                            <p className="text-xs font-semibold text-txt-secondary truncate">{articleMatch.title}</p>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="p-5 border-b border-border section-card-header shrink-0 z-10 shadow-sm mt-auto md:mt-0">
                    <h3 className="text-xs font-black text-txt-primary uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Mục lục ({displayChapter?.code})
                    </h3>
                </div>

                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-transparent dark:bg-slate-900">
                    <div className="relative border-l-2 border-border ml-1.5 space-y-4">
                        {displayChapter?.articles.map((article, idx) => (
                            <div key={idx} className="relative pl-4 group">
                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors z-10 ring-4 ring-slate-50 dark:ring-slate-900" />
                                <button
                                    onClick={() => setSearchParams({ docId: selectedDocumentId || '', chapterId: selectedChapterId, articleId: article.id })}
                                    className="text-left w-full focus:outline-none"
                                >
                                    <p className="text-[10px] font-bold text-txt-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {article.code}
                                    </p>
                                    <p className="text-xs font-semibold text-txt-secondary group-hover:text-gray-900 dark:group-hover:text-slate-100 line-clamp-2 mt-0.5 leading-snug">
                                        {article.title}
                                    </p>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegulationsViewer;
