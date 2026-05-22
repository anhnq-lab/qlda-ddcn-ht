/**
 * captureViewport — Snapshot the WebGL canvas to a PNG data URL.
 * Strategy: call renderer.render() once to make sure the frame is current,
 * then read canvas.toDataURL. We DON'T set preserveDrawingBuffer (kills
 * perf) — instead we render synchronously right before the read.
 */
import type * as OBC from '@thatopen/components';

export async function captureViewport(world: OBC.World | null): Promise<string | null> {
    if (!world) return null;
    const renderer: any = world.renderer;
    const three = renderer?.three;
    const scene = world.scene?.three;
    const camera = world.camera?.three;
    if (!three || !scene || !camera) return null;
    try {
        // Force a render in the same tick so the canvas buffer is fresh
        three.render(scene, camera);
        const canvas: HTMLCanvasElement = three.domElement;
        return canvas.toDataURL('image/png');
    } catch (err) {
        console.warn('[captureViewport] failed:', err);
        return null;
    }
}

/** Download a dataURL as a file. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
}
