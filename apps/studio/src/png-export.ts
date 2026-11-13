import type { ShapeId } from "@open-draw/canvas";
import type { Document } from "@open-draw/canvas";
import { generateExportSvg } from "./document-io";

/**
 * Renders document SVG to an offscreen canvas and returns PNG byte array.
 * Returns null in headless or unsupported environments.
 */
export async function getPngBytes(doc: Document, rootId?: ShapeId): Promise<Uint8Array | null> {
  if (typeof window === "undefined" || typeof Image === "undefined") {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const svg = generateExportSvg(doc, { rootId, includeAnnotations: true });
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = window.devicePixelRatio || 1;
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          canvas.toBlob(async (pngBlob) => {
            if (!pngBlob) {
              resolve(null);
              return;
            }
            const buffer = await pngBlob.arrayBuffer();
            resolve(new Uint8Array(buffer));
          }, "image/png");
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}
