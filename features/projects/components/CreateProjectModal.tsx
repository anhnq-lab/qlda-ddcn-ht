import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Building2, Calendar, DollarSign, MapPin, User, Clock, FileText, HardHat, Search, Shield, Users, Check, ChevronDown, Sparkles, ImagePlus, Loader2, CheckCircle2, Ruler, Layers } from 'lucide-react';
import { ProjectGroup, InvestmentType, Project, Employee, MANAGEMENT_BOARDS, SelectedMember } from '../../../types';
import { generateProjectCode, ConstructionType, PermitType } from '../../../utils/projectCodeGenerator';
import EmployeeService from '../../../services/EmployeeService';
import { ProjectMemberService } from '../../../services/ProjectMemberService';
import { extractProjectFromImage, fileToBase64, ExtractedProjectData } from '../../../services/ai/aiImageExtractor';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Project> & { StartDate: Date }, members: SelectedMember[]) => Promise<void>;
    editProject?: Project | null;
}

import { ProjectFormGeneral } from './forms/ProjectFormGeneral';
import { ProjectFormInvestment } from './forms/ProjectFormInvestment';
import { ProjectFormScale } from './forms/ProjectFormScale';
import { ProjectFormContractors } from './forms/ProjectFormContractors';
import { CONSTRUCTION_TYPES, CONSTRUCTION_GRADES, PROVINCES } from './forms/FormShared';

