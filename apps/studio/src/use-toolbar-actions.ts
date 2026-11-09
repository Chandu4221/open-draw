import {
  COMMANDS,
  DocumentError,
  EMPTY_HISTORY,
  pruneSelectedDescendants,
  redo,
  subtreeOf,
  undo,
  type Command,
  type Document,
  type HistoryState,
} from "@open-draw/document";
import {
  createShapeIdGenerator,
  seedShapeSequence,
  type CanvasController,
  type Editor,
} from "@open-draw/canvas";
import type { ShapeId } from "@open-draw/contracts";
import type { useToast } from "@open-draw/ui";
import {
  exportDocumentJson,
  exportDocumentMarkdown,
  exportDocumentPng,
  exportDocumentSvg,
  promptLoadDocumentJson,
} from "./document-io";

export interface UseToolbarActionsProps {
  readonly documentRef: React.MutableRefObject<Document>;
  readonly historyRef: React.MutableRefObject<HistoryState>;
  readonly canvasRef: React.MutableRefObject<CanvasController>;
  readonly editorRef?: React.MutableRefObject<Editor | null> | undefined;
  readonly includeLegend: boolean;
  readonly toast: ReturnType<typeof useToast>;
  readonly setDoc: (doc: Document) => void;
  readonly setSelectedShapeId: (id: ShapeId | null) => void;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export function useToolbarActions(props: UseToolbarActionsProps) {
  const {
    documentRef,
    historyRef,
    canvasRef,
    editorRef,
    includeLegend,
    toast,
    setDoc,
    setSelectedShapeId,
    commit,
    render,
  } = props;

  function handleSave(): void {
    try {
      exportDocumentJson(documentRef.current);
      toast.push({ type: "success", text: "Document saved successfully" });
    } catch (err) {
      toast.push({
        type: "error",
        text: `Save error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  function handleExportMarkdown(): void {
    try {
      exportDocumentMarkdown(documentRef.current);
      toast.push({ type: "success", text: "Exported Markdown successfully" });
    } catch (err) {
      toast.push({
        type: "error",
        text: `Export error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  function handleExportSvg(): void {
    try {
      exportDocumentSvg(documentRef.current, includeLegend);
      toast.push({ type: "success", text: "Exported SVG successfully" });
    } catch (err) {
      toast.push({
        type: "error",
        text: `Export error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  function handleExportPng(): void {
    try {
      exportDocumentPng(documentRef.current, includeLegend, (err) => {
        toast.push({
          type: "error",
          text: `Export error: ${err instanceof Error ? err.message : String(err)}`,
        });
      });
      toast.push({ type: "success", text: "Exported PNG successfully" });
    } catch (err) {
      toast.push({
        type: "error",
        text: `Export error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  function handleLoad(): void {
    promptLoadDocumentJson(
      (loaded) => {
        if (editorRef?.current) {
          editorRef.current.setDocument(loaded);
        } else {
          documentRef.current = loaded;
          seedShapeSequence(loaded);
          historyRef.current = EMPTY_HISTORY;
          canvasRef.current.clearSelection();
          setSelectedShapeId(null);
          setDoc(loaded);
          render();
        }
        toast.push({ type: "success", text: "Document loaded successfully" });
      },
      (err) => {
        const msg =
          err instanceof DocumentError
            ? `Load error (${err.code}): ${err.message}`
            : `Load error: ${err instanceof Error ? err.message : String(err)}`;
        toast.push({ type: "error", text: msg });
      },
    );
  }

  function handleUndo(): void {
    if (editorRef?.current) {
      if (editorRef.current.undo()) {
        toast.push({ type: "info", text: "Undo performed" });
      }
      return;
    }
    const undone = undo(documentRef.current, historyRef.current);
    if (undone !== null) {
      documentRef.current = undone.document;
      historyRef.current = undone.history;
      setSelectedShapeId(canvasRef.current.getSelectedId());
      setDoc(undone.document);
      toast.push({ type: "info", text: "Undo performed" });
      render();
    }
  }

  function handleRedo(): void {
    if (editorRef?.current) {
      if (editorRef.current.redo()) {
        toast.push({ type: "info", text: "Redo performed" });
      }
      return;
    }
    const redone = redo(documentRef.current, historyRef.current);
    if (redone !== null) {
      documentRef.current = redone.document;
      historyRef.current = redone.history;
      setSelectedShapeId(canvasRef.current.getSelectedId());
      setDoc(redone.document);
      toast.push({ type: "info", text: "Redo performed" });
      render();
    }
  }

  function handleDelete(): void {
    const ids = editorRef?.current
      ? editorRef.current.getSelection()
      : canvasRef.current.getSelectedIds();
    if (ids.length > 0) {
      commit(ids.map((id) => ({ type: COMMANDS.deleteShape, id })));
      if (editorRef?.current) {
        editorRef.current.clearSelection();
      } else {
        canvasRef.current.clearSelection();
      }
      setSelectedShapeId(null);
      toast.push({
        type: "info",
        text: ids.length === 1 ? `Deleted shape: ${ids[0]}` : `Deleted ${ids.length} shapes`,
      });
      render();
    }
  }

  function handleDuplicate(): void {
    const ids = editorRef?.current
      ? editorRef.current.getSelection()
      : canvasRef.current.getSelectedIds();
    if (ids.length === 0) return;
    const currentDoc = documentRef.current;
    const topLevelIds = pruneSelectedDescendants(currentDoc, ids);
    if (topLevelIds.length === 0) return;
    const seq = createShapeIdGenerator(currentDoc);
    const newShapeIds: Record<ShapeId, ShapeId> = {};
    for (const topId of topLevelIds) {
      for (const s of subtreeOf(currentDoc, topId)) {
        newShapeIds[s.id] = seq.nextShapeId();
      }
    }
    commit([{ type: COMMANDS.duplicateShapes, ids: topLevelIds, dx: 20, dy: 20, newShapeIds }]);
    const newTopIds = topLevelIds.map((id) => newShapeIds[id]!);
    if (editorRef?.current) {
      editorRef.current.selectMany(newTopIds);
    } else {
      canvasRef.current.selectMany(newTopIds);
    }
    setSelectedShapeId(newTopIds.length === 1 ? newTopIds[0]! : null);
    toast.push({
      type: "info",
      text:
        newTopIds.length === 1
          ? `Duplicated shape: ${newTopIds[0]}`
          : `Duplicated ${newTopIds.length} shapes`,
    });
    render();
  }

  return {
    handleSave,
    handleExportMarkdown,
    handleExportSvg,
    handleExportPng,
    handleLoad,
    handleUndo,
    handleRedo,
    handleDelete,
    handleDuplicate,
  };
}
