import { describe, it, expect } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import type { ShapeDefinition } from './registry.js';
import { computeShapeAria } from './a11y.js';

describe('computeShapeAria', () => {
  it('assigns role="button" to atomic shapes without container capabilities', () => {
    const rect: ShapeRecord = {
      id: 'rect-1' as any,
      type: 'rect',
      x: 0,
      y: 0,
      props: { width: 100, height: 100 },
      meta: {},
    };
    const { role, ariaLabel } = computeShapeAria(rect);
    expect(role).toBe('button');
    expect(ariaLabel).toBe('rect');
  });

  it('assigns role="group" to container shapes (clipping or group capability)', () => {
    const frame: ShapeRecord = {
      id: 'frame-1' as any,
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 400, height: 300 },
      meta: {},
    };
    const frameDef: ShapeDefinition<any> = {
      type: 'frame',
      defaultProps: () => ({}),
      geometry: {} as any,
      render: () => [] as any,
      capabilities: {
        clipping: {
          getClipPath: () => null,
          isMask: () => true,
        },
      },
    };

    const group: ShapeRecord = {
      id: 'group-1' as any,
      type: 'group',
      x: 0,
      y: 0,
      props: {},
      meta: {},
    };
    const groupDef: ShapeDefinition<any> = {
      type: 'group',
      defaultProps: () => ({}),
      geometry: {} as any,
      render: () => [] as any,
      capabilities: {
        group: {
          isGroup: true,
        },
      },
    };

    expect(computeShapeAria(frame, frameDef).role).toBe('group');
    expect(computeShapeAria(group, groupDef).role).toBe('group');
  });

  it('formats aria-label with meta.name when present', () => {
    const rect: ShapeRecord = {
      id: 'rect-1' as any,
      type: 'rect',
      x: 0,
      y: 0,
      props: {},
      meta: { name: 'Alpha' },
    };
    expect(computeShapeAria(rect).ariaLabel).toBe('rect Alpha');
  });

  it('incorporates visible text into accessible name for text/note shapes', () => {
    const text: ShapeRecord = {
      id: 'text-1' as any,
      type: 'text',
      x: 0,
      y: 0,
      props: { text: 'Hello World' },
      meta: { name: 'Greeting' },
    };
    const textDef: ShapeDefinition<any> = {
      type: 'text',
      defaultProps: () => ({}),
      geometry: {} as any,
      render: () => [] as any,
      capabilities: {
        text: {
          canEditText: () => true,
          getText: (s) => s.props['text'] as string,
          setText: () => ({}),
        },
      },
    };
    const { ariaLabel } = computeShapeAria(text, textDef);
    expect(ariaLabel).toBe('Hello World (text Greeting)');
  });

  it('incorporates visible text when meta.name is absent', () => {
    const text: ShapeRecord = {
      id: 'text-1' as any,
      type: 'text',
      x: 0,
      y: 0,
      props: { text: 'Heading' },
      meta: {},
    };
    expect(computeShapeAria(text).ariaLabel).toBe('Heading (text)');
  });

  it('incorporates visible label for frame containers', () => {
    const frame: ShapeRecord = {
      id: 'frame-1' as any,
      type: 'frame',
      x: 0,
      y: 0,
      props: { label: 'Main Artboard' },
      meta: { name: 'Artboard 1' },
    };
    const frameDef: ShapeDefinition<any> = {
      type: 'frame',
      defaultProps: () => ({}),
      geometry: {} as any,
      render: () => [] as any,
      capabilities: {
        clipping: {
          getClipPath: () => null,
          isMask: () => true,
        },
      },
    };
    const { role, ariaLabel } = computeShapeAria(frame, frameDef);
    expect(role).toBe('group');
    expect(ariaLabel).toBe('Main Artboard (frame Artboard 1)');
  });
});
