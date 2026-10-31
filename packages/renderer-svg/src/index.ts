// SVG rendering of the canonical document (R-016: SVG is a rendering result,
// never truth; R-020: the renderer never holds canonical state; ADR-0003 D3).
// Pure Document → string (R-008). Presentation constants are registry data, not
// stringly internals (R-005).
import type { BoundingBox, BuiltinShapeKind, Point, ShapeId } from "@open-draw/contracts";
import { SHAPE_KINDS, SHAPE_KIND_LABELS } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  shapeListInOrder,
  type Document,
  type LineShape,
  type PenPathShape,
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
  fallbackFill: "none",
  fallbackStroke: "#94a3b8",
  fallbackDasharray: "4 4",
} as const;

export const HANDLE_SIZE_PX = 8;

export interface RendererFallbackEvent {
  readonly shapeId: ShapeId;
  readonly kind: string;
}

export type ShapeSvgRenderer = (shape: Shape, box: BoundingBox) => string;

export interface RenderOptions {
  readonly onFallback?: (event: RendererFallbackEvent) => void;
  readonly customRenderers?: Readonly<Record<string, ShapeSvgRenderer>>;
}

export function fallbackShapeToSvg(shape: Shape, box: BoundingBox): string {
  const label =
    shape.kind in SHAPE_KIND_LABELS
      ? SHAPE_KIND_LABELS[shape.kind as BuiltinShapeKind]
      : shape.kind;
  const rect = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.fallbackFill}" stroke="${RENDER_STYLES.fallbackStroke}" stroke-dasharray="${RENDER_STYLES.fallbackDasharray}" />`;
  const text = `<text x="${box.x + 8}" y="${box.y + 18}" font-family="sans-serif" font-size="12" fill="${RENDER_STYLES.fallbackStroke}">[${label}]</text>`;
  return rect + text;
}

export const DEFAULT_SHAPE_RENDERERS: Readonly<Record<string, ShapeSvgRenderer>> = Object.freeze({
  [SHAPE_KINDS.page]: (_shape, box) =>
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.pageFill}" stroke="${RENDER_STYLES.pageStroke}" stroke-dasharray="${RENDER_STYLES.pageDasharray}" />`,
  [SHAPE_KINDS.section]: (_shape, box) =>
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.sectionFill}" stroke="${RENDER_STYLES.sectionStroke}" />`,
  [SHAPE_KINDS.rect]: (_shape, box) =>
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.contentStroke}" />`,
  [SHAPE_KINDS.ellipse]: (_shape, box) =>
    `<ellipse cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.contentStroke}" />`,
  [SHAPE_KINDS.line]: (shape, box) => {
    const line = shape as LineShape;
    return `<line x1="${box.x + line.start.x}" y1="${box.y + line.start.y}" x2="${box.x + line.end.x}" y2="${box.y + line.end.y}" stroke="${RENDER_STYLES.contentStroke}" stroke-width="2" />`;
  },
  [SHAPE_KINDS.penPath]: (shape, box) => {
    const pen = shape as PenPathShape;
    const pointsStr = pen.points.map((p) => `${box.x + p.x},${box.y + p.y}`).join(" ");
    return `<polyline points="${pointsStr}" fill="none" stroke="${RENDER_STYLES.contentStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  },
});

export function shapeToSvg(shape: Shape, box: BoundingBox, options?: RenderOptions): string {
  const renderer = options?.customRenderers?.[shape.kind] ?? DEFAULT_SHAPE_RENDERERS[shape.kind];
  if (renderer !== undefined) {
    return renderer(shape, box);
  }
  options?.onFallback?.({ shapeId: shape.id, kind: shape.kind });
  return fallbackShapeToSvg(shape, box);
}

// The whole document in pre-order walk order (structural order).
// Fallback emission surfaces via the pure options callback without singletons (R-008, ADR-0003 D3).
export function documentToSvg(document: Document, options?: RenderOptions): string {
  return shapeListInOrder(document)
    .map((shape) => shapeToSvg(shape, absoluteBoundingBox(document, shape), options))
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

// Transient gesture previews (presentation only, R-031; document never touched mid-gesture).
export function previewBoxToSvg(box: BoundingBox): string {
  return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.selectionStroke}" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
}

export function previewLineToSvg(start: Point, end: Point): string {
  return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${RENDER_STYLES.selectionStroke}" stroke-width="2" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
}

export function previewPenPathToSvg(points: readonly Point[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    const pt = points[0]!;
    return `<circle cx="${pt.x}" cy="${pt.y}" r="2" fill="${RENDER_STYLES.selectionStroke}" />`;
  }
  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  return `<polyline points="${pointsStr}" fill="none" stroke="${RENDER_STYLES.selectionStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
}
