import { describe, it, expect } from 'vitest';
import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { inferType } from './infer.js';

describe('Smart Defaults (Creation-time Type Inference)', () => {
  it('infers strong "section" for full-width rect inside page frame', () => {
    const page: ShapeRecord = {
      id: 'page-1',
      type: 'frame',
      x: 0,
      y: 0,
      meta: { semantic: { type: 'page' } },
      props: { width: 1200, height: 800 },
    };
    const rect: ShapeRecord = {
      id: 'rect-1',
      type: 'rect',
      x: 0,
      y: 0,
      meta: { parent: 'page-1' },
      props: { width: 1000, height: 300 }, // 1000/1200 = 83% >= 75%
    };
    const scene: Snapshot = { version: 1, shapes: [page, rect] };

    const result = inferType(rect, scene);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('section');
    expect(result?.tier).toBe('strong');
    expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('infers strong "card" for rect inside section container', () => {
    const section: ShapeRecord = {
      id: 'sec-1',
      type: 'frame',
      x: 0,
      y: 0,
      meta: { semantic: { type: 'section' } },
      props: { width: 1200, height: 400 },
    };
    const cardRect: ShapeRecord = {
      id: 'card-1',
      type: 'rect',
      x: 50,
      y: 50,
      meta: { parent: 'sec-1' },
      props: { width: 320, height: 240 },
    };
    const scene: Snapshot = { version: 1, shapes: [section, cardRect] };

    const result = inferType(cardRect, scene);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('card');
    expect(result?.tier).toBe('strong');
  });

  it('infers strong "heading" for top text inside a card', () => {
    const card: ShapeRecord = {
      id: 'card-1',
      type: 'rect',
      x: 50,
      y: 50,
      meta: { semantic: { type: 'card' } },
      props: { width: 320, height: 240 },
    };
    const headingText: ShapeRecord = {
      id: 'txt-1',
      type: 'text',
      x: 70,
      y: 70, // 20px down from card.y (50), 20/240 <= 40%
      meta: { parent: 'card-1' },
      props: { text: 'Card Title' },
    };
    const scene: Snapshot = { version: 1, shapes: [card, headingText] };

    const result = inferType(headingText, scene);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('heading');
    expect(result?.tier).toBe('strong');
  });

  it('infers weak "button" for small rect', () => {
    const buttonRect: ShapeRecord = {
      id: 'btn-1',
      type: 'rect',
      x: 100,
      y: 100,
      meta: {},
      props: { width: 140, height: 44 },
    };
    const scene: Snapshot = { version: 1, shapes: [buttonRect] };

    const result = inferType(buttonRect, scene);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('button');
    expect(result?.tier).toBe('weak');
  });

  it('STRICT INVARIANT (Soul Rule): NEVER overrides an existing semantic type', () => {
    const rect: ShapeRecord = {
      id: 'rect-1',
      type: 'rect',
      x: 0,
      y: 0,
      meta: { semantic: { type: 'custom-widget' } },
      props: { width: 1000, height: 300 },
    };
    const scene: Snapshot = { version: 1, shapes: [rect] };

    const result = inferType(rect, scene);
    expect(result).toBeNull();
  });

  it('STRICT INVARIANT (Soul Rule): NEVER re-infers on shapes flagged as userRetagged', () => {
    const rect: ShapeRecord = {
      id: 'rect-1',
      type: 'rect',
      x: 0,
      y: 0,
      meta: { userRetagged: true },
      props: { width: 1000, height: 300 },
    };
    const scene: Snapshot = { version: 1, shapes: [rect] };

    const result = inferType(rect, scene);
    expect(result).toBeNull();
  });
});
