import React from 'react';
import { useMutation } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import { FolderPlus, Loader2, Save, Upload } from 'lucide-react';

// ========================================
// CREATE PLAN FORM - Inline form for new KHLCNT
// Extracted from ProjectPackagesTab for maintainability
// ========================================

interface CreatePlanFormProps {
    projectId: string;
    onClose: () => void;
    onSuccess: (planId?: string) => void;
    /** When true, triggers import flow after plan creation */
    importAfterCreate?: boolean;
}

export const CreatePlanForm: React.FC<CreatePlanFormProps> = ({
    projectId,
    onClose,
    onSuccess,
    importAfterCreate = false,
}) => {
    const [planName, setPlanName] = React.useState('');
    const [planCode, setPlanCode] = React.useState('');
    const [planType, setPlanType] = React.useState<'EGP' | 'Legacy'>('EGP');
    const [planDecision, setPlanDecision] = React.useState('');
    const [planDecisionDate, setPlanDecisionDate] = React.useState('');
    const [planMSC, setPlanMSC] = React.useState('');
    const [shouldImport, setShouldImport] = React.useState(false);

    const createPlanMutation = useMutation({
        mutationFn: async () => {
            return ProjectService.createPlan({
                ProjectID: projectId,
                PlanName: planName,
                PlanCode: planCode || undefined,
                PlanType: planType,
                DecisionNumber: planDecision || undefined,
                DecisionDate: planDecisionDate || undefined,
                MSCPlanCode: planMSC || undefined,
                Status: 'Active',
            });
        },
        onSuccess: (data) => {
            onSuccess(shouldImport ? data?.PlanID : undefined);
        },
    });

    const handleSave = (withImport: boolean) => {
        setShouldImport(withImport);
        createPlanMutation.mutate();
    };

    const inputClass = "px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-bg-surface dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

    return (
        <div className="bg-bg-surface rounded-xl border-2 border-primary-300 dark:border-primary-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-primary-50 to-yellow-50 dark:from-primary-950/40 dark:to-yellow-950/40 border-b border-primary-200 dark:border-primary-800">
                <h3 className="text-sm font-bold text-primary-800 dark:text-primary-300 flex items-center gap-2">
                    <FolderPlus size={16} />
                    Tạo KHLCNT mới
                </h3>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Tên KHLCNT *" value={planName} onChange={(e) => setPlanName(e.target.value)}
                        className={inputClass} />
                    <input type="text" placeholder="Số hiệu KHLCNT (VD: PL2500231393)" value={planCode} onChange={(e) => setPlanCode(e.target.value)}
                        className={inputClass} />
                    <select value={planType} onChange={(e) => setPlanType(e.target.value as 'EGP' | 'Legacy')}
                        className={inputClass}>
                        <option value="EGP">KHLCNT trên hệ thống EGP mới</option>
                        <option value="Legacy">Hệ thống cũ</option>
                    </select>
                    <input type="text" placeholder="Số QĐ phê duyệt" value={planDecision} onChange={(e) => setPlanDecision(e.target.value)}
                        className={inputClass} />
                    <input type="date" placeholder="Ngày QĐ" value={planDecisionDate} onChange={(e) => setPlanDecisionDate(e.target.value)}
                        className={inputClass} />
                    <input type="text" placeholder="Mã trên muasamcong.vn" value={planMSC} onChange={(e) => setPlanMSC(e.target.value)}
                        className={inputClass} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Hủy</button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={!planName.trim() || createPlanMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-surface border border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-400 rounded-lg disabled:opacity-50 hover:bg-primary-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                    >
                        {createPlanMutation.isPending && !shouldImport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />}
                        <span>Lưu & Đóng</span>
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={!planName.trim() || createPlanMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium gradient-btn text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {createPlanMutation.isPending && shouldImport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={14} />}
                        <span>Lưu & Import từ Excel</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
