import { isRootId, type Point, type ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, ancestorsOf, type Document } from "@open-draw/document";
import { chipOverlayToSvg, pickChip } from "@open-draw/renderer-svg";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";

export interface SemanticChipOverlayOptions {
  readonly doc: Document;
  readonly selectedIds: readonly ShapeId[];
  readonly zoom: number;
  readonly visibleChipRootIds?: ReadonlySet<ShapeId> | undefined;
}

export function computeSemanticChipOverlays(options: SemanticChipOverlayOptions): string[] {
  const { doc, selectedIds, zoom, visibleChipRootIds } = options;
  const overlays: string[] = [];

  for (const shape of Object.values(doc.shapes)) {
    let chipLabel: string | undefined;
    let isInteractive = false;
    let isActive = false;

    if (isRootId(shape.parentId)) {
      const platform = shape.meta.platform;
      chipLabel =
        platform !== undefined ? (PLATFORM_PROFILES[platform]?.label ?? platform) : "Container";
      isInteractive = true;
      isActive = visibleChipRootIds?.has(shape.id) ?? false;
    } else if (shape.meta.semantic !== undefined) {
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
      const platform = shape.meta.platform;
      const chipLabel =
        platform !== undefined ? (PLATFORM_PROFILES[platform]?.label ?? platform) : "Container";
      const box = absoluteBoundingBox(doc, shape);
      if (pickChip(chipLabel, box, world, zoom)) {
        return shape.id;
      }
    }
  }
  return null;
}
