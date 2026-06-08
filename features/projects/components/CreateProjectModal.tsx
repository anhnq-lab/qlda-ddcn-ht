import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, DollarSign, Users, Sparkles, ImagePlus, Loader2, CheckCircle2, BarChart2, Activity, Scale, Ruler, Lock } from 'lucide-react';
import { ProjectGroup, InvestmentType, Project, Employee, MANAGEMENT_BOARDS, SelectedMember } from '../../../types';
import { generateProjectCode, ConstructionType, PermitType, detectSpecialtyByName } from '../../../utils/projectCodeGenerator';
import EmployeeService from '../../../services/EmployeeService';
import { ProjectMemberService } from '../../../services/ProjectMemberService';
import { useAuth } from '../../../context/AuthContext';
import { useImpersonation } from '../../../context/ImpersonationContext';
import { useProjectFieldAccess } from '../hooks/useProjectFieldAccess';
import { PROJECT_FIELD_CATALOG } from '../projectFieldCatalog';
import { extractProjectFromImage, fileToBase64, ExtractedProjectData } from '../../../services/ai/aiImageExtractor';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';
import { ProjectModalFormSchema, ProjectModalFormValues } from '../../../schemas/project.schema';
import { classifyProjectBySpecialty } from '../../../utils/projectCompliance';

import { ProjectFormGeneral } from './forms/ProjectFormGeneral';
import { ProjectFormLegal } from './forms/ProjectFormLegal';
import { ProjectFormInvestment } from './forms/ProjectFormInvestment';
import { ProjectFormMembers } from './forms/ProjectFormMembers';
import { CONSTRUCTION_TYPES, CONSTRUCTION_GRADES, PROVINCES } from './forms/FormShared';

interface CreateProjectModalProps {
    onClose: () => void;
    onSave: (data: Partial<Project> & { StartDate: Date }, members: SelectedMember[]) => Promise<void>;
    editProject?: Project | null;
}

const PROJ_TABS = [
    { id: 'general',     label: 'Thông tin chung',       icon: Building2 },
    { id: 'legal',       label: 'Pháp lý',                icon: Scale },
    { id: 'investment',  label: 'Cơ cấu vốn & Chi phí',  icon: DollarSign },
    { id: 'members',     label: 'Thành viên',              icon: Users },
] as const;

type TabId = typeof PROJ_TABS[number]['id'];

const FIELD_TO_TAB: Record<string, TabId> = {
    ProjectID: 'general', ProjectName: 'general', GroupCode: 'general',
    ManagementBoard: 'general', StartDate: 'general',
    ProvinceCode: 'general', LocationCode: 'general', ConstructionType: 'general',
    ImageUrl: 'general', Coordinates: 'general', ConstructionGrade: 'general',
    DecisionNumber: 'legal', DecisionAuthority: 'legal',
    ApprovalDate: 'legal',
    PolicyDecisionNumber: 'legal', PolicyDecisionAuthority: 'legal', PolicyDecisionDate: 'legal',
    DecisionLevelBeforeHandover: 'legal', OldInvestor: 'legal', TransferDecision: 'legal',
    TotalInvestment: 'investment', CapitalSource: 'investment',
    CostBreakdown: 'investment',
};

