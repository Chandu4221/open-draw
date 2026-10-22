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

  resize(shape: ShapeRecord<EllipseProps>, handleOrBounds: ResizeHandle | Bounds, point?: Point): Partial<ShapeRecord<EllipseProps>> {
    if (typeof handleOrBounds === 'object' && 'width' in handleOrBounds && 'height' in handleOrBounds) {
      return {
        x: handleOrBounds.x,
        y: handleOrBounds.y,
        props: {
          ...shape.props,
          width: Math.max(10, handleOrBounds.width),
          height: Math.max(10, handleOrBounds.height),
        },
      };
    }

    let { x, y } = shape;
    let width = shape.props.width;
    let height = shape.props.height;
    const pt = point ?? { x, y };

    switch (handleOrBounds) {
      case 'bottom-right':
      case 'se':
        width = Math.max(10, pt.x - x);
        height = Math.max(10, pt.y - y);
        break;
      case 'bottom-left':
      case 'sw':
        width = Math.max(10, x + width - pt.x);
        height = Math.max(10, pt.y - y);
        x = pt.x;
        break;
      case 'top-right':
      case 'ne':
        width = Math.max(10, pt.x - x);
        height = Math.max(10, y + height - pt.y);
        y = pt.y;
        break;
      case 'top-left':
      case 'nw':
        width = Math.max(10, x + width - pt.x);
        height = Math.max(10, y + height - pt.y);
        x = pt.x;
        y = pt.y;
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
