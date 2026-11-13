import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CONTROLLER_EVENTS, createEditor, TOOLS, type Editor } from "@open-draw/canvas";
import { parseShapeId, ROOT_ID } from "@open-draw/canvas";
import { COMMANDS, createDocument, createRect } from "@open-draw/canvas";
import { setupMockDomEnvironment, type MockDomNode } from "./test-dom-mock";

describe("StudioShell editor event synchronization", () => {
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

  it("synchronizes document state on documentChanged event", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([]),
    });

    let studioDoc = editor.getDocument();
    const unsubDoc = editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      studioDoc = editor!.getDocument();
    });

    const rect = createRect(
      parseShapeId("s-sync1"),
      { x: 50, y: 50, width: 100, height: 100 },
      { parentId: ROOT_ID },
    );
    editor.execute([
      {
        type: COMMANDS.createShape,
        shape: rect,
      },
    ]);

    const syncId = parseShapeId("s-sync1");
    expect(studioDoc.shapes[syncId]).toBeDefined();
    expect(studioDoc.shapes[syncId]?.boundingBox.width).toBe(100);

    unsubDoc();
  });

  it("synchronizes selection state on selectionChanged event", () => {
    const rect = createRect(
      parseShapeId("s-sync2"),
      { x: 10, y: 10, width: 80, height: 80 },
      { parentId: ROOT_ID },
    );
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    let selectedShapeIds: readonly string[] = [];
    let selectedShapeId: string | null = null;

    const unsubSel = editor.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
      selectedShapeIds = editor!.getSelection();
      selectedShapeId = editor!.canvas.getSelectedId();
    });

    editor.select(parseShapeId("s-sync2"));

    expect(selectedShapeIds).toEqual(["s-sync2"]);
    expect(selectedShapeId).toBe("s-sync2");

    editor.clearSelection();

    expect(selectedShapeIds).toEqual([]);
    expect(selectedShapeId).toBeNull();

    unsubSel();
  });

  it("synchronizes active tool on toolChanged event", () => {
    editor = createEditor(container as unknown as HTMLElement);

    let currentTool = editor.getTool();
    const unsubTool = editor.subscribe(CONTROLLER_EVENTS.toolChanged, () => {
      currentTool = editor!.getTool();
    });

    expect(currentTool).toBe(TOOLS.select);

    editor.setTool(TOOLS.drawRect);
    expect(currentTool).toBe(TOOLS.drawRect);

    editor.setTool(TOOLS.drawText);
    expect(currentTool).toBe(TOOLS.drawText);

    unsubTool();
  });

  it("synchronizes zoom level on cameraChanged event", () => {
    editor = createEditor(container as unknown as HTMLElement);

    let zoomPercent = Math.round(editor.getCamera().zoom * 100);
    const unsubCam = editor.subscribe(CONTROLLER_EVENTS.cameraChanged, () => {
      zoomPercent = Math.round(editor!.getCamera().zoom * 100);
    });

    expect(zoomPercent).toBe(100);

    editor.zoomIn();
    expect(zoomPercent).toBeGreaterThan(100);

    editor.resetZoom();
    expect(zoomPercent).toBe(100);

    unsubCam();
  });

  it("stops notifying subscribers after unsubscription and teardown", () => {
    editor = createEditor(container as unknown as HTMLElement);

    let callCount = 0;
    const unsubTool = editor.subscribe(CONTROLLER_EVENTS.toolChanged, () => {
      callCount += 1;
    });

    editor.setTool(TOOLS.drawRect);
    expect(callCount).toBe(1);

    unsubTool();

    editor.setTool(TOOLS.drawEllipse);
    expect(callCount).toBe(1);
  });

  it("preserves single source of truth across rapid draw -> undo -> redo -> select -> delete sequence", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([]),
    });

    let currentDoc = editor.getDocument();
    let changeEventsCount = 0;
    const unsub = editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      currentDoc = editor!.getDocument();
      changeEventsCount += 1;
    });

    const s1 = createRect(
      parseShapeId("s-step1"),
      { x: 10, y: 10, width: 100, height: 100 },
      { parentId: ROOT_ID },
    );
    const s2 = createRect(
      parseShapeId("s-step2"),
      { x: 120, y: 10, width: 80, height: 80 },
      { parentId: ROOT_ID },
    );

    // 1. Draw s1
    editor.execute([{ type: COMMANDS.createShape, shape: s1 }]);
    expect(currentDoc.shapes[s1.id]).toBeDefined();
    expect(changeEventsCount).toBe(1);

    // 2. Draw s2
    editor.execute([{ type: COMMANDS.createShape, shape: s2 }]);
    expect(currentDoc.shapes[s2.id]).toBeDefined();
    expect(changeEventsCount).toBe(2);

    // 3. Undo s2
    expect(editor.canUndo()).toBe(true);
    editor.undo();
    expect(currentDoc.shapes[s2.id]).toBeUndefined();
    expect(currentDoc.shapes[s1.id]).toBeDefined();
    expect(changeEventsCount).toBe(3);

    // 4. Redo s2
    expect(editor.canRedo()).toBe(true);
    editor.redo();
    expect(currentDoc.shapes[s2.id]).toBeDefined();
    expect(currentDoc.shapes[s1.id]).toBeDefined();
    expect(changeEventsCount).toBe(4);

    // 5. Select s1
    editor.select(s1.id);
    expect(editor.getSelection()).toEqual([s1.id]);

    // 6. Delete s1
    editor.execute([{ type: COMMANDS.deleteShape, id: s1.id }]);
    expect(currentDoc.shapes[s1.id]).toBeUndefined();
    expect(currentDoc.shapes[s2.id]).toBeDefined();
    expect(changeEventsCount).toBe(5);

    // 7. Verify document in subscriber is referentially identical to editor.getDocument()
    expect(currentDoc).toBe(editor.getDocument());

    unsub();
  });

  it("synchronizes document replacement via setDocument without secondary state setter", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([]),
    });

    let currentDoc = editor.getDocument();
    let changeEventsCount = 0;
    const unsub = editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      currentDoc = editor!.getDocument();
      changeEventsCount += 1;
    });

    const shape = createRect(
      parseShapeId("s-replace-1"),
      { x: 0, y: 0, width: 50, height: 50 },
      { parentId: ROOT_ID },
    );
    const replacement = createDocument([shape]);

    editor.setDocument(replacement);

    expect(changeEventsCount).toBe(1);
    expect(currentDoc).toBe(replacement);
    expect(currentDoc.shapes[shape.id]).toBeDefined();

    unsub();
  });
});
