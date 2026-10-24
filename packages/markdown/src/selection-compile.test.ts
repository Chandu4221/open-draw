import { describe, expect, it } from 'vitest';
import type { Snapshot } from '@open-draw/schema';
import { compile } from './compiler.js';

describe('Selection-Scoped Compile (§7.2)', () => {
  const multiScene: Snapshot = {
    version: 1,
    shapes: [
      {
        id: 'frame-a',
        type: 'frame',
        x: 0,
        y: 0,
        props: { width: 400, height: 400 },
        meta: { semantic: { type: 'section', name: 'Header Section' } },
      },
      {
        id: 'child-a1',
        type: 'rect',
        x: 10,
        y: 10,
        props: { width: 100, height: 40, text: 'Login' },
        meta: { parent: 'frame-a', semantic: { type: 'button', name: 'Login Button' } },
      },
      {
        id: 'child-a2',
        type: 'rect',
        x: 120,
        y: 10,
        props: { width: 100, height: 40, text: 'Register' },
        meta: { parent: 'frame-a', semantic: { type: 'button', name: 'Register Button' } },
      },
      {
        id: 'frame-b',
        type: 'frame',
        x: 500,
        y: 0,
        props: { width: 400, height: 400 },
        meta: { semantic: { type: 'card', name: 'Content Card' } },
      },
      {
        id: 'child-b1',
        type: 'rect',
        x: 510,
        y: 10,
        props: { width: 200, height: 30, text: 'Title' },
        meta: { parent: 'frame-b', semantic: { type: 'heading', name: 'Card Title' } },
      },
      {
        id: 'unparented-shape',
        type: 'rect',
        x: 1000,
        y: 1000,
        props: { width: 50, height: 50 },
        meta: {}, // untagged
      },
    ],
  };

  it('compiles selection of a single shape', () => {
    const spec = compile(multiScene, { shapeIds: ['child-a1'], legend: true });
    expect(spec).toContain('- **[button]** f(child-a1) text: "Login"');
    expect(spec).not.toContain('f(frame-a)');
    expect(spec).not.toContain('f(child-a2)');
    expect(spec).not.toContain('f(frame-b)');
    expect(spec).toContain('> **Scope: component**');
    expect(spec).toContain('| f(child-a1) | `button` | `Login Button` | — |');
  });

  it('compiles siblings from different frames as independent tree roots', () => {
    const spec = compile(multiScene, { shapeIds: ['child-a1', 'child-b1'] });
    // Both children had parents, but their parents are not in the selection set, so both become roots
    expect(spec).toContain('- **[button]** f(child-a1) text: "Login"');
    expect(spec).toContain('- **[heading]** f(child-b1) text: "Title"');
    expect(spec).not.toContain('f(frame-a)');
    expect(spec).not.toContain('f(frame-b)');
  });

  it('omits unselected children when only parent is selected without warning', () => {
    const spec = compile(multiScene, { shapeIds: ['frame-a'] });
    expect(spec).toContain('- **[section]** f(frame-a)');
    expect(spec).not.toContain('f(child-a1)');
    expect(spec).not.toContain('f(child-a2)');
    expect(spec).not.toContain('⚠ **Untagged Elements:**');
  });

  it('preserves hierarchy among selected parent and selected children', () => {
    const spec = compile(multiScene, { shapeIds: ['frame-a', 'child-a1'] });
    expect(spec).toContain('- **[section]** f(frame-a)');
    expect(spec).toContain('  - **[button]** f(child-a1) text: "Login"');
    expect(spec).not.toContain('f(child-a2)');
  });

  it('deduces Scope: page when selection contains a page-typed element', () => {
    const sceneWithPage: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'p1',
          type: 'frame',
          x: 0,
          y: 0,
          props: { width: 1440, height: 900 },
          meta: { semantic: { type: 'page', name: 'Main Page' } },
        },
        {
          id: 'card1',
          type: 'rect',
          x: 10,
          y: 10,
          props: { width: 300, height: 200 },
          meta: { parent: 'p1', semantic: { type: 'card', name: 'Summary' } },
        },
      ],
    };

    const specPage = compile(sceneWithPage, { shapeIds: ['p1', 'card1'] });
    expect(specPage).toContain('> **Scope: page**');

    const specComponent = compile(sceneWithPage, { shapeIds: ['card1'] });
    expect(specComponent).toContain('> **Scope: component**');
  });

  it('restricts untagged warning strictly to selected shapes', () => {
    // When unparented-shape (untagged) is NOT in selection, no untagged warning
    const spec1 = compile(multiScene, { shapeIds: ['child-a1'] });
    expect(spec1).not.toContain('⚠ **Untagged Elements:**');

    // When unparented-shape IS in selection, warning appears
    const spec2 = compile(multiScene, { shapeIds: ['unparented-shape'] });
    expect(spec2).toContain('⚠ **Untagged Elements:** Shapes f(unparented-shape)');
  });

  it('produces byte-stable output matching selection-compile-v1.1 fixture', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const output = compile(multiScene, {
      title: 'Selection Compile Spec',
      shapeIds: ['frame-a', 'child-a1'],
      legend: true,
      responsive: true,
      directive: 'strict-fidelity',
    });

    const fixturePath = path.resolve(__dirname, '../fixtures/selection-compile-v1.1.md');
    if (!fs.existsSync(fixturePath)) {
      fs.writeFileSync(fixturePath, output, 'utf-8');
    } else {
      const existing = fs.readFileSync(fixturePath, 'utf-8');
      expect(output).toBe(existing);
    }
  });
});

