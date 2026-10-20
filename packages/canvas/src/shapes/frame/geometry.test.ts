import { describe, expect, test } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { frameGeometry } from './geometry.js';
import type { FrameProps } from './defs.js';

describe('frameGeometry', () => {
  const createFrame = (overrides?: Partial<ShapeRecord<FrameProps>>): ShapeRecord<FrameProps> => ({
    id: 'frame-1',
    type: 'frame',
    x: 100,
    y: 150,
    rotation: 0,
    hidden: false,
    meta: {},
    props: {
      width: 400,
      height: 300,
      label: 'Main Frame',
    },
    ...overrides,
  });

  test('bounds returns accurate geometric dimensions with min-clamp', () => {
    const frame = createFrame();
    const bounds = frameGeometry.bounds(frame);
    expect(bounds).toEqual({ x: 100, y: 150, width: 400, height: 300 });

    const smallFrame = createFrame({ props: { width: 20, height: 10 } });
    const clampedBounds = frameGeometry.bounds(smallFrame);
    expect(clampedBounds).toEqual({ x: 100, y: 150, width: 50, height: 50 });
  });

  test('hit accurately determines containment within frame bounds', () => {
    const frame = createFrame();
    expect(frameGeometry.hit(frame, { x: 100, y: 150 })).toBe(true);
    expect(frameGeometry.hit(frame, { x: 300, y: 300 })).toBe(true);
    expect(frameGeometry.hit(frame, { x: 500, y: 450 })).toBe(true);
    expect(frameGeometry.hit(frame, { x: 501, y: 450 })).toBe(false);
    expect(frameGeometry.hit(frame, { x: 99, y: 150 })).toBe(false);
  });

  test('resize handles bottom-right resizing properly', () => {
    const frame = createFrame();
    const resized = frameGeometry.resize(frame, 'bottom-right', { x: 600, y: 550 });
    expect(resized.props?.width).toBe(500);
    expect(resized.props?.height).toBe(400);
  });
});
