import type { Camera, Point, ShapeId, ShapeRecord, Snapshot } from '@open-draw/schema';
import { CameraController, type ZoomOptions } from './camera.js';
import { SVGRenderer } from './renderer.js';
import { CanvasStore } from './store.js';

export interface CanvasEditorOptions {
  readonly readonly?: boolean;
}

/**
 * OpenDraw Canvas Editor
 * Manages canvas rendering, camera state, and shape lifecycle in a single root SVG.
 */
export class CanvasEditor {
  readonly store: CanvasStore;
  readonly camera: CameraController;
  readonly options: CanvasEditorOptions;
  readonly renderer: SVGRenderer;

  private isMounted = false;
  private unsubscribeCamera: (() => void) | null = null;
  private unsubscribeStore: (() => void) | null = null;

  constructor(options: CanvasEditorOptions = {}) {
    this.options = options;
    this.store = new CanvasStore();
    this.camera = new CameraController();
    this.renderer = new SVGRenderer();
  }

  mount(container: HTMLElement): void {
    if (this.isMounted) {
      return;
    }
    this.isMounted = true;
    this.renderer.mount(container, this.camera.camera);
    this.renderer.renderAll(this.store.listShapes());

    this.unsubscribeCamera = this.camera.subscribe((cam) => {
      this.renderer.updateCamera(cam);
    });

    this.unsubscribeStore = this.store.listen((diff) => {
      this.renderer.applyDiff(diff, this.store);
    });
  }

  destroy(): void {
    if (this.unsubscribeCamera) {
      this.unsubscribeCamera();
      this.unsubscribeCamera = null;
    }
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
    this.renderer.destroy();
    this.isMounted = false;
  }

  createShape(record: Partial<ShapeRecord> & { type: string }): ShapeRecord {
    const id = record.id ?? `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const x = record.x ?? 0;
    const y = record.y ?? 0;
    return this.store.createShape({
      ...record,
      id,
      x,
      y,
      type: record.type,
      meta: record.meta ?? {},
      props: record.props ?? {},
    });
  }

  getShape(id: ShapeId): ShapeRecord | undefined {
    return this.store.getShape(id);
  }

  updateShape(id: ShapeId, patch: Partial<Omit<ShapeRecord, 'id'>>): ShapeRecord {
    return this.store.updateShape(id, patch);
  }

  deleteShape(id: ShapeId): void {
    this.store.deleteShape(id);
  }

  loadSnapshot(snapshot: Snapshot): void {
    this.store.loadSnapshot(snapshot);
    if (snapshot.camera) {
      this.camera.setCamera(snapshot.camera);
    }
    if (this.isMounted) {
      this.renderer.renderAll(this.store.listShapes());
    }
  }

  getSnapshot(): Snapshot {
    return {
      ...this.store.getSnapshot(),
      camera: this.camera.camera,
    };
  }

  pan(dx: number, dy: number): Camera {
    return this.camera.pan(dx, dy);
  }

  zoomAroundPoint(screenPoint: Point, factor: number, options?: ZoomOptions): Camera {
    return this.camera.zoomAroundPoint(screenPoint, factor, options);
  }

  setCamera(camera: Camera): void {
    this.camera.setCamera(camera);
  }

  /**
   * Returns the overlay slot element for the specified shape.
   * Overlay slot is a physical DOM child of the shape wrapper group.
   */
  getOverlaySlot(id: ShapeId): SVGGElement | null {
    return this.renderer.getOverlaySlot(id);
  }

  getShapeWrapper(id: ShapeId): SVGGElement | null {
    return this.renderer.getShapeWrapper(id);
  }
}
