import { describe, expect, it, vi } from "vitest";
import { ROOT_ID, ROOT_ROLES, SHAPE_KINDS, type ShapeId } from "@open-draw/contracts";
import { COMMANDS, createDocument, type Shape } from "@open-draw/document";
import { useBatchMutations } from "./use-batch-mutations";

function createMockShape(
  id: string,
  x: number,
  y: number,
  width = 100,
  height = 50,
  meta: Shape["meta"] = { order: {} },
): Shape {
  return {
    id: id as ShapeId,
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x, y, width, height },
    meta,
  };
}

describe("useBatchMutations", () => {
  it("aligns left edges of multiple selected shapes to the leftmost boundary", () => {
    const s1 = createMockShape("s1", 100, 50);
    const s2 = createMockShape("s2", 200, 80);
    const commit = vi.fn();
    const render = vi.fn();
    const clearSelection = vi.fn();

    const { handleBatchAlign } = useBatchMutations({
      selectedShapes: [s1, s2],
      clearSelection,
      commit,
      render,
    });

    handleBatchAlign("left");

    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapeBoundingBox,
        id: "s1",
        boundingBox: { x: 100, y: 50, width: 100, height: 50 },
      },
      {
        type: COMMANDS.setShapeBoundingBox,
        id: "s2",
        boundingBox: { x: 100, y: 80, width: 100, height: 50 },
      },
    ]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("applies style batch changes to all selected shapes", () => {
    const s1 = createMockShape("s1", 10, 10);
    const s2 = createMockShape("s2", 20, 20);
    const commit = vi.fn();
    const render = vi.fn();
    const clearSelection = vi.fn();

    const { handleBatchStyleChange } = useBatchMutations({
      selectedShapes: [s1, s2],
      clearSelection,
      commit,
      render,
    });

    handleBatchStyleChange("#ff0000", "#000000", 2);

    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapeStyle,
        id: "s1",
        fill: "#ff0000",
        stroke: "#000000",
        strokeWidth: 2,
      },
      {
        type: COMMANDS.setShapeStyle,
        id: "s2",
        fill: "#ff0000",
        stroke: "#000000",
        strokeWidth: 2,
      },
    ]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("deletes all selected shapes and clears selection", () => {
    const s1 = createMockShape("s1", 10, 10);
    const s2 = createMockShape("s2", 20, 20);
    const commit = vi.fn();
    const render = vi.fn();
    const clearSelection = vi.fn();

    const { handleBatchDelete } = useBatchMutations({
      selectedShapes: [s1, s2],
      clearSelection,
      commit,
      render,
    });

    handleBatchDelete();

    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith([
      { type: COMMANDS.deleteShape, id: "s1" },
      { type: COMMANDS.deleteShape, id: "s2" },
    ]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("clears selection on handleClearSelection call", () => {
    const commit = vi.fn();
    const render = vi.fn();
    const clearSelection = vi.fn();

    const { handleClearSelection } = useBatchMutations({
      selectedShapes: [],
      clearSelection,
      commit,
      render,
    });

    handleClearSelection();

    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("groups selected shapes into a unified Project Space container", () => {
    const s1 = createMockShape("s1", 100, 100, 300, 600, {
      order: {},
      platform: "androidNative",
      role: ROOT_ROLES.screen,
    });
    const s2 = createMockShape("s2", 500, 100, 300, 600);

    const doc = createDocument([s1, s2]);

    const commit = vi.fn();
    const render = vi.fn();
    const clearSelection = vi.fn();
    const selectShape = vi.fn();

    const { handleBatchGroupProjectSpace } = useBatchMutations({
      doc,
      selectedShapes: [s1, s2],
      clearSelection,
      selectShape,
      commit,
      render,
    });

    handleBatchGroupProjectSpace();

    expect(commit).toHaveBeenCalledTimes(1);
    const commands = commit.mock.calls[0]![0];
    // 1. Create shape for Project Space
    expect(commands[0].type).toBe(COMMANDS.createShape);
    expect(commands[0].shape.meta.role).toBe(ROOT_ROLES.project);
    expect(commands[0].shape.meta.platform).toBe("androidNative");
    expect(commands[0].shape.boundingBox).toEqual({
      x: 60,
      y: 60,
      width: 780,
      height: 680,
    });

    // 2. Clear root platform and role from s1 (so it inherits from Project Space)
    expect(commands[1]).toEqual({
      type: COMMANDS.setRootPlatform,
      id: "s1",
      platform: null,
    });
    expect(commands[2]).toEqual({
      type: COMMANDS.setRootRole,
      id: "s1",
      role: null,
    });

    // 3. Reparent both into the Project Space
    const projectId = commands[0].shape.id;
    expect(commands[3]).toEqual({
      type: COMMANDS.reparentShape,
      id: "s1",
      parentId: projectId,
      boundingBox: { x: 40, y: 40, width: 300, height: 600 },
    });
    expect(commands[4]).toEqual({
      type: COMMANDS.reparentShape,
      id: "s2",
      parentId: projectId,
      boundingBox: { x: 440, y: 40, width: 300, height: 600 },
    });

    expect(selectShape).toHaveBeenCalledWith(projectId);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
