// Root responsive device bar overlay and hit-tester (R-023, R-028, R-031, R-040).
// Pure (box, activeDeviceType, zoom) → SVG string.
// Counter-scales with 1 / zoom so buttons remain a constant physical touch target on screen.
import type { BoundingBox, DeviceType, Point } from "@open-draw/contracts";

export const ROOT_DEVICE_ITEMS: readonly ("all" | DeviceType)[] = [
  "all",
  "mobile",
  "tablet",
  "laptop",
  "desktop",
  "largeScreen",
] as const;

export type RootDeviceItem = (typeof ROOT_DEVICE_ITEMS)[number];

export const ROOT_DEVICE_LABELS: Readonly<Record<RootDeviceItem, string>> = {
  all: "All Devices",
  mobile: "Mobile (390px)",
  tablet: "Tablet (768px)",
  laptop: "Laptop (1024px)",
  desktop: "Desktop (1440px)",
  largeScreen: "Large Screen (1920px)",
};

// Material Symbols icon paths (24x24 viewBox)
const DEVICE_ICONS: Readonly<Record<RootDeviceItem, string>> = {
  all: "M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z",
  mobile:
    "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z",
  tablet:
    "M18.5 0h-14C3.12 0 2 1.12 2 2.5v19C2 22.88 3.12 24 4.5 24h14c1.38 0 2.5-1.12 2.5-2.5v-19C21 1.12 19.88 0 18.5 0zm-7 23c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7.5-4H4V3h15v16z",
  laptop:
    "M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z",
  desktop:
    "M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z",
  largeScreen:
    "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z",
};

const BASE_ITEM_WIDTH = 24;
const BASE_ITEM_HEIGHT = 22;
const BASE_PADDING = 2;
const BASE_TOTAL_WIDTH = ROOT_DEVICE_ITEMS.length * BASE_ITEM_WIDTH + BASE_PADDING * 2;
const BASE_TOTAL_HEIGHT = BASE_ITEM_HEIGHT + BASE_PADDING * 2;

export interface RootDeviceBarBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly itemWidth: number;
  readonly scale: number;
}

export function computeRootDeviceBarBounds(box: BoundingBox, zoom: number): RootDeviceBarBounds {
  const safeZoom = Math.max(0.01, zoom);
  const scale = 1 / safeZoom;
  const width = BASE_TOTAL_WIDTH * scale;
  const height = BASE_TOTAL_HEIGHT * scale;
  const itemWidth = BASE_ITEM_WIDTH * scale;
  const x = box.x + box.width - width;
  const y = box.y >= height + 4 * scale ? box.y - (height + 4 * scale) : box.y + 4 * scale;

  return { x, y, width, height, itemWidth, scale };
}

export function rootDeviceBarToSvg(
  box: BoundingBox,
  activeDeviceType: DeviceType | undefined,
  zoom: number,
): string {
  const bounds = computeRootDeviceBarBounds(box, zoom);
  const { x, y, width, height, itemWidth, scale } = bounds;
  const pad = BASE_PADDING * scale;
  const itemHeight = BASE_ITEM_HEIGHT * scale;
  const rx = 4 * scale;

  const bgRect = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="${rx.toFixed(1)}" fill="#ffffff" stroke="#d4d4d8" stroke-width="${(1 * scale).toFixed(1)}" />`;

  const buttons = ROOT_DEVICE_ITEMS.map((item, index) => {
    const isActive =
      (item === "all" && activeDeviceType === undefined) ||
      (item !== "all" && activeDeviceType === item);

    const itemX = x + pad + index * itemWidth;
    const itemY = y + pad;
    const itemRx = 3 * scale;

    const fill = isActive ? "#09090b" : "transparent";
    const iconColor = isActive ? "#ffffff" : "#52525b";
    const label = ROOT_DEVICE_LABELS[item];

    const iconScale = (14 / 24) * scale;
    const iconOffsetX = itemX + (itemWidth - 24 * iconScale) / 2;
    const iconOffsetY = itemY + (itemHeight - 24 * iconScale) / 2;

    const pathD = DEVICE_ICONS[item];

    return (
      `<g class="od-device-btn" data-device="${item}" style="cursor: pointer;">` +
      `<title>${label}</title>` +
      `<rect x="${itemX.toFixed(1)}" y="${itemY.toFixed(1)}" width="${itemWidth.toFixed(1)}" height="${itemHeight.toFixed(1)}" rx="${itemRx.toFixed(1)}" fill="${fill}" />` +
      `<g transform="translate(${iconOffsetX.toFixed(1)} ${iconOffsetY.toFixed(1)}) scale(${iconScale.toFixed(4)})">` +
      `<path d="${pathD}" fill="${iconColor}" />` +
      `</g>` +
      `</g>`
    );
  }).join("");

  return `<g class="od-root-device-bar">${bgRect}${buttons}</g>`;
}

export function pickRootDeviceButton(
  box: BoundingBox,
  worldPoint: Point,
  zoom: number,
): RootDeviceItem | null {
  const bounds = computeRootDeviceBarBounds(box, zoom);
  const { x, y, width, height, itemWidth, scale } = bounds;

  if (
    worldPoint.x < x ||
    worldPoint.x > x + width ||
    worldPoint.y < y ||
    worldPoint.y > y + height
  ) {
    return null;
  }

  const innerX = worldPoint.x - (x + BASE_PADDING * scale);
  if (innerX < 0) return null;

  const index = Math.floor(innerX / itemWidth);
  if (index >= 0 && index < ROOT_DEVICE_ITEMS.length) {
    return ROOT_DEVICE_ITEMS[index]!;
  }

  return null;
}
