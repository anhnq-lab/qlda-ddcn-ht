import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Paperclip, Upload, Trash2, Download, FileText, Image,
    FileSpreadsheet, File, Loader2, X, Eye
} from 'lucide-react';
import { DocumentService, DocumentAttachment, RelatedType, FILE_TYPE_LABELS } from '../../services/DocumentService';
import { formatDate } from '../../utils/format';

// ========================================
// DOCUMENT ATTACHMENTS
// Component dùng chung — đính kèm tài liệu
// ========================================

interface DocumentAttachmentsProps {
    relatedType: RelatedType;
    relatedId: string;
    compact?: boolean; // hiển thị nhỏ gọn
}

const FILE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    pdf: { icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
    image: { icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    excel: { icon: FileSpreadsheet, color: 'text-green-500 bg-green-50 dark:bg-green-900/30' },
    word: { icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    other: { icon: File, color: 'text-gray-500 bg-slate-50 dark:bg-slate-800 dark:bg-slate-700' },
};

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.zip,.rar';

export const DocumentAttachments: React.FC<DocumentAttachmentsProps> = ({
    relatedType,
    relatedId,
    compact = false,
}) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [description, setDescription] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const labels = FILE_TYPE_LABELS[relatedType] || [];

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ['documents', relatedType, relatedId],
        queryFn: () => DocumentService.getByRelated(relatedType, relatedId),
        enabled: !!relatedId,
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) =>
            DocumentService.upload(file, relatedType, relatedId, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', relatedType, relatedId] });
            setDescription('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, path }: { id: string; path: string }) =>
            DocumentService.delete(id, path),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['documents', relatedType, relatedId] }),
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            alert('File quá lớn (tối đa 50MB)');
            return;
        }
        uploadMutation.mutate(file);
    };

    const handleDescriptionUpload = (label: string) => {
        setDescription(label);
        fileInputRef.current?.click();
    };

    const iconClass = (fileType: string) => {
        const type = DocumentService.getFileIcon(fileType);
        return FILE_ICONS[type] || FILE_ICONS.other;
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h5 className={`font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
                    <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                    Tài liệu đính kèm
                    {documents.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded text-xs">{documents.length}</span>
                    )}
                </h5>
            </div>

            {/* Quick upload buttons */}
            <div className="flex flex-wrap gap-1.5">
                {labels.map(label => (
                    <button
                        key={label}
                        onClick={() => handleDescriptionUpload(label)}
                        disabled={uploadMutation.isPending}
                        className="px-2.5 py-1 text-xs rounded-lg border border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                    >
                        <Upload className="w-3 h-3 inline mr-1" />
                        {label}
                    </button>
                ))}
                <button
                    onClick={() => { setDescription(''); fileInputRef.current?.click(); }}
                    disabled={uploadMutation.isPending}
                    className="px-2.5 py-1 text-xs rounded-lg border border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                    <Paperclip className="w-3 h-3 inline mr-1" />
                    Tải file...
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload progress */}
            {uploadMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải lên{description ? `: ${description}` : ''}...
                </div>
            )}

            {uploadMutation.isError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                    Lỗi: {(uploadMutation.error as Error)?.message}
                </div>
            )}

            {/* Documents list */}
            {isLoading ? (
                <div className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tải...</div>
            ) : documents.length > 0 ? (
                <div className="space-y-4">
                    {/* Non-image files */}
                    {documents.filter(doc => !doc.fileType.startsWith('image/')).length > 0 && (
                        <div className="space-y-1.5">
                            {documents
                                .filter(doc => !doc.fileType.startsWith('image/'))
                                .map(doc => {
                                    const { icon: Icon, color } = iconClass(doc.fileType);
                                    const content = (
                                        <>
                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color} group-hover:scale-105 transition-transform`}>
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {doc.fileName}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-400">
                                                    {doc.description && <span className="text-blue-500 dark:text-blue-400">{doc.description}</span>}
                                                    <span>{DocumentService.formatSize(doc.fileSize)}</span>
                                                    <span>• {formatDate(doc.createdAt)}</span>
                                                </div>
                                            </div>
                                        </>
                                    );

                                    return (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 group transition-colors"
                                        >
                                            {doc.publicUrl ? (
                                                <a
                                                    href={doc.publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                                                    title="Mở file"
                                                >
                                                    {content}
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    {content}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {doc.publicUrl && (
                                                    <a
                                                        href={doc.publicUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                                                        title="Tải về"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Xóa tài liệu "${doc.fileName}"?`))
                                                            deleteMutation.mutate({ id: doc.id, path: doc.storagePath });
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    {/* Image files grid */}
                    {documents.filter(doc => doc.fileType.startsWith('image/')).length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Hình ảnh hiện trường / đính kèm</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {documents
                                    .filter(doc => doc.fileType.startsWith('image/'))
                                    .map(doc => (
                                        <div
                                            key={doc.id}
                                            className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 group hover:border-blue-500 transition-colors"
                                        >
                                            {/* Image element */}
                                            {doc.publicUrl && (
                                                <img
                                                    src={doc.publicUrl}
                                                    alt={doc.fileName}
                                                    crossOrigin="anonymous"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-zoom-in"
                                                    onClick={() => setPreviewUrl(doc.publicUrl!)}
                                                />
                                            )}

                                            {/* Hover info / Delete button */}
                                            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Xóa hình ảnh "${doc.fileName}"?`))
                                                            deleteMutation.mutate({ id: doc.id, path: doc.storagePath });
                                                    }}
                                                    className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Bottom banner for image details */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 text-[10px] text-white truncate pointer-events-none">
                                                {doc.description || doc.fileName}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Image preview modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center" onClick={() => setPreviewUrl(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] p-2">
                        <button
                            onClick={() => setPreviewUrl(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <img src={previewUrl} alt="Preview" crossOrigin="anonymous" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentAttachments;
