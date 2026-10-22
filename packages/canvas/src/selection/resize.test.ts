import { describe, expect, it } from 'vitest';
import { boundsCenter, boundsOf } from '@open-draw/schema';
import { resizeBounds } from './resize.js';

describe('resizeBounds', () => {
  const initial = boundsOf(100, 100, 200, 100); // 2:1 aspect ratio

  it('SE +100px dx increases width by 100px', () => {
    const resized = resizeBounds(initial, 'se', 100, 50);
    expect(resized.x).toBe(100);
    expect(resized.y).toBe(100);
    expect(resized.width).toBe(300);
    expect(resized.height).toBe(150);
  });

  it('E and W handles only change width', () => {
    const resizedE = resizeBounds(initial, 'e', 40, 999);
    expect(resizedE.width).toBe(240);
    expect(resizedE.height).toBe(100);
    expect(resizedE.x).toBe(100);

    const resizedW = resizeBounds(initial, 'w', 30, 999);
    expect(resizedW.width).toBe(170);
    expect(resizedW.height).toBe(100);
    expect(resizedW.x).toBe(130);
  });

  it('S and N handles only change height', () => {
    const resizedS = resizeBounds(initial, 's', 999, 40);
    expect(resizedS.height).toBe(140);
    expect(resizedS.width).toBe(200);
    expect(resizedS.y).toBe(100);

    const resizedN = resizeBounds(initial, 'n', 999, 20);
    expect(resizedN.height).toBe(80);
    expect(resizedN.width).toBe(200);
    expect(resizedN.y).toBe(120);
  });

  it('Shift maintains aspect ratio from initial state', () => {
    const resized = resizeBounds(initial, 'se', 100, 0, { aspect: true });
    // Initial aspect ratio was 200/100 = 2.0
    expect(resized.width / resized.height).toBeCloseTo(2.0, 5);
    expect(resized.width).toBe(300);
    expect(resized.height).toBe(150);
  });

  it('Alt resizes from center preserving bounding box center point', () => {
    const initialCenter = boundsCenter(initial);
    const resized = resizeBounds(initial, 'se', 50, 50, { fromCenter: true });
    const newCenter = boundsCenter(resized);

    expect(newCenter.x).toBeCloseTo(initialCenter.x, 5);
    expect(newCenter.y).toBeCloseTo(initialCenter.y, 5);
    expect(resized.width).toBe(300);
    expect(resized.height).toBe(200);
  });

  it('clamps to minimum dimensions (default 10px)', () => {
    const clamped = resizeBounds(initial, 'se', -500, -500);
    expect(clamped.width).toBe(10);
    expect(clamped.height).toBe(10);
  });

  it('ignores rotate handle', () => {
    const unchanged = resizeBounds(initial, 'rotate', 100, 100);
    expect(unchanged).toEqual(initial);
  });
});
