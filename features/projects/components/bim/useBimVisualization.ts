/**
 * useBimVisualization — Professional visualization toolkit:
 *   • Explode view  — animated separation of meshes along an axis
 *   • Color-by      — recolor by discipline / storey / type / property
 *   • Storey filter — show/hide elements by IfcBuildingStorey
 *
 * All three operations clone & cache the original material on first use and
 * restore on reset, so the user can stack them (explode + color-by + storey
 * filter) without losing the original shading.
 */

import React, { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import type * as OBC from '@thatopen/components';

// ── Types ──────────────────────────────────────────────────────────────

export type ColorByMode = 'none' | 'discipline' | 'storey' | 'type';

export interface BimVisualizationAPI {
    // Explode
    explodeFactor: number;
    setExplodeFactor: (factor: number) => void;
    // Color-by
    colorByMode: ColorByMode;
    setColorByMode: (mode: ColorByMode) => void;
    // Storey filter
    visibleStoreys: Set<number>;
    setStoreyVisible: (storeyExpressId: number, visible: boolean) => void;
    showAllStoreys: () => void;
    /** All storeys present in the loaded models (express IDs). */
    allStoreyIds: number[];
    /** Names per storey express ID, for UI labelling. */
    storeyNames: Record<number, string>;
    /** Tell the visualisation hook the spatial tree changed; recomputes storey index. */
    registerStoreys: (storeys: Array<{ id: number; name: string; elementIds: number[] }>) => void;
}

// Hash a string to an HSL color — deterministic, distinct hues for unique labels.
function stringToColor(label: string): THREE.Color {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = (hash << 5) - hash + label.charCodeAt(i);
        hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return new THREE.Color().setHSL(hue / 360, 0.55, 0.55);
}

const DISCIPLINE_COLORS: Record<string, string> = {
    ARCH:    '#3b82f6', // blue
    STRU:    '#f59e0b', // amber
    MEP:     '#10b981', // emerald
    ELEC:    '#eab308', // yellow
    HVAC:    '#06b6d4', // cyan
    PLUM:    '#14b8a6', // teal
    FIRE:    '#ef4444', // red
    LAND:    '#22c55e', // green
    COMBINE: '#a855f7', // purple
};

// ── Hook ──────────────────────────────────────────────────────────────

export function useBimVisualization(
    worldRef: React.MutableRefObject<OBC.World | null>,
    disciplineModelsResolver?: () => Array<{ fragModel?: any; model: { discipline: string | null; file_name: string } }>,
): BimVisualizationAPI {
    const [explodeFactor, setExplodeFactorState] = useState(0);
    const [colorByMode, setColorByModeState] = useState<ColorByMode>('none');
    const [visibleStoreys, setVisibleStoreysState] = useState<Set<number>>(new Set());

    // Cache: original mesh position offsets keyed by mesh uuid
    const originalPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
    // Cache: original materials keyed by mesh uuid (per-mesh, not per-material)
    const originalMaterialsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
    // Storey index: storeyExpressId → list of expressIds owned by that storey
    const storeyElementsRef = useRef<Map<number, Set<number>>>(new Map());
    // Storey names for UI
    const storeyNamesRef = useRef<Record<number, string>>({});
    const [allStoreyIds, setAllStoreyIds] = useState<number[]>([]);

    // ── Explode ─────────────────────────────────────────────────────────
    // Push every mesh away from the model centroid along its own offset
    // vector. Distance = explodeFactor × (mesh.center − model.center) so the
    // result is a radial "blueprint" explosion that doesn't tear instances.
    const applyExplode = useCallback((factor: number) => {
        const world = worldRef.current;
        if (!world) return;
        const scene = world.scene.three as THREE.Scene;

        // Compute model centroid once (cache via attribute on the scene)
        const sceneAny = scene as any;
        if (!sceneAny._modelCentroid) {
            const box = new THREE.Box3().setFromObject(scene);
            sceneAny._modelCentroid = box.getCenter(new THREE.Vector3());
        }
        const centroid: THREE.Vector3 = sceneAny._modelCentroid;

        scene.traverse((obj: any) => {
            if (!obj.isMesh) return;
            if (!obj.fragment && !obj.isInstancedMesh) return;

            // Cache original local position once
            if (!originalPositionsRef.current.has(obj.uuid)) {
                originalPositionsRef.current.set(obj.uuid, obj.position.clone());
            }
            const orig = originalPositionsRef.current.get(obj.uuid)!;

            // Mesh centroid in world space
            const meshBox = new THREE.Box3().setFromObject(obj);
            const meshCenter = meshBox.getCenter(new THREE.Vector3());
            const offset = meshCenter.sub(centroid).normalize().multiplyScalar(factor * 5);

            obj.position.copy(orig).add(offset);
        });
    }, [worldRef]);

    const setExplodeFactor = useCallback((factor: number) => {
        const clamped = Math.max(0, Math.min(1, factor));
        applyExplode(clamped);
        setExplodeFactorState(clamped);
    }, [applyExplode]);

    // ── Color-by ────────────────────────────────────────────────────────
    const applyColorBy = useCallback((mode: ColorByMode) => {
        const world = worldRef.current;
        if (!world) return;
        const scene = world.scene.three as THREE.Scene;

        scene.traverse((obj: any) => {
            if (!obj.isMesh || !obj.material) return;
            if (!obj.fragment && !obj.isInstancedMesh) return;
            if (typeof obj.material.clone !== 'function' && !Array.isArray(obj.material)) return;

            // Save original on first colour change
            if (!originalMaterialsRef.current.has(obj.uuid)) {
                originalMaterialsRef.current.set(obj.uuid, obj.material);
            }

            if (mode === 'none') {
                const orig = originalMaterialsRef.current.get(obj.uuid);
                if (orig) {
                    // Dispose cloned material before restoring
                    if (Array.isArray(obj.material)) obj.material.forEach((m: THREE.Material) => m.dispose && m.dispose());
                    else obj.material.dispose?.();
                    obj.material = orig;
                }
                return;
            }

            // Determine label for hashing
            let label: string | null = null;
            if (mode === 'discipline') {
                const list = disciplineModelsResolver?.() || [];
                for (const dm of list) {
                    if (!dm.fragModel) continue;
                    const fragObj = (dm.fragModel as any).object || dm.fragModel;
                    if (!fragObj) continue;
                    if (obj === fragObj || isDescendantOf(obj, fragObj)) {
                        label = dm.model.discipline || dm.model.file_name;
                        break;
                    }
                }
            } else if (mode === 'storey') {
                const expressId = inferAnyExpressIdOnMesh(obj);
                if (expressId != null) {
                    for (const [storeyId, ids] of storeyElementsRef.current.entries()) {
                        if (ids.has(expressId)) {
                            label = storeyNamesRef.current[storeyId] || String(storeyId);
                            break;
                        }
                    }
                }
            } else if (mode === 'type') {
                // Best effort: use the mesh.name or fragment id
                label = obj.fragment?.id || obj.name || 'Unknown';
            }

            if (!label) return;

            const color = (mode === 'discipline' && DISCIPLINE_COLORS[label])
                ? new THREE.Color(DISCIPLINE_COLORS[label])
                : stringToColor(label);

            // Clone + tint
            const cloneAndTint = (mat: THREE.Material) => {
                const c = mat.clone() as any;
                if (c.color && c.color.copy) c.color.copy(color);
                if (c.emissive) c.emissive.set(0, 0, 0);
                c.needsUpdate = true;
                return c;
            };

            if (Array.isArray(obj.material)) {
                obj.material = obj.material.map(cloneAndTint);
            } else {
                obj.material = cloneAndTint(obj.material);
            }
        });
    }, [worldRef, disciplineModelsResolver]);

    const setColorByMode = useCallback((mode: ColorByMode) => {
        applyColorBy(mode);
        setColorByModeState(mode);
    }, [applyColorBy]);

    // ── Storey filter ───────────────────────────────────────────────────
    const applyStoreyVisibility = useCallback((visibleSet: Set<number>) => {
        const world = worldRef.current;
        if (!world) return;
        const scene = world.scene.three as THREE.Scene;

        // Build the union of element IDs that should be visible. Empty visibleSet
        // means "no filter" — show everything.
        const showAll = visibleSet.size === 0;
        const allowedIds = new Set<number>();
        if (!showAll) {
            for (const storeyId of visibleSet) {
                const ids = storeyElementsRef.current.get(storeyId);
                if (ids) ids.forEach((id) => allowedIds.add(id));
            }
        }

        scene.traverse((obj: any) => {
            if (!obj.isMesh) return;
            if (!obj.fragment && !obj.isInstancedMesh) return;
            if (showAll) {
                obj.visible = true;
                return;
            }
            const expressId = inferAnyExpressIdOnMesh(obj);
            // If we can't infer, default to visible (avoid blanking unknown meshes)
            obj.visible = expressId == null ? true : allowedIds.has(expressId);
        });
    }, [worldRef]);

    const setStoreyVisible = useCallback((storeyExpressId: number, visible: boolean) => {
        setVisibleStoreysState((prev) => {
            const next = new Set(prev);
            if (visible) next.add(storeyExpressId);
            else next.delete(storeyExpressId);
            applyStoreyVisibility(next);
            return next;
        });
    }, [applyStoreyVisibility]);

    const showAllStoreys = useCallback(() => {
        setVisibleStoreysState(() => {
            const empty = new Set<number>();
            applyStoreyVisibility(empty);
            return empty;
        });
    }, [applyStoreyVisibility]);

    const registerStoreys = useCallback((storeys: Array<{ id: number; name: string; elementIds: number[] }>) => {
        storeyElementsRef.current.clear();
        const names: Record<number, string> = {};
        for (const s of storeys) {
            storeyElementsRef.current.set(s.id, new Set(s.elementIds));
            names[s.id] = s.name;
        }
        storeyNamesRef.current = names;
        setAllStoreyIds(storeys.map((s) => s.id));
    }, []);

    return {
        explodeFactor,
        setExplodeFactor,
        colorByMode,
        setColorByMode,
        visibleStoreys,
        setStoreyVisible,
        showAllStoreys,
        allStoreyIds,
        storeyNames: storeyNamesRef.current,
        registerStoreys,
    };
}

// ── Helpers ────────────────────────────────────────────────────────────

function isDescendantOf(node: THREE.Object3D, ancestor: THREE.Object3D): boolean {
    let cur: THREE.Object3D | null = node;
    while (cur) {
        if (cur === ancestor) return true;
        cur = cur.parent;
    }
    return false;
}

/**
 * Best-effort express-ID extraction from a fragment mesh. ThatOpen Fragments v3
 * stores express IDs in different shapes depending on whether the mesh is a
 * regular Mesh, an InstancedMesh, or built from a fragment Map. We probe each.
 */
function inferAnyExpressIdOnMesh(mesh: any): number | null {
    const frag = mesh.fragment;
    if (!frag) return null;

    // Map<expressId, instanceIdx[]>
    if (frag.items instanceof Map) {
        const it = frag.items.keys().next();
        if (!it.done) return it.value as number;
    }
    // Set<expressId>
    if (frag.ids instanceof Set) {
        const it = frag.ids.values().next();
        if (!it.done) return it.value as number;
    }
    // Array<expressId>
    if (Array.isArray(frag.items) && frag.items.length > 0) return frag.items[0];
    if (Array.isArray(frag.ids) && frag.ids.length > 0) return frag.ids[0];

    return null;
}