const PROJ_TABS = [
    { id: 'general', label: 'Thông tin chung', icon: Building2 },
    { id: 'investment', label: 'Đầu tư & Phê duyệt', icon: DollarSign },
    { id: 'scale', label: 'Quy mô xây dựng', icon: Ruler },
    { id: 'contractors', label: 'Nhà thầu & Tiêu chuẩn', icon: HardHat },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSave, editProject }) => {
    const isEditMode = !!editProject;
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
    const [showCapitalDropdown, setShowCapitalDropdown] = useState(false);

    // ── AI Image Extraction ──
    const [aiStatus, setAiStatus] = useState<'idle' | 'extracting' | 'done' | 'error'>('idle');
    const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
    const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
    const [aiError, setAiError] = useState('');
    const aiFileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'investment' | 'scale' | 'contractors' | 'members'>('general');
    const [formData, setFormData] = useState({
        // Section 1 - Thông tin cơ bản
        ProjectID: '',
        ProjectName: '',
        GroupCode: ProjectGroup.C,
        InvestmentType: InvestmentType.Public,
        StartDate: new Date().toISOString().split('T')[0],
        // Section 2 - Thông tin đầu tư
        TotalInvestment: 0,
        CapitalSource: 'Ngân sách Địa phương',
        ProvinceCode: '79', // TP. Hồ Chí Minh default
        LocationCode: '',
        ConstructionType: '',
        ConstructionGrade: '',
        CompetentAuthority: 'UBND TP.HCM',
        InvestorName: 'Ban QLDA ĐTXD CN',
        Duration: '',
        ManagementBoard: 1,
        ApprovalDate: '',
        DecisionNumber: '',
        // Section 3 - Nhà thầu & Tiêu chuẩn
        ApplicableStandards: '',
        FeasibilityContractor: '',
        SurveyContractor: '',
        ReviewContractor: '',
        // Mục tiêu & Quy mô đầu tư
        Objective: '',
        InvestmentScale: '',
        // Section 2.5 - Quy mô công trình
        TotalEstimate: 0,
        SiteArea: 0,
        ConstructionArea: 0,
        FloorArea: 0,
        BuildingHeight: 0,
        BuildingDensity: 0,
        LandUseCoefficient: 0,
        AboveGroundFloors: 0,
        BasementFloors: 0,
    });

    // Populate form data in edit mode
    useEffect(() => {
        if (isOpen && editProject) {
            setFormData({
                ProjectID: editProject.ProjectID || '',
                ProjectName: editProject.ProjectName || '',
                GroupCode: editProject.GroupCode || ProjectGroup.C,
                InvestmentType: editProject.InvestmentType || InvestmentType.Public,
                StartDate: editProject.StartDate ? new Date(editProject.StartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                TotalInvestment: editProject.TotalInvestment || 0,
                CapitalSource: editProject.CapitalSource || 'Ngân sách Địa phương',
                ProvinceCode: editProject.ProvinceCode || '79',
                LocationCode: editProject.LocationCode || '',
                ConstructionType: editProject.ConstructionType || '',
                ConstructionGrade: editProject.ConstructionGrade || '',
                CompetentAuthority: editProject.CompetentAuthority || 'UBND TP.HCM',
                InvestorName: editProject.InvestorName || 'Ban QLDA ĐTXD CN',
                Duration: editProject.Duration || '',
                ManagementBoard: editProject.ManagementBoard || 1,
                ApprovalDate: editProject.ApprovalDate ? new Date(editProject.ApprovalDate).toISOString().split('T')[0] : '',
                DecisionNumber: editProject.DecisionNumber || '',
                ApplicableStandards: editProject.ApplicableStandards || '',
                FeasibilityContractor: editProject.FeasibilityContractor || '',
                SurveyContractor: editProject.SurveyContractor || '',
                ReviewContractor: editProject.ReviewContractor || '',
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
            });
        }
    }, [isOpen, editProject]);

    // Fetch employees when modal opens + load existing members in edit mode
    useEffect(() => {
        if (isOpen) {
            EmployeeService.getAll().then(setEmployees).catch(console.error);
            // Load existing members when editing
            if (editProject?.ProjectID) {
                ProjectMemberService.getSelectedMembers(editProject.ProjectID)
                    .then(members => {
                        setSelectedMembers(members);
                    })
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

        // Show preview
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

        setFormData(prev => {
            const next = { ...prev };

            if (data.ProjectName) { next.ProjectName = data.ProjectName; filled.add('ProjectName'); }
            if (data.Duration) { next.Duration = data.Duration; filled.add('Duration'); }
            if (data.CompetentAuthority) { next.CompetentAuthority = data.CompetentAuthority; filled.add('CompetentAuthority'); }
            if (data.InvestorName) { next.InvestorName = data.InvestorName; filled.add('InvestorName'); }
            if (data.CapitalSource) { next.CapitalSource = data.CapitalSource; filled.add('CapitalSource'); }
            if (data.LocationCode) { next.LocationCode = data.LocationCode; filled.add('LocationCode'); }
            if (data.ApplicableStandards) { next.ApplicableStandards = data.ApplicableStandards; filled.add('ApplicableStandards'); }
            if (data.FeasibilityContractor) { next.FeasibilityContractor = data.FeasibilityContractor; filled.add('FeasibilityContractor'); }
            if (data.SurveyContractor) { next.SurveyContractor = data.SurveyContractor; filled.add('SurveyContractor'); }
            if (data.ReviewContractor) { next.ReviewContractor = data.ReviewContractor; filled.add('ReviewContractor'); }

            // TotalInvestment
            if (data.TotalInvestment && data.TotalInvestment > 0) {
                next.TotalInvestment = data.TotalInvestment;
                filled.add('TotalInvestment');
            }

            // StartDate (YYYY-MM-DD)
            if (data.StartDate && /^\d{4}-\d{2}-\d{2}$/.test(data.StartDate)) {
                next.StartDate = data.StartDate;
                filled.add('StartDate');
            }

            // GroupCode mapping
            if (data.GroupCode) {
                const gMap: Record<string, ProjectGroup> = {
                    'A': ProjectGroup.A, 'B': ProjectGroup.B, 'C': ProjectGroup.C, 'QN': ProjectGroup.QN,
                    'Nhóm A': ProjectGroup.A, 'Nhóm B': ProjectGroup.B, 'Nhóm C': ProjectGroup.C,
                };
                const mapped = gMap[data.GroupCode];
                if (mapped) { next.GroupCode = mapped; filled.add('GroupCode'); }
            }

            // ConstructionType mapping
            if (data.ConstructionType) {
                const validTypes = CONSTRUCTION_TYPES.map(t => t.label);
                const match = validTypes.find(t => data.ConstructionType!.includes(t));
                if (match) { next.ConstructionType = match; filled.add('ConstructionType'); }
            }

            // ConstructionGrade mapping
            if (data.ConstructionGrade) {
                const validGrades = CONSTRUCTION_GRADES.map(g => g.value);
                const match = validGrades.find(g => data.ConstructionGrade!.includes(g));
                if (match) { next.ConstructionGrade = match; filled.add('ConstructionGrade'); }
            }

            // Province mapping (match name → code)
            if (data.ProvinceName) {
                const pMatch = PROVINCES.find(p =>
                    data.ProvinceName!.includes(p.name) || p.name.includes(data.ProvinceName!)
                );
                if (pMatch) { next.ProvinceCode = pMatch.code; filled.add('ProvinceCode'); }
            }

            return next;
        });

        setAiFilledFields(filled);
        // Auto-clear highlights after 6 seconds
        setTimeout(() => setAiFilledFields(new Set()), 6000);
    };

    // Auto-generate Project Code theo TT 24/2025/TT-BXD (only in create mode)
    useEffect(() => {
        if (isOpen && !isEditMode) {
            const year = new Date(formData.StartDate).getFullYear();
            // Map ConstructionType string to enum, default to Civil
            const ctMap: Record<string, ConstructionType> = {
                'Dân dụng': ConstructionType.Civil,
                'Công nghiệp': ConstructionType.Industrial,
                'Giao thông': ConstructionType.Transport,
                'Nông nghiệp & PTNT': ConstructionType.Agriculture,
                'Hạ tầng kỹ thuật': ConstructionType.Infrastructure,
                'Quốc phòng, an ninh': ConstructionType.Defense,
            };
            const ct = ctMap[formData.ConstructionType] || ConstructionType.Civil;
            const code = generateProjectCode(
                formData.ProvinceCode,
                formData.GroupCode,
                formData.InvestmentType,
                year,
                undefined, // random sequence
                ct,
                PermitType.Standard // default to standard permit
            );
            setFormData(prev => ({ ...prev, ProjectID: code }));
        }
    }, [isOpen, isEditMode, formData.GroupCode, formData.InvestmentType, formData.StartDate, formData.ProvinceCode, formData.ConstructionType]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Temporary disable advanced schema validation due to missing Zod definitions
        if (!formData.ProjectID || !formData.ProjectName) {
            addToast({
                title: 'Lỗi xác thực',
                message: 'Mã dự án và Tên dự án là bắt buộc.',
                type: 'error'
            });
            return;
        }

        try {
            setIsLoading(true);
            await onSave({
                ...formData,
                Progress: 0,
                StartDate: new Date(formData.StartDate) as unknown as string & Date
            } as Partial<Project> & { StartDate: Date }, selectedMembers);
            onClose();
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ── AI highlight helper ──
    const aiHighlight = (field: string) => aiFilledFields.has(field) ? ' ring-2 ring-emerald-400 dark:ring-emerald-500 border-emerald-400 dark:border-emerald-500 animate-pulse' : '';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="bg-bg-surface shadow-sm w-full max-w-6xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-primary-50 to-yellow-50 dark:from-slate-800 dark:to-slate-800">
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
                <div className="flex flex-wrap px-6 pt-3 pb-1 border-b border-gray-200 dark:border-slate-700 bg-bg-app dark:bg-slate-900 dark:bg-slate-800 gap-y-2 gap-x-1">
                    {PROJ_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    isActive 
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-[50vh]">
                    <div className="p-4 overflow-y-auto flex-1">

                    {/* ═══ SECTION 1: Thông tin cơ bản ═══ */}
                    {activeTab === 'general' && (
                        <ProjectFormGeneral
                            formData={formData}
                            updateField={updateField}
                            aiHighlight={aiHighlight}
                            employees={employees}
                            selectedMembers={selectedMembers}
                            toggleMember={toggleMember}
                            updateMemberRole={updateMemberRole}
                        />
                    )}

                    {/* ═══ SECTION 2: Thông tin đầu tư ═══ */}
                    {activeTab === 'investment' && (
                        <ProjectFormInvestment
                            formData={formData}
                            updateField={updateField}
                            aiHighlight={aiHighlight}
                            showCapitalDropdown={showCapitalDropdown}
                            setShowCapitalDropdown={setShowCapitalDropdown}
                        />
                    )}

                    {/* ═══ SECTION 2.5: Quy mô công trình ═══ */}
                    {activeTab === 'scale' && (
                        <ProjectFormScale
                            formData={formData}
                            updateField={updateField}
                        />
                    )}

                    {/* ═══ SECTION 3: Nhà thầu & Tiêu chuẩn ═══ */}
                    {activeTab === 'contractors' && (
                        <ProjectFormContractors
                            formData={formData}
                            updateField={updateField}
                            aiHighlight={aiHighlight}
                        />
                    )}



                    </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-bg-app dark:bg-slate-900 dark:bg-slate-800 flex justify-between items-center rounded-b-2xl">
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
