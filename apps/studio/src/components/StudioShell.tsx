import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceType, ShapeId } from "@open-draw/contracts";
import type { Command, Document, Shape } from "@open-draw/document";
import {
  CONTROLLER_EVENTS,
  createEditor,
  TOOLS,
  type Editor,
  type ToolId,
} from "@open-draw/canvas";
import { useToast } from "@open-draw/ui";
import { computeSemanticChipOverlays, pickAnyRootChip } from "../canvas-overlays";
import { StudioLayout } from "../templates/StudioLayout";

import { Sidebar } from "./Sidebar";
import { CanvasBrand } from "./CanvasBrand";
import { CanvasDock } from "./CanvasDock";
import { CanvasShortcutsTrigger } from "./CanvasShortcutsTrigger";
import { CanvasZoomControls } from "./CanvasZoomControls";
import { ExportModal, type ExportFormat } from "./ExportModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { useBatchMutations } from "../use-batch-mutations";
import { useDocumentMutations } from "../use-document-mutations";
import { useGeometryMutations } from "../use-geometry-mutations";
import { computeInspectionData } from "../use-inspection-data";
import { useRootThemeMutations } from "../use-root-theme-mutations";
import { useToolbarActions } from "../use-toolbar-actions";
import { loadInitialDocument, saveDraftDocument, useStudioDraft } from "../use-studio-draft";

export interface StudioShellProps {
  readonly onBackToLanding?: () => void;
}

