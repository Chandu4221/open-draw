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

  resize(shape: ShapeRecord<ImageProps>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<ImageProps>> {
    let { x, y } = shape;
    let width = shape.props.width;
    let height = shape.props.height;

    switch (handle) {
      case 'bottom-right':
        width = Math.max(20, point.x - x);
        height = Math.max(20, point.y - y);
        break;
      case 'bottom-left':
        width = Math.max(20, x + width - point.x);
        height = Math.max(20, point.y - y);
        x = point.x;
        break;
      case 'top-right':
        width = Math.max(20, point.x - x);
        height = Math.max(20, y + height - point.y);
        y = point.y;
        break;
      case 'top-left':
        width = Math.max(20, x + width - point.x);
        height = Math.max(20, y + height - point.y);
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

  hit(shape: ShapeRecord<ImageProps>, point: Point): boolean {
    const localX = point.x - shape.x;
    const localY = point.y - shape.y;
    return localX >= 0 && localX <= shape.props.width && localY >= 0 && localY <= shape.props.height;
  },
};
