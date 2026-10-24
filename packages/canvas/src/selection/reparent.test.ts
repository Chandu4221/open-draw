import { describe, expect, it } from 'vitest';
import { CameraController } from '../camera.js';
import { ShapeRegistry } from '../registry.js';
import { frameDefinition } from '../shapes/frame/index.js';
import { rectDefinition } from '../shapes/rect/index.js';
import { CanvasStore } from '../store/index.js';
import { handleGestureReparent } from './reparent.js';

describe('handleGestureReparent', () => {
  function setup() {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register(frameDefinition);
    registry.register(rectDefinition);
    const camera = new CameraController();
    return { store, registry, camera };
  }

  it('parents a shape when dropped fully inside a frame', () => {
    const { store, registry, camera } = setup();

    const frame = store.createShape({
      id: 'f1',
      type: 'frame',
      x: 0,
      y: 0,
      meta: {},
      props: { width: 300, height: 300 },
    });

    const rect = store.createShape({
      id: 'r1',
      type: 'rect',
      x: 50,
      y: 50,
      meta: {},
      props: { width: 100, height: 80 },
    });

    handleGestureReparent(rect.id, store, registry, camera);

    const updated = store.getShape(rect.id);
    expect(updated?.meta['parent']).toBe(frame.id);
  });

  it('re-parents a shape from frame A to frame B in a single transaction', () => {
    const { store, registry, camera } = setup();

    const frameA = store.createShape({
      id: 'fa',
      type: 'frame',
      x: 0,
      y: 0,
      meta: {},
      props: { width: 300, height: 300 },
    });

    const frameB = store.createShape({
      id: 'fb',
      type: 'frame',
      x: 400,
      y: 0,
      meta: {},
      props: { width: 300, height: 300 },
    });

    const rect = store.createShape({
      id: 'r1',
      type: 'rect',
      x: 50,
      y: 50,
      meta: { parent: frameA.id },
      props: { width: 100, height: 80 },
    });

    store.beginTransaction();
    store.updateShape(rect.id, { x: 450, y: 50 });
    handleGestureReparent(rect.id, store, registry, camera);
    store.commitTransaction();

    let current = store.getShape(rect.id);
    expect(current?.meta['parent']).toBe(frameB.id);

    // Single undo restores both position and parent A
    store.undo();
    current = store.getShape(rect.id);
    expect(current?.x).toBe(50);
    expect(current?.meta['parent']).toBe(frameA.id);
  });

  it('detaches a shape when dragged outside its frame past threshold', () => {
    const { store, registry, camera } = setup();

    const frame = store.createShape({
      id: 'f1',
      type: 'frame',
      x: 0,
      y: 0,
      meta: {},
      props: { width: 200, height: 200 },
    });

    const rect = store.createShape({
      id: 'r1',
      type: 'rect',
      x: 500, // dragged far out to empty canvas
      y: 500,
      meta: { parent: frame.id },
      props: { width: 50, height: 50 },
    });

    handleGestureReparent(rect.id, store, registry, camera);

    const current = store.getShape(rect.id);
    expect(current?.meta['parent']).toBeUndefined();
  });

  it('overlapping frames: smallest area candidate wins', () => {
    const { store, registry, camera } = setup();

    const largeFrame = store.createShape({
      id: 'f-big',
      type: 'frame',
      x: 0,
      y: 0,
      meta: {},
      props: { width: 500, height: 500 },
    });

    const smallFrame = store.createShape({
      id: 'f-small',
      type: 'frame',
      x: 50,
      y: 50,
      meta: {},
      props: { width: 200, height: 200 },
    });

    const rect = store.createShape({
      id: 'r1',
      type: 'rect',
      x: 60,
      y: 60,
      meta: {},
      props: { width: 50, height: 50 },
    });

    handleGestureReparent(rect.id, store, registry, camera);

    const current = store.getShape(rect.id);
    expect(current?.meta['parent']).toBe(smallFrame.id);
    expect(largeFrame.id).not.toBe(smallFrame.id);
  });

  it('auto-grows frame bounds when dropped partially outside and reverts both on undo (§7.5)', () => {
    const { store, registry, camera } = setup();

    const frame = store.createShape({
      id: 'f1',
      type: 'frame',
      x: 0,
      y: 0,
      meta: {},
      props: { width: 200, height: 200 },
    });

    const rect = store.createShape({
      id: 'r1',
      type: 'rect',
      x: 150,
      y: 150,
      meta: {},
      props: { width: 100, height: 100 },
    });

    handleGestureReparent(rect.id, store, registry, camera);

    const updatedRect = store.getShape(rect.id);
    expect(updatedRect?.meta['parent']).toBe(frame.id);

    const updatedFrame = store.getShape(frame.id);
    expect(updatedFrame?.x).toBe(0);
    expect(updatedFrame?.y).toBe(0);
    expect(updatedFrame?.props['width']).toBe(250);
    expect(updatedFrame?.props['height']).toBe(250);

    // Single undo reverts BOTH the growth and reparenting
    store.undo();

    const revertedRect = store.getShape(rect.id);
    expect(revertedRect?.meta['parent']).toBeUndefined();

    const revertedFrame = store.getShape(frame.id);
    expect(revertedFrame?.props['width']).toBe(200);
    expect(revertedFrame?.props['height']).toBe(200);
  });
});

