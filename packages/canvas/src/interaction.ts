import type { Point, ShapeId } from '@open-draw/schema';
import type { CanvasEditor } from './editor.js';
import { isMod } from './input/utils.js';
import { findGroupForMember } from './selection/group.js';
import { computeMarqueeBounds, findIntersectingShapes, MarqueeOverlay } from './selection/marquee.js';
import type { HandleType } from './selection/handles.js';
import { StrokeEraserController } from './eraser/index.js';
import { ShapeCreationController } from './interaction/creation.js';
import { FreehandDrawController } from './interaction/ink.js';

export { ShapeCreationController } from './interaction/creation.js';
export { FreehandDrawController } from './interaction/ink.js';

export class PointerInteractionController {
  private editor: CanvasEditor;
  private container: HTMLElement | null = null;
  private eraser: StrokeEraserController;
  private creation: ShapeCreationController;
  private freehand: FreehandDrawController;

  private clickedShapeId: ShapeId | null = null;
  private lastPointerDownShift = false;
  private cachedContainerRect: { left: number; top: number } | null = null;
  private pendingPointerMove: { pagePt: Point; event: PointerEvent } | null = null;
  private rafMoveId: number | null = null;

  private isMarquee = false;
  private marqueeStart: Point | null = null;
  private isShiftMarquee = false;
  private initialSelectionBeforeMarquee: readonly ShapeId[] = [];
  private marqueeOverlay = new MarqueeOverlay();

  private isMiddlePanning = false;
  private middlePanStart: Point | null = null;

  constructor(editor: CanvasEditor) {
    this.editor = editor;
    this.eraser = new StrokeEraserController(editor);
    this.creation = new ShapeCreationController(editor);
    this.freehand = new FreehandDrawController(editor);
  }

