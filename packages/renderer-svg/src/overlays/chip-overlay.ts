// Semantic tag chip overlay (ADR-0005 D5, R-031).
// Pure (label, box, zoom) → SVG string; counter-scales under zoom (R-008, R-031).
// Overlays ride the shape's world coordinates and cannot detach.
import type { BoundingBox } from "@open-draw/contracts";

export interface ChipOverlayOptions {
  readonly backgroundColor?: string;
  readonly textColor?: string;
}

const DEFAULT_CHIP_COLORS = {
  background: "#2563eb",
  text: "#ffffff",
} as const;

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
  const safeZoom = Math.max(0.01, zoom);
  const scale = 1 / safeZoom;

  const height = 16 * scale;
  const paddingX = 6 * scale;
  const fontSize = 10 * scale;
  const charWidth = 6.2 * scale;
  const width = Math.max(20 * scale, label.length * charWidth + paddingX * 2);

  // Position at top-left edge, slightly offset
  const x = box.x;
  const y = box.y >= 18 * scale ? box.y - 18 * scale : box.y + 2 * scale;
  const rx = 3 * scale;

  const bg = options?.backgroundColor ?? DEFAULT_CHIP_COLORS.background;
  const textCol = options?.textColor ?? DEFAULT_CHIP_COLORS.text;

  // Escape special XML characters in label
  const escapedLabel = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const rect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${bg}" />`;
  const text = `<text x="${(x + paddingX).toFixed(1)}" y="${(y + 11.5 * scale).toFixed(1)}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize.toFixed(1)}" font-weight="600" fill="${textCol}">${escapedLabel}</text>`;

  return `<g class="od-chip-overlay" pointer-events="none">${rect}${text}</g>`;
}
