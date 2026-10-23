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
});
