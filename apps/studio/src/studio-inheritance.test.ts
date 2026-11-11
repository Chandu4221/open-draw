import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  CONTROLLER_EVENTS,
  createEditor,
  parseCustomShapeKind,
  parseShapeId,
  type CustomShapeExtension,
  type Editor,
} from "@open-draw/canvas";
import { ROOT_ID, type BoundingBox, type Point } from "@open-draw/contracts";
import {
  COMMANDS,
  createCustomShape,
  createDocument,
  createRect,
  type CustomShape,
  type Shape,
} from "@open-draw/document";
import { generateSaveDocumentJson } from "./document-io";
import { dispatchPointer, setupMockDomEnvironment, type MockDomNode } from "./test-dom-mock";

describe("Studio Inheritance Verification (Phase 6)", () => {
  let container: MockDomNode;
  let restoreDom: () => void;
  let editor: Editor | null = null;

  beforeEach(() => {
    const env = setupMockDomEnvironment();
    container = env.container;
    restoreDom = env.restore;
  });

  afterEach(() => {
    if (editor !== null) {
      editor.destroy();
      editor = null;
    }
    restoreDom();
  });

  it("multi-select drag moves multiple shapes together and undoes in a single step", () => {
    const shape1 = createRect(
      parseShapeId("rect-multi-1"),
      { x: 50, y: 50, width: 100, height: 100 },
      { parentId: ROOT_ID },
    );
    const shape2 = createRect(
      parseShapeId("rect-multi-2"),
      { x: 200, y: 50, width: 100, height: 100 },
      { parentId: ROOT_ID },
    );

    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([shape1, shape2]),
    });

    const svgNode = container.children[0] as MockDomNode;
    expect(svgNode).toBeDefined();

    // Select both shapes
    editor.selectMany([shape1.id, shape2.id]);
    expect(editor.getSelection()).toEqual([shape1.id, shape2.id]);

    // Pointer down on shape1 (screen: 70, 70)
    dispatchPointer(svgNode, "pointerdown", { x: 70, y: 70 });

    // Drag move past threshold (screen: 110, 90) -> dx = +40, dy = +20
    dispatchPointer(svgNode, "pointermove", { x: 110, y: 90 });

    // Pointer up to commit multi-drag gesture
    dispatchPointer(svgNode, "pointerup", { x: 110, y: 90 });

    const movedDoc = editor.getDocument();
    expect(movedDoc.shapes[shape1.id]?.boundingBox).toEqual({
      x: 90,
      y: 70,
      width: 100,
      height: 100,
    });
    expect(movedDoc.shapes[shape2.id]?.boundingBox).toEqual({
      x: 240,
      y: 70,
      width: 100,
      height: 100,
    });

    // Verify undo restores BOTH shapes in 1 single step
    expect(editor.canUndo()).toBe(true);
    const undoSuccess = editor.undo();
    expect(undoSuccess).toBe(true);

    const undoneDoc = editor.getDocument();
    expect(undoneDoc.shapes[shape1.id]?.boundingBox).toEqual({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    });
    expect(undoneDoc.shapes[shape2.id]?.boundingBox).toEqual({
      x: 200,
      y: 50,
      width: 100,
      height: 100,
    });

    // Redo moves both shapes back in 1 single step
    expect(editor.canRedo()).toBe(true);
    const redoSuccess = editor.redo();
    expect(redoSuccess).toBe(true);

    const redoneDoc = editor.getDocument();
    expect(redoneDoc.shapes[shape1.id]?.boundingBox).toEqual({
      x: 90,
      y: 70,
      width: 100,
      height: 100,
    });
    expect(redoneDoc.shapes[shape2.id]?.boundingBox).toEqual({
      x: 240,
      y: 70,
      width: 100,
      height: 100,
    });
  });

  it("loads document with custom shape, renders markup, edits properties, and saves round-trip", () => {
    const badgeKind = parseCustomShapeKind("vendor:badge");
    const badgeExtension: CustomShapeExtension = {
      kind: badgeKind,
      label: "Vendor Badge",
      version: 1,
      capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
      hitTest: (box: BoundingBox, _shape: Shape, point: Point): boolean =>
        point.x >= box.x &&
        point.x <= box.x + box.width &&
        point.y >= box.y &&
        point.y <= box.y + box.height,
      render: (shape: Shape, box: BoundingBox): string => {
        const custom = shape as CustomShape;
        const badgeLevel = custom.customData?.badgeLevel ?? 1;
        const badgeLabel = custom.customData?.badgeLabel ?? "";
        return `<g class="custom-badge" data-badge-level="${badgeLevel}"><rect width="${box.width}" height="${box.height}" fill="#4f46e5" /><text>${badgeLabel}</text></g>`;
      },
      validate: (shape: Shape): void => {
        const custom = shape as CustomShape;
        if (
          typeof custom.customData?.badgeLabel !== "string" ||
          typeof custom.customData?.badgeLevel !== "number"
        ) {
          throw new Error("Invalid badge data");
        }
      },
      serialize: (shape: Shape): Record<string, unknown> => {
        const custom = shape as CustomShape;
        return {
          badgeLabel: custom.customData?.badgeLabel,
          badgeLevel: custom.customData?.badgeLevel,
        };
      },
      deserialize: (customData: Record<string, unknown>, shape: Shape): Shape =>
        createCustomShape(
          shape.id,
          badgeKind,
          shape.boundingBox,
          {
            badgeLabel: (customData.badgeLabel as string) ?? "Default Badge",
            badgeLevel: typeof customData.badgeLevel === "number" ? customData.badgeLevel : 1,
          },
          { parentId: shape.parentId, meta: shape.meta },
        ),
    };

    editor = createEditor(container as unknown as HTMLElement, {
      customShapes: [badgeExtension],
    });

    const badgeId = parseShapeId("badge-init-1");
    const docJson = JSON.stringify({
      schema: { version: 1 },
      shapes: {
        [badgeId]: {
          id: badgeId,
          kind: "vendor:badge",
          parentId: ROOT_ID,
          boundingBox: { x: 100, y: 120, width: 140, height: 48 },
          badgeLabel: "Enterprise Plan",
          badgeLevel: 3,
          meta: { order: {} },
        },
      },
    });

    // 1. Load document with custom shape
    editor.loadJson(docJson);
    const loadedDoc = editor.getDocument();
    const loadedBadge = loadedDoc.shapes[badgeId] as CustomShape;
    expect(loadedBadge).toBeDefined();
    expect(loadedBadge.kind).toBe("vendor:badge");
    expect(loadedBadge.customData?.badgeLabel).toBe("Enterprise Plan");
    expect(loadedBadge.customData?.badgeLevel).toBe(3);

    // 2. Render and verify custom SVG output
    editor.render();
    const svgNode = container.children[0] as MockDomNode;
    const docScene = svgNode.querySelector(".od-document-scene");
    expect(docScene?.innerHTML).toContain('class="custom-badge"');
    expect(docScene?.innerHTML).toContain('data-badge-level="3"');
    expect(docScene?.innerHTML).toContain("Enterprise Plan");

    // 3. Edit custom shape via editor transaction
    editor.execute([
      {
        type: COMMANDS.moveShapes,
        ids: [badgeId],
        dx: 50,
        dy: 30,
      },
    ]);

    const editedDoc = editor.getDocument();
    expect(editedDoc.shapes[badgeId]?.boundingBox).toEqual({
      x: 150,
      y: 150,
      width: 140,
      height: 48,
    });

    // 4. Save document JSON via document-io
    const savedJson = generateSaveDocumentJson(editor.getDocument());
    const savedData = JSON.parse(savedJson);
    expect(savedData.shapes[badgeId]).toBeDefined();
    expect(savedData.shapes[badgeId].boundingBox).toEqual({
      x: 150,
      y: 150,
      width: 140,
      height: 48,
    });
    expect(savedData.shapes[badgeId].badgeLabel).toBe("Enterprise Plan");
    expect(savedData.shapes[badgeId].badgeLevel).toBe(3);

    // 5. Round-trip: load into a second editor instance with extension
    const env2 = setupMockDomEnvironment();
    const editor2 = createEditor(env2.container as unknown as HTMLElement, {
      customShapes: [badgeExtension],
    });
    editor2.loadJson(savedJson);

    const reloadedDoc = editor2.getDocument();
    const reloadedBadge = reloadedDoc.shapes[badgeId] as CustomShape;
    expect(reloadedBadge.boundingBox).toEqual({
      x: 150,
      y: 150,
      width: 140,
      height: 48,
    });
    expect(reloadedBadge.customData?.badgeLabel).toBe("Enterprise Plan");
    expect(reloadedBadge.customData?.badgeLevel).toBe(3);
    editor2.destroy();
    env2.restore();
  });

  it("maintains document in editor as the single source of truth across subscriptions", () => {
    editor = createEditor(container as unknown as HTMLElement);

    let observedDoc = editor.getDocument();
    let notificationCount = 0;
    const unsub = editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      observedDoc = editor!.getDocument();
      notificationCount += 1;
    });

    const s1 = createRect(
      parseShapeId("rect-root-1"),
      { x: 10, y: 10, width: 80, height: 60 },
      { parentId: ROOT_ID },
    );

    // Execute mutation
    editor.execute([{ type: COMMANDS.createShape, shape: s1 }]);
    expect(notificationCount).toBe(1);
    expect(observedDoc).toBe(editor.getDocument());
    expect(observedDoc.shapes[s1.id]).toBeDefined();

    // Undo mutation
    editor.undo();
    expect(notificationCount).toBe(2);
    expect(observedDoc).toBe(editor.getDocument());
    expect(observedDoc.shapes[s1.id]).toBeUndefined();

    // Redo mutation
    editor.redo();
    expect(notificationCount).toBe(3);
    expect(observedDoc).toBe(editor.getDocument());
    expect(observedDoc.shapes[s1.id]).toBeDefined();

    unsub();
  });
});
