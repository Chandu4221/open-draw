// Pure image export projection with optional annotations and on-demand legend (Milestone 11A Work Package C).
// Crucial boundary guard (ADR-0005, AGENTS.md section 5): does NOT import semantics or profiles.
import {
  type BoundingBox,
  type BuiltinShapeKind,
  EXPORT_CHIP_PREFIX,
  SHAPE_KIND_LABELS,
} from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  type Document,
  type Shape,
  shapeListInOrder,
} from "@open-draw/document";
import { escapeXml } from "./escape-xml";
import { documentToSvg, type RenderOptions } from "./document-to-svg";

export interface LegendItem {
  readonly label: string;
  readonly tag: string;
}

export interface ExportSvgOptions extends RenderOptions {
  readonly includeAnnotations?: boolean;
  readonly includeLegend?: boolean;
  readonly resolveDisplayName?: (shape: Shape) => string;
  readonly legendItems?: readonly LegendItem[];
  readonly padding?: number;
  readonly background?: string;
}

export function computeSceneBounds(document: Document): BoundingBox {
  const shapes = Object.values(document.shapes);
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const shape of shapes) {
    const box = absoluteBoundingBox(document, shape);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

export function documentToSvgWithLegend(document: Document, options?: ExportSvgOptions): string {
  const padding = options?.padding ?? 20;
  const background = options?.background ?? "#ffffff";
  const sceneBounds = computeSceneBounds(document);
  const includeAnnotations = options?.includeAnnotations ?? true;
  const includeLegend = options?.includeLegend ?? false;

  const shapes = shapeListInOrder(document);

  const innerSvg = documentToSvg(document, {
    ...options,
    includeAnnotations,
  });

  let annotationChipsSvg = "";
  if (includeAnnotations && shapes.length > 0) {
    const placedChips: Array<{ x: number; y: number }> = [];
    const chipHeight = 16;
    let chipsContent = "";

    for (const shape of shapes) {
      const box = absoluteBoundingBox(document, shape);
      const chipId = `${EXPORT_CHIP_PREFIX}${shape.id}`;
      const chipWidth = Math.max(36, chipId.length * 7 + 8);

      const chipX = box.x;
      let chipY = box.y >= 18 ? box.y - 18 : box.y + 2;

      for (const prev of placedChips) {
        if (Math.abs(chipX - prev.x) < 8 && Math.abs(chipY - prev.y) < chipHeight) {
          chipY = prev.y + chipHeight + 2;
        }
      }
      placedChips.push({ x: chipX, y: chipY });

      const safeShapeId = escapeXml(shape.id);
      const safeChipId = escapeXml(chipId);
      chipsContent +=
        `<g data-chip-target="${safeShapeId}">` +
        `<rect x="${chipX.toFixed(1)}" y="${chipY.toFixed(1)}" width="${chipWidth}" height="${chipHeight}" rx="3" fill="#e2e8f0" />` +
        `<text x="${(chipX + chipWidth / 2).toFixed(1)}" y="${(chipY + chipHeight / 2 + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="10" fill="#475569">${safeChipId}</text>` +
        `</g>`;
    }

    annotationChipsSvg = `<g class="annotation-chips">${chipsContent}</g>`;
  }

  let legendSvg = "";
  let finalWidth = sceneBounds.width;
  let finalHeight = sceneBounds.height;
  const viewBoxX = sceneBounds.x - padding;
  const viewBoxY = sceneBounds.y - padding;

  const hasLegacyItems = options?.legendItems !== undefined && options.legendItems.length > 0;
  const showLegend = includeLegend || hasLegacyItems;

  if (showLegend) {
    const rows: Array<{ badgeText: string; labelText: string }> = [];

    if (includeLegend && shapes.length > 0) {
      for (const shape of shapes) {
        const chipId = `${EXPORT_CHIP_PREFIX}${shape.id}`;
        let label = options?.resolveDisplayName?.(shape);
        if (label === undefined) {
          if (shape.label !== undefined && shape.label !== "") {
            label = shape.label;
          } else if (shape.meta.semantic !== undefined) {
            label = shape.meta.semantic.id;
          } else {
            const kindLabel =
              shape.kind in SHAPE_KIND_LABELS
                ? SHAPE_KIND_LABELS[shape.kind as BuiltinShapeKind]
                : shape.kind;
            label = `(untagged ${kindLabel})`;
          }
        }
        rows.push({ badgeText: chipId, labelText: label });
      }
    } else if (hasLegacyItems) {
      for (const item of options!.legendItems!) {
        rows.push({ badgeText: item.tag, labelText: item.label });
      }
    }

    if (rows.length > 0) {
      const legendWidth = Math.max(sceneBounds.width, 320);
      const legendHeight = 36 + rows.length * 24 + 10;
      const legendX = sceneBounds.x;
      const legendY = sceneBounds.y + sceneBounds.height + padding;

      let itemsSvg = "";
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const itemY = legendY + 40 + i * 24;
        const badge = escapeXml(row.badgeText);
        const label = escapeXml(row.labelText);
        const approxBadgeWidth = Math.max(row.badgeText.length * 7 + 12, 48);

        itemsSvg +=
          `<rect x="${legendX + 16}" y="${itemY - 12}" width="${approxBadgeWidth}" height="18" rx="3" fill="#e2e8f0" />` +
          `<text x="${legendX + 16 + approxBadgeWidth / 2}" y="${itemY + 1}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="11" fill="#475569">${badge}</text>` +
          `<text x="${legendX + 16 + approxBadgeWidth + 10}" y="${itemY + 1}" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#1e293b">${label}</text>`;
      }

      legendSvg =
        `<g class="diagram-legend">` +
        `<rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="${legendHeight}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="6" />` +
        `<text x="${legendX + 16}" y="${legendY + 20}" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">Legend</text>` +
        itemsSvg +
        `</g>`;

      finalWidth = Math.max(sceneBounds.width, legendWidth);
      finalHeight = sceneBounds.height + padding + legendHeight;
    }
  }

  const totalWidth = finalWidth + padding * 2;
  const totalHeight = finalHeight + padding * 2;

  const bgRect =
    background !== "none"
      ? `<rect x="${viewBoxX}" y="${viewBoxY}" width="${totalWidth}" height="${totalHeight}" fill="${escapeXml(background)}" />`
      : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${viewBoxX} ${viewBoxY} ${totalWidth} ${totalHeight}" ` +
    `width="${totalWidth}" height="${totalHeight}">` +
    `${bgRect}${innerSvg}${annotationChipsSvg}${legendSvg}</svg>`
  );
}
