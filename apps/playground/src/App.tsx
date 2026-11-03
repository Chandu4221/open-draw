// Playground shell for milestone 5: wires DOM events and UI controls to
// the createCanvas controller, @open-draw/input action resolution, @open-draw/shapes
// extensions, @open-draw/profiles, @open-draw/semantics, and document serialization/parsing
// (R-004, R-008, R-010, R-011, R-018, R-024, R-025, R-026, R-027, R-028, R-029, R-041, R-044).
import { useRef, useState } from "react";
import type { DeviceType, Point, ShapeId } from "@open-draw/contracts";
import {
  applyTransaction,
  createDocument,
  createTransaction,
  DocumentError,
  EMPTY_HISTORY,
  recordHistory,
  type Command,
  type Document,
  type HistoryState,
} from "@open-draw/document";
import { TOOLS, type CanvasController, type ToolId } from "@open-draw/canvas";
import { CANVAS_WIRE_STYLE, type Gesture } from "./types";
import { initCanvas } from "./canvas-init";
import { renderCanvasSvg } from "./canvas-render";
import { exportDocumentJson, exportDocumentMarkdown, promptLoadDocumentJson } from "./document-io";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { useCanvasInteractions } from "./use-canvas-interactions";
import { useCanvasKeyboard } from "./use-canvas-keyboard";
import { useDocumentMutations } from "./use-document-mutations";
import { useInspectionData } from "./use-inspection-data";

export default function App() {
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
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [selectedShapeId, setSelectedShapeId] = useState<ShapeId | null>(null);
  const [activeDeviceType, setActiveDeviceType] = useState<DeviceType | undefined>(undefined);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showTagChips, setShowTagChips] = useState<boolean>(false);
  const showTagChipsRef = useRef<boolean>(false);

  function chooseTool(next: ToolId): void {
    toolRef.current = next;
    setTool(next);
  }

  function handleDeviceChange(deviceType?: DeviceType): void {
    canvasRef.current.setActiveDeviceType(deviceType);
    setActiveDeviceType(deviceType);
    render();
  }

  function handleZoom(factor: number): void {
    const svg = svgRef.current;
    if (svg === null) return;
    const rect = svg.getBoundingClientRect();
    const center: Point = { x: rect.width / 2, y: rect.height / 2 };
    canvasRef.current.zoomAt(center, factor);
    setZoomPercent(Math.round(canvasRef.current.getCamera().zoom * 100));
    render();
  }

  function handleResetZoom(): void {
    canvasRef.current.setCamera({ x: 0, y: 0, zoom: 1 });
    setZoomPercent(100);
    render();
  }

  function selectShape(id: ShapeId): void {
    canvasRef.current.select(id);
    setSelectedShapeId(id);
    render();
  }

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
      onFallback: (msg) => setStatusMessage(msg),
    });
  }

  function commit(commands: readonly Command[]): void {
    const result = applyTransaction(documentRef.current, createTransaction(commands));
    documentRef.current = result.document;
    historyRef.current = recordHistory(historyRef.current, result.inverse);
    setDoc(result.document);
  }

  function handleSave(): void {
    try {
      exportDocumentJson(documentRef.current);
      setStatusMessage("Document saved successfully");
    } catch (err) {
      setStatusMessage(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleExportMarkdown(): void {
    try {
      exportDocumentMarkdown(documentRef.current);
      setStatusMessage("Exported Markdown successfully");
    } catch (err) {
      setStatusMessage(`Export error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function toggleShowTagChips(): void {
    setShowTagChips((prev) => {
      const next = !prev;
      showTagChipsRef.current = next;
      render();
      return next;
    });
  }

  function handleLoad(): void {
    promptLoadDocumentJson(
      (loaded) => {
        documentRef.current = loaded;
        historyRef.current = EMPTY_HISTORY;
        canvasRef.current.clearSelection();
        setSelectedShapeId(null);
        setDoc(loaded);
        setStatusMessage("Document loaded successfully");
        render();
      },
      (err) => {
        if (err instanceof DocumentError) {
          setStatusMessage(`Load error (${err.code}): ${err.message}`);
        } else {
          setStatusMessage(`Load error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    );
  }

  const inspection = useInspectionData(doc, selectedShapeId, activeDeviceType);

  const {
    handleSetPlatform,
    handleSetStyle,
    handleSetLabel,
    handleSetContent,
    handleSetSemantic,
    handlePropertyChange,
    handleToggleHiddenOn,
    handleOrderChange,
    handleStyleChange,
  } = useDocumentMutations({
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
    setStatusMessage,
    setDoc,
    chooseTool,
    commit,
    render,
  });

  return (
    <main
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <Toolbar
        tool={tool}
        chooseTool={chooseTool}
        handleExportMarkdown={handleExportMarkdown}
        handleSave={handleSave}
        handleLoad={handleLoad}
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
        statusMessage={statusMessage}
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
        <div
          style={{
            flex: 1,
            height: "100%",
            minHeight: 0,
            minWidth: 0,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#f8fafc",
          }}
        >
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
        </div>

        {showSidebar && (
          <Sidebar
            selectedShape={inspection.selectedShape}
            rootShape={inspection.rootShape}
            rootPlatform={inspection.rootPlatform}
            rootStyle={inspection.rootStyle}
            activeProfile={inspection.activeProfile}
            conflict={inspection.conflict}
            semanticDef={inspection.semanticDef}
            semanticProps={inspection.semanticProps}
            handleSetLabel={handleSetLabel}
            handleSetContent={handleSetContent}
            handleSetPlatform={handleSetPlatform}
            handleSetStyle={handleSetStyle}
            handleSetSemantic={handleSetSemantic}
            handlePropertyChange={handlePropertyChange}
            handleToggleHiddenOn={handleToggleHiddenOn}
            handleOrderChange={handleOrderChange}
            handleStyleChange={handleStyleChange}
            treeNodes={inspection.treeNodes}
            selectedShapeId={selectedShapeId}
            selectShape={selectShape}
          />
        )}
      </div>
    </main>
  );
}
