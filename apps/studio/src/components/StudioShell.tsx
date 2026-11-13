import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { DeviceType, ShapeId } from "@open-draw/canvas";
import type { Command, Shape } from "@open-draw/canvas";
import {
  CONTROLLER_EVENTS,
  createEditor,
  TOOLS,
  type Editor,
  type ToolId,
} from "@open-draw/canvas";
import { useToast } from "@open-draw/ui";
import { computeSemanticChipOverlays } from "../canvas-overlays";
import { useRootChipVisibility } from "../use-root-chip-visibility";
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
import { normalizeStudioDocument } from "../normalize-document";
import { useUiTheme } from "../use-ui-theme";

export interface StudioShellProps {
  readonly onBackToLanding?: () => void;
}

export function StudioShell({ onBackToLanding }: StudioShellProps): React.JSX.Element {
  const toast = useToast();
  const { theme, toggleTheme } = useUiTheme();
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const initialDoc = useMemo(() => loadInitialDocument(), []);
  const {
    initialRootIds,
    visibleChipRoots,
    handleToggleChildChips,
    interceptPointerDown,
    syncVisibleChipRoots,
  } = useRootChipVisibility({ initialDoc, editorRef });

  const subscribeDoc = useCallback(
    (onStoreChange: () => void) => {
      if (editor === null) return () => {};
      return editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
        const curDoc = editor.getDocument();
        const normalized = normalizeStudioDocument(curDoc);
        if (normalized !== curDoc) {
          const selected = editor.getSelection();
          editor.setDocument(normalized, { preserveHistory: true });
          if (selected.length > 0) {
            editor.selectMany(selected);
          }
          return;
        }
        saveDraftDocument(curDoc);
        syncVisibleChipRoots(curDoc, editor.canvas);
        onStoreChange();
      });
    },
    [editor, syncVisibleChipRoots],
  );

  const getDocSnapshot = useCallback(
    () => (editor !== null ? editor.getDocument() : initialDoc),
    [editor, initialDoc],
  );

  const doc = useSyncExternalStore(subscribeDoc, getDocSnapshot, () => initialDoc);
  const getDoc = useCallback(() => editorRef.current?.getDocument() ?? initialDoc, [initialDoc]);
  const toastRef = useRef(toast);
  useStudioDraft(getDoc);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [tool, setTool] = useState<ToolId>(TOOLS.select);
  const [selectedShapeId, setSelectedShapeId] = useState<ShapeId | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<readonly ShapeId[]>([]);
  const [activeDeviceType, setActiveDeviceType] = useState<DeviceType | undefined>(undefined);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [includeLegend, setIncludeLegend] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat>("markdown");

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container === null) return;

    const newEditor = createEditor(container, {
      document: initialDoc,
      tool: TOOLS.select,
      nestingMode: "containers-only",
      canvasOptions: {
        visibleChipRootIds: initialRootIds,
      },
      onFallback: (msg) => toastRef.current.push({ type: "info", text: msg }),
      renderCustomOverlays: (ctx) =>
        computeSemanticChipOverlays({
          doc: ctx.doc,
          selectedIds: ctx.selectedIds,
          zoom: ctx.zoom,
          visibleChipRootIds: ctx.canvas.getVisibleChipRootIds(),
        }),
      interceptPointerDown,
    });

    editorRef.current = newEditor;
    setEditor(newEditor);

    const unsubSel = newEditor.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
      setSelectedShapeIds(newEditor.getSelection());
      setSelectedShapeId(newEditor.canvas.getSelectedId());
    });
    const unsubTool = newEditor.subscribe(CONTROLLER_EVENTS.toolChanged, () => {
      setTool(newEditor.getTool());
    });
    const unsubCam = newEditor.subscribe(CONTROLLER_EVENTS.cameraChanged, () => {
      setZoomPercent(Math.round(newEditor.getCamera().zoom * 100));
    });

    return () => {
      unsubSel();
      unsubTool();
      unsubCam();
      newEditor.destroy();
      editorRef.current = null;
      setEditor(null);
    };
  }, [initialDoc, initialRootIds, interceptPointerDown]);

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
    const ed = editorRef.current;
    if (ed) {
      ed.canvas.setActiveDeviceType(deviceType);
      ed.render();
    }
    setActiveDeviceType(deviceType);
  };

  const handleZoom = (factor: number): void => {
    const ed = editorRef.current;
    if (!ed) return;
    if (factor > 1) ed.zoomIn();
    else ed.zoomOut();
    setZoomPercent(Math.round(ed.getCamera().zoom * 100));
  };

  const handleResetZoom = (): void => {
    editorRef.current?.resetZoom();
    setZoomPercent(100);
  };

  const selectShape = (id: ShapeId): void => {
    editorRef.current?.select(id);
    setSelectedShapeId(id);
  };

  const render = (): void => editorRef.current?.render();
  const commit = (cmds: readonly Command[], opts?: { record?: boolean }): void =>
    editorRef.current?.execute(cmds, opts);

  const toolbarActions = useToolbarActions({
    getDoc,
    editorRef,
    includeLegend,
    toast,
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
    doc,
    selectedShapes,
    clearSelection: () => editorRef.current?.clearSelection(),
    selectShape,
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
        <CanvasDock tool={tool} chooseTool={chooseTool} handleLoad={toolbarActions.handleLoad} />
      }
      zoomSlot={
        <CanvasZoomControls
          zoomPercent={zoomPercent}
          handleZoom={handleZoom}
          handleResetZoom={handleResetZoom}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      }
      sidebarSlot={
        <Sidebar
          {...inspection}
          {...mutations}
          {...geometryMutations}
          {...themeMutations}
          {...batchMutations}
          doc={doc}
          rootShape={inspection.rootShape}
          isScopedToRoot={inspection.isScopedToRoot}
          activeRootTitle={inspection.activeRootTitle}
          onClearScope={() => editorRef.current?.clearSelection()}
          onOpenAdvancedModal={() => handleOpenExportModal("markdown")}
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
            selectedShapeId={selectedShapeId}
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
