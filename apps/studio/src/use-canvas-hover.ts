import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor, ShapeId } from "@open-draw/canvas";

export function pickHoveredShape(
  ed: Editor,
  clientPoint: { readonly x: number; readonly y: number },
): ShapeId | null {
  if (ed.canvas.getMachineState().stateId !== "idle") {
    return null;
  }
  const rect = ed.svg.getBoundingClientRect();
  const screenPoint = { x: clientPoint.x - rect.left, y: clientPoint.y - rect.top };
  const worldPoint = ed.canvas.screenToWorld(screenPoint);
  return ed.canvas.pickShape(ed.getDocument(), worldPoint);
}

export function attachCanvasHoverListeners(options: {
  readonly editor: Editor;
  readonly onHover: (id: ShapeId | null) => void;
}): () => void {
  const { editor, onHover } = options;
  const svg = editor.svg;

  const onPointerMove = (e: PointerEvent) => {
    const hitId = pickHoveredShape(editor, { x: e.clientX, y: e.clientY });
    onHover(hitId);
  };

  const onPointerLeave = () => {
    onHover(null);
  };

  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerleave", onPointerLeave);

  return () => {
    svg.removeEventListener("pointermove", onPointerMove);
    svg.removeEventListener("pointerleave", onPointerLeave);
  };
}

export interface UseCanvasHoverOptions {
  readonly editor: Editor | null;
  readonly editorRef: React.MutableRefObject<Editor | null>;
}

export interface UseCanvasHoverResult {
  readonly hoveredShapeId: ShapeId | null;
  readonly hoveredShapeIdRef: React.MutableRefObject<ShapeId | null>;
  readonly setHoveredShapeId: (id: ShapeId | null) => void;
}

export function useCanvasHover(options: UseCanvasHoverOptions): UseCanvasHoverResult {
  const { editor, editorRef } = options;
  const [hoveredShapeId, setHoveredShapeIdState] = useState<ShapeId | null>(null);
  const hoveredShapeIdRef = useRef<ShapeId | null>(null);

  const setHoveredShapeId = useCallback(
    (nextId: ShapeId | null) => {
      if (hoveredShapeIdRef.current === nextId) return;
      hoveredShapeIdRef.current = nextId;
      setHoveredShapeIdState(nextId);
      editorRef.current?.render();
    },
    [editorRef],
  );

  useEffect(() => {
    if (editor === null) return;
    return attachCanvasHoverListeners({
      editor,
      onHover: setHoveredShapeId,
    });
  }, [editor, setHoveredShapeId]);

  return {
    hoveredShapeId,
    hoveredShapeIdRef,
    setHoveredShapeId,
  };
}
