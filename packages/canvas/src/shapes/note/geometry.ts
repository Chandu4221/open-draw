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
      width: shape.props.width,
      height: shape.props.height,
    };
  },

  resize(shape: ShapeRecord<NoteProps>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<NoteProps>> {
    let { x, y } = shape;
    let width = shape.props.width;
    let height = shape.props.height;

    switch (handle) {
      case 'bottom-right':
        width = Math.max(MIN_NOTE_WIDTH, point.x - x);
        height = Math.max(MIN_NOTE_HEIGHT, point.y - y);
        break;
      case 'bottom-left':
        width = Math.max(MIN_NOTE_WIDTH, x + width - point.x);
        height = Math.max(MIN_NOTE_HEIGHT, point.y - y);
        x = point.x;
        break;
      case 'top-right':
        width = Math.max(MIN_NOTE_WIDTH, point.x - x);
        height = Math.max(MIN_NOTE_HEIGHT, y + height - point.y);
        y = point.y;
        break;
      case 'top-left':
        width = Math.max(MIN_NOTE_WIDTH, x + width - point.x);
        height = Math.max(MIN_NOTE_HEIGHT, y + height - point.y);
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

  hit(shape: ShapeRecord<NoteProps>, point: Point): boolean {
    const localX = point.x - shape.x;
    const localY = point.y - shape.y;
    return localX >= 0 && localX <= shape.props.width && localY >= 0 && localY <= shape.props.height;
  },
};
