import { describe, expect, it } from 'vitest';
import {
  boundsCenter,
  boundsContain,
  boundsFromPoints,
  boundsIntersect,
  boundsOf,
  boundsUnion,
  frameContains,
  inflate,
  InvalidBoundsError,
  pointInBounds,
  translateBounds,
} from './index.js';

describe('schema geometry core', () => {
  describe('boundsOf & validation', () => {
    it('creates valid bounds', () => {
      const b = boundsOf(10, 20, 100, 200);
      expect(b).toEqual({ x: 10, y: 20, width: 100, height: 200 });
    });

    it('rejects negative width or height with InvalidBoundsError', () => {
      expect(() => boundsOf(0, 0, -10, 50)).toThrow(InvalidBoundsError);
      expect(() => boundsOf(0, 0, 50, -10)).toThrow(InvalidBoundsError);
    });

    it('rejects non-finite coordinates with InvalidBoundsError', () => {
      expect(() => boundsOf(NaN, 0, 10, 10)).toThrow(InvalidBoundsError);
      expect(() => boundsOf(0, Infinity, 10, 10)).toThrow(InvalidBoundsError);
    });

    it('permits zero-area bounds', () => {
      const b = boundsOf(5, 5, 0, 0);
      expect(b.width).toBe(0);
      expect(b.height).toBe(0);
    });
  });

  describe('boundsFromPoints', () => {
    it('calculates bounding box enclosing points', () => {
      const b = boundsFromPoints([
        { x: 10, y: 50 },
        { x: -5, y: 20 },
        { x: 40, y: 100 },
      ]);
      expect(b).toEqual({ x: -5, y: 20, width: 45, height: 80 });
    });

    it('returns zero bounds for empty point array', () => {
      expect(boundsFromPoints([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('rejects points with non-finite coordinates', () => {
      expect(() => boundsFromPoints([{ x: NaN, y: 0 }])).toThrow(InvalidBoundsError);
    });
  });

  describe('boundsCenter', () => {
    it('computes exact center point', () => {
      const b = boundsOf(10, 20, 100, 200);
      expect(boundsCenter(b)).toEqual({ x: 60, y: 120 });
    });
  });

  describe('translateBounds', () => {
    it('shifts bounds by delta', () => {
      const b = boundsOf(10, 20, 30, 40);
      expect(translateBounds(b, 5, -10)).toEqual({ x: 15, y: 10, width: 30, height: 40 });
    });

    it('rejects non-finite deltas', () => {
      const b = boundsOf(0, 0, 10, 10);
      expect(() => translateBounds(b, Infinity, 0)).toThrow(InvalidBoundsError);
    });
  });

  describe('inflate', () => {
    it('expands bounds uniformly', () => {
      const b = boundsOf(10, 20, 30, 40);
      expect(inflate(b, 5, 5)).toEqual({ x: 5, y: 15, width: 40, height: 50 });
    });

    it('contracts bounds when deltas are negative', () => {
      const b = boundsOf(10, 20, 30, 40);
      expect(inflate(b, -5, -5)).toEqual({ x: 15, y: 25, width: 20, height: 30 });
    });

    it('rejects deflation resulting in negative dimensions', () => {
      const b = boundsOf(10, 10, 20, 20);
      expect(() => inflate(b, -15, 0)).toThrow(InvalidBoundsError);
    });
  });

  describe('pointInBounds (Boundary Semantics: [x, x+w) × [y, y+h))', () => {
    const b = boundsOf(10, 10, 20, 20); // x: [10, 30), y: [10, 30)

    it('includes top-left corner', () => {
      expect(pointInBounds({ x: 10, y: 10 }, b)).toBe(true);
    });

    it('includes interior point', () => {
      expect(pointInBounds({ x: 20, y: 20 }, b)).toBe(true);
    });

    it('excludes right edge and bottom edge', () => {
      expect(pointInBounds({ x: 30, y: 15 }, b)).toBe(false);
      expect(pointInBounds({ x: 15, y: 30 }, b)).toBe(false);
      expect(pointInBounds({ x: 30, y: 30 }, b)).toBe(false);
    });

    it('excludes external points', () => {
      expect(pointInBounds({ x: 9.9, y: 15 }, b)).toBe(false);
      expect(pointInBounds({ x: 15, y: 30.1 }, b)).toBe(false);
    });

    it('returns false for zero-area bounds', () => {
      const zeroB = boundsOf(10, 10, 0, 0);
      expect(pointInBounds({ x: 10, y: 10 }, zeroB)).toBe(false);
    });
  });

  describe('boundsContain', () => {
    const container = boundsOf(0, 0, 100, 100);

    it('returns true when inner is fully inside', () => {
      const inner = boundsOf(10, 10, 20, 20);
      expect(boundsContain(container, inner)).toBe(true);
      expect(frameContains(container, inner)).toBe(true);
    });

    it('returns true when sharing top-left or bottom-right boundaries', () => {
      const same = boundsOf(0, 0, 100, 100);
      expect(boundsContain(container, same)).toBe(true);

      const atTopLeft = boundsOf(0, 0, 10, 10);
      expect(boundsContain(container, atTopLeft)).toBe(true);

      const atBottomRight = boundsOf(90, 90, 10, 10);
      expect(boundsContain(container, atBottomRight)).toBe(true);
    });

    it('returns false when inner extends beyond right or bottom boundary', () => {
      const overflowsRight = boundsOf(90, 50, 20, 20);
      expect(boundsContain(container, overflowsRight)).toBe(false);

      const overflowsBottom = boundsOf(50, 90, 20, 20);
      expect(boundsContain(container, overflowsBottom)).toBe(false);
    });

    it('returns false when inner is outside', () => {
      const outside = boundsOf(200, 200, 50, 50);
      expect(boundsContain(container, outside)).toBe(false);
    });
  });

  describe('boundsIntersect (Half-Open Touching Edges Do Not Intersect)', () => {
    it('returns true for overlapping bounds', () => {
      const a = boundsOf(0, 0, 100, 100);
      const b = boundsOf(50, 50, 100, 100);
      expect(boundsIntersect(a, b)).toBe(true);
      expect(boundsIntersect(b, a)).toBe(true);
    });

    it('returns false for touching edges (half-open boundary semantics)', () => {
      const a = boundsOf(0, 0, 50, 50);
      const b = boundsOf(50, 0, 50, 50); // touches right edge of a
      const c = boundsOf(0, 50, 50, 50); // touches bottom edge of a
      expect(boundsIntersect(a, b)).toBe(false);
      expect(boundsIntersect(a, c)).toBe(false);
    });

    it('returns false for disjoint bounds', () => {
      const a = boundsOf(0, 0, 10, 10);
      const b = boundsOf(20, 20, 10, 10);
      expect(boundsIntersect(a, b)).toBe(false);
    });

    it('returns false for zero-area bounds', () => {
      const a = boundsOf(0, 0, 100, 100);
      const b = boundsOf(50, 50, 0, 0);
      expect(boundsIntersect(a, b)).toBe(false);
    });
  });

  describe('boundsUnion', () => {
    it('computes minimal bounding box enclosing both', () => {
      const a = boundsOf(10, 10, 20, 20);
      const b = boundsOf(50, 40, 30, 40);
      expect(boundsUnion(a, b)).toEqual({ x: 10, y: 10, width: 70, height: 70 });
    });

    it('returns equivalent bounds when one fully contains the other', () => {
      const a = boundsOf(0, 0, 100, 100);
      const b = boundsOf(10, 10, 20, 20);
      expect(boundsUnion(a, b)).toEqual(a);
    });
  });
});
