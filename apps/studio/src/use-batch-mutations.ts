import type { CanvasController } from "@open-draw/canvas";
import { COMMANDS, type Command, type Shape } from "@open-draw/document";

export interface BatchMutationsProps {
  readonly selectedShapes: readonly Shape[];
  readonly canvasRef: React.MutableRefObject<CanvasController>;
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
}

export function useBatchMutations(props: BatchMutationsProps): BatchMutations {
  const { selectedShapes, canvasRef, commit, render } = props;

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
    canvasRef.current.clearSelection();
    commit(commands);
    render();
  }

  function handleClearSelection(): void {
    canvasRef.current.clearSelection();
    render();
  }

  return {
    handleBatchAlign,
    handleBatchDistribute,
    handleBatchStyleChange,
    handleBatchDelete,
    handleClearSelection,
  };
}
