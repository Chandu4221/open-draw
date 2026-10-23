import { beforeAll, describe, expect, it } from 'vitest';
import { CanvasEditor } from './editor.js';
import { PointerInteractionController } from './interaction.js';

beforeAll(() => {
  if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = new EventTarget();
  }
});

class MockElement extends EventTarget {
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => {} };
  }
  querySelector() {
    return null;
  }
}

function dispatchPointerDown(target: EventTarget, clientX: number, clientY: number, shiftKey = false, button = 0): void {
  const ev = Object.assign(new Event('pointerdown'), {
    clientX,
    clientY,
    shiftKey,
    button,
  });
  target.dispatchEvent(ev);
}

function dispatchWheel(target: EventTarget, deltaX: number, deltaY: number, ctrlKey = false, shiftKey = false): Event {
  const ev = Object.assign(new Event('wheel', { cancelable: true }), {
    deltaX,
    deltaY,
    clientX: 200,
    clientY: 150,
    ctrlKey,
    shiftKey,
  });
  target.dispatchEvent(ev);
  return ev;
}

function dispatchPointerMove(clientX: number, clientY: number, shiftKey = false): void {
  const ev = Object.assign(new Event('pointermove'), {
    clientX,
    clientY,
    shiftKey,
  });
  window.dispatchEvent(ev);
}

function dispatchPointerUp(clientX: number, clientY: number): void {
  const ev = Object.assign(new Event('pointerup'), {
    clientX,
    clientY,
  });
  window.dispatchEvent(ev);
}

describe('Drag-to-Draw Shape Creation', () => {
  it('single click without drag does not create shape and reverts to select tool', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('rect');
    dispatchPointerDown(container, 100, 100);
    dispatchPointerUp(100, 100);

    const shapes = editor.store.listShapes();
    expect(shapes).toHaveLength(0);
    expect(editor.getTool()).toBe('select');
    expect(editor.selection).toHaveLength(0);

    controller.detach();
  });

  it('pointer movement <= 3px is treated as click and does not create shape', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('rect');
    dispatchPointerDown(container, 100, 100);
    dispatchPointerMove(102, 101); // hypot = sqrt(4 + 1) = 2.23 <= 3
    dispatchPointerUp(102, 101);

    expect(editor.store.listShapes()).toHaveLength(0);
    expect(editor.getTool()).toBe('select');

    controller.detach();
  });

  it('click and drag expands shape bounds in real-time', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('rect');
    dispatchPointerDown(container, 50, 50);
    dispatchPointerMove(300, 200);

    let shapes = editor.store.listShapes();
    expect(shapes).toHaveLength(1);
    let rect = shapes[0]!;
    expect(rect.x).toBe(50);
    expect(rect.y).toBe(50);
    expect(rect.props.width).toBe(250);
    expect(rect.props.height).toBe(150);

    dispatchPointerUp(300, 200);

    shapes = editor.store.listShapes();
    rect = shapes[0]!;
    expect(rect.x).toBe(50);
    expect(rect.y).toBe(50);
    expect(rect.props.width).toBe(250);
    expect(rect.props.height).toBe(150);
    expect(editor.getTool()).toBe('select');
    expect(editor.isSelected(rect.id)).toBe(true);

    controller.detach();
  });

  it('dragging backwards (up and left) correctly normalizes bounds', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('rect');
    dispatchPointerDown(container, 400, 300);
    dispatchPointerMove(150, 100);
    dispatchPointerUp(150, 100);

    const rect = editor.store.listShapes()[0]!;
    expect(rect.x).toBe(150);
    expect(rect.y).toBe(100);
    expect(rect.props.width).toBe(250);
    expect(rect.props.height).toBe(200);

    controller.detach();
  });

  it('holding shift constrains dragged shape to 1:1 aspect ratio', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('ellipse');
    dispatchPointerDown(container, 100, 100);
    dispatchPointerMove(300, 200, true); // shiftKey = true: width 200, height 100 -> constrained to 200x200
    dispatchPointerUp(300, 200);

    const ellipse = editor.store.listShapes()[0]!;
    expect(ellipse.props.width).toBe(200);
    expect(ellipse.props.height).toBe(200);

    controller.detach();
  });

  it('dragging an arrow sets its start and end points dynamically', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('arrow');
    dispatchPointerDown(container, 50, 50);
    dispatchPointerMove(250, 180);
    dispatchPointerUp(250, 180);

    const arrow = editor.store.listShapes()[0]!;
    expect(arrow.props.startPoint).toEqual({ x: 50, y: 50 });
    expect(arrow.props.endPoint).toEqual({ x: 250, y: 180 });

    controller.detach();
  });

  it('automatically suggests parent when dragging shape inside a frame', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    const frame = editor.createShape({
      type: 'frame',
      x: 0,
      y: 0,
      props: { width: 600, height: 600 },
    });

    editor.setTool('rect');
    dispatchPointerDown(container, 50, 50);
    dispatchPointerMove(200, 150);
    dispatchPointerUp(200, 150);

    const rect = editor.store.getShape(editor.selection[0]!);
    expect(rect?.meta?.parent).toBe(frame.id);

    controller.detach();
  });

  it('undo after drag-to-draw completely removes the shape in a single step', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    editor.setTool('rect');
    dispatchPointerDown(container, 50, 50);
    dispatchPointerMove(150, 150);
    dispatchPointerMove(250, 200);
    dispatchPointerUp(250, 200);

    expect(editor.store.listShapes()).toHaveLength(1);
    expect(editor.canUndo()).toBe(true);

    // Single undo must remove the created shape
    editor.undo();
    expect(editor.store.listShapes()).toHaveLength(0);

    // Redo restores the shape at its final dragged size
    expect(editor.canRedo()).toBe(true);
    editor.redo();
    expect(editor.store.listShapes()).toHaveLength(1);
    const restored = editor.store.listShapes()[0]!;
    expect(restored.props.width).toBe(200);
    expect(restored.props.height).toBe(150);

    controller.detach();
  });
});
