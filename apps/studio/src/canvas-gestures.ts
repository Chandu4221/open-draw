import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { isRootId, ROOT_ID } from "@open-draw/contracts";
import {
  normalizeBox,
  resizeBox,
  TOOLS,
  type CanvasController,
  type ToolId,
} from "@open-draw/canvas";
import {
  absoluteBoundingBox,
  COMMANDS,
  computeReparentBoundingBox,
  createEllipse,
  createLine,
  createPenPath,
  createRect,
  pickDropTarget,
  pruneSelectedDescendants,
  type Command,
  type Document,
  type EllipseShape,
  type RectShape,
} from "@open-draw/document";
import { deriveLineBoundingBox, derivePenPathBoundingBox } from "@open-draw/shapes";
import type { Gesture } from "./types";

let shapeSequence = 0x7a00;
export function nextShapeId(): ShapeId {
  shapeSequence += 1;
  return `s-${shapeSequence.toString(16)}` as ShapeId;
}

export function commitDragGesture(
  doc: Document,
  gesture: Gesture,
  world: Point,
  commit: (commands: readonly Command[]) => void,
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
    const targetParentId = pickDropTarget(doc, center, [id]);

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
    commit(commands);
  }
}

export function commitResizeGesture(
  doc: Document,
  canvas: CanvasController,
  gesture: Gesture,
  world: Point,
  commit: (commands: readonly Command[]) => void,
): void {
  const selectedId = gesture.targetShapeId ?? canvas.getSelectedId();
  if (selectedId === null || gesture.handleId === null || gesture.originalBox === null) {
    return;
  }
  const shape = doc.shapes[selectedId];
  if (shape === undefined) {
    return;
  }
  const parentShape = doc.shapes[shape.parentId];
  const parentOrigin =
    parentShape === undefined ? { x: 0, y: 0 } : absoluteBoundingBox(doc, parentShape);
  const resized = resizeBox(gesture.originalBox, gesture.handleId, world);
  commit([
    {
      type: COMMANDS.setShapeBoundingBox,
      id: selectedId,
      boundingBox: {
        x: resized.x - parentOrigin.x,
        y: resized.y - parentOrigin.y,
        width: resized.width,
        height: resized.height,
      },
    },
  ]);
}

export function commitDrawGesture(
  doc: Document,
  canvas: CanvasController,
  gesture: Gesture,
  world: Point,
  tool: ToolId,
  commit: (commands: readonly Command[]) => void,
): void {
  const parentHit = gesture.parentHit;
  const targetParentId = parentHit !== null ? pickDropTarget(doc, gesture.startWorld, []) : ROOT_ID;
  const targetParent = !isRootId(targetParentId) ? doc.shapes[targetParentId] : undefined;

  if (tool === TOOLS.drawLine) {
    const { boundingBox, start, end } = deriveLineBoundingBox(gesture.startWorld, world);
    if (targetParent !== undefined) {
      const parentBox = absoluteBoundingBox(doc, targetParent);
      const line = createLine(
        nextShapeId(),
        {
          x: boundingBox.x - parentBox.x,
          y: boundingBox.y - parentBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
        start,
        end,
        { parent: targetParent.id },
      );
      commit([{ type: COMMANDS.createShape, shape: line }]);
      canvas.select(line.id);
      return;
    }
    const line = createLine(nextShapeId(), boundingBox, start, end, { parent: ROOT_ID });
    commit([{ type: COMMANDS.createShape, shape: line }]);
    canvas.select(line.id);
    return;
  }

  if (tool === TOOLS.drawPenPath) {
    const allPoints = gesture.points.length > 0 ? gesture.points : [gesture.startWorld, world];
    const { boundingBox, points } = derivePenPathBoundingBox(allPoints);
    if (targetParent !== undefined) {
      const parentBox = absoluteBoundingBox(doc, targetParent);
      const pen = createPenPath(
        nextShapeId(),
        {
          x: boundingBox.x - parentBox.x,
          y: boundingBox.y - parentBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
        points,
        { parent: targetParent.id },
      );
      commit([{ type: COMMANDS.createShape, shape: pen }]);
      canvas.select(pen.id);
      return;
    }
    const pen = createPenPath(nextShapeId(), boundingBox, points, { parent: ROOT_ID });
    commit([{ type: COMMANDS.createShape, shape: pen }]);
    canvas.select(pen.id);
    return;
  }

  const box = normalizeBox(gesture.startWorld, world);
  const createDrawnShape = (parent: ShapeId, localBox: BoundingBox): RectShape | EllipseShape =>
    tool === TOOLS.drawEllipse
      ? createEllipse(nextShapeId(), localBox, { parent })
      : createRect(nextShapeId(), localBox, { parent });

  if (targetParent !== undefined) {
    const parentBox = absoluteBoundingBox(doc, targetParent);
    const shape = createDrawnShape(targetParent.id, {
      x: box.x - parentBox.x,
      y: box.y - parentBox.y,
      width: box.width,
      height: box.height,
    });
    commit([{ type: COMMANDS.createShape, shape }]);
    canvas.select(shape.id);
    return;
  }

  const shape = createDrawnShape(ROOT_ID, box);
  commit([{ type: COMMANDS.createShape, shape }]);
  canvas.select(shape.id);
}
