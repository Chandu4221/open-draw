import type { Point, ShapeId } from '@open-draw/schema';
import type { CanvasEditor } from './editor.js';
import { findSuggestedParent } from './capabilities/clipping/index.js';
import { simplifyRDP } from './shapes/ink/index.js';
import { isMod } from './input/utils.js';
import { findGroupForMember, getGroupMembers, isGroupShape } from './selection/group.js';
import { computeMarqueeBounds, findIntersectingShapes, MarqueeOverlay } from './selection/marquee.js';
import type { HandleType } from './selection/handles.js';
import { TransformGestureController } from './selection/transformGesture.js';
import { handleGestureReparent } from './selection/reparent.js';

export class PointerInteractionController {
  private editor: CanvasEditor;
  private container: HTMLElement | null = null;
  private transformGesture: TransformGestureController;

  private isDragging = false;
  private dragStartPointer: Point | null = null;
  private dragPositions: Map<ShapeId, Point> = new Map();
  private clickedShapeId: ShapeId | null = null;
  private hasMovedAfterDown = false;
  private lastPointerDownShift = false;

  private isMarquee = false;
  private marqueeStart: Point | null = null;
  private isShiftMarquee = false;
  private initialSelectionBeforeMarquee: readonly ShapeId[] = [];
  private marqueeOverlay = new MarqueeOverlay();

  private isDrawing = false;
  private currentInkShapeId: ShapeId | null = null;
  private currentInkPts: number[] = [];

  constructor(editor: CanvasEditor) {
    this.editor = editor;
    this.transformGesture = new TransformGestureController(editor);
  }

  attach(container: HTMLElement): void {
    this.container = container;
    container.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  detach(): void {
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.onPointerDown);
      this.container = null;
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.marqueeOverlay.hide();
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.editor.mode === 'editing') {
      this.editor.textEditing.commit();
    }

    const containerRect = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const screenPt = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    const pagePt = this.editor.camera.screenToPage(screenPt);
    const activeTool = this.editor.getTool();

