// Semantic tag chip overlay (ADR-0005 D5, R-031).
// Pure (label, box, zoom) → SVG string; counter-scales under zoom (R-008, R-031).
// Overlays ride the shape's world coordinates and cannot detach.
import type { BoundingBox, Point } from "@open-draw/canvas";

export interface ChipOverlayOptions {
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly interactive?: boolean;
  readonly active?: boolean;
}

export interface ChipBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}

const DEFAULT_CHIP_COLORS = {
  background: "#2563eb",
  text: "#ffffff",
} as const;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function computeChipBounds(label: string, box: BoundingBox, zoom: number): ChipBounds {
  const safeZoom = Math.max(0.01, zoom);
  const scale = 1 / safeZoom;

  const height = 16 * scale;
  const paddingX = 6 * scale;
  const charWidth = 6.2 * scale;
  const width = Math.max(20 * scale, label.length * charWidth + paddingX * 2);

  const x = box.x;
  const y = box.y >= 18 * scale ? box.y - 18 * scale : box.y + 2 * scale;

  return { x, y, width, height, scale };
}

export function pickChip(label: string, box: BoundingBox, point: Point, zoom: number): boolean {
  const { x, y, width, height } = computeChipBounds(label, box, zoom);
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
}

/**
 * Pure generator for a presentation-only tag chip overlay (R-031).
 * Counter-scales with 1 / zoom so visual size on screen remains constant.
 */
export function chipOverlayToSvg(
  label: string,
  box: BoundingBox,
  zoom: number,
  options?: ChipOverlayOptions,
): string {
  const { x, y, width, height, scale } = computeChipBounds(label, box, zoom);
  const paddingX = 6 * scale;
  const fontSize = 10 * scale;
  const rx = 3 * scale;

  let bg: string;
  let textCol: string;
  let stroke = "";

  if (options?.interactive) {
    if (options?.active) {
      bg = "#09090b";
      textCol = "#ffffff";
      stroke = ` stroke="#27272a" stroke-width="${(1 * scale).toFixed(1)}"`;
    } else {
      bg = "#ffffff";
      textCol = "#71717a";
      stroke = ` stroke="#d4d4d8" stroke-width="${(1 * scale).toFixed(1)}"`;
    }
  } else {
    bg = escapeXml(options?.backgroundColor ?? DEFAULT_CHIP_COLORS.background);
    textCol = escapeXml(options?.textColor ?? DEFAULT_CHIP_COLORS.text);
  }

  const escapedLabel = escapeXml(label);

  const pointerAttr = options?.interactive
    ? 'style="cursor: pointer;" data-interactive="true"'
    : 'pointer-events="none"';

  const rect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${bg}"${stroke} />`;
  const text = `<text x="${(x + paddingX).toFixed(1)}" y="${(y + 11.5 * scale).toFixed(1)}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize.toFixed(1)}" font-weight="600" fill="${textCol}">${escapedLabel}</text>`;

  return `<g class="od-chip-overlay" ${pointerAttr}>${rect}${text}</g>`;
}
