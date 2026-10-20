import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle, ShapeGeometry } from '../../registry.js';
import { DEFAULT_INK_PROPS, type InkProps } from './defs.js';

export const inkGeometry: ShapeGeometry<InkProps> = {
  bounds(shape: ShapeRecord<InkProps>): Bounds {
    const pts = shape.props.pts;
    if (!pts || pts.length < 2) {
      return { x: shape.x, y: shape.y, width: 0, height: 0 };
    }

    let minX = pts[0]!;
    let maxX = pts[0]!;
    let minY = pts[1]!;
    let maxY = pts[1]!;

    for (let i = 2; i < pts.length; i += 2) {
      const px = pts[i]!;
      const py = pts[i + 1]!;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const sw = shape.props.strokeWidth ?? DEFAULT_INK_PROPS.strokeWidth ?? 3;
    return {
      x: minX - sw / 2,
      y: minY - sw / 2,
      width: Math.max(1, maxX - minX + sw),
      height: Math.max(1, maxY - minY + sw),
    };
  },

  resize(shape: ShapeRecord<InkProps>, _handle: ResizeHandle, _point: Point): Partial<ShapeRecord<InkProps>> {
    return shape;
  },

  hit(shape: ShapeRecord<InkProps>, point: Point): boolean {
    const pts = shape.props.pts;
    if (!pts || pts.length < 2) return false;

    const threshold = (shape.props.strokeWidth ?? DEFAULT_INK_PROPS.strokeWidth ?? 3) / 2 + 4;
    const count = pts.length / 2;

    if (count === 1) {
      return Math.hypot(point.x - pts[0]!, point.y - pts[1]!) <= threshold;
    }

    for (let i = 0; i < count - 1; i++) {
      const x1 = pts[i * 2]!;
      const y1 = pts[i * 2 + 1]!;
      const x2 = pts[(i + 1) * 2]!;
      const y2 = pts[(i + 1) * 2 + 1]!;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) {
        if (Math.hypot(point.x - x1, point.y - y1) <= threshold) return true;
        continue;
      }

      const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / lenSq));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      if (Math.hypot(point.x - projX, point.y - projY) <= threshold) {
        return true;
      }
    }

    return false;
  },
};
