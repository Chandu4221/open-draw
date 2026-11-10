// Gesture commit logic for standalone editor (R-004, R-008, R-018).
// Translates pointer completion into typed document commands.
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { isRootId, ROOT_ID } from "@open-draw/contracts";
import type { SnapGuide } from "./snap-solver";
import {
  absoluteBoundingBox,
  COMMANDS,
  computeReparentBoundingBox,
  createEllipse,
  createLine,
  createPenPath,
  createRect,
  createText,
  pickDropTarget,
  pruneSelectedDescendants,
  type Command,
  type Document,
  type EllipseShape,
  type RectShape,
} from "@open-draw/document";
import { deriveLineBoundingBox, derivePenPathBoundingBox } from "@open-draw/shapes";
import type { CanvasController } from "./create-canvas";
import type { HandleId } from "./handles";
import { normalizeBox, resizeBox } from "./geometry";
import { TOOLS, type ToolId } from "./tools";

export const DEFAULT_TEXT_SHAPE_DIMENSIONS = { width: 100, height: 32 } as const;

export type ShapeIdGenerator = (doc?: Document) => ShapeId;

export interface ShapeIdSequence {
  readonly nextShapeId: (doc?: Document) => ShapeId;
  readonly seed: (doc: Document) => void;
}

export function createShapeIdGenerator(initialDoc?: Document): ShapeIdSequence {
  let seq = 0x7a00;
  const seed = (doc: Document): void => {
    for (const shapeId of Object.keys(doc.shapes)) {
      const match = /^s-([0-9a-fA-F]+)$/.exec(shapeId);
      if (match !== null && match[1] !== undefined && match[1].length <= 12) {
        const val = parseInt(match[1], 16);
        if (Number.isFinite(val) && val > seq && val < Number.MAX_SAFE_INTEGER - 10000) {
          seq = val;
        }
      }
    }
  };
  if (initialDoc !== undefined) seed(initialDoc);
  const nextShapeId = (doc?: Document): ShapeId => {
    seq += 1;
    let id = `s-${seq.toString(16)}` as ShapeId;
    if (doc !== undefined) {
      while (doc.shapes[id] !== undefined) {
        seq += 1;
        id = `s-${seq.toString(16)}` as ShapeId;
      }
    }
    return id;
  };
  return { nextShapeId, seed };
}

export interface ActiveGesture {
  readonly pointerId: number;
  readonly kind: string;
  readonly startScreen: Point;
  readonly startWorld: Point;
  readonly shapeIds: readonly ShapeId[];
  readonly handleId: HandleId | null;
  readonly originalBox: BoundingBox | null;
  readonly parentHit: ShapeId | null;
  readonly targetShapeId: ShapeId | null;
  readonly points: readonly Point[];
  readonly snapGuides?: readonly SnapGuide[] | undefined;
  readonly snappedWorld?: Point | undefined;
}

export type NestingMode = "off" | "containers-only";

export function commitDragGesture(
  doc: Document,
  gesture: ActiveGesture,
  world: Point,
  execute: (commands: readonly Command[]) => void,
  nestingMode: NestingMode = "containers-only",
): void {
  const dx = world.x - gesture.startWorld.x;
  const dy = world.y - gesture.startWorld.y;
  if (dx === 0 && dy === 0) {
    return;
  }
  const topLevelShapeIds = pruneSelectedDescendants(doc, gesture.shapeIds);
  const commands: Command[] = [];
  const sameParentMoves: ShapeId[] = [];

  for (const id of topLevelShapeIds) {
    const shape = doc.shapes[id];
    if (shape === undefined) continue;

    const currentWorldBox = absoluteBoundingBox(doc, shape);
    const droppedWorldBox: BoundingBox = {
      x: currentWorldBox.x + dx,
      y: currentWorldBox.y + dy,
      width: currentWorldBox.width,
      height: currentWorldBox.height,
    };
    const center: Point = {
      x: droppedWorldBox.x + droppedWorldBox.width / 2,
      y: droppedWorldBox.y + droppedWorldBox.height / 2,
    };
    const targetParentId =
      nestingMode === "containers-only" ? pickDropTarget(doc, center, [id]) : shape.parentId;

    if (targetParentId !== shape.parentId) {
      const newBoundingBox = computeReparentBoundingBox(
        doc,
        shape,
        targetParentId,
        droppedWorldBox,
      );
      commands.push({
        type: COMMANDS.reparentShape,
        id,
        parentId: targetParentId,
        boundingBox: newBoundingBox,
      });
    } else {
      sameParentMoves.push(id);
    }
  }

  if (sameParentMoves.length > 0) {
    commands.push({
      type: COMMANDS.moveShapes,
      ids: sameParentMoves,
      dx,
      dy,
    });
  }

  if (commands.length > 0) {
    execute(commands);
  }
}

