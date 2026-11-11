import { createShapeIdGenerator } from "@open-draw/canvas";
import {
  isRootId,
  ROOT_ID,
  ROOT_ROLES,
  type BoundingBox,
  type ShapeId,
} from "@open-draw/contracts";
import {
  COMMANDS,
  createSection,
  type Command,
  type Document,
  type Shape,
} from "@open-draw/document";

export interface BatchMutationsProps {
  readonly doc?: Document | undefined;
  readonly selectedShapes: readonly Shape[];
  readonly clearSelection: () => void;
  readonly selectShape?: ((id: ShapeId) => void) | undefined;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export interface BatchMutations {
  readonly handleBatchAlign: (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ) => void;
  readonly handleBatchDistribute: (axis: "horizontal" | "vertical") => void;
  readonly handleBatchStyleChange: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly handleBatchDelete: () => void;
  readonly handleClearSelection: () => void;
  readonly handleBatchGroupProjectSpace: () => void;
}

export function useBatchMutations(props: BatchMutationsProps): BatchMutations {
  const { doc, selectedShapes, clearSelection, selectShape, commit, render } = props;

  function handleBatchAlign(
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ): void {
    if (selectedShapes.length < 2) return;
    const boxes = selectedShapes.map((s) => s.boundingBox);
    const minX = Math.min(...boxes.map((b) => b.x));
    const maxX = Math.max(...boxes.map((b) => b.x + b.width));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxY = Math.max(...boxes.map((b) => b.y + b.height));

    const commands: Command[] = selectedShapes.map((shape) => {
      const b = shape.boundingBox;
      let nextX = b.x;
      let nextY = b.y;

      switch (alignment) {
        case "left":
          nextX = minX;
          break;
        case "center":
          nextX = minX + (maxX - minX - b.width) / 2;
          break;
        case "right":
          nextX = maxX - b.width;
          break;
        case "top":
          nextY = minY;
          break;
        case "middle":
          nextY = minY + (maxY - minY - b.height) / 2;
          break;
        case "bottom":
          nextY = maxY - b.height;
          break;
      }

      return {
        type: COMMANDS.setShapeBoundingBox,
        id: shape.id,
        boundingBox: { ...b, x: Math.round(nextX), y: Math.round(nextY) },
      };
    });

    commit(commands);
    render();
  }

  function handleBatchDistribute(axis: "horizontal" | "vertical"): void {
    if (selectedShapes.length < 3) return;

    if (axis === "horizontal") {
      const sorted = [...selectedShapes].sort((a, b) => a.boundingBox.x - b.boundingBox.x);
      const firstX = sorted[0]!.boundingBox.x;
      const lastRight =
        sorted[sorted.length - 1]!.boundingBox.x + sorted[sorted.length - 1]!.boundingBox.width;
      const totalWidths = sorted.reduce((sum, s) => sum + s.boundingBox.width, 0);
      const totalGapSpace = lastRight - firstX - totalWidths;
      const gap = totalGapSpace / (sorted.length - 1);

      let currentX = firstX;
      const commands: Command[] = sorted.map((shape, index) => {
        const b = shape.boundingBox;
        const newX = index === 0 ? firstX : currentX;
        currentX = newX + b.width + gap;
        return {
          type: COMMANDS.setShapeBoundingBox,
          id: shape.id,
          boundingBox: { ...b, x: Math.round(newX) },
        };
      });

      commit(commands);
      render();
    } else {
      const sorted = [...selectedShapes].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
      const firstY = sorted[0]!.boundingBox.y;
      const lastBottom =
        sorted[sorted.length - 1]!.boundingBox.y + sorted[sorted.length - 1]!.boundingBox.height;
      const totalHeights = sorted.reduce((sum, s) => sum + s.boundingBox.height, 0);
      const totalGapSpace = lastBottom - firstY - totalHeights;
      const gap = totalGapSpace / (sorted.length - 1);

      let currentY = firstY;
      const commands: Command[] = sorted.map((shape, index) => {
        const b = shape.boundingBox;
        const newY = index === 0 ? firstY : currentY;
        currentY = newY + b.height + gap;
        return {
          type: COMMANDS.setShapeBoundingBox,
          id: shape.id,
          boundingBox: { ...b, y: Math.round(newY) },
        };
      });

      commit(commands);
      render();
    }
  }

  function handleBatchStyleChange(
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ): void {
    if (selectedShapes.length === 0) return;
    const commands: Command[] = selectedShapes.map((shape) => ({
      type: COMMANDS.setShapeStyle,
      id: shape.id,
      fill,
      stroke,
      strokeWidth,
    }));
    commit(commands);
    render();
  }

  function handleBatchDelete(): void {
    if (selectedShapes.length === 0) return;
    const commands: Command[] = selectedShapes.map((shape) => ({
      type: COMMANDS.deleteShape,
      id: shape.id,
    }));
    clearSelection();
    commit(commands);
    render();
  }

  function handleClearSelection(): void {
    clearSelection();
    render();
  }

  function handleBatchGroupProjectSpace(): void {
    if (selectedShapes.length === 0 || !doc) return;
    const boxes = selectedShapes.map((s) => s.boundingBox);
    const minX = Math.min(...boxes.map((b) => b.x));
    const maxX = Math.max(...boxes.map((b) => b.x + b.width));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxY = Math.max(...boxes.map((b) => b.y + b.height));
    const padding = 40;
    const projectBox: BoundingBox = {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };

    const commonPlatform = selectedShapes.find((s) => s.meta.platform !== undefined)?.meta.platform;
    const commonDesignStyle = selectedShapes.find((s) => s.meta.designStyle !== undefined)?.meta
      .designStyle;
    const commonTheme = selectedShapes.find((s) => s.meta.theme !== undefined)?.meta.theme;
    const commonStyle = selectedShapes.find((s) => s.meta.style !== undefined)?.meta.style;

    const seq = createShapeIdGenerator(doc);
    const projectId = seq.nextShapeId();

    const createCmd: Command = {
      type: COMMANDS.createShape,
      shape: createSection(projectId, projectBox, "row", {
        parent: ROOT_ID,
        label: "Project Space",
        meta: {
          order: {},
          role: ROOT_ROLES.project,
          ...(commonPlatform !== undefined ? { platform: commonPlatform } : {}),
          ...(commonDesignStyle !== undefined ? { designStyle: commonDesignStyle } : {}),
          ...(commonTheme !== undefined ? { theme: commonTheme } : {}),
          ...(commonStyle !== undefined ? { style: commonStyle } : {}),
        },
      }),
    };

    const clearCmds: Command[] = [];
    for (const shape of selectedShapes) {
      if (isRootId(shape.parentId)) {
        if (shape.meta.platform !== undefined) {
          clearCmds.push({ type: COMMANDS.setRootPlatform, id: shape.id, platform: null });
        }
        if (shape.meta.role !== undefined) {
          clearCmds.push({ type: COMMANDS.setRootRole, id: shape.id, role: null });
        }
        if (shape.meta.theme !== undefined) {
          clearCmds.push({ type: COMMANDS.setRootTheme, id: shape.id, theme: null });
        }
        if (shape.meta.designStyle !== undefined) {
          clearCmds.push({ type: COMMANDS.setRootDesignStyle, id: shape.id, designStyle: null });
        }
        if (shape.meta.darkMode !== undefined) {
          clearCmds.push({ type: COMMANDS.setRootDarkMode, id: shape.id, darkMode: null });
        }
      }
    }

    const reparentCmds: Command[] = selectedShapes.map((shape) => ({
      type: COMMANDS.reparentShape,
      id: shape.id,
      parentId: projectId,
      boundingBox: {
        x: shape.boundingBox.x - projectBox.x,
        y: shape.boundingBox.y - projectBox.y,
        width: shape.boundingBox.width,
        height: shape.boundingBox.height,
      },
    }));

    commit([createCmd, ...clearCmds, ...reparentCmds]);
    selectShape?.(projectId);
    render();
  }

  return {
    handleBatchAlign,
    handleBatchDistribute,
    handleBatchStyleChange,
    handleBatchDelete,
    handleClearSelection,
    handleBatchGroupProjectSpace,
  };
}
