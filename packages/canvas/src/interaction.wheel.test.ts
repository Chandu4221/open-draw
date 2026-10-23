import { beforeAll, describe, expect, it } from 'vitest';
import { CanvasEditor } from './editor.js';
import { PointerInteractionController } from './interaction.js';

beforeAll(() => {
  if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = new EventTarget();
  }
});

class MockElement extends EventTarget {
  style: Record<string, string> = {};
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => {} };
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

function dispatchPointerMove(clientX: number, clientY: number): void {
  const ev = Object.assign(new Event('pointermove'), {
    clientX,
    clientY,
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

describe('Wheel Zoom, Pan & Middle-Mouse Grab-Pan (§0.1)', () => {
  it('ctrlKey + wheel zooms around cursor point and prevents default', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    const initialZoom = editor.camera.zoom;
    const ev = dispatchWheel(container, 0, -100, true);

    expect(ev.defaultPrevented).toBe(true);
    expect(editor.camera.zoom).toBeGreaterThan(initialZoom);

    controller.detach();
  });

  it('plain wheel pans camera and prevents default without changing zoom', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    const initialZoom = editor.camera.zoom;
    const ev = dispatchWheel(container, 50, 80, false);

    expect(ev.defaultPrevented).toBe(true);
    expect(editor.camera.zoom).toBe(initialZoom);
    expect(editor.camera.x).toBe(-50);
    expect(editor.camera.y).toBe(-80);

    controller.detach();
  });

  it('shiftKey + wheel pans horizontally', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    const initialZoom = editor.camera.zoom;
    const ev = dispatchWheel(container, 0, 60, false, true);

    expect(ev.defaultPrevented).toBe(true);
    expect(editor.camera.zoom).toBe(initialZoom);
    expect(editor.camera.x).toBe(-60);
    expect(editor.camera.y).toBe(0);

    controller.detach();
  });

  it('middle mouse drag (button 1) grab-pans the canvas', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);

    dispatchPointerDown(container, 100, 100, false, 1);
    expect(container.style.cursor).toBe('grabbing');

    dispatchPointerMove(160, 140);
    expect(editor.camera.x).toBe(60);
    expect(editor.camera.y).toBe(40);

    dispatchPointerUp(160, 140);
    expect(container.style.cursor).toBe('');

    controller.detach();
  });

  it('wheel after detach does not mutate camera', () => {
    const editor = new CanvasEditor();
    const controller = new PointerInteractionController(editor);
    const container = new MockElement() as any;
    controller.attach(container);
    controller.detach();

    const zoomBefore = editor.camera.zoom;
    dispatchWheel(container, 0, -100, true);
    expect(editor.camera.zoom).toBe(zoomBefore);
  });
});
