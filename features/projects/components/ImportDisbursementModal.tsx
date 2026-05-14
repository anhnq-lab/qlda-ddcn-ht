import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { ParsedDisbursement, parseDisbursementExcel } from '../services/disbursementExcelParser';
import { useCreateDisbursement } from '../../../hooks/useCapital';
import { formatCurrency } from '../../../utils/format';
import { DISBURSEMENT_TYPE_LABELS, SOURCE_LABELS } from '../../../utils/capitalConstants';

interface ImportDisbursementModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export const ImportDisbursementModal: React.FC<ImportDisbursementModalProps> = ({ isOpen, onClose, projectId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedDisbursement[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const createDisbursement = useCreateDisbursement();

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) await processFile(droppedFile);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) await processFile(selectedFile);
    };

    const processFile = async (selectedFile: File) => {
        if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
            setErrors(['Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV']);
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);
        setErrors([]);
        setParsedData([]);
        setImportSuccess(false);

        try {
            const result = await parseDisbursementExcel(selectedFile);
            setParsedData(result.data);
            setErrors(result.errors);
        } catch (error: any) {
            setErrors([error.message || 'Có lỗi xảy ra khi đọc file']);
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0) return;
        setIsImporting(true);
        
        try {
            // Import sequentially or batch depending on hook capabilities
            // For safety and UI feedback, we iterate (though bulk API is better, we'll use single inserts for simplicity if bulk doesn't exist)
            for (const item of parsedData) {
                await createDisbursement.mutateAsync({
                    ProjectID: projectId,
                    ...item
                });
            }
            setImportSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (error: any) {
            setErrors([...errors, error.message || 'Lỗi khi lưu dữ liệu vào hệ thống']);
        } finally {
            setIsImporting(false);
        }
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setImportSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate- backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Import Giải Ngân Hằng Ngày</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Nhập danh sách giải ngân từ phần mềm kế toán</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-800">
                    {!file && !importSuccess && (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
                                ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                            />
                            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Kéo thả file Excel vào đây</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">hoặc click để chọn file từ máy tính</p>
                        </div>
                    )}

                    {isParsing && (
                        <div className="text-center py-10">
                            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Đang phân tích dữ liệu...</p>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2 text-sm">
                                <AlertTriangle className="w-4 h-4" /> Có {errors.length} lỗi trong file:
                            </div>
                            <ul className="list-disc pl-5 text-xs text-red-600 dark:text-red-400 space-y-1">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}

                    {parsedData.length > 0 && !importSuccess && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Dữ liệu hợp lệ ({parsedData.length} bản ghi)
                                </h3>
                                <button onClick={reset} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Chọn file khác</button>
                            </div>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-2">Ngày</th>
                                            <th className="px-4 py-2">Loại</th>
                                            <th className="px-4 py-2 text-right">Số tiền</th>
                                            <th className="px-4 py-2">Nguồn</th>
                                            <th className="px-4 py-2">Diễn giải</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {parsedData.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-">
                                                <td className="px-4 py-2">{new Date(row.Date).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-4 py-2">{DISBURSEMENT_TYPE_LABELS[row.Type] || row.Type}</td>
                                                <td className="px-4 py-2 text-right font-mono font-medium text-emerald-600">{formatCurrency(row.Amount)}</td>
                                                <td className="px-4 py-2">{SOURCE_LABELS[row.Source] || row.Source}</td>
                                                <td className="px-4 py-2 truncate max-w-[200px]" title={row.Description}>{row.Description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 10 && (
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate- text-center text-xs text-slate-500 italic">
                                        ...và {parsedData.length - 10} bản ghi khác
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {importSuccess && (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Import thành công!</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Đã lưu {parsedData.length} bản ghi giải ngân vào hệ thống.</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate- border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    {!importSuccess && (
                        <>
                            <button
                                onClick={onClose}
                                disabled={isImporting}
                                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={parsedData.length === 0 || isImporting}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all"
                            >
                                {isImporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        Bắt đầu Import <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
