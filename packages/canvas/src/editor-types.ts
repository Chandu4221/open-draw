// Editor types and options contracts (R-005, R-010, R-014).
import type { DeviceType, ShapeId } from "@open-draw/contracts";
import type { Command, Document } from "@open-draw/document";
import type { ShapeSvgRenderer } from "@open-draw/renderer-svg";
import type { Camera } from "./camera";
import type { CanvasController, CanvasOptions } from "./create-canvas";
import type { ControllerEvent } from "./events";
import type { NestingMode } from "./editor-gestures";
import type { ToolId } from "./tools";

export interface EditorOverlayContext {
  readonly doc: Document;
  readonly selectedIds: readonly ShapeId[];
  readonly camera: Camera;
  readonly zoom: number;
  readonly activeDeviceType?: DeviceType | undefined;
}

export interface EditorOptions {
  readonly document?: Document;
  readonly canvasOptions?: CanvasOptions;
  readonly tool?: ToolId;
  readonly nestingMode?: NestingMode;
  readonly customRenderers?: Readonly<Record<string, ShapeSvgRenderer>>;
  readonly renderCustomOverlays?: (context: EditorOverlayContext) => readonly string[];
  readonly onFallback?: (message: string) => void;
}

export interface Editor {
  readonly container: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly canvas: CanvasController;
  getDocument(): Document;
  setDocument(doc: Document): void;
  loadJson(json: string): void;
  toJson(): string;
  toSvg(): string;
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
  render(): void;
  destroy(): void;
}
