/**
 * useBimEngine — Init & manage That Open Engine lifecycle
 * Handles: Components init, World (Scene/Camera/Renderer), Grid, Highlighter, IfcLoader, Fragments
 * Professional lighting, gradient background, smooth camera
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree,
    MeshBVH,
} from 'three-mesh-bvh';

// ── BVH acceleration ────────────────────────────────────────────────────
// Patch Three.js Mesh/BufferGeometry once at module load so every fragment
// mesh added to the scene picks up BVH-accelerated raycasting automatically.
// This makes selection / measurement / section / context-menu raycasts
// 10–100× faster on large models (per three-mesh-bvh benchmarks).
(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
(THREE.Mesh.prototype as any).raycast = acceleratedRaycast;

/**
 * Build a BVH for every BufferGeometry under an Object3D — but spread the
 * work across idle frames so the main thread never stalls. A single MeshBVH
 * for a 200 MB IFC mesh can take 200–500 ms; running them back-to-back on
 * `onItemSet` would freeze the page for several seconds. We collect candidate
 * geometries first, then drain the queue one geometry per `requestIdleCallback`
 * (or `setTimeout(0)` fallback).
 */
function scheduleBoundsTreeBuild(root: THREE.Object3D): void {
    const queue: THREE.BufferGeometry[] = [];
    root.traverse((obj: any) => {
        if (!obj.isMesh) return;
        const geom = obj.geometry as THREE.BufferGeometry | undefined;
        if (!geom || !geom.attributes?.position) return;
        if (geom.boundsTree) return;
        queue.push(geom);
    });
    if (queue.length === 0) return;

    const idle = (window as any).requestIdleCallback as
        | ((cb: (deadline: { timeRemaining: () => number }) => void, opts?: { timeout: number }) => number)
        | undefined;

    let totalBuilt = 0;
    const t0 = performance.now();

    const drain = (deadline?: { timeRemaining: () => number }) => {
        // Always build at least one per tick so progress is guaranteed even
        // when timeRemaining() is 0 (page busy).
        let safety = 0;
        while (queue.length > 0 && safety < 1) {
            const geom = queue.shift()!;
            if (!geom.boundsTree) {
                try {
                    geom.boundsTree = new MeshBVH(geom, { maxLeafTris: 16 });
                    totalBuilt++;
                } catch (err) {
                    console.warn('[BVH] Failed to build:', err);
                }
            }
            safety++;
            // If we have idle time, keep going within this tick.
            if (deadline && deadline.timeRemaining() < 4) break;
        }

        if (queue.length > 0) {
            if (idle) idle(drain, { timeout: 200 });
            else setTimeout(() => drain(), 0);
        } else {
            console.log(`[BVH] Built ${totalBuilt} bounds trees in ${(performance.now() - t0).toFixed(0)}ms`);
        }
    };

    if (idle) idle(drain, { timeout: 200 });
    else setTimeout(() => drain(), 0);
}

