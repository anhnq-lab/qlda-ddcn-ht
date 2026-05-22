/**
 * BimSavedViewsPanel — Save and restore camera + section + isolation snapshots.
 * Inspired by Autodesk Viewer's "Saved Views" / BIMcollab's bookmarks. Each
 * view captures the camera pose and the current visual state so a teammate can
 * jump back to "the corner where the duct hits the beam" with one click.
 */
import React, { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import { Bookmark, Plus, Trash2, Eye, X, Loader2 } from 'lucide-react';
import { useBimContext } from './context/BimContext';
import {
    bimSavedViewsService,
    type BimSavedView,
    type BimViewState,
} from '../../../../services/bimCollabService';

interface BimSavedViewsPanelProps {
    onClose: () => void;
}

/** Capture the current viewer state into a serialisable BimViewState. */
function captureState(world: OBC.World | null): BimViewState | null {
    if (!world) return null;
    const camera: any = world.camera;
    if (!camera?.controls) return null;
    const pos = camera.controls.getPosition(new THREE.Vector3());
    const tgt = camera.controls.getTarget(new THREE.Vector3());
    return {
        camera: {
            position: [pos.x, pos.y, pos.z],
            target: [tgt.x, tgt.y, tgt.z],
        },
    };
}

/** Restore a previously captured view onto the live viewer. */
function applyState(world: OBC.World | null, state: BimViewState): void {
    if (!world) return;
    const camera: any = world.camera;
    if (!camera?.controls) return;
    const [px, py, pz] = state.camera.position;
    const [tx, ty, tz] = state.camera.target;
    camera.controls.setLookAt(px, py, pz, tx, ty, tz, true);
}

export const BimSavedViewsPanel: React.FC<BimSavedViewsPanelProps> = ({ onClose }) => {
    const { projectID, engine, isDarkMode } = useBimContext();
    const [views, setViews] = useState<BimSavedView[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        const list = await bimSavedViewsService.list(projectID);
        setViews(list);
        setLoading(false);
    }, [projectID]);

    useEffect(() => { refresh(); }, [refresh]);

    const handleSave = useCallback(async () => {
        const name = newName.trim() || `Góc nhìn ${new Date().toLocaleString('vi-VN')}`;
        const state = captureState(engine.worldRef.current);
        if (!state) return;
        setSaving(true);
        const created = await bimSavedViewsService.create({
            projectId: projectID,
            name,
            state,
        });
        setSaving(false);
        if (created) {
            setNewName('');
            setViews((prev) => [created, ...prev]);
        }
    }, [engine.worldRef, newName, projectID]);

    const handleRestore = useCallback((v: BimSavedView) => {
        applyState(engine.worldRef.current, v.state);
        engine.requestRender();
    }, [engine]);

    const handleDelete = useCallback(async (v: BimSavedView) => {
        if (!window.confirm(`Xóa góc nhìn "${v.name}"?`)) return;
        await bimSavedViewsService.remove(v.id);
        setViews((prev) => prev.filter((x) => x.id !== v.id));
    }, []);

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-gray-800'}`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold">Góc nhìn đã lưu</span>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-bg-muted">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Save form */}
            <div className={`px-3 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Tên góc nhìn (tùy chọn)"
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border ${
                            isDarkMode
                                ? 'bg-slate-800 border-slate-600 placeholder-slate-500'
                                : 'bg-white border-gray-200 placeholder-gray-400'
                        }`}
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                        title="Lưu góc nhìn hiện tại"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Lưu
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                ) : views.length === 0 ? (
                    <div className="px-3 py-8 text-center text-xs text-slate-500">
                        Chưa có góc nhìn nào.<br />Lưu góc nhìn để quay lại nhanh khi cần.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {views.map((v) => (
                            <div key={v.id} className={`px-3 py-2 hover:bg-bg-muted transition-colors group`}>
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handleRestore(v)}
                                        className="flex-1 min-w-0 text-left"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Eye className="w-3 h-3 text-cyan-500 shrink-0" />
                                            <p className="text-xs font-medium truncate">{v.name}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {new Date(v.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 transition-opacity"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