  attach(container: HTMLElement): void {
    this.container = container;
    container.addEventListener('pointerdown', this.onPointerDown);
    container.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  detach(): void {
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.onPointerDown);
      this.container.removeEventListener('wheel', this.onWheel);
      if (this.isMiddlePanning) {
        this.container.style.cursor = '';
        this.isMiddlePanning = false;
        this.middlePanStart = null;
      }
      this.container = null;
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    if (this.rafMoveId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafMoveId);
      this.rafMoveId = null;
    }
    this.pendingPointerMove = null;
    this.cachedContainerRect = null;
    this.marqueeOverlay.hide();
  }

  private onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const r = this.cachedContainerRect ?? (this.container?.getBoundingClientRect() ?? { left: 0, top: 0 });
      const screenPt = { x: e.clientX - r.left, y: e.clientY - r.top };
      const factor = Math.pow(1.0015, -e.deltaY);
      this.editor.camera.zoomAroundPoint(screenPt, factor);
    } else if (e.shiftKey) {
      e.preventDefault();
      this.editor.camera.pan(-e.deltaY, 0);
    } else {
      e.preventDefault();
      this.editor.camera.pan(-e.deltaX, -e.deltaY);
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button === 1) {
      e.preventDefault();
      this.isMiddlePanning = true;
      this.middlePanStart = { x: e.clientX, y: e.clientY };
      if (this.container) this.container.style.cursor = 'grabbing';
      return;
    }

    if (this.editor.mode === 'editing') this.editor.textEditing.commit();

    const r = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    this.cachedContainerRect = { left: r.left, top: r.top };
    const screenPt = { x: e.clientX - r.left, y: e.clientY - r.top };
    const pagePt = this.editor.camera.screenToPage(screenPt);
    const activeTool = this.editor.getTool();

    if (activeTool === 'select') this.onSelectPointerDown(e, pagePt);
    else if (activeTool === 'eraser') this.eraser.start(pagePt);
    else if (activeTool === 'ink' || activeTool === 'draw' || activeTool === 'highlighter') this.freehand.start(activeTool, pagePt);
    else if (this.editor.registry.has(activeTool)) this.creation.start(activeTool, pagePt);
  };

  private onSelectPointerDown(e: PointerEvent, pagePt: Point): void {
    this.lastPointerDownShift = e.shiftKey;
    const target = e.target as Element | null;
    const handleEl = target?.closest('.od-handle');
    if (handleEl && this.editor.selection.length === 1) {
      const handleType = handleEl.getAttribute('data-handle') as HandleType;
      if (handleType) {
        const sel = this.editor.selection[0]!;
        if (handleType === 'rotate' ? this.editor.gesture.startRotate(sel, pagePt) : this.editor.gesture.startResize(handleType, sel, pagePt)) return;
      }
    }

    const shapeWrapper = target?.closest('.od-shape');
    const shapeId = shapeWrapper?.getAttribute('data-id');

    if (!shapeId) {
      if (!e.shiftKey) this.editor.clearSelection();
      this.isMarquee = true;
      this.marqueeStart = pagePt;
      this.isShiftMarquee = e.shiftKey;
      this.initialSelectionBeforeMarquee = e.shiftKey ? [...this.editor.selection] : [];
      return;
    }

    let targetId = shapeId;
    if (!isMod(e)) {
      const group = findGroupForMember(shapeId, this.editor.store, this.editor.registry);
      if (group && !e.shiftKey) targetId = group.id;
    }
    this.clickedShapeId = targetId;

    if (e.shiftKey) {
      this.editor.toggleSelection(targetId);
    } else if (!this.editor.isSelected(targetId)) {
      this.editor.selectShape(targetId);
    }
    if (this.editor.isSelected(targetId)) this.editor.gesture.startMove(targetId, pagePt);
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.isMiddlePanning && this.middlePanStart) {
      const dx = e.clientX - this.middlePanStart.x;
      const dy = e.clientY - this.middlePanStart.y;
      this.middlePanStart = { x: e.clientX, y: e.clientY };
      this.editor.camera.pan(dx, dy);
      return;
    }

    this.editor.telemetry.recordInput(e.timeStamp || performance.now());
    const r = this.cachedContainerRect ?? (this.container?.getBoundingClientRect() ?? { left: 0, top: 0 });
    const screenPt = { x: e.clientX - r.left, y: e.clientY - r.top };
    const currentPagePt = this.editor.camera.screenToPage(screenPt);

    if (this.editor.gesture.isActive) {
      this.pendingPointerMove = { pagePt: currentPagePt, event: e };
      if (this.rafMoveId === null && typeof requestAnimationFrame !== 'undefined') {
        this.rafMoveId = requestAnimationFrame(() => {
          this.rafMoveId = null;
          if (this.pendingPointerMove && this.editor.gesture.isActive) {
            const { pagePt, event } = this.pendingPointerMove;
            this.pendingPointerMove = null;
            this.editor.gesture.move(pagePt, event);
          }
        });
      } else if (typeof requestAnimationFrame === 'undefined') {
        this.editor.gesture.move(currentPagePt, e);
      }
      return;
    }

    if (this.eraser.isActive) {
      this.eraser.move(currentPagePt);
      return;
    }

    if (this.freehand.isActive) {
      this.freehand.move(currentPagePt);
      return;
    }

    if (this.creation.isActive) {
      this.creation.move(currentPagePt, e.shiftKey);
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
    }
  };

  private onPointerUp = (): void => {
    if (this.isMiddlePanning) {
      this.isMiddlePanning = false;
      this.middlePanStart = null;
      if (this.container) this.container.style.cursor = '';
      return;
    }

    if (this.rafMoveId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafMoveId);
      this.rafMoveId = null;
    }
    if (this.pendingPointerMove && this.editor.gesture.isActive) {
      const { pagePt, event } = this.pendingPointerMove;
      this.pendingPointerMove = null;
      this.editor.gesture.move(pagePt, event);
    }
    this.cachedContainerRect = null;

    if (this.editor.gesture.isActive) {
      const didMove = this.editor.gesture.didMove;
      this.editor.gesture.commit();
      if (!didMove && this.clickedShapeId && !this.lastPointerDownShift) this.editor.selectShape(this.clickedShapeId);
      this.clickedShapeId = null;
      return;
    }

    if (this.eraser.isActive) {
      this.eraser.end();
      return;
    }

    if (this.freehand.isActive) {
      this.freehand.end();
      return;
    }

    if (this.creation.isActive) {
      this.creation.end();
      return;
    }

    if (this.isMarquee) {
      this.marqueeOverlay.hide();
      this.isMarquee = false;
      this.marqueeStart = null;
      return;
    }
  };
}
