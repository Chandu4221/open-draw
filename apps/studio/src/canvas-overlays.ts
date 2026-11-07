import { isRootId, type DeviceType, type Point, type ShapeId } from "@open-draw/contracts";
import { GESTURE_KINDS, normalizeBox, resizeBox, TOOLS, type ToolId } from "@open-draw/canvas";
import { absoluteBoundingBox, ancestorsOf, type Document } from "@open-draw/document";
import {
  chipOverlayToSvg,
  pickChip,
  pickRootDeviceButton,
  previewBoxToSvg,
  previewLineToSvg,
  previewPenPathToSvg,
  rootDeviceBarToSvg,
  type RootDeviceItem,
  selectionOverlayToSvg,
} from "@open-draw/renderer-svg";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import type { Gesture } from "./types";

export interface OverlayOptions {
  readonly doc: Document;
  readonly selectedId: ShapeId | null;
  readonly selectedIds?: readonly ShapeId[];
  readonly gesture: Gesture | null;
  readonly tool: ToolId;
  readonly lastWorld: Point;
  readonly zoom: number;
  readonly visibleChipRootIds?: ReadonlySet<ShapeId> | undefined;
  readonly activeDeviceType?: DeviceType | undefined;
  readonly activeDeviceTypes?: Readonly<Record<ShapeId, DeviceType | undefined>> | undefined;
}

export function computeCanvasOverlays(options: OverlayOptions): string[] {
  const { doc, selectedId, selectedIds, gesture, tool, lastWorld, zoom, visibleChipRootIds } =
    options;
  const overlays: string[] = [];

  const activeSelectedIds = selectedIds ?? (selectedId !== null ? [selectedId] : []);

  if (activeSelectedIds.length === 1) {
    const singleId = activeSelectedIds[0]!;
    const shape = doc.shapes[singleId];
    if (shape !== undefined) {
      let box = absoluteBoundingBox(doc, shape);
      const isSelectedMoved =
        gesture !== null &&
        gesture.kind === GESTURE_KINDS.move &&
        (gesture.shapeIds.includes(singleId) ||
          ancestorsOf(doc, shape).some((a) => gesture.shapeIds.includes(a.id)));
      if (isSelectedMoved) {
        box = {
          ...box,
          x: box.x + (lastWorld.x - gesture.startWorld.x),
          y: box.y + (lastWorld.y - gesture.startWorld.y),
        };
      }
      if (
        gesture !== null &&
        gesture.kind === GESTURE_KINDS.resize &&
        gesture.originalBox !== null &&
        gesture.handleId !== null
      ) {
        box = resizeBox(gesture.originalBox, gesture.handleId, lastWorld);
      }
      overlays.push(selectionOverlayToSvg(box, zoom));
    }
  } else if (activeSelectedIds.length > 1) {
    for (const id of activeSelectedIds) {
      const shape = doc.shapes[id];
      if (shape !== undefined) {
        let box = absoluteBoundingBox(doc, shape);
        const isSelectedMoved =
          gesture !== null &&
          gesture.kind === GESTURE_KINDS.move &&
          (gesture.shapeIds.includes(id) ||
            ancestorsOf(doc, shape).some((a) => gesture.shapeIds.includes(a.id)));
        if (isSelectedMoved) {
          box = {
            ...box,
            x: box.x + (lastWorld.x - gesture.startWorld.x),
            y: box.y + (lastWorld.y - gesture.startWorld.y),
          };
        }
        overlays.push(
          `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="var(--od-accent, #000000)" stroke-dasharray="4 4" />`,
        );
      }
    }
  }

  if (gesture !== null && gesture.kind === GESTURE_KINDS.select) {
    const box = normalizeBox(gesture.startWorld, lastWorld);
    overlays.push(
      `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="var(--od-accent-soft, rgba(0, 0, 0, 0.08))" stroke="var(--od-accent, #000000)" stroke-dasharray="4 4" />`,
    );
  }

  if (gesture !== null && gesture.kind === GESTURE_KINDS.draw) {
    if (tool === TOOLS.drawLine) {
      overlays.push(previewLineToSvg(gesture.startWorld, lastWorld));
    } else if (tool === TOOLS.drawPenPath) {
      overlays.push(previewPenPathToSvg(gesture.points));
    } else {
      overlays.push(previewBoxToSvg(normalizeBox(gesture.startWorld, lastWorld)));
    }
  }

  // Render root and child semantic chips (R-023, R-026, R-031)
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
      const isSelected = activeSelectedIds.includes(shape.id);

      if (isRootChipsVisible || isSelected) {
        const rootPlatform = resolveRootPlatform(doc, shape.id);
        const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
        chipLabel = resolveShapeDisplayName(shape, profile);
      }
    }

    if (chipLabel !== undefined) {
      let box = absoluteBoundingBox(doc, shape);
      const isShapeMoved =
        gesture !== null &&
        gesture.kind === GESTURE_KINDS.move &&
        (gesture.shapeIds.includes(shape.id) ||
          ancestorsOf(doc, shape).some((a) => gesture.shapeIds.includes(a.id)));
      if (isShapeMoved) {
        box = {
          ...box,
          x: box.x + (lastWorld.x - gesture.startWorld.x),
          y: box.y + (lastWorld.y - gesture.startWorld.y),
        };
      }
      overlays.push(
        chipOverlayToSvg(chipLabel, box, zoom, {
          interactive: isInteractive,
          active: isActive,
        }),
      );
    }
  }

  // Render responsive device bar at top-right of web root containers (R-023, R-028, R-031)
  for (const shape of Object.values(doc.shapes)) {
    if (isRootId(shape.parentId) && shape.meta.platform === "web") {
      let box = absoluteBoundingBox(doc, shape);
      const isShapeMoved =
        gesture !== null &&
        gesture.kind === GESTURE_KINDS.move &&
        (gesture.shapeIds.includes(shape.id) ||
          ancestorsOf(doc, shape).some((a) => gesture.shapeIds.includes(a.id)));
      if (isShapeMoved) {
        box = {
          ...box,
          x: box.x + (lastWorld.x - gesture.startWorld.x),
          y: box.y + (lastWorld.y - gesture.startWorld.y),
        };
      }
      const effectiveDevice = options.activeDeviceTypes?.[shape.id] ?? options.activeDeviceType;
      overlays.push(rootDeviceBarToSvg(box, effectiveDevice, zoom));
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

export interface RootDeviceHit {
  readonly rootId: ShapeId;
  readonly item: RootDeviceItem;
}

export function pickAnyRootDeviceButton(
  doc: Document,
  world: Point,
  zoom: number,
): RootDeviceHit | null {
  for (const shape of Object.values(doc.shapes)) {
    if (isRootId(shape.parentId) && shape.meta.platform === "web") {
      const box = absoluteBoundingBox(doc, shape);
      const hit = pickRootDeviceButton(box, world, zoom);
      if (hit !== null) return { rootId: shape.id, item: hit };
    }
  }
  return null;
}
