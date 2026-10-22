import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle, ShapeGeometry, ShapeRegistry } from '../../registry.js';
import type { CanvasStore } from '../../store/index.js';
import { type AnchorPosition, DEFAULT_ARROW_PROPS, type ArrowProps } from './defs.js';

export function getAnchorPoint(bounds: Bounds, anchor: AnchorPosition): Point {
  switch (anchor) {
    case 'top':
      return { x: bounds.x + bounds.width / 2, y: bounds.y };
    case 'right':
      return { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };
    case 'bottom':
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height };
    case 'left':
      return { x: bounds.x, y: bounds.y + bounds.height / 2 };
    case 'center':
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  }
}

export function resolveArrowEndpoints(
  shape: ShapeRecord<ArrowProps>,
  store?: CanvasStore,
  registry?: ShapeRegistry
): { start: Point; end: Point } {
  let start: Point = shape.props.startPoint ?? { x: shape.x, y: shape.y };
  let end: Point = shape.props.endPoint ?? { x: shape.x + 100, y: shape.y };

  if (shape.props.startBinding && store && registry) {
    const target = store.getShape(shape.props.startBinding.shapeId);
    if (target) {
      const def = registry.get(target.type);
      if (def) {
        start = getAnchorPoint(def.geometry.bounds(target), shape.props.startBinding.anchor);
      }
    }
  }

  if (shape.props.endBinding && store && registry) {
    const target = store.getShape(shape.props.endBinding.shapeId);
    if (target) {
      const def = registry.get(target.type);
      if (def) {
        end = getAnchorPoint(def.geometry.bounds(target), shape.props.endBinding.anchor);
      }
    }
  }

  return { start, end };
}

export const arrowGeometry: ShapeGeometry<ArrowProps> = {
  bounds(shape: ShapeRecord<ArrowProps>): Bounds {
    const p1 = shape.props.startPoint ?? { x: shape.x, y: shape.y };
    const p2 = shape.props.endPoint ?? { x: shape.x + 100, y: shape.y };
    const minX = Math.min(p1.x, p2.x) - 8;
    const minY = Math.min(p1.y, p2.y) - 8;
    const maxX = Math.max(p1.x, p2.x) + 8;
    const maxY = Math.max(p1.y, p2.y) + 8;
    return {
      x: minX,
      y: minY,
      width: Math.max(16, maxX - minX),
      height: Math.max(16, maxY - minY),
    };
  },

  resize(shape: ShapeRecord<ArrowProps>, _handle: ResizeHandle, point: Point): Partial<ShapeRecord<ArrowProps>> {
    return {
      props: {
        ...shape.props,
        endPoint: point,
      },
    };
  },

  hit(shape: ShapeRecord<ArrowProps>, point: Point): boolean {
    const p1 = shape.props.startPoint ?? { x: shape.x, y: shape.y };
    const p2 = shape.props.endPoint ?? { x: shape.x + 100, y: shape.y };
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      const d = Math.hypot(point.x - p1.x, point.y - p1.y);
      return d <= 8;
    }
    const t = Math.max(0, Math.min(1, ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq));
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    return Math.hypot(point.x - projX, point.y - projY) <= 8;
  },
};
