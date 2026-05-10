import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DocType } from '../../services/LegalDocumentService';
import {
    useDocumentList,
    useDocumentDetail,
    useLegalStats,
    useDeepSearch,
    useDebounce,
    usePrefetchDocument,
} from './useLegalDocuments';
import { useBookmarks, useRecentlyViewed, useReadingPrefs, useLegalEditStore } from './useLegalStorage';
import { LegalHeader } from './components/LegalHeader';
import { LegalSidebar } from './components/LegalSidebar';
import { LegalDetail } from './components/LegalDetail';
import { LegalTOC } from './components/LegalTOC';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface LegalDocumentSearchProps {
    isEmbedded?: boolean;
    initialSearchQuery?: string;
    initialDocId?: string | null;
    initialArticleId?: string | null;
}

const LegalDocumentSearch: React.FC<LegalDocumentSearchProps> = ({ 
    isEmbedded = false, 
    initialSearchQuery = '', 
    initialDocId = null, 
    initialArticleId = null 
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlDocId = searchParams.get('docId');
    const urlArticleId = searchParams.get('articleId');
    const urlFrom = searchParams.get('from');
    const navigate = useNavigate();

    // Store fromPath in state so it survives setSearchParams calls
    const [fromPath] = useState<string | null>(urlFrom);

    // 1. Shared State
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || urlDocId || '');
    const [filterType, setFilterType] = useState<DocType | ''>('');

    // UI State
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [readingMode, setReadingMode] = useState(false);
    const [showTOC, setShowTOC] = useState(true);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
    const [showDeepSearch, setShowDeepSearch] = useState(false);
    const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

    // Hooks
    const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
    const { recentlyViewed, addView } = useRecentlyViewed();
    const { prefs } = useReadingPrefs();
    const { saveEdit, edits } = useLegalEditStore();
    const fontSizeMap = { sm: 13, base: 14, lg: 16 } as const;
    const fontSize = fontSizeMap[prefs?.fontSize || 'base'];

    const contentRef = useRef<HTMLDivElement>(null);

    // Track viewed document
    useEffect(() => {
        if (selectedDocId) {
            addView(selectedDocId);
        }
    }, [selectedDocId, addView]);

    // ---- Supabase data fetching ----
    const { data: listResult, isLoading: isListLoading } = useDocumentList({
        searchQuery: debouncedSearchQuery,
        type: filterType,
        pageSize: 100,
    });
    const { data: statsData } = useLegalStats();
    const { data: selectedDocRaw, isLoading: isDetailLoading } = useDocumentDetail(selectedDocId || null);
    const { data: deepSearchRaw } = useDeepSearch(selectedDocId || null, debouncedSearchQuery);
    const prefetchDocument = usePrefetchDocument();

    // Mapping raw data directly since components have been updated
    const filteredDocs = useMemo(() => listResult?.documents ?? [], [listResult]);
    const selectedDoc = useMemo(() => selectedDocRaw ?? null, [selectedDocRaw]);
    const stats = useMemo(() => ({
        total: statsData?.total ?? 0,
        byType: statsData?.byType ?? {},
        byStatus: statsData?.byStatus ?? {},
    }), [statsData]);
    const deepSearchResults = useMemo(() => {
        if (!deepSearchRaw || debouncedSearchQuery.length < 2) return [];
        return deepSearchRaw.slice(0, 10).map(art => ({
            docId: art.document_id,
            chapterId: art.chapter_id,
            articleId: art.id,
            articleCode: art.code,
            articleTitle: art.title,
            snippet: art.summary ?? art.content?.slice(0, 200) ?? '',
        }));
    }, [deepSearchRaw, debouncedSearchQuery]);

    // Auto-select first document when list loads and nothing selected
    useEffect(() => {
        if (!selectedDocId && filteredDocs.length > 0) {
            setSelectedDocId(filteredDocs[0].id);
        }
    }, [filteredDocs, selectedDocId]);

    const isLoading = isListLoading || isDetailLoading;

    // Set default expanded content on doc change and handle initial deep link
    useEffect(() => {
        if (selectedDoc) {
            // Preserve from param when updating URL
            if (!isEmbedded) {
                const newParams: Record<string, string> = { docId: selectedDoc.id };
                if (fromPath) newParams.from = fromPath;
                setSearchParams(newParams);
            }

            // if we haven't loaded anything yet or we switch docs
            if (expandedChapters.size === 0 || initialArticleId) {
                // If there's a urlArticleId or initialArticleId, we should open that chapter instead
                const targetArticleId = initialArticleId || urlArticleId;
                const chapters = selectedDoc.chapters || [];
                let targetChapterId = chapters[0]?.id;
                
                if (targetArticleId) {
                    const chapterWithArticle = chapters.find(c => (c.articles || []).some(a => a.id === targetArticleId));
                    if (chapterWithArticle) {
                        targetChapterId = chapterWithArticle.id;
                        setTimeout(() => scrollToArticle(targetArticleId, targetChapterId), 300);
                    }
                }
                if (targetChapterId) {
                    setExpandedChapters(new Set([targetChapterId]));
                }
                const allArticles = chapters.flatMap(c => (c.articles || []).map(a => a.id));
                setExpandedArticles(new Set(allArticles));
            }
        }
    }, [selectedDocId, selectedDoc, isEmbedded, fromPath, initialArticleId, urlArticleId]);

    // Handlers
    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) next.delete(chapterId);
            else next.add(chapterId);
            return next;
        });
    };

    const toggleArticleExpansion = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedArticles(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const scrollToArticle = (articleId: string, chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            next.add(chapterId);
            return next;
        });
        setExpandedArticles(prev => {
            const next = new Set(prev);
            next.add(articleId);
            return next;
        });

        setTimeout(() => {
            const element = document.getElementById(`article-${articleId}`);
            if (element && contentRef.current) {
                const containerInfo = contentRef.current.getBoundingClientRect();
                const elementInfo = element.getBoundingClientRect();

                contentRef.current.scrollTo({
                    top: contentRef.current.scrollTop + (elementInfo.top - containerInfo.top) - 100,
                    behavior: 'smooth'
                });

                setActiveArticleId(articleId);
                setTimeout(() => setActiveArticleId(null), 3000);
            }
        }, 100);
    };

    const navigateDeepSearch = (docId: string, chapterId: string) => {
        setSelectedDocId(docId);
        setShowDeepSearch(false);
        setExpandedChapters(new Set([chapterId]));
        setShowPdfViewer(false);
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyLink = (articleId: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('docId', selectedDocId);
        url.searchParams.set('articleId', articleId);
        navigator.clipboard.writeText(url.toString());
        setCopiedLinkId(articleId);
        setTimeout(() => setCopiedLinkId(null), 2000);
    }

    const handlePrint = () => {
        window.print();
    };

    // Helper: map paths to friendly labels for back button 
    const fromLabel = fromPath ? (
        fromPath.includes('/projects') ? 'Quản lý dự án' :
            fromPath.includes('/dashboard') ? 'Tổng quan' :
                fromPath.includes('/contracts') ? 'Hợp đồng' :
                    fromPath.includes('/bidding') ? 'Đấu thầu' :
                        'Trang trước'
    ) : null;

    if (isLoading && filteredDocs.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-140px)]">
                <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                    <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="text-sm font-medium">Đang tải văn bản pháp luật...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${readingMode ? 'fixed inset-0 z-50 bg-bg-surface p-4' : (isEmbedded ? 'h-full' : 'h-[calc(100vh-140px)]')} animate-in fade-in duration-300`}>
            {/* Back Navigation Banner */}
            {!isEmbedded && fromPath && fromLabel && (
                <div className="shrink-0 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        ← Quay lại {fromLabel}
                    </button>
                </div>
            )}

            {/* Header Section */}
            <LegalHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                stats={stats}
                showDeepSearch={showDeepSearch}
                setShowDeepSearch={setShowDeepSearch}
                deepSearchResults={deepSearchResults}
                navigateDeepSearch={navigateDeepSearch}
                readingMode={readingMode}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 gap-5 overflow-hidden">
                <LegalSidebar
                    readingMode={readingMode}
                    showBookmarks={showBookmarks}
                    setShowBookmarks={setShowBookmarks}
                    filteredDocs={filteredDocs}
                    bookmarks={bookmarks}
                    recentlyViewed={recentlyViewed}
                    selectedDocId={selectedDocId}
                    setSelectedDocId={setSelectedDocId}
                    scrollToArticle={scrollToArticle}
                    setExpandedChapters={setExpandedChapters}
                    setShowPdfViewer={setShowPdfViewer}
                    setShowDeepSearch={setShowDeepSearch}
                />

                <div className="flex-1 bg-bg-surface rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* Content Area with optional TOC */}
                    {selectedDoc ? (
                        <LegalDetail
                            selectedDoc={selectedDoc}
                            contentRef={contentRef}
                            showPdfViewer={showPdfViewer}
                            setShowPdfViewer={setShowPdfViewer}
                            readingMode={readingMode}
                            setReadingMode={setReadingMode}
                            handlePrint={handlePrint}
                            fontSize={fontSize}
                            searchQuery={debouncedSearchQuery}
                            isBookmarked={isBookmarked}
                            toggleBookmark={toggleBookmark}
                            expandedChapters={expandedChapters}
                            toggleChapter={toggleChapter}
                            activeArticleId={activeArticleId}
                            expandedArticles={expandedArticles}
                            toggleArticleExpansion={toggleArticleExpansion}
                            copiedId={copiedId}
                            handleCopy={handleCopy}
                            copiedLinkId={copiedLinkId}
                            handleCopyLink={handleCopyLink}
                            edits={edits}
                            onSaveEdit={saveEdit}
                        >
                            {/* Quick TOC (Right Mini Panel) */}
                            {showTOC && selectedDoc.chapters.length > 0 && !showPdfViewer && (
                                <LegalTOC
                                    selectedDoc={selectedDoc}
                                    scrollToArticle={scrollToArticle}
                                    setExpandedChapters={setExpandedChapters}
                                    activeArticleId={activeArticleId}
                                />
                            )}
                        </LegalDetail>
                    ) : (
                        <LegalDetail
                            selectedDoc={null}
                            contentRef={contentRef}
                            showPdfViewer={false} setShowPdfViewer={() => { }}
                            readingMode={false} setReadingMode={() => { }}
                            handlePrint={() => { }} fontSize={14}
                            searchQuery="" isBookmarked={() => false} toggleBookmark={() => { }}
                            expandedChapters={new Set()} toggleChapter={() => { }}
                            activeArticleId={null} expandedArticles={new Set()}
                            toggleArticleExpansion={() => { }} copiedId={null} handleCopy={() => { }}
                            copiedLinkId={null} handleCopyLink={() => { }}
                            edits={{}} onSaveEdit={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalDocumentSearch;
