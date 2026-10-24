import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Snapshot } from '@open-draw/schema';
import { compile } from './compiler.js';

describe('Kitchen-Sink Semantic Spec Fixture (§7.1.6)', () => {
  const kitchenSinkScene: Snapshot = {
    version: 1,
    meta: {
      platform: 'web',
      style: 'neubrutalism',
    },
    shapes: [
      {
        id: 'pg1',
        type: 'frame',
        x: 0,
        y: 0,
        props: { width: 1440, height: 900 },
        meta: { semantic: { type: 'page', name: 'Dashboard' } },
      },
      {
        id: 'sec1',
        type: 'frame',
        x: 20,
        y: 20,
        props: { width: 1400, height: 750 },
        meta: { parent: 'pg1', semantic: { type: 'section', name: 'Content Area' } },
      },
      {
        id: 'card1',
        type: 'rect',
        x: 40,
        y: 40,
        props: { width: 400, height: 300 },
        meta: { parent: 'sec1', semantic: { type: 'card', name: 'User Profile' } },
      },
      {
        id: 'inp1',
        type: 'rect',
        x: 60,
        y: 60,
        props: { width: 300, height: 40, text: 'Search users...' },
        meta: { parent: 'card1', semantic: { type: 'input', name: 'Search Field' } },
      },
      {
        id: 'badge1',
        type: 'rect',
        x: 60,
        y: 120,
        props: { width: 80, height: 24, text: 'Active' },
        meta: { parent: 'card1', semantic: { type: 'badge', name: 'Status Badge' } },
      },
      {
        id: 'div1',
        type: 'rect',
        x: 60,
        y: 160,
        props: { width: 360, height: 2 },
        meta: { parent: 'card1', semantic: { type: 'divider', name: 'Separator' } },
      },
      {
        id: 'list1',
        type: 'frame',
        x: 460,
        y: 40,
        props: { width: 400, height: 300 },
        meta: { parent: 'sec1', semantic: { type: 'list', name: 'Activity Feed' } },
      },
      {
        id: 'tbl1',
        type: 'frame',
        x: 880,
        y: 40,
        props: { width: 500, height: 300 },
        meta: { parent: 'sec1', semantic: { type: 'table', name: 'Analytics Table' } },
      },
      {
        id: 'foot1',
        type: 'frame',
        x: 20,
        y: 800,
        props: { width: 1400, height: 80 },
        meta: { parent: 'pg1', semantic: { type: 'footer', name: 'App Footer' } },
      },
    ],
  };

  it('compiles kitchen-sink scene containing form control, badge, list, table, divider, footer', () => {
    const output = compile(kitchenSinkScene, {
      title: 'Kitchen Sink Specification',
      legend: true,
      designDirection: true,
      responsive: true,
      directive: 'strict-fidelity',
      platform: 'web',
    });

    // Verify key sections and items
    expect(output).toContain('<!-- open-draw-spec:v1.1 -->');
    expect(output).toContain('> **Scope: page**');
    expect(output).toContain('- **[page]** f(pg1)');
    expect(output).toContain('  - **[section]** f(sec1)');
    expect(output).toContain('    - **[card]** f(card1)');
    expect(output).toContain('      - **[input]** f(inp1) text: "Search users..."');
    expect(output).toContain('      - **[badge]** f(badge1) text: "Active"');
    expect(output).toContain('      - **[divider]** f(div1)');
    expect(output).toContain('    - **[list]** f(list1)');
    expect(output).toContain('    - **[table]** f(tbl1)');
    expect(output).toContain('  - **[footer]** f(foot1)');

    // Verify platform mappings table has the new elements
    expect(output).toContain('| `badge` | `<span />` | — | `status` |');
    expect(output).toContain('| `divider` | `<hr />` | — | `separator` |');
    expect(output).toContain('| `footer` | `<footer />` | `row` | `contentinfo` |');
    expect(output).toContain('| `input` | `<input />` | — | `textbox` |');
    expect(output).toContain('| `list` | `<ul />` | `column` | `list` |');
    expect(output).toContain('| `table` | `<table />` | `column` | `table` |');

    // Fixture file pin
    const fixturePath = path.resolve(__dirname, '../fixtures/kitchen-sink-v1.1.md');
    if (!fs.existsSync(fixturePath)) {
      fs.writeFileSync(fixturePath, output, 'utf-8');
    } else {
      const existing = fs.readFileSync(fixturePath, 'utf-8');
      expect(output).toBe(existing);
    }
  });

  it('compiles kitchen-sink across Android and Flutter platforms with verified component mappings', () => {
    const androidOutput = compile(kitchenSinkScene, {
      legend: true,
      designDirection: true,
      platform: 'android',
    });
    expect(androidOutput).toContain('| `badge` | `<Badge />` | — | `status` |');
    expect(androidOutput).toContain('| `input` | `<OutlinedTextField />` | — | `textbox` |');
    expect(androidOutput).toContain('| `divider` | `<HorizontalDivider />` | — | `separator` |');
    expect(androidOutput).toContain('| `footer` | `<BottomAppBar />` | `row` | `contentinfo` |');

    const flutterOutput = compile(kitchenSinkScene, {
      legend: true,
      designDirection: true,
      platform: 'flutter',
    });
    expect(flutterOutput).toContain('| `badge` | `<Badge />` | — | `status` |');
    expect(flutterOutput).toContain('| `input` | `<TextField />` | — | `textbox` |');
    expect(flutterOutput).toContain('| `divider` | `<Divider />` | — | `separator` |');
    expect(flutterOutput).toContain('| `footer` | `<BottomAppBar />` | `row` | `contentinfo` |');
  });
});
