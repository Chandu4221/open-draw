import { isRootId, type BoundingBox, type Point, type ShapeId } from "@open-draw/canvas";
import { absoluteBoundingBox, ancestorsOf, type Document, type Shape } from "@open-draw/canvas";
import { chipOverlayToSvg, pickChip } from "./chip-overlay";
import { PLATFORM_PROFILES, type PlatformId } from "@open-draw/profiles";
import {
  PLUGIN_ROOT_PLATFORM,
  getShapeSemantic,
  resolveRootPlatform,
  resolveShapeDisplayName,
} from "@open-draw/semantics";

export interface SemanticChipOverlayOptions {
  readonly doc: Document;
  readonly selectedIds: readonly ShapeId[];
  readonly zoom: number;
  readonly visibleChipRootIds?: ReadonlySet<ShapeId> | undefined;
  readonly hoveredShapeId?: ShapeId | null | undefined;
}

export function hoverOutlineOverlayToSvg(box: BoundingBox, zoom: number): string {
  const safeZoom = Math.max(0.01, zoom);
  const scale = 1 / safeZoom;
  const strokeWidth = (1.5 * scale).toFixed(1);
  const dash1 = (4 * scale).toFixed(1);
  const dash2 = (2 * scale).toFixed(1);
  const rx = (4 * scale).toFixed(1);

  return `<rect class="od-canvas-hover-outline" x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.width.toFixed(1)}" height="${box.height.toFixed(1)}" fill="none" stroke="#0ea5e9" stroke-width="${strokeWidth}" stroke-dasharray="${dash1} ${dash2}" rx="${rx}" pointer-events="none" />`;
}

function getRootChipLabel(shape: Shape): string {
  const platform =
    (shape.meta.pluginData?.[PLUGIN_ROOT_PLATFORM] as PlatformId | undefined) ??
    (shape.meta.platform as PlatformId | undefined);
  const platformLabel =
    platform !== undefined ? (PLATFORM_PROFILES[platform]?.label ?? platform) : undefined;
  return platformLabel ?? "Container";
}

export function getRootContainerIds(doc: Document): readonly ShapeId[] {
  return Object.values(doc.shapes)
    .filter((shape) => isRootId(shape.parentId))
    .map((shape) => shape.id);
}

export function computeSemanticChipOverlays(options: SemanticChipOverlayOptions): string[] {
  const { doc, selectedIds, zoom, visibleChipRootIds, hoveredShapeId } = options;
  const overlays: string[] = [];

  // Hover outline (Figma-style pre-selection focus, R-018, R-031)
  if (hoveredShapeId && !selectedIds.includes(hoveredShapeId)) {
    const hoveredShape = doc.shapes[hoveredShapeId];
    if (hoveredShape !== undefined) {
      const box = absoluteBoundingBox(doc, hoveredShape);
      overlays.push(hoverOutlineOverlayToSvg(box, zoom));
    }
  }

  for (const shape of Object.values(doc.shapes)) {
    let chipLabel: string | undefined;
    let isInteractive = false;
    let isActive = false;

    if (isRootId(shape.parentId)) {
      chipLabel = getRootChipLabel(shape);
      isInteractive = true;
      isActive = visibleChipRootIds?.has(shape.id) ?? false;
    } else if (getShapeSemantic(shape) !== undefined) {
      const root = ancestorsOf(doc, shape).find((a) => isRootId(a.parentId));
      const isRootChipsVisible = root !== undefined && (visibleChipRootIds?.has(root.id) ?? false);
      const isSelected = selectedIds.includes(shape.id);

      if (isRootChipsVisible || isSelected) {
        const rootPlatform = resolveRootPlatform(doc, shape.id);
        const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
        chipLabel = resolveShapeDisplayName(shape, profile);
      }
    }

    if (chipLabel !== undefined) {
      const box = absoluteBoundingBox(doc, shape);
      overlays.push(
        chipOverlayToSvg(chipLabel, box, zoom, {
          interactive: isInteractive,
          active: isActive,
        }),
      );
    }
  }

  return overlays;
}

export function pickAnyRootChip(doc: Document, world: Point, zoom: number): ShapeId | null {
  for (const shape of Object.values(doc.shapes)) {
    if (isRootId(shape.parentId)) {
      const chipLabel = getRootChipLabel(shape);
      const box = absoluteBoundingBox(doc, shape);
      if (pickChip(chipLabel, box, world, zoom)) {
        return shape.id;
      }
    }
  }
  return null;
}
