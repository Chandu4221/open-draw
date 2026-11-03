// Pure image export projection with optional legend (F4, ADR-0006 Option A).
// Crucial boundary guard (ADR-0005, AGENTS.md section 5): does NOT import semantics or profiles.
import type { BoundingBox } from "@open-draw/contracts";
import { absoluteBoundingBox, type Document } from "@open-draw/document";
import { escapeXml } from "./escape-xml";
import { documentToSvg, type RenderOptions } from "./document-to-svg";

export interface LegendItem {
  readonly label: string;
  readonly tag: string;
}

export interface ExportSvgOptions extends RenderOptions {
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
  const legendItems = options?.legendItems ?? [];
  const hasLegend = legendItems.length > 0;

  const innerSvg = documentToSvg(document, options);

  let legendSvg = "";
  let finalWidth = sceneBounds.width;
  let finalHeight = sceneBounds.height;
  const viewBoxX = sceneBounds.x - padding;
  const viewBoxY = sceneBounds.y - padding;

  if (hasLegend) {
    const legendWidth = Math.max(sceneBounds.width, 320);
    const legendHeight = 36 + legendItems.length * 24 + 10;
    const legendX = sceneBounds.x;
    const legendY = sceneBounds.y + sceneBounds.height + padding;

    let itemsSvg = "";
    for (let i = 0; i < legendItems.length; i++) {
      const item = legendItems[i]!;
      const itemY = legendY + 40 + i * 24;
      const tagText = escapeXml(item.tag);
      const labelText = escapeXml(item.label);
      const approxBadgeWidth = Math.max(item.tag.length * 7 + 12, 48);

      itemsSvg +=
        `<rect x="${legendX + 16}" y="${itemY - 12}" width="${approxBadgeWidth}" height="18" rx="3" fill="#e2e8f0" />` +
        `<text x="${legendX + 16 + approxBadgeWidth / 2}" y="${itemY + 1}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="11" fill="#475569">${tagText}</text>` +
        `<text x="${legendX + 16 + approxBadgeWidth + 10}" y="${itemY + 1}" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#1e293b">${labelText}</text>`;
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
    `${bgRect}${innerSvg}${legendSvg}</svg>`
  );
}
