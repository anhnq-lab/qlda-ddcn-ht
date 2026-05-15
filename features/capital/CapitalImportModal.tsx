import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { normalizeSource } from '@/utils/capitalConstants';

interface CapitalImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentYear: number;
}

interface ImportRow {
    tt: string;
    projectCode: string;
    projectName: string;
    decisionNumber: string;
    decisionDateStr: string | null;
    amount: number; // In millions from Excel
    disbursedAmount: number; // In millions from Excel
    status: 'pending' | 'success' | 'error';
    errorMsg?: string;
    projectId?: string;
    isNewProject?: boolean;
}

export const CapitalImportModal: React.FC<CapitalImportModalProps> = ({ isOpen, onClose, currentYear }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [previewData, setPreviewData] = useState<ImportRow[]>([]);
    const [importStats, setImportStats] = useState({ total: 0, success: 0, error: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            processFile(droppedFile);
        } else {
            alert('Vui lòng chọn file Excel (.xlsx, .xls)');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsParsing(true);
        setPreviewData([]);
        
        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Theo format: dòng 6 bắt đầu data (index 5)
            const dataRows = rows.slice(5);
            const parsedRows: ImportRow[] = [];

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                const tt = row[0];
                const projectCode = row[1];
                const projectName = row[2];
                const decisionNumber = row[4];
                const decisionDateRaw = row[5];
                const amount = Number(row[8]) || 0; // KHV giao (Triệu đồng)
                const disbursedAmount = Number(row[9]) || 0; // Lũy kế (Triệu đồng)

                if (!projectCode || String(projectCode).trim() === '' || projectName === 'Tổng cộng') {
                    continue;
                }

                let decisionDateStr = null;
                if (decisionDateRaw instanceof Date) {
                    decisionDateStr = decisionDateRaw.toISOString().split('T')[0];
                } else if (typeof decisionDateRaw === 'number') {
                    const date = new Date((decisionDateRaw - (25567 + 2)) * 86400 * 1000);
                    decisionDateStr = date.toISOString().split('T')[0];
                }

                parsedRows.push({
                    tt: String(tt || ''),
                    projectCode: String(projectCode).trim(),
                    projectName: String(projectName),
                    decisionNumber: String(decisionNumber || ''),
                    decisionDateStr,
                    amount,
                    disbursedAmount,
                    status: 'pending'
                });
            }

            // Verify with Database
            const codes = parsedRows.map(r => r.projectCode);
            const { data: existingProjects } = await supabase
                .from('projects')
                .select('project_id, national_project_code')
                .in('national_project_code', codes);

            const projectMap = new Map((existingProjects || []).map(p => [p.national_project_code, p.project_id]));

            const finalPreview = parsedRows.map(row => {
                const projectId = projectMap.get(row.projectCode);
                return {
                    ...row,
                    projectId,
                    isNewProject: !projectId,
                    status: 'pending' as const
                };
            });

            setPreviewData(finalPreview);

        } catch (error) {
            console.error('File parsing error:', error);
            alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        let success = 0;
        let errors = 0;
        const updatedPreview = [...previewData];

        for (let i = 0; i < updatedPreview.length; i++) {
            const row = updatedPreview[i];
            try {
                let projectId = row.projectId;

                // 1. Create project if not exists
                if (!projectId) {
                    const { data: newProj, error: projErr } = await supabase
                        .from('projects')
                        .insert({
                            project_id: crypto.randomUUID(),
                            national_project_code: row.projectCode,
                            project_name: row.projectName,
                            status: 0,
                            investor_name: 'Ban Quản lý dự án đầu tư xây dựng công trình dân dụng và công nghiệp tỉnh Hà Tĩnh'
                        })
                        .select('project_id')
                        .single();

                    if (projErr) throw projErr;
                    projectId = newProj.project_id;
                    row.projectId = projectId;
                }

                // 2. Check existing plan
                const { data: existingPlans, error: planFetchError } = await supabase
                    .from('capital_plans')
                    .select('plan_id')
                    .eq('project_id', projectId)
                    .eq('year', currentYear);

                if (planFetchError) throw planFetchError;

                // Quy đổi từ Triệu đồng -> Đồng
                const amountVND = row.amount * 1_000_000;
                const disbursedAmountVND = row.disbursedAmount * 1_000_000;

                const planData = {
                    project_id: projectId,
                    year: currentYear,
                    amount: amountVND,
                    disbursed_amount: disbursedAmountVND,
                    decision_number: row.decisionNumber || null,
                    date_assigned: row.decisionDateStr,
                    source: normalizeSource('Ngân sách nhà nước'), // Default normalized
                    plan_type: 'annual'
                };

                if (existingPlans && existingPlans.length > 0) {
                    // Update
                    const { error: updateError } = await supabase
                        .from('capital_plans')
                        .update({
                            amount: planData.amount,
                            disbursed_amount: planData.disbursed_amount,
                            decision_number: planData.decision_number,
                            date_assigned: planData.date_assigned
                        })
                        .eq('plan_id', existingPlans[0].plan_id);
                    if (updateError) throw updateError;
                } else {
                    // Insert
                    const { error: insertError } = await supabase
                        .from('capital_plans')
                        .insert({
                            plan_id: crypto.randomUUID(),
                            ...planData
                        });
                    if (insertError) throw insertError;
                }

                row.status = 'success';
                success++;
            } catch (err: any) {
                console.error(`Error importing row ${row.projectCode}:`, err);
                row.status = 'error';
                row.errorMsg = err.message || 'Lỗi không xác định';
                errors++;
            }
            // Update UI periodically for long lists
            if (i % 5 === 0) setPreviewData([...updatedPreview]);
        }

        setPreviewData([...updatedPreview]);
        setImportStats({ total: updatedPreview.length, success, error: errors });
        setIsImporting(false);
        queryClient.invalidateQueries({ queryKey: ['capitalPlans'] });
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setImportStats({ total: 0, success: 0, error: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            Import Kế hoạch vốn {currentYear}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Hỗ trợ định dạng .xlsx, .xls xuất từ hệ thống Kho bạc / Tài chính
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-900">
                    {!file && !isParsing && (
                        <div 
                            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
                                ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-500'}
                            `}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".xlsx,.xls" 
                                onChange={handleFileSelect} 
                            />
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                                Kéo thả file Excel vào đây hoặc click để chọn file
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Dữ liệu cột H: KHV giao (Triệu đồng), Cột I: Giải ngân (Triệu đồng)
                            </p>
                        </div>
                    )}

                    {isParsing && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                            <p className="text-sm text-gray-600 dark:text-slate-400">Đang đọc file Excel...</p>
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-800 dark:text-slate-200">
                                    Dữ liệu chuẩn bị Import ({previewData.length} dự án)
                                </h3>
                                <button onClick={reset} className="text-sm text-blue-600 hover:underline">
                                    Chọn file khác
                                </button>
                            </div>

                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1">
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Trạng thái</th>
                                                <th className="px-4 py-3 font-medium">Mã DA</th>
                                                <th className="px-4 py-3 font-medium">Tên dự án</th>
                                                <th className="px-4 py-3 font-medium text-right">KHV Giao (Tr.đ)</th>
                                                <th className="px-4 py-3 font-medium text-right">Giải ngân (Tr.đ)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-">
                                                    <td className="px-4 py-2">
                                                        {row.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                        {row.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" {...({title: row.errorMsg} as any)} />}
                                                        {row.status === 'pending' && (
                                                            row.isNewProject 
                                                                ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800">Dự án mới</span>
                                                                : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Cập nhật</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs">{row.projectCode}</td>
                                                    <td className="px-4 py-2 line-clamp-2 max-w-xs" title={row.projectName}>{row.projectName}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-blue-600">{row.amount.toLocaleString('vi-VN')}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-emerald-600">{row.disbursedAmount.toLocaleString('vi-VN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {importStats.total > 0 && importStats.total === (importStats.success + importStats.error) && (
                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        <div>
                                            <p className="font-bold">Nhập dữ liệu hoàn tất</p>
                                            <p className="text-sm">Thành công: {importStats.success} / Lỗi: {importStats.error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        disabled={isImporting}
                        className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {importStats.total > 0 && importStats.total === (importStats.success + importStats.error) ? 'Đóng' : 'Hủy bỏ'}
                    </button>
                    
                    {previewData.length > 0 && importStats.total === 0 && (
                        <button 
                            onClick={handleImport} 
                            disabled={isImporting}
                            className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 hover:bg-emerald-500 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Xác nhận Import ({previewData.length})
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
