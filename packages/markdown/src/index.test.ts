import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import { compile } from './index.js';
import type { Snapshot } from '@open-draw/schema';

const FIXTURES_DIR = new URL('../fixtures', import.meta.url).pathname;

const canonicalScene: Snapshot = {
  version: 1,
  meta: {
    platform: 'web',
    style: 'neubrutalism',
  },
  shapes: [
    {
      id: 'k7w2',
      type: 'rect',
      x: 0,
      y: 0,
      meta: {
        semantic: { type: 'section', name: 'Hero Section' },
      },
      props: { width: 1200, height: 600 },
    },
    {
      id: 'm8q4',
      type: 'text',
      x: 100,
      y: 50,
      meta: {
        parent: 'k7w2',
        semantic: { type: 'heading', name: 'Hero Title' },
      },
      props: { width: 400, height: 60, text: 'Welcome to OpenDraw' },
    },
    {
      id: 'p2r9',
      type: 'rect',
      x: 100,
      y: 150,
      meta: {
        parent: 'k7w2',
        semantic: { type: 'button', name: 'Primary CTA' },
      },
      props: { width: 160, height: 44, text: 'Get Started' },
    },
    {
      id: 'v3x5',
      type: 'rect',
      x: 0,
      y: 650,
      meta: {
        semantic: { type: 'section', name: 'Footer' },
      },
      props: { width: 1200, height: 120 },
    },
  ],
};

function readOrUpdateFixture(filename: string, content: string): string {
  const filepath = `${FIXTURES_DIR}/${filename}`;
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  if (process.env['UPDATE_FIXTURES'] || !fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, content, 'utf-8');
  }
  return fs.readFileSync(filepath, 'utf-8');
}

