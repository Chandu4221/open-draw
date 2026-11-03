// SVG rendering of the canonical document (R-016: SVG is a rendering result,
// never truth; R-020: the renderer never holds canonical state; ADR-0003 D3).
// Pure Document → string (R-008). Presentation constants are registry data, not
// stringly internals (R-005).
import type { BoundingBox, Point } from "@open-draw/contracts";
import { RENDER_STYLES } from "./document-to-svg";

export * from "./document-to-svg";
export * from "./styles/crayon";
export type { ShapeSvgRenderer } from "./document-to-svg";
export * from "./overlays";
export * from "./escape-xml";

export const HANDLE_SIZE_PX = 8;

// Selection outline + 8 handles (4 corners + 4 edge midpoints), in world space.
// Handle size is divided by zoom so overlays counter-scale and never detach (R-031, ADR-0006 Option A).
export function selectionOverlayToSvg(box: BoundingBox, zoom: number): string {
  const outline = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="${RENDER_STYLES.selectionStroke}" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
  const half = HANDLE_SIZE_PX / zoom / 2;
  const midX = box.x + box.width / 2;
  const midY = box.y + box.height / 2;
  const right = box.x + box.width;
  const bottom = box.y + box.height;

  const positions: ReadonlyArray<readonly [number, number]> = [
    [box.x, box.y],
    [midX, box.y],
    [right, box.y],
    [right, midY],
    [right, bottom],
    [midX, bottom],
    [box.x, bottom],
    [box.x, midY],
  ];
  const handles = positions
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

export {
  computeSceneBounds,
  documentToSvgWithLegend,
  type ExportSvgOptions,
  type LegendItem,
} from "./export-image";
