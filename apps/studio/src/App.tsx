// Studio shell: full shared production wireframing environment mounting
// the createCanvas controller, @open-draw/input action resolution, @open-draw/shapes
// extensions, @open-draw/profiles, @open-draw/semantics, and document serialization/parsing
// (R-004, R-008, R-010, R-011, R-018, R-024, R-025, R-026, R-027, R-028, R-029, R-034, R-041, R-044).
import { useRef, useState } from "react";
import type { DeviceType, Point, ShapeId } from "@open-draw/contracts";
import {
  applyTransaction,
  createDocument,
  createTransaction,
  EMPTY_HISTORY,
  recordHistory,
  type Command,
  type Document,
  type HistoryState,
} from "@open-draw/document";
import { TOOLS, type CanvasController, type ToolId } from "@open-draw/canvas";
import { OdToastHost, OdToastProvider, useToast } from "@open-draw/ui";
import { CANVAS_CONTAINER_STYLE, CANVAS_WIRE_STYLE, EMPTY_HINT_STYLE, type Gesture } from "./types";
import { initCanvas } from "./canvas-init";
import { renderCanvasSvg } from "./canvas-render";
import { Toolbar } from "./components/Toolbar";
import { TreeOutline } from "./components/TreeOutline";
import { Inspector } from "./components/Inspector";
import { useCanvasInteractions } from "./use-canvas-interactions";
import { useCanvasKeyboard } from "./use-canvas-keyboard";
import { useDocumentMutations } from "./use-document-mutations";
import { useInspectionData } from "./use-inspection-data";
import { useToolbarActions } from "./use-toolbar-actions";

const LEFT_ASIDE_STYLE: React.CSSProperties = {
  width: "240px",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
  borderTop: "none",
  borderBottom: "none",
  borderLeft: "none",
  borderRadius: 0,
  overflowY: "auto",
  padding: "var(--od-12)",
  flexShrink: 0,
};

const RIGHT_ASIDE_STYLE: React.CSSProperties = {
  width: "320px",
  height: "100%",
  minHeight: 0,
  boxSizing: "border-box",
  borderTop: "none",
  borderBottom: "none",
  borderRight: "none",
  borderRadius: 0,
  overflowY: "auto",
  padding: "var(--od-16)",
  flexShrink: 0,
};