describe('@open-draw/markdown compiler', () => {
  it('is pure and deterministic: two runs produce byte-identical output', () => {
    const run1 = compile(canonicalScene, { legend: true, designDirection: true });
    const run2 = compile(canonicalScene, { legend: true, designDirection: true });
    expect(run1).toBe(run2);
  });

  it('compiles empty scene matching golden fixture', () => {
    const actual = compile([]);
    const expected = readOrUpdateFixture('empty.md', actual);
    expect(actual).toBe(expected);
  });

  it('compiles basic wireframe matching golden fixture', () => {
    const actual = compile(canonicalScene);
    const expected = readOrUpdateFixture('basic-wireframe.md', actual);
    expect(actual).toBe(expected);
  });

  it('compiles with legend matching golden fixture', () => {
    const actual = compile(canonicalScene, { legend: true });
    const expected = readOrUpdateFixture('with-legend.md', actual);
    expect(actual).toBe(expected);
  });

  it('compiles with design direction matching golden fixture', () => {
    const actual = compile(canonicalScene, { designDirection: true });
    const expected = readOrUpdateFixture('with-design-direction.md', actual);
    expect(actual).toBe(expected);
  });

  it('compiles full spec (legend + design direction) matching golden fixture', () => {
    const actual = compile(canonicalScene, { legend: true, designDirection: true });
    const expected = readOrUpdateFixture('full-spec.md', actual);
    expect(actual).toBe(expected);
  });

  it('uses ADR-006 f(<id>) reference format consistently across sections', () => {
    const spec = compile(canonicalScene, { legend: true });
    expect(spec).toContain('f(k7w2)');
    expect(spec).toContain('f(m8q4)');
    expect(spec).toContain('f(p2r9)');
    expect(spec).toContain('f(v3x5)');
  });

  it('safely handles circular parent references without crashing or infinite recursion', () => {
    const cyclicScene: Snapshot = {
      version: 1,
      shapes: [
        { id: 'c1', type: 'rect', x: 0, y: 0, props: { width: 100, height: 100 }, meta: { parent: 'c2' } },
        { id: 'c2', type: 'rect', x: 0, y: 0, props: { width: 100, height: 100 }, meta: { parent: 'c1' } },
      ],
    };
    const output = compile(cyclicScene);
    expect(output).toContain('f(c1)');
    expect(output).toContain('f(c2)');
  });

  it('emits Format v1.1 version marker and bounds semantics declaration', () => {
    const spec = compile(canonicalScene);
    expect(spec).toContain('<!-- open-draw-spec:v1.1 -->');
    expect(spec).toContain('> **Bounds semantics:**');
  });

  it('emits consumption directives: strict-fidelity by default and creative-allowed when requested', () => {
    const strictSpec = compile(canonicalScene);
    expect(strictSpec).toContain('> **Consumption Directive: strict-fidelity**');
    expect(strictSpec).toContain('Build EXACTLY the elements specified.');

    const creativeSpec = compile(canonicalScene, { directive: 'creative-allowed' });
    expect(creativeSpec).toContain('> **Consumption Directive: creative-allowed**');
    expect(creativeSpec).toContain('Preserve every f(id) identity');
  });

  it('enforces single canonical home: no bounds or names in Screen Structure', () => {
    const spec = compile(canonicalScene, { legend: true });
    const structureSection = spec.split('## Screen Structure')[1]?.split('##')[0] ?? '';
    expect(structureSection).not.toMatch(/\d+×\d+ at \d+,\d+/);
    expect(structureSection).not.toContain('"Hero Section"');
    expect(structureSection).not.toContain('"Hero Title"');

    const legendSection = spec.split('## Element Legend')[1] ?? '';
    expect(legendSection).toContain('`Hero Section`');
    expect(legendSection).toContain('1200×600 at 0,0');
  });

  it('detects and flags untagged shapes in header, structure, and legend (Q-008)', () => {
    const sceneWithUntagged: Snapshot = {
      version: 1,
      shapes: [
        { id: 'u1', type: 'rect', x: 10, y: 20, props: { width: 200, height: 100 } },
        { id: 't1', type: 'text', x: 10, y: 30, props: { width: 100, height: 40, text: 'Hello' }, meta: { semantic: { type: 'text' } } },
      ],
    };
    const spec = compile(sceneWithUntagged, { legend: true });
    expect(spec).toContain('> ⚠ **Untagged Elements:** Shapes f(u1) have no semantic type.');
    expect(spec).toContain('- **[untagged:rect]** f(u1)');
    expect(spec).toContain('| f(u1) | rect *untagged* | — | — | 200×100 at 10,20 |');
  });

  it('filters platform component mappings to only semantic types present in scene', () => {
    const cardTextScene: Snapshot = {
      version: 1,
      meta: { platform: 'web', style: 'neubrutalism' },
      shapes: [
        { id: 'c1', type: 'rect', x: 0, y: 0, props: { width: 400, height: 300 }, meta: { semantic: { type: 'card' } } },
        { id: 't1', type: 'text', x: 20, y: 20, props: { width: 200, height: 30, text: 'Card body' }, meta: { parent: 'c1', semantic: { type: 'text' } } },
      ],
    };
    const spec = compile(cardTextScene, { designDirection: true });
    expect(spec).toContain('| `card` | `<article />` | `column` |');
    expect(spec).toContain('| `text` | `<p />` | — |');
    expect(spec).not.toContain('| `button` |');
    expect(spec).not.toContain('| `page` |');
    expect(spec).not.toContain('| `nav` |');

    const untaggedOnlyScene: Snapshot = {
      version: 1,
      meta: { platform: 'web' },
      shapes: [
        { id: 'r1', type: 'rect', x: 0, y: 0, props: { width: 100, height: 100 } },
      ],
    };
    const untaggedSpec = compile(untaggedOnlyScene, { designDirection: true });
    expect(untaggedSpec).toContain('*No mapped semantic components present in scene.*');
    expect(untaggedSpec).not.toContain('| `button` |');
  });

  it('toggles responsive behavior section via options.responsive', () => {
    const withResp = compile(canonicalScene);
    expect(withResp).toContain('## Responsive Behavior');

    const withoutResp = compile(canonicalScene, { responsive: false });
    expect(withoutResp).not.toContain('## Responsive Behavior');
  });

  it('compiles design direction with new style profiles (e.g. material3, flat-minimal)', () => {
    const m3Scene: Snapshot = {
      version: 1,
      meta: { platform: 'android', style: 'material3' },
      shapes: [
        { id: 'b1', type: 'rect', x: 0, y: 0, props: { width: 120, height: 48 }, meta: { semantic: { type: 'button' } } },
      ],
    };
    const spec = compile(m3Scene, { designDirection: true });
    expect(spec).toContain('- **Visual Style:** `material3`');
    expect(spec).toContain('> **Style Guidance:** M3 themes map via Material Theme Builder');
    expect(spec).toContain('| Palette | `primary` | `#6750a4` |');
    expect(spec).toContain('| Borders | `radius` | `16px` |');
  });

  it('emits scope declaration: component by default and page when page-typed root is present', () => {
    // 1. Scene without page root -> Scope: component
    const componentSpec = compile(canonicalScene);
    expect(componentSpec).toContain('> **Scope: component** — This spec describes a standalone component, not a page.');
    expect(componentSpec).toContain('Deliver only the component itself.');

    // 2. Scene with root shape typed as 'page' -> Scope: page
    const pageScene: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'pg1',
          type: 'frame',
          x: 0,
          y: 0,
          props: { width: 1440, height: 900 },
          meta: { semantic: { type: 'page', name: 'Homepage' } },
        },
      ],
    };
    const pageSpec = compile(pageScene);
    expect(pageSpec).toContain('> **Scope: page** — this scene contains a `page`-typed root; build a complete page.');

    // 3. Child shape typed as 'page' inside another container does NOT trigger page root scope
    const nestedPageScene: Snapshot = {
      version: 1,
      shapes: [
        { id: 'f1', type: 'frame', x: 0, y: 0, props: { width: 500, height: 500 }, meta: { semantic: { type: 'section' } } },
        { id: 'p1', type: 'frame', x: 10, y: 10, props: { width: 400, height: 400 }, meta: { parent: 'f1', semantic: { type: 'page' } } },
      ],
    };
    const nestedSpec = compile(nestedPageScene);
    expect(nestedSpec).toContain('> **Scope: component**');

    // 4. Explicit override: force component on page scene
    const forcedComponent = compile(pageScene, { scope: 'component' });
    expect(forcedComponent).toContain('> **Scope: component**');

    // 5. Explicit override: force page on component scene
    const forcedPage = compile(canonicalScene, { scope: 'page' });
    expect(forcedPage).toContain('> **Scope: page**');
  });
});


