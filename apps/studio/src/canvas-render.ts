import type { DeviceType, Point, ShapeId } from "@open-draw/contracts";
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
  readonly onFallback: (msg: string) => void;
}

interface RenderCacheEntry {
  doc: Document;
  activeDeviceType?: DeviceType | undefined;
  activeDeviceTypes?: Readonly<Record<ShapeId, DeviceType | undefined>> | undefined;
}

const renderCache = new WeakMap<SVGSVGElement, RenderCacheEntry>();

export function renderCanvasSvg(options: RenderCanvasSvgOptions): void {
  const { svg, canvas, doc, gesture, tool, lastWorld, onFallback } = options;
  const camera = canvas.getCamera();
  const activeDeviceType = canvas.getActiveDeviceType();
  const activeDeviceTypes = canvas.getActiveDeviceTypes();

  let viewport = svg.querySelector<SVGGElement>(".od-scene-viewport");
  let docScene = svg.querySelector<SVGGElement>(".od-document-scene");
  let overlayScene = svg.querySelector<SVGGElement>(".od-overlay-scene");

  if (viewport === null || docScene === null || overlayScene === null) {
    svg.innerHTML =
      '<g class="od-scene-viewport">' +
      '<g class="od-document-scene"></g>' +
      '<g class="od-overlay-scene"></g>' +
      "</g>";
    viewport = svg.querySelector<SVGGElement>(".od-scene-viewport")!;
    docScene = svg.querySelector<SVGGElement>(".od-document-scene")!;
    overlayScene = svg.querySelector<SVGGElement>(".od-overlay-scene")!;
  }

  viewport.setAttribute(
    "transform",
    `translate(${-camera.x * camera.zoom} ${-camera.y * camera.zoom}) scale(${camera.zoom})`,
  );

  const cached = renderCache.get(svg);
  const deviceTypesChanged =
    cached === undefined ||
    cached.activeDeviceType !== activeDeviceType ||
    cached.activeDeviceTypes !== activeDeviceTypes;

  if (cached === undefined || cached.doc !== doc || deviceTypesChanged) {
    docScene.innerHTML = documentToSvg(doc, {
      activeDeviceType,
      activeDeviceTypes,
      onFallback: (event) => {
        onFallback(`Fallback render: ${event.shapeId} (${event.kind})`);
      },
    });
    renderCache.set(svg, { doc, activeDeviceType, activeDeviceTypes });
  }

  const overlays = computeCanvasOverlays({
    doc,
    selectedId: canvas.getSelectedId(),
    selectedIds: canvas.getSelectedIds(),
    gesture,
    tool,
    lastWorld,
    zoom: camera.zoom,
    visibleChipRootIds: canvas.getVisibleChipRootIds(),
    activeDeviceType,
    activeDeviceTypes,
  });

  const overlayHtml = overlays.join("");
  if (overlayScene.innerHTML !== overlayHtml) {
    overlayScene.innerHTML = overlayHtml;
  }
}
