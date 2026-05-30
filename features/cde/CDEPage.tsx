// ═══════════════════════════════════════════════════════════════
// CDE Page — Orchestrator Component (Phase 4)
// Common Data Environment (ISO 19650 + VN Construction QLDA)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { useTabSearchParam } from '@/hooks/useTabSearchParam';
import { useAuth } from '../../context/AuthContext';
import { useScopedProjects } from '../../hooks/useScopedProjects';
import { useCDEFolders, useCDEDocuments, useCDEProjectDocuments, useCDEStats, useCDEWorkflowHistory, useUploadCDE, useProcessWorkflowStep, useDownloadCDE, useCDEUserPermission, useCDEItems, useUploadIFCToCDE } from '../../hooks/useCDE';
import { useNavigate } from 'react-router-dom';
import { CDE_WORKFLOW_STEPS, CDE_PROJECT_PHASES } from './constants';
import type { CDEDocument, CDEItem } from './types';
import { CDEService } from '../../services/CDEService';
import { CDEItemService } from '../../services/cde/CDEItemService';

import CDEHeader from './components/CDEHeader';
import CDEFolderTree from './components/CDEFolderTree';
import CDEDocumentTable from './components/CDEDocumentTable';
import CDEWorkflowPanel from './components/CDEWorkflowPanel';
import CDESubmitModal from './components/CDESubmitModal';

import CDEFilterBar, { type CDEFilters } from './components/CDEFilterBar';
import CDEBatchActions from './components/CDEBatchActions';
import CDEDashboard from './components/CDEDashboard';
import CDEPermissionManager from './components/CDEPermissionManager';
import CDETransmittalForm from './components/CDETransmittalForm';
import CDEAuditLog from './components/CDEAuditLog';
import CDEFilePreview from './components/CDEFilePreview';
import CDEDigitalSign from './components/CDEDigitalSign';
import CDEIssuesPanel from './components/CDEIssuesPanel';
import CDEVersionPanel from './components/CDEVersionPanel';
import CDEReviewPanel from './components/CDEReviewPanel';
import { supabase } from '../../lib/supabase';
import { FolderOpen, BarChart3, Shield, ClipboardList, ScrollText, GitBranch, ClipboardCheck } from 'lucide-react';

import { useContracts } from '../../hooks/useContracts';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import CDEInternalWorkflowPanel from './components/CDEInternalWorkflowPanel';
import CDETransmittalsList from './components/CDETransmittalsList';
import { useCDEInternalWorkflowInstances, useCreateInternalWorkflow, useProcessInternalWorkflowStep } from '../../hooks/useCDE';
import { CDE_INTERNAL_WORKFLOW_TEMPLATES } from './constants';
import type { InternalDepartment } from './types';

const EMPTY_FILTERS: CDEFilters = { status: [], discipline: [], docType: [], dateFrom: '', dateTo: '' };

