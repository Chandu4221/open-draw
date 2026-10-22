import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle } from '../../registry.js';
import type { ImageProps } from './defs.js';

export function containFit(
  natural: { w: number; h: number },
  container: { width: number; height: number }
): { width: number; height: number; x: number; y: number } {
  if (natural.w <= 0 || natural.h <= 0) {
    return { width: container.width, height: container.height, x: 0, y: 0 };
  }

  const scale = Math.min(container.width / natural.w, container.height / natural.h);
  const width = Math.round(natural.w * scale);
  const height = Math.round(natural.h * scale);
  const x = Math.round((container.width - width) / 2);
  const y = Math.round((container.height - height) / 2);

  return { width, height, x, y };
}

export const imageGeometry = {
  bounds(shape: ShapeRecord<ImageProps>): Bounds {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.props.width,
      height: shape.props.height,
    };
  },

  resize(shape: ShapeRecord<ImageProps>, handleOrBounds: ResizeHandle | Bounds, point?: Point): Partial<ShapeRecord<ImageProps>> {
    if (typeof handleOrBounds === 'object' && 'width' in handleOrBounds && 'height' in handleOrBounds) {
      return {
        x: handleOrBounds.x,
        y: handleOrBounds.y,
        props: {
          ...shape.props,
          width: Math.max(20, handleOrBounds.width),
          height: Math.max(20, handleOrBounds.height),
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
        width = Math.max(20, pt.x - x);
        height = Math.max(20, pt.y - y);
        break;
      case 'bottom-left':
      case 'sw':
        width = Math.max(20, x + width - pt.x);
        height = Math.max(20, pt.y - y);
        x = pt.x;
        break;
      case 'top-right':
      case 'ne':
        width = Math.max(20, pt.x - x);
        height = Math.max(20, y + height - pt.y);
        y = pt.y;
        break;
      case 'top-left':
      case 'nw':
        width = Math.max(20, x + width - pt.x);
        height = Math.max(20, y + height - pt.y);
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

  hit(shape: ShapeRecord<ImageProps>, point: Point): boolean {
    const localX = point.x - shape.x;
    const localY = point.y - shape.y;
    return localX >= 0 && localX <= shape.props.width && localY >= 0 && localY <= shape.props.height;
  },
};
