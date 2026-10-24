import { describe, expect, it } from 'vitest';
import { CanvasEditor } from '@open-draw/canvas';
import { assignParentWithGrowth } from './grow-on-assign.js';

describe('assignParentWithGrowth (§7.5)', () => {
  it('auto-grows parent frame bounds to union and reverts both atomically on undo', () => {
    const editor = new CanvasEditor();

    // Create a frame at (100, 100, 300, 200)
    const frame = editor.store.createShape({
      id: 'f1',
      type: 'frame',
      x: 100,
      y: 100,
      props: { width: 300, height: 200 },
      meta: {},
    });

    // Create a rect outside/partially outside at (350, 250, 100, 100)
    const rect = editor.store.createShape({
      id: 'r1',
      type: 'rect',
      x: 350,
      y: 250,
      props: { width: 100, height: 100 },
      meta: {},
    });

    assignParentWithGrowth(editor, rect.id, frame.id);

    // Frame should grow to contain (100, 100) to (450, 350) => x: 100, y: 100, w: 350, h: 250
    const updatedFrame = editor.store.getShape(frame.id);
    expect(updatedFrame?.x).toBe(100);
    expect(updatedFrame?.y).toBe(100);
    expect(updatedFrame?.props['width']).toBe(350);
    expect(updatedFrame?.props['height']).toBe(250);

    const updatedRect = editor.store.getShape(rect.id);
    expect(updatedRect?.meta['parent']).toBe(frame.id);

    // Atomic undo test: ONE undo step reverts both
    editor.store.undo();

    const revertedFrame = editor.store.getShape(frame.id);
    expect(revertedFrame?.props['width']).toBe(300);
    expect(revertedFrame?.props['height']).toBe(200);

    const revertedRect = editor.store.getShape(rect.id);
    expect(revertedRect?.meta['parent']).toBeUndefined();
  });

  it('cascades growth to outer ancestor frames', () => {
    const editor = new CanvasEditor();

    // Outer frame (0, 0, 500, 500)
    const outer = editor.store.createShape({
      id: 'outer',
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 500, height: 500 },
      meta: {},
    });

    // Inner frame (50, 50, 200, 200) inside outer
    const inner = editor.store.createShape({
      id: 'inner',
      type: 'frame',
      x: 50,
      y: 50,
      props: { width: 200, height: 200 },
      meta: { parent: outer.id },
    });

    // Rect at (400, 400, 200, 200) assigned to inner
    const rect = editor.store.createShape({
      id: 'r1',
      type: 'rect',
      x: 400,
      y: 400,
      props: { width: 200, height: 200 },
      meta: {},
    });

    assignParentWithGrowth(editor, rect.id, inner.id);

    // Inner should grow from (50, 50, 200, 200) to union with rect (400, 400, 200, 200)
    // Union: minX=50, minY=50, maxX=600, maxY=600 => width: 550, height: 550
    const updatedInner = editor.store.getShape(inner.id);
    expect(updatedInner?.x).toBe(50);
    expect(updatedInner?.y).toBe(50);
    expect(updatedInner?.props['width']).toBe(550);
    expect(updatedInner?.props['height']).toBe(550);

    // Outer frame also cascaded growth from 500 to 600
    const updatedOuter = editor.store.getShape(outer.id);
    expect(updatedOuter?.props['width']).toBe(600);
    expect(updatedOuter?.props['height']).toBe(600);
  });
});
