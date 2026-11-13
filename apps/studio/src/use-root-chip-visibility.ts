import { useCallback, useMemo, useRef, useState } from "react";
import { isRootId, type ShapeId } from "@open-draw/canvas";
import type { CanvasController, Editor } from "@open-draw/canvas";
import type { Document } from "@open-draw/canvas";
import { getRootContainerIds, pickAnyRootChip } from "./canvas-overlays";

export function syncVisibleChipRoots(
  curDoc: Document,
  canvas: CanvasController,
  disabledRoots: ReadonlySet<ShapeId>,
): Set<ShapeId> {
  for (const shape of Object.values(curDoc.shapes)) {
    if (isRootId(shape.parentId)) {
      if (!disabledRoots.has(shape.id)) {
        if (!canvas.isRootChipsVisible(shape.id)) {
          canvas.setRootChipsVisible(shape.id, true);
        }
      } else {
        if (canvas.isRootChipsVisible(shape.id)) {
          canvas.setRootChipsVisible(shape.id, false);
        }
      }
    }
  }
  return new Set(canvas.getVisibleChipRootIds());
}

export function toggleRootChip(
  rootId: ShapeId,
  canvas: CanvasController,
  disabledRoots: Set<ShapeId>,
): boolean {
  if (canvas.isRootChipsVisible(rootId)) {
    disabledRoots.add(rootId);
    canvas.setRootChipsVisible(rootId, false);
    return false;
  }
  disabledRoots.delete(rootId);
  canvas.setRootChipsVisible(rootId, true);
  return true;
}

export interface UseRootChipVisibilityOptions {
  readonly initialDoc: Document;
  readonly editorRef: React.MutableRefObject<Editor | null>;
}

export interface UseRootChipVisibilityResult {
  readonly initialRootIds: ReadonlySet<ShapeId>;
  readonly visibleChipRoots: ReadonlySet<ShapeId>;
  readonly handleToggleChildChips: (rootId: ShapeId) => void;
  readonly interceptPointerDown: (
    event: PointerEvent,
    context: {
      readonly world: { readonly x: number; readonly y: number };
      readonly canvas: CanvasController;
      readonly doc: Document;
    },
  ) => boolean | void;
  readonly syncVisibleChipRoots: (doc: Document, canvas: CanvasController) => void;
}

export function useRootChipVisibility(
  options: UseRootChipVisibilityOptions,
): UseRootChipVisibilityResult {
  const { initialDoc, editorRef } = options;
  const disabledChipRootsRef = useRef<Set<ShapeId>>(new Set());

  const initialRootIds = useMemo(() => new Set(getRootContainerIds(initialDoc)), [initialDoc]);

  const [visibleChipRoots, setVisibleChipRoots] = useState<ReadonlySet<ShapeId>>(
    () => initialRootIds,
  );

  const sync = useCallback((curDoc: Document, canvas: CanvasController): void => {
    const nextVisible = syncVisibleChipRoots(curDoc, canvas, disabledChipRootsRef.current);
    setVisibleChipRoots(nextVisible);
  }, []);

  const handleToggleChildChips = useCallback(
    (rootId: ShapeId): void => {
      const ed = editorRef.current;
      if (!ed) return;
      toggleRootChip(rootId, ed.canvas, disabledChipRootsRef.current);
      setVisibleChipRoots(new Set(ed.canvas.getVisibleChipRootIds()));
      ed.render();
    },
    [editorRef],
  );

  const interceptPointerDown = useCallback(
    (
      _event: PointerEvent,
      {
        world,
        canvas,
        doc: curDoc,
      }: {
        readonly world: { readonly x: number; readonly y: number };
        readonly canvas: CanvasController;
        readonly doc: Document;
      },
    ): boolean => {
      const hitChip = pickAnyRootChip(curDoc, world, canvas.getCamera().zoom);
      if (hitChip !== null) {
        toggleRootChip(hitChip, canvas, disabledChipRootsRef.current);
        setVisibleChipRoots(new Set(canvas.getVisibleChipRootIds()));
        editorRef.current?.render();
        return true;
      }
      return false;
    },
    [editorRef],
  );

  return {
    initialRootIds,
    visibleChipRoots,
    handleToggleChildChips,
    interceptPointerDown,
    syncVisibleChipRoots: sync,
  };
}
