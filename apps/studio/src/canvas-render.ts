import type { Point } from "@open-draw/contracts";
import type { CanvasController, ToolId } from "@open-draw/canvas";
import type { Document } from "@open-draw/document";
import { documentToSvg } from "@open-draw/renderer-svg";
import type { Gesture } from "./types";
import { computeCanvasOverlays } from "./canvas-overlays";

export interface RenderCanvasSvgOptions {
  readonly svg: SVGSVGElement;
  readonly canvas: CanvasController;
  readonly doc: Document;
  readonly gesture: Gesture | null;
  readonly tool: ToolId;
  readonly lastWorld: Point;
  readonly showTagChips: boolean;
  readonly onFallback: (msg: string) => void;
}

export function renderCanvasSvg(options: RenderCanvasSvgOptions): void {
  const { svg, canvas, doc, gesture, tool, lastWorld, showTagChips, onFallback } = options;
  const camera = canvas.getCamera();

  const overlays = computeCanvasOverlays({
    doc,
    selectedId: canvas.getSelectedId(),
    selectedIds: canvas.getSelectedIds(),
    gesture,
    tool,
    lastWorld,
    zoom: camera.zoom,
    showTagChips,
    activeDeviceType: canvas.getActiveDeviceType(),
  });

  const world =
    documentToSvg(doc, {
      activeDeviceType: canvas.getActiveDeviceType(),
      onFallback: (event) => {
        onFallback(`Fallback render: ${event.shapeId} (${event.kind})`);
      },
    }) + overlays.join("");

  svg.innerHTML =
    `<g transform="translate(${-camera.x * camera.zoom} ${-camera.y * camera.zoom}) ` +
    `scale(${camera.zoom})">${world}</g>`;
}
