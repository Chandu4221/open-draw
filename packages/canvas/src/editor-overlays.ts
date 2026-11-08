// Interaction overlay SVG generators for standalone editor (R-018, R-031).
import type { Point, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, ancestorsOf, type Document } from "@open-draw/document";
import {
  previewBoxToSvg,
  previewLineToSvg,
  previewPenPathToSvg,
  selectionOverlayToSvg,
} from "@open-draw/renderer-svg";
import type { ActiveGesture } from "./editor-gestures";
import { GESTURE_KINDS } from "./gestures";
import { normalizeBox, resizeBox } from "./geometry";
import { TOOLS, type ToolId } from "./tools";

export interface EditorOverlayOptions {
  readonly doc: Document;
  readonly selectedId: ShapeId | null;
  readonly selectedIds: readonly ShapeId[];
  readonly gesture: ActiveGesture | null;
  readonly tool: ToolId;
  readonly lastWorld: Point;
  readonly zoom: number;
  readonly customOverlays?: readonly string[] | undefined;
}

export function computeEditorOverlays(options: EditorOverlayOptions): readonly string[] {
  const { doc, selectedId, selectedIds, gesture, tool, lastWorld, zoom, customOverlays } = options;
  const overlays: string[] = [];

  const activeSelectedIds =
    selectedIds.length > 0 ? selectedIds : selectedId !== null ? [selectedId] : [];

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
    } else if (tool !== TOOLS.drawText) {
      overlays.push(previewBoxToSvg(normalizeBox(gesture.startWorld, lastWorld)));
    }
  }

  if (customOverlays !== undefined && customOverlays.length > 0) {
    overlays.push(...customOverlays);
  }

  return overlays;
}
