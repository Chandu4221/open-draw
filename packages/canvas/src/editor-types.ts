import type {
  BoundingBox,
  CustomShapeKind,
  DeviceType,
  Point,
  ShapeId,
} from "@open-draw/contracts";
import type { Command, Document, Shape } from "@open-draw/document";
import type { ShapeSvgRenderer } from "@open-draw/renderer-svg";
import type { Camera } from "./camera";
import type { CanvasController, CanvasOptions } from "./create-canvas";
import type { ControllerEvent } from "./events";
import type { NestingMode } from "./editor-gestures";
import type { ToolId } from "./tools";
import type { CustomShapeCreateOptions, CustomShapeExtension } from "./extension";

export interface EditorOverlayContext {
  readonly doc: Document;
  readonly selectedIds: readonly ShapeId[];
  readonly camera: Camera;
  readonly zoom: number;
  readonly activeDeviceType?: DeviceType | undefined;
  readonly canvas: CanvasController;
}

export interface SnapConfig {
  readonly enabled?: boolean | undefined;
  readonly thresholdPx?: number | undefined;
}

export interface EditorOptions {
  readonly document?: Document;
  readonly canvasOptions?: CanvasOptions;
  readonly tool?: ToolId;
  readonly nestingMode?: NestingMode;
  readonly customRenderers?: Readonly<Record<string, ShapeSvgRenderer>>;
  readonly customShapes?: readonly CustomShapeExtension[];
  readonly renderCustomOverlays?: (context: EditorOverlayContext) => readonly string[];
  readonly snapping?: boolean | SnapConfig | undefined;
  readonly interceptPointerDown?:
    | ((
        event: PointerEvent,
        context: {
          readonly world: Point;
          readonly screen: Point;
          readonly canvas: CanvasController;
          readonly doc: Document;
        },
      ) => boolean | void)
    | undefined;
  readonly onFallback?: (message: string) => void;
  readonly onDoubleClick?: ((shapeId: ShapeId) => void) | undefined;
}

export interface SetDocumentOptions {
  readonly preserveHistory?: boolean | undefined;
}

export interface Editor {
  readonly container: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly canvas: CanvasController;
  getDocument(): Document;
  setDocument(doc: Document, options?: SetDocumentOptions): void;
  loadJson(json: string, options?: SetDocumentOptions): void;
  toJson(): string;
  toSvg(): string;
  setTextContent(id: ShapeId, content: string | null): void;
  setShapeStyle(
    id: ShapeId,
    style: {
      readonly fill?: string | null | undefined;
      readonly stroke?: string | null | undefined;
      readonly strokeWidth?: number | null | undefined;
    },
  ): void;
  setShapeOrder(id: ShapeId, deviceType: DeviceType, order: number | null): void;
  execute(commands: Command | readonly Command[], options?: { record?: boolean }): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  getTool(): ToolId;
  setTool(tool: ToolId): void;
  getSelection(): readonly ShapeId[];
  select(id: ShapeId): void;
  selectMany(ids: readonly ShapeId[]): void;
  clearSelection(): void;
  getCamera(): Camera;
  setCamera(camera: Camera): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  subscribe(event: ControllerEvent, listener: () => void): () => void;
  registerCustomShape(extension: CustomShapeExtension): void;
  getCustomShape(kind: CustomShapeKind | string): CustomShapeExtension | undefined;
  getCustomShapes(): readonly CustomShapeExtension[];
  insertCustomShape(
    kind: CustomShapeKind,
    box: BoundingBox,
    options?: CustomShapeCreateOptions,
  ): Shape;
  render(): void;
  destroy(): void;
}
