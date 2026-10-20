import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle } from '../../registry.js';
import type { EllipseProps } from './defs.js';

export const ellipseGeometry = {
  bounds(shape: ShapeRecord<EllipseProps>): Bounds {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.props.width,
      height: shape.props.height,
    };
  },

  resize(shape: ShapeRecord<EllipseProps>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<EllipseProps>> {
    let { x, y } = shape;
    let width = shape.props.width;
    let height = shape.props.height;

    switch (handle) {
      case 'bottom-right':
        width = Math.max(10, point.x - x);
        height = Math.max(10, point.y - y);
        break;
      case 'bottom-left':
        width = Math.max(10, x + width - point.x);
        height = Math.max(10, point.y - y);
        x = point.x;
        break;
      case 'top-right':
        width = Math.max(10, point.x - x);
        height = Math.max(10, y + height - point.y);
        y = point.y;
        break;
      case 'top-left':
        width = Math.max(10, x + width - point.x);
        height = Math.max(10, y + height - point.y);
        x = point.x;
        y = point.y;
        break;
    }

    return {
      x,
      y,
      props: {
        ...shape.props,
        width,
        height,
      },
    };
  },

  hit(shape: ShapeRecord<EllipseProps>, point: Point): boolean {
    const rx = shape.props.width / 2;
    const ry = shape.props.height / 2;
    if (rx <= 0 || ry <= 0) return false;

    const cx = shape.x + rx;
    const cy = shape.y + ry;
    const dx = point.x - cx;
    const dy = point.y - cy;

    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0;
  },
};