export function StudioShell({ onBackToLanding }: StudioShellProps): React.JSX.Element {
  const toast = useToast();
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const [doc, setDoc] = useState<Document>(() => loadInitialDocument());
  const documentRef = useRef<Document>(doc);
  const toastRef = useRef(toast);
  useStudioDraft(documentRef);
  useEffect(() => {
    documentRef.current = doc;
    toastRef.current = toast;
  }, [doc, toast]);

  const [tool, setTool] = useState<ToolId>(TOOLS.select);
  const [selectedShapeId, setSelectedShapeId] = useState<ShapeId | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<readonly ShapeId[]>([]);
  const [activeDeviceType, setActiveDeviceType] = useState<DeviceType | undefined>(undefined);
  const [visibleChipRoots, setVisibleChipRoots] = useState<ReadonlySet<ShapeId>>(() => new Set());
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [includeLegend, setIncludeLegend] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat>("markdown");

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container === null) return;

    const editor = createEditor(container, {
      document: documentRef.current,
      tool: TOOLS.select,
      nestingMode: "containers-only",
      onFallback: (msg) => toastRef.current.push({ type: "info", text: msg }),
      renderCustomOverlays: (ctx) => {
        return computeSemanticChipOverlays({
          doc: ctx.doc,
          selectedIds: ctx.selectedIds,
          zoom: ctx.zoom,
          visibleChipRootIds: ctx.canvas.getVisibleChipRootIds(),
        });
      },
      interceptPointerDown: (_event, { world, canvas, doc: curDoc }) => {
        const zoom = canvas.getCamera().zoom;
        const hitChip = pickAnyRootChip(curDoc, world, zoom);
        if (hitChip !== null) {
          canvas.toggleRootChipsVisible(hitChip);
          setVisibleChipRoots(new Set(canvas.getVisibleChipRootIds()));
          editor.render();
          return true;
        }
        return false;
      },
    });

    editorRef.current = editor;

    const unsubDoc = editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      const nextDoc = editor.getDocument();
      documentRef.current = nextDoc;
      setDoc(nextDoc);
      saveDraftDocument(nextDoc);
    });
    const unsubSel = editor.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
      setSelectedShapeIds(editor.getSelection());
      setSelectedShapeId(editor.canvas.getSelectedId());
    });
    const unsubTool = editor.subscribe(CONTROLLER_EVENTS.toolChanged, () => {
      setTool(editor.getTool());
    });
    const unsubCam = editor.subscribe(CONTROLLER_EVENTS.cameraChanged, () => {
      setZoomPercent(Math.round(editor.getCamera().zoom * 100));
    });

    return () => {
      unsubDoc();
      unsubSel();
      unsubTool();
      unsubCam();
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable ||
        Boolean(target.closest?.("[contenteditable='true']"))
      ) {
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleOpenExportModal = (initial: ExportFormat = "markdown") => {
    setExportInitialFormat(initial);
    setIsExportModalOpen(true);
  };

  const chooseTool = (next: ToolId): void => {
    editorRef.current?.setTool(next);
    setTool(next);
  };

  const handleDeviceChange = (deviceType?: DeviceType): void => {
    const editor = editorRef.current;
    if (editor) {
      editor.canvas.setActiveDeviceType(deviceType);
      editor.render();
    }
    setActiveDeviceType(deviceType);
  };

  const handleToggleChildChips = (rootId: ShapeId): void => {
    const editor = editorRef.current;
    if (editor === null) return;
    editor.canvas.toggleRootChipsVisible(rootId);
    setVisibleChipRoots(new Set(editor.canvas.getVisibleChipRootIds()));
    editor.render();
  };

  const handleZoom = (factor: number): void => {
    const editor = editorRef.current;
    if (editor === null) return;
    if (factor > 1) {
      editor.zoomIn();
    } else {
      editor.zoomOut();
    }
    setZoomPercent(Math.round(editor.getCamera().zoom * 100));
  };

  const handleResetZoom = (): void => {
    editorRef.current?.resetZoom();
    setZoomPercent(100);
  };

  const selectShape = (id: ShapeId): void => {
    editorRef.current?.select(id);
    setSelectedShapeId(id);
  };

  function render(): void {
    editorRef.current?.render();
  }

  function commit(commands: readonly Command[], options?: { record?: boolean }): void {
    editorRef.current?.execute(commands, options);
  }

  const toolbarActions = useToolbarActions({
    documentRef,
    editorRef,
    includeLegend,
    toast,
    setDoc,
    setSelectedShapeId,
    commit,
    render,
  });

  const inspection = useMemo(
    () => computeInspectionData(doc, selectedShapeId, activeDeviceType),
    [doc, selectedShapeId, activeDeviceType],
  );
  const mutations = useDocumentMutations({
    selectedShape: inspection.selectedShape,
    rootShape: inspection.rootShape,
    activeProfile: inspection.activeProfile,
    activeDeviceType,
    setActiveDeviceType: handleDeviceChange,
    commit,
    render,
  });
  const geometryMutations = useGeometryMutations({
    selectedShape: inspection.selectedShape,
    commit,
    render,
  });

  const selectedShapes = useMemo(
    () => selectedShapeIds.map((id) => doc.shapes[id]).filter((s): s is Shape => s !== undefined),
    [doc, selectedShapeIds],
  );
  const batchMutations = useBatchMutations({
    selectedShapes,
    clearSelection: () => editorRef.current?.clearSelection(),
    commit,
    render,
  });
  const themeMutations = useRootThemeMutations({
    selectedShape: inspection.selectedShape,
    rootShape: inspection.rootShape,
    commit,
    render,
  });

  const emptyDoc = Object.keys(doc.shapes).length === 0;

  return (
    <StudioLayout
      canvasContainerRef={canvasContainerRef}
      showSidebar={showSidebar}
      onToggleSidebar={setShowSidebar}
      brandSlot={<CanvasBrand onBackToLanding={onBackToLanding} />}
      hintSlot={
        emptyDoc ? (
          <div className="od-canvas-hint">R rect · O ellipse · L line · P pen — wheel to pan</div>
        ) : undefined
      }
      shortcutsSlot={<CanvasShortcutsTrigger onOpenShortcuts={() => setIsShortcutsOpen(true)} />}
      dockSlot={
        <CanvasDock
          tool={tool}
          chooseTool={chooseTool}
          handleLoad={toolbarActions.handleLoad}
          onOpenExportModal={() => handleOpenExportModal("markdown")}
        />
      }
      zoomSlot={
        <CanvasZoomControls
          zoomPercent={zoomPercent}
          handleZoom={handleZoom}
          handleResetZoom={handleResetZoom}
        />
      }
      sidebarSlot={
        <Sidebar
          {...inspection}
          {...mutations}
          {...geometryMutations}
          {...themeMutations}
          {...batchMutations}
          selectedShapes={selectedShapes}
          selectedShapeId={selectedShapeId}
          selectShape={selectShape}
          showChildChips={selectedShapeId ? visibleChipRoots.has(selectedShapeId) : false}
          handleToggleChildChips={handleToggleChildChips}
          onClose={() => setShowSidebar(false)}
        />
      }
      modalSlot={
        <>
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            doc={doc}
            initialFormat={exportInitialFormat}
            includeLegend={includeLegend}
            setIncludeLegend={setIncludeLegend}
          />
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        </>
      }
    />
  );
}
