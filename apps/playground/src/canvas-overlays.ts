import { isRootId, type Point, type ShapeId } from "@open-draw/contracts";
import { GESTURE_KINDS, normalizeBox, resizeBox, TOOLS, type ToolId } from "@open-draw/canvas";
import { absoluteBoundingBox, ancestorsOf, type Document } from "@open-draw/document";
import {
  chipOverlayToSvg,
  previewBoxToSvg,
  previewLineToSvg,
  previewPenPathToSvg,
  selectionOverlayToSvg,
} from "@open-draw/renderer-svg";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import type { Gesture } from "./types";

export interface OverlayOptions {
  readonly doc: Document;
  readonly selectedId: ShapeId | null;
  readonly gesture: Gesture | null;
  readonly tool: ToolId;
  readonly lastWorld: Point;
  readonly zoom: number;
  readonly showTagChips: boolean;
}

export function computeCanvasOverlays(options: OverlayOptions): string[] {
  const { doc, selectedId, gesture, tool, lastWorld, zoom, showTagChips } = options;
  const overlays: string[] = [];

  if (selectedId !== null) {
    const shape = doc.shapes[selectedId];
    if (shape !== undefined) {
      let box = absoluteBoundingBox(doc, shape);
      const isSelectedMoved =
        gesture !== null &&
        gesture.kind === GESTURE_KINDS.move &&
        (gesture.shapeIds.includes(selectedId) ||
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

  if (showTagChips) {
    for (const shape of Object.values(doc.shapes)) {
      let chipLabel: string | undefined;
      if (isRootId(shape.parent)) {
        const platform = shape.meta.platform;
        if (platform !== undefined) {
          chipLabel = PLATFORM_PROFILES[platform]?.label ?? platform;
        }
      } else if (shape.meta.semantic !== undefined) {
        const rootPlatform = resolveRootPlatform(doc, shape.id);
        const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
        chipLabel = resolveShapeDisplayName(shape, profile);
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
        overlays.push(chipOverlayToSvg(chipLabel, box, zoom));
      }
    }
  }

  return overlays;
}
