import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatFileSize } from '../constants';

interface DropFile {
    file: File;
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
}

interface CDEDropZoneProps {
    onFilesReady: (files: File[]) => void;
    maxSizeMB?: number;
    accept?: string[];
    multiple?: boolean;
    disabled?: boolean;
}

const DEFAULT_ACCEPT = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.dwg', '.dxf', '.zip', '.rar', '.png', '.jpg', '.jpeg', '.tif', '.tiff'];

const CDEDropZone: React.FC<CDEDropZoneProps> = ({
    onFilesReady, maxSizeMB = 50, accept = DEFAULT_ACCEPT, multiple = true, disabled = false,
}) => {
    const [files, setFiles] = useState<DropFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): string | null => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!accept.includes(ext)) return `Định dạng ${ext} không hỗ trợ`;
        if (file.size > maxSizeMB * 1024 * 1024) return `Dung lượng vượt quá ${maxSizeMB}MB`;
        return null;
    }, [accept, maxSizeMB]);

    const addFiles = useCallback((fileList: FileList | File[]) => {
        const newFiles: DropFile[] = Array.from(fileList).map(file => {
            const error = validateFile(file);
            return {
                file,
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                progress: error ? 0 : 100,
                status: error ? 'error' as const : 'pending' as const,
                error: error || undefined,
            };
        });

        setFiles(prev => [...prev, ...newFiles]);

        const validFiles = newFiles.filter(f => f.status === 'pending').map(f => f.file);
        if (validFiles.length > 0) onFilesReady(validFiles);
    }, [validateFile, onFilesReady]);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    }, [addFiles, disabled]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    return (
        <div className="space-y-3">
            {/* Drop Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${disabled
                    ? 'border-gray-200 bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-60'
                    : isDragging
                        ? 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20 scale-[1.01] shadow-sm shadow-primary-100 dark:shadow-primary-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-500 dark:hover:bg-blue-900/10'
                    }`}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/5 rounded-xl flex items-center justify-center z-10">
                        <div className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm animate-bounce">
                            Thả file tại đây
                        </div>
                    </div>
                )}
                <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-300 dark:text-slate-400'}`} />
                <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">
                    Kéo thả file hoặc <span className="text-blue-600 dark:text-blue-400 font-bold">click để chọn</span>
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">
                    PDF, DOCX, DWG, ZIP, hình ảnh — Tối đa {maxSizeMB}MB {multiple ? '(nhiều file)' : ''}
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple={multiple}
                accept={accept.join(',')}
                onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }}
            />

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map(f => (
                        <div key={f.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${f.status === 'error'
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800'
                            : f.status === 'done'
                                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800'
                                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${f.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                {f.status === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                                    f.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                        f.status === 'uploading' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
                                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate">{f.file.name}</p>
                                <p className={`text-[10px] mt-0.5 ${f.status === 'error' ? 'text-red-500' : 'text-gray-400 dark:text-slate-400'}`}>
                                    {f.error || formatFileSize(f.file.size)}
                                </p>
                            </div>
                            <button onClick={() => removeFile(f.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CDEDropZone;
