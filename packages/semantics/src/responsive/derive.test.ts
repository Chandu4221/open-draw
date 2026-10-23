import { describe, it, expect } from 'vitest';
import type { Snapshot } from '@open-draw/schema';
import { derive } from './derive.js';

describe('Responsive Derivation: derive(scene, breakpoint)', () => {
  const twoColumnScene: Snapshot = {
    version: 1,
    shapes: [
      {
        id: 'sec-1',
        type: 'frame',
        x: 0,
        y: 0,
        meta: { semantic: { type: 'section' } },
        props: { width: 1200, height: 600 },
      },
      {
        id: 'col-1',
        type: 'rect',
        x: 50,
        y: 50,
        meta: { parent: 'sec-1', semantic: { type: 'column' } },
        props: { width: 500, height: 300 },
      },
      {
        id: 'col-2',
        type: 'rect',
        x: 600,
        y: 50,
        meta: { parent: 'sec-1', semantic: { type: 'column' } },
        props: { width: 500, height: 300 },
      },
      {
        id: 'btn-in-col2',
        type: 'rect',
        x: 620,
        y: 200,
        meta: { parent: 'col-2', semantic: { type: 'button' } },
        props: { width: 120, height: 40 },
      },
    ],
  };

  it('keeps horizontal layout unchanged on desktop (1200px)', () => {
    const result = derive(twoColumnScene, { width: 1200 });
    expect(result.isStacked).toBe(false);

    const col1 = result.layouts.get('col-1');
    const col2 = result.layouts.get('col-2');

    expect(col1?.x).toBe(50);
    expect(col2?.x).toBe(600);
    expect(col1?.isReflowed).toBe(false);
    expect(col2?.isReflowed).toBe(false);
  });

  it('stacks columns vertically on mobile (375px) below threshold', () => {
    const result = derive(twoColumnScene, { width: 375, padding: 16, gap: 16 });
    expect(result.isStacked).toBe(true);

    const col1 = result.layouts.get('col-1');
    const col2 = result.layouts.get('col-2');

    expect(col1?.isReflowed).toBe(true);
    expect(col2?.isReflowed).toBe(true);

    // col1 starts at padding 16
    expect(col1?.x).toBe(16);
    expect(col1?.y).toBe(16);
    expect(col1?.width).toBe(375 - 32); // 343

    // col2 stacks below col1: y = 16 + 300 (col1 height) + 16 (gap) = 332
    expect(col2?.x).toBe(16);
    expect(col2?.y).toBe(332);
    expect(col2?.width).toBe(343);

    // Nested button inside col2 translates with the column
    const btn = result.layouts.get('btn-in-col2');
    expect(btn?.isReflowed).toBe(true);
    expect(btn?.x).toBeLessThan(600); // translated horizontally into the mobile column
    expect(btn?.y).toBeGreaterThan(col2!.y); // positioned within col2
  });

  it('satisfies discrete swap latency target (<50ms)', () => {
    const result = derive(twoColumnScene, { width: 375 });
    expect(result.durationMs).toBeLessThan(50);
  });
});
