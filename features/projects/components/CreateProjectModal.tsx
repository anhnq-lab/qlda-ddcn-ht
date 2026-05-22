import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Building2, DollarSign, HardHat, Users, Sparkles, ImagePlus, Loader2, CheckCircle2, BarChart2, Activity, Scale } from 'lucide-react';
import { ProjectGroup, InvestmentType, Project, Employee, MANAGEMENT_BOARDS, SelectedMember } from '../../../types';
import { generateProjectCode, ConstructionType, PermitType, detectSpecialtyByName } from '../../../utils/projectCodeGenerator';
import EmployeeService from '../../../services/EmployeeService';
import { ProjectMemberService } from '../../../services/ProjectMemberService';
import { extractProjectFromImage, fileToBase64, ExtractedProjectData } from '../../../services/ai/aiImageExtractor';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';
import { ProjectModalFormSchema, ProjectModalFormValues } from '../../../schemas/project.schema';

import { ProjectFormGeneral } from './forms/ProjectFormGeneral';
import { ProjectFormLegal } from './forms/ProjectFormLegal';
import { ProjectFormInvestment } from './forms/ProjectFormInvestment';
import { ProjectFormMembers } from './forms/ProjectFormMembers';
import { CONSTRUCTION_TYPES, CONSTRUCTION_GRADES, PROVINCES } from './forms/FormShared';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Project> & { StartDate: Date }, members: SelectedMember[]) => Promise<void>;
    editProject?: Project | null;
}

const PROJ_TABS = [
    { id: 'general',     label: 'Thông tin chung',       icon: Building2 },
    { id: 'legal',       label: 'Pháp lý & Quy mô',      icon: Scale },
    { id: 'investment',  label: 'Cơ cấu vốn & Chi phí',  icon: DollarSign },
    { id: 'members',     label: 'Thành viên',              icon: Users },
] as const;

type TabId = typeof PROJ_TABS[number]['id'];

