import type { Camera, Point, ShapeId, ShapeRecord, Snapshot } from '@open-draw/schema';
import { CameraController, type ZoomOptions } from './camera.js';
import { ShapeRegistry, type ShapeDefinition } from './registry.js';
import { SVGRenderer } from './renderer.js';
import { groupDefinition } from './shapes/group.js';
import { rectDefinition } from './shapes/rect.js';
import { ellipseDefinition } from './shapes/ellipse/index.js';
import { noteDefinition } from './shapes/note/index.js';
import { imageDefinition, attachImageTransferHandlers } from './shapes/image/index.js';
import { textDefinition } from './shapes/text/index.js';
import { frameDefinition } from './shapes/frame/index.js';
import { arrowDefinition } from './shapes/arrow/index.js';
import { CanvasStore } from './store.js';
import { PointerInteractionController } from './interaction.js';
import { TextEditingManager, type EditorMode } from './capabilities/text-editing/index.js';
import { ClippingManager } from './capabilities/clipping/index.js';
import { ConnectorManager } from './capabilities/connector/index.js';

export interface CanvasEditorOptions {
  readonly readonly?: boolean;
}

/**
 * OpenDraw Canvas Editor
 * Composition point for camera, store, registry, renderer, and privileged capabilities.
 */
export class CanvasEditor {
  readonly store: CanvasStore;
  readonly camera: CameraController;
  readonly options: CanvasEditorOptions;
  readonly registry: ShapeRegistry;
  readonly renderer: SVGRenderer;
  readonly interaction: PointerInteractionController;
  readonly textEditing: TextEditingManager;
  readonly clipping: ClippingManager;
  readonly connector: ConnectorManager;

  mode: EditorMode = 'none';

  private isMounted = false;
  private container: HTMLElement | null = null;
  private unsubscribeCamera: (() => void) | null = null;
  private unsubscribeStore: (() => void) | null = null;
  private detachImageTransfer: (() => void) | null = null;

  private activeTool: string = 'select';
  private selectedShapeId: ShapeId | null = null;

  constructor(options: CanvasEditorOptions = {}) {
    this.options = options;
    this.store = new CanvasStore();
    this.camera = new CameraController();
    this.registry = new ShapeRegistry();
    this.renderer = new SVGRenderer(this.registry);
    this.interaction = new PointerInteractionController(this);
    this.textEditing = new TextEditingManager();
    this.clipping = new ClippingManager();
    this.connector = new ConnectorManager();

    // Register built-in shapes through public plugin contract
    this.registerShape(rectDefinition);
    this.registerShape(ellipseDefinition);
    this.registerShape(noteDefinition);
    this.registerShape(imageDefinition);
    this.registerShape(textDefinition);
    this.registerShape(frameDefinition);
    this.registerShape(arrowDefinition);
    this.registerShape(groupDefinition);
  }

  registerShape<P = Record<string, unknown>>(definition: ShapeDefinition<P>): void {
    this.registry.register(definition);
  }

  mount(container: HTMLElement): void {
    if (this.isMounted) return;
    this.container = container;
    this.isMounted = true;
    this.renderer.mount(container, this.camera.camera);
    this.renderer.renderAll(this.store.listShapes());

    this.unsubscribeCamera = this.camera.subscribe((cam) => {
      this.renderer.updateCamera(cam);
    });

    this.unsubscribeStore = this.store.listen((diff) => {
      for (const deletedId of diff.deleted) {
        const lastRecord = this.renderer.getShapeRecord(deletedId);
        this.clipping.handleParentDeletion(deletedId, this.store);
        this.connector.handleTargetDeletion(deletedId, lastRecord, this.store, this.registry);
      }
      this.renderer.applyDiff(diff, this.store);
    });

    this.interaction.attach(container);
    container.addEventListener('dblclick', this.onDblClick);
    this.detachImageTransfer = attachImageTransferHandlers(container, this);
  }

  destroy(): void {
    if (this.container) {
      this.container.removeEventListener('dblclick', this.onDblClick);
    }
    this.interaction.detach();
    if (this.detachImageTransfer) {
      this.detachImageTransfer();
      this.detachImageTransfer = null;
    }
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

  selectShape(shapeId: ShapeId | null): void {
    this.selectedShapeId = shapeId;
  }

  getSelectedShapeId(): ShapeId | null {
    return this.selectedShapeId;
  }

  createShape(record: {
    readonly id?: ShapeId;
    readonly type: string;
    readonly x: number;
    readonly y: number;
    readonly rotation?: number;
    readonly hidden?: boolean;
    readonly meta?: Record<string, unknown>;
    readonly props?: Record<string, unknown>;
  }): ShapeRecord {
    const id = record.id ?? `shape-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return this.store.createShape({
      ...record,
      id,
    });
  }

  updateShape(
    id: ShapeId,
    patch: Partial<Omit<ShapeRecord, 'id' | 'type'>>
  ): ShapeRecord {
    return this.store.updateShape(id, patch);
  }

  deleteShape(id: ShapeId): boolean {
    if (this.selectedShapeId === id) {
      this.selectedShapeId = null;
    }
    const lastRecord = this.store.getShape(id);
    if (!lastRecord) return false;

    let res = false;
    this.store.transact(() => {
      this.clipping.handleParentDeletion(id, this.store);
      this.connector.handleTargetDeletion(id, lastRecord, this.store, this.registry);
      res = this.store.deleteShape(id);
    });
    return res;
  }

  getShape(id: ShapeId): ShapeRecord | undefined {
    return this.store.getShape(id);
  }

  canUndo(): boolean {
    return this.store.canUndo();
  }

  canRedo(): boolean {
    return this.store.canRedo();
  }

  undo(): boolean {
    return this.store.undo();
  }

  redo(): boolean {
    return this.store.redo();
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

  private onDblClick = (e: MouseEvent): void => {
    const target = e.target as Element | null;
    const shapeWrapper = target?.closest('.od-shape');
    const shapeId = shapeWrapper?.getAttribute('data-id');
    if (!shapeId) return;

    this.textEditing.startEditing(shapeId, this);
  };
}
