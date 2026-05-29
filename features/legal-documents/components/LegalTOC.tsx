import React, { useState } from 'react';
import { AlignLeft, Hash, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { LegalDocumentDB } from '../../../services/LegalDocumentService';

interface LegalTOCProps {
    selectedDoc: LegalDocumentDB;
    scrollToArticle: (articleId: string, chapterId: string) => void;
    setExpandedChapters: React.Dispatch<React.SetStateAction<Set<string>>>;
    activeArticleId?: string | null;
}

export const LegalTOC: React.FC<LegalTOCProps> = ({ selectedDoc, scrollToArticle, setExpandedChapters, activeArticleId }) => {
    const chapters = selectedDoc.chapters || [];
    const [expandedTocChapters, setExpandedTocChapters] = useState<Set<string>>(
        new Set(chapters.map(c => c.id))
    );

    const toggleTocChapter = (chapterId: string) => {
        setExpandedTocChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) next.delete(chapterId);
            else next.add(chapterId);
            return next;
        });
    };

    return (
        <div className="w-72 border-r border-border bg-bg-subtle overflow-y-auto custom-scrollbar shrink-0 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-gray-50/95 dark:bg-slate-800 backdrop-blur-sm px-4 py-3 border-b border-border z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Mục lục văn bản
                </span>
                <p className="text-[10px] text-txt-placeholder mt-0.5 font-medium">
                    {chapters.length} chương · {chapters.reduce((s, c) => s + (c.articles?.length || 0), 0)} điều
                </p>
            </div>

            {/* Chapters & Articles */}
            <div className="flex-1 p-3 space-y-1">
                {chapters.map(ch => {
                    const isChExpanded = expandedTocChapters.has(ch.id);
                    return (
                        <div key={`toc-${ch.id}`} className="mb-1">
                            {/* Chapter header */}
                            <button
                                onClick={() => toggleTocChapter(ch.id)}
                                className="w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-xl hover:bg-bg-surface dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div className="mt-0.5 shrink-0">
                                    {isChExpanded
                                        ? <ChevronDown className="w-3.5 h-3.5 text-primary-500" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider">{ch.code}</p>
                                    <p className="text-[11px] font-bold text-txt-secondary leading-snug mt-0.5 line-clamp-2">{ch.title}</p>
                                </div>
                            </button>

                            {/* Articles list */}
                            {isChExpanded && (
                                <div className="ml-4 pl-3 border-l-2 border-primary-100 dark:border-primary-900/40 space-y-0.5 mt-1 mb-2">
                                    {(ch.articles || []).map(art => {
                                        const isActive = activeArticleId === art.id;
                                        return (
                                            <button
                                                key={`toc-${art.id}`}
                                                onClick={() => {
                                                    setExpandedChapters(prev => {
                                                        const next = new Set(prev);
                                                        next.add(ch.id);
                                                        return next;
                                                    });
                                                    scrollToArticle(art.id, ch.id);
                                                }}
                                                className={`w-full text-left text-[11px] py-1.5 px-2.5 rounded-lg transition-all flex items-start gap-2 group ${isActive
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-bold ring-1 ring-primary-200 dark:ring-primary-800'
                                                    : 'text-txt-muted hover:bg-bg-surface dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400'
                                                    }`}
                                                title={`${art.code}: ${art.title}`}
                                            >
                                                <Hash className={`w-3 h-3 mt-0.5 shrink-0 ${isActive ? 'text-primary-500' : 'opacity-40 group-hover:opacity-100'}`} />
                                                <span className="leading-snug">
                                                    <span className="font-bold">{art.code}.</span>{' '}
                                                    <span className="line-clamp-2">{art.title}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
