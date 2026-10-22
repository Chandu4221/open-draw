import type { Bounds, Camera } from '@open-draw/schema';
import { boundsOf, boundsUnion } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';

export interface ExportPngOptions {
  readonly chips?: boolean;
  readonly camera?: 'view' | 'content' | Partial<Camera>;
  readonly scale?: number;
}

/**
 * Serializes the editor canvas to a PNG Blob.
 *
 * Implements Phase 2.s §2 specification:
 * - Chips on/off: hides overlay layer before serialization and restores after (no store mutation).
 * - Camera modes: 'view' (current viewport), 'content' (auto-fit content bounds), or Partial<Camera>.
 * - Render path remains 100% SVG/DOM; 2D canvas is used strictly for rasterization.
 */
export async function exportPNG(editor: CanvasEditor, options: ExportPngOptions = {}): Promise<Blob> {
  const container = editor.getContainer();
  if (!container) {
    throw new Error('Cannot export PNG: CanvasEditor is not mounted to a container.');
  }

  const rootSvg = container.querySelector('svg.od-canvas-root') as SVGSVGElement | null;
  if (!rootSvg) {
    throw new Error('Cannot export PNG: root SVG element (.od-canvas-root) not found.');
  }

  const chips = options.chips ?? true;
  const cameraOption = options.camera ?? 'view';
  const scale = Math.max(0.1, options.scale ?? 1);

  // 1. Determine dimensions and viewport transform
  let exportWidth = container.clientWidth || 800;
  let exportHeight = container.clientHeight || 600;
  let viewportTransform: string;

  if (cameraOption === 'content') {
    const shapes = editor.store.listShapes();
    if (shapes.length === 0) {
      exportWidth = 800;
      exportHeight = 600;
      viewportTransform = 'translate(0, 0) scale(1)';
    } else {
      let contentBounds: Bounds | null = null;
      for (const s of shapes) {
        const def = editor.registry.get(s.type);
        const b = def ? def.geometry.bounds(s) : boundsOf(s.x, s.y, 100, 100);
        const worldBounds = boundsOf(s.x, s.y, b.width, b.height);
        contentBounds = contentBounds ? boundsUnion(contentBounds, worldBounds) : worldBounds;
      }
      const padding = 24;
      const b = contentBounds ?? boundsOf(0, 0, 800, 600);
      exportWidth = Math.max(1, Math.ceil(b.width + padding * 2));
      exportHeight = Math.max(1, Math.ceil(b.height + padding * 2));
      viewportTransform = `translate(${-b.x + padding}, ${-b.y + padding}) scale(1)`;
    }
  } else if (typeof cameraOption === 'object') {
    const cam: Camera = {
      x: cameraOption.x ?? editor.camera.x,
      y: cameraOption.y ?? editor.camera.y,
      zoom: cameraOption.zoom ?? editor.camera.zoom,
    };
    viewportTransform = `translate(${cam.x}, ${cam.y}) scale(${cam.zoom})`;
  } else {
    // 'view' or default
    const cam = editor.camera;
    viewportTransform = `translate(${cam.x}, ${cam.y}) scale(${cam.zoom})`;
  }

  // 2. Chips on/off: non-destructive overlay toggle with guaranteed restoration
  const overlayElements: Array<{ el: SVGElement; prevDisplay: string }> = [];
  if (!chips) {
    const slots = rootSvg.querySelectorAll<SVGElement>('.od-overlay-slot, .od-selection-layer, .od-handles-overlay');
    for (const el of slots) {
      overlayElements.push({ el, prevDisplay: el.style.display });
      el.style.display = 'none';
    }
  }

  let svgString: string;
  try {
    // Clone root SVG to configure export attributes without disturbing the live DOM
    const clone = rootSvg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(exportWidth));
    clone.setAttribute('height', String(exportHeight));
    clone.setAttribute('viewBox', `0 0 ${exportWidth} ${exportHeight}`);

    const cloneViewport = clone.querySelector('.od-viewport');
    if (cloneViewport) {
      cloneViewport.setAttribute('transform', viewportTransform);
    }

    // Ensure standard XML namespace
    if (!clone.getAttribute('xmlns')) {
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    svgString = new XMLSerializer().serializeToString(clone);
  } finally {
    // Restore overlays immediately
    for (const { el, prevDisplay } of overlayElements) {
      if (prevDisplay) {
        el.style.display = prevDisplay;
      } else {
        el.style.removeProperty('display');
      }
    }
  }

  // 3. Convert SVG to Image via Data URL
  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG data URL during PNG serialization.'));
    img.src = svgDataUrl;
  });

  // 4. Rasterize onto 2D canvas context and export PNG Blob
  const targetWidth = Math.max(1, Math.round(exportWidth * scale));
  const targetHeight = Math.max(1, Math.round(exportHeight * scale));

  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(targetWidth, targetHeight)
    : Object.assign(document.createElement('canvas'), { width: targetWidth, height: targetHeight });

  // EXEMPTION: serialization-only path for exportPNG per Phase 2.s §2
  const ctx = (canvas as HTMLCanvasElement).getContext('2d'); // EXEMPTION: serialization-only path for exportPNG per Phase 2.s §2
  if (!ctx) {
    throw new Error('Failed to create 2D rendering context for PNG export.');
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if ('convertToBlob' in canvas) {
    return await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
  }

  return await new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed to produce PNG blob.'));
    }, 'image/png');
  });
}
