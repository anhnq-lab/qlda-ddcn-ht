import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { TaskService } from '@/services/TaskService';
import { TaskStatus, TaskPriority, TaskCategory } from '@/types/task.types';

interface TaskImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ImportTaskRow {
    id?: string;
    title: string;
    description: string;
    taskType: 'project' | 'internal' | 'management';
    projectCode: string;
    projectId?: string | null;
    projectName?: string;
    assigneeName: string;
    assigneeId?: string | null;
    assigneeFullName?: string;
    departmentCode: string;
    category: string;
    status: TaskStatus;
    priority: TaskPriority;
    startDate: string | null;
    dueDate: string;
    progress: number;
    legalBasis: string;
    outputDocument: string;
    notes: string;
    importStatus: 'pending' | 'success' | 'error';
    errorMsg?: string;
    warnings: string[];
    isUpdate?: boolean;
}

export const TaskImportModal: React.FC<TaskImportModalProps> = ({ isOpen, onClose }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [previewData, setPreviewData] = useState<ImportTaskRow[]>([]);
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
            
            // Dòng dữ liệu bắt đầu từ dòng 6 (index 5)
            const dataRows = rows.slice(5);
            const parsedRows: ImportTaskRow[] = [];

            // 1. Tải danh mục dự án và nhân viên để đối khớp
            const { data: dbProjects } = await supabase
                .from('projects')
                .select('project_id, project_name, national_project_code');
            const { data: dbEmployees } = await supabase
                .from('employees')
                .select('employee_id, full_name, email, department, user_accounts(username)');
            
            const projectList = dbProjects || [];
            const employeeList = (dbEmployees || []).map((emp: any) => {
                const accounts = emp.user_accounts;
                const username = Array.isArray(accounts) && accounts.length > 0
                    ? accounts[0]?.username
                    : (accounts?.username || '');
                return {
                    employee_id: emp.employee_id,
                    full_name: emp.full_name,
                    email: emp.email,
                    department: emp.department,
                    username: username
                };
            });

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                const title = row[0];
                const description = row[1];
                const rawTaskType = row[2];
                const projectCode = row[3];
                const assigneeName = row[4];
                const rawDepartment = row[5];
                const rawCategory = row[6];
                const rawStatus = row[7];
                const rawPriority = row[8];
                const rawStartDate = row[9];
                const rawDueDate = row[10];
                const progress = Number(row[11]) || 0;
                const legalBasis = row[12];
                const outputDocument = row[13];
                const notes = row[14];
                const id = row[15];

                // Bỏ qua dòng trống, tiêu đề phụ hoặc dòng hướng dẫn
                if (!title || String(title).trim() === '' || String(title).includes('MẪU FILE') || String(title).includes('HƯỚNG DẪN')) {
                    continue;
                }
                // Bỏ qua dòng dữ liệu mẫu
                if (String(title).includes('Soạn thảo văn bản gửi cơ quan nhà nước đề nghị kiểm tra')) {
                    continue;
                }

                const warnings: string[] = [];

                // 2. Đối khớp Dự án
                let projectId: string | null = null;
                let matchedProjectName: string | undefined = undefined;
                if (projectCode) {
                    const cleanCode = String(projectCode).trim().toLowerCase();
                    const matchedProj = projectList.find(
                        p => p.project_id.toLowerCase() === cleanCode ||
                             (p.national_project_code && p.national_project_code.toLowerCase() === cleanCode) ||
                             p.project_name.toLowerCase().includes(cleanCode)
                    );
                    if (matchedProj) {
                        projectId = matchedProj.project_id;
                        matchedProjectName = matchedProj.project_name;
                    } else {
                        warnings.push(`Không tìm thấy dự án nào khớp với "${projectCode}"`);
                    }
                }

                // 3. Đối khớp Người phụ trách
                let assigneeId: string | null = null;
                let matchedEmployeeName: string | undefined = undefined;
                if (assigneeName) {
                    const cleanName = String(assigneeName).trim().toLowerCase();
                    const matchedEmp = employeeList.find(
                        e => e.employee_id.toLowerCase() === cleanName ||
                             e.full_name.toLowerCase() === cleanName ||
                             e.email.toLowerCase() === cleanName ||
                             e.username.toLowerCase() === cleanName
                    );
                    if (matchedEmp) {
                        assigneeId = matchedEmp.employee_id;
                        matchedEmployeeName = matchedEmp.full_name;
                    } else {
                        warnings.push(`Không tìm thấy cán bộ nào khớp với "${assigneeName}"`);
                    }
                }

                // 4. Ánh xạ Loại công việc
                let taskType: 'project' | 'internal' | 'management' = 'internal';
                if (rawTaskType) {
                    const tStr = String(rawTaskType).trim().toLowerCase();
                    if (tStr.includes('dự án') || tStr.includes('project')) {
                        taskType = 'project';
                    } else if (tStr.includes('điều hành') || tStr.includes('management')) {
                        taskType = 'management';
                    } else {
                        taskType = 'internal';
                    }
                } else if (projectId) {
                    taskType = 'project';
                }

                // 5. Ánh xạ Trạng thái
                let status: TaskStatus = TaskStatus.Todo;
                if (rawStatus) {
                    const sStr = String(rawStatus).trim().toLowerCase();
                    if (sStr.includes('đang làm') || sStr.includes('in_progress') || sStr.includes('tiến hành')) {
                        status = TaskStatus.InProgress;
                    } else if (sStr.includes('xong') || sStr.includes('hoàn thành') || sStr.includes('done') || sStr.includes('completed')) {
                        status = TaskStatus.Done;
                    } else if (sStr.includes('chưa xong') || sStr.includes('incomplete')) {
                        status = TaskStatus.Incomplete;
                    }
                }

                // 6. Ánh xạ Độ ưu tiên
                let priority: TaskPriority = TaskPriority.Medium;
                if (rawPriority) {
                    const pStr = String(rawPriority).trim().toLowerCase();
                    if (pStr.includes('thấp') || pStr.includes('low')) {
                        priority = TaskPriority.Low;
                    } else if (pStr.includes('trung bình') || pStr.includes('medium')) {
                        priority = TaskPriority.Medium;
                    } else if (pStr.includes('cao') || pStr.includes('high')) {
                        priority = TaskPriority.High;
                    } else if (pStr.includes('khẩn') || pStr.includes('urgent')) {
                        priority = TaskPriority.Urgent;
                    }
                }

                // 7. Ánh xạ Phân loại (Category)
                let category = 'khac';
                if (rawCategory) {
                    const cStr = String(rawCategory).trim().toLowerCase();
                    if (cStr.includes('điều hành')) category = 'dieu_hanh';
                    else if (cStr.includes('thẩm định') || cStr.includes('phê duyệt')) category = 'tham_dinh';
                    else if (cStr.includes('thi công') || cStr.includes('giám sát')) category = 'thi_cong';
                    else if (cStr.includes('quyết toán')) category = 'quyet_toan';
                    else if (cStr.includes('thanh toán')) category = 'thanh_toan';
                    else if (cStr.includes('gpmb') || cStr.includes('giải phóng')) category = 'gpmb';
                    else if (cStr.includes('đấu thầu')) category = 'dau_thau';
                    else if (cStr.includes('điều chỉnh')) category = 'dieu_chinh';
                    else if (cStr.includes('góp ý') || cStr.includes('văn bản')) category = 'gop_y';
                    else if (cStr.includes('báo cáo')) category = 'bao_cao';
                    else if (cStr.includes('kiểm tra') || cStr.includes('qlcl')) category = 'kiem_tra';
                    else if (cStr.includes('bàn giao') || cStr.includes('nghiệm thu')) category = 'ban_giao';
                }

                // 8. Định dạng ngày
                const startDate = parseExcelDate(rawStartDate);
                const dueDate = parseExcelDate(rawDueDate) || new Date().toISOString().split('T')[0];

                // 9. Xác định hành động (Cập nhật hay Tạo mới)
                let isUpdate = false;
                if (id) {
                    const cleanId = String(id).trim();
                    if (cleanId.length > 10) {
                        isUpdate = true;
                    }
                }

                parsedRows.push({
                    id: id ? String(id).trim() : undefined,
                    title: String(title).trim(),
                    description: description ? String(description).trim() : '',
                    taskType,
                    projectCode: projectCode ? String(projectCode).trim() : '',
                    projectId,
                    projectName: matchedProjectName,
                    assigneeName: assigneeName ? String(assigneeName).trim() : '',
                    assigneeId,
                    assigneeFullName: matchedEmployeeName,
                    departmentCode: rawDepartment ? String(rawDepartment).trim() : '',
                    category,
                    status,
                    priority,
                    startDate,
                    dueDate,
                    progress,
                    legalBasis: legalBasis ? String(legalBasis).trim() : '',
                    outputDocument: outputDocument ? String(outputDocument).trim() : '',
                    notes: notes ? String(notes).trim() : '',
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
                // Map UI Task properties to DbTask model fields
                const dbTaskPayload: any = {
                    id: row.isUpdate ? row.id : undefined,
                    title: row.title,
                    description: row.description || null,
                    task_type: row.taskType === 'project' ? 'project' : 'internal',
                    project_id: row.projectId || null,
                    status: row.status,
                    progress: row.progress || 0,
                    priority: row.priority,
                    start_date: row.startDate || null,
                    due_date: row.dueDate || null,
                    assignee_id: row.assigneeId || null,
                    department_code: row.departmentCode || null,
                    category: row.category || 'khac',
                    legal_basis: row.legalBasis || null,
                    output_document: row.outputDocument || null,
                    notes: row.notes || null,
                    metadata: {
                        ui_status: row.status,
                        priority: row.priority,
                    }
                };

                await TaskService.saveTask(dbTaskPayload);

                row.importStatus = 'success';
                success++;
            } catch (err: any) {
                console.error(`Error importing row ${row.title}:`, err);
                row.importStatus = 'error';
                row.errorMsg = err.message || 'Lỗi không xác định';
                errors++;
            }
            
            // Cập nhật UI theo lô để tránh lag
            if (i % 5 === 0) setPreviewData([...updatedPreview]);
        }

        setPreviewData([...updatedPreview]);
        setImportStats({ total: updatedPreview.length, success, error: errors });
        setIsImporting(false);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setImportStats({ total: 0, success: 0, error: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            Nhập công việc từ Excel
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Tải lên file mẫu đã điền dữ liệu để thêm hoặc cập nhật công việc hàng loạt
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
                                    Danh sách công việc phân tích được ({previewData.length} dòng)
                                </h3>
                                <button onClick={reset} className="text-sm text-blue-600 hover:underline font-medium">
                                    Đổi file Excel khác
                                </button>
                            </div>

                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1">
                                <div className="overflow-x-auto max-h-[420px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">STT</th>
                                                <th className="px-4 py-3 font-medium">Hành động</th>
                                                <th className="px-4 py-3 font-medium">Tên công việc</th>
                                                <th className="px-4 py-3 font-medium">Dự án</th>
                                                <th className="px-4 py-3 font-medium">Người phụ trách</th>
                                                <th className="px-4 py-3 font-medium">Phòng ban</th>
                                                <th className="px-4 py-3 font-medium">Hạn chót</th>
                                                <th className="px-4 py-3 font-medium">Kết quả đối khớp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                                                    <td className="px-4 py-2.5 font-mono text-xs">{idx + 1}</td>
                                                    <td className="px-4 py-2.5">
                                                        {row.importStatus === 'success' && (
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                                                                <CheckCircle2 className="w-4 h-4" /> Thành công
                                                            </span>
                                                        )}
                                                        {row.importStatus === 'error' && (
                                                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-xs" title={row.errorMsg}>
                                                                <AlertCircle className="w-4 h-4" /> Thất bại
                                                            </span>
                                                        )}
                                                        {row.importStatus === 'pending' && (
                                                            row.isUpdate 
                                                                ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">Cập nhật</span>
                                                                : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">Tạo mới</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 max-w-xs truncate" title={row.title}>{row.title}</td>
                                                    <td className="px-4 py-2.5 text-xs">
                                                        {row.projectId ? (
                                                            <span className="text-gray-700 dark:text-slate-300 font-medium">{row.projectName}</span>
                                                        ) : row.projectCode ? (
                                                            <span className="text-rose-500 dark:text-rose-400 font-mono font-medium">{row.projectCode} (Chưa khớp)</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Không có</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-xs">
                                                        {row.assigneeId ? (
                                                            <span className="text-gray-700 dark:text-slate-300 font-medium">{row.assigneeFullName}</span>
                                                        ) : row.assigneeName ? (
                                                            <span className="text-rose-500 dark:text-rose-400 font-medium">{row.assigneeName} (Chưa khớp)</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Chưa giao</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-xs font-mono">{row.departmentCode || '-'}</td>
                                                    <td className="px-4 py-2.5 text-xs font-mono">{row.dueDate}</td>
                                                    <td className="px-4 py-2.5">
                                                        {row.warnings.length > 0 ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                {row.warnings.map((w, wIdx) => (
                                                                    <span key={wIdx} className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {w}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Dữ liệu chuẩn khớp
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {importStats.total > 0 && importStats.total === (importStats.success + importStats.error) && (
                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom duration-250">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        <div>
                                            <p className="font-bold">Hoàn tất nhập dữ liệu công việc</p>
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
                        className="px-4 py-2 rounded-lg text-gray-650 dark:text-slate-300 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-xs"
                    >
                        {importStats.total > 0 && importStats.total === (importStats.success + importStats.error) ? 'Đóng' : 'Hủy bỏ'}
                    </button>
                    
                    {previewData.length > 0 && importStats.total === 0 && (
                        <button 
                            onClick={handleImport} 
                            disabled={isImporting}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-sm hover:bg-blue-500 transition-all flex items-center gap-2 disabled:opacity-50 text-xs"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang thực hiện import...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Xác nhận Import ({previewData.length} dòng)
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