export function commitResizeGesture(
  doc: Document,
  canvas: CanvasController,
  gesture: ActiveGesture,
  world: Point,
  execute: (commands: readonly Command[]) => void,
): void {
  if (gesture.handleId === null || gesture.originalBox === null) return;
  const resized = resizeBox(gesture.originalBox, gesture.handleId, world);
  const ids =
    gesture.shapeIds.length > 0
      ? gesture.shapeIds
      : gesture.targetShapeId !== null
        ? [gesture.targetShapeId]
        : canvas.getSelectedIds();
  if (ids.length === 0) return;

  const orig = gesture.originalBox;
  const scaleX = orig.width > 0 ? resized.width / orig.width : 1;
  const scaleY = orig.height > 0 ? resized.height / orig.height : 1;
  const topLevelIds = pruneSelectedDescendants(doc, ids);
  const commands: Command[] = [];

  for (const id of topLevelIds) {
    const shape = doc.shapes[id];
    if (shape === undefined) continue;
    const absBox = absoluteBoundingBox(doc, shape);
    const parentShape = doc.shapes[shape.parentId];
    const parentOrigin =
      parentShape === undefined ? { x: 0, y: 0 } : absoluteBoundingBox(doc, parentShape);
    const newWorldX = resized.x + (absBox.x - orig.x) * scaleX;
    const newWorldY = resized.y + (absBox.y - orig.y) * scaleY;
    commands.push({
      type: COMMANDS.setShapeBoundingBox,
      id,
      boundingBox: {
        x: newWorldX - parentOrigin.x,
        y: newWorldY - parentOrigin.y,
        width: Math.max(1, absBox.width * scaleX),
        height: Math.max(1, absBox.height * scaleY),
      },
    });
  }

  if (commands.length > 0) execute(commands);
}

export function commitDrawGesture(
  doc: Document,
  canvas: CanvasController,
  gesture: ActiveGesture,
  world: Point,
  tool: ToolId,
  execute: (commands: readonly Command[]) => void,
  nestingMode: NestingMode = "containers-only",
  idGen: ShapeIdGenerator = (doc?: Document) => createShapeIdGenerator(doc).nextShapeId(doc),
): void {
  const targetParentId =
    nestingMode === "containers-only" ? pickDropTarget(doc, gesture.startWorld, []) : ROOT_ID;
  const targetParent = !isRootId(targetParentId) ? doc.shapes[targetParentId] : undefined;
  const parentBox =
    targetParent !== undefined ? absoluteBoundingBox(doc, targetParent) : { x: 0, y: 0 };

  if (tool === TOOLS.drawLine) {
    const { boundingBox, start, end } = deriveLineBoundingBox(gesture.startWorld, world);
    const line = createLine(
      idGen(doc),
      {
        x: boundingBox.x - parentBox.x,
        y: boundingBox.y - parentBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
      start,
      end,
      { parent: targetParentId },
    );
    execute([{ type: COMMANDS.createShape, shape: line }]);
    canvas.select(line.id);
    return;
  }

  if (tool === TOOLS.drawPenPath) {
    const allPoints = gesture.points.length > 0 ? gesture.points : [gesture.startWorld, world];
    const { boundingBox, points } = derivePenPathBoundingBox(allPoints);
    const pen = createPenPath(
      idGen(doc),
      {
        x: boundingBox.x - parentBox.x,
        y: boundingBox.y - parentBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
      points,
      { parent: targetParentId },
    );
    execute([{ type: COMMANDS.createShape, shape: pen }]);
    canvas.select(pen.id);
    return;
  }

  if (tool === TOOLS.drawText) {
    const textShape = createText(
      idGen(doc),
      {
        x: gesture.startWorld.x - parentBox.x,
        y: gesture.startWorld.y - parentBox.y,
        width: DEFAULT_TEXT_SHAPE_DIMENSIONS.width,
        height: DEFAULT_TEXT_SHAPE_DIMENSIONS.height,
      },
      { parentId: targetParentId },
    );
    execute([{ type: COMMANDS.createShape, shape: textShape }]);
    canvas.select(textShape.id);
    return;
  }

  const box = normalizeBox(gesture.startWorld, world);
  const localBox: BoundingBox = {
    x: box.x - parentBox.x,
    y: box.y - parentBox.y,
    width: box.width,
    height: box.height,
  };
  const shape: RectShape | EllipseShape =
    tool === TOOLS.drawEllipse
      ? createEllipse(idGen(doc), localBox, { parent: targetParentId })
      : createRect(idGen(doc), localBox, { parent: targetParentId });

  execute([{ type: COMMANDS.createShape, shape }]);
  canvas.select(shape.id);
}
