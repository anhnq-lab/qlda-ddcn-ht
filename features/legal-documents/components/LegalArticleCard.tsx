import React, { memo, useMemo, useState, useRef, useEffect } from 'react';
import { Bookmark, Link as LinkIcon, Check, Edit3, Save, X, Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { LegalArticleDB } from '../../../services/LegalDocumentService';
import { HighlightText } from './LegalUI';

interface LegalArticleCardProps {
    article: LegalArticleDB;
    selectedDocId: string;
    isActive: boolean;
    isExpanded: boolean;
    bookmarked: boolean;
    searchQuery: string;
    copiedId: string | null;
    toggleArticleExpansion: (id: string, e: React.MouseEvent) => void;
    toggleBookmark: (articleId: string, docId: string, extra?: { chapterId?: string; docShortTitle?: string; articleCode?: string; articleTitle?: string }) => void;
    handleCopy: (text: string, id: string) => void;
    onSaveEdit?: (articleId: string, newContent: string) => void;
    docShortTitle?: string;
}

// ============================================
// RICH CONTENT RENDERER - supports HTML tables in content
// ============================================
const RichLegalContent: React.FC<{
    content: string;
    searchQuery: string;
    isEditing: boolean;
    onContentChange: (newContent: string) => void;
    editorRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ content, searchQuery, isEditing, onContentChange, editorRef }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (contentRef.current) contentRef.current.focus();
    };

    const handleBlur = () => {
        if (!isEditing || !contentRef.current) return;
        onContentChange(contentRef.current.innerHTML);
    };

    const finalHtml = useMemo(() => {
        let raw = content || '';

        // If content is pure text with \n, and contains tables, format it once to HTML
        // This targets the initial hardcoded data from legalData.ts
        if (!raw.includes('class="rich-legal-block"')) {
            raw = raw.replace(/\\n/g, '\n');
            
            // CLEANUP MARKDOWN ARTIFACTS FROM DB
            // 1. Remove backslashes before dots in list items (e.g. "1\." -> "1.")
            raw = raw.replace(/(^|\n|\s)([a-zA-Z0-9]+)\\\./g, '$1$2.');
            // 2. Convert Markdown bold and italic to HTML tags
            raw = raw.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            raw = raw.replace(/\*(.*?)\*/g, '<i>$1</i>');
            // 3. Remove stray numbers on a single line (often page numbers from PDF extraction)
            raw = raw.replace(/(^|\n)\s*\d+\s*(\n|$)/g, '\n');

            const tableRegex = /<table[\s\S]*?<\/table>/gi;
            let lastIndex = 0;
            let match;
            let newHtml = '';

            while ((match = tableRegex.exec(raw)) !== null) {
                if (match.index > lastIndex) {
                    const textPart = raw.substring(lastIndex, match.index);
                    newHtml += `<div class="rich-legal-block whitespace-pre-line mb-4">${textPart}</div>`;
                }
                newHtml += `<div class="rich-legal-block legal-table-wrapper my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-600">${match[0]}</div>`;
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < raw.length) {
                const textPart = raw.substring(lastIndex);
                newHtml += `<div class="rich-legal-block whitespace-pre-line">${textPart}</div>`;
            }
            raw = newHtml;
        }

        // Apply Search Highlighting via simple RegExp replacement on string outside tags
        if (searchQuery && !isEditing) {
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})(?![^<]*>)`, 'gi');
            raw = raw.replace(regex, '<mark class="bg-warning-200 dark:bg-warning-800 text-warning-900 dark:text-warning-100 rounded px-0.5 font-medium">$1</mark>');
        }

        return raw;
    }, [content, searchQuery, isEditing]);

    return (
        <div
            ref={editorRef || contentRef}
            contentEditable={isEditing}
            onBlur={handleBlur}
            suppressContentEditableWarning={true}
            className={`transition-colors custom-scrollbar ${isEditing ? 'bg-warning-50 dark:bg-warning-900/10 p-4 rounded-xl border border-warning-400 border-dashed outline-none min-h-[100px]' : ''}`}
            dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
    );
};

const LegalArticleCard: React.FC<LegalArticleCardProps> = ({
    article, selectedDocId, isActive, isExpanded, bookmarked, searchQuery, copiedId,
    toggleArticleExpansion, toggleBookmark, handleCopy, onSaveEdit, docShortTitle
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(article.content || '');
    const editorRef = useRef<HTMLDivElement>(null);

    // Reset edited content if article changes
    useEffect(() => {
        setEditedContent(article.content || '');
    }, [article.content]);

    const handleSaveEdit = () => {
        let finalContent = editedContent;
        if (editorRef.current) {
            finalContent = editorRef.current.innerHTML;
        }
        if (onSaveEdit) {
            onSaveEdit(article.id, finalContent);
        }
        setEditedContent(finalContent);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(article.content || '');
        setIsEditing(false);
    };

    return (
        <div
            id={`article-${article.id}`}
            className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${isActive
                ? 'bg-primary-50/30 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 shadow-sm ring-1 ring-primary-500/20'
                : 'bg-bg-surface border-border hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-lg'
                } ${isEditing ? 'ring-2 ring-warning-400 ring-offset-2' : ''}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1" onClick={(e) => !isEditing && toggleArticleExpansion(article.id, e as unknown as React.MouseEvent)}>
                    <h5 className={`font-bold transition-colors ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-txt-primary'} flex items-center gap-2 ${!isEditing ? 'cursor-pointer' : ''}`}>
                        <span className="font-black text-primary-600 dark:text-primary-400">{article.code}.</span>
                        <HighlightText text={article.title} query={searchQuery} />
                        {isEditing && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200 rounded-full">
                                Chế độ chỉnh sửa
                            </span>
                        )}
                    </h5>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-lg transition-all flex items-center gap-1"
                                title="Hủy thay đổi"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="p-1.5 text-success-600 hover:text-success-700 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-all flex items-center gap-1 font-medium"
                                title="Lưu thay đổi"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                    // Make sure article is expanded when editing
                                    if (!isExpanded) {
                                        toggleArticleExpansion(article.id, e as unknown as React.MouseEvent);
                                    }
                                }}
                                className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/30 rounded-lg transition-all"
                                title="Chỉnh sửa nội dung"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleCopy(article.content || '', article.id)}
                                className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all"
                                title="Sao chép nội dung"
                            >
                                {copiedId === article.id ? <Check className="w-4 h-4 text-success-500" /> : <LinkIcon className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => toggleBookmark(article.id, selectedDocId, {
                                    chapterId: article.chapter_id,
                                    docShortTitle: docShortTitle || 'Văn bản đã lưu',
                                    articleCode: article.code,
                                    articleTitle: article.title
                                })}
                                className={`p-1.5 rounded-lg transition-all ${bookmarked
                                    ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                    : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                                    }`}
                                title={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu điều khoản này"}
                            >
                                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-txt-muted mb-3 pb-3 border-b border-dashed border-border italic opacity-80 leading-relaxed font-medium">
                        <HighlightText text={article.summary} query={searchQuery} />
                    </p>
                    <div className="text-txt-primary leading-loose space-y-2 font-normal relative text-justify">
                        {isEditing && (
                            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 bg-warning-100 dark:bg-warning-900/50 border border-warning-300 dark:border-warning-700 rounded-xl mb-4 text-txt-secondary shadow-sm">
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="In đậm"><Bold className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="In nghiêng"><Italic className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Gạch chân"><Underline className="w-4 h-4" /></button>

                                <span className="w-px h-5 bg-warning-300 dark:bg-primary-700 mx-1"></span>

                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Căn trái"><AlignLeft className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Căn giữa"><AlignCenter className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Căn phải"><AlignRight className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyFull', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Căn đều"><AlignJustify className="w-4 h-4" /></button>

                                <span className="w-px h-5 bg-warning-300 dark:bg-primary-700 mx-1"></span>

                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Danh sách chấm"><List className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Danh sách số"><ListOrdered className="w-4 h-4" /></button>

                                <span className="w-px h-5 bg-warning-300 dark:bg-primary-700 mx-1"></span>

                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Hoàn tác"><Undo className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors" title="Làm lại"><Redo className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('removeFormat', false); }} className="p-1.5 hover:bg-warning-200 dark:hover:bg-warning-800 rounded-lg transition-colors text-danger-600 dark:text-danger-400" title="Xóa định dạng"><Eraser className="w-4 h-4" /></button>

                                <div className="ml-auto text-xs font-semibold text-primary-700 dark:text-warning-400 bg-warning-200 dark:bg-warning-800/50 px-2 py-1 rounded-lg">
                                    Công cụ chỉnh sửa
                                </div>
                            </div>
                        )}
                        <RichLegalContent
                            content={editedContent}
                            searchQuery={searchQuery}
                            isEditing={isEditing}
                            onContentChange={setEditedContent}
                            editorRef={editorRef}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(LegalArticleCard);
