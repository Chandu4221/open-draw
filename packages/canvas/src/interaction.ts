import type { Point, ShapeId } from '@open-draw/schema';
import type { CanvasEditor } from './editor.js';
import { findSuggestedParent } from './capabilities/clipping/index.js';

export class PointerInteractionController {
  private editor: CanvasEditor;
  private container: HTMLElement | null = null;

  private isDragging = false;
  private dragShapeId: ShapeId | null = null;
  private dragStartPointer: Point | null = null;
  private dragStartShapePos: Point | null = null;
  private dragChildInitialPositions: Map<ShapeId, Point> = new Map();

  constructor(editor: CanvasEditor) {
    this.editor = editor;
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
      const target = e.target as Element | null;
      const shapeWrapper = target?.closest('.od-shape');
      const shapeId = shapeWrapper?.getAttribute('data-id');

      if (shapeId) {
        this.editor.selectShape(shapeId);
        const shape = this.editor.store.getShape(shapeId);
        if (shape) {
          this.isDragging = true;
          this.dragShapeId = shapeId;
          this.dragStartPointer = pagePt;
          this.dragStartShapePos = { x: shape.x, y: shape.y };
          this.dragChildInitialPositions.clear();
          for (const s of this.editor.store.listShapes()) {
            if (s.meta['parent'] === shapeId || s.meta['parentId'] === shapeId) {
              this.dragChildInitialPositions.set(s.id, { x: s.x, y: s.y });
            }
          }
          this.editor.store.beginTransaction();
        }
      } else {
        this.editor.selectShape(null);
      }
    } else if (this.editor.registry.has(activeTool)) {
      const def = this.editor.registry.get(activeTool);
      if (def) {
        this.editor.store.transact(() => {
          const shape = this.editor.createShape({
            type: activeTool,
            x: pagePt.x,
            y: pagePt.y,
            props: def.defaultProps(),
          });
          const bounds = def.geometry.bounds(shape);
          const suggested = findSuggestedParent(
            bounds,
            this.editor.store.listShapes(),
            this.editor.registry,
            shape.id
          );
          if (suggested) {
            this.editor.store.updateShape(shape.id, {
              meta: { ...shape.meta, parent: suggested.id },
            });
          }
          this.editor.selectShape(shape.id);
        });
      }
      this.editor.setTool('select');
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging || !this.dragShapeId || !this.dragStartPointer || !this.dragStartShapePos) {
      return;
    }
    const containerRect = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const currentScreenPt = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    const currentPagePt = this.editor.camera.screenToPage(currentScreenPt);

    const dx = currentPagePt.x - this.dragStartPointer.x;
    const dy = currentPagePt.y - this.dragStartPointer.y;

    this.editor.store.updateShape(this.dragShapeId, {
      x: this.dragStartShapePos.x + dx,
      y: this.dragStartShapePos.y + dy,
    });
    for (const [childId, initPos] of this.dragChildInitialPositions) {
      this.editor.store.updateShape(childId, {
        x: initPos.x + dx,
        y: initPos.y + dy,
      });
    }
  };

  private onPointerUp = (): void => {
    if (this.isDragging) {
      if (this.dragShapeId) {
        const dragged = this.editor.store.getShape(this.dragShapeId);
        if (dragged && !dragged.meta['parent'] && !dragged.meta['parentId']) {
          const def = this.editor.registry.get(dragged.type);
          if (def) {
            const bounds = def.geometry.bounds(dragged);
            const suggested = findSuggestedParent(
              bounds,
              this.editor.store.listShapes(),
              this.editor.registry,
              dragged.id
            );
            if (suggested) {
              this.editor.store.updateShape(dragged.id, {
                meta: { ...dragged.meta, parent: suggested.id },
              });
            }
          }
        }
      }
      this.isDragging = false;
      this.dragShapeId = null;
      this.dragStartPointer = null;
      this.dragStartShapePos = null;
      this.dragChildInitialPositions.clear();
      this.editor.store.commitTransaction();
    }
  };
}
