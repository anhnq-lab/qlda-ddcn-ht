/**
 * useBimSelection — Element selection, property extraction, spatial tree, visibility
 * 
 * Uses standalone web-ifc IfcAPI for property extraction (OBC's internal webIfc
 * has uninitialized WASM). Creates a cached IfcAPI instance with Init() for
 * reliable OpenModel/GetLine/GetLineIDsWithType calls.
 */
import React, { useRef, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as WebIFC from 'web-ifc';
import type { SelectedElement, PropertySetGroup, PropertyItem, RelationItem, ClassificationItem } from './BimPropertiesPanel';
import type { SpatialNode, TypeGroup } from './BimModelTree';

// ── Standalone web-ifc IfcAPI (cached, initialized once) ──
let _standaloneIfcApi: WebIFC.IfcAPI | null = null;
let _initPromise: Promise<WebIFC.IfcAPI> | null = null;

async function getStandaloneIfcApi(): Promise<WebIFC.IfcAPI> {
    if (_standaloneIfcApi) return _standaloneIfcApi;
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
        const api = new WebIFC.IfcAPI();
        api.SetWasmPath('/');
        await api.Init();
        _standaloneIfcApi = api;
        // web-ifc initialized silently
        return api;
    })();
    return _initPromise;
}

export interface BimSelectionAPI {
    selectedElement: SelectedElement | null;
    spatialTree: SpatialNode[];
    typeGroups: TypeGroup[];
    setupHighlighterEvents: () => (() => void);
    handleSelectElementFromTree: (expressId: number) => void;
    handleIsolateSelected: () => void;
    handleHideSelected: () => void;
    handleShowAll: () => void;
    toggleTypeVisibility: (type: string) => void;
    buildSpatialTree: (ifcData: Uint8Array) => void;
    loadPropertiesAndTree: (modelId: string, data: any) => void;
    clearSelection: () => void;
    cleanupModelCache: () => void;
}

// IFC type codes for spatial tree building
const IFC_TYPES = {
    IFCPROJECT: 103090709,
    IFCSITE: 4097777520,
    IFCBUILDING: 4031249490,
    IFCBUILDINGSTOREY: 3124254112,
    IFCRELAGGREGATES: 160246688,
    IFCRELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
    IFCRELDEFINESBYPROPERTIES: 4186316022,
    IFCRELASSOCIATESMATERIAL: 2655215786,
    IFCRELVOIDSELEMENT: 1401173127,
    IFCRELFILLSELEMENT: 3940055652,
    IFCRELASSOCIATESCLASSIFICATION: 919958153,
};

const COMMON_IFC_TYPES = [
    { code: 3512223829, name: 'IfcWallStandardCase' },
    { code: 2391406531, name: 'IfcWall' },
    { code: 1529196076, name: 'IfcSlab' },
    { code: 843113511, name: 'IfcColumn' },
    { code: 753842376, name: 'IfcBeam' },
    { code: 395920057, name: 'IfcDoor' },
    { code: 3304561284, name: 'IfcWindow' },
    { code: 331165859, name: 'IfcStair' },
    { code: 2262370178, name: 'IfcRailing' },
    { code: 1281925730, name: 'IfcCovering' },
    { code: 2058353004, name: 'IfcRoof' },
    { code: 3856911033, name: 'IfcSpace' },
    { code: 979105199, name: 'IfcBuildingElementProxy' },
    { code: 1687234759, name: 'IfcPile' },
    { code: 1335981549, name: 'IfcDiscreteAccessory' },
    { code: 1051757585, name: 'IfcCurtainWall' },
    { code: 4105962743, name: 'IfcMember' },
    { code: 3758799889, name: 'IfcPlate' },
    { code: 900683007, name: 'IfcFooting' },
    { code: 3495092785, name: 'IfcFurniture' },
];

