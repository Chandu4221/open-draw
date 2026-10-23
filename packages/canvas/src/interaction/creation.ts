import { boundsOf, type Point, type ShapeId } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';
import { findSuggestedParent } from '../capabilities/clipping/index.js';
import { computeMarqueeBounds } from '../selection/marquee.js';

export class ShapeCreationController {
  private editor: CanvasEditor;
  private isCreating = false;
  private startPt: Point | null = null;
  private tool: string | null = null;
  private createdId: ShapeId | null = null;
  private didDrag = false;

  constructor(editor: CanvasEditor) {
    this.editor = editor;
  }

  get isActive(): boolean {
    return this.isCreating;
  }

  start(tool: string, pagePt: Point): void {
    if (!this.editor.registry.has(tool)) return;
    this.isCreating = true;
    this.startPt = pagePt;
    this.tool = tool;
    this.createdId = null;
    this.didDrag = false;
  }

  move(pagePt: Point, shiftKey: boolean): void {
    if (!this.isCreating || !this.startPt || !this.tool) return;

    const dist = Math.hypot(pagePt.x - this.startPt.x, pagePt.y - this.startPt.y);
    if (dist <= 3) return;

    const def = this.editor.registry.get(this.tool);
    if (!def) return;

    if (!this.createdId) {
      const s = this.editor.createShape({
        type: this.tool,
        x: this.startPt.x,
        y: this.startPt.y,
        props: def.defaultProps(),
      });
      this.createdId = s.id;
      this.editor.selectShape(s.id);
    }

    this.didDrag = true;
    let box = computeMarqueeBounds(this.startPt, pagePt);
    if (shiftKey) {
      const size = Math.max(box.width, box.height);
      const x = pagePt.x < this.startPt.x ? this.startPt.x - size : this.startPt.x;
      const y = pagePt.y < this.startPt.y ? this.startPt.y - size : this.startPt.y;
      box = boundsOf(x, y, size, size);
    }

    const shape = this.editor.store.getShape(this.createdId);
    if (shape) {
      const patch = def.geometry.resize(shape, box, pagePt);
      this.editor.store.updateShape(this.createdId, patch);
      this.editor.store.mergeLastHistoryEntry();
    }
  }

  end(): void {
    if (!this.isCreating) return;

    if (this.createdId && this.tool && this.didDrag) {
      const shape = this.editor.store.getShape(this.createdId);
      const def = this.editor.registry.get(this.tool);
      if (shape && def) {
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
          this.editor.store.mergeLastHistoryEntry();
        }
      }
    }

    this.isCreating = false;
    this.startPt = null;
    this.tool = null;
    this.createdId = null;
    this.didDrag = false;
    this.editor.setTool('select');
  }
}
