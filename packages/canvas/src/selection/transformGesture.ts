import type { Bounds, Point, ShapeId } from '@open-draw/schema';
import { boundsCenter } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';
import type { HandleType } from './handles.js';
import { resizeBounds } from './resize.js';
import { computeRotationAngle } from './rotate.js';

export class TransformGestureController {
  private editor: CanvasEditor;
  private isActive = false;
  private handleType: HandleType | null = null;
  private targetShapeId: ShapeId | null = null;
  private initialBounds: Bounds | null = null;
  private startPointer: Point | null = null;

  constructor(editor: CanvasEditor) {
    this.editor = editor;
  }

  get isTransforming(): boolean {
    return this.isActive;
  }

  start(handleType: HandleType, shapeId: ShapeId, startPointer: Point): boolean {
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) return false;

    const def = this.editor.registry.get(shape.type);
    if (!def) return false;

    const bounds = def.geometry.bounds(shape);
    this.isActive = true;
    this.handleType = handleType;
    this.targetShapeId = shapeId;
    this.initialBounds = bounds;
    this.startPointer = startPointer;

    this.editor.store.beginTransaction();
    return true;
  }

  move(currentPointer: Point, e: PointerEvent | MouseEvent): void {
    if (
      !this.isActive ||
      !this.targetShapeId ||
      !this.initialBounds ||
      !this.startPointer ||
      !this.handleType
    ) {
      return;
    }

    const shape = this.editor.store.getShape(this.targetShapeId);
    if (!shape) return;

    if (this.handleType === 'rotate') {
      const center = boundsCenter(this.initialBounds);
      const snap = !e.shiftKey;
      const angle = computeRotationAngle(center, currentPointer, { snap });
      this.editor.store.updateShape(this.targetShapeId, { rotation: angle });
      return;
    }

    const dx = currentPointer.x - this.startPointer.x;
    const dy = currentPointer.y - this.startPointer.y;
    const newBounds = resizeBounds(this.initialBounds, this.handleType, dx, dy, {
      aspect: e.shiftKey,
      fromCenter: e.altKey,
    });

    const def = this.editor.registry.get(shape.type);
    if (def) {
      const patch = def.geometry.resize(shape, newBounds);
      this.editor.store.updateShape(this.targetShapeId, patch);
    }
  }

  end(): void {
    if (!this.isActive) return;
    this.editor.store.commitTransaction();
    this.isActive = false;
    this.handleType = null;
    this.targetShapeId = null;
    this.initialBounds = null;
    this.startPointer = null;
  }
}
