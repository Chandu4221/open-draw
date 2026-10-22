import type { Bounds, Point, ShapeId } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';

export function lineSegmentIntersectsBounds(p1: Point, p2: Point, bounds: Bounds): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  const bRight = bounds.x + bounds.width;
  const bBottom = bounds.y + bounds.height;

  // 1. Fast AABB rejection
  if (maxX < bounds.x || minX > bRight || maxY < bounds.y || minY > bBottom) {
    return false;
  }

  // 2. Either point inside box
  if (p1.x >= bounds.x && p1.x <= bRight && p1.y >= bounds.y && p1.y <= bBottom) return true;
  if (p2.x >= bounds.x && p2.x <= bRight && p2.y >= bounds.y && p2.y <= bBottom) return true;

  // 3. Segment intersection with 4 bounding edges
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Top edge (y = bounds.y) and Bottom edge (y = bBottom)
  for (const edgeY of [bounds.y, bBottom]) {
    if (dy !== 0) {
      const t = (edgeY - p1.y) / dy;
      if (t >= 0 && t <= 1) {
        const ix = p1.x + t * dx;
        if (ix >= bounds.x && ix <= bRight) return true;
      }
    }
  }

  // Left edge (x = bounds.x) and Right edge (x = bRight)
  for (const edgeX of [bounds.x, bRight]) {
    if (dx !== 0) {
      const t = (edgeX - p1.x) / dx;
      if (t >= 0 && t <= 1) {
        const iy = p1.y + t * dy;
        if (iy >= bounds.y && iy <= bBottom) return true;
      }
    }
  }

  return false;
}

export class StrokeEraserController {
  private editor: CanvasEditor;
  private isErasing = false;
  private lastPoint: Point | null = null;
  private targetShapeIds = new Set<ShapeId>();
  private sparedParentIds = new Set<ShapeId>();

  constructor(editor: CanvasEditor) {
    this.editor = editor;
  }

  get isActive(): boolean {
    return this.isErasing;
  }

  get targets(): ReadonlySet<ShapeId> {
    return this.targetShapeIds;
  }

  start(point: Point): void {
    this.isErasing = true;
    this.lastPoint = point;
    this.targetShapeIds.clear();
    this.sparedParentIds.clear();
    this._checkIntersection(point, point);
  }

  move(currentPoint: Point): void {
    if (!this.isErasing || !this.lastPoint) return;
    this._checkIntersection(this.lastPoint, currentPoint);
    this.lastPoint = currentPoint;
  }

  end(): void {
    if (!this.isErasing) return;
    this.isErasing = false;
    this.lastPoint = null;

    for (const id of this.targetShapeIds) {
      this._unhighlight(id);
    }

    if (this.targetShapeIds.size > 0) {
      const idsToDelete = Array.from(this.targetShapeIds);
      this.editor.store.transact(() => {
        for (const id of idsToDelete) {
          this.editor.deleteShape(id);
        }
      });
      this.targetShapeIds.clear();
    }
    this.sparedParentIds.clear();
  }

  private _checkIntersection(p1: Point, p2: Point): void {
    const allShapes = Array.from(this.editor.store.listShapes());
    const childShapes = allShapes.filter((s) => s.meta['parent'] || s.meta['parentId']);
    const nonChildShapes = allShapes.filter((s) => !s.meta['parent'] && !s.meta['parentId']);

    for (const shape of childShapes) {
      if (this.targetShapeIds.has(shape.id)) continue;
      const def = this.editor.registry.get(shape.type);
      if (!def) continue;
      if (lineSegmentIntersectsBounds(p1, p2, def.geometry.bounds(shape))) {
        this.targetShapeIds.add(shape.id);
        this._highlight(shape.id);
        this._spareAncestors(shape.id);
      }
    }

    for (const shape of nonChildShapes) {
      if (this.targetShapeIds.has(shape.id) || this.sparedParentIds.has(shape.id)) continue;
      const def = this.editor.registry.get(shape.type);
      if (!def) continue;
      if (lineSegmentIntersectsBounds(p1, p2, def.geometry.bounds(shape))) {
        this.targetShapeIds.add(shape.id);
        this._highlight(shape.id);
      }
    }
  }

  private _spareAncestors(childId: ShapeId): void {
    const child = this.editor.store.getShape(childId);
    let parentId = (child?.meta['parent'] ?? child?.meta['parentId']) as ShapeId | undefined;
    while (parentId) {
      this.sparedParentIds.add(parentId);
      if (this.targetShapeIds.has(parentId)) {
        this.targetShapeIds.delete(parentId);
        this._unhighlight(parentId);
      }
      const parentShape = this.editor.store.getShape(parentId);
      parentId = (parentShape?.meta['parent'] ?? parentShape?.meta['parentId']) as ShapeId | undefined;
    }
  }

  private _highlight(id: ShapeId): void {
    const wrapper = this.editor.renderer.getShapeWrapper(id);
    if (wrapper) {
      wrapper.classList.add('od-erase-target');
      wrapper.style.opacity = '0.35';
    }
  }

  private _unhighlight(id: ShapeId): void {
    const wrapper = this.editor.renderer.getShapeWrapper(id);
    if (wrapper) {
      wrapper.classList.remove('od-erase-target');
      wrapper.style.removeProperty('opacity');
    }
  }
}