function StudioShell() {
  const toast = useToast();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<CanvasController>(initCanvas());
  const [doc, setDoc] = useState<Document>(() => createDocument([]));
  const documentRef = useRef<Document>(doc);
  const historyRef = useRef<HistoryState>(EMPTY_HISTORY);
  const gestureRef = useRef<Gesture | null>(null);
  const lastScreenRef = useRef<Point>({ x: 0, y: 0 });
  const lastWorldRef = useRef<Point>({ x: 0, y: 0 });
  const spaceRef = useRef(false);
  const toolRef = useRef<ToolId>(TOOLS.select);
  const [tool, setTool] = useState<ToolId>(TOOLS.select);
  const [selectedShapeId, setSelectedShapeId] = useState<ShapeId | null>(null);
  const [activeDeviceType, setActiveDeviceType] = useState<DeviceType | undefined>(undefined);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showTagChips, setShowTagChips] = useState<boolean>(false);
  const showTagChipsRef = useRef<boolean>(false);
  const [includeLegend, setIncludeLegend] = useState<boolean>(false);

  const chooseTool = (next: ToolId): void => {
    toolRef.current = next;
    setTool(next);
  };
  const handleDeviceChange = (deviceType?: DeviceType): void => {
    canvasRef.current.setActiveDeviceType(deviceType);
    setActiveDeviceType(deviceType);
    render();
  };
  const handleZoom = (factor: number): void => {
    const svg = svgRef.current;
    if (svg === null) return;
    const rect = svg.getBoundingClientRect();
    canvasRef.current.zoomAt({ x: rect.width / 2, y: rect.height / 2 }, factor);
    setZoomPercent(Math.round(canvasRef.current.getCamera().zoom * 100));
    render();
  };
  const handleResetZoom = (): void => {
    canvasRef.current.setCamera({ x: 0, y: 0, zoom: 1 });
    setZoomPercent(100);
    render();
  };
  const selectShape = (id: ShapeId): void => {
    canvasRef.current.select(id);
    setSelectedShapeId(id);
    render();
  };

  function render(): void {
    const svg = svgRef.current;
    if (svg === null) return;
    renderCanvasSvg({
      svg,
      canvas: canvasRef.current,
      doc: documentRef.current,
      gesture: gestureRef.current,
      tool: toolRef.current,
      lastWorld: lastWorldRef.current,
      showTagChips: showTagChipsRef.current,
      onFallback: (msg) => toast.push({ type: "info", text: msg }),
    });
  }

  function commit(
    commands: readonly Command[],
    options?: { record?: boolean; customInverse?: readonly Command[] },
  ): void {
    const result = applyTransaction(documentRef.current, createTransaction(commands));
    documentRef.current = result.document;
    if (options?.record !== false) {
      historyRef.current = recordHistory(
        historyRef.current,
        options?.customInverse ?? result.inverse,
      );
    }
    setDoc(result.document);
  }

  function toggleShowTagChips(): void {
    setShowTagChips((prev) => {
      const next = !prev;
      showTagChipsRef.current = next;
      render();
      return next;
    });
  }

  const toolbarActions = useToolbarActions({
    documentRef,
    historyRef,
    canvasRef,
    includeLegend,
    toast,
    setDoc,
    setSelectedShapeId,
    commit,
    render,
  });

  const inspection = useInspectionData(doc, selectedShapeId, activeDeviceType);
  const mutations = useDocumentMutations({
    selectedShape: inspection.selectedShape,
    rootShape: inspection.rootShape,
    activeProfile: inspection.activeProfile,
    activeDeviceType,
    canvasRef,
    setActiveDeviceType,
    commit,
    render,
  });

  useCanvasInteractions({
    svgRef,
    canvasRef,
    documentRef,
    gestureRef,
    lastScreenRef,
    lastWorldRef,
    spaceRef,
    toolRef,
    setSelectedShapeId,
    setZoomPercent,
    commit,
    render,
  });

  useCanvasKeyboard({
    canvasRef,
    documentRef,
    historyRef,
    gestureRef,
    spaceRef,
    setSelectedShapeId,
    setStatusMessage: (msg) => toast.push({ type: "info", text: msg }),
    setDoc,
    chooseTool,
    commit,
    render,
  });

  const emptyDoc = Object.keys(doc.shapes).length === 0;

  return (
    <main
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Toolbar
        brandLabel="OpenDraw Studio"
        tool={tool}
        chooseTool={chooseTool}
        includeLegend={includeLegend}
        setIncludeLegend={setIncludeLegend}
        {...toolbarActions}
        activeProfile={inspection.activeProfile}
        activeDeviceType={activeDeviceType}
        handleDeviceChange={handleDeviceChange}
        handleZoom={handleZoom}
        handleResetZoom={handleResetZoom}
        zoomPercent={zoomPercent}
        showTagChips={showTagChips}
        toggleShowTagChips={toggleShowTagChips}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />
      <div
        style={{
          flex: 1,
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {showSidebar && (
          <aside className="od-panel" style={LEFT_ASIDE_STYLE}>
            <TreeOutline
              treeNodes={inspection.treeNodes}
              selectedShapeId={selectedShapeId}
              selectShape={selectShape}
            />
          </aside>
        )}
        <div className="od-canvas-bg" style={CANVAS_CONTAINER_STYLE}>
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
          {emptyDoc && (
            <div className="od-panel" style={EMPTY_HINT_STYLE}>
              R rect · O ellipse · L line · P pen — wheel to pan
            </div>
          )}
        </div>
        {showSidebar && (
          <aside className="od-panel" style={RIGHT_ASIDE_STYLE}>
            <Inspector {...inspection} {...mutations} />
          </aside>
        )}
      </div>
      <OdToastHost />
    </main>
  );
}

export default function App() {
  return (
    <OdToastProvider>
      <StudioShell />
    </OdToastProvider>
  );
}
