/**
 * useBimUpload — Upload IFC files, convert to model, load existing models
 * Handles: upload → load → cache. Error recovery with retry.
 */
import React, { useRef, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import {
    uploadIFCFile, getProjectModels,
    downloadFile, deleteModel, updateModelStatus,
    uploadFragments, uploadProperties,
    type BimModel
} from '../../../../lib/bimStorage';
import { getSafeCamera } from './useBimEngine';


// ── Module-level IFC download cache ─────────────────────
// Persists across component mount/unmount to avoid re-downloading
// IFC files from Supabase Storage when switching between models.
const ifcDownloadCache = new Map<string, ArrayBuffer>();

/** Clear a specific entry or all cached IFC downloads */
export function clearIfcDownloadCache(key?: string) {
    if (key) ifcDownloadCache.delete(key);
    else ifcDownloadCache.clear();
}

export type LoadStatus = 'idle' | 'initializing' | 'loading' | 'converting' | 'success' | 'error';

export interface DisciplineModel {
    model: BimModel;
    visible: boolean;
    fragModel?: any;
}

export interface BimUploadAPI {
    status: LoadStatus;
    statusMessage: string;
    loadingProgress: number;
    disciplineModels: DisciplineModel[];
    objectCount: number;
    ifcDataMapRef: React.MutableRefObject<Map<string, Uint8Array>>;
    // Actions
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMultiFileUpload: (files: FileList) => void;
    loadExistingModels: () => Promise<void>;
    toggleDisciplineVisibility: (index: number) => void;
    handleDeleteModel: (index: number) => void;
    retryFailedModel: (index: number) => void;
    clearStatus: () => void;
    cancelUpload: () => void;
    validationError: string | null;
    // Model isolation
    isolateModelByExpressId: (expressId: number) => void;
    restoreAllModels: () => void;
    isIsolated: boolean;
}

async function getItemsDataInBatches(model: any, localIds: number[], batchSize = 1000): Promise<any[]> {
    const properties: any[] = [];
    for (let i = 0; i < localIds.length; i += batchSize) {
        const batchIds = localIds.slice(i, i + batchSize);
        try {
            const batchProps = await model.getItemsData(batchIds, {
                attributesDefault: true,
                relationsDefault: { attributes: true, relations: true }
            });
            if (batchProps) {
                if (Array.isArray(batchProps)) {
                    properties.push(...batchProps);
                } else {
                    properties.push(...Object.values(batchProps));
                }
            }
        } catch (e) {
            console.warn(`[BimUpload] Failed to get items data for batch starting at ${i}:`, e);
        }
    }
    return properties;
}

function getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    };
}

function cleanSpatialTree(node: any): any {
    if (!node) return null;
    const cleanNode: any = {
        localId: node.localId ?? node.expressID ?? node.id ?? 0,
        category: node.category ?? node.type ?? 'Unknown',
        children: []
    };
    if (Array.isArray(node.children)) {
        cleanNode.children = node.children
            .map((child: any) => cleanSpatialTree(child))
            .filter(Boolean);
    }
    return cleanNode;
}

async function triggerBackgroundMigration(
    modelId: string,
    projectId: string,
    model: any,
    fileName: string
) {
    try {
        console.log(`[BimUpload] [Migration] Starting background migration for ${fileName}...`);
        
        // 1. Export fragment buffer
        const fragBuffer = await model.getBuffer(false);
        const fragData = new Uint8Array(fragBuffer);
        
        // 2. Extract properties in batches to prevent WASM "memory access out of bounds" crash on large models
        const localIds = await model.getLocalIds();
        const rawProperties = await getItemsDataInBatches(model, localIds, 1000);
        
        // 3. Extract spatial tree
        const rawSpatialTree = await model.getSpatialStructure();
        const spatialTree = cleanSpatialTree(rawSpatialTree);
        
        const propertiesData = {
            spatialTree,
            properties: rawProperties
        };
        const propertiesJson = JSON.stringify(propertiesData, getCircularReplacer());
        
        // 4. Upload to Supabase Storage
        console.log(`[BimUpload] [Migration] Uploading properties JSON...`);
        await uploadProperties(modelId, projectId, propertiesJson, fileName);
        
        console.log(`[BimUpload] [Migration] Uploading fragments binary...`);
        await uploadFragments(modelId, projectId, fragData, fileName);
        
        console.log(`[BimUpload] [Migration] Background migration completed for ${fileName}`);
    } catch (err) {
        console.warn(`[BimUpload] [Migration] Failed to migrate ${fileName}:`, err);
    }
}

