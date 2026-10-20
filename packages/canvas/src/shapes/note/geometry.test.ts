import { describe, expect, it } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import type { NoteProps } from './defs.js';
import { MIN_NOTE_HEIGHT, MIN_NOTE_WIDTH, noteGeometry } from './geometry.js';

describe('noteGeometry', () => {
  const shape: ShapeRecord<NoteProps> = {
    id: 'n1',
    type: 'note',
    x: 50,
    y: 80,
    rotation: 0,
    hidden: false,
    meta: {},
    props: {
      width: 200,
      height: 160,
      color: '#fef08a',
      text: 'Remember this',
    },
  };

  it('computes bounding box', () => {
    const bounds = noteGeometry.bounds(shape);
    expect(bounds).toEqual({ x: 50, y: 80, width: 200, height: 160 });
  });

  it('performs hit testing', () => {
    expect(noteGeometry.hit(shape, { x: 100, y: 100 })).toBe(true);
    expect(noteGeometry.hit(shape, { x: 50, y: 80 })).toBe(true);
    expect(noteGeometry.hit(shape, { x: 250, y: 240 })).toBe(true);
    expect(noteGeometry.hit(shape, { x: 40, y: 80 })).toBe(false);
    expect(noteGeometry.hit(shape, { x: 251, y: 240 })).toBe(false);
  });

  it('clamps min size on resize (min 100x80)', () => {
    const normal = noteGeometry.resize(shape, 'bottom-right', { x: 300, y: 280 });
    expect(normal.props?.width).toBe(250);
    expect(normal.props?.height).toBe(200);

    const clamped = noteGeometry.resize(shape, 'bottom-right', { x: 60, y: 90 });
    expect(clamped.props?.width).toBe(MIN_NOTE_WIDTH);
    expect(clamped.props?.height).toBe(MIN_NOTE_HEIGHT);
  });
});