const FIELD_TO_TAB: Record<string, TabId> = {
    ProjectID: 'general', ProjectName: 'general', GroupCode: 'general',
    InvestmentType: 'general', ManagementBoard: 'general', StartDate: 'general',
    ProvinceCode: 'general', LocationCode: 'general', ConstructionType: 'general',
    CompetentAuthority: 'general', InvestorName: 'general', Duration: 'general',
    ExpectedEndDate: 'general', Objective: 'general', InvestmentScale: 'general',
    SpecialtyType: 'general', SpecialtyDetails: 'general',
    PolicyDecisionLevel: 'legal', PolicyDecisionNumber: 'legal', PolicyDecisionDate: 'legal',
    PolicyDecisionAuthority: 'legal', DecisionNumber: 'legal', DecisionAuthority: 'legal',
    ApprovalDate: 'legal', ConstructionGrade: 'legal', SiteArea: 'legal',
    ConstructionArea: 'legal', FloorArea: 'legal', BuildingHeight: 'legal',
    BuildingDensity: 'legal', LandUseCoefficient: 'legal', TotalEstimate: 'legal',
    DecisionLevelBeforeHandover: 'legal', OldInvestor: 'legal', TransferDecision: 'legal',
    TotalInvestment: 'investment', CapitalSource: 'investment', BudgetAllocations: 'investment',
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
    ApplicableStandards: '',
    FeasibilityContractor: '',
    SurveyContractor: '',
    ReviewContractor: '',
    BiddingForm: '',
    Objective: '',
    InvestmentScale: '',
    TotalEstimate: 0,
    SiteArea: 0,
    ConstructionArea: 0,
    FloorArea: 0,
    BuildingHeight: 0,
    BuildingDensity: 0,
    LandUseCoefficient: 0,
    AboveGroundFloors: 0,
    BasementFloors: 0,
    PolicyDecisionLevel: '',
    PolicyDecisionNumber: '',
    PolicyDecisionDate: '',
    PolicyDecisionAuthority: '',
    BudgetAllocations: {
        BudgetNSTW: 0,
        BudgetNSDiaphuong: 0,
        BudgetLoan: 0,
        BudgetODA: 0,
        BudgetOtherNSNN: 0,
    },
    DecisionAuthority: '',
    ExpectedEndDate: '',
    CostBreakdown: {},
    KHVInfo: {},
    ImplementationTracking: {},
    AdjustedApproval: {},
    ContractorDetails: {},
    ProjectManagement: {},
    ProjectStatusInfo: {},
    DecisionLevelBeforeHandover: '',
    OldInvestor: '',
    TransferDecision: '',
    CurrentStatusCode: null,
    SpecialtyType: '',
    SpecialtyDetails: '',
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSave, editProject }) => {
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

    // Bridge: updateField replaces setFormData(prev => {...}) pattern
    const updateField = useCallback((field: string, value: any) => {
        setValue(field as keyof ProjectModalFormValues, value, { shouldDirty: true });
    }, [setValue]);

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

    const DEFAULT_BUDGET = { BudgetNSTW: 0, BudgetNSDiaphuong: 0, BudgetLoan: 0, BudgetODA: 0, BudgetOtherNSNN: 0 };

    // Populate form data in edit mode
    useEffect(() => {
        if (isOpen && editProject) {
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
                ApplicableStandards: editProject.ApplicableStandards || '',
                FeasibilityContractor: editProject.FeasibilityContractor || '',
                SurveyContractor: editProject.SurveyContractor || '',
                ReviewContractor: editProject.ReviewContractor || '',
                BiddingForm: editProject.BiddingForm || '',
                Objective: editProject.Objective || '',
                InvestmentScale: editProject.InvestmentScale || '',
                TotalEstimate: editProject.TotalEstimate || 0,
                SiteArea: editProject.SiteArea || 0,
                ConstructionArea: editProject.ConstructionArea || 0,
                FloorArea: editProject.FloorArea || 0,
                BuildingHeight: editProject.BuildingHeight || 0,
                BuildingDensity: editProject.BuildingDensity || 0,
                LandUseCoefficient: editProject.LandUseCoefficient || 0,
                AboveGroundFloors: editProject.AboveGroundFloors || 0,
                BasementFloors: editProject.BasementFloors || 0,
                PolicyDecisionLevel: editProject.PolicyDecisionLevel || '',
                PolicyDecisionNumber: editProject.PolicyDecisionNumber || '',
                PolicyDecisionDate: editProject.PolicyDecisionDate || '',
                PolicyDecisionAuthority: editProject.PolicyDecisionAuthority || '',
                BudgetAllocations: { ...DEFAULT_BUDGET, ...(editProject.BudgetAllocations || {}) } as any,
                DecisionAuthority: editProject.DecisionAuthority || '',
                ExpectedEndDate: editProject.ExpectedEndDate ? new Date(editProject.ExpectedEndDate).toISOString().split('T')[0] : '',
                CostBreakdown: (editProject.CostBreakdown || {}) as any,
                KHVInfo: (editProject.KHVInfo || {}) as Record<string, unknown>,
                ImplementationTracking: (editProject.ImplementationTracking || {}) as Record<string, unknown>,
                AdjustedApproval: (editProject.AdjustedApproval || {}) as Record<string, unknown>,
                ContractorDetails: (editProject.ContractorDetails || {}) as Record<string, unknown>,
                ProjectManagement: (editProject.ProjectManagement || {}) as Record<string, unknown>,
                ProjectStatusInfo: (editProject.ProjectStatusInfo || {}) as Record<string, unknown>,
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
                SpecialtyDetails: editProject.SpecialtyDetails || '',
            });
        } else if (isOpen && !editProject) {
            reset(DEFAULT_FORM_VALUES);
        }
    }, [isOpen, editProject, reset]);

    // Fetch employees when modal opens + load existing members in edit mode
    useEffect(() => {
        if (isOpen) {
            EmployeeService.getAll().then(setEmployees).catch(console.error);
            if (editProject?.ProjectID) {
                ProjectMemberService.getSelectedMembers(editProject.ProjectID)
                    .then(members => setSelectedMembers(members))
                    .catch(console.error);
            }
        } else {
            setSelectedMembers([]);
            // Reset AI state
            setAiStatus('idle');
            setAiPreviewUrl(null);
            setAiFilledFields(new Set());
            setAiError('');
        }
    }, [isOpen, editProject]);

    // ── AI: Listen for paste events ──
    useEffect(() => {
        if (!isOpen || isEditMode) return;
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
    }, [isOpen, isEditMode]);

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
        if (data.ApplicableStandards) setField('ApplicableStandards', data.ApplicableStandards);
        if (data.FeasibilityContractor) setField('FeasibilityContractor', data.FeasibilityContractor);
        if (data.SurveyContractor) setField('SurveyContractor', data.SurveyContractor);
        if (data.ReviewContractor) setField('ReviewContractor', data.ReviewContractor);

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
        if (isOpen && !isEditMode) {
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
    }, [isOpen, isEditMode, watchedGroupCode, watchedInvestmentType, watchedStartDate, watchedProvinceCode, watchedConstructionType, setValue]);

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
                Progress: 0,
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="bg-white dark:bg-slate-900 shadow-sm w-full max-w-6xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-primary-50 to-warning-50 dark:from-slate-800 dark:to-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            {isEditMode ? 'Chỉnh sửa dự án' : 'Thêm mới dự án'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            {isEditMode ? 'Cập nhật thông tin dự án' : 'Theo mẫu Phụ lục I (NĐ 175/2024) • Hệ thống tự động tạo mã dự án'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 dark:hover:bg-slate-700 rounded-full text-gray-400 dark:text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── AI Image Import Zone (only in create mode) ── */}
                {!isEditMode && (
                    <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700">
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
                                            <p className="text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                                Nhập liệu bằng AI
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-slate-400">
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
                                        <ImagePlus className="w-5 h-5 text-gray-400 dark:text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex flex-wrap px-6 pt-3 pb-1 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 gap-y-2 gap-x-1">
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
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
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

                        {/* ═══ Tab 1: Thông tin chung ═══ */}
                        {activeTab === 'general' && (
                            <ProjectFormGeneral
                                formData={formData}
                                updateField={updateField}
                                aiHighlight={aiHighlight}
                                errors={errors}
                            />
                        )}

                        {/* ═══ Tab 2: Pháp lý & Quy mô ═══ */}
                        {activeTab === 'legal' && (
                            <ProjectFormLegal
                                formData={formData}
                                updateField={updateField}
                                aiHighlight={aiHighlight}
                                errors={errors}
                            />
                        )}

                        {/* ═══ Tab 3: Cơ cấu vốn & Chi phí ═══ */}
                        {activeTab === 'investment' && (
                            <ProjectFormInvestment
                                formData={formData}
                                updateField={updateField}
                                errors={errors}
                            />
                        )}

                        {/* ═══ Tab 5: Thành viên ═══ */}
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
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-between items-center rounded-b-2xl">
                        <p className="text-[11px] text-gray-400 dark:text-slate-400">
                            Các trường không bắt buộc có thể bổ sung sau
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
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
        </div>
    );
};

