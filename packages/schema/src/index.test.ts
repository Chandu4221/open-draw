import { describe, expect, it } from 'vitest';
import { boundsContain, type Bounds } from './index.js';

describe('schema smoke test', () => {
  it('correctly evaluates bounds containment', () => {
    const outer: Bounds = { x: 0, y: 0, width: 100, height: 100 };
    const inner: Bounds = { x: 10, y: 10, width: 20, height: 20 };
    const outside: Bounds = { x: 90, y: 90, width: 20, height: 20 };

    expect(boundsContain(outer, inner)).toBe(true);
    expect(boundsContain(outer, outside)).toBe(false);
  });
});
