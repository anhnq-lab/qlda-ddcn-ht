import React, { useState } from 'react';
import { FolderOpen, Clock, Share2, CheckCircle2, Archive, Loader2, ChevronDown, ChevronRight, FileStack, Compass, PenTool, HardHat, FlagTriangleRight } from 'lucide-react';
import type { CDEFolder, CDEContainerType } from '../types';
import { CONTAINER_COLORS, CDE_PROJECT_PHASES } from '../constants';

const containerIcons: Record<CDEContainerType, React.ElementType> = {
    WIP: Clock, SHARED: Share2, PUBLISHED: CheckCircle2, ARCHIVED: Archive,
};

const phaseIcons: Record<string, React.ElementType> = {
    preparation: Compass, implementation: HardHat, completion: FlagTriangleRight,
};
const phaseColors: Record<string, string> = {
    preparation: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20',
    implementation: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20',
    completion: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
};

interface CDEFolderTreeProps {
    folders: CDEFolder[];
    activeFolderId: string | null;
    isLoading: boolean;
    onSelectFolder: (folderId: string) => void;
    activePhase?: string;
    onChangePhase?: (phase: string) => void;
}

const CDEFolderTree: React.FC<CDEFolderTreeProps> = ({ folders, activeFolderId, isLoading, onSelectFolder, activePhase, onChangePhase }) => {
    const [collapsedContainers, setCollapsedContainers] = useState<Set<string>>(new Set());

    const toggleContainer = (id: string) => {
        setCollapsedContainers(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const renderSubfolders = (parentId: string) => {
        const subs = folders
            .filter(f => f.parent_id === parentId && (!activePhase || (f as any).phase === activePhase))
            .sort((a, b) => a.sort_order - b.sort_order);
        if (subs.length === 0) return null;
        return (
            <div className="ml-5 pl-3 border-l-2 border-border space-y-0.5">
                {subs.map(folder => {
                    const isActive = folder.id === activeFolderId;
                    const colors = CONTAINER_COLORS[folder.container_type];
                    return (
                        <div key={folder.id} onClick={() => onSelectFolder(folder.id)}
                            className={`flex items-center gap-2.5 py-2 px-3 rounded-xl cursor-pointer transition-all text-sm ${isActive
                                ? `${colors.lightBg} ${colors.text} font-bold shadow-sm ${colors.border} border`
                                : 'text-txt-muted hover:bg-bg-hover-row'}`}>
                            <FolderOpen className={`w-4 h-4 shrink-0 ${isActive ? colors.text : 'text-txt-placeholder'}`} />
                            <span className="truncate flex-1 text-[12px]">{folder.name}</span>
                            {folder.doc_count != null && folder.doc_count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? colors.badge : 'bg-bg-muted text-gray-500'}`}>
                                    {folder.doc_count}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderContainers = () => {
        // Only show the 4 main root containers (phase=null), NOT phase-specific roots
        const roots = folders
            .filter(f => f.parent_id === null && !(f as any).phase)
            .sort((a, b) => a.sort_order - b.sort_order);
        return roots.map(root => {
            const colors = CONTAINER_COLORS[root.container_type];
            const ContainerIcon = containerIcons[root.container_type];
            const isCollapsed = collapsedContainers.has(root.id);
            // Count only phase-matching subfolders
            const phaseSubs = folders.filter(f => f.parent_id === root.id && (!activePhase || (f as any).phase === activePhase));
            const subCount = phaseSubs.reduce((sum, f) => sum + (f.doc_count || 0), 0);

            // Skip containers with no matching phase subfolders
            if (phaseSubs.length === 0) return null;

            return (
                <div key={root.id} className="mb-1">
                    <div onClick={() => toggleContainer(root.id)}
                        className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-bg-hover-row transition-all`}>
                        {isCollapsed ? <ChevronRight className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                        <div className={`w-6 h-6 rounded-lg ${colors.bg} flex items-center justify-center`}>
                            <ContainerIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={`text-[13px] font-bold ${colors.text}`}>{root.name}</span>
                        {subCount > 0 && <span className="text-[9px] font-bold text-gray-400 ml-auto">{subCount}</span>}
                    </div>
                    {!isCollapsed && renderSubfolders(root.id)}
                </div>
            );
        });
    };

    return (
        <div className="w-[280px] bg-bg-surface rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden shrink-0">
            {/* Phase tabs */}
            <div className="px-3 py-2.5 border-b border-border bg-bg-subtle">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                    <FileStack className="w-3 h-3" /> Giai đoạn dự án
                </p>
                <div className="grid grid-cols-3 gap-1">
                    {CDE_PROJECT_PHASES.map(phase => {
                        const PhaseIcon = phaseIcons[phase.id] || FolderOpen;
                        const isActive = activePhase === phase.id;
                        return (
                            <button key={phase.id} onClick={() => onChangePhase?.(phase.id)}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isActive ? phaseColors[phase.id] + ' shadow-sm' : 'text-gray-400 hover:bg-bg-muted'}`}
                                title={phase.description}>
                                <PhaseIcon className="w-3 h-3" />
                                <span className="truncate">{phase.label.replace(/^\d+\.\s*/, '')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Folder tree */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                ) : (
                    renderContainers()
                )}
            </div>
            <div className="px-4 py-2 border-t border-border bg-gray-50/80 dark:bg-slate-800">
                <p className="text-[9px] text-txt-placeholder text-center font-bold uppercase tracking-wider">
                    NĐ 175/2024 · ISO 19650
                </p>
            </div>
        </div>
    );
};

export default CDEFolderTree;
