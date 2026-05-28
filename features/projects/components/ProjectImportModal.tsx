import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '../../../services/ProjectService';
import { ProjectGroup, InvestmentType, ProjectStatus } from '../../../types';
import { PROJECT_CURRENT_STATUS_CONFIG } from '../../../types/project.types';

interface ProjectImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ImportProjectRow {
    id?: string; // ProjectID
    projectName: string;
    groupCode: ProjectGroup;
    investmentType: InvestmentType;
    totalInvestment: number;
    capitalSource: string;
    status: ProjectStatus;
    currentStatusCode: number | null;
    locationCode: string;
    sector: string;
    policyDecisionLevel: string;
    policyDecisionNumber: string;
    policyDecisionDate: string | null;
    managementBoard: number | null;
    oldInvestor: string;
    transferDecision: string;
    startDate: string | null;
    expectedEndDate: string | null;
    actualEndDate: string | null;
    progress: number;
    paymentProgress: number;
    importStatus: 'pending' | 'success' | 'error';
    errorMsg?: string;
    warnings: string[];
    isUpdate?: boolean;
}

export const ProjectImportModal: React.FC<ProjectImportModalProps> = ({ isOpen, onClose }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [previewData, setPreviewData] = useState<ImportProjectRow[]>([]);
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

    const parseExcelDate = (val: any): string | null => {
        if (!val) return null;
        if (val instanceof Date) {
            return val.toISOString().split('T')[0];
        }
        if (typeof val === 'number') {
            // Excel serial date format
            const date = new Date((val - (25567 + 2)) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        if (typeof val === 'string') {
            const cleaned = val.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
            const matchDMY = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (matchDMY) {
                const [_, d, m, y] = matchDMY;
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }
        return null;
    };

    const mapGroupCode = (val: any, warnings: string[]): ProjectGroup => {
        if (!val) return ProjectGroup.C;
        const str = String(val).trim().toUpperCase();
        if (['QN', 'A', 'B', 'C'].includes(str)) {
            return str as ProjectGroup;
        }
        warnings.push(`Nhóm dự án "${val}" không hợp lệ (mặc định chọn Nhóm C)`);
        return ProjectGroup.C;
    };

    const mapInvestmentType = (val: any, warnings: string[]): InvestmentType => {
        if (!val) return InvestmentType.Public;
        const str = String(val).trim().toLowerCase();
        if (str.includes('đầu tư công') || str === '1') return InvestmentType.Public;
        if (str.includes('nhà nước ngoài đầu tư công') || str.includes('ngoài đtc') || str === '2') return InvestmentType.StateNonPublic;
        if (str.includes('ppp') || str.includes('tác công tư') || str === '3') return InvestmentType.PPP;
        if (str.includes('khác') || str === '4') return InvestmentType.Other;

        warnings.push(`Loại hình đầu tư "${val}" không khớp (mặc định chọn Đầu tư công)`);
        return InvestmentType.Public;
    };

    const mapProjectStatus = (val: any, warnings: string[]): ProjectStatus => {
        if (!val) return ProjectStatus.Preparation;
        const str = String(val).trim().toLowerCase();
        if (str.includes('chuẩn bị') || str === '1') return ProjectStatus.Preparation;
        if (str.includes('thực hiện') || str === '2') return ProjectStatus.Execution;
        if (str.includes('kết thúc') || str.includes('hoàn thành') || str === '3') return ProjectStatus.Completion;

        warnings.push(`Trạng thái "${val}" không khớp (mặc định chọn Chuẩn bị dự án)`);
        return ProjectStatus.Preparation;
    };

    const mapCurrentStatusCode = (val: any, warnings: string[]): number | null => {
        if (!val) return null;
        const str = String(val).trim().toLowerCase();
        
        // Find matching current status from config
        for (const [codeStr, config] of Object.entries(PROJECT_CURRENT_STATUS_CONFIG)) {
            const code = Number(codeStr);
            const label = config.label.toLowerCase();
            const fullLabel = config.fullLabel.toLowerCase();
            if (str === codeStr || str.includes(label) || fullLabel.includes(str)) {
                return code;
            }
        }
        
        warnings.push(`Hiện trạng chi tiết "${val}" không khớp với danh mục hệ thống`);
        return null;
    };

    const mapManagementBoard = (val: any, warnings: string[]): number | null => {
        if (!val) return null;
        const str = String(val).trim().toLowerCase();
        if (str.includes('1') || str.includes('phòng 1') || str.includes('qlda 1')) return 1;
        if (str.includes('2') || str.includes('phòng 2') || str.includes('qlda 2')) return 2;
        if (str.includes('3') || str.includes('phòng 3') || str.includes('qlda 3')) return 3;
        
        warnings.push(`Phòng QLDA "${val}" không đúng (chỉ chấp nhận Phòng 1, 2 hoặc 3)`);
        return null;
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
            
            // Dữ liệu dự án bắt đầu từ dòng 6 (index 5)
            const dataRows = rows.slice(5);
            const parsedRows: ImportProjectRow[] = [];

            // Tải danh sách dự án hiện tại để kiểm tra trùng mã (cập nhật)
            const { data: dbProjects } = await supabase
                .from('projects')
                .select('project_id, project_name');
            
            const projectMap = new Map((dbProjects || []).map(p => [p.project_id.toLowerCase(), p.project_name]));

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row || row.length === 0) continue;

                const projectName = row[0];
                const id = row[1];
                const rawGroupCode = row[2];
                const rawInvestmentType = row[3];
                const totalInvestment = Number(row[4]) || 0;
                const capitalSource = row[5];
                const rawStatus = row[6];
                const rawCurrentStatus = row[7];
                const locationCode = row[8];
                const sector = row[9];
                const policyDecisionLevel = row[10];
                const policyDecisionNumber = row[11];
                const rawPolicyDecisionDate = row[12];
                const rawManagementBoard = row[13];
                const oldInvestor = row[14];
                const transferDecision = row[15];
                const rawStartDate = row[16];
                const rawExpectedEndDate = row[17];
                const rawActualEndDate = row[18];
                const progress = Number(row[19]) || 0;
                const paymentProgress = Number(row[20]) || 0;

                // Bỏ qua dòng trống hoặc dòng hướng dẫn mẫu
                if (!projectName || String(projectName).trim() === '' || String(projectName).includes('MẪU FILE') || String(projectName).includes('HƯỚNG DẪN')) {
                    continue;
                }
                
                // Bỏ qua dòng mẫu tham khảo
                if (String(projectName).includes('Dự án Đầu tư xây dựng tuyến đường trục chính')) {
                    continue;
                }

                const warnings: string[] = [];

                const groupCode = mapGroupCode(rawGroupCode, warnings);
                const investmentType = mapInvestmentType(rawInvestmentType, warnings);
                const status = mapProjectStatus(rawStatus, warnings);
                const currentStatusCode = mapCurrentStatusCode(rawCurrentStatus, warnings);
                const managementBoard = mapManagementBoard(rawManagementBoard, warnings);

                const policyDecisionDate = parseExcelDate(rawPolicyDecisionDate);
                const startDate = parseExcelDate(rawStartDate);
                const expectedEndDate = parseExcelDate(rawExpectedEndDate);
                const actualEndDate = parseExcelDate(rawActualEndDate);

                if (rawPolicyDecisionDate && !policyDecisionDate) warnings.push('Ngày quyết định chủ trương không đúng định dạng YYYY-MM-DD');
                if (rawStartDate && !startDate) warnings.push('Ngày khởi công không đúng định dạng YYYY-MM-DD');
                if (rawExpectedEndDate && !expectedEndDate) warnings.push('Hạn chót dự kiến không đúng định dạng YYYY-MM-DD');
                if (rawActualEndDate && !actualEndDate) warnings.push('Thực tế kết thúc không đúng định dạng YYYY-MM-DD');

                let isUpdate = false;
                if (id) {
                    const cleanId = String(id).trim().toLowerCase();
                    if (projectMap.has(cleanId)) {
                        isUpdate = true;
                    }
                }

                parsedRows.push({
                    id: id ? String(id).trim() : undefined,
                    projectName: String(projectName).trim(),
                    groupCode,
                    investmentType,
                    totalInvestment,
                    capitalSource: capitalSource ? String(capitalSource).trim() : 'Ngân sách Địa phương',
                    status,
                    currentStatusCode,
                    locationCode: locationCode ? String(locationCode).trim() : '',
                    sector: sector ? String(sector).trim() : 'Other',
                    policyDecisionLevel: policyDecisionLevel ? String(policyDecisionLevel).trim() : '',
                    policyDecisionNumber: policyDecisionNumber ? String(policyDecisionNumber).trim() : '',
                    policyDecisionDate,
                    managementBoard,
                    oldInvestor: oldInvestor ? String(oldInvestor).trim() : '',
                    transferDecision: transferDecision ? String(transferDecision).trim() : '',
                    startDate,
                    expectedEndDate,
                    actualEndDate,
                    progress,
                    paymentProgress,
                    importStatus: 'pending',
                    warnings,
                    isUpdate
                });
            }

            setPreviewData(parsedRows);

        } catch (error) {
            console.error('File parsing error:', error);
            alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng mẫu file.');
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
                const payload: any = {
                    ProjectID: row.id || `DA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    ProjectName: row.projectName,
                    GroupCode: row.groupCode,
                    InvestmentType: row.investmentType,
                    TotalInvestment: row.totalInvestment,
                    CapitalSource: row.capitalSource,
                    Status: row.status,
                    CurrentStatusCode: row.currentStatusCode,
                    LocationCode: row.locationCode,
                    Sector: row.sector,
                    PolicyDecisionLevel: row.policyDecisionLevel,
                    PolicyDecisionNumber: row.policyDecisionNumber,
                    PolicyDecisionDate: row.policyDecisionDate,
                    ManagementBoard: row.managementBoard,
                    OldInvestor: row.oldInvestor,
                    TransferDecision: row.transferDecision,
                    StartDate: row.startDate,
                    ExpectedEndDate: row.expectedEndDate,
                    ActualEndDate: row.actualEndDate,
                    Progress: row.progress,
                    PaymentProgress: row.paymentProgress
                };

                if (row.isUpdate && row.id) {
                    await ProjectService.update(row.id, payload);
                } else {
                    await ProjectService.create(payload);
                }

                row.importStatus = 'success';
                success++;
            } catch (err: any) {
                console.error(`Error importing project ${row.projectName}:`, err);
                row.importStatus = 'error';
                row.errorMsg = err.message || 'Lỗi không xác định';
                errors++;
            }
            
            if (i % 5 === 0) setPreviewData([...updatedPreview]);
        }

        setPreviewData([...updatedPreview]);
        setImportStats({ total: updatedPreview.length, success, error: errors });
        setIsImporting(false);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        // Invalidate custom filters context since count statistics might change
        queryClient.invalidateQueries({ queryKey: ['projects-stats'] });
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setImportStats({ total: 0, success: 0, error: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            Nhập dự án từ Excel
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Tải lên file mẫu đã điền dữ liệu để thêm hoặc cập nhật dự án hàng loạt
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
                            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer
                                ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-400 dark:border-slate-700 dark:hover:border-blue-500'}
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
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                                Kéo thả file Excel của bạn vào đây hoặc click để chọn file
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Hỗ trợ các định dạng .xlsx, .xls
                            </p>
                        </div>
                    )}

                    {isParsing && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-sm text-gray-600 dark:text-slate-400">Đang đọc dữ liệu file Excel...</p>
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-800 dark:text-slate-200">
                                    Danh sách dự án phân tích được ({previewData.length} dòng)
                                </h3>
                                <button onClick={reset} className="text-sm text-blue-600 hover:underline font-medium" disabled={isImporting}>
                                    Đổi file Excel khác
                                </button>
                            </div>

                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1">
                                <div className="overflow-x-auto max-h-[420px]">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold sticky top-0 border-b border-gray-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 w-16 text-center">STT</th>
                                                <th className="px-4 py-3 w-32">Mã dự án</th>
                                                <th className="px-4 py-3 min-w-[200px]">Tên dự án</th>
                                                <th className="px-4 py-3 w-20 text-center">Nhóm</th>
                                                <th className="px-4 py-3 w-28 text-center">Loại hình ĐT</th>
                                                <th className="px-4 py-3 w-28 text-right">Tổng mức ĐT</th>
                                                <th className="px-4 py-3 w-28 text-center">Giai đoạn</th>
                                                <th className="px-4 py-3 w-32">Phòng QLDA</th>
                                                <th className="px-4 py-3 w-32">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-mono font-semibold">
                                                        {row.id ? (
                                                            row.isUpdate ? (
                                                                <span className="text-blue-600 dark:text-blue-400" title="Cập nhật dự án sẵn có">{row.id}</span>
                                                            ) : (
                                                                <span className="text-gray-700 dark:text-slate-300" title="Thêm dự án mới">{row.id}</span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400 italic">Tự động sinh</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-gray-900 dark:text-slate-100">{row.projectName}</div>
                                                        {row.warnings.length > 0 && (
                                                            <div className="flex flex-col gap-0.5 mt-1">
                                                                {row.warnings.map((w, wIdx) => (
                                                                    <span key={wIdx} className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                                        {w}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {row.errorMsg && (
                                                            <div className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                                                <AlertCircle className="w-3 h-3 shrink-0" />
                                                                {row.errorMsg}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold">Nhóm {row.groupCode}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {row.investmentType === 1 && 'Đầu tư công'}
                                                        {row.investmentType === 2 && 'Vốn NN ngoài ĐTC'}
                                                        {row.investmentType === 3 && 'PPP'}
                                                        {row.investmentType === 4 && 'Khác'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                                        {row.totalInvestment.toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {row.status === 1 && 'Chuẩn bị'}
                                                        {row.status === 2 && 'Thực hiện'}
                                                        {row.status === 3 && 'Kết thúc'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {row.managementBoard ? `Phòng ${row.managementBoard}` : <span className="text-gray-400">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {row.importStatus === 'pending' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300">
                                                                Chờ nhập
                                                            </span>
                                                        )}
                                                        {row.importStatus === 'success' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                Thành công
                                                            </span>
                                                        )}
                                                        {row.importStatus === 'error' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                                                Thất bại
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
                    <div>
                        {previewData.length > 0 && importStats.total > 0 && (
                            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                Kết quả: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{importStats.success}</span> thành công,{' '}
                                <span className="text-red-600 dark:text-red-400 font-bold">{importStats.error}</span> thất bại.
                            </p>
                        )}
                        {previewData.length > 0 && importStats.total === 0 && (
                            <p className="text-sm text-gray-500">
                                Sẵn sàng nhập {previewData.length} dự án vào hệ thống.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            disabled={isImporting}
                        >
                            Đóng
                        </button>
                        {previewData.length > 0 && importStats.success + importStats.error === 0 && (
                            <button 
                                onClick={handleImport}
                                disabled={isImporting}
                                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang nhập...
                                    </>
                                ) : (
                                    'Xác nhận Nhập'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
