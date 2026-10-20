import { describe, expect, test } from 'vitest';
import { simplifyRDP } from './rdp.js';

describe('simplifyRDP', () => {
  test('reduces collinear points to start and end points', () => {
    // 10 collinear points along y = 2x
    const raw: number[] = [];
    for (let i = 0; i <= 10; i++) {
      raw.push(i * 10, i * 20);
    }
    expect(raw.length).toBe(22); // 11 points

    const simplified = simplifyRDP(raw, 1.5);
    expect(simplified.length).toBe(4); // 2 points: start and end
    expect(simplified).toEqual([0, 0, 100, 200]);
  });

  test('simplifies noisy points along a line within epsilon', () => {
    // Horizontal line y = 50 with small noise < 1px
    const raw = [
      0, 50,
      10, 50.4,
      20, 49.8,
      30, 50.2,
      40, 50.1,
      50, 50,
    ];
    const simplified = simplifyRDP(raw, 1.5);
    expect(simplified.length).toBe(4);
    expect(simplified).toEqual([0, 50, 50, 50]);
  });

  test('preserves prominent features in a sine squiggle while reducing count', () => {
    const raw: number[] = [];
    // 20 points along sine wave
    for (let i = 0; i < 20; i++) {
      const x = i * 10;
      const y = 100 + Math.sin(i * 0.5) * 50;
      raw.push(x, y);
    }
    expect(raw.length).toBe(40);

    const simplified = simplifyRDP(raw, 1.5);
    expect(simplified.length).toBeLessThan(raw.length);
    expect(simplified.length).toBeGreaterThanOrEqual(6);
  });
});
