// SVG rendering of the canonical document (R-016: SVG is a rendering result,
// never truth; R-020: the renderer never holds canonical state). Pure
// Document → string (R-008). Presentation constants are registry data, not
// stringly internals (R-005).
import type { BoundingBox } from "@open-draw/contracts";
import { SHAPE_KINDS } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  shapeListInOrder,
  type Document,
  type Shape,
} from "@open-draw/document";

const RENDER_STYLES = {
  contentFill: "#ffffff",
  contentStroke: "#1f2933",
  pageFill: "none",
  pageStroke: "#8a94a6",
  pageDasharray: "8 6",
  sectionFill: "#f5f7fa",
  sectionStroke: "#8a94a6",
  selectionStroke: "#2563eb",
  selectionDasharray: "4 4",
  handleFill: "#2563eb",
} as const;

export const HANDLE_SIZE_PX = 8;

export function shapeToSvg(shape: Shape, box: BoundingBox): string {
  switch (shape.kind) {
    case SHAPE_KINDS.page:
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.pageFill}" stroke="${RENDER_STYLES.pageStroke}" stroke-dasharray="${RENDER_STYLES.pageDasharray}" />`;
    case SHAPE_KINDS.section:
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.sectionFill}" stroke="${RENDER_STYLES.sectionStroke}" />`;
    case SHAPE_KINDS.rect:
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.contentStroke}" />`;
    case SHAPE_KINDS.ellipse:
      return `<ellipse cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.contentStroke}" />`;
  }
}

// The whole document in pre-order walk order (structural order).
export function documentToSvg(document: Document): string {
  return shapeListInOrder(document)
    .map((shape) => shapeToSvg(shape, absoluteBoundingBox(document, shape)))
    .join("");
}

// Selection outline + corner handles, in world space. Handle size is divided
// by zoom so overlays counter-scale and never detach (R-031).
export function selectionOverlayToSvg(box: BoundingBox, zoom: number): string {
  const outline = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="${RENDER_STYLES.selectionStroke}" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
  const half = HANDLE_SIZE_PX / zoom / 2;
  const corners: ReadonlyArray<readonly [number, number]> = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ];
  const handles = corners
    .map(
      ([x, y]) =>
        `<rect x="${x - half}" y="${y - half}" width="${half * 2}" height="${half * 2}" fill="${RENDER_STYLES.handleFill}" />`,
    )
    .join("");
  return outline + handles;
}

// A transient gesture preview (draw-in-flight or resize-in-flight box).
// Presentation only (R-031); the document is never touched mid-gesture.
export function previewBoxToSvg(box: BoundingBox): string {
  return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.selectionStroke}" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
}