export function useBimUpload(
    projectID: string,
    componentsRef: React.MutableRefObject<OBC.Components | null>,
    worldRef: React.MutableRefObject<OBC.World | null>,
    ifcLoaderRef: React.MutableRefObject<OBC.IfcLoader | null>,
    onModelLoaded?: (ifcData?: Uint8Array, propertiesData?: any, modelId?: string) => void,
): BimUploadAPI {
    const [status, setStatus] = useState<LoadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [disciplineModels, setDisciplineModels] = useState<DisciplineModel[]>([]);
    const [objectCount, setObjectCount] = useState(0);

    // Store raw IFC data for property lookups
    const ifcDataMapRef = useRef<Map<string, Uint8Array>>(new Map());
    const abortControllerRef = useRef<AbortController | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Project-wide offset to coordinate models with large absolute coordinates to local origin
    const coordinationOffsetRef = useRef<THREE.Vector3 | null>(null);

    const coordinateModel = useCallback((model: any) => {
        if (!model) return;
        const obj = (model as any).object || model;
        if (!(obj instanceof THREE.Object3D)) return;

        // Smart bounding box: traverse child meshes and exclude survey origin points/lines (at 0,0,0)
        // when calculating the actual offset of the buildings (which are at large coordinate numbers)
        const childBoxes: THREE.Box3[] = [];
        obj.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
                const childBox = new THREE.Box3().setFromObject(child);
                if (!childBox.isEmpty()) {
                    childBoxes.push(childBox);
                }
            }
        });

        const box = new THREE.Box3();
        if (childBoxes.length > 0) {
            // Filter child boxes that are far away from (0,0,0) in raw survey coordinate space (>1000 units)
            const farBoxes = childBoxes.filter(b => {
                const c = b.getCenter(new THREE.Vector3());
                return Math.abs(c.x) > 1000 || Math.abs(c.z) > 1000;
            });
            const targetBoxes = farBoxes.length > 0 ? farBoxes : childBoxes;
            for (const b of targetBoxes) {
                box.union(b);
            }
        }

        if (box.isEmpty()) {
            const nativeBox = (model as any).box;
            if (nativeBox instanceof THREE.Box3 && !nativeBox.isEmpty()) {
                box.copy(nativeBox);
            }
        }

        if (box.isEmpty()) return;

        const center = box.getCenter(new THREE.Vector3());
        
        // If center is far from origin and we don't have a project offset yet, initialize it
        if ((Math.abs(center.x) > 10000 || Math.abs(center.z) > 10000) && !coordinationOffsetRef.current) {
            coordinationOffsetRef.current = new THREE.Vector3(center.x, center.y, center.z);
            console.log(`[BIM Coordination] Set global project offset: (${center.x.toFixed(0)}, ${center.y.toFixed(0)}, ${center.z.toFixed(0)})`);
        }

        if (coordinationOffsetRef.current) {
            const offset = coordinationOffsetRef.current;
            console.log(`[BIM Coordination] Offsetting model by: (${offset.x.toFixed(0)}, ${offset.y.toFixed(0)}, ${offset.z.toFixed(0)})`);
            
            obj.position.set(-offset.x, -offset.y, -offset.z);
            obj.updateMatrixWorld(true);

            // Re-calculate the local model bounding box using only meshes close to local origin (building),
            // effectively throwing away localized survey points which now drift to (-offset)
            if ((model as any).box instanceof THREE.Box3) {
                const localizedBox = new THREE.Box3();
                const localizedChildBoxes: THREE.Box3[] = [];
                obj.traverse((child: any) => {
                    if (child.isMesh && child.geometry) {
                        const childBox = new THREE.Box3().setFromObject(child);
                        if (!childBox.isEmpty()) {
                            localizedChildBoxes.push(childBox);
                        }
                    }
                });
                if (localizedChildBoxes.length > 0) {
                    const nearBoxes = localizedChildBoxes.filter(b => {
                        const c = b.getCenter(new THREE.Vector3());
                        return Math.abs(c.x) < 10000 && Math.abs(c.z) < 10000;
                    });
                    const targetBoxes = nearBoxes.length > 0 ? nearBoxes : localizedChildBoxes;
                    for (const b of targetBoxes) {
                        localizedBox.union(b);
                    }
                }
                if (!localizedBox.isEmpty()) {
                    (model as any).box.copy(localizedBox);
                } else {
                    (model as any).box.translate(new THREE.Vector3(-offset.x, -offset.y, -offset.z));
                }
            }
        }
    }, []);

    // ── File validation ────────────────────────
    const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
    const validateFile = useCallback((file: File): string | null => {
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext !== 'ifc') {
            return `"${file.name}" không phải file IFC. Chỉ chấp nhận file .ifc`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `"${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(0)}MB). Giới hạn ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        }
        if (file.size < 100) {
            return `"${file.name}" quá nhỏ, có thể bị lỗi`;
        }
        return null;
    }, []);

    // ── Load existing models from Supabase ──────────
    const loadExistingModels = useCallback(async () => {
        try {
            const models = await getProjectModels(projectID);
            if (models.length === 0) return;

            // Filter models that are ready and have an IFC path or frag path
            const readyModels = models.filter(m => m.status === 'ready' && (m.ifc_path || m.frag_path));
            if (readyModels.length === 0) {
                setDisciplineModels(models.map(m => ({ model: m, visible: false })));
                return;
            }

            setStatus('loading');
            setStatusMessage(`Đang tải ${readyModels.length} mô hình...`);

            const newDisciplineModels: DisciplineModel[] = [];
            const ifcLoader = ifcLoaderRef.current;
            const fragments = componentsRef.current?.get(OBC.FragmentsManager);
            let completed = 0;

            for (const m of readyModels) {
                try {
                    // Try to load using optimized .frag file first
                    if (m.frag_path && m.properties_path && fragments && worldRef.current) {
                        setStatusMessage(`Đang tải fragment: ${m.file_name}...`);
                        const fragBuffer = await downloadFile(m.frag_path);
                        const fragModel = await fragments.core.load(new Uint8Array(fragBuffer), { modelId: m.id });
                        coordinateModel(fragModel);
                        
                        console.log(`[BimUpload] Successfully loaded fragment model: ${m.file_name}`);
                        
                        // Force add to scene to prevent silent failures
                        const obj = (fragModel as any).object || fragModel;
                        if (obj && !worldRef.current.scene.three.children.includes(obj)) {
                            worldRef.current.scene.three.add(obj);
                        }

                        // Load properties JSON
                        try {
                            const propsBuffer = await downloadFile(m.properties_path);
                            const propsStr = new TextDecoder('utf-8').decode(propsBuffer);
                            const propsData = JSON.parse(propsStr);
                            
                            // Load properties and spatial tree into selection
                            onModelLoaded?.(undefined, propsData, m.file_name);
                        } catch (propsErr) {
                            console.warn(`[BimUpload] Failed to load/parse properties JSON for ${m.file_name}:`, propsErr);
                        }
                        
                        completed++;
                        setLoadingProgress((completed / readyModels.length) * 100);
                        setStatusMessage(`Đã tải ${completed}/${readyModels.length}: ${m.file_name}`);
                        
                        newDisciplineModels.push({ model: m, visible: true, fragModel });
                    } else {
                        // Fallback to loading raw IFC file
                        if (!m.ifc_path) {
                            throw new Error(`Model ${m.file_name} has no IFC path or frag path`);
                        }
                        const cacheKey = m.ifc_path!;
                        let ifcBuffer: ArrayBuffer;
                        if (ifcDownloadCache.has(cacheKey)) {
                            ifcBuffer = ifcDownloadCache.get(cacheKey)!;
                            console.log(`[BIM] Cache hit: ${m.file_name}`);
                        } else {
                            ifcBuffer = await downloadFile(cacheKey);
                            ifcDownloadCache.set(cacheKey, ifcBuffer);
                            console.log(`[BIM] Downloaded & cached: ${m.file_name}`);
                        }
                        const uint8Array = new Uint8Array(ifcBuffer);
                        console.log(`[BimUpload] Starting IFC load for ${m.file_name}...`);

                        if (ifcLoader && worldRef.current) {
                            const model = await ifcLoader.load(uint8Array, true, m.file_name, {
                                instanceCallback: (importer: any) => {
                                    importer.distanceThreshold = null;
                                },
                            });
                            coordinateModel(model);
                            console.log(`[BimUpload] Successfully loaded existing IFC model: ${m.file_name}`);

                            // Force add to scene to prevent silent failures
                            const obj = (model as any).object || model;
                            if (obj && !worldRef.current.scene.three.children.includes(obj)) {
                                worldRef.current.scene.three.add(obj);
                            }

                            const groupUuid = (model as any).uuid || (model as any).id;
                            if (groupUuid) ifcDataMapRef.current.set(groupUuid, uint8Array);
                            ifcDataMapRef.current.set(m.file_name, uint8Array);
                            onModelLoaded?.(uint8Array);

                            // Trigger background migration to convert to fragments and properties JSON
                            triggerBackgroundMigration(m.id, projectID, model, m.file_name);

                            completed++;
                            setLoadingProgress((completed / readyModels.length) * 100);
                            setStatusMessage(`Đã tải ${completed}/${readyModels.length}: ${m.file_name}`);

                            newDisciplineModels.push({ model: m, visible: true, fragModel: model });
                        } else {
                            console.warn(`[BimUpload] ifcLoader or worldRef is null during load for ${m.file_name}`);
                            newDisciplineModels.push({ model: m, visible: false });
                        }
                    }
                } catch (err) {
                    console.warn(`[BimUpload] Failed to load ${m.file_name}:`, err);
                    completed++;
                    setLoadingProgress((completed / readyModels.length) * 100);
                    newDisciplineModels.push({ model: m, visible: false });
                }
            }

            // Add non-ready models
            models.filter(m => m.status !== 'ready' || !m.ifc_path).forEach(m => {
                newDisciplineModels.push({ model: m, visible: false });
            });

            setDisciplineModels(newDisciplineModels);
            const total = newDisciplineModels.reduce((sum, dm) => sum + (dm.model.element_count || 0), 0);
            setObjectCount(total);

            setStatus('success');
            setStatusMessage(`Đã tải ${readyModels.length} mô hình thành công`);
            setLoadingProgress(100);
            setTimeout(() => { setStatus('idle'); setStatusMessage(''); }, 3000);


        } catch (err: any) {
            console.warn('Load models error:', err);
            setStatus('error');
            setStatusMessage(`Lỗi tải models: ${err.message}`);
        }
    }, [projectID, componentsRef, worldRef, ifcLoaderRef, onModelLoaded]);

    // ── Upload & Convert IFC ────────────────────────
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !componentsRef.current || !worldRef.current) return;
        e.target.value = '';

        // Validate
        const error = validateFile(file);
        if (error) {
            setValidationError(error);
            setTimeout(() => setValidationError(null), 5000);
            return;
        }
        setValidationError(null);

        try {
            setStatus('loading');
            setStatusMessage(`Đang upload ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
            setLoadingProgress(5);

            // Pass progress callback for real-time tracking (especially for large files)
            const record = await uploadIFCFile(projectID, file, (pct) => {
                // Upload phase takes 0-60% of total progress
                setLoadingProgress(Math.round(pct * 0.6));
                setStatusMessage(`Đang upload ${file.name}... ${pct}%`);
            });
            if (record.ifc_path) clearIfcDownloadCache(record.ifc_path);
            
            setLoadingProgress(60);

            setStatus('converting');
            setStatusMessage(`Đang convert ${file.name}...`);
            console.log(`[BimUpload] Starting IFC conversion for ${file.name}...`);

            const ifcLoader = componentsRef.current.get(OBC.IfcLoader);
            const buffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            console.log(`[BimUpload] Buffer ready: ${uint8Array.byteLength} bytes.`);

            const model = await ifcLoader.load(uint8Array, true, file.name, {
                instanceCallback: (importer: any) => {
                    // See loadExistingModels: disable 100km skip for IFCs
                    // authored with absolute survey coordinates.
                    importer.distanceThreshold = null;
                },
            });
            coordinateModel(model);
            console.log(`[BimUpload] IFC conversion completed successfully. Model UUID: ${(model as any).uuid || 'N/A'}`);
            setLoadingProgress(85);

            // Store IFC data using FragmentsGroup UUID (matches Highlighter events)
            const groupUuid = (model as any).uuid || (model as any).id;
            if (groupUuid) ifcDataMapRef.current.set(groupUuid, uint8Array);
            ifcDataMapRef.current.set(file.name, uint8Array);

            // Calculate element count from fragments safely
            let elementCount = (model as any).elementCount || 0;
            if (elementCount === 0 && (model as any).children) {
                const ids = new Set<number>();
                (model as any).children.forEach((child: any) => {
                    if (child.itemIDs && typeof child.itemIDs.forEach === 'function') {
                        child.itemIDs.forEach((id: number) => ids.add(id));
                    } else if (Array.isArray(child.items)) {
                        child.items.forEach((id: number) => ids.add(id));
                    }
                });
                elementCount = ids.size;
            }
            console.log(`[BimUpload] Calculated element count: ${elementCount}`);

            // 1. Export and upload fragments & properties
            let propertiesData: any = null;
            let updatedRecord = record;
            try {
                setStatus('converting');
                setStatusMessage(`Đang trích xuất thuộc tính mô hình...`);
                
                // Export fragment buffer
                const fragBuffer = await (model as any).getBuffer(false);
                const fragData = new Uint8Array(fragBuffer);
                
                // Extract properties in batches to prevent WASM "memory access out of bounds" crash on large models
                const localIds = await (model as any).getLocalIds();
                const rawProperties = await getItemsDataInBatches(model, localIds, 1000);
                
                // Extract spatial tree
                const rawSpatialTree = await (model as any).getSpatialStructure();
                const spatialTree = cleanSpatialTree(rawSpatialTree);
                
                propertiesData = {
                    spatialTree,
                    properties: rawProperties
                };
                const propertiesJson = JSON.stringify(propertiesData, getCircularReplacer());
                
                setStatusMessage(`Đang lưu trữ dữ liệu mô hình...`);
                
                // Upload properties JSON first
                const propPath = await uploadProperties(record.id, projectID, propertiesJson, file.name);
                // Upload fragments (which updates status to 'ready')
                const fragPath = await uploadFragments(record.id, projectID, fragData, file.name);
                
                // Construct updated record with new paths
                updatedRecord = {
                    ...record,
                    status: 'ready',
                    element_count: elementCount,
                    frag_path: fragPath,
                    properties_path: propPath
                };
                
                console.log(`[BimUpload] Uploaded fragments & properties successfully`);
            } catch (err) {
                console.warn(`[BimUpload] Failed to automatically convert and upload fragments/properties:`, err);
                // Fallback to updating DB status as ready with IFC only
                await updateModelStatus(record.id, 'ready', { element_count: elementCount });
            }

            setLoadingProgress(90);

            setDisciplineModels(prev => [...prev, {
                model: { ...updatedRecord, status: 'ready', element_count: elementCount },
                visible: true,
                fragModel: model,
            }]);
            setObjectCount(prev => prev + elementCount);

            // Notify parent to load properties and spatial tree
            if (propertiesData) {
                onModelLoaded?.(undefined, propertiesData, file.name);
            } else {
                onModelLoaded?.(uint8Array);
            }

            // Fit camera to model
            console.log(`[BimUpload] Fitting camera to model bounds...`);
            const targetObj = (model as any).object || model;

            // Force add to scene to prevent silent failures
            if (targetObj && !worldRef.current.scene.three.children.includes(targetObj)) {
                worldRef.current.scene.three.add(targetObj);
            }

            try {
                const fragments = componentsRef.current.get(OBC.FragmentsManager);
                // Let fragments stream the first tiles so the native box is ready
                await fragments.core.update(true);
                await new Promise(r => setTimeout(r, 150));

                const camera = getSafeCamera(worldRef.current);
                const box = new THREE.Box3();
                if (targetObj instanceof THREE.Object3D) {
                    const childBoxes: THREE.Box3[] = [];
                    targetObj.traverse((child: any) => {
                        if (child.isMesh && child.geometry) {
                            const childBox = new THREE.Box3().setFromObject(child);
                            if (!childBox.isEmpty()) childBoxes.push(childBox);
                        }
                    });
                    if (childBoxes.length > 0) {
                        // Filter out drift points that are far away from localized building (at 0,0,0)
                        const nearBoxes = childBoxes.filter(b => {
                            const c = b.getCenter(new THREE.Vector3());
                            return Math.abs(c.x) < 10000 && Math.abs(c.z) < 10000;
                        });
                        const targetBoxes = nearBoxes.length > 0 ? nearBoxes : childBoxes;
                        for (const b of targetBoxes) {
                            box.union(b);
                        }
                    }
                }
                if (box.isEmpty()) {
                    const nativeBox = (model as any).box as THREE.Box3 | undefined;
                    if (nativeBox instanceof THREE.Box3 && !nativeBox.isEmpty()) {
                        box.copy(nativeBox);
                    }
                }
                
                if (camera && !box.isEmpty()) {
                    const sphere = new THREE.Sphere();
                    box.getBoundingSphere(sphere);
                    if (isFinite(sphere.radius) && sphere.radius > 0) {
                        const c = box.getCenter(new THREE.Vector3());
                        console.log(
                            `[BimUpload] Model box center=(${c.x.toFixed(0)}, ${c.y.toFixed(0)}, ${c.z.toFixed(0)}) radius=${sphere.radius.toFixed(1)}`
                        );
                        camera.controls.fitToSphere(sphere, true);
                    }
                }
            } catch (err) {
                console.warn('Could not fit camera to model automatically:', err);
            }

            setStatus('success');
            setStatusMessage(`✅ ${file.name} loaded`);
            setLoadingProgress(100);
            setTimeout(() => { setStatus('idle'); setStatusMessage(''); }, 3000);
        } catch (err: any) {
            console.error('Upload/convert error:', err);
            setStatus('error');
            setStatusMessage(`Lỗi: ${err.message}`);
            try {
                const ifcLoader = componentsRef.current?.get(OBC.IfcLoader);
                if (ifcLoader) ifcLoader.cleanUp();
            } catch (cleanupErr) {
                console.error('[BimUpload] Error cleaning up IfcLoader:', cleanupErr);
            }
        }
    }, [projectID, componentsRef, worldRef, ifcLoaderRef, onModelLoaded]);

    // ── Toggle visibility ───────────────────────────
    // Follows EXACT same pattern as handleDeleteModel (which works):
    // 1) Access disciplineModels + worldRef directly (not inside updater)
    // 2) Manipulate scene
    // 3) Then update React state
    const toggleDisciplineVisibility = useCallback((index: number) => {
        const dm = disciplineModels[index];
        if (!dm?.fragModel || !worldRef.current) return;

        const newVisible = !dm.visible;
        const obj = (dm.fragModel as any).object || dm.fragModel;

        if (newVisible) {
            // Show: add back to scene (same as how models are initially loaded)
            worldRef.current.scene.three.add(obj);
            // Force fragment renderer update
            try {
                const fragments = componentsRef.current?.get(OBC.FragmentsManager);
                if (fragments?.core) fragments.core.update(true);
            } catch { /* */ }
        } else {
            // Hide: remove from scene (same pattern as delete)
            worldRef.current.scene.three.remove(obj);
        }

        setDisciplineModels(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], visible: newVisible };
            return updated;
        });
    }, [disciplineModels, worldRef, componentsRef]);

    // ── Delete model ────────────────────────────────
    const handleDeleteModel = useCallback(async (index: number) => {
        const dm = disciplineModels[index];
        if (!dm) return;
        try {
            if (dm.fragModel && worldRef.current) {
                const obj = (dm.fragModel as any).object || dm.fragModel;
                worldRef.current.scene.three.remove(obj);
            }
            // Free IFC data from memory
            const modelId = (dm.fragModel as any)?.modelId || dm.model.file_name;
            ifcDataMapRef.current.delete(modelId);

            await deleteModel(dm.model);
            setDisciplineModels(prev => prev.filter((_, i) => i !== index));
            setObjectCount(prev => prev - (dm.model.element_count || 0));
        } catch (err: any) {
            console.error('Delete error:', err);
        }
    }, [disciplineModels, worldRef]);

    // ── Retry failed model ──────────────────────────
    const retryFailedModel = useCallback(async (index: number) => {
        const dm = disciplineModels[index];
        if (!dm || dm.model.status !== 'error') return;
        try {
            await deleteModel(dm.model);
            setDisciplineModels(prev => prev.filter((_, i) => i !== index));
            setStatusMessage('Model đã bị xóa. Hãy upload lại file IFC.');
            setStatus('idle');
        } catch (err: any) {
            console.error('Retry cleanup error:', err);
        }
    }, [disciplineModels]);

    const clearStatus = useCallback(() => {
        setStatus('idle');
        setStatusMessage('');
        setValidationError(null);
    }, []);

    // ── Cancel upload ──────────────────────────
    const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus('idle');
        setStatusMessage('Upload bị hủy');
        setLoadingProgress(0);
        setTimeout(() => setStatusMessage(''), 3000);
    }, []);

    // ── Multi-file upload (drag & drop) ────────
    const handleMultiFileUpload = useCallback(async (files: FileList) => {
        if (!componentsRef.current || !worldRef.current) return;
        const validFiles: File[] = [];
        for (const file of Array.from(files)) {
            const err = validateFile(file);
            if (err) {
                setValidationError(err);
                setTimeout(() => setValidationError(null), 5000);
            } else {
                validFiles.push(file);
            }
        }
        if (validFiles.length === 0) return;

        // Upload files sequentially to avoid overwhelming the engine
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const fakeEvent = { target: { files: [file], value: '' } } as any;
            // Reuse single file upload logic
            try {
                setStatusMessage(`Đang xử lý ${i + 1}/${validFiles.length}: ${file.name}`);
                await handleFileUpload(fakeEvent);
            } catch { /* individual errors handled in handleFileUpload */ }
        }
    }, [componentsRef, worldRef, validateFile, handleFileUpload]);

    // ── Model-level isolation ─────────────────────────
    // FADE other models (low opacity via material cloning),
    // keep target model fully visible.
    const [isIsolated, setIsIsolated] = useState(false);
    const fadedMaterialsRef = useRef<Map<string, { mesh: any; original: any }>>(new Map());
    const savedCameraRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

    const isolateModelByExpressId = useCallback((expressId: number) => {
        if (!worldRef.current) return;

        // Save current camera state for Back button
        const cam = worldRef.current.camera;
        if (cam && (cam as any).controls) {
            const controls = (cam as any).controls;
            savedCameraRef.current = {
                position: new THREE.Vector3().copy(controls.camera.position),
                target: new THREE.Vector3().copy(controls.target || new THREE.Vector3()),
            };
        }

        // Restore previous isolation if any
        if (fadedMaterialsRef.current.size > 0) {
            for (const [, { mesh, original }] of fadedMaterialsRef.current) {
                mesh.material = original;
            }
            fadedMaterialsRef.current.clear();
        }

        // Find target model by checking FragmentsManager
        const fragments = componentsRef.current?.get(OBC.FragmentsManager);
        let targetFragModelId: string | null = null;

        if (fragments) {
            for (const [modelId, model] of fragments.list) {
                let found = false;

                // Strategy 1: Try getFragmentMap API (ThatOpen v2)
                try {
                    if (typeof (model as any).getFragmentMap === 'function') {
                        const fragMap = (model as any).getFragmentMap([expressId]);
                        if (fragMap && Object.keys(fragMap).length > 0) {
                            found = true;
                        }
                    }
                } catch { /* skip */ }

                // Strategy 2: Scan model meshes
                if (!found) {
                    const modelObj = (model as any).object || model;
                    if (modelObj && typeof modelObj.traverse === 'function') {
                        modelObj.traverse((child: any) => {
                            if (found) return;
                            // ThatOpen v2: fragment.items is Map<number, number[]>
                            const items = child.fragment?.items;
                            if (items instanceof Map && items.has(expressId)) {
                                found = true;
                                return;
                            }
                            // Legacy: itemIDs Set
                            const ids = child.itemIDs || child.fragment?.ids || child.userData?.itemIDs;
                            if (ids instanceof Set && ids.has(expressId)) {
                                found = true;
                                return;
                            }
                            // InstancedMesh
                            if (child.isInstancedMesh && child.fragment?.ids instanceof Set && child.fragment.ids.has(expressId)) {
                                found = true;
                            }
                        });
                    }
                }

                if (found) {
                    targetFragModelId = modelId;
                    break;
                }
            }
        }

        // Map FragmentsManager modelId → disciplineModel index
        let targetDmIndex = -1;
        if (targetFragModelId) {
            for (let i = 0; i < disciplineModels.length; i++) {
                const dm = disciplineModels[i];
                if (!dm.fragModel) continue;
                const dmModelId = (dm.fragModel as any).modelId;
                if (dmModelId === targetFragModelId) {
                    targetDmIndex = i;
                    break;
                }
            }
        }

        // FADE other models via material cloning (null-safe)
        disciplineModels.forEach((dm, i) => {
            if (i === targetDmIndex || !dm.fragModel || !dm.visible) return;
            const obj = (dm.fragModel as any).object || dm.fragModel;
            if (!obj || typeof obj.traverse !== 'function') return;

            obj.traverse((child: any) => {
                if (!child.isMesh || !child.material) return;
                const key = child.uuid;
                if (fadedMaterialsRef.current.has(key)) return;

                // Save original material
                const original = child.material;
                fadedMaterialsRef.current.set(key, { mesh: child, original });

                // Clone and fade (null-safe)
                try {
                    if (Array.isArray(original)) {
                        child.material = original.map((mat: THREE.Material) => {
                            if (!mat || typeof mat.clone !== 'function') return mat;
                            const c = mat.clone();
                            (c as any).transparent = true;
                            (c as any).opacity = 0.1;
                            (c as any).depthWrite = false;
                            c.needsUpdate = true;
                            return c;
                        });
                    } else if (original && typeof original.clone === 'function') {
                        const c = original.clone();
                        (c as any).transparent = true;
                        (c as any).opacity = 0.1;
                        (c as any).depthWrite = false;
                        c.needsUpdate = true;
                        child.material = c;
                    }
                } catch (matErr) {
                    // Skip materials that can't be cloned
                    console.warn('[Upload] Material clone error:', matErr);
                }
            });
        });

        setIsIsolated(true);
    }, [disciplineModels, worldRef, componentsRef]);

    const restoreAllModels = useCallback(() => {
        // Restore original materials
        for (const [, { mesh, original }] of fadedMaterialsRef.current) {
            // Dispose cloned materials
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m: THREE.Material) => m.dispose());
            } else if (mesh.material) {
                mesh.material.dispose();
            }
            mesh.material = original;
        }
        fadedMaterialsRef.current.clear();

        // Restore camera position
        if (savedCameraRef.current && worldRef.current) {
            const cam = worldRef.current.camera;
            if (cam && (cam as any).controls) {
                const controls = (cam as any).controls;
                controls.setLookAt(
                    savedCameraRef.current.position.x,
                    savedCameraRef.current.position.y,
                    savedCameraRef.current.position.z,
                    savedCameraRef.current.target.x,
                    savedCameraRef.current.target.y,
                    savedCameraRef.current.target.z,
                    true // animate
                );
            }
            savedCameraRef.current = null;
        }

        setIsIsolated(false);
    }, [worldRef]);

    return {
        status,
        statusMessage,
        loadingProgress,
        disciplineModels,
        objectCount,
        ifcDataMapRef,
        handleFileUpload,
        handleMultiFileUpload,
        loadExistingModels,
        toggleDisciplineVisibility,
        handleDeleteModel,
        retryFailedModel,
        clearStatus,
        cancelUpload,
        validationError,
        isolateModelByExpressId,
        restoreAllModels,
        isIsolated,
    };
}