const DEFAULT_FORM_VALUES: ProjectModalFormValues = {
    ProjectID: '',
    ProjectName: '',
    GroupCode: ProjectGroup.C as 'C',
    InvestmentType: InvestmentType.Public,
    StartDate: new Date().toISOString().split('T')[0],
    TotalInvestment: 0,
    CapitalSource: 'Ngân sách Địa phương',
    ProvinceCode: '42',
    LocationCode: '',
    ConstructionType: '',
    ConstructionGrade: '',
    CompetentAuthority: 'UBND tỉnh Hà Tĩnh',
    InvestorName: 'Ban Quản lý dự án đầu tư xây dựng công trình dân dụng và hạ tầng khu vực',
    Duration: '',
    ManagementBoard: 1,
    ApprovalDate: '',
    DecisionNumber: '',
    PolicyDecisionNumber: '',
    PolicyDecisionAuthority: '',
    PolicyDecisionDate: '',
    Objective: '',
    InvestmentScale: '',
    DecisionAuthority: '',
    ExpectedEndDate: '',
    CostBreakdown: {},
    ProjectManagement: {},
    DecisionLevelBeforeHandover: '',
    OldInvestor: '',
    TransferDecision: '',
    CurrentStatusCode: null,
    SpecialtyType: '',
    Stage: '',
    ImageUrl: '',
    Coordinates: undefined,
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSave, editProject }) => {
    const isEditMode = !!editProject;
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

    // ── AI Image Extraction ──
    const [aiStatus, setAiStatus] = useState<'idle' | 'extracting' | 'done' | 'error'>('idle');
    const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
    const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
    const [aiError, setAiError] = useState('');
    const aiFileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<TabId>('general');

    // ── React Hook Form ──
    const {
        watch,
        setValue,
        getValues,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm<ProjectModalFormValues>({
        resolver: zodResolver(ProjectModalFormSchema) as any,
        defaultValues: DEFAULT_FORM_VALUES,
        mode: 'onBlur',
    });

    // Bridge: expose formData as a plain object for legacy sub-form components
    const formData = watch();

    // ── Phân quyền cấp TRƯỜNG theo vai trò thành viên dự án ──
    const { currentUser } = useAuth();
    const { impersonatedUser, isImpersonating } = useImpersonation();
    const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;
    const myMemberRole = useMemo(
        () => selectedMembers.find(m => m.employeeId === effectiveUser?.EmployeeID)?.role ?? null,
        [selectedMembers, effectiveUser]
    );
    const { canEditField, hasRestrictions } = useProjectFieldAccess({
        memberRole: myMemberRole,
        isCreate: !isEditMode,
    });
    const lockedFieldLabels = useMemo(
        () => PROJECT_FIELD_CATALOG.filter(f => !canEditField(f.tsKey)).map(f => f.label),
        [canEditField]
    );

    // Bridge: updateField — chặn sửa trường bị khoá theo vai trò thành viên (Lớp field)
    const updateField = useCallback((field: string, value: any) => {
        if (isEditMode && !canEditField(field)) return; // trường bị khoá → bỏ qua thay đổi
        setValue(field as keyof ProjectModalFormValues, value, { shouldDirty: true });
    }, [setValue, isEditMode, canEditField]);

    // Tự động nhận diện chuyên ngành khi tên dự án thay đổi (chỉ ở chế độ tạo mới)
    const projectNameVal = watch('ProjectName');
    useEffect(() => {
        if (!isEditMode && projectNameVal) {
            const currentSpecialty = getValues('SpecialtyType');
            if (!currentSpecialty) {
                const detected = detectSpecialtyByName(projectNameVal);
                if (detected) {
                    setValue('SpecialtyType', detected, { shouldDirty: true });
                }
            }
        }
    }, [projectNameVal, isEditMode, setValue, getValues]);

    // Tự động phân loại nhóm dự án khi thay đổi tổng mức đầu tư hoặc chuyên ngành
    const watchedTotalInvestment = watch('TotalInvestment');
    const watchedSpecialtyType = watch('SpecialtyType');
    useEffect(() => {
        if (watchedTotalInvestment !== undefined && watchedSpecialtyType !== undefined) {
            const calculatedGroup = classifyProjectBySpecialty(Number(watchedTotalInvestment) || 0, watchedSpecialtyType);
            setValue('GroupCode', calculatedGroup, { shouldDirty: true });
        }
    }, [watchedTotalInvestment, watchedSpecialtyType, setValue]);



    // Populate form data in edit mode
    useEffect(() => {
        if (editProject) {
            reset({
                ProjectID: editProject.ProjectID || '',
                ProjectName: editProject.ProjectName || '',
                GroupCode: (editProject.GroupCode || ProjectGroup.C) as 'QN' | 'A' | 'B' | 'C',
                InvestmentType: editProject.InvestmentType || InvestmentType.Public,
                StartDate: editProject.StartDate ? new Date(editProject.StartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                TotalInvestment: editProject.TotalInvestment || 0,
                CapitalSource: editProject.CapitalSource || 'Ngân sách Địa phương',
                ProvinceCode: editProject.ProvinceCode || '42',
                LocationCode: editProject.LocationCode || '',
                ConstructionType: editProject.ConstructionType || '',
                ConstructionGrade: editProject.ConstructionGrade || '',
                CompetentAuthority: editProject.CompetentAuthority || 'UBND tỉnh Hà Tĩnh',
                InvestorName: editProject.InvestorName || 'Ban Quản lý dự án đầu tư xây dựng công trình dân dụng và hạ tầng khu vực',
                Duration: editProject.Duration || '',
                ManagementBoard: editProject.ManagementBoard || 1,
                ApprovalDate: editProject.ApprovalDate ? new Date(editProject.ApprovalDate).toISOString().split('T')[0] : '',
                DecisionNumber: editProject.DecisionNumber || '',
                PolicyDecisionNumber: (editProject as any).InvestmentPolicy?.DecisionNumber || '',
                PolicyDecisionAuthority: (editProject as any).InvestmentPolicy?.Authority || '',
                PolicyDecisionDate: (editProject as any).InvestmentPolicy?.DecisionDate ? new Date((editProject as any).InvestmentPolicy.DecisionDate).toISOString().split('T')[0] : '',
                Objective: editProject.Objective || '',
                InvestmentScale: editProject.InvestmentScale || '',
                DecisionAuthority: editProject.DecisionAuthority || '',
                ExpectedEndDate: editProject.ExpectedEndDate ? new Date(editProject.ExpectedEndDate).toISOString().split('T')[0] : '',
                CostBreakdown: (editProject.CostBreakdown || {}) as any,
                ProjectManagement: (editProject.ProjectManagement || {}) as Record<string, unknown>,
                DecisionLevelBeforeHandover: editProject.DecisionLevelBeforeHandover || '',
                OldInvestor: editProject.OldInvestor || '',
                TransferDecision: editProject.TransferDecision || '',
                CurrentStatusCode: editProject.CurrentStatusCode || null,
                SpecialtyType: (((editProject.SpecialtyType as any) === 'civil' || (editProject.SpecialtyType as any) === 'industrial')
                    ? 'civil_industrial'
                    : ((editProject.SpecialtyType as any) === 'transportation')
                        ? 'transport_urban'
                        : ((editProject.SpecialtyType as any) === 'agriculture')
                            ? 'agriculture_rural'
                            : editProject.SpecialtyType || '') as any,
                Stage: editProject.Stage || '',
                ImageUrl: editProject.ImageUrl || '',
                Coordinates: editProject.Coordinates || undefined,
            });
        } else {
            reset(DEFAULT_FORM_VALUES);
        }
    }, [editProject, reset]);

    // Fetch employees on mount + load existing members in edit mode
    useEffect(() => {
        EmployeeService.getAll().then(setEmployees).catch(console.error);
        if (editProject?.ProjectID) {
            ProjectMemberService.getSelectedMembers(editProject.ProjectID)
                .then(members => setSelectedMembers(members))
                .catch(console.error);
        }
    }, [editProject]);

    // ── AI: Listen for paste events ──
    useEffect(() => {
        if (isEditMode) return;
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) handleAiImageExtract(file);
                    return;
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [isEditMode]);

    // ── AI: Process image extraction ──
    const handleAiImageExtract = useCallback(async (file: File) => {
        setAiStatus('extracting');
        setAiError('');
        setAiFilledFields(new Set());

        const previewUrl = URL.createObjectURL(file);
        setAiPreviewUrl(previewUrl);

        try {
            const base64 = await fileToBase64(file);
            const extracted = await extractProjectFromImage(base64, file.type || 'image/png');
            applyExtractedData(extracted);
            setAiStatus('done');
        } catch (err) {
            console.error('AI extraction error:', err);
            setAiError((err as Error)?.message || 'Lỗi trích xuất AI');
            setAiStatus('error');
        }
    }, []);

    // ── AI: Apply extracted data to form ──
    const applyExtractedData = (data: ExtractedProjectData) => {
        const filled = new Set<string>();

        const setField = (key: keyof ProjectModalFormValues, value: any) => {
            setValue(key, value, { shouldDirty: true });
            filled.add(key);
        };

        if (data.ProjectName) setField('ProjectName', data.ProjectName);
        if (data.Duration) setField('Duration', data.Duration);
        if (data.CompetentAuthority) setField('CompetentAuthority', data.CompetentAuthority);
        if (data.InvestorName) setField('InvestorName', data.InvestorName);
        if (data.CapitalSource) setField('CapitalSource', data.CapitalSource);
        if (data.LocationCode) setField('LocationCode', data.LocationCode);

        if (data.TotalInvestment && data.TotalInvestment > 0) {
            setField('TotalInvestment', data.TotalInvestment);
        }

        if (data.StartDate && /^\d{4}-\d{2}-\d{2}$/.test(data.StartDate)) {
            setField('StartDate', data.StartDate);
        }

        if (data.GroupCode) {
            const gMap: Record<string, 'QN' | 'A' | 'B' | 'C'> = {
                'A': 'A', 'B': 'B', 'C': 'C', 'QN': 'QN',
                'Nhóm A': 'A', 'Nhóm B': 'B', 'Nhóm C': 'C',
            };
            const mapped = gMap[data.GroupCode];
            if (mapped) setField('GroupCode', mapped);
        }

        if (data.ConstructionType) {
            const validTypes = CONSTRUCTION_TYPES.map(t => t.label);
            const match = validTypes.find(t => data.ConstructionType!.includes(t));
            if (match) setField('ConstructionType', match);
        }

        if (data.ConstructionGrade) {
            const validGrades = CONSTRUCTION_GRADES.map(g => g.value);
            const match = validGrades.find(g => data.ConstructionGrade!.includes(g));
            if (match) setField('ConstructionGrade', match);
        }

        if (data.ProvinceName) {
            const pMatch = PROVINCES.find(p =>
                data.ProvinceName!.includes(p.name) || p.name.includes(data.ProvinceName!)
            );
            if (pMatch) setField('ProvinceCode', pMatch.code);
        }

        setAiFilledFields(filled);
        setTimeout(() => setAiFilledFields(new Set()), 6000);
    };

    // Auto-generate Project Code (only in create mode)
    const watchedGroupCode = watch('GroupCode');
    const watchedInvestmentType = watch('InvestmentType');
    const watchedStartDate = watch('StartDate');
    const watchedProvinceCode = watch('ProvinceCode');
    const watchedConstructionType = watch('ConstructionType');

    useEffect(() => {
        if (!isEditMode) {
            const year = new Date(watchedStartDate).getFullYear();
            const ctMap: Record<string, ConstructionType> = {
                'Dân dụng': ConstructionType.Civil,
                'Công nghiệp': ConstructionType.Industrial,
                'Giao thông': ConstructionType.Transport,
                'Nông nghiệp & PTNT': ConstructionType.Agriculture,
                'Hạ tầng kỹ thuật': ConstructionType.Infrastructure,
                'Quốc phòng, an ninh': ConstructionType.Defense,
            };
            const ct = ctMap[watchedConstructionType] || ConstructionType.Civil;
            const code = generateProjectCode(
                watchedProvinceCode,
                watchedGroupCode as ProjectGroup,
                watchedInvestmentType as InvestmentType,
                year,
                undefined,
                ct,
                PermitType.Standard
            );
            setValue('ProjectID', code, { shouldDirty: false });
        }
    }, [isEditMode, watchedGroupCode, watchedInvestmentType, watchedStartDate, watchedProvinceCode, watchedConstructionType, setValue]);

    const toggleMember = (empId: string) => {
        setSelectedMembers(prev => {
            const exists = prev.find(m => m.employeeId === empId);
            if (exists) return prev.filter(m => m.employeeId !== empId);
            return [...prev, { employeeId: empId, role: 'Thành viên' }];
        });
    };

    const updateMemberRole = (empId: string, role: string) => {
        setSelectedMembers(prev => prev.map(m => m.employeeId === empId ? { ...m, role } : m));
    };

    const { addToast } = useToast();

    const onValid: import('react-hook-form').SubmitHandler<ProjectModalFormValues> = async (data) => {
        try {
            setIsLoading(true);
            await onSave({
                ...data,
                StartDate: new Date(data.StartDate) as unknown as string & Date,
            } as Partial<Project> & { StartDate: Date }, selectedMembers);
            onClose();
        } catch (error) {
            console.error('Failed to save project:', error);
            addToast({
                title: 'Lỗi',
                message: 'Không thể lưu dự án. Vui lòng thử lại.',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onInvalid = (errors: any) => {
        // Navigate to the first tab containing an error
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            const targetTab = FIELD_TO_TAB[firstErrorKey];
            if (targetTab) setActiveTab(targetTab);
        }

        // Extract a human-readable error message (handles nested objects)
        let errorMessage = 'Vui lòng kiểm tra lại các trường bắt buộc.';
        for (const key of Object.keys(errors)) {
            const err = errors[key];
            if (err?.message) {
                errorMessage = err.message as string;
                break;
            }
            // nested (e.g. BudgetAllocations.BudgetNSTW)
            if (err && typeof err === 'object') {
                const nestedKey = Object.keys(err)[0];
                if (nestedKey && err[nestedKey]?.message) {
                    errorMessage = `${key}.${nestedKey}: ${err[nestedKey].message}`;
                    break;
                }
            }
        }

        addToast({
            title: 'Lỗi xác thực',
            message: errorMessage,
            type: 'error',
        });
    };

    // ── AI highlight helper ──
    const aiHighlight = (field: string) =>
        aiFilledFields.has(field) ? ' ring-2 ring-emerald-400 dark:ring-emerald-500 border-emerald-400 dark:border-emerald-500 animate-pulse' : '';

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary-50 to-warning-50 dark:from-slate-800 dark:to-slate-800">
                <div>
                    <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {isEditMode ? 'Chỉnh sửa dự án' : 'Thêm mới dự án'}
                    </h2>
                    <p className="text-xs text-txt-muted mt-1">
                        {isEditMode ? 'Cập nhật thông tin dự án' : 'Theo mẫu Phụ lục I (NĐ 175/2024) • Hệ thống tự động tạo mã dự án'}
                    </p>
                </div>
            </div>

                {/* ── AI Image Import Zone (only in create mode) ── */}
                {!isEditMode && (
                    <div className="px-6 py-3 border-b border-border">
                        <div
                            className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer
                                ${aiStatus === 'extracting' ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}
                                ${aiStatus === 'done' ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : ''}
                                ${aiStatus === 'error' ? 'border-red-400 dark:border-red-400 bg-red-50/50 dark:bg-red-900/20' : ''}
                                ${aiStatus === 'idle' ? 'border-gray-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/30 dark:hover:bg-violet-900/10' : ''}
                            `}
                            onClick={() => aiStatus !== 'extracting' && aiFileInputRef.current?.click()}
                        >
                            <input
                                ref={aiFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleAiImageExtract(f);
                                    e.target.value = '';
                                }}
                            />

                            <div className="flex items-center gap-4 p-3">
                                {/* Preview or Icon */}
                                {aiPreviewUrl ? (
                                    <div className="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
                                        <img src={aiPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                        ${aiStatus === 'idle' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-primary-500'}
                                    `}>
                                        {aiStatus === 'extracting' ? (
                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                )}

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    {aiStatus === 'idle' && (
                                        <>
                                            <p className="text-sm font-bold text-txt-secondary flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                                Nhập liệu bằng AI
                                            </p>
                                            <p className="text-[11px] text-txt-placeholder">
                                                Dán ảnh chụp màn hình (Ctrl+V) hoặc click để chọn ảnh — AI sẽ tự điền thông tin
                                            </p>
                                        </>
                                    )}
                                    {aiStatus === 'extracting' && (
                                        <>
                                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Đang trích xuất bằng AI...
                                            </p>
                                            <p className="text-[11px] text-blue-500/70 dark:text-blue-400/60">
                                                Gemini đang phân tích ảnh và trích xuất thông tin dự án
                                            </p>
                                        </>
                                    )}
                                    {aiStatus === 'done' && (
                                        <>
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Đã trích xuất thành công!
                                            </p>
                                            <p className="text-[11px] text-emerald-500/70 dark:text-emerald-400/60">
                                                {aiFilledFields.size > 0 ? `${aiFilledFields.size} trường đã được AI điền — ` : ''}
                                                Click hoặc dán ảnh mới để trích xuất lại
                                            </p>
                                        </>
                                    )}
                                    {aiStatus === 'error' && (
                                        <>
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                                Lỗi trích xuất
                                            </p>
                                            <p className="text-[11px] text-red-500/70 dark:text-red-400/60">
                                                {aiError || 'Vui lòng thử lại'} — Click hoặc dán ảnh mới
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Action icon */}
                                {aiStatus !== 'extracting' && (
                                    <div className="flex-shrink-0">
                                        <ImagePlus className="w-5 h-5 text-txt-placeholder" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex flex-wrap px-6 pt-3 pb-1 border-b border-border bg-bg-subtle gap-y-2 gap-x-1">
                    {PROJ_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const hasError = tab.id !== 'members' && Object.keys(errors).some(f => FIELD_TO_TAB[f] === tab.id);
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-txt-secondary dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                {hasError && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-0.5" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onValid as any, onInvalid)} className="flex flex-col flex-1 min-h-[50vh]">
                    <div className="p-4 overflow-y-auto flex-1">

                        {/* Cảnh báo trường bị khoá theo vai trò thành viên dự án */}
                        {isEditMode && hasRestrictions && lockedFieldLabels.length > 0 && (
                            <div className="mb-4 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs">
                                <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-amber-800 dark:text-amber-300">
                                    <span className="font-semibold">Một số trường bị khoá theo vai trò của bạn trong dự án{myMemberRole ? ` (${myMemberRole})` : ''}.</span>
                                    <span className="block mt-0.5 text-amber-700/90 dark:text-amber-300/80">
                                        Không sửa được: {lockedFieldLabels.slice(0, 12).join(', ')}{lockedFieldLabels.length > 12 ? `… (+${lockedFieldLabels.length - 12} trường)` : ''}.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ═══ Tab 1: Thông tin chung ═══ */}
                        {activeTab === 'general' && (
                            <ProjectFormGeneral
                                formData={formData}
                                updateField={updateField}
                                aiHighlight={aiHighlight}
                                errors={errors}
                            />
                        )}

                        {/* ═══ Tab 2: Pháp lý ═══ */}
                        {activeTab === 'legal' && (
                            <ProjectFormLegal
                                formData={formData}
                                updateField={updateField}
                                aiHighlight={aiHighlight}
                                errors={errors}
                            />
                        )}

                        {/* ═══ Tab 4: Cơ cấu vốn & Chi phí ═══ */}
                        {activeTab === 'investment' && (
                            <ProjectFormInvestment
                                formData={formData}
                                updateField={updateField}
                                errors={errors}
                            />
                        )}

                        {/* ═══ Tab 7: Thành viên ═══ */}
                        {activeTab === 'members' && (
                            <ProjectFormMembers
                                formData={formData}
                                employees={employees}
                                selectedMembers={selectedMembers}
                                toggleMember={toggleMember}
                                updateMemberRole={updateMemberRole}
                            />
                        )}

                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-bg-subtle flex justify-between items-center rounded-b-2xl">
                        <p className="text-[11px] text-txt-placeholder">
                            Các trường không bắt buộc có thể bổ sung sau
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-txt-muted font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                disabled={isLoading}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 rounded-lg bg-primary-600 text-white font-bold shadow-sm shadow-primary-200 dark:shadow-primary-900/30 hover:bg-primary-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    isEditMode ? 'Lưu thay đổi' : 'Tạo dự án'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
        </div>
    );
};