// ── Sky gradient helper ─────────────────────────
function createSkyGradientTexture(isDark: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    if (isDark) {
        // Rich midnight navy → indigo → steel blue horizon → deep ground
        gradient.addColorStop(0.0, '#0a0f1e');   // top: deep midnight
        gradient.addColorStop(0.15, '#0d1b3e');  // upper: dark navy
        gradient.addColorStop(0.35, '#132347');   // mid-upper: rich navy
        gradient.addColorStop(0.48, '#1a2d5a');   // approaching horizon: steel blue
        gradient.addColorStop(0.52, '#233a6b');   // horizon glow: bright steel
        gradient.addColorStop(0.56, '#1a2d5a');   // below horizon mirror
        gradient.addColorStop(0.7, '#0f1a38');    // below: dark indigo
        gradient.addColorStop(1.0, '#080e1f');    // bottom: near-black navy
    } else {
        // Atmospheric sky — powder blue → ivory → warm cream horizon
        gradient.addColorStop(0.0, '#bfdbfe');   // top: soft sky blue
        gradient.addColorStop(0.2, '#dbeafe');   // upper: lighter blue
        gradient.addColorStop(0.4, '#eff6ff');   // mid: ice blue
        gradient.addColorStop(0.48, '#fefce8');  // horizon warm: cream
        gradient.addColorStop(0.52, '#fef9c3');  // horizon glow: warm ivory
        gradient.addColorStop(0.56, '#fefce8');  // below horizon: cream
        gradient.addColorStop(0.7, '#f1f5f9');   // lower: cool gray
        gradient.addColorStop(1.0, '#e2e8f0');   // bottom: slate-200
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    return texture;
}

export const getSafeCamera = (world: OBC.World | null | undefined): OBC.SimpleCamera | undefined => {
    if (!world) return undefined;
    try {
        return world.camera as OBC.SimpleCamera;
    } catch (e) {
        return undefined;
    }
};

export type CameraQuaternionListener = (q: THREE.Quaternion) => void;

export interface BimEngineAPI {
    componentsRef: React.MutableRefObject<OBC.Components | null>;
    worldRef: React.MutableRefObject<OBC.World | null>;
    ifcLoaderRef: React.MutableRefObject<OBC.IfcLoader | null>;
    viewerReady: boolean;
    /** Read current camera quaternion imperatively without triggering React re-renders */
    cameraQuaternionRef: React.MutableRefObject<THREE.Quaternion>;
    /** Subscribe to camera quaternion changes (throttled per frame). Returns unsubscribe fn. */
    subscribeCameraQuaternion: (listener: CameraQuaternionListener) => () => void;
    initError: string | null;
    // Camera actions
    setView: (view: string) => void;
    fitAll: () => void;
    takeScreenshot: () => void;
    zoomToObject: (object: THREE.Object3D) => void;
    zoomToExpressId: (expressId: number) => Promise<void>;
    isolateByExpressId: (expressId: number) => Promise<void>;
    resetIsolation: () => Promise<void>;
    orbit: (deltaAzimuth: number, deltaPolar: number) => void;
    // Orbit point — click to set orbit center
    setOrbitPoint: (point: THREE.Vector3) => void;
    raycastFromMouse: (event: MouseEvent) => THREE.Vector3 | null;
    // Postproduction
    edgeOutlineEnabled: boolean;
    aoEnabled: boolean;
    toggleEdgeOutline: (enabled: boolean) => void;
    toggleAO: (enabled: boolean) => void;
    /** Request a single re-render on the next animation frame (for render-on-demand mode). */
    requestRender: () => void;
}

export function useBimEngine(
    containerRef: React.RefObject<HTMLDivElement | null>,
    isDarkMode: boolean
): BimEngineAPI {
    const componentsRef = useRef<OBC.Components | null>(null);
    const worldRef = useRef<OBC.World | null>(null);
    const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);

    const [viewerReady, setViewerReady] = useState(false);
    const cameraQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
    const cameraQListenersRef = useRef<Set<CameraQuaternionListener>>(new Set());
    const [initError, setInitError] = useState<string | null>(null);
    const [edgeOutlineEnabled, setEdgeOutlineEnabled] = useState(true);
    const [aoEnabled, setAoEnabled] = useState(true);

    const subscribeCameraQuaternion = useCallback((listener: CameraQuaternionListener) => {
        cameraQListenersRef.current.add(listener);
        // Push current value immediately so subscribers can initialize
        listener(cameraQuaternionRef.current);
        return () => {
            cameraQListenersRef.current.delete(listener);
        };
    }, []);

    // Render-on-demand: external callers (selection change, section change,
    // material toggle, etc.) call requestRender() to schedule a frame. The
    // engine's animation loop also requests on camera updates. When idle, no
    // frames are drawn → big battery / GPU win on laptops/tablets.
    const renderDirtyRef = useRef(true);
    const requestRender = useCallback(() => {
        renderDirtyRef.current = true;
    }, []);

    // ── Initialize engine ───────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let disposed = false;

        // Wait for container to have non-zero dimensions (tab might not be visible yet)
        const waitForContainer = (): Promise<HTMLDivElement> => {
            return new Promise((resolve, reject) => {
                const el = containerRef.current;
                if (!el) { reject(new Error('Container ref lost')); return; }
                if (el.clientWidth > 0 && el.clientHeight > 0) { resolve(el); return; }
                // Poll until visible (max 5 seconds)
                let attempts = 0;
                const interval = setInterval(() => {
                    if (disposed) { clearInterval(interval); reject(new Error('Disposed')); return; }
                    attempts++;
                    if (el.clientWidth > 0 && el.clientHeight > 0) {
                        clearInterval(interval);
                        resolve(el);
                    } else if (attempts > 50) {
                        clearInterval(interval);
                        // Force minimum size as fallback
                        resolve(el);
                    }
                }, 100);
            });
        };

        const init = async () => {
            try {
                // ── CRITICAL: Wait for container to be sized before creating renderer ──
                const container = await waitForContainer();
                if (disposed) return;

                const components = new OBC.Components();
                componentsRef.current = components;

                const worlds = components.get(OBC.Worlds);
                const world = worlds.create<
                    OBC.SimpleScene,
                    OBC.SimpleCamera,
                    OBCF.PostproductionRenderer
                >();
                worldRef.current = world;

                // Scene setup
                world.scene = new OBC.SimpleScene(components);
                world.scene.setup();

                // ── Professional lighting ──────────────────
                const scene = world.scene.three as THREE.Scene;

                // Gradient sky background
                scene.background = createSkyGradientTexture(isDarkMode);

                // Hemisphere light for ambient fill — warmer sky, cooler ground
                const hemiLight = new THREE.HemisphereLight(
                    isDarkMode ? 0xa0b4cc : 0xfff8f0,
                    isDarkMode ? 0x152238 : 0xdce4ef,
                    isDarkMode ? 0.9 : 0.65
                );
                scene.add(hemiLight);

                // Key directional light (shadow-casting for ground contact shadows)
                const keyLight = new THREE.DirectionalLight(
                    isDarkMode ? 0xfff5e6 : 0xffffff,
                    isDarkMode ? 1.3 : 1.1
                );
                keyLight.position.set(60, 120, 60);
                keyLight.castShadow = true;
                keyLight.shadow.mapSize.set(2048, 2048);
                keyLight.shadow.camera.near = 0.5;
                keyLight.shadow.camera.far = 500;
                keyLight.shadow.camera.left = -100;
                keyLight.shadow.camera.right = 100;
                keyLight.shadow.camera.top = 100;
                keyLight.shadow.camera.bottom = -100;
                keyLight.shadow.bias = -0.0001;
                keyLight.shadow.radius = 4;
                scene.add(keyLight);

                // Fill light (softer, opposite side)
                const fillLight = new THREE.DirectionalLight(
                    isDarkMode ? 0x7a9cc6 : 0x94a3b8,
                    isDarkMode ? 0.5 : 0.4
                );
                fillLight.position.set(-60, 40, -40);
                scene.add(fillLight);

                // Rim/back light for edge definition (Autodesk-style depth separation)
                const rimLight = new THREE.DirectionalLight(
                    isDarkMode ? 0x3b82f6 : 0x93c5fd,
                    isDarkMode ? 0.3 : 0.2
                );
                rimLight.position.set(-20, 80, -80);
                scene.add(rimLight);

                // ── Ground shadow plane (invisible except for shadow reception) ──
                const groundGeo = new THREE.PlaneGeometry(500, 500);
                const groundMat = new THREE.ShadowMaterial({ opacity: isDarkMode ? 0.25 : 0.15 });
                const groundPlane = new THREE.Mesh(groundGeo, groundMat);
                groundPlane.rotation.x = -Math.PI / 2;
                groundPlane.position.y = -0.05;
                groundPlane.receiveShadow = true;
                groundPlane.name = '__bim_ground_shadow__';
                scene.add(groundPlane);

                // ── Helpers (Axes & Grid) for visual orientation ──
                const axesHelper = new THREE.AxesHelper(10);
                scene.add(axesHelper);

                const gridHelper = new THREE.GridHelper(200, 100, 0x888888, isDarkMode ? 0x333333 : 0xcccccc);
                gridHelper.position.y = -0.01;
                (gridHelper.material as THREE.Material).opacity = isDarkMode ? 0.3 : 0.4;
                (gridHelper.material as THREE.Material).transparent = true;
                scene.add(gridHelper);

                // Renderer setup — Autodesk-grade quality
                world.renderer = new OBCF.PostproductionRenderer(components, container);
                const renderer = (world.renderer as any).three;
                const MAX_PIXEL_RATIO = 2.0;
                if (renderer) {
                    renderer.localClippingEnabled = true;
                    renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    renderer.toneMappingExposure = isDarkMode ? 1.15 : 1.0;
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
                    renderer.sortObjects = true;
                    renderer.shadowMap.enabled = true;
                    renderer.shadowMap.type = THREE.VSMShadowMap;
                }

                // Camera with smooth controls
                world.camera = new OBC.SimpleCamera(components);

                // ── Initialize components AFTER scene+renderer+camera are all set ──
                await components.init();

                // Postproduction — keep the master switch ON so the renderer's internal
                // basePass is initialized (the `enabled` setter dereferences basePass and
                // throws "Base pass not initialized" if flipped before first render). The
                // individual effects (outline / gloss / gamma) are all OFF by default, so
                // the pipeline is effectively a pass-through until the user toggles one.
                const postproduction = (world.renderer as any).postproduction;
                if (postproduction) {
                    postproduction.enabled = true;
                    if (postproduction.customEffects) {
                        // Autodesk-style: subtle edge outline + AO on by default
                        postproduction.customEffects.outlineEnabled = true;
                        postproduction.customEffects.glossEnabled = true;
                        postproduction.customEffects.gammaEnabled = false;
                    }
                }

                const camera = world.camera as OBC.SimpleCamera;
                camera.controls.setLookAt(15, 15, 15, 0, 0, 0);

                // Optimize camera for BIM — narrower FOV for less distortion
                if (camera.three instanceof THREE.PerspectiveCamera) {
                    camera.three.fov = 50;
                    camera.three.updateProjectionMatrix();
                }

                // Smooth camera controls (optimized for BIM navigation)
                camera.controls.smoothTime = 0.18;
                camera.controls.draggingSmoothTime = 0.08;


                // Mouse button mapping (professional BIM style)
                try {
                    const CC = (camera.controls as any).constructor;
                    if (CC?.ACTION) {
                        camera.controls.mouseButtons.middle = CC.ACTION.TRUCK;
                    }
                } catch { /* camera controls mapping not critical */ }

                // Initialize FragmentsManager — load LOCAL worker only.
                // The worker must match the installed @thatopen/fragments version
                // exactly; a mismatched worker parses IFC but never renders geometry.
                // scripts/sync-bim-assets.mjs keeps /workers/fragment-worker.mjs in
                // sync (postinstall/predev/prebuild) so a remote fallback — which
                // could pull a different version — is intentionally NOT used.
                const fragments = components.get(OBC.FragmentsManager);
                const localWorkerResp = await fetch('/workers/fragment-worker.mjs');
                if (!localWorkerResp.ok) {
                    throw new Error(
                        'Không tải được fragment worker (/workers/fragment-worker.mjs). ' +
                        'Chạy "npm run sync:bim-assets" rồi tải lại trang.'
                    );
                }
                const workerBlob = await localWorkerResp.blob();
                const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(workerFile);
                fragments.init(workerUrl);

                (window as any).components = components;
                (window as any).world = world;
                (window as any).fragments = fragments;

                // Camera update for fragments + mark dirty so the loop redraws
                world.camera.controls.addEventListener('update', () => {
                    fragments.core.update();
                    renderDirtyRef.current = true;
                });
                world.camera.controls.addEventListener('rest', () => {
                    // After motion settles, do one extra render to flush any LOD/streaming
                    renderDirtyRef.current = true;
                });

                // Auto-add loaded models to scene + build BVH for raycast acceleration
                fragments.list.onItemSet.add(({ value: model }: any) => {
                    try {
                        if (typeof model.useCamera === 'function') {
                            model.useCamera(world.camera.three);
                        }
                        const targetObj = model.object || model;
                        if (targetObj) {
                            world.scene.three.add(targetObj);
                            targetObj.traverse((child: any) => {
                                if (child.isMesh) child.castShadow = true;
                            });
                        }
                        if (fragments.core && typeof fragments.core.update === 'function') {
                            fragments.core.update(true);
                        }
                        if (targetObj) {
                            scheduleBoundsTreeBuild(targetObj);
                            setTimeout(() => scheduleBoundsTreeBuild(targetObj), 2500);
                        }
                    } catch (e) {
                        console.error('[BimEngine] Error adding model to scene:', e);
                    }
                });

                // Reduce z-fighting on coplanar surfaces. Previously polygonOffsetFactor
                // used Math.random() per material — this gave each material a unique factor
                // (good for separating overlapping floors) but defeats material batching and
                // creates unique GPU pipeline state per material. A small constant gives the
                // same visual result without breaking instancing.
                fragments.core.models.materials.list.onItemSet.add(({ value: material }: any) => {
                    if (!('isLodMaterial' in material && material.isLodMaterial)) {
                        material.polygonOffset = true;
                        material.polygonOffsetUnits = 1;
                        material.polygonOffsetFactor = 0.5;
                    }
                });

                // Setup IFC loader. For project IFCs up to ~500 MB the parser needs
                // significantly more WASM heap than the 2 GB default — we cap at 4 GB
                // (the practical wasm32 ceiling) which gives ~6–8× the raw IFC size to
                // work with after geometry inflation.
                //
                // customLocateFileHandler resolves WASM/worker file paths using the
                // page origin. Without it, Emscripten's `_scriptName` is `undefined`
                // in Vite ESM context → pthread Worker creation fails (SyntaxError:
                // "Unexpected token '<'" because the browser fetches the SPA HTML
                // fallback at /bim/undefined). The handler ensures web-ifc.wasm and
                // web-ifc-mt.wasm are resolved from /wasm/.
                const ifcLoader = components.get(OBC.IfcLoader);

                // ── Pre-initialize web-ifc in FORCED SINGLE-THREAD mode ──
                // In Vite ESM context, `_scriptName = globalThis.document?.currentScript?.src`
                // is `undefined`. When COOP/COEP headers enable `crossOriginIsolated`, web-ifc
                // tries to spawn pthread Workers with `new Worker(undefined)` → the browser
                // fetches the SPA HTML fallback → `SyntaxError: Unexpected token '<'` ×N.
                // The Workers all fail, and web-ifc falls back to single-thread anyway, but
                // this wastes ~200–500ms and spams the console.
                //
                // By calling `Init(locateHandler, forceSingleThread=true)` first, we set
                // `wasmModule` on the IfcAPI instance. When @thatopen's `readIfcFile()` later
                // calls `Init(handler)` again (line 3913 of index.mjs), web-ifc sees
                // `wasmModule` is already set and returns immediately — no duplicate init,
                // no broken Workers, no wasted time.
                const locateWasm = (url: string) => `${window.location.origin}/wasm/${url}`;
                ifcLoader.webIfc.SetWasmPath('/wasm/', true);
                await ifcLoader.webIfc.Init(locateWasm, true); // forceSingleThread = true
                console.log('[BimEngine] web-ifc pre-initialized (single-thread, WASM ready)');

                await ifcLoader.setup({
                    autoSetWasm: false,
                    wasm: { path: '/wasm/', absolute: true },
                    customLocateFileHandler: locateWasm,
                    webIfc: {
                        COORDINATE_TO_ORIGIN: true,
                        // @ts-ignore
                        OPTIMIZE_PROFILES: true,
                        // @ts-ignore
                        USE_FAST_BOOLS: true,
                        // 4 GB WASM heap — required for IFCs in the 200–500 MB range.
                        // (wasm32 hard caps at 4 GB; larger files MUST go through
                        // the server-side converter — see ifc-converter-api.)
                        MEMORY_LIMIT: 4294967295
                    }
                });
                ifcLoaderRef.current = ifcLoader;

                // Setup Raycasters (required before Highlighter - per official docs)
                const raycasters = components.get(OBC.Raycasters);
                raycasters.get(world);

                // Setup Highlighter for selection
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.setup({
                    world,
                    selectMaterialDefinition: {
                        color: new THREE.Color('#29b6f6'),
                        opacity: 0.85,
                        transparent: true,
                        renderedFaces: 0,
                    },
                });

                // Hoverer — subtle highlight on mouse-over (Autodesk-style)
                const hoverer = components.get(OBCF.Hoverer);
                hoverer.enabled = true;

                // Track camera quaternion for ViewCube — pushed via ref + listener subscription
                // (NOT React state) to avoid a top-level re-render on every camera tick.
                // Listeners (e.g. BimViewCube) update DOM imperatively via their own RAF batching.
                let lastQStr = '';
                let animationFrameId: number | null = null;
                world.camera.controls.addEventListener('update', () => {
                    if (disposed) return;
                    if (animationFrameId !== null) return;

                    animationFrameId = requestAnimationFrame(() => {
                        animationFrameId = null;
                        if (disposed || !world.camera?.three) return;
                        const q = world.camera.three.quaternion;
                        const qStr = `${q.x.toFixed(3)},${q.y.toFixed(3)},${q.z.toFixed(3)},${q.w.toFixed(3)}`;
                        if (qStr !== lastQStr) {
                            lastQStr = qStr;
                            cameraQuaternionRef.current.copy(q);
                            cameraQListenersRef.current.forEach((l) => {
                                try { l(cameraQuaternionRef.current); }
                                catch (e) { console.warn('[BimEngine] camera quaternion listener error:', e); }
                            });
                        }
                    });
                });

                if (!disposed) {
                    setViewerReady(true);
                    setInitError(null);

                    // Auto-resize renderer when container size changes (fullscreen, window resize)
                    const container = containerRef.current!;
                    const resizeObserver = new ResizeObserver(() => {
                        if (disposed) return;
                        const w = container.clientWidth;
                        const h = container.clientHeight;
                        if (w === 0 || h === 0) return;

                        const rendererObj = worldRef.current?.renderer as any;
                        const threeRenderer = rendererObj?.three;
                        const threeCamera = getSafeCamera(worldRef.current)?.three;

                        // 1. Resize Three.js renderer
                        if (threeRenderer) {
                            threeRenderer.setSize(w, h);
                        }

                        // 2. Directly resize ALL canvas elements in container
                        const canvases = container.querySelectorAll('canvas');
                        const limitedDpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
                        canvases.forEach((canvas: HTMLCanvasElement) => {
                            canvas.width = w * limitedDpr;
                            canvas.height = h * limitedDpr;
                            canvas.style.width = '100%';
                            canvas.style.height = '100%';
                        });

                        // 3. Update camera aspect
                        if (threeCamera && 'aspect' in threeCamera) {
                            (threeCamera as THREE.PerspectiveCamera).aspect = w / h;
                            (threeCamera as THREE.PerspectiveCamera).updateProjectionMatrix();
                        }

                        // 4. Try OBC renderer resize method
                        if (rendererObj?.resize) {
                            rendererObj.resize();
                        }
                    });
                    resizeObserver.observe(container);
                    resizeObserverRef = resizeObserver;
                }
            } catch (err: any) {
                console.error('Viewer init error:', err);
                if (!disposed) {
                    setInitError(err.message);
                }
            }
        };

        let resizeObserverRef: ResizeObserver | null = null;
        init();

        return () => {
            disposed = true;
            if (resizeObserverRef) resizeObserverRef.disconnect();
            ifcLoaderRef.current = null;
            
            // Explicit memory management: traverse scene and dispose geometry/materials
            try {
                if (worldRef.current && worldRef.current.scene && worldRef.current.scene.three) {
                    const scene = worldRef.current.scene.three;
                    scene.traverse((object: any) => {
                        if (!object.isMesh) return;

                        // Only dispose meshes that belong to fragments (IFC models)
                        if (object.fragment || object.isInstancedMesh) {
                            if (object.geometry) {
                                // Release BVH first (frees typed arrays before GC)
                                if (typeof object.geometry.disposeBoundsTree === 'function') {
                                    try { object.geometry.disposeBoundsTree(); } catch { /* ignore */ }
                                }
                                object.geometry.dispose();
                            }
                            
                            if (object.material) {
                                if (Array.isArray(object.material)) {
                                    object.material.forEach((mat: any) => {
                                        if (mat) mat.dispose();
                                    });
                                } else {
                                    object.material.dispose();
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.error("Error during explicit scene disposal", e);
            }

            if (componentsRef.current) {
                componentsRef.current.dispose();
                componentsRef.current = null;
            }
        };
    }, []);

    // ── Dark mode sync ──────────────────────────────
    useEffect(() => {
        const scene = worldRef.current?.scene?.three as THREE.Scene | undefined;
        if (!scene) return;

        // Update gradient sky
        if (scene.background instanceof THREE.CanvasTexture) {
            scene.background.dispose();
        }
        scene.background = createSkyGradientTexture(isDarkMode);

        // Update lights syncing with dark mode toggles
        scene.traverse((obj) => {
            if (obj instanceof THREE.HemisphereLight) {
                obj.color.set(isDarkMode ? 0xa0b4cc : 0xfff8f0);
                obj.groundColor.set(isDarkMode ? 0x152238 : 0xdce4ef);
                obj.intensity = isDarkMode ? 0.9 : 0.65;
            }
            if (obj instanceof THREE.DirectionalLight) {
                if (obj.position.x > 40) {
                    // Key light
                    obj.color.set(isDarkMode ? 0xfff5e6 : 0xffffff);
                    obj.intensity = isDarkMode ? 1.3 : 1.1;
                } else if (obj.position.z < -50) {
                    // Rim light
                    obj.color.set(isDarkMode ? 0x3b82f6 : 0x93c5fd);
                    obj.intensity = isDarkMode ? 0.3 : 0.2;
                } else {
                    // Fill light
                    obj.color.set(isDarkMode ? 0x7a9cc6 : 0x94a3b8);
                    obj.intensity = isDarkMode ? 0.5 : 0.4;
                }
            }
            // Update ground shadow opacity
            if (obj.name === '__bim_ground_shadow__' && obj instanceof THREE.Mesh) {
                (obj.material as THREE.ShadowMaterial).opacity = isDarkMode ? 0.25 : 0.15;
            }
            // Update grid opacity
            if (obj instanceof THREE.GridHelper) {
                (obj.material as THREE.Material).opacity = isDarkMode ? 0.3 : 0.4;
            }
        });

        // Update renderer tone mapping
        const renderer = (worldRef.current?.renderer as any)?.three;
        if (renderer) {
            renderer.toneMappingExposure = isDarkMode ? 1.15 : 1.0;
        }
    }, [isDarkMode]);

    // ── Camera views ────────────────────────────────
    // Combined bounding box of all loaded models. Fragments v3 streams
    // geometry in tiles, so THREE.Box3().setFromObject(model.object) is
    // EMPTY right after load — the correct source is the native
    // FragmentsModel.box getter (already coordinated near origin).
    const getModelsBox = useCallback((): { box: THREE.Box3; hasModels: boolean } => {
        const fragments = componentsRef.current?.get(OBC.FragmentsManager);
        const box = new THREE.Box3();
        let hasModels = false;
        if (fragments && fragments.list.size > 0) {
            for (const [, model] of fragments.list) {
                const targetObj = (model as any).object || model;
                if (targetObj instanceof THREE.Object3D) {
                    // Ensure world matrices are up-to-date (coordination offset in obj.position)
                    targetObj.updateMatrixWorld(true);

                    const modelBox = new THREE.Box3().setFromObject(targetObj);
                    if (!modelBox.isEmpty()) {
                        // Filter out infinite/degenerate boxes
                        const c = modelBox.getCenter(new THREE.Vector3());
                        const s = modelBox.getSize(new THREE.Vector3());
                        if (isFinite(c.x) && isFinite(c.z) && s.length() < 100000) {
                            box.union(modelBox);
                            hasModels = true;
                        }
                    }

                    if (!hasModels) {
                        const nativeBox = (model as any).box;
                        if (nativeBox instanceof THREE.Box3 && !nativeBox.isEmpty()) {
                            // Apply obj.position offset to native box
                            const offsetBox = nativeBox.clone();
                            offsetBox.translate(targetObj.position);
                            box.union(offsetBox);
                            hasModels = true;
                        }
                    }
                }
            }
        }
        if (!hasModels) {
            const scene = worldRef.current?.scene;
            if (scene) box.setFromObject(scene.three);
        }
        return { box, hasModels };
    }, []);

    const setView = useCallback((view: string) => {
        const camera = getSafeCamera(worldRef.current);
        const scene = worldRef.current?.scene;
        if (!camera || !scene) return;

        const { box } = getModelsBox();

        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        if (!box.isEmpty()) {
            box.getCenter(center);
            box.getSize(size);
        }
        const d = Math.max(size.length() * 0.8, 30);

        switch (view) {
            case 'iso': camera.controls.setLookAt(center.x + d, center.y + d, center.z + d, center.x, center.y, center.z, true); break;
            case 'top': camera.controls.setLookAt(center.x, center.y + d * 1.5, center.z, center.x, center.y, center.z, true); break;
            case 'bottom': camera.controls.setLookAt(center.x, center.y - d * 1.5, center.z, center.x, center.y, center.z, true); break;
            case 'front': camera.controls.setLookAt(center.x, center.y, center.z + d * 1.5, center.x, center.y, center.z, true); break;
            case 'back': camera.controls.setLookAt(center.x, center.y, center.z - d * 1.5, center.x, center.y, center.z, true); break;
            case 'right': camera.controls.setLookAt(center.x + d * 1.5, center.y, center.z, center.x, center.y, center.z, true); break;
            case 'left': camera.controls.setLookAt(center.x - d * 1.5, center.y, center.z, center.x, center.y, center.z, true); break;
        }
    }, [getModelsBox]);

    const fitAll = useCallback(() => {
        const camera = getSafeCamera(worldRef.current);
        if (!camera) return;

        const { box } = getModelsBox();
        if (box.isEmpty()) return;
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        if (!isFinite(sphere.radius) || sphere.radius <= 0) return;

        // Dynamically adjust near/far based on model scale + distance from origin
        const dist = sphere.center.length() + sphere.radius * 3;
        if (camera.three instanceof THREE.PerspectiveCamera) {
            camera.three.near = Math.max(0.01, dist * 0.0001);
            camera.three.far = Math.max(dist * 10, 50000);
            camera.three.updateProjectionMatrix();
        }

        camera.controls.fitToSphere(sphere, true);
    }, [getModelsBox]);

    const zoomToObject = useCallback((object: THREE.Object3D) => {
        const camera = getSafeCamera(worldRef.current);
        if (!camera) return;
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        // Zoom in closer than fitAll
        sphere.radius *= 1.2;
        camera.controls.fitToSphere(sphere, true);
    }, []);

    const takeScreenshot = useCallback(() => {
        const renderer = worldRef.current?.renderer;
        if (!renderer) return;
        try {
            const canvas = (renderer as any).three?.domElement;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `bim-screenshot-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.warn('Screenshot error:', err);
        }
    }, []);

    // ── ViewCube drag → orbit camera ─────────────
    const orbit = useCallback((deltaAzimuthDeg: number, deltaPolarDeg: number) => {
        const camera = getSafeCamera(worldRef.current);
        if (!camera) return;
        const deg2rad = Math.PI / 180;
        camera.controls.rotate(deltaAzimuthDeg * deg2rad, deltaPolarDeg * deg2rad, true);
    }, []);

    // ── Click to set orbit center ──────────────────
    const orbitIndicatorRef = useRef<THREE.Mesh | null>(null);
    const orbitIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setOrbitPoint = useCallback((point: THREE.Vector3) => {
        const camera = getSafeCamera(worldRef.current);
        const scene = worldRef.current?.scene;
        if (!camera || !scene) return;

        // Set the orbit pivot
        camera.controls.setOrbitPoint(point.x, point.y, point.z);

        // ── Visual indicator: small glowing sphere at the orbit point ──
        // Remove previous indicator
        if (orbitIndicatorRef.current) {
            scene.three.remove(orbitIndicatorRef.current);
            orbitIndicatorRef.current.geometry.dispose();
            (orbitIndicatorRef.current.material as THREE.Material).dispose();
            orbitIndicatorRef.current = null;
        }
        if (orbitIndicatorTimerRef.current) {
            clearTimeout(orbitIndicatorTimerRef.current);
        }

        // Create indicator sphere
        const geo = new THREE.SphereGeometry(0.15, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee, // cyan-400
            transparent: true,
            opacity: 0.85,
            depthTest: false,
        });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.copy(point);
        sphere.renderOrder = 9999;
        scene.three.add(sphere);
        orbitIndicatorRef.current = sphere;

        // Fade out and remove after 2 seconds
        const startTime = performance.now();
        const FADE_DURATION = 2000;
        const fadeOut = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / FADE_DURATION, 1);
            if (sphere.parent) {
                mat.opacity = 0.85 * (1 - progress);
                if (progress < 1) {
                    requestAnimationFrame(fadeOut);
                } else {
                    scene.three.remove(sphere);
                    geo.dispose();
                    mat.dispose();
                    if (orbitIndicatorRef.current === sphere) {
                        orbitIndicatorRef.current = null;
                    }
                }
            }
        };
        requestAnimationFrame(fadeOut);

        console.log(`[BimEngine] Orbit point set to (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
    }, []);

    const raycastFromMouse = useCallback((event: MouseEvent): THREE.Vector3 | null => {
        const container = containerRef.current;
        const camera = getSafeCamera(worldRef.current);
        const scene = worldRef.current?.scene;
        if (!container || !camera || !scene) return null;

        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera.three);

        // Raycast against all meshes in the scene (excluding indicator spheres)
        const meshes: THREE.Object3D[] = [];
        scene.three.traverse((obj: any) => {
            if (obj.isMesh && obj !== orbitIndicatorRef.current) {
                meshes.push(obj);
            }
        });

        const intersections = raycaster.intersectObjects(meshes, false);
        if (intersections.length > 0) {
            return intersections[0].point.clone();
        }
        return null;
    }, []);

    const zoomToExpressId = useCallback(async (expressId: number) => {
        try {
            const fragments = componentsRef.current?.get(OBC.FragmentsManager);
            if (!fragments || !getSafeCamera(worldRef.current)) {
                console.warn('[BimEngine] zoomToExpressId: no fragments or camera');
                return;
            }
            const box3 = new THREE.Box3();
            let found = false;

            console.log(`[BimEngine] zoomToExpressId(${expressId}): starting search across ${fragments.list.size} models`);

            // Strategy 0: Try getFragmentMap API (ThatOpen v2 primary method)
            for (const [modelId, model] of fragments.list) {
                try {
                    if (typeof (model as any).getFragmentMap === 'function') {
                        const fragMap = (model as any).getFragmentMap([expressId]);
                        if (fragMap && Object.keys(fragMap).length > 0) {
                            // Found! Now get bounding box via fragment meshes
                            for (const [fragId, ids] of Object.entries(fragMap)) {
                                const modelObj = (model as any).object || model;
                                if (modelObj && typeof modelObj.traverse === 'function') {
                                    modelObj.traverse((child: any) => {
                                        if (found) return;
                                        if (child.isMesh) {
                                            const meshBox = new THREE.Box3().setFromObject(child);
                                            if (!meshBox.isEmpty()) {
                                                // Check if this mesh contains the expressId via items
                                                const items = child.fragment?.items;
                                                if (items instanceof Map && items.has(expressId)) {
                                                    box3.union(meshBox);
                                                    found = true;
                                                }
                                            }
                                        }
                                    });
                                }
                                // If we couldn't find the specific mesh, use model bounding box
                                if (!found) {
                                    const modelObj2 = (model as any).object || model;
                                    if (modelObj2 instanceof THREE.Object3D) {
                                        const modelBox = new THREE.Box3().setFromObject(modelObj2);
                                        if (!modelBox.isEmpty()) {
                                            box3.union(modelBox);
                                            found = true;
                                        }
                                    }
                                }
                            }
                            if (found) {
                                console.log(`[BimEngine] Zoom: found via getFragmentMap in model ${modelId}`);
                                break;
                            }
                        }
                    }
                } catch (e) { console.warn('[BimEngine] getFragmentMap error:', e); }
            }

            // Strategy 1: Try getMergedBox / getBoundingBox API
            if (!found) {
                for (const [modelId, model] of fragments.list) {
                    try {
                        if (typeof (model as any).getMergedBox === 'function') {
                            const box = await (model as any).getMergedBox([expressId]);
                            if (box && !box.isEmpty()) {
                                box3.union(box);
                                found = true;
                                console.log(`[BimEngine] Zoom: found via getMergedBox in model ${modelId}`);
                                break;
                            }
                        }
                    } catch { /* skip */ }
                    try {
                        if (!found && typeof (model as any).getBoundingBox === 'function') {
                            const box = await (model as any).getBoundingBox([expressId]);
                            if (box && !box.isEmpty()) {
                                box3.union(box);
                                found = true;
                                console.log(`[BimEngine] Zoom: found via getBoundingBox in model ${modelId}`);
                                break;
                            }
                        }
                    } catch { /* skip */ }
                }
            }

            // Strategy 2: Scan model children for fragment.items Map (ThatOpen v2 pattern)
            if (!found) {
                for (const [modelId, model] of fragments.list) {
                    const modelObj = (model as any).object || model;
                    if (!modelObj || typeof modelObj.traverse !== 'function') continue;

                    modelObj.traverse((child: any) => {
                        if (found) return;
                        if (!child.isMesh) return;

                        // ThatOpen v2: fragment.items is a Map<number, number[]>
                        const items = child.fragment?.items;
                        if (items instanceof Map && items.has(expressId)) {
                            const meshBox = new THREE.Box3().setFromObject(child);
                            if (!meshBox.isEmpty()) {
                                box3.union(meshBox);
                                found = true;
                                console.log(`[BimEngine] Zoom: found via fragment.items Map in model ${modelId}`);
                            }
                        }

                        // Legacy: itemIDs Set
                        if (!found) {
                            const ids = child.itemIDs || child.fragment?.ids || child.userData?.itemIDs;
                            if (ids instanceof Set && ids.has(expressId)) {
                                const meshBox = new THREE.Box3().setFromObject(child);
                                if (!meshBox.isEmpty()) {
                                    box3.union(meshBox);
                                    found = true;
                                    console.log(`[BimEngine] Zoom: found via itemIDs Set in model ${modelId}`);
                                }
                            }
                        }

                        // InstancedMesh fragment data
                        if (!found && child.isInstancedMesh && child.fragment) {
                            const fragIds = child.fragment.ids;
                            if (fragIds instanceof Set && fragIds.has(expressId)) {
                                const meshBox = new THREE.Box3().setFromObject(child);
                                if (!meshBox.isEmpty()) {
                                    box3.union(meshBox);
                                    found = true;
                                    console.log(`[BimEngine] Zoom: found via InstancedMesh in model ${modelId}`);
                                }
                            }
                        }
                    });
                    if (found) break;
                }
            }

            // Strategy 3: Scan entire scene (final fallback)
            if (!found) {
                if (!worldRef.current) return;
                const scene = worldRef.current.scene.three;
                scene.traverse((obj: any) => {
                    if (found) return;
                    if (!obj.isMesh) return;

                    // Check fragment.items Map first
                    const items = obj.fragment?.items;
                    if (items instanceof Map && items.has(expressId)) {
                        const meshBox = new THREE.Box3().setFromObject(obj);
                        if (!meshBox.isEmpty()) {
                            box3.union(meshBox);
                            found = true;
                            console.log('[BimEngine] Zoom: found via scene traverse fragment.items');
                        }
                    }

                    if (!found) {
                        const itemIDs = obj.itemIDs || obj.fragment?.ids || obj.userData?.itemIDs;
                        if (itemIDs instanceof Set && itemIDs.has(expressId)) {
                            const meshBox = new THREE.Box3().setFromObject(obj);
                            if (!meshBox.isEmpty()) {
                                box3.union(meshBox);
                                found = true;
                                console.log('[BimEngine] Zoom: found via scene traverse itemIDs');
                            }
                        }
                    }
                });
            }

            // Strategy 4: Debug — log what structures exist on first mesh to understand data format
            if (!found) {
                let debugged = false;
                for (const [modelId, model] of fragments.list) {
                    if (debugged) break;
                    const modelObj = (model as any).object || model;
                    if (!modelObj || typeof modelObj.traverse !== 'function') continue;
                    modelObj.traverse((child: any) => {
                        if (debugged) return;
                        if (!child.isMesh) return;
                        debugged = true;
                        const frag = child.fragment;
                        console.log(`[BimEngine] DEBUG mesh in model ${modelId}:`, {
                            hasItemIDs: !!child.itemIDs,
                            itemIDsType: child.itemIDs ? child.itemIDs.constructor.name : 'N/A',
                            hasFragment: !!frag,
                            fragKeys: frag ? Object.keys(frag).slice(0, 15) : [],
                            fragIdsType: frag?.ids ? frag.ids.constructor.name : 'N/A',
                            fragItemsType: frag?.items ? frag.items.constructor.name : 'N/A',
                            fragItemsSample: frag?.items instanceof Map
                                ? Array.from(frag.items.keys()).slice(0, 5)
                                : (frag?.items ? 'non-Map' : 'N/A'),
                            userData: child.userData ? Object.keys(child.userData).slice(0, 10) : [],
                            childType: child.constructor.name,
                        });
                    });
                }
                console.warn(`[BimEngine] zoomToExpressId(${expressId}): element not found in any model after all strategies`);
            }

            if (found && !box3.isEmpty()) {
                const sphere = new THREE.Sphere();
                box3.getBoundingSphere(sphere);
                sphere.radius = Math.max(sphere.radius * 1.2, 0.5);
                if (!worldRef.current) return;
                const camera = worldRef.current.camera as OBC.SimpleCamera;
                camera.controls.fitToSphere(sphere, true);
                console.log(`[BimEngine] Zoom to expressId ${expressId} success, radius: ${sphere.radius.toFixed(2)}`);
            }
        } catch (err) {
            console.warn('[BimEngine] Zoom to expressId error:', err);
        }
    }, [componentsRef, worldRef]);

    // ── Isolate element — Three.js material cloning approach ───
    // Clone materials per-mesh to avoid shared material conflicts,
    // store originals for perfect reset.
    const originalMaterialsMap = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
    const isolationActiveRef = useRef(false);

    const isolateByExpressId = useCallback(async (expressId: number) => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        // Reset previous isolation first
        if (isolationActiveRef.current) {
            await resetIsolation();
        }

        scene.traverse((obj: any) => {
            if (!obj.isMesh || !obj.material) return;

            // Store original material (before cloning)
            if (!originalMaterialsMap.current.has(obj.uuid)) {
                originalMaterialsMap.current.set(obj.uuid, obj.material);
            }

            // Check if this mesh contains the target expressId
            const itemIDs = obj.itemIDs || obj.fragment?.ids;
            const isTargetMesh = itemIDs instanceof Set && itemIDs.has(expressId);

            if (!isTargetMesh) {
                // Non-target mesh: clone material and make transparent
                if (Array.isArray(obj.material)) {
                    obj.material = obj.material.map((mat: THREE.Material) => {
                        const clone = mat.clone();
                        (clone as any).transparent = true;
                        (clone as any).opacity = 0.06;
                        (clone as any).depthWrite = false;
                        clone.needsUpdate = true;
                        return clone;
                    });
                } else {
                    const clone = obj.material.clone();
                    (clone as any).transparent = true;
                    (clone as any).opacity = 0.06;
                    (clone as any).depthWrite = false;
                    clone.needsUpdate = true;
                    obj.material = clone;
                }
            }
            // Target mesh: keep original material (fully opaque)
        });

        isolationActiveRef.current = true;
    }, [worldRef]);

    const resetIsolation = useCallback(async () => {
        if (!isolationActiveRef.current) return;
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        scene.traverse((obj: any) => {
            if (!obj.isMesh) return;
            const savedMat = originalMaterialsMap.current.get(obj.uuid);
            if (savedMat) {
                // Dispose cloned materials to free memory
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m: THREE.Material) => m.dispose());
                } else if (obj.material) {
                    obj.material.dispose();
                }
                // Restore original
                obj.material = savedMat;
            }
        });

        originalMaterialsMap.current.clear();
        isolationActiveRef.current = false;
    }, [worldRef]);

    // ── Postproduction toggles ────────────────────────
    // The master `postproduction.enabled` switch must stay ON once initialized — its
    // setter touches basePass and throws if flipped before the first render. Instead
    // we only toggle the individual effects (outline / gloss / gamma); when all are
    // off the pipeline is a cheap pass-through.
    const toggleEdgeOutline = useCallback((enabled: boolean) => {
        const pp = (worldRef.current?.renderer as any)?.postproduction;
        if (pp?.customEffects) {
            pp.customEffects.outlineEnabled = enabled;
        }
        setEdgeOutlineEnabled(enabled);
    }, []);

    const toggleAO = useCallback((enabled: boolean) => {
        const pp = (worldRef.current?.renderer as any)?.postproduction;
        if (pp?.customEffects) {
            pp.customEffects.glossEnabled = enabled;
        }
        setAoEnabled(enabled);
    }, []);

    return {
        componentsRef,
        worldRef,
        ifcLoaderRef,
        viewerReady,
        cameraQuaternionRef,
        subscribeCameraQuaternion,
        requestRender,
        initError,
        setView,
        fitAll,
        takeScreenshot,
        zoomToObject,
        zoomToExpressId,
        isolateByExpressId,
        resetIsolation,
        orbit,
        setOrbitPoint,
        raycastFromMouse,
        edgeOutlineEnabled,
        aoEnabled,
        toggleEdgeOutline,
        toggleAO,
    };
}