function convertJsonPropertyToSelectedElement(
    expressId: number,
    propertiesList: any[],
    modelId: string
): SelectedElement {
    const itemData = propertiesList.find((p: any) => p.expressID === expressId || p.localId === expressId || p.id === expressId);
    if (!itemData) {
        return {
            id: String(expressId),
            name: `Element #${expressId}`,
            type: 'Unknown',
            globalId: '',
            propertySets: [],
            materials: [],
        };
    }

    // Get type code and resolve name
    const type = itemData.type ? (COMMON_IFC_TYPES.find(t => t.code === itemData.type)?.name || 'Unknown') : 'Unknown';
    const name = itemData.Name?.value || itemData.LongName?.value || `${type} #${expressId}`;
    const globalId = itemData.GlobalId?.value || '';

    const propertySets: PropertySetGroup[] = [];

    // Identity Set
    const identityProps: PropertyItem[] = [
        { name: 'Express ID', value: String(expressId) },
        { name: 'IFC Type', value: type },
    ];
    if (globalId) identityProps.push({ name: 'GlobalId', value: globalId });
    if (itemData.Description?.value) identityProps.push({ name: 'Description', value: itemData.Description.value });
    if (itemData.ObjectType?.value) identityProps.push({ name: 'Object Type', value: itemData.ObjectType.value });
    if (itemData.Tag?.value) identityProps.push({ name: 'Tag', value: itemData.Tag.value });
    propertySets.push({ name: 'Identity', properties: identityProps });

    // Custom Properties (excluding system fields)
    const customProps: PropertyItem[] = [];
    Object.keys(itemData).forEach(key => {
        if (['expressID', 'localId', 'id', 'type', 'Name', 'LongName', 'GlobalId', 'Description', 'ObjectType', 'Tag', 'PredefinedType', 'relations', 'children'].includes(key)) {
            return;
        }
        
        const val = itemData[key];
        if (val && typeof val === 'object' && 'value' in val) {
            customProps.push({ name: key, value: String(val.value) });
        } else if (val !== null && val !== undefined && (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')) {
            customProps.push({ name: key, value: String(val) });
        }
    });

    if (customProps.length > 0) {
        propertySets.push({ name: 'Attributes', properties: customProps });
    }

    // Nested relations (Property Sets)
    if (itemData.relations && Array.isArray(itemData.relations)) {
        itemData.relations.forEach((rel: any) => {
            const psetName = rel.Name?.value || rel.Name || 'Property Set';
            const props: PropertyItem[] = [];
            
            if (rel.HasProperties && Array.isArray(rel.HasProperties)) {
                rel.HasProperties.forEach((prop: any) => {
                    const pName = prop.Name?.value || prop.Name || 'Property';
                    const pVal = prop.NominalValue?.value ?? prop.NominalValue ?? '';
                    props.push({ name: pName, value: String(pVal) });
                });
            } else {
                Object.keys(rel).forEach(rKey => {
                    if (['expressID', 'localId', 'id', 'type', 'Name', 'GlobalId', 'Description'].includes(rKey)) return;
                    const rVal = rel[rKey];
                    if (rVal && typeof rVal === 'object' && 'value' in rVal) {
                        props.push({ name: rKey, value: String(rVal.value) });
                    } else if (rVal !== null && rVal !== undefined && (typeof rVal === 'string' || typeof rVal === 'number' || typeof rVal === 'boolean')) {
                        props.push({ name: rKey, value: String(rVal) });
                    }
                });
            }

            if (props.length > 0) {
                propertySets.push({ name: psetName, properties: props });
            }
        });
    }

    return {
        id: String(expressId),
        name,
        type,
        globalId,
        propertySets,
        materials: [],
    };
}

export function useBimSelection(
    componentsRef: React.MutableRefObject<OBC.Components | null>,
    worldRef: React.MutableRefObject<OBC.World | null>,
    ifcLoaderRef: React.MutableRefObject<OBC.IfcLoader | null>,
    ifcDataMapRef: React.MutableRefObject<Map<string, Uint8Array>>,
    onPanelOpen?: () => void,
): BimSelectionAPI {
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [spatialTree, setSpatialTree] = useState<SpatialNode[]>([]);
    const [typeGroups, setTypeGroups] = useState<TypeGroup[]>([]);
    const hiddenFragmentsRef = useRef<Map<string, Set<number>>>(new Map());
    const selectedFragmentRef = useRef<{ modelId: string; expressIds: number[] } | null>(null);
    // Property cache — avoid re-parsing IFC properties for previously selected elements
    const propertyCacheRef = useRef<Map<string, SelectedElement>>(new Map());
    const PROPERTY_CACHE_MAX = 100;
    // ── IFC Model cache — avoid OpenModel/CloseModel on every click ──
    const openModelCacheRef = useRef<Map<string, { modelID: number; ifcApi: WebIFC.IfcAPI }>>(new Map());
    const MODEL_CACHE_MAX = 5;

    const jsonPropertiesRef = useRef<Map<string, { spatialTree: any; properties: any[] }>>(new Map());

    const loadPropertiesAndTree = useCallback((modelId: string, data: any) => {
        if (!data) return;
        jsonPropertiesRef.current.set(modelId, data);
        
        // Build Spatial Nodes from spatialTree in JSON
        if (data.spatialTree) {
            const mapSpatialNode = (node: any): SpatialNode => {
                const id = node.localId ?? 0;
                const type = node.category || 'Unknown';
                
                // Get name from properties list if available
                let name = `${type} #${id}`;
                if (data.properties && Array.isArray(data.properties)) {
                    const itemData = data.properties.find((p: any) => p.expressID === id || p.localId === id || p.id === id);
                    name = itemData?.Name?.value || itemData?.LongName?.value || `${type} #${id}`;
                }
                
                const children = node.children ? node.children.map(mapSpatialNode) : [];
                
                // Calculate element count safely
                let elementCount = 0;
                if (children.length > 0) {
                    elementCount = children.reduce((sum: number, c: any) => sum + (c.elementCount || 0) + (c.type && !c.type.toLowerCase().includes('storey') && !c.type.toLowerCase().includes('building') ? 1 : 0), 0);
                }
                
                return { id, name, type, children, elementCount };
            };
            
            const rootNode = mapSpatialNode(data.spatialTree);
            setSpatialTree(prev => {
                if (prev.some(node => node.name === rootNode.name)) return prev;
                return [...prev, rootNode];
            });
        }

        // Build Type Groups from properties in JSON
        if (data.properties && Array.isArray(data.properties)) {
            const typeMap = new Map<string, { id: number; name: string }[]>();
            data.properties.forEach((p: any) => {
                const id = p.expressID ?? p.localId ?? p.id;
                if (!id) return;
                const type = p.type ? getIfcTypeName(p.type) : 'Unknown';
                const name = p.Name?.value || p.LongName?.value || `${type} #${id}`;
                
                const elements = typeMap.get(type) || [];
                elements.push({ id, name });
                typeMap.set(type, elements);
            });
            
            const groups: TypeGroup[] = [];
            typeMap.forEach((elements, type) => {
                groups.push({ type, count: elements.length, elements, visible: true });
            });
            groups.sort((a, b) => b.count - a.count);
            
            setTypeGroups(prev => {
                const merged = new Map<string, TypeGroup>();
                prev.forEach(g => merged.set(g.type, g));
                groups.forEach(g => {
                    const existing = merged.get(g.type);
                    if (existing) {
                        merged.set(g.type, {
                           ...existing,
                           count: existing.count + g.count,
                           elements: [...existing.elements, ...g.elements],
                        });
                    } else {
                        merged.set(g.type, g);
                    }
                });
                return Array.from(merged.values()).sort((a, b) => b.count - a.count);
            });
        }
    }, []);

    // ── Convert getItemsData result → SelectedElement ──
    const convertToSelectedElement = useCallback((
        expressId: number, itemData: any, modelId: string
    ): SelectedElement => {
        // itemData from getItemsData() returns an array of attribute objects
        // Each item has: { Name, type, GlobalId, Description, ObjectType, Tag, ... }
        const name = itemData?.Name?.value || itemData?.LongName?.value || `Element #${expressId}`;
        const type = itemData?.type ? getIfcTypeName(itemData.type) : 'Unknown';
        const globalId = itemData?.GlobalId?.value;

        const propertySets: PropertySetGroup[] = [];

        // Build Identity property set
        const identityProps: PropertyItem[] = [
            { name: 'Express ID', value: String(expressId) },
            { name: 'IFC Type', value: type },
        ];
        if (globalId) identityProps.push({ name: 'GlobalId', value: globalId });
        if (itemData?.Description?.value) identityProps.push({ name: 'Description', value: itemData.Description.value });
        if (itemData?.ObjectType?.value) identityProps.push({ name: 'Object Type', value: itemData.ObjectType.value });
        if (itemData?.Tag?.value) identityProps.push({ name: 'Tag', value: itemData.Tag.value });
        if (itemData?.PredefinedType?.value) identityProps.push({ name: 'Predefined Type', value: String(itemData.PredefinedType.value) });
        propertySets.push({ name: 'Identity', properties: identityProps });

        return {
            id: String(expressId),
            name,
            type,
            globalId,
            propertySets,
            materials: [],
        };
    }, []);

    // ── Get IFC type name from type code ──
    function getIfcTypeName(typeCode: number): string {
        const found = COMMON_IFC_TYPES.find(t => t.code === typeCode);
        if (found) return found.name;
        // Fallback: try from standalone IfcAPI (sync check only)
        if (_standaloneIfcApi) {
            try {
                return _standaloneIfcApi.GetNameFromTypeCode(typeCode) || 'Unknown';
            } catch { /* ignore */ }
        }
        return 'Unknown';
    }

    // ── Extract full properties using web-ifc (richer than getItemsData) ──
    const extractFullProperties = useCallback(async (
        expressID: number
    ): Promise<Partial<SelectedElement>> => {
        if (ifcDataMapRef.current.size === 0) return {};

        // Use standalone web-ifc (OBC's internal webIfc has uninitialized WASM)
        let ifcApi: WebIFC.IfcAPI;
        try {
            ifcApi = await getStandaloneIfcApi();
        } catch (err) {
            console.warn('[Selection] Failed to init standalone web-ifc:', err);
            return {};
        }

        // Try all available IFC data — use cached model if available
        for (const [key, ifcData] of ifcDataMapRef.current) {
            try {
                // ── Cache hit: reuse opened model ──
                let modelID: number;
                const cached = openModelCacheRef.current.get(key);
                if (cached && cached.ifcApi === ifcApi) {
                    modelID = cached.modelID;
                } else {
                    // ── Cache miss: open and cache ──
                    modelID = ifcApi.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                    // Evict oldest if cache full
                    if (openModelCacheRef.current.size >= MODEL_CACHE_MAX) {
                        const firstKey = openModelCacheRef.current.keys().next().value;
                        if (firstKey) {
                            const old = openModelCacheRef.current.get(firstKey);
                            if (old) { try { old.ifcApi.CloseModel(old.modelID); } catch { /* */ } }
                            openModelCacheRef.current.delete(firstKey);
                        }
                    }
                    openModelCacheRef.current.set(key, { modelID, ifcApi });
                }

                const line = ifcApi.GetLine(modelID, expressID, false);
                if (!line) continue;

                const propertySets: PropertySetGroup[] = [];
                const materials: string[] = [];
                const relations: RelationItem[] = [];
                const classifications: ClassificationItem[] = [];

                // --- PropertySets & QuantitySets ---
                try {
                    const relIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELDEFINESBYPROPERTIES);
                    for (let i = 0; i < relIds.size(); i++) {
                        const relId = relIds.get(i);
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatedObjects) continue;
                        const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                        if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;

                        const psetId = rel.RelatingPropertyDefinition?.value;
                        if (!psetId) continue;
                        const pset = ifcApi.GetLine(modelID, psetId, false);
                        if (!pset) continue;

                        const psetName = pset.Name?.value || 'PropertySet';
                        const items: PropertyItem[] = [];

                        if (pset.HasProperties) {
                            const props = Array.isArray(pset.HasProperties) ? pset.HasProperties : [pset.HasProperties];
                            for (const propRef of props) {
                                const propId = propRef?.value ?? propRef;
                                if (!propId) continue;
                                try {
                                    const prop = ifcApi.GetLine(modelID, propId, false);
                                    if (!prop) continue;
                                    const propName = prop.Name?.value || '';
                                    let propValue = '';
                                    if (prop.NominalValue !== undefined && prop.NominalValue !== null) {
                                        propValue = String(prop.NominalValue?.value ?? prop.NominalValue ?? '');
                                    }
                                    if (propName) items.push({ name: propName, value: propValue });
                                } catch { /* skip */ }
                            }
                        }

                        if (pset.Quantities) {
                            const quantities = Array.isArray(pset.Quantities) ? pset.Quantities : [pset.Quantities];
                            for (const qRef of quantities) {
                                const qId = qRef?.value ?? qRef;
                                if (!qId) continue;
                                try {
                                    const q = ifcApi.GetLine(modelID, qId, false);
                                    if (!q) continue;
                                    const qName = q.Name?.value || '';
                                    const qVal = q.LengthValue?.value ?? q.AreaValue?.value ?? q.VolumeValue?.value ?? q.WeightValue?.value ?? q.CountValue?.value ?? '';
                                    if (qName) items.push({ name: qName, value: String(qVal) });
                                } catch { /* skip */ }
                            }
                        }

                        if (items.length > 0) propertySets.push({ name: psetName, properties: items });
                    }
                } catch { /* skip psets */ }

                // --- Materials ---
                try {
                    const matRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELASSOCIATESMATERIAL);
                    for (let i = 0; i < matRelIds.size(); i++) {
                        const relId = matRelIds.get(i);
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatedObjects) continue;
                        const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                        if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;
                        const matId = rel.RelatingMaterial?.value;
                        if (!matId) continue;
                        try {
                            const mat = ifcApi.GetLine(modelID, matId, false);
                            if (mat?.Name?.value) materials.push(mat.Name.value);
                            if (mat?.ForLayerSet?.value) {
                                const layerSet = ifcApi.GetLine(modelID, mat.ForLayerSet.value, false);
                                if (layerSet?.MaterialLayers) {
                                    const layers = Array.isArray(layerSet.MaterialLayers) ? layerSet.MaterialLayers : [layerSet.MaterialLayers];
                                    for (const layerRef of layers) {
                                        const layer = ifcApi.GetLine(modelID, layerRef?.value ?? layerRef, false);
                                        if (layer?.Material?.value) {
                                            const material = ifcApi.GetLine(modelID, layer.Material.value, false);
                                            if (material?.Name?.value) materials.push(material.Name.value);
                                        }
                                    }
                                }
                            }
                        } catch { /* skip */ }
                    }
                } catch { /* skip */ }

                // --- Relations (voids, fills) ---
                try {
                    const voidRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELVOIDSELEMENT);
                    for (let i = 0; i < voidRelIds.size(); i++) {
                        const relId = voidRelIds.get(i);
                        try {
                            const rel = ifcApi.GetLine(modelID, relId, false);
                            if (rel?.RelatingBuildingElement?.value === expressID && rel?.RelatedOpeningElement?.value) {
                                const target = ifcApi.GetLine(modelID, rel.RelatedOpeningElement.value, false);
                                relations.push({
                                    type: 'VoidsElement',
                                    targetName: target?.Name?.value || `#${rel.RelatedOpeningElement.value}`,
                                    targetType: getIfcTypeName(target?.type),
                                    targetId: String(rel.RelatedOpeningElement.value),
                                });
                            }
                        } catch { /* skip */ }
                    }
                    const fillRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELFILLSELEMENT);
                    for (let i = 0; i < fillRelIds.size(); i++) {
                        const relId = fillRelIds.get(i);
                        try {
                            const rel = ifcApi.GetLine(modelID, relId, false);
                            if (rel?.RelatingOpeningElement?.value === expressID && rel?.RelatedBuildingElement?.value) {
                                const target = ifcApi.GetLine(modelID, rel.RelatedBuildingElement.value, false);
                                relations.push({
                                    type: 'FillsElement',
                                    targetName: target?.Name?.value || `#${rel.RelatedBuildingElement.value}`,
                                    targetType: getIfcTypeName(target?.type),
                                    targetId: String(rel.RelatedBuildingElement.value),
                                });
                            }
                        } catch { /* skip */ }
                    }
                } catch { /* skip */ }

                // --- Classifications ---
                try {
                    const classRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELASSOCIATESCLASSIFICATION);
                    for (let i = 0; i < classRelIds.size(); i++) {
                        const relId = classRelIds.get(i);
                        try {
                            const rel = ifcApi.GetLine(modelID, relId, false);
                            if (!rel?.RelatedObjects) continue;
                            const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                            if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;
                            const classRefId = rel.RelatingClassification?.value;
                            if (!classRefId) continue;
                            const classRef = ifcApi.GetLine(modelID, classRefId, false);
                            if (!classRef) continue;
                            let systemName = '';
                            if (classRef.ReferencedSource?.value) {
                                try {
                                    const source = ifcApi.GetLine(modelID, classRef.ReferencedSource.value, false);
                                    systemName = source?.Name?.value || '';
                                } catch { /* skip */ }
                            }
                            classifications.push({
                                system: systemName || 'Classification',
                                code: classRef.Identification?.value || classRef.ItemReference?.value || '',
                                name: classRef.Name?.value || '',
                            });
                        } catch { /* skip */ }
                    }
                } catch { /* skip */ }

                return {
                    propertySets: propertySets.length > 0 ? propertySets : undefined,
                    materials: [...new Set(materials)],
                    relations: relations.length > 0 ? relations : undefined,
                    classifications: classifications.length > 0 ? classifications : undefined,
                };
            } catch (err) {
                console.warn('[Selection] Error extracting properties from IFCApi:', err);
                // Element not in this model, try next
            }
        }
        return {};
    }, [ifcDataMapRef]);

    // ═══════════════════════════════════════════════════
    // HIGHLIGHTER EVENTS — using official API
    // ═══════════════════════════════════════════════════
    const setupHighlighterEvents = useCallback(() => {
        const components = componentsRef.current;
        if (!components) return () => { };

        const highlighter = components.get(OBCF.Highlighter);
        const fragments = components.get(OBC.FragmentsManager);
        let disposed = false;

        const onHighlight = async (modelIdMap: any) => {
            if (disposed) return;
            try {
                // Official API: iterate Object.entries(modelIdMap)
                const entries = modelIdMap instanceof Map
                    ? Array.from(modelIdMap.entries())
                    : Object.entries(modelIdMap);

                for (const [modelId, localIds] of entries) {
                    const idArray = localIds instanceof Set
                        ? Array.from(localIds)
                        : Array.isArray(localIds) ? localIds : [localIds];
                    if (!idArray || idArray.length === 0) continue;
                    const expressID = idArray[0] as number;

                    // Store for visibility operations
                    selectedFragmentRef.current = { modelId: String(modelId), expressIds: idArray.map(Number) };

                    // ── Cache hit: skip expensive IFC parsing ──
                    const cacheKey = `${modelId}:${expressID}`;
                    const cached = propertyCacheRef.current.get(cacheKey);
                    if (cached) {
                        setSelectedElement(cached);
                        onPanelOpen?.();
                        break;
                    }

                    // ── Try JSON Properties first ──
                    const modelJsonData = jsonPropertiesRef.current.get(String(modelId));
                    if (modelJsonData && modelJsonData.properties) {
                        const selEl = convertJsonPropertyToSelectedElement(expressID, modelJsonData.properties, String(modelId));
                        propertyCacheRef.current.set(cacheKey, selEl);
                        setSelectedElement(selEl);
                        onPanelOpen?.();
                        break;
                    }

                    // Step 1: Try official API — model.getItemsData()
                    const model = fragments.list.get(String(modelId));
                    let element: SelectedElement | null = null;

                    if (model && typeof (model as any).getItemsData === 'function') {
                        try {
                            const data = await (model as any).getItemsData(idArray);
                            if (data && data.length > 0) {
                                element = convertToSelectedElement(expressID, data[0], String(modelId));
                            }
                        } catch (e) {
                            console.warn('getItemsData failed, falling back to web-ifc:', e);
                        }
                    }

                    // Step 2: Fallback — basic element info
                    if (!element) {
                        const typeName = getIfcTypeName(0);
                        element = {
                            id: String(expressID),
                            name: `Element #${expressID}`,
                            type: typeName,
                            propertySets: [{
                                name: 'Identity',
                                properties: [{ name: 'Express ID', value: String(expressID) }]
                            }],
                            materials: [],
                        };
                    }

                    // Step 3: Enrich with full properties from web-ifc (async, non-blocking)
                    if (!disposed) {
                        setSelectedElement(element);
                        onPanelOpen?.();

                        // Async enrichment — replaces initial Identity set with full property data
                        extractFullProperties(expressID).then(extra => {
                            if (disposed) return;
                            setSelectedElement(prev => {
                                if (!prev || prev.id !== String(expressID)) return prev;
                                const mergedPsets = extra.propertySets && extra.propertySets.length > 0
                                    ? [...prev.propertySets.filter(ps => ps.name !== 'Identity'), ...extra.propertySets]
                                    : prev.propertySets;
                                const enriched = {
                                    ...prev,
                                    propertySets: mergedPsets,
                                    materials: [...new Set([...prev.materials, ...(extra.materials || [])])],
                                    relations: extra.relations || prev.relations,
                                    classifications: extra.classifications || prev.classifications,
                                };
                                // ── Cache set: store enriched element ──
                                if (propertyCacheRef.current.size >= PROPERTY_CACHE_MAX) {
                                    // Evict oldest entry
                                    const firstKey = propertyCacheRef.current.keys().next().value;
                                    if (firstKey) propertyCacheRef.current.delete(firstKey);
                                }
                                propertyCacheRef.current.set(cacheKey, enriched);
                                return enriched;
                            });
                        }).catch((err) => { console.warn('[Selection] Enrichment failed:', err); });
                    }
                    break; // Process first selected element only
                }
            } catch (err) {
                console.warn('Selection error:', err);
            }
        };

        const onClear = () => {
            if (!disposed) {
                setSelectedElement(null);
                selectedFragmentRef.current = null;
            }
        };

        highlighter.events.select.onHighlight.add(onHighlight);
        highlighter.events.select.onClear.add(onClear);

        return () => {
            disposed = true;
            try {
                (highlighter.events.select.onHighlight as any).remove?.(onHighlight);
                (highlighter.events.select.onClear as any).remove?.(onClear);
            } catch { /* cleanup silently */ }
        };
    }, [componentsRef, convertToSelectedElement, extractFullProperties, onPanelOpen]);

    // ── Select from tree → highlight + get info ──
    const handleSelectElementFromTree = useCallback(async (expressId: number) => {
        // Step 1: Show basic info immediately
        const basicElement: SelectedElement = {
            id: String(expressId),
            name: `Element #${expressId}`,
            type: 'Unknown',
            propertySets: [{
                name: 'Identity',
                properties: [{ name: 'Express ID', value: String(expressId) }]
            }],
            materials: [],
        };
        setSelectedElement(basicElement);
        onPanelOpen?.();

        // Step 2: Try to highlight in 3D
        try {
            const components = componentsRef.current;
            if (components) {
                const highlighter = components.get(OBCF.Highlighter);
                await highlighter.clear('select');

                const fragments = components.get(OBC.FragmentsManager);
                const idMap: Record<string, Set<number>> = {};
                let foundModelId: string | null = null;

                // Strategy 1: Try official ThatOpen API (getMergedBox / getBoundingBox)
                for (const [modelId, model] of fragments.list) {
                    try {
                        let box = null;
                        if (typeof (model as any).getMergedBox === 'function') {
                            box = await (model as any).getMergedBox([expressId]);
                        } else if (typeof (model as any).getBoundingBox === 'function') {
                            box = await (model as any).getBoundingBox([expressId]);
                        }
                        if (box && !box.isEmpty()) {
                            idMap[modelId] = new Set([expressId]);
                            foundModelId = String(modelId);
                            break;
                        }
                    } catch { /* skip */ }
                }

                // Strategy 1.5: Try getFragmentMap API (ThatOpen v2)
                if (!foundModelId) {
                    for (const [modelId, model] of fragments.list) {
                        try {
                            if (typeof (model as any).getFragmentMap === 'function') {
                                const fragMap = (model as any).getFragmentMap([expressId]);
                                if (fragMap && Object.keys(fragMap).length > 0) {
                                    idMap[modelId] = new Set([expressId]);
                                    foundModelId = String(modelId);
                                    console.log(`[Selection] Found expressId ${expressId} via getFragmentMap in model ${modelId}`);
                                    break;
                                }
                            }
                        } catch { /* skip */ }
                    }
                }

                // Strategy 2: Fallback — scan mesh children for fragment.items Map / itemIDs Set
                if (!foundModelId) {
                    for (const [modelId, model] of fragments.list) {
                        const modelObj = (model as any).object || model;
                        if (!modelObj || typeof modelObj.traverse !== 'function') continue;
                        let found = false;
                        modelObj.traverse((child: any) => {
                            if (found) return;
                            if (!child.isMesh) return;

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
                        if (found) {
                            idMap[modelId] = new Set([expressId]);
                            foundModelId = String(modelId);
                            console.log(`[Selection] Found expressId ${expressId} via mesh scan in model ${modelId}`);
                            break;
                        }
                    }
                }

                if (foundModelId) {
                    selectedFragmentRef.current = { modelId: foundModelId, expressIds: [expressId] };
                    try {
                        await highlighter.highlightByID('select', idMap, true, false);
                    } catch (highlightErr) {
                        console.warn('[Selection] highlightByID failed:', highlightErr);
                    }
                } else {
                    console.warn(`[Selection] Could not find expressId ${expressId} in any model`);
                }
            }
        } catch (e) {
            console.warn('[Selection] Highlight from tree error:', e);
        }

        // Step 3: Enrich with full properties
        let extra: Partial<SelectedElement> = {};
        let foundInJson = false;
        
        for (const [modelId, data] of jsonPropertiesRef.current) {
            const item = data.properties?.find((p: any) => p.expressID === expressId || p.localId === expressId || p.id === expressId);
            if (item) {
                const fullEl = convertJsonPropertyToSelectedElement(expressId, data.properties, modelId);
                extra = {
                    name: fullEl.name,
                    type: fullEl.type,
                    globalId: fullEl.globalId,
                    propertySets: fullEl.propertySets,
                    materials: fullEl.materials,
                };
                foundInJson = true;
                break;
            }
        }
        
        if (!foundInJson) {
            extra = await extractFullProperties(expressId);
        }

        setSelectedElement(prev => {
            if (!prev || prev.id !== String(expressId)) return prev;
            // Merge: replace initial Identity-only set with full data
            const mergedPsets = extra.propertySets && extra.propertySets.length > 0
                ? [...prev.propertySets.filter(ps => ps.name !== 'Identity'), ...extra.propertySets]
                : prev.propertySets;
            return {
                ...prev,
                name: extra.name || prev.name,
                type: prev.type,
                propertySets: mergedPsets,
                materials: [...new Set([...prev.materials, ...(extra.materials || [])])],
                relations: extra.relations || prev.relations,
                classifications: extra.classifications || prev.classifications,
            };
        });
    }, [ifcDataMapRef, extractFullProperties, onPanelOpen, componentsRef]);

    // ═══════════════════════════════════════════════════
    // VISIBILITY — using FragmentsManager for reliability
    // ═══════════════════════════════════════════════════
    const handleIsolateSelected = useCallback(() => {
        const components = componentsRef.current;
        if (!selectedElement || !components) return;

        try {
            const fragments = components.get(OBC.FragmentsManager);
            const hider = (components as any).get?.((OBC as any).Hider);

            if (hider && typeof hider.isolate === 'function' && selectedFragmentRef.current) {
                // Use Hider component if available
                const { modelId, expressIds } = selectedFragmentRef.current;
                const idMap: Record<string, Set<number>> = {};
                idMap[modelId] = new Set(expressIds);
                hider.isolate(idMap);
            } else {
                // Fallback: traverse scene
                const world = worldRef.current;
                if (!world) return;
                const selectedId = Number(selectedElement.id);
                world.scene.three.traverse((obj: any) => {
                    if (obj.isMesh) {
                        const isSelected = obj.userData?.expressID === selectedId;
                        obj.visible = isSelected;
                        if (!isSelected) {
                            hiddenFragmentsRef.current.set(obj.uuid, new Set());
                        }
                    }
                });
            }
        } catch {
            // Final fallback
            const world = worldRef.current;
            if (!world) return;
            const selectedId = Number(selectedElement.id);
            world.scene.three.traverse((obj: any) => {
                if (obj.isMesh) {
                    obj.visible = obj.userData?.expressID === selectedId;
                }
            });
        }
    }, [selectedElement, componentsRef, worldRef]);

    const handleHideSelected = useCallback(() => {
        const components = componentsRef.current;
        if (!selectedElement || !components) return;

        try {
            const world = worldRef.current;
            if (!world) return;
            const selectedId = Number(selectedElement.id);
            world.scene.three.traverse((obj: any) => {
                if (obj.isMesh && obj.userData?.expressID === selectedId) {
                    obj.visible = false;
                    hiddenFragmentsRef.current.set(obj.uuid, new Set());
                }
            });
        } catch { /* ignore */ }
    }, [selectedElement, componentsRef, worldRef]);

    const handleShowAll = useCallback(() => {
        const world = worldRef.current;
        if (!world) return;
        world.scene.three.traverse((obj: any) => {
            if (obj.isMesh) obj.visible = true;
        });
        hiddenFragmentsRef.current.clear();
    }, [worldRef]);

    // ── Toggle type visibility ──
    const toggleTypeVisibility = useCallback((type: string) => {
        setTypeGroups(prev => prev.map(g => {
            if (g.type === type) {
                const newVisible = !g.visible;
                const world = worldRef.current;
                if (world) {
                    world.scene.three.traverse((obj: any) => {
                        if (obj.isMesh && obj.userData?.ifcType === type) {
                            obj.visible = newVisible;
                        }
                    });
                }
                return { ...g, visible: newVisible };
            }
            return g;
        }));
    }, [worldRef]);

    // ═══════════════════════════════════════════════════
    // SPATIAL TREE — using web-ifc (still needed for tree structure)
    // ═══════════════════════════════════════════════════
    const buildSpatialTree = useCallback(async (ifcData: Uint8Array) => {
        try {
            const ifcApi = await getStandaloneIfcApi();

            // ── Reuse cached model if available ──
            const cacheKey = `spatial_${ifcDataMapRef.current.size}`;
            let modelID: number;
            let shouldClose = false;
            const cached = openModelCacheRef.current.get(cacheKey);
            if (cached && cached.ifcApi === ifcApi) {
                modelID = cached.modelID;
            } else {
                modelID = ifcApi.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                // Cache it for property extraction too
                if (openModelCacheRef.current.size >= MODEL_CACHE_MAX) {
                    const firstKey = openModelCacheRef.current.keys().next().value;
                    if (firstKey) {
                        const old = openModelCacheRef.current.get(firstKey);
                        if (old) { try { old.ifcApi.CloseModel(old.modelID); } catch { /* */ } }
                        openModelCacheRef.current.delete(firstKey);
                    }
                }
                openModelCacheRef.current.set(cacheKey, { modelID, ifcApi });
            }
            try {
                // ── Pre-index aggregates (Site -> Building -> Storey) to optimize buildNode recursion to O(N) ──
                const aggregatesMap = new Map<number, number[]>();
                const aggRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELAGGREGATES);
                for (let i = 0; i < aggRelIds.size(); i++) {
                    const relId = aggRelIds.get(i);
                    try {
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatingObject || !rel?.RelatedObjects) continue;
                        const parentId = rel.RelatingObject?.value ?? rel.RelatingObject;
                        const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                        
                        const list = aggregatesMap.get(parentId) || [];
                        for (const obj of relatedObjects) {
                            const childId = obj?.value ?? obj;
                            if (childId) list.push(childId);
                        }
                        aggregatesMap.set(parentId, list);
                    } catch { /* ignore relation read error */ }
                }

                // ── Pre-index contained elements count ──
                const containedMap = new Map<number, number[]>();
                const containRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELCONTAINEDINSPATIALSTRUCTURE);
                for (let i = 0; i < containRelIds.size(); i++) {
                    const relId = containRelIds.get(i);
                    try {
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatingStructure || !rel?.RelatedElements) continue;
                        const parentId = rel.RelatingStructure?.value ?? rel.RelatingStructure;
                        const contained = Array.isArray(rel.RelatedElements) ? rel.RelatedElements : [rel.RelatedElements];
                        
                        const list = containedMap.get(parentId) || [];
                        for (const el of contained) {
                            const childId = el?.value ?? el;
                            if (childId) list.push(childId);
                        }
                        containedMap.set(parentId, list);
                    } catch { /* ignore relation read error */ }
                }

                const visited = new Set<number>();
                const buildNode = (expressID: number): SpatialNode => {
                    if (visited.has(expressID)) {
                        return { id: expressID, name: `[Vòng lặp] #${expressID}`, type: 'Unknown', children: [], elementCount: 0 };
                    }
                    visited.add(expressID);

                    const line = ifcApi.GetLine(modelID, expressID, false);
                    const name = line?.Name?.value || line?.LongName?.value || `#${expressID}`;
                    let type = 'Unknown';
                    try { type = ifcApi.GetNameFromTypeCode(line?.type) || 'Unknown'; } catch { }

                    const children: SpatialNode[] = [];

                    // Get children from pre-indexed aggregates
                    const childIds = aggregatesMap.get(expressID) || [];
                    for (const childId of childIds) {
                        children.push(buildNode(childId));
                    }

                    // Get contained elements count from pre-indexed containedMap
                    const containedElements = containedMap.get(expressID) || [];
                    const elementCount = containedElements.length;

                    visited.delete(expressID);
                    return { id: expressID, name, type, children, elementCount };
                };

                const projectIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCPROJECT);
                const tree: SpatialNode[] = [];
                for (let i = 0; i < projectIds.size(); i++) {
                    tree.push(buildNode(projectIds.get(i)));
                }
                setSpatialTree(prev => [...prev, ...tree]);

                // Build type groups
                const typeMap = new Map<string, { id: number; name: string }[]>();
                for (const ct of COMMON_IFC_TYPES) {
                    try {
                        const ids = ifcApi.GetLineIDsWithType(modelID, ct.code);
                        if (ids.size() === 0) continue;
                        const elements: { id: number; name: string }[] = [];
                        for (let j = 0; j < ids.size(); j++) {
                            const id = ids.get(j);
                            try {
                                const el = ifcApi.GetLine(modelID, id, false);
                                elements.push({ id, name: el?.Name?.value || `#${id}` });
                            } catch { elements.push({ id, name: `#${id}` }); }
                        }
                        const existing = typeMap.get(ct.name);
                        if (existing) existing.push(...elements);
                        else typeMap.set(ct.name, elements);
                    } catch { /* type not found */ }
                }

                const groups: TypeGroup[] = [];
                typeMap.forEach((elements, type) => {
                    groups.push({ type, count: elements.length, elements, visible: true });
                });
                groups.sort((a, b) => b.count - a.count);
                setTypeGroups(prev => {
                    // Merge with existing
                    const merged = new Map<string, TypeGroup>();
                    prev.forEach(g => merged.set(g.type, g));
                    groups.forEach(g => {
                        const existing = merged.get(g.type);
                        if (existing) {
                            merged.set(g.type, {
                                ...existing,
                                count: existing.count + g.count,
                                elements: [...existing.elements, ...g.elements],
                            });
                        } else {
                            merged.set(g.type, g);
                        }
                    });
                    return Array.from(merged.values()).sort((a, b) => b.count - a.count);
                });
            } finally {
                // Don't close — model stays cached for property extraction
            }
        } catch (err) {
            console.warn('Spatial tree build error:', err);
        }
    }, []);

    // ── Clear selection ──
    const clearSelection = useCallback(() => {
        setSelectedElement(null);
        selectedFragmentRef.current = null;
        try {
            const components = componentsRef.current;
            if (components) {
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.clear('select');
            }
        } catch { /* ignore */ }
    }, [componentsRef]);

    // ── Cleanup cached IFC models on unmount ──
    const cleanupModelCache = useCallback(() => {
        for (const [, cached] of openModelCacheRef.current) {
            try { cached.ifcApi.CloseModel(cached.modelID); } catch { /* */ }
        }
        openModelCacheRef.current.clear();
        propertyCacheRef.current.clear();
    }, []);

    return {
        selectedElement,
        spatialTree,
        typeGroups,
        setupHighlighterEvents,
        handleSelectElementFromTree,
        handleIsolateSelected,
        handleHideSelected,
        handleShowAll,
        toggleTypeVisibility,
        buildSpatialTree,
        loadPropertiesAndTree,
        clearSelection,
        cleanupModelCache,
    };
}
