import type { Bounds, Point, ShapeId, ShapeRecord } from '@open-draw/schema';
import { boundsCenter } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';
import type { HandleType } from '../selection/handles.js';
import { resizeBounds } from '../selection/resize.js';
import { computeRotationAngle } from '../selection/rotate.js';
import { handleGestureReparent } from '../selection/reparent.js';
import { findSuggestedParent } from '../capabilities/clipping/index.js';
import { isGroupShape, getGroupMembers } from '../selection/group.js';

export type GestureType = 'none' | 'move' | 'resize' | 'rotate';

export class GestureController {
  private editor: CanvasEditor;
  private currentType: GestureType = 'none';
  private targetShapeId: ShapeId | null = null;
  private handleType: HandleType | null = null;
  private startPointer: Point | null = null;
  private initialBounds: Bounds | null = null;
  private initialShapes = new Map<ShapeId, ShapeRecord>();
  private previewShapes = new Map<ShapeId, ShapeRecord>();
  private candidateFrameId: ShapeId | null = null;
  private hasMoved = false;

  constructor(editor: CanvasEditor) {
    this.editor = editor;
  }

  get isActive(): boolean {
    return this.currentType !== 'none';
  }

  get type(): GestureType {
    return this.currentType;
  }

  get didMove(): boolean {
    return this.hasMoved;
  }

  getPreviewShape(id: ShapeId): ShapeRecord | undefined {
    return this.previewShapes.get(id);
  }

  startMove(clickedShapeId: ShapeId, startPointer: Point): boolean {
    this._reset();
    const shapesToMove = new Set<ShapeId>();
    for (const selId of this.editor.selection) {
      shapesToMove.add(selId);
      const shape = this.editor.store.getShape(selId);
      if (shape && isGroupShape(shape, this.editor.registry)) {
        for (const m of getGroupMembers(shape, this.editor.registry)) shapesToMove.add(m);
      }
      for (const candidate of this.editor.store.listShapes()) {
        if (candidate.meta['parent'] === selId || candidate.meta['parentId'] === selId) {
          shapesToMove.add(candidate.id);
        }
      }
    }

    if (!shapesToMove.has(clickedShapeId)) shapesToMove.add(clickedShapeId);

    for (const id of shapesToMove) {
      const shape = this.editor.store.getShape(id);
      if (shape) {
        this.initialShapes.set(id, shape);
        this.previewShapes.set(id, shape);
      }
    }

    this.currentType = 'move';
    this.targetShapeId = clickedShapeId;
    this.startPointer = startPointer;
    this.hasMoved = false;
    return true;
  }

  startResize(handleType: HandleType, shapeId: ShapeId, startPointer: Point): boolean {
    if (handleType === 'rotate') return this.startRotate(shapeId, startPointer);
    this._reset();
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) return false;
    const def = this.editor.registry.get(shape.type);
    if (!def) return false;

