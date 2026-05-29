import React, { useState } from 'react';
import { CheckSquare, XSquare, FolderInput, X, ChevronDown } from 'lucide-react';
import type { CDEDocument, CDEFolder } from '../types';

interface CDEBatchActionsProps {
    selectedIds: number[];
    docs: CDEDocument[];
    folders: CDEFolder[];
    onApprove: (ids: number[]) => void;
    onReject: (ids: number[]) => void;
    onMove: (ids: number[], folderId: string) => void;
    onClearSelection: () => void;
}

const CDEBatchActions: React.FC<CDEBatchActionsProps> = ({
    selectedIds, docs, folders, onApprove, onReject, onMove, onClearSelection,
}) => {
    const [showMoveSelect, setShowMoveSelect] = useState(false);
    const [targetFolderId, setTargetFolderId] = useState('');

    if (selectedIds.length === 0) return null;

    const handleMove = () => {
        if (!targetFolderId) return;
        onMove(selectedIds, targetFolderId);
        setShowMoveSelect(false);
        setTargetFolderId('');
    };

    // Show leaf folders (those with a parent) as move targets
    const movableFolders = folders.filter(f => f.parent_id !== null);

    return (
        <div className="sticky top-0 z-20 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-primary-600 text-white rounded-xl shadow-sm shadow-primary-200 dark:shadow-primary-900/30 px-4 py-2.5 flex items-center gap-3 flex-wrap">
                {/* Count */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/20">
                    <span className="bg-white/20 text-white text-xs font-black w-7 h-7 rounded-lg flex items-center justify-center">
                        {selectedIds.length}
                    </span>
                    <span className="text-xs font-bold text-white/90">đã chọn</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => onApprove(selectedIds)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                        <CheckSquare className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button
                        onClick={() => onReject(selectedIds)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                        <XSquare className="w-3.5 h-3.5" /> Từ chối
                    </button>

                    {/* Move — inline folder selector */}
                    {!showMoveSelect ? (
                        <button
                            onClick={() => setShowMoveSelect(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold transition-all"
                        >
                            <FolderInput className="w-3.5 h-3.5" /> Di chuyển
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2 py-1">
                            <FolderInput className="w-3.5 h-3.5 shrink-0" />
                            <div className="relative flex items-center">
                                <select
                                    value={targetFolderId}
                                    onChange={e => setTargetFolderId(e.target.value)}
                                    className="text-xs font-semibold bg-transparent text-white border-0 outline-none cursor-pointer pr-4 appearance-none"
                                    autoFocus
                                >
                                    <option value="" className="text-gray-800">-- Chọn thư mục --</option>
                                    {movableFolders.map(f => (
                                        <option key={f.id} value={f.id} className="text-gray-800">{f.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-0 pointer-events-none" />
                            </div>
                            <button
                                onClick={handleMove}
                                disabled={!targetFolderId}
                                className="px-2 py-0.5 bg-white text-primary-700 rounded text-[10px] font-black disabled:opacity-40 hover:bg-white/90 transition-colors"
                            >
                                OK
                            </button>
                            <button
                                onClick={() => { setShowMoveSelect(false); setTargetFolderId(''); }}
                                className="text-white/60 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Clear */}
                <button
                    onClick={onClearSelection}
                    className="ml-auto flex items-center gap-1 text-white/70 hover:text-white text-xs font-bold transition-colors"
                >
                    <X className="w-3.5 h-3.5" /> Bỏ chọn
                </button>
            </div>
        </div>
    );
};

export default CDEBatchActions;
