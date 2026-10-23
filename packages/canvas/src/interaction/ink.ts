import type { Point, ShapeId } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';
import { simplifyRDP } from '../shapes/ink/index.js';

export class FreehandDrawController {
  private editor: CanvasEditor;
  private isDrawing = false;
  private currentShapeId: ShapeId | null = null;
  private pts: number[] = [];

  constructor(editor: CanvasEditor) {
    this.editor = editor;
  }

  get isActive(): boolean {
    return this.isDrawing;
  }

  start(tool: string, pagePt: Point): void {
    const shapeType = tool === 'highlighter' ? 'highlighter' : 'ink';
    const def = this.editor.registry.get(shapeType);
    if (!def) return;

    this.isDrawing = true;
    this.pts = [pagePt.x, pagePt.y];
    const shape = this.editor.createShape({
      type: shapeType,
      x: pagePt.x,
      y: pagePt.y,
      props: { ...def.defaultProps(), pts: [pagePt.x, pagePt.y] },
    });
    this.currentShapeId = shape.id;
    this.editor.selectShape(shape.id);
  }

  move(pagePt: Point): void {
    if (!this.isDrawing || !this.currentShapeId) return;

    this.pts.push(pagePt.x, pagePt.y);
    const shape = this.editor.store.getShape(this.currentShapeId);
    if (shape) {
      this.editor.store.updateShape(this.currentShapeId, {
        props: { ...shape.props, pts: [...this.pts] },
      });
      this.editor.store.mergeLastHistoryEntry();
    }
  }

  end(): void {
    if (!this.isDrawing) return;

    if (this.currentShapeId) {
      const simplified = simplifyRDP(this.pts, 1.5);
      const shape = this.editor.store.getShape(this.currentShapeId);
      if (shape) {
        this.editor.store.updateShape(this.currentShapeId, {
          props: { ...shape.props, pts: simplified },
        });
        this.editor.store.mergeLastHistoryEntry();
      }
    }

    this.isDrawing = false;
    this.currentShapeId = null;
    this.pts = [];
    this.editor.setTool('select');
  }
}