const CDEPage: React.FC = () => {
    const { currentUser, userType, contractorId } = useAuth();
    const { scopedProjects: allProjects } = useScopedProjects({ pageSize: 9999 });
    const { contracts } = useContracts();
    const { biddingPackages } = useAllBiddingPackages();

    // Contractors: only show projects where they have contracts
    // Contractors: only show projects assigned to them (handled by useScopedProjects)
    const projects = allProjects;

    // State
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<CDEDocument | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showTransmittal, setShowTransmittal] = useState(false);
    const [filters, setFilters] = useState<CDEFilters>(EMPTY_FILTERS);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useTabSearchParam('explorer', ['explorer', 'analytics', 'permissions', 'transmittals', 'audit', 'internal-workflow', 'issues', 'reviews'] as const);
    const [activePhase, setActivePhase] = useState('implementation');
    const [previewDoc, setPreviewDoc] = useState<CDEDocument | null>(null);
    const [signDoc, setSignDoc] = useState<CDEDocument | null>(null);
    const [versionDoc, setVersionDoc] = useState<CDEDocument | null>(null);

    // Set default project
    React.useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].ProjectID);
        }
    }, [projects, selectedProjectId]);



    const navigate = useNavigate();

    // Queries
    const { data: folders = [], isLoading: foldersLoading } = useCDEFolders(selectedProjectId);
    const { data: docs = [], isLoading: docsLoading } = useCDEDocuments(activeFolderId);
    const { data: cdeItems = [] } = useCDEItems(activeFolderId);
    const bimItems = useMemo(() => cdeItems.filter((i) => i.kind === 'bim'), [cdeItems]);
    const { data: workflowHistory = [] } = useCDEWorkflowHistory(selectedDoc?.doc_id || null);

    // Mutations & Hooks
    const uploadMutation = useUploadCDE();
    const ifcUploadMutation = useUploadIFCToCDE();
    const workflowMutation = useProcessWorkflowStep();
    const { data: stats } = useCDEStats(selectedProjectId);
    const { data: projectDocs = [] } = useCDEProjectDocuments(selectedProjectId);
    const { download: downloadFile } = useDownloadCDE();
    const { data: userPermission } = useCDEUserPermission(selectedProjectId, currentUser?.EmployeeID || '');

    // Internal workflow
    const { data: internalInstances = [], isLoading: instancesLoading } = useCDEInternalWorkflowInstances(selectedProjectId);
    const createWorkflowMutation = useCreateInternalWorkflow();
    const processWorkflowStepMutation = useProcessInternalWorkflowStep();

    // Map department code from user's department string
    const currentUserDept: InternalDepartment | undefined = (() => {
        const dept = currentUser?.Department || '';
        if (dept.includes('HC') || dept.includes('Hành chính')) return 'HC_TH';
        if (dept.includes('ĐHDA') || dept.includes('Điều hành')) return 'DHDA';
        if (dept.includes('PTDV') || dept.includes('Phát triển')) return 'PTDV';
        if (dept.includes('KT') || dept.includes('Kỹ thuật')) return 'KT_TD';
        if (dept.includes('KH') || dept.includes('TC') || dept.includes('Tài chính')) return 'KH_TC';
        if ((currentUser?.Role as string) === 'director' || dept.includes('Giám đốc')) return 'DIRECTOR';
        return undefined;
    })();

    const handleCreateInternalWorkflow = async (templateId: string, title: string, docId?: number) => {
        const template = CDE_INTERNAL_WORKFLOW_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;
        const firstStep = template.steps[0];
        await createWorkflowMutation.mutateAsync({
            projectId: selectedProjectId,
            templateId: template.id,
            templateCode: template.code,
            templateName: template.name,
            title,
            createdBy: currentUser?.EmployeeID || '',
            createdByName: currentUser?.FullName || '',
            docId,
            firstStepDef: {
                step_no: firstStep.step_no,
                code: firstStep.code,
                name: firstStep.name,
                department: firstStep.department,
                department_label: firstStep.department_label,
            },
        });
        setToast({ message: 'Đã khởi tạo quy trình nội bộ', type: 'success' });
    };

    const handleProcessInternalStep = async (instanceId: string, stepNo: number, action: 'done' | 'rejected' | 'return_to_prev', comment: string) => {
        const instance = internalInstances.find(i => i.id === instanceId);
        if (!instance) return;
        const template = CDE_INTERNAL_WORKFLOW_TEMPLATES.find(t => t.id === instance.template_id);
        if (!template) return;
        const currentStepDef = template.steps.find(s => s.step_no === stepNo);
        if (!currentStepDef) return;
        const nextStepDef = action === 'done' ? template.steps.find(s => s.step_no === stepNo + 1) : undefined;
        const prevStepDef = action === 'return_to_prev' ? template.steps.find(s => s.step_no === stepNo - 1) : undefined;
        await processWorkflowStepMutation.mutateAsync({
            instanceId,
            stepNo,
            stepCode: currentStepDef.code,
            stepName: currentStepDef.name,
            department: currentStepDef.department,
            departmentLabel: currentStepDef.department_label,
            action,
            comment,
            actorId: currentUser?.EmployeeID || '',
            actorName: currentUser?.FullName || '',
            instanceTitle: instance.title,
            nextStepDef: nextStepDef ? {
                step_no: nextStepDef.step_no,
                code: nextStepDef.code,
                name: nextStepDef.name,
                department: nextStepDef.department,
                department_label: nextStepDef.department_label,
                sla_days: nextStepDef.sla_days,
            } : undefined,
            prevStepDef: prevStepDef ? {
                step_no: prevStepDef.step_no,
                code: prevStepDef.code,
                name: prevStepDef.name,
                department: prevStepDef.department,
                department_label: prevStepDef.department_label,
                sla_days: prevStepDef.sla_days,
            } : undefined,
        });
        const labels: Record<string, string> = { done: 'Đã chuyển bước tiếp theo', rejected: 'Đã từ chối hồ sơ', return_to_prev: 'Đã trả lại bước trước' };
        setToast({ message: labels[action] || 'Hoàn thành', type: action === 'rejected' ? 'error' : 'success' });
    };

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    React.useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Auto-select first root folder
    React.useEffect(() => {
        if (folders.length > 0 && !activeFolderId) {
            const firstRoot = folders.find(f => !f.parent_id);
            if (firstRoot) setActiveFolderId(firstRoot.id);
        }
    }, [folders, activeFolderId]);

    const handleProjectChange = useCallback((id: string) => {
        setSelectedProjectId(id);
        setActiveFolderId(null);
        setSelectedDoc(null);
        setSelectedIds([]);
    }, []);

    const activeFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);

    const projectOptions = useMemo(() =>
        projects.map(p => ({ ProjectID: p.ProjectID, ProjectName: p.ProjectName })),
        [projects]
    );

    // Filtered documents
    const filteredDocs = useMemo(() => {
        let result = docs;
        if (filters.status.length > 0) result = result.filter(d => filters.status.includes(d.cde_status || 'S0'));
        if (filters.discipline.length > 0) result = result.filter(d => filters.discipline.includes(d.discipline || ''));
        if (filters.docType.length > 0) result = result.filter(d => filters.docType.includes(d.doc_type || ''));
        if (filters.dateFrom) result = result.filter(d => d.upload_date && d.upload_date >= filters.dateFrom);
        if (filters.dateTo) result = result.filter(d => d.upload_date && d.upload_date <= filters.dateTo);
        return result;
    }, [docs, filters]);

    const hasActiveFilters = filters.status.length > 0 || filters.discipline.length > 0 || filters.docType.length > 0 || !!filters.dateFrom || !!filters.dateTo;

    // File preview — open CDEFilePreview modal
    const handlePreview = useCallback(async (doc: CDEDocument) => {
        if (!doc.storage_path) return;
        const { data } = supabase.storage.from('documents').getPublicUrl(doc.storage_path);
        if (data?.publicUrl) {
            setPreviewDoc({ ...doc, storage_path: data.publicUrl } as CDEDocument);
        }
    }, []);

    // Digital sign handler
    const handleSign = useCallback((doc: CDEDocument) => {
        setSignDoc(doc);
    }, []);

    // Open BIM item → standalone BIM viewer + audit log (TT47 2.2.9)
    const handleOpenBim = useCallback((item: CDEItem) => {
        if (currentUser?.EmployeeID) {
            CDEItemService.logBimOpen(item.ref_id, {
                id: currentUser.EmployeeID,
                name: currentUser.FullName || '',
                projectId: selectedProjectId,
            }).catch(() => {});
        }
        navigate(`/bim/${selectedProjectId}`);
    }, [navigate, selectedProjectId, currentUser]);

    // Sensitivity level update (TT47 2.2.5.3)
    const handleUpdateSensitivity = useCallback(async (kind: 'doc' | 'bim', refId: string, level: number) => {
        try {
            await CDEItemService.updateSensitivity(
                { kind, ref_id: refId },
                level,
                currentUser?.EmployeeID ? { id: currentUser.EmployeeID, name: currentUser.FullName || '', projectId: selectedProjectId } : undefined
            );
            setToast({ message: `Đã cập nhật nhãn nhạy cảm`, type: 'success' });
        } catch (err: any) {
            setToast({ message: `Lỗi: ${err.message}`, type: 'error' });
        }
    }, [currentUser, selectedProjectId]);

    // Upload handler — route .ifc files into the BIM federation flow
    const handleSubmit = useCallback((data: { file: File; folderId: string; discipline: string; docType: string; notes: string }) => {
        const isIFC = data.file.name.toLowerCase().endsWith('.ifc');
        if (isIFC) {
            ifcUploadMutation.mutate({
                file: data.file,
                projectId: selectedProjectId,
                folderId: data.folderId,
                discipline: data.discipline,
                userId: currentUser?.EmployeeID || '',
                userName: currentUser?.FullName || '',
                userOrg: currentUser?.Department || 'Ban QLDA',
                contractorId: contractorId || undefined,
            }, {
                onSuccess: () => {
                    setShowSubmitModal(false);
                    setToast({ message: 'Tải lên mô hình BIM thành công! Mở mô hình để xử lý hiển thị.', type: 'success' });
                },
                onError: (err: Error) => {
                    setToast({ message: `Tải lên BIM thất bại: ${err.message}`, type: 'error' });
                },
            });
            return;
        }
        uploadMutation.mutate({
            file: data.file,
            projectId: selectedProjectId,
            folderId: data.folderId,
            discipline: data.discipline,
            docType: data.docType,
            notes: data.notes,
            userId: currentUser?.EmployeeID || '',
            userName: currentUser?.FullName || '',
            userOrg: currentUser?.Department || 'Ban QLDA',
            contractorId: contractorId || undefined,
        }, {
            onSuccess: () => {
                setShowSubmitModal(false);
                setToast({ message: 'Nộp hồ sơ thành công!', type: 'success' });
            },
            onError: (err: Error) => {
                console.error('Upload error:', err);
                setToast({ message: `Nộp hồ sơ thất bại: ${err.message}`, type: 'error' });
            },
        });
    }, [uploadMutation, selectedProjectId, currentUser, contractorId]);

    // Download handler
    const handleDownload = useCallback(async (doc: CDEDocument) => {
        if (!doc.storage_path) {
            setToast({ message: 'Tài liệu chưa có file đính kèm', type: 'error' });
            return;
        }
        try {
            await downloadFile(doc.storage_path, doc.doc_name);
        } catch (err: any) {
            setToast({ message: `Tải xuống thất bại: ${err.message}`, type: 'error' });
        }
    }, [downloadFile]);

    // Workflow handlers
    const getNextStep = useCallback(() => {
        const STATUS_ORDER = ['S0', 'S1', 'S2', 'S3', 'A1'];
        const currentStatusIdx = STATUS_ORDER.indexOf(selectedDoc?.cde_status || 'S0');

        if (workflowHistory.length === 0 && currentStatusIdx <= 0) return CDE_WORKFLOW_STEPS[0];
        const last = workflowHistory.length > 0 ? workflowHistory[workflowHistory.length - 1] : null;
        if (last?.status === 'Rejected' || last?.status === 'Returned') return CDE_WORKFLOW_STEPS[0];
        if (last?.status === 'Pending') return CDE_WORKFLOW_STEPS.find(s => s.code === last.step_code || s.name === last.step_name);
        // Find first non-completed step based on cde_status
        const nextUncompleted = CDE_WORKFLOW_STEPS.find(s => {
            const stepTargetIdx = STATUS_ORDER.indexOf(s.nextStatus);
            return stepTargetIdx > currentStatusIdx;
        });
        return nextUncompleted || null;
    }, [workflowHistory, selectedDoc]);

    const handleWorkflow = useCallback((status: 'Approved' | 'Rejected' | 'Returned', comment?: string) => {
        if (!selectedDoc) return;
        const step = getNextStep();
        if (!step) return;
        workflowMutation.mutate({
            docId: selectedDoc.doc_id,
            stepName: step.name,
            stepCode: step.code,
            actorId: currentUser?.EmployeeID || '',
            actorName: currentUser?.FullName || '',
            actorRole: step.roleLabel,
            status,
            comment: comment || (status === 'Approved' ? 'Đã duyệt' : status === 'Returned' ? 'Yêu cầu bổ sung' : 'Từ chối'),
        }, {
            onSuccess: () => {
                const labels = { Approved: 'Đã duyệt', Rejected: 'Đã từ chối', Returned: 'Yêu cầu bổ sung' };
                setToast({ message: `${labels[status]} hồ sơ thành công`, type: status === 'Rejected' ? 'error' : 'success' });
            },
            onError: (err: Error) => {
                setToast({ message: `Thao tác thất bại: ${err.message}`, type: 'error' });
            },
        });
    }, [selectedDoc, getNextStep, workflowMutation, currentUser]);

    // Determine the correct workflow step for a doc based on its current cde_status
    const getStepForDoc = useCallback((docId: number) => {
        const STATUS_ORDER = ['S0', 'S1', 'S2', 'S3', 'A1'];
        const doc = (hasActiveFilters ? filteredDocs : docs).find(d => d.doc_id === docId);
        const currentStatusIdx = STATUS_ORDER.indexOf(doc?.cde_status || 'S0');
        return CDE_WORKFLOW_STEPS.find(s => {
            const stepTargetIdx = STATUS_ORDER.indexOf(s.nextStatus);
            return stepTargetIdx > currentStatusIdx;
        }) || CDE_WORKFLOW_STEPS[0];
    }, [docs, filteredDocs, hasActiveFilters]);

    // Batch handlers
    const handleBatchApprove = useCallback((ids: number[]) => {
        ids.forEach(docId => {
            const step = getStepForDoc(docId);
            workflowMutation.mutate({
                docId, stepName: step.name, stepCode: step.code,
                actorId: currentUser?.EmployeeID || '', actorName: currentUser?.FullName || '',
                actorRole: step.roleLabel, status: 'Approved', comment: 'Duyệt hàng loạt',
            });
        });
        setSelectedIds([]);
    }, [getStepForDoc, workflowMutation, currentUser]);

    const handleBatchReject = useCallback((ids: number[]) => {
        ids.forEach(docId => {
            const step = getStepForDoc(docId);
            workflowMutation.mutate({
                docId, stepName: step.name, stepCode: step.code,
                actorId: currentUser?.EmployeeID || '', actorName: currentUser?.FullName || '',
                actorRole: step.roleLabel, status: 'Rejected', comment: 'Từ chối hàng loạt',
            });
        });
        setSelectedIds([]);
    }, [getStepForDoc, workflowMutation, currentUser]);

    const handleBatchMove = useCallback(async (ids: number[], targetFolderId: string) => {
        try {
            await Promise.all(ids.map(docId =>
                CDEService.moveDocument(docId, targetFolderId, currentUser?.EmployeeID, currentUser?.FullName, selectedProjectId)
            ));
            setSelectedIds([]);
            setToast({ message: `Đã di chuyển ${ids.length} tài liệu`, type: 'success' });
        } catch (err: any) {
            setToast({ message: `Di chuyển thất bại: ${err.message}`, type: 'error' });
        }
    }, [currentUser, selectedProjectId]);

    // Toggle doc selection
    const toggleDocSelect = useCallback((docId: number) => {
        setSelectedIds(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
    }, []);

    // Count workflow instances pending current user's action
    const pendingForMe = useMemo(() =>
        internalInstances.filter(inst => {
            if (inst.status !== 'in_progress' || !currentUserDept) return false;
            const template = CDE_INTERNAL_WORKFLOW_TEMPLATES.find(t => t.id === inst.template_id);
            const stepDef = template?.steps.find(s => s.step_no === inst.current_step_no);
            return stepDef?.department === currentUserDept;
        }).length,
        [internalInstances, currentUserDept]
    );

    const TABS = [
        { key: 'explorer' as const, label: 'Quản lý', icon: FolderOpen, badge: 0 },
        { key: 'analytics' as const, label: 'Thống kê', icon: BarChart3, badge: 0 },
        { key: 'internal-workflow' as const, label: 'Quy trình', icon: GitBranch, badge: pendingForMe },
        { key: 'transmittals' as const, label: 'Phiếu C/G', icon: ClipboardList, badge: 0 },
        { key: 'issues' as const, label: 'Vấn đề', icon: ClipboardList, badge: 0 },
        { key: 'reviews' as const, label: 'Gói duyệt', icon: ClipboardCheck, badge: 0 },
        { key: 'permissions' as const, label: 'Phân quyền', icon: Shield, badge: 0 },
        { key: 'audit' as const, label: 'Nhật ký', icon: ScrollText, badge: 0 },
    ];

    const selectedProject = projects.find(p => p.ProjectID === selectedProjectId);

    return (
        <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
            <CDEHeader
                projects={projectOptions}
                selectedProjectId={selectedProjectId}
                onProjectChange={handleProjectChange}
                stats={stats}
                onUpload={() => setShowSubmitModal(true)}
                isUploading={uploadMutation.isPending}
                canUpload={true}
                userRole={currentUser?.Role}
                hideStats={userType === 'contractor'}
            />

            {/* Tab Navigation */}
            {userType !== 'contractor' && (
                <div className="flex items-center gap-1 bg-bg-muted p-1.5 rounded-2xl w-fit border border-border shadow-inner-sm">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.key
                                ? 'bg-bg-surface border-border text-txt-primary shadow-sm'
                                : 'border-transparent text-txt-secondary hover:text-txt-primary hover:bg-bg-hover-row'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className="bg-warning-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-0.5">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}



            {/* Tab: Explorer */}
            {activeTab === 'explorer' && (
                <>
                    <CDEBatchActions
                        selectedIds={selectedIds}
                        docs={filteredDocs}
                        folders={folders}
                        onApprove={handleBatchApprove}
                        onReject={handleBatchReject}
                        onMove={handleBatchMove}
                        onClearSelection={() => setSelectedIds([])}
                    />

                    {!selectedDoc && (
                        <CDEFilterBar
                            filters={filters}
                            onChange={setFilters}
                            onClear={() => setFilters(EMPTY_FILTERS)}
                            resultCount={filteredDocs.length}
                        />
                    )}

                    <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                        <CDEFolderTree
                            folders={folders}
                            activeFolderId={activeFolderId}
                            isLoading={foldersLoading}
                            onSelectFolder={(id) => { setActiveFolderId(id); setSelectedDoc(null); setSelectedIds([]); }}
                            activePhase={activePhase}
                            onChangePhase={async (phase) => {
                                setActivePhase(phase);
                                // Auto-seed folders for the phase if none exist
                                const phaseConfig = CDE_PROJECT_PHASES.find(p => p.id === phase);
                                const hasPhase = folders.some(f => (f as any).phase === phase && f.parent_id !== null);
                                if (phaseConfig && !hasPhase && selectedProjectId) {
                                    await CDEService.seedPhaseFolders(selectedProjectId, phase, phaseConfig.folders);
                                }
                            }}
                        />

                        <CDEDocumentTable
                            folders={folders}
                            activeFolder={activeFolder}
                            activeFolderId={activeFolderId}
                            docs={hasActiveFilters ? filteredDocs : docs}
                            isLoading={docsLoading}
                            searchQuery={searchQuery}
                            selectedDocId={selectedDoc?.doc_id || null}
                            onSearchChange={setSearchQuery}
                            onSelectDoc={setSelectedDoc}
                            onPreview={handlePreview}
                            onDownload={handleDownload}
                            onSign={handleSign}
                            onUpload={() => setShowSubmitModal(true)}
                            onFolderClick={setActiveFolderId}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleDocSelect}
                            onVersions={setVersionDoc}
                            bimItems={bimItems}
                            onOpenBim={handleOpenBim}
                            onUpdateSensitivity={handleUpdateSensitivity}
                        />

                        {selectedDoc && (
                            <CDEWorkflowPanel
                                doc={selectedDoc}
                                workflowHistory={workflowHistory}
                                isPending={workflowMutation.isPending}
                                userPermission={userPermission}
                                onApprove={(comment) => handleWorkflow('Approved', comment)}
                                onReject={(comment) => handleWorkflow('Rejected', comment)}
                                onReturn={(comment) => handleWorkflow('Returned', comment)}
                                onClose={() => setSelectedDoc(null)}
                            />
                        )}
                    </div>
                </>
            )}

            {/* Tab: Analytics */}
            {activeTab === 'analytics' && (
                <div className="flex-1 overflow-y-auto">
                    <CDEDashboard
                        stats={stats}
                        docs={projectDocs}
                        projectName={selectedProject?.ProjectName || ''}
                    />
                </div>
            )}

            {/* Tab: Transmittals — Phiếu chuyển giao tài liệu */}
            {activeTab === 'transmittals' && (
                <div className="flex-1 overflow-y-auto">
                    <CDETransmittalsList
                        projectId={selectedProjectId}
                        onNewTransmittal={() => setShowTransmittal(true)}
                    />
                </div>
            )}

            {/* Tab: Permissions */}
            {activeTab === 'permissions' && (
                <div className="flex-1 overflow-y-auto">
                    <CDEPermissionManager projectId={selectedProjectId} />
                </div>
            )}

            {/* Tab: Audit */}
            {activeTab === 'audit' && (
                <div className="flex-1 overflow-y-auto">
                    <CDEAuditLog projectId={selectedProjectId} />
                </div>
            )}

            {/* Tab: Issues — vấn đề/ghi chú hợp nhất 2D + 3D */}
            {activeTab === 'issues' && (
                <div className="flex-1 overflow-y-auto">
                    <CDEIssuesPanel
                        projectId={selectedProjectId}
                        onOpenDoc={(docId) => {
                            const doc = projectDocs.find((d) => d.doc_id === docId);
                            if (doc) handlePreview(doc);
                        }}
                        onOpenBim={() => navigate(`/bim/${selectedProjectId}`)}
                    />
                </div>
            )}

            {/* Tab: Reviews — gói duyệt nhiều tài liệu */}
            {activeTab === 'reviews' && (
                <div className="flex-1 overflow-y-auto">
                    <CDEReviewPanel
                        projectId={selectedProjectId}
                        projectDocs={projectDocs}
                        user={{ id: currentUser?.EmployeeID, name: currentUser?.FullName }}
                        onSign={(d) => setSignDoc(d as any)}
                    />
                </div>
            )}

            {/* Tab: Internal Workflow — Quy trình nội bộ giữa các phòng ban */}
            {activeTab === 'internal-workflow' && (
                <div className="flex-1 overflow-hidden">
                    <CDEInternalWorkflowPanel
                        projectId={selectedProjectId}
                        instances={internalInstances}
                        isLoading={instancesLoading}
                        currentUserDept={currentUserDept}
                        onCreateInstance={handleCreateInternalWorkflow}
                        onStepAction={(id, no, action, comment) => handleProcessInternalStep(id, no, action as 'done' | 'rejected' | 'return_to_prev', comment)}
                    />
                </div>
            )}

            {/* Modals */}
            <CDESubmitModal
                isOpen={showSubmitModal}
                folder={activeFolder}
                folders={folders}
                onClose={() => setShowSubmitModal(false)}
                onSubmit={handleSubmit}
                isPending={uploadMutation.isPending || ifcUploadMutation.isPending}
            />

            <CDETransmittalForm
                isOpen={showTransmittal}
                projectId={selectedProjectId}
                docs={docs}
                preSelectedDocIds={selectedIds}
                onClose={() => setShowTransmittal(false)}
                onSent={() => { setSelectedIds([]); setToast({ message: 'Đã gửi phiếu chuyển giao', type: 'success' }); }}
            />

            {/* File Preview Modal */}
            {previewDoc && (
                <CDEFilePreview
                    file={{
                        doc_name: previewDoc.doc_name,
                        version: previewDoc.version || 'P01.01',
                        size: previewDoc.size || '',
                        publicUrl: previewDoc.storage_path,
                    }}
                    docId={previewDoc.doc_id}
                    projectId={selectedProjectId}
                    createdBy={currentUser?.EmployeeID}
                    onClose={() => setPreviewDoc(null)}
                    onDownload={() => handleDownload(previewDoc)}
                />
            )}

            {/* Version Panel — lịch sử phiên bản + so sánh */}
            {versionDoc && (
                <CDEVersionPanel
                    doc={versionDoc}
                    projectId={selectedProjectId}
                    user={{ id: currentUser?.EmployeeID, name: currentUser?.FullName, org: currentUser?.Department }}
                    onClose={() => setVersionDoc(null)}
                />
            )}

            {/* Digital Sign Modal */}
            {signDoc && (
                <CDEDigitalSign
                    file={{ doc_name: signDoc.doc_name, size: signDoc.size || '' }}
                    isOpen={true}
                    onClose={() => setSignDoc(null)}
                    onSignComplete={(name) => {
                        setSignDoc(null);
                        setToast({ message: `Ký số thành công: ${name}`, type: 'success' });
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 ${
                    toast.type === 'success'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 text-white'
                }`}>
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
                </div>
            )}
        </div>
    );
};

export default CDEPage;
