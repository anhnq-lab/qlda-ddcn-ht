import React, { useState, useMemo, useEffect } from 'react';
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
    Loader2
} from 'lucide-react';

const RegulationsViewer: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedDocumentId = searchParams.get('docId');
    const urlChapterId = searchParams.get('chapterId');
    const articleIdParam = searchParams.get('articleId');

    const [regulationsData, setRegulationsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [savedArticles, setSavedArticles] = useState<string[]>([]);
    const [commentText, setCommentText] = useState("");

    // --- MANUAL EDITING FEATURE ---
    const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editedArticles, setEditedArticles] = useState<Record<string, {title: string, content: string}>>({});

    useEffect(() => {
        // Load dynamic data
        import('./data/regulationsData').then(module => {
            setRegulationsData(module.regulationsData);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load regulations data:", err);
            setIsLoading(false);
        });

        const saved = localStorage.getItem('editedRegulations');
        if (saved) {
            try { setEditedArticles(JSON.parse(saved)); } catch (e) {}
        }
    }, []);

    useEffect(() => {
        if (!isLoading && regulationsData.length > 0 && selectedDocumentId) {
            if (articleIdParam) {
                const doc = regulationsData.find(d => d.id === selectedDocumentId);
                const parentChap = doc?.chapters.find((c: any) => c.articles.some((a: any) => a.id === articleIdParam));
                
                if (parentChap) {
                    if (urlChapterId !== parentChap.id) {
                        setSearchParams({ docId: selectedDocumentId, chapterId: parentChap.id, articleId: articleIdParam });
                        return;
                    }
                    
                    const timer = setTimeout(() => {
                        handleScrollToArticle(articleIdParam);
                    }, 500);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [articleIdParam, selectedDocumentId, urlChapterId, regulationsData, isLoading, setSearchParams]);

    const handleSaveEdit = (articleId: string) => {
        const newEdits = { ...editedArticles, [articleId]: { title: editTitle, content: editContent } };
        setEditedArticles(newEdits);
        localStorage.setItem('editedRegulations', JSON.stringify(newEdits));
        setEditingArticleId(null);
    };

    const startEdit = (article: any) => {
        setEditTitle(editedArticles[article.id]?.title || article.title);
        const originalContent = typeof article.content === 'string' ? article.content : "Nội dung biểu mẫu không thể sửa text.";
        setEditContent(editedArticles[article.id]?.content || originalContent);
        setEditingArticleId(article.id);
    };
    // -----------------------------

    const selectedDocument = useMemo(() => regulationsData.find(d => d.id === selectedDocumentId) || null, [selectedDocumentId, regulationsData]);
    const currentChapters = selectedDocument?.chapters || [];

    const selectedChapterId = useMemo(() => {
        if (urlChapterId) return urlChapterId;
        if (currentChapters.length > 0) return currentChapters[0].id;
        return "CH1";
    }, [urlChapterId, currentChapters]);

    // Enhance filtering with raw text fallback
    const filteredChapters = useMemo(() => {
        if (!searchQuery) return currentChapters;
        const lowerQ = searchQuery.toLowerCase();
        
        return currentChapters.map((chapter: any) => {
            const matchingArticles = chapter.articles.filter((a: any) => {
                const matchCodeAndTitle = a.title.toLowerCase().includes(lowerQ) || a.code.toLowerCase().includes(lowerQ);
                // Simple raw text matching using JSON.stringify for the react nodes, naive but effective for filtering
                const rawString = typeof a.content === 'string' ? a.content : JSON.stringify(a.content);
                const matchContent = rawString.toLowerCase().includes(lowerQ);
                return matchCodeAndTitle || matchContent;
            });
            
            return {
                ...chapter,
                articles: matchingArticles,
                isMatch: chapter.title.toLowerCase().includes(lowerQ) || chapter.code.toLowerCase().includes(lowerQ) || matchingArticles.length > 0
            };
        }).filter((c: any) => c.isMatch);
    }, [searchQuery, currentChapters]);

    // Active displayed chapter (could be filtered)
    const displayChapter = filteredChapters.find((c: any) => c.id === selectedChapterId) || filteredChapters[0];

    const toggleBookmark = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSavedArticles(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    };

    const handleScrollToArticle = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Add a highlight class temporarily
            element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
            }, 2000);
        }
    };

    const handleDownloadOriginal = () => {
        // Logic to download original PDF
        alert("Đang tải xuống tài liệu gốc QĐ số 188/QĐ-BQLDA.pdf...");
    };

    const handleSubmitComment = (articleId: string) => {
        if(!commentText.trim()) return;
        // In real backend, we'd send to Supabase here.
        alert("Đã gửi phản hồi / câu hỏi đến bộ phận Pháp chế.");
        setCommentText("");
    };

    // Grid View for documents
    if (isLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center bg-transparent dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-txt-muted font-semibold">Đang tải dữ liệu quy chế...</p>
            </div>
        );
    }

    if (!selectedDocument) {
        const filteredDocs = regulationsData.filter(d => 
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-bg-subtle border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-txt-primary"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.map(doc => (
                        <div 
                            key={doc.id}
                            onClick={() => { 
                                const firstChapterId = doc.chapters.length > 0 ? doc.chapters[0].id : "CH1";
                                setSearchParams({ docId: doc.id, chapterId: firstChapterId });
                                setSearchQuery(""); 
                            }}
                            className="bg-bg-surface border border-border rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${doc.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-400'}`}>
                                    {doc.status === 'active' ? 'Có Hiệu Lực' : 'Dự Thảo'}
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
                            <p className="text-txt-muted font-semibold">Không tìm thấy quy chế nào phù hợp.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-100px)] bg-transparent dark:bg-slate-950 font-sans gap-4">

            {/* LEFT SIDEBAR - NAVIGATION */}
            <div className="w-80 section-card flex flex-col shrink-0 overflow-hidden">
                <div className="p-5 section-card-header z-10 shrink-0">
                    <div className="mb-4">
                        <button 
                            onClick={() => { setSearchParams({}); setSearchQuery(""); }}
                            className="flex items-center gap-1.5 text-xs font-bold text-txt-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
                        </button>
                        <h2 className="text-lg font-black text-txt-primary tracking-tight flex items-start gap-2">
                            <Gavel className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{selectedDocument.title}</span>
                        </h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-placeholder" />
                        <input
                            type="text"
                            placeholder="Tìm điều khoản, quy định..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-txt-primary placeholder-gray-400 dark:placeholder-slate-500 shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {filteredChapters.map((chapter: any) => (
                        <button
                            key={chapter.id}
                            onClick={() => setSearchParams({ docId: selectedDocumentId || "", chapterId: chapter.id })}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${(displayChapter?.id === chapter.id)
                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 shadow-sm'
                                : 'hover:bg-bg-muted border border-transparent'
                                }`}
                        >
                            <div className={`mt-0.5 p-2 rounded-lg ${(displayChapter?.id === chapter.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-txt-muted group-hover:bg-white dark:group-hover:bg-slate-600'}`}>
                                {chapter.icon ? <chapter.icon className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${(displayChapter?.id === chapter.id) ? 'text-blue-600 dark:text-blue-400' : 'text-txt-placeholder'}`}>
                                    {chapter.code}
                                </p>
                                <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${(displayChapter?.id === chapter.id) ? 'text-txt-primary' : 'text-txt-muted'}`}>
                                    {chapter.title}
                                </p>
                                {searchQuery && chapter.articles.length > 0 && (
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Tồn tại {chapter.articles.length} điều kiện</p>
                                )}
                            </div>
                            {(displayChapter?.id === chapter.id) && <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 self-center" />}
                        </button>
                    ))}
                    {filteredChapters.length === 0 && (
                        <div className="p-4 text-center mt-6">
                            <Search className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-txt-muted">Không tìm thấy nội dung</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-white/40 dark:bg-slate-900 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedDocument.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-warning-100 dark:bg-warning-900/50 text-warning-700 dark:text-warning-400'}`}>
                            <FileCheck2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-txt-muted uppercase">Trạng thái</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${selectedDocument.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400' : 'bg-warning-100 dark:bg-warning-900/60 text-warning-700 dark:text-warning-400'}`}>
                                    {selectedDocument.status === 'active' ? 'Có Hiệu Lực' : 'Dự Thảo'}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-txt-primary">{selectedDocument.code}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MIDDLE CONTENT - DETAILS */}
            <div className="flex-1 flex flex-col section-card overflow-hidden relative">
                {/* Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-8 section-card-header backdrop-blur-md shrink-0 z-10 sticky top-0 shadow-sm">
                    {displayChapter ? (
                        <div>
                         <div className="flex items-center gap-2 text-xs text-txt-placeholder mb-1">
                            <span>Hệ thống Quy chế</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase line-clamp-1">{displayChapter?.code}</span>
                         </div>
                         <h1 className="text-lg font-black text-txt-primary uppercase tracking-tight line-clamp-1">{displayChapter?.title}</h1>
                       </div>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={handleDownloadOriginal}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all border border-blue-200 dark:border-blue-800"
                        >
                            <Download className="w-4 h-4" />
                            <span>Tải bản gốc PDF</span>
                        </button>
                        <button className="p-2 text-txt-placeholder hover:text-gray-600 dark:hover:text-slate-200 hover:bg-bg-hover-row rounded-lg transition-all" title="Chia sẻ"><Share2 className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-transparent dark:bg-slate-950" id="scrollable-content">
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {displayChapter?.articles.map((article: any, idx: number) => (
                            <div key={idx} id={article.id} className="group relative transition-all duration-500 animate-in slide-in-from-bottom-2 scroll-mt-24">
                                {/* Article Header Badge */}
                                <div className="flex items-center gap-3 mb-3 ml-1">
                                    <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest whitespace-nowrap shrink-0">
                                        {article.code}
                                    </span>
                                    {editingArticleId === article.id ? (
                                        <input 
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="flex-1 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded bg-bg-surface text-lg font-bold text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <h3 className="text-lg font-bold text-txt-primary">{editedArticles[article.id]?.title || article.title}</h3>
                                    )}
                                </div>

                                {/* Content Card */}
                                <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 hover:shadow-md transition-shadow relative z-0" style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        {editingArticleId === article.id ? (
                                            <>
                                                <button onClick={() => setEditingArticleId(null)} className="px-3 py-1.5 text-xs font-bold text-txt-muted bg-bg-muted hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-all">Huỷ</button>
                                                <button onClick={() => handleSaveEdit(article.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all">Lưu</button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => startEdit(article)}
                                                    className="p-1.5 bg-gray-50 dark:bg-slate-700 text-gray-400 hover:text-txt-muted hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-all"
                                                    title="Sửa điều khoản"
                                                >
                                                    <PenTool className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => toggleBookmark(article.id, e)}
                                                    className={`p-1.5 rounded-lg transition-all ${savedArticles.includes(article.id) ? 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-500' : 'bg-bg-subtle text-gray-400 hover:bg-bg-muted'}`}
                                                    title={savedArticles.includes(article.id) ? "Bỏ lưu" : "Lưu điều khoản này"}
                                                >
                                                    <Bookmark className="w-4 h-4" strokeWidth={savedArticles.includes(article.id) ? 3 : 2} fill={savedArticles.includes(article.id) ? "currentColor" : "none"} />
                                                </button>
                                                <button className="p-1.5 bg-gray-50 dark:bg-slate-700 text-gray-400 hover:text-txt-muted hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-all" title="Sao chép liên kết">
                                                    <Link2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setActiveCommentId(activeCommentId === article.id ? null : article.id)}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${activeCommentId === article.id ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-slate-700 text-txt-muted hover:bg-gray-100 dark:hover:bg-slate-600'}`}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {article.comments?.length || 0}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Dynamic Content Rendering */}
                                    <div className="text-sm dark:prose-invert">
                                        {editingArticleId === article.id ? (
                                            <textarea 
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full min-h-[200px] p-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50/50 dark:bg-slate-800 text-txt-primary focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed"
                                            />
                                        ) : (
                                            typeof (editedArticles[article.id]?.content || article.content) === 'string' ? (
                                                (editedArticles[article.id]?.content || article.content).split('\n').map((line: string, i: number) => <p key={i} className="mb-2 text-txt-secondary text-justify">{line}</p>)
                                            ) : (
                                                <div className="article-content-wrapper text-txt-secondary text-justify">{article.content}</div>
                                            )
                                        )}
                                    </div>

                                    {/* Comments / QA Section */}
                                    {(activeCommentId === article.id) && (
                                        <div className="mt-6 pt-6 border-t border-border animate-in fade-in">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-xs font-black text-txt-placeholder uppercase tracking-widest flex items-center gap-2">
                                                    <HelpCircle className="w-4 h-4" /> Hỏi đáp & Thảo luận
                                                </h4>
                                            </div>

                                            <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                {article.comments?.map((comment: any) => (
                                                    <div key={comment.id} className="flex gap-3 items-start">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                                                            {comment.user.charAt(0)}
                                                        </div>
                                                        <div className="bg-bg-subtle rounded-2xl rounded-tl-none p-3 flex-1 border border-gray-100 dark:border-slate-600/50">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-txt-primary">{comment.user}</span>
                                                                <span className="text-[10px] text-txt-placeholder">{comment.date}</span>
                                                            </div>
                                                            <p className="text-xs text-txt-muted">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!article.comments || article.comments.length === 0) && (
                                                    <p className="text-xs text-txt-placeholder italic text-center py-4">Chưa có bình luận hay thắc mắc nào. Bạn cần làm rõ nội dung Điều khoản này?</p>
                                                )}
                                            </div>

                                            {/* Add Comment Input */}
                                            <div className="flex gap-3 items-center mt-4">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-slate-600 flex items-center justify-center text-white shrink-0 shadow-sm border border-transparent dark:border-slate-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Viết thắc mắc để báo cáo về Phòng Pháp chế..."
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSubmitComment(article.id);
                                                        }}
                                                        className="w-full pl-4 pr-10 py-2.5 bg-bg-subtle border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-txt-primary placeholder-gray-400 dark:placeholder-slate-500"
                                                    />
                                                    <button 
                                                        onClick={() => handleSubmitComment(article.id)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                                    >
                                                        <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Footer Notes */}
                        {displayChapter?.type === 'chart' && (
                            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-800/50 rounded-xl text-xs text-warning-800 dark:text-warning-400 flex items-start gap-3 mt-4 shadow-sm">
                                <Info className="w-5 h-5 text-warning-600 dark:text-warning-500 shrink-0" />
                                <div>
                                    <p className="font-bold mb-1">Lưu ý về sơ đồ:</p>
                                    <p>Sơ đồ trên thể hiện mối quan hệ báo cáo trực tiếp. Các phòng ban có trách nhiệm phối hợp ngang hàng để giải quyết công việc chung của Ban QLDA.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR - TOC & BOOKMARKS */}
            <div className="w-64 section-card flex flex-col shrink-0 overflow-hidden">
                {/* Save Articles Tab */}
                {savedArticles.length > 0 && (
                    <div className="p-5 border-b border-border section-card-header shrink-0 z-10 shadow-sm">
                        <h3 className="text-xs font-black text-txt-primary uppercase tracking-widest flex items-center gap-2">
                            <Bookmark className="w-3.5 h-3.5 text-warning-500" fill="currentColor" />
                            Đã lưu ({savedArticles.length})
                        </h3>
                    </div>
                )}
                
                {savedArticles.length > 0 && (
                     <div className="p-3 space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar bg-transparent dark:bg-slate-900 shrink-0 border-b border-border">
                        {savedArticles.map(id => {
                            let articleMatch: any = null;
                            for (const chap of currentChapters) {
                                const match = chap.articles.find((a: any) => a.id === id);
                                if (match) { articleMatch = match; break; }
                            }
                            if (!articleMatch) return null;
                            return (
                                <button
                                    key={id}
                                    onClick={() => {
                                        const parentChap = currentChapters.find((c: any) => c.articles.some((a: any) => a.id === id));
                                        if (parentChap) {
                                            setSearchParams({ docId: selectedDocumentId || "", chapterId: parentChap.id, articleId: id });
                                        }
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
                )}

                {/* Table of Contents */}
                <div className="p-5 border-b border-border section-card-header shrink-0 z-10 shadow-sm mt-auto md:mt-0">
                     <h3 className="text-xs font-black text-txt-primary uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Mục lục ({displayChapter?.code})
                    </h3>
                </div>

                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-transparent dark:bg-slate-900">
                    <div className="relative border-l-2 border-border ml-1.5 space-y-4">
                        {displayChapter?.articles.map((article: any, idx: number) => (
                            <div key={idx} className="relative pl-4 group">
                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors z-10 ring-4 ring-slate-50 dark:ring-slate-900" />
                                
                                <button 
                                    onClick={() => setSearchParams({ docId: selectedDocumentId || "", chapterId: selectedChapterId, articleId: article.id })}
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