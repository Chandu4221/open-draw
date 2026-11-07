import React, { useEffect, useRef, useState } from "react";
import { Allotment } from "allotment";
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
  type Shape,
} from "@open-draw/document";
import { CONTROLLER_EVENTS, TOOLS, type CanvasController, type ToolId } from "@open-draw/canvas";
import { OdToastHost, useToast } from "@open-draw/ui";
import { CANVAS_CONTAINER_STYLE, CANVAS_WIRE_STYLE, type Gesture } from "../types";
import { initCanvas } from "../canvas-init";
import { renderCanvasSvg } from "../canvas-render";

import { Sidebar } from "./Sidebar";
import { CanvasDock } from "./CanvasDock";
import { CanvasZoomControls } from "./CanvasZoomControls";
import { ExportModal, type ExportFormat } from "./ExportModal";
import { useBatchMutations } from "../use-batch-mutations";
import { useCanvasInteractions } from "../use-canvas-interactions";
import { useCanvasKeyboard } from "../use-canvas-keyboard";
import { useDocumentMutations } from "../use-document-mutations";
import { useInspectionData } from "../use-inspection-data";
import { useRootThemeMutations } from "../use-root-theme-mutations";
import { useToolbarActions } from "../use-toolbar-actions";

export interface StudioShellProps {
  readonly onBackToLanding?: () => void;
}

export function StudioShell({ onBackToLanding }: StudioShellProps): React.JSX.Element {
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
  const [selectedShapeIds, setSelectedShapeIds] = useState<readonly ShapeId[]>([]);
  const [activeDeviceType, setActiveDeviceType] = useState<DeviceType | undefined>(undefined);

  useEffect(() => {
    return canvasRef.current.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
      setSelectedShapeIds(canvasRef.current.getSelectedIds());
      setSelectedShapeId(canvasRef.current.getSelectedId());
    });
  }, []);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [includeLegend, setIncludeLegend] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat>("markdown");

  const handleOpenExportModal = (initial: ExportFormat = "markdown") => {
    setExportInitialFormat(initial);
    setIsExportModalOpen(true);
  };

  const chooseTool = (next: ToolId): void => {
    toolRef.current = next;
    setTool(next);
  };
  const handleDeviceChange = (deviceType?: DeviceType): void => {
    canvasRef.current.setActiveDeviceType(deviceType);
    setActiveDeviceType(deviceType);
    render();
  };
  const [visibleChipRoots, setVisibleChipRoots] = useState<ReadonlySet<ShapeId>>(() => new Set());

  const handleToggleChildChips = (rootId: ShapeId): void => {
    canvasRef.current.toggleRootChipsVisible(rootId);
    setVisibleChipRoots((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) {
        next.delete(rootId);
      } else {
        next.add(rootId);
      }
      return next;
    });
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

  const selectedShapes = selectedShapeIds
    .map((id) => doc.shapes[id])
    .filter((s): s is Shape => s !== undefined);
  const batchMutations = useBatchMutations({ selectedShapes, canvasRef, commit, render });
  const themeMutations = useRootThemeMutations({
    selectedShape: inspection.selectedShape,
    rootShape: inspection.rootShape,
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
    chooseTool,
    setSelectedShapeId,
    setZoomPercent,
    handleDeviceChange,
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
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Allotment className="allotment-module">
        <Allotment.Pane minSize={400}>
          <div className="od-canvas-bg" style={CANVAS_CONTAINER_STYLE}>
            <div
              className="od-canvas-brand"
              onClick={onBackToLanding}
              style={{ cursor: onBackToLanding ? "pointer" : "default" }}
              title={onBackToLanding ? "Back to home" : undefined}
            >
              <span
                className="od-label"
                style={{
                  fontSize: "var(--od-text-sm)",
                  fontWeight: 700,
                  color: "var(--od-text)",
                  letterSpacing: "0.02em",
                }}
              >
                OpenDraw Studio
              </span>
            </div>
            <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
            {emptyDoc && (
              <div className="od-canvas-hint">
                R rect · O ellipse · L line · P pen — wheel to pan
              </div>
            )}
            <CanvasDock
              tool={tool}
              chooseTool={chooseTool}
              handleUndo={toolbarActions.handleUndo}
              handleRedo={toolbarActions.handleRedo}
              handleDuplicate={toolbarActions.handleDuplicate}
              handleDelete={toolbarActions.handleDelete}
              handleLoad={toolbarActions.handleLoad}
              onOpenExportModal={() => handleOpenExportModal("markdown")}
            />
            <CanvasZoomControls
              zoomPercent={zoomPercent}
              handleZoom={handleZoom}
              handleResetZoom={handleResetZoom}
              showSidebar={showSidebar}
              setShowSidebar={setShowSidebar}
            />
          </div>
        </Allotment.Pane>
        <Allotment.Pane preferredSize={340} minSize={260} maxSize={500} snap visible={showSidebar}>
          <Sidebar
            {...inspection}
            {...mutations}
            {...themeMutations}
            {...batchMutations}
            selectedShapes={selectedShapes}
            selectedShapeId={selectedShapeId}
            selectShape={selectShape}
            showChildChips={selectedShapeId ? visibleChipRoots.has(selectedShapeId) : false}
            handleToggleChildChips={handleToggleChildChips}
          />
        </Allotment.Pane>
      </Allotment>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        doc={doc}
        initialFormat={exportInitialFormat}
        includeLegend={includeLegend}
        setIncludeLegend={setIncludeLegend}
      />
      <OdToastHost />
    </main>
  );
}
