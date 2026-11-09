import {
  COMMANDS,
  DocumentError,
  pruneSelectedDescendants,
  subtreeOf,
  type Command,
  type Document,
} from "@open-draw/document";
import { createShapeIdGenerator, type Editor } from "@open-draw/canvas";
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
  readonly editorRef: React.MutableRefObject<Editor | null>;
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
        if (editorRef.current) {
          editorRef.current.setDocument(loaded);
        } else {
          documentRef.current = loaded;
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
    const editor = editorRef.current;
    if (editor && editor.undo()) {
      toast.push({ type: "info", text: "Undo performed" });
    }
  }

  function handleRedo(): void {
    const editor = editorRef.current;
    if (editor && editor.redo()) {
      toast.push({ type: "info", text: "Redo performed" });
    }
  }

  function handleDelete(): void {
    const editor = editorRef.current;
    const ids = editor ? editor.getSelection() : [];
    if (ids.length > 0) {
      commit(ids.map((id) => ({ type: COMMANDS.deleteShape, id })));
      editor?.clearSelection();
      setSelectedShapeId(null);
      toast.push({
        type: "info",
        text: ids.length === 1 ? `Deleted shape: ${ids[0]}` : `Deleted ${ids.length} shapes`,
      });
      render();
    }
  }

  function handleDuplicate(): void {
    const editor = editorRef.current;
    const ids = editor ? editor.getSelection() : [];
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
    editor?.selectMany(newTopIds);
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
