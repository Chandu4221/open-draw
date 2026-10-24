import { describe, expect, it } from 'vitest';
import { CanvasEditor } from '@open-draw/canvas';
import { isContainerShape, computeContainerReadout } from './responsive-readout.js';

describe('Responsive Readout (§7.4)', () => {
  it('identifies container shapes vs leaf shapes correctly', () => {
    expect(isContainerShape({ id: '1', type: 'frame', x: 0, y: 0, props: {}, meta: {} })).toBe(true);
    expect(isContainerShape({ id: '2', type: 'group', x: 0, y: 0, props: {}, meta: {} })).toBe(true);
    expect(isContainerShape({ id: '3', type: 'rect', x: 0, y: 0, props: {}, meta: { semantic: { type: 'card' } } })).toBe(true);
    expect(isContainerShape({ id: '4', type: 'rect', x: 0, y: 0, props: {}, meta: { semantic: { type: 'row' } } })).toBe(true);
    expect(isContainerShape({ id: '5', type: 'rect', x: 0, y: 0, props: {}, meta: { semantic: { type: 'button' } } })).toBe(false);
    expect(isContainerShape({ id: '6', type: 'text', x: 0, y: 0, props: {}, meta: { semantic: { type: 'text' } } })).toBe(false);
  });

  it('reports "no children — nothing to reflow" for empty container', () => {
    const editor = new CanvasEditor();
    const frame = editor.store.createShape({
      id: 'f1',
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 400, height: 300 },
      meta: {},
    });

    const readout = computeContainerReadout(editor, frame, 'web');
    expect(readout.length).toBeGreaterThan(0);
    expect(readout[0]?.text).toBe('no children — nothing to reflow');
  });

  it('reports responsive behavior matching platform profile breakpoints', () => {
    const editor = new CanvasEditor();
    const frame = editor.store.createShape({
      id: 'sec',
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 1000, height: 500 },
      meta: { semantic: { type: 'section' } },
    });

    // Add 2 side-by-side columns that reflow on mobile
    editor.store.createShape({
      id: 'c1',
      type: 'rect',
      x: 20,
      y: 20,
      props: { width: 460, height: 400 },
      meta: { parent: 'sec', semantic: { type: 'column' } },
    });
    editor.store.createShape({
      id: 'c2',
      type: 'rect',
      x: 500,
      y: 20,
      props: { width: 460, height: 400 },
      meta: { parent: 'sec', semantic: { type: 'column' } },
    });

    const webReadout = computeContainerReadout(editor, frame, 'web');
    expect(webReadout[0]?.label).toContain('Mobile');
    expect(webReadout[0]?.text).toContain('children stack vertically');

    const androidReadout = computeContainerReadout(editor, frame, 'android');
    expect(androidReadout[0]?.label).toContain('Compact Phone');

    const flutterReadout = computeContainerReadout(editor, frame, 'flutter');
    expect(flutterReadout[0]?.label).toContain('Compact Mobile');
  });
});
