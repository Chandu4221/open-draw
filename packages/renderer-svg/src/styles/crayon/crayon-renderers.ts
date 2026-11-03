// Crayon / Hand-drawn Shape Renderers (ADR-0005 D3, R-021).
// Pure (shape, box) → SVG string; deterministic seeded variation (R-008, R-041).
import type { BoundingBox } from "@open-draw/contracts";
import { SHAPE_KINDS } from "@open-draw/contracts";
import type { LineShape, PenPathShape, Shape } from "@open-draw/document";
import { escapeXml } from "../../escape-xml";
import { hashShapeId, wobbleEllipse, wobbleLine, wobbleOffset, wobbleRect } from "./wobble";

const CRAYON_COLORS = {
  stroke: "#2d3748",
  fill: "#ffffff",
  pageStroke: "#718096",
  pageDash: "6 4",
  sectionFill: "#f7fafc",
  sectionStroke: "#718096",
} as const;

export type ShapeSvgRenderer = (shape: Shape, box: BoundingBox) => string;

export const CRAYON_SHAPE_RENDERERS: Readonly<Record<string, ShapeSvgRenderer>> = Object.freeze({
  [SHAPE_KINDS.page]: (shape, box) => {
    const seed = hashShapeId(shape.id);
    const d = wobbleRect(box.x, box.y, box.width, box.height, seed, 1.5);
    return `<path d="${d}" fill="none" stroke="${CRAYON_COLORS.pageStroke}" stroke-width="2" stroke-dasharray="${CRAYON_COLORS.pageDash}" stroke-linecap="round" stroke-linejoin="round" />`;
  },
  [SHAPE_KINDS.section]: (shape, box) => {
    const seed = hashShapeId(shape.id);
    const d = wobbleRect(box.x, box.y, box.width, box.height, seed, 1.8);
    return `<path d="${d}" fill="${CRAYON_COLORS.sectionFill}" stroke="${CRAYON_COLORS.sectionStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  },
  [SHAPE_KINDS.rect]: (shape, box) => {
    const seed = hashShapeId(shape.id);
    const d = wobbleRect(box.x, box.y, box.width, box.height, seed, 2.0);
    const fill = escapeXml(shape.fill ?? CRAYON_COLORS.fill);
    const stroke = escapeXml(shape.stroke ?? CRAYON_COLORS.stroke);
    const strokeWidth = shape.strokeWidth ?? 2;
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
  },
  [SHAPE_KINDS.ellipse]: (shape, box) => {
    const seed = hashShapeId(shape.id);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const rx = box.width / 2;
    const ry = box.height / 2;
    const d = wobbleEllipse(cx, cy, rx, ry, seed, 2.0);
    const fill = escapeXml(shape.fill ?? CRAYON_COLORS.fill);
    const stroke = escapeXml(shape.stroke ?? CRAYON_COLORS.stroke);
    const strokeWidth = shape.strokeWidth ?? 2;
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
  },
  [SHAPE_KINDS.line]: (shape, box) => {
    const seed = hashShapeId(shape.id);
    const line = shape as LineShape;
    const x1 = box.x + line.start.x;
    const y1 = box.y + line.start.y;
    const x2 = box.x + line.end.x;
    const y2 = box.y + line.end.y;
    const d = wobbleLine(x1, y1, x2, y2, seed, 0, 2.0);
    const stroke = escapeXml(shape.stroke ?? CRAYON_COLORS.stroke);
    const strokeWidth = shape.strokeWidth ?? 2.5;
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
  },
  [SHAPE_KINDS.penPath]: (shape, box) => {
    const seed = hashShapeId(shape.id);
    const pen = shape as PenPathShape;
    if (pen.points.length === 0) {
      return "";
    }
    const wobbledPoints = pen.points
      .map((p, idx) => {
        const wx = wobbleOffset(seed, idx * 2, 1.2);
        const wy = wobbleOffset(seed, idx * 2 + 1, 1.2);
        return `${(box.x + p.x + wx).toFixed(1)},${(box.y + p.y + wy).toFixed(1)}`;
      })
      .join(" ");
    const stroke = escapeXml(shape.stroke ?? CRAYON_COLORS.stroke);
    const strokeWidth = shape.strokeWidth ?? 2.5;
    const fill = escapeXml(shape.fill ?? "none");
    return `<polyline points="${wobbledPoints}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
  },
});
