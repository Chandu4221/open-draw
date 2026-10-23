import { describe, it, expect } from 'vitest';
import type { Snapshot } from '@open-draw/schema';
import { validateSemantics } from './validation.js';

describe('Semantic Type Vocabulary & validateSemantics', () => {
  it('passes on clean semantic scene hierarchy', () => {
    const scene: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'page-1',
          type: 'frame',
          x: 0,
          y: 0,
          meta: { semantic: { type: 'page', name: 'Home Page' } },
          props: { width: 1440, height: 900 },
        },
        {
          id: 'sec-1',
          type: 'frame',
          x: 0,
          y: 0,
          meta: { parent: 'page-1', semantic: { type: 'section', name: 'Hero' } },
          props: { width: 1440, height: 400 },
        },
        {
          id: 'card-1',
          type: 'rect',
          x: 100,
          y: 50,
          meta: { parent: 'sec-1', semantic: { type: 'card', name: 'Product Card' } },
          props: { width: 300, height: 200 },
        },
        {
          id: 'btn-1',
          type: 'rect',
          x: 120,
          y: 200,
          meta: { parent: 'card-1', semantic: { type: 'button', name: 'Buy Now' } },
          props: { width: 100, height: 40 },
        },
      ],
    };

    const issues = validateSemantics(scene);
    expect(issues).toHaveLength(0);
  });

  it('warns when card contains a page (nonsensical containment)', () => {
    const scene: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'card-1',
          type: 'rect',
          x: 0,
          y: 0,
          meta: { semantic: { type: 'card' } },
          props: {},
        },
        {
          id: 'page-1',
          type: 'frame',
          x: 10,
          y: 10,
          meta: { parent: 'card-1', semantic: { type: 'page' } },
          props: {},
        },
      ],
    };

    const issues = validateSemantics(scene);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.code === 'invalid-parent' && i.shapeId === 'page-1')).toBe(true);
  });

  it('warns on invalid shape name exceeding 64 chars', () => {
    const scene: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'btn-1',
          type: 'rect',
          x: 0,
          y: 0,
          meta: { semantic: { type: 'button', name: 'A'.repeat(65) } },
          props: {},
        },
      ],
    };

    const issues = validateSemantics(scene);
    expect(issues.some((i) => i.code === 'invalid-shape-name')).toBe(true);
  });

  it('warns on unknown custom semantic type', () => {
    const scene: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'custom-1',
          type: 'rect',
          x: 0,
          y: 0,
          meta: { semantic: { type: 'mysterious-widget' } },
          props: {},
        },
      ],
    };

    const issues = validateSemantics(scene);
    expect(issues.some((i) => i.code === 'unknown-semantic-type')).toBe(true);
  });
});
