import { describe, expect, it } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import type { ImageProps } from './defs.js';
import { containFit, imageGeometry } from './geometry.js';

describe('imageGeometry & containFit', () => {
  describe('containFit', () => {
    it('fits landscape image inside square container', () => {
      const fit = containFit({ w: 400, h: 200 }, { width: 300, height: 300 });
      expect(fit.width).toBe(300);
      expect(fit.height).toBe(150);
      expect(fit.x).toBe(0);
      expect(fit.y).toBe(75);
    });

    it('fits portrait image inside square container', () => {
      const fit = containFit({ w: 200, h: 400 }, { width: 300, height: 300 });
      expect(fit.width).toBe(150);
      expect(fit.height).toBe(300);
      expect(fit.x).toBe(75);
      expect(fit.y).toBe(0);
    });

    it('fits image with identical aspect ratio', () => {
      const fit = containFit({ w: 800, h: 600 }, { width: 400, height: 300 });
      expect(fit.width).toBe(400);
      expect(fit.height).toBe(300);
      expect(fit.x).toBe(0);
      expect(fit.y).toBe(0);
    });
  });

  describe('imageGeometry', () => {
    const shape: ShapeRecord<ImageProps> = {
      id: 'img1',
      type: 'image',
      x: 10,
      y: 20,
      rotation: 0,
      hidden: false,
      meta: {},
      props: {
        width: 150,
        height: 100,
        src: 'data:image/png;base64,mock',
      },
    };

    it('computes bounds', () => {
      expect(imageGeometry.bounds(shape)).toEqual({ x: 10, y: 20, width: 150, height: 100 });
    });

    it('checks hit test', () => {
      expect(imageGeometry.hit(shape, { x: 50, y: 50 })).toBe(true);
      expect(imageGeometry.hit(shape, { x: 10, y: 20 })).toBe(true);
      expect(imageGeometry.hit(shape, { x: 160, y: 120 })).toBe(true);
      expect(imageGeometry.hit(shape, { x: 9, y: 20 })).toBe(false);
      expect(imageGeometry.hit(shape, { x: 161, y: 120 })).toBe(false);
    });

    it('resizes with clamp to min 20x20', () => {
      const clamped = imageGeometry.resize(shape, 'bottom-right', { x: 15, y: 25 });
      expect(clamped.props?.width).toBe(20);
      expect(clamped.props?.height).toBe(20);
    });
  });
});
