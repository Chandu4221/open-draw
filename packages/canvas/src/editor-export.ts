// Pure SVG export derivation for standalone editor (R-008, R-016, M2).
// Produces standalone valid SVG without editor chrome, handles, or overlays.
import type { DeviceType, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, type Document } from "@open-draw/document";
import { documentToSvg, type ShapeSvgRenderer } from "@open-draw/renderer-svg";

export interface SvgExportOptions {
  readonly activeDeviceType?: DeviceType | undefined;
  readonly activeDeviceTypes?: Readonly<Record<ShapeId, DeviceType | undefined>> | undefined;
  readonly customRenderers?: Readonly<Record<string, ShapeSvgRenderer>> | undefined;
  readonly padding?: number | undefined;
}

export function exportDocumentToSvg(doc: Document, options?: SvgExportOptions): string {
  const shapes = Object.values(doc.shapes);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of shapes) {
    const box = absoluteBoundingBox(doc, s);
    const strokePad =
      typeof s.strokeWidth === "number" && Number.isFinite(s.strokeWidth) && s.strokeWidth > 0
        ? s.strokeWidth / 2
        : 0;
    minX = Math.min(minX, box.x - strokePad);
    minY = Math.min(minY, box.y - strokePad);
    maxX = Math.max(maxX, box.x + box.width + strokePad);
    maxY = Math.max(maxY, box.y + box.height + strokePad);
  }

  const padding = options?.padding ?? 20;
  let x = 0;
  let y = 0;
  let width = 800;
  let height = 600;

  if (
    shapes.length > 0 &&
    Number.isFinite(minX) &&
    Number.isFinite(minY) &&
    Number.isFinite(maxX) &&
    Number.isFinite(maxY)
  ) {
    const MAX_EXPORT_BOUND = 100_000;
    x = Math.max(-MAX_EXPORT_BOUND, Math.min(MAX_EXPORT_BOUND, Math.floor(minX - padding)));
    y = Math.max(-MAX_EXPORT_BOUND, Math.min(MAX_EXPORT_BOUND, Math.floor(minY - padding)));
    width = Math.max(1, Math.min(MAX_EXPORT_BOUND, Math.ceil(maxX - minX + padding * 2)));
    height = Math.max(1, Math.min(MAX_EXPORT_BOUND, Math.ceil(maxY - minY + padding * 2)));
  }

  const content = documentToSvg(doc, {
    activeDeviceType: options?.activeDeviceType,
    activeDeviceTypes: options?.activeDeviceTypes,
    customRenderers: options?.customRenderers,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}">${content}</svg>`;
}
