import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle } from '../../registry.js';
import type { NoteProps } from './defs.js';

export const MIN_NOTE_WIDTH = 100;
export const MIN_NOTE_HEIGHT = 80;

export const noteGeometry = {
  bounds(shape: ShapeRecord<NoteProps>): Bounds {
    return {
      x: shape.x,
      y: shape.y,
      width: Number.isFinite(shape.props.width) ? shape.props.width : MIN_NOTE_WIDTH,
      height: Number.isFinite(shape.props.height) ? shape.props.height : MIN_NOTE_HEIGHT,
    };
  },

  resize(shape: ShapeRecord<NoteProps>, handleOrBounds: ResizeHandle | Bounds, point?: Point): Partial<ShapeRecord<NoteProps>> {
    if (typeof handleOrBounds === 'object' && 'width' in handleOrBounds && 'height' in handleOrBounds) {
      return {
        x: handleOrBounds.x,
        y: handleOrBounds.y,
        props: {
          ...shape.props,
          width: Math.max(MIN_NOTE_WIDTH, handleOrBounds.width),
          height: Math.max(MIN_NOTE_HEIGHT, handleOrBounds.height),
        },
      };
    }

    let { x, y } = shape;
    const b = this.bounds(shape);
    let width = b.width;
    let height = b.height;
    const pt = point ?? { x, y };

    switch (handleOrBounds) {
      case 'bottom-right':
      case 'se':
        width = Math.max(MIN_NOTE_WIDTH, pt.x - x);
        height = Math.max(MIN_NOTE_HEIGHT, pt.y - y);
        break;
      case 'bottom-left':
      case 'sw':
        width = Math.max(MIN_NOTE_WIDTH, x + width - pt.x);
        height = Math.max(MIN_NOTE_HEIGHT, pt.y - y);
        x = pt.x;
        break;
      case 'top-right':
      case 'ne':
        width = Math.max(MIN_NOTE_WIDTH, pt.x - x);
        height = Math.max(MIN_NOTE_HEIGHT, y + height - pt.y);
        y = pt.y;
        break;
      case 'top-left':
      case 'nw':
        width = Math.max(MIN_NOTE_WIDTH, x + width - pt.x);
        height = Math.max(MIN_NOTE_HEIGHT, y + height - pt.y);
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

  hit(shape: ShapeRecord<NoteProps>, point: Point): boolean {
    const b = this.bounds(shape);
    const localX = point.x - shape.x;
    const localY = point.y - shape.y;
    return localX >= 0 && localX <= b.width && localY >= 0 && localY <= b.height;
  },
};