    if (activeTool === 'select') {
      this.onSelectPointerDown(e, pagePt);
    } else if (activeTool === 'ink' || activeTool === 'draw' || activeTool === 'highlighter') {
      this.onInkPointerDown(activeTool, pagePt);
    } else if (this.editor.registry.has(activeTool)) {
      this.onShapeCreatePointerDown(activeTool, pagePt);
    }
  };

  private onSelectPointerDown(e: PointerEvent, pagePt: Point): void {
    this.lastPointerDownShift = e.shiftKey;
    const target = e.target as Element | null;
    const handleEl = target?.closest('.od-handle');
    if (handleEl && this.editor.selection.length === 1) {
      const handleType = handleEl.getAttribute('data-handle') as HandleType;
      if (handleType && this.transformGesture.start(handleType, this.editor.selection[0]!, pagePt)) {
        return;
      }
    }

    const shapeWrapper = target?.closest('.od-shape');
    const shapeId = shapeWrapper?.getAttribute('data-id');

    if (!shapeId) {
      if (!e.shiftKey) {
        this.editor.clearSelection();
      }
      this.isMarquee = true;
      this.marqueeStart = pagePt;
      this.isShiftMarquee = e.shiftKey;
      this.initialSelectionBeforeMarquee = e.shiftKey ? [...this.editor.selection] : [];
      return;
    }

    let targetId = shapeId;
    if (!isMod(e)) {
      const group = findGroupForMember(shapeId, this.editor.store, this.editor.registry);
      if (group && !e.shiftKey) {
        targetId = group.id;
      }
    }

    this.clickedShapeId = targetId;
    this.hasMovedAfterDown = false;

    if (e.shiftKey) {
      this.editor.toggleSelection(targetId);
    } else if (!this.editor.isSelected(targetId)) {
      this.editor.selectShape(targetId);
    }

    if (this.editor.isSelected(targetId)) {
      this.startDraggingSelection(pagePt);
    }
  }

  private startDraggingSelection(pagePt: Point): void {
    const shapesToDrag = new Set<ShapeId>();
    for (const selId of this.editor.selection) {
      shapesToDrag.add(selId);
      const shape = this.editor.store.getShape(selId);
      if (shape && isGroupShape(shape, this.editor.registry)) {
        for (const m of getGroupMembers(shape, this.editor.registry)) {
          shapesToDrag.add(m);
        }
      }
      for (const candidate of this.editor.store.listShapes()) {
        if (candidate.meta['parent'] === selId || candidate.meta['parentId'] === selId) {
          shapesToDrag.add(candidate.id);
        }
      }
    }

    this.isDragging = true;
    this.dragStartPointer = pagePt;
    this.dragPositions.clear();
    for (const id of shapesToDrag) {
      const s = this.editor.store.getShape(id);
      if (s) {
        this.dragPositions.set(id, { x: s.x, y: s.y });
      }
    }
    this.editor.store.beginTransaction();
  }

  private onInkPointerDown(tool: string, pagePt: Point): void {
    const shapeType = tool === 'highlighter' ? 'highlighter' : 'ink';
    const def = this.editor.registry.get(shapeType);
    if (!def) return;

    this.isDrawing = true;
    this.currentInkPts = [pagePt.x, pagePt.y];
    this.editor.store.beginTransaction();
    const shape = this.editor.createShape({
      type: shapeType,
      x: pagePt.x,
      y: pagePt.y,
      props: { ...def.defaultProps(), pts: [pagePt.x, pagePt.y] },
    });
    this.currentInkShapeId = shape.id;
    this.editor.selectShape(shape.id);
  }

  private onShapeCreatePointerDown(tool: string, pagePt: Point): void {
    const def = this.editor.registry.get(tool);
    if (!def) return;

    this.editor.store.transact(() => {
      const shape = this.editor.createShape({
        type: tool,
        x: pagePt.x,
        y: pagePt.y,
        props: def.defaultProps(),
      });
      const bounds = def.geometry.bounds(shape);
      const suggested = findSuggestedParent(bounds, this.editor.store.listShapes(), this.editor.registry, shape.id);
      if (suggested) {
        this.editor.store.updateShape(shape.id, { meta: { ...shape.meta, parent: suggested.id } });
      }
      this.editor.selectShape(shape.id);
    });
    this.editor.setTool('select');
  }

  private onPointerMove = (e: PointerEvent): void => {
    const containerRect = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const screenPt = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    const currentPagePt = this.editor.camera.screenToPage(screenPt);

    if (this.transformGesture.isTransforming) {
      this.transformGesture.move(currentPagePt, e);
      return;
    }

    if (this.isDrawing && this.currentInkShapeId) {
      this.currentInkPts.push(currentPagePt.x, currentPagePt.y);
      const shape = this.editor.store.getShape(this.currentInkShapeId);
      if (shape) {
        this.editor.store.updateShape(this.currentInkShapeId, {
          props: { ...shape.props, pts: [...this.currentInkPts] },
        });
      }
      return;
    }

    if (this.isMarquee && this.marqueeStart && this.container) {
      const box = computeMarqueeBounds(this.marqueeStart, currentPagePt);
      this.marqueeOverlay.show(this.container, box);
      const hitIds = findIntersectingShapes(box, this.editor.store, this.editor.registry);
      if (this.isShiftMarquee) {
        this.editor.setSelection(Array.from(new Set([...this.initialSelectionBeforeMarquee, ...hitIds])));
      } else {
        this.editor.setSelection(hitIds);
      }
      return;
    }

    if (this.isDragging && this.dragStartPointer) {
      const dx = currentPagePt.x - this.dragStartPointer.x;
      const dy = currentPagePt.y - this.dragStartPointer.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        this.hasMovedAfterDown = true;
      }
      for (const [id, initialPos] of this.dragPositions) {
        this.editor.store.updateShape(id, { x: initialPos.x + dx, y: initialPos.y + dy });
      }
    }
  };

  private onPointerUp = (): void => {
    if (this.transformGesture.isTransforming) {
      this.transformGesture.end();
      return;
    }

    if (this.isDrawing && this.currentInkShapeId) {
      const simplified = simplifyRDP(this.currentInkPts, 1.5);
      const shape = this.editor.store.getShape(this.currentInkShapeId);
      if (shape) {
        this.editor.store.updateShape(this.currentInkShapeId, { props: { ...shape.props, pts: simplified } });
      }
      this.isDrawing = false;
      this.currentInkShapeId = null;
      this.currentInkPts = [];
      this.editor.store.commitTransaction();
      this.editor.setTool('select');
      return;
    }

    if (this.isMarquee) {
      this.marqueeOverlay.hide();
      this.isMarquee = false;
      this.marqueeStart = null;
      return;
    }

    if (this.isDragging) {
      this.finishDragging();
    }
  };

  private finishDragging(): void {
    if (!this.hasMovedAfterDown && this.clickedShapeId && !this.lastPointerDownShift) {
      this.editor.selectShape(this.clickedShapeId);
    }

    for (const id of this.editor.selection) {
      handleGestureReparent(id, this.editor.store, this.editor.registry, this.editor.camera);
    }

    this.isDragging = false;
    this.dragStartPointer = null;
    this.dragPositions.clear();
    this.clickedShapeId = null;
    this.editor.store.commitTransaction();
  }
}
