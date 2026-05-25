import React, { useState, useEffect } from 'react';
import { Save, Clock, BookOpen, FileText, Users, Scale } from 'lucide-react';
import type { WorkflowNode } from '../../../types/workflow.types';
import { useSlidePanel } from '../../../context/SlidePanelContext';
import { useToast } from '../../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { WorkflowRaciService, type NodeRaciSummary } from '../services/WorkflowRaciService';
import { StakeholderService, type StakeholderType } from '../services/StakeholderService';
import { RaciBadges } from './RaciBadges';
import { RaciEditor } from './RaciEditor';

interface NodeDetailPanelProps {
    node: WorkflowNode;
    onSave: (nodeId: string, data: any) => Promise<void>;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onSave }) => {
    const { closePanel } = useSlidePanel();
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    
    // Core fields
    const [name, setName] = useState('');
    const [type, setType] = useState<any>('input');
    const [slaValue, setSlaValue] = useState('');
    const [slaUnit, setSlaUnit] = useState('d');
    
    // Meta fields
    const [phase, setPhase] = useState('preparation');
    const [description, setDescription] = useState('');
    const [legalBasis, setLegalBasis] = useState('');
    const [outputDocument, setOutputDocument] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);

    // RACI state
    const [raciSummary, setRaciSummary] = useState<NodeRaciSummary | undefined>(undefined);
    const [stakeholders, setStakeholders] = useState<StakeholderType[]>([]);
    const [raciEditMode, setRaciEditMode] = useState(false);
    const [isSavingRaci, setIsSavingRaci] = useState(false);

    useEffect(() => {
        if (node) {
            setName(node.name || '');
            setType(node.type || 'input');
            
            const sf = node.sla_formula || '';
            const valMatch = sf.match(/^(\d+)/);
            const unitMatch = sf.match(/[a-zA-Z]+$/);
            setSlaValue(valMatch ? valMatch[0] : '');
            setSlaUnit(unitMatch ? unitMatch[0] : 'd');
            
            const meta = node.metadata || {};
            setPhase(meta.phase || 'preparation');
            setDescription(meta.description || '');
            
            // Set legal_basis and output_document, fallback to metadata if null
            setLegalBasis(node.legal_basis || (meta.legal_basis as string) || '');
            setOutputDocument(node.output_document || (meta.output as string) || '');
        }
    }, [node]);

    // Fetch RACI data
    useEffect(() => {
        if (!node?.id) return;
        const fetchRaci = async () => {
            try {
                const [raciEntries, stData] = await Promise.all([
                    WorkflowRaciService.getByNode(node.id),
                    StakeholderService.getAll(),
                ]);
                setStakeholders(stData);
                const map = WorkflowRaciService.buildRaciMap(raciEntries);
                setRaciSummary(map.get(node.id));
            } catch (err) {
                console.error('Error fetching RACI data:', err);
            }
        };
        fetchRaci();
    }, [node?.id]);

    const handleSaveRaci = async (assignments: Array<{ stakeholder_code: string; raci_type: 'R' | 'A' | 'C' | 'I' }>) => {
        setIsSavingRaci(true);
        try {
            await WorkflowRaciService.setNodeRaci(node.id, assignments);
            
            // Invalidate react-query cache để làm mới bảng quy trình chính
            queryClient.invalidateQueries({ queryKey: ['workflow-raci', node.workflow_id] });
            
            // Re-fetch nội bộ panel
            const raciEntries = await WorkflowRaciService.getByNode(node.id);
            const map = WorkflowRaciService.buildRaciMap(raciEntries);
            setRaciSummary(map.get(node.id));
            setRaciEditMode(false);
            addToast({ title: 'Đã lưu RACI', message: 'Cập nhật ma trận RACI thành công.', type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Lỗi lưu RACI', message: err.message, type: 'error' });
        } finally {
            setIsSavingRaci(false);
        }
    };

    const getStakeholderName = (code: string) => {
        return stakeholders.find(s => s.code === code)?.name || code;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedData = {
                name,
                type,
                sla_formula: slaValue ? `${slaValue}${slaUnit}` : null,
                legal_basis: legalBasis || null,
                output_document: outputDocument || null,
                metadata: {
                    ...(node.metadata || {}),
                    description,
                    phase,
                    // Keep legacy structure lightly synced so standard queries don't break
                    legal_basis: legalBasis,
                    output: outputDocument,
                }
            };
            await onSave(node.id, updatedData);
            closePanel();
        } catch (err: any) {
             addToast({ title: 'Lỗi khi lưu', message: err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-slate-900 relative">
            <div className="flex-1 overflow-auto p-4 custom-scrollbar pb-28 space-y-6">
                
                {/* 1. Basic Info */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors col-span-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Tên nội dung thực hiện (Bước)</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors" 
                            />
                        </div>

                        <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                Giai đoạn dự án
                            </label>
                            <select 
                                value={phase} 
                                onChange={e => setPhase(e.target.value)}
                                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors cursor-pointer appearance-none"
                            >
                                <option value="preparation">I. Giai đoạn Chuẩn bị dự án</option>
                                <option value="execution">II. Giai đoạn Thực hiện dự án</option>
                                <option value="completion">III. Giai đoạn Kết thúc xây dựng</option>
                            </select>
                        </div>
                        
                        <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">Phân loại bước</label>
                            <select 
                                value={type} 
                                onChange={e => setType(e.target.value)}
                                className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors cursor-pointer appearance-none"
                            >
                                <option value="start">Khởi xướng (Start)</option>
                                <option value="input">Lập hồ sơ / Thực thi (Input)</option>
                                <option value="approval">Phê duyệt (Approval)</option>
                                <option value="automated">Hệ thống xử lý tự động (Auto)</option>
                                <option value="end">Kết thúc (End)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Clock size={14} className="text-warning-500" /> Tổng thời gian (SLA)
                        </label>
                        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all w-full max-w-xs">
                            <input 
                                type="number" 
                                value={slaValue} 
                                onChange={e => setSlaValue(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-16 flex-1 h-11 bg-transparent px-4 text-sm font-bold text-center border-r border-slate-200 dark:border-slate-700 focus:outline-none text-slate-800 dark:text-white" 
                            />
                            <select 
                                value={slaUnit} 
                                onChange={e => setSlaUnit(e.target.value)}
                                className="min-w-[100px] h-11 bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300 border-none cursor-pointer"
                            >
                                <option value="d">Ngày lịch</option>
                                <option value="wd">Ngày làm việc</option>
                                <option value="h">Giờ (Hours)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. RACI Matrix */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-blue-500" />
                            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Ma trận RACI</h3>
                        </div>
                        {!raciEditMode && (
                            <button
                                onClick={() => setRaciEditMode(true)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-[11px] font-bold transition-colors"
                            >
                                Chỉnh sửa
                            </button>
                        )}
                    </div>

                    {raciEditMode ? (
                        <RaciEditor
                            nodeId={node.id}
                            nodeName={name}
                            stakeholders={stakeholders}
                            currentRaci={raciSummary}
                            onSave={handleSaveRaci}
                            onCancel={() => setRaciEditMode(false)}
                            isSaving={isSavingRaci}
                        />
                    ) : (
                        <RaciBadges
                            summary={raciSummary}
                            compact={false}
                            getStakeholderName={getStakeholderName}
                        />
                    )}

                    {!raciSummary && !raciEditMode && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-2">
                            Chưa có phân công RACI. Nhấn “Chỉnh sửa” để thiết lập.
                        </p>
                    )}
                </div>

                {/* 3. Detailed Fields (Căn cứ pháp lý, Sản phẩm đầu ra, Mô tả) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                    <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Scale size={14} className="text-indigo-500" /> Căn cứ pháp lý
                        </label>
                        <textarea 
                            value={legalBasis} 
                            onChange={e => setLegalBasis(e.target.value)}
                            placeholder="Nhập căn cứ pháp lý quy định (VD: Nghị định 15/2021/NĐ-CP, Luật Xây dựng...)"
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors resize-none" 
                        />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <FileText size={14} className="text-emerald-500" /> Sản phẩm đầu ra
                        </label>
                        <textarea 
                            value={outputDocument} 
                            onChange={e => setOutputDocument(e.target.value)}
                            placeholder="Nhập tên sản phẩm đầu ra (VD: Quyết định phê duyệt dự án, Báo cáo nghiên cứu khả thi...)"
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors resize-none" 
                        />
                    </div>

                    <div className="space-y-1.5 focus-within:text-primary-600 dark:focus-within:text-primary-500 transition-colors">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <BookOpen size={14} className="text-amber-500" /> Hướng dẫn chi tiết / Mô tả bước
                        </label>
                        <textarea 
                            value={description} 
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Nhập hướng dẫn thực hiện, các bước nghiệp vụ cần làm hoặc mô tả chi tiết..."
                            rows={4}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-white transition-colors resize-none" 
                        />
                    </div>
                </div>

            </div>

             {/* Footer */}
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3 z-10">
                <button 
                    onClick={() => closePanel()}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition border border-slate-700"
                >
                    Hủy
                </button>
                 <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                    Lưu Thay Đổi
                </button>
            </div>
        </div>
    );
};

export default NodeDetailPanel;
