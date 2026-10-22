import { describe, expect, it } from 'vitest';
import { CanvasEditor } from '../editor.js';
import { lineSegmentIntersectsBounds, StrokeEraserController } from './eraser.js';

describe('lineSegmentIntersectsBounds', () => {
  const box = { x: 50, y: 50, width: 100, height: 100 };

  it('detects intersection when an endpoint is inside the box', () => {
    expect(lineSegmentIntersectsBounds({ x: 60, y: 60 }, { x: 200, y: 200 }, box)).toBe(true);
    expect(lineSegmentIntersectsBounds({ x: 0, y: 0 }, { x: 80, y: 80 }, box)).toBe(true);
  });

  it('detects intersection when line passes through the box', () => {
    // Horizontal cut
    expect(lineSegmentIntersectsBounds({ x: 0, y: 100 }, { x: 200, y: 100 }, box)).toBe(true);
    // Vertical cut
    expect(lineSegmentIntersectsBounds({ x: 100, y: 0 }, { x: 100, y: 200 }, box)).toBe(true);
  });

  it('returns false when line is completely outside the box', () => {
    // Left
    expect(lineSegmentIntersectsBounds({ x: 0, y: 10 }, { x: 40, y: 40 }, box)).toBe(false);
    // Right
    expect(lineSegmentIntersectsBounds({ x: 160, y: 10 }, { x: 200, y: 40 }, box)).toBe(false);
    // Above
    expect(lineSegmentIntersectsBounds({ x: 60, y: 0 }, { x: 80, y: 40 }, box)).toBe(false);
    // Below
    expect(lineSegmentIntersectsBounds({ x: 60, y: 160 }, { x: 80, y: 200 }, box)).toBe(false);
    // Diagonal miss near corner
    expect(lineSegmentIntersectsBounds({ x: 30, y: 60 }, { x: 60, y: 30 }, box)).toBe(false);
  });
});

describe('StrokeEraserController', () => {
  function setup() {
    const editor = new CanvasEditor();
    const eraser = new StrokeEraserController(editor);
    return { editor, eraser };
  }

  it('deletes multiple shapes intersected during a stroke in a single undo transaction', () => {
    const { editor, eraser } = setup();

    const r1 = editor.createShape({ type: 'rect', x: 20, y: 40, props: { width: 20, height: 20 } });
    const r2 = editor.createShape({ type: 'rect', x: 60, y: 40, props: { width: 20, height: 20 } });
    const r3 = editor.createShape({ type: 'rect', x: 100, y: 40, props: { width: 20, height: 20 } });

    eraser.start({ x: 0, y: 50 });
    eraser.move({ x: 50, y: 50 });
    expect(eraser.targets.has(r1.id)).toBe(true);

    eraser.move({ x: 150, y: 50 });
    expect(eraser.targets.has(r1.id)).toBe(true);
    expect(eraser.targets.has(r2.id)).toBe(true);
    expect(eraser.targets.has(r3.id)).toBe(true);

    eraser.end();

    expect(editor.store.getShape(r1.id)).toBeUndefined();
    expect(editor.store.getShape(r2.id)).toBeUndefined();
    expect(editor.store.getShape(r3.id)).toBeUndefined();

    // Single undo restores all 3
    expect(editor.canUndo()).toBe(true);
    editor.undo();
    expect(editor.store.getShape(r1.id)).toBeDefined();
    expect(editor.store.getShape(r2.id)).toBeDefined();
    expect(editor.store.getShape(r3.id)).toBeDefined();
  });

  it('respects frames: erases child shape while leaving parent frame intact', () => {
    const { editor, eraser } = setup();

    const frame = editor.createShape({
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 300, height: 300 },
    });
    const child = editor.createShape({
      type: 'rect',
      x: 50,
      y: 50,
      meta: { parent: frame.id },
      props: { width: 50, height: 50 },
    });

    // Stroke only intersects the child (and geometrically intersects frame)
    eraser.start({ x: 40, y: 75 });
    eraser.move({ x: 110, y: 75 });
    eraser.end();

    expect(editor.store.getShape(child.id)).toBeUndefined();
    expect(editor.store.getShape(frame.id)).toBeDefined();
  });

  it('respects frames: erases frame when header or empty area is hit without touching children', () => {
    const { editor, eraser } = setup();

    const frame = editor.createShape({
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 300, height: 300 },
    });
    const child = editor.createShape({
      type: 'rect',
      x: 100,
      y: 100,
      meta: { parent: frame.id },
      props: { width: 50, height: 50 },
    });

    // Stroke intersects top header of frame (y: 10) far from child (y: 100..150)
    eraser.start({ x: 10, y: 10 });
    eraser.move({ x: 50, y: 10 });
    eraser.end();

    expect(editor.store.getShape(frame.id)).toBeUndefined();
    const remainingChild = editor.store.getShape(child.id);
    expect(remainingChild).toBeDefined();
    expect(remainingChild?.meta['parent']).toBeUndefined();
  });

  it('spares parent frame even if frame was intersected first before child', () => {
    const { editor, eraser } = setup();

    const frame = editor.createShape({
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 200, height: 200 },
    });
    const child = editor.createShape({
      type: 'rect',
      x: 100,
      y: 100,
      meta: { parent: frame.id },
      props: { width: 50, height: 50 },
    });

    // Stroke enters frame at empty area (10, 100), moves into child (120, 100)
    eraser.start({ x: -10, y: 100 });
    eraser.move({ x: 50, y: 100 });
    expect(eraser.targets.has(frame.id)).toBe(true);

    // Moves through child
    eraser.move({ x: 130, y: 100 });
    expect(eraser.targets.has(child.id)).toBe(true);
    expect(eraser.targets.has(frame.id)).toBe(false);

    eraser.end();

    expect(editor.store.getShape(child.id)).toBeUndefined();
    expect(editor.store.getShape(frame.id)).toBeDefined();
  });
});
