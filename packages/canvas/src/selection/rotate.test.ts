import { describe, expect, it } from 'vitest';
import { computeRotationAngle, rotatePoint } from './rotate.js';

describe('computeRotationAngle', () => {
  const center = { x: 100, y: 100 };

  it('computes 0 degrees when pointer is straight up from center (12 o clock)', () => {
    const angle = computeRotationAngle(center, { x: 100, y: 50 });
    expect(angle).toBe(0);
  });

  it('computes 90 degrees when pointer is straight right from center (3 o clock)', () => {
    const angle = computeRotationAngle(center, { x: 150, y: 100 });
    expect(angle).toBe(90);
  });

  it('computes 180 degrees when pointer is straight down from center (6 o clock)', () => {
    const angle = computeRotationAngle(center, { x: 100, y: 150 });
    expect(angle).toBe(180);
  });

  it('computes 270 degrees when pointer is straight left from center (9 o clock)', () => {
    const angle = computeRotationAngle(center, { x: 50, y: 100 });
    expect(angle).toBe(270);
  });

  it('snaps within 5 degrees to 45 degree multiples', () => {
    // 47 degrees is within 5 deg of 45 -> snaps to 45
    const angle47 = computeRotationAngle(center, {
      x: 100 + 100 * Math.sin((47 * Math.PI) / 180),
      y: 100 - 100 * Math.cos((47 * Math.PI) / 180),
    });
    expect(angle47).toBe(45);

    // 88 degrees is within 5 deg of 90 -> snaps to 90
    const angle88 = computeRotationAngle(center, {
      x: 100 + 100 * Math.sin((88 * Math.PI) / 180),
      y: 100 - 100 * Math.cos((88 * Math.PI) / 180),
    });
    expect(angle88).toBe(90);

    // 55 degrees is >5 deg away from 45 and 90 -> stays 55
    const angle55 = computeRotationAngle(center, {
      x: 100 + 100 * Math.sin((55 * Math.PI) / 180),
      y: 100 - 100 * Math.cos((55 * Math.PI) / 180),
    });
    expect(angle55).toBeCloseTo(55, 0);
  });

  it('allows free rotation when snap is false (e.g. Shift held)', () => {
    const raw = computeRotationAngle(
      center,
      {
        x: 100 + 100 * Math.sin((47 * Math.PI) / 180),
        y: 100 - 100 * Math.cos((47 * Math.PI) / 180),
      },
      { snap: false }
    );
    expect(raw).toBeCloseTo(47, 0);
  });

  it('rotates a point 90 degrees around center', () => {
    const pt = { x: 100, y: 50 }; // 50px straight up
    const rotated = rotatePoint(pt, center, 90);
    expect(rotated.x).toBeCloseTo(150, 4);
    expect(rotated.y).toBeCloseTo(100, 4);
  });
});