    this.initialShapes.set(shapeId, shape);
    this.previewShapes.set(shapeId, shape);
    this.initialBounds = def.geometry.bounds(shape);
    this.handleType = handleType;
    this.targetShapeId = shapeId;
    this.startPointer = startPointer;
    this.currentType = 'resize';
    this.hasMoved = false;
    return true;
  }

  startRotate(shapeId: ShapeId, startPointer: Point): boolean {
    this._reset();
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) return false;
    const def = this.editor.registry.get(shape.type);
    if (!def) return false;

    this.initialShapes.set(shapeId, shape);
    this.previewShapes.set(shapeId, shape);
    this.initialBounds = def.geometry.bounds(shape);
    this.handleType = 'rotate';
    this.targetShapeId = shapeId;
    this.startPointer = startPointer;
    this.currentType = 'rotate';
    this.hasMoved = false;
    return true;
  }

  move(currentPointer: Point, e: PointerEvent | MouseEvent): void {
    if (!this.isActive || !this.startPointer) return;
    const dx = currentPointer.x - this.startPointer.x;
    const dy = currentPointer.y - this.startPointer.y;

    if (this.currentType === 'rotate') {
      this.hasMoved = true;
      if (this.targetShapeId && this.initialBounds) {
        this._rotateShape(currentPointer, e);
      }
      return;
    }

    if (!this.hasMoved) {
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        this.hasMoved = true;
      } else {
        return;
      }
    }

    if (this.currentType === 'move') {
      this._moveShapes(dx, dy);
    } else if (this.currentType === 'resize' && this.targetShapeId && this.initialBounds && this.handleType) {
      this._resizeShape(dx, dy, e);
    }
  }

  commit(): void {
    if (!this.isActive) return;
    this._clearFrameHighlight();

    if (this.hasMoved && this.previewShapes.size > 0) {
      const patches = new Map(this.previewShapes);
      const gestureType = this.currentType;
      const targetId = this.targetShapeId;

      this.editor.store.transact(() => {
        if (gestureType === 'move') {
          for (const [id, preview] of patches) {
            this.editor.store.updateShape(id, { x: preview.x, y: preview.y });
          }
          for (const id of this.editor.selection) {
            handleGestureReparent(id, this.editor.store, this.editor.registry, this.editor.camera);
          }
        } else if (gestureType === 'resize' && targetId) {
          const p = patches.get(targetId);
          if (p) this.editor.store.updateShape(targetId, { x: p.x, y: p.y, rotation: p.rotation, props: p.props });
        } else if (gestureType === 'rotate' && targetId) {
          const p = patches.get(targetId);
          if (p) this.editor.store.updateShape(targetId, { rotation: p.rotation });
        }
      });
    }

    this._reset();
  }

  cancel(): void {
    if (!this.isActive) return;
    this._clearFrameHighlight();
    for (const [id, initial] of this.initialShapes) {
      this.editor.renderer.updatePreview(initial);
    }
    this._reset();
    this.editor.selectionManager.updateVisuals(this.editor.renderer, this.editor.store, this.editor.registry, this.editor.camera.camera);
  }

  private _moveShapes(dx: number, dy: number): void {
    for (const [id, initial] of this.initialShapes) {
      const preview: ShapeRecord = { ...initial, x: initial.x + dx, y: initial.y + dy };
      this.previewShapes.set(id, preview);
      this.editor.renderer.updatePreview(preview);
    }
    this.editor.selectionManager.updateVisuals(this.editor.renderer, this.editor.store, this.editor.registry, this.editor.camera.camera);
    this._updateCandidateFrameHighlight();
  }

  private _resizeShape(dx: number, dy: number, e: PointerEvent | MouseEvent): void {
    const shape = this.initialShapes.get(this.targetShapeId!)!;
    const newBounds = resizeBounds(this.initialBounds!, this.handleType!, dx, dy, {
      aspect: e.shiftKey,
      fromCenter: e.altKey,
    });
    const def = this.editor.registry.get(shape.type);
    if (!def) return;
    const patch = def.geometry.resize(shape, newBounds);
    const preview: ShapeRecord = { ...shape, ...patch };
    this.previewShapes.set(shape.id, preview);
    this.editor.renderer.updatePreview(preview);
    this.editor.selectionManager.updateVisuals(this.editor.renderer, this.editor.store, this.editor.registry, this.editor.camera.camera);
  }

  private _rotateShape(currentPointer: Point, e: PointerEvent | MouseEvent): void {
    const shape = this.initialShapes.get(this.targetShapeId!)!;
    const center = boundsCenter(this.initialBounds!);
    const snap = !e.shiftKey;
    const angle = computeRotationAngle(center, currentPointer, { snap });
    const preview: ShapeRecord = { ...shape, rotation: angle };
    this.previewShapes.set(shape.id, preview);
    this.editor.renderer.updatePreview(preview);
    this.editor.selectionManager.updateVisuals(this.editor.renderer, this.editor.store, this.editor.registry, this.editor.camera.camera);
  }

  private _updateCandidateFrameHighlight(): void {
    if (this.currentType !== 'move' || this.editor.selection.length !== 1) {
      this._clearFrameHighlight();
      return;
    }
    const selId = this.editor.selection[0]!;
    const preview = this.previewShapes.get(selId);
    if (!preview) return;
    const def = this.editor.registry.get(preview.type);
    if (!def) return;
    const bounds = def.geometry.bounds(preview);
    const suggested = findSuggestedParent(bounds, this.editor.store.listShapes(), this.editor.registry, selId);
    const nextId = suggested?.id ?? null;

    if (this.candidateFrameId !== nextId) {
      this._clearFrameHighlight();
      this.candidateFrameId = nextId;
      if (this.candidateFrameId) {
        this.editor.renderer.getShapeWrapper(this.candidateFrameId)?.classList.add('od-frame-target');
      }
    }
  }

  private _clearFrameHighlight(): void {
    if (this.candidateFrameId) {
      this.editor.renderer.getShapeWrapper(this.candidateFrameId)?.classList.remove('od-frame-target');
      this.candidateFrameId = null;
    }
  }

  private _reset(): void {
    this.currentType = 'none';
    this.targetShapeId = null;
    this.handleType = null;
    this.startPointer = null;
    this.initialBounds = null;
    this.initialShapes.clear();
    this.previewShapes.clear();
    this.hasMoved = false;
  }
}
