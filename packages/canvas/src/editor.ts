import type { Camera, Point, ShapeId, ShapeRecord, Snapshot } from '@open-draw/schema';
import { CameraController, type ZoomOptions } from './camera.js';
import { ShapeRegistry, type ShapeDefinition } from './registry.js';
import { SVGRenderer } from './renderer.js';
import { groupDefinition } from './shapes/group.js';
import { rectDefinition } from './shapes/rect.js';
import { ellipseDefinition } from './shapes/ellipse/index.js';
import { CanvasStore } from './store.js';

export interface CanvasEditorOptions {
  readonly readonly?: boolean;
}

/**
 * OpenDraw Canvas Editor
 * Manages canvas rendering, camera state, shape lifecycle, tools, and user interaction.
 */
export class CanvasEditor {
  readonly store: CanvasStore;
  readonly camera: CameraController;
  readonly options: CanvasEditorOptions;
  readonly registry: ShapeRegistry;
  readonly renderer: SVGRenderer;

  private isMounted = false;
  private container: HTMLElement | null = null;
  private unsubscribeCamera: (() => void) | null = null;
  private unsubscribeStore: (() => void) | null = null;

  private activeTool: string = 'select';
  private selectedShapeId: ShapeId | null = null;

  // Pointer drag state
  private isDragging = false;
  private dragShapeId: ShapeId | null = null;
  private dragStartPointer: Point | null = null;
  private dragStartShapePos: Point | null = null;

  constructor(options: CanvasEditorOptions = {}) {
    this.options = options;
    this.store = new CanvasStore();
    this.camera = new CameraController();
    this.registry = new ShapeRegistry();
    this.renderer = new SVGRenderer(this.registry);

    // Register built-in shapes through the public plugin contract
    this.registerShape(rectDefinition);
    this.registerShape(ellipseDefinition);
    this.registerShape(groupDefinition);
  }

  registerShape<P = Record<string, unknown>>(definition: ShapeDefinition<P>): void {
    this.registry.register(definition);
  }

  mount(container: HTMLElement): void {
    if (this.isMounted) {
      return;
    }
    this.container = container;
    this.isMounted = true;
    this.renderer.mount(container, this.camera.camera);
    this.renderer.renderAll(this.store.listShapes());

    this.unsubscribeCamera = this.camera.subscribe((cam) => {
      this.renderer.updateCamera(cam);
    });

    this.unsubscribeStore = this.store.listen((diff) => {
      this.renderer.applyDiff(diff, this.store);
    });

    this.attachEventListeners(container);
  }

  destroy(): void {
    this.detachEventListeners();
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
    this.container = null;
  }

  setTool(toolId: string): void {
    this.activeTool = toolId;
  }

  getTool(): string {
    return this.activeTool;
  }

  getSelectedShapeId(): ShapeId | null {
    return this.selectedShapeId;
  }

  setSelectedShapeId(id: ShapeId | null): void {
    this.selectedShapeId = id;
  }

  undo(): boolean {
    return this.store.undo();
  }

  redo(): boolean {
    return this.store.redo();
  }

  canUndo(): boolean {
    return this.store.canUndo();
  }

  canRedo(): boolean {
    return this.store.canRedo();
  }

  createShape(record: Partial<ShapeRecord> & { type: string }): ShapeRecord {
    const id = record.id ?? `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const x = record.x ?? 0;
    const y = record.y ?? 0;
    const def = this.registry.get(record.type);
    const defaultProps = def ? def.defaultProps() : {};

    return this.store.createShape({
      ...record,
      id,
      x,
      y,
      type: record.type,
      meta: record.meta ?? {},
      props: (record.props ? { ...defaultProps, ...record.props } : defaultProps) as Record<string, unknown>,
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

  getOverlaySlot(id: ShapeId): SVGGElement | null {
    return this.renderer.getOverlaySlot(id);
  }

  getShapeWrapper(id: ShapeId): SVGGElement | null {
    return this.renderer.getShapeWrapper(id);
  }

  private onPointerDown = (e: PointerEvent): void => {
    const containerRect = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const screenPt = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    const pagePt = this.camera.screenToPage(screenPt);

    if (this.activeTool === 'select') {
      const target = e.target as Element | null;
      const shapeWrapper = target?.closest('.od-shape');
      const shapeId = shapeWrapper?.getAttribute('data-id');

      if (shapeId) {
        this.selectedShapeId = shapeId;
        const shape = this.store.getShape(shapeId);
        if (shape) {
          this.isDragging = true;
          this.dragShapeId = shapeId;
          this.dragStartPointer = pagePt;
          this.dragStartShapePos = { x: shape.x, y: shape.y };
          // Begin gesture transaction: all movements will fold into this single undo step
          this.store.beginTransaction();
        }
      } else {
        this.selectedShapeId = null;
      }
    } else if (this.registry.has(this.activeTool)) {
      // Shape creation tool
      const toolType = this.activeTool;
      const def = this.registry.get(toolType);
      if (def) {
        this.store.transact(() => {
          const shape = this.createShape({
            type: toolType,
            x: pagePt.x,
            y: pagePt.y,
            props: def.defaultProps(),
          });
          this.selectedShapeId = shape.id;
        });
      }
      this.activeTool = 'select';
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging || !this.dragShapeId || !this.dragStartPointer || !this.dragStartShapePos) {
      return;
    }
    const containerRect = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const currentScreenPt = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    const currentPagePt = this.camera.screenToPage(currentScreenPt);

    const dx = currentPagePt.x - this.dragStartPointer.x;
    const dy = currentPagePt.y - this.dragStartPointer.y;

    this.store.updateShape(this.dragShapeId, {
      x: this.dragStartShapePos.x + dx,
      y: this.dragStartShapePos.y + dy,
    });
  };

  private onPointerUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragShapeId = null;
      this.dragStartPointer = null;
      this.dragStartShapePos = null;
      // Commit the single gesture transaction
      this.store.commitTransaction();
    }
  };

  private attachEventListeners(container: HTMLElement): void {
    container.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private detachEventListeners(): void {
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.onPointerDown);
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }
}
