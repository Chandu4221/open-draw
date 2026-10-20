import type { Camera, Point, ShapeId, ShapeRecord, Snapshot } from '@open-draw/schema';
import { CameraController, type ZoomOptions } from './camera.js';
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

  private container: HTMLElement | null = null;
  private svgElement: SVGSVGElement | null = null;
  private viewportGroup: SVGGElement | null = null;
  private shapesGroup: SVGGElement | null = null;

  constructor(options: CanvasEditorOptions = {}) {
    this.options = options;
    this.store = new CanvasStore();
    this.camera = new CameraController();
  }

  mount(container: HTMLElement): void {
    this.container = container;
  }

  destroy(): void {
    if (this.svgElement && this.container) {
      this.container.removeChild(this.svgElement);
    }
    this.container = null;
    this.svgElement = null;
    this.viewportGroup = null;
    this.shapesGroup = null;
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

  loadSnapshot(snapshot: Snapshot): void {
    this.store.loadSnapshot(snapshot);
    if (snapshot.camera) {
      this.camera.setCamera(snapshot.camera);
    }
  }

  getSnapshot(): Snapshot {
    return this.store.getSnapshot();
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
   * In Phase 2 Step B4, this starts as a stub returning null to verify the failing spec first.
   */
  getOverlaySlot(id: ShapeId): SVGGElement | null {
    void id;
    return null;
  }
}
