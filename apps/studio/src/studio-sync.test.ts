import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CONTROLLER_EVENTS, createEditor, TOOLS, type Editor } from "@open-draw/canvas";
import { parseShapeId, ROOT_ID } from "@open-draw/canvas";
import { COMMANDS, createDocument, createRect } from "@open-draw/canvas";
import { PLUGIN_ROOT_PLATFORM, PLUGIN_SEMANTICS } from "@open-draw/semantics";
import { setupMockDomEnvironment, type MockDomNode, dispatchPointer } from "./test-dom-mock";
import { normalizeStudioDocument } from "./normalize-document";

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

  it("draws shape inside normalized root container and parents to root container (not ROOT_ID)", () => {
    const rootContainer = createRect(
      parseShapeId("root-board"),
      { x: 100, y: 100, width: 400, height: 300 },
      { parentId: ROOT_ID },
    );
    const initialDoc = normalizeStudioDocument(createDocument([rootContainer]));
    expect(initialDoc.shapes[rootContainer.id]?.meta.isContainer).toBe(true);

    editor = createEditor(container as unknown as HTMLElement, {
      document: initialDoc,
      nestingMode: "containers-only",
    });

    editor.setTool(TOOLS.drawRect);

    const mockSvg = editor.svg as unknown as MockDomNode;
    // Draw inside root container from (150, 150) to (250, 200)
    dispatchPointer(mockSvg, "pointerdown", { x: 150, y: 150 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 250, y: 200 });
    dispatchPointer(mockSvg, "pointerup", { x: 250, y: 200 });

    const doc = editor.getDocument();
    const shapes = Object.values(doc.shapes);
    const childShape = shapes.find((s) => s.id !== rootContainer.id);

    expect(childShape).toBeDefined();
    // Must be parented to root-board, NOT ROOT_ID!
    expect(childShape?.parentId).toBe(rootContainer.id);
    // Local coordinates should be relative to parent (150 - 100 = 50, 150 - 100 = 50)
    expect(childShape?.boundingBox.x).toBe(50);
    expect(childShape?.boundingBox.y).toBe(50);
    expect(childShape?.boundingBox.width).toBe(100);
    expect(childShape?.boundingBox.height).toBe(50);
  });

  it("reparents a dragged shape into an empty root container", () => {
    const rootContainer = createRect(
      parseShapeId("root-board-drop"),
      { x: 100, y: 100, width: 400, height: 300 },
      { parentId: ROOT_ID },
    );
    const outsideShape = createRect(
      parseShapeId("free-shape"),
      { x: 600, y: 100, width: 80, height: 40 },
      { parentId: ROOT_ID },
    );
    const initialDoc = normalizeStudioDocument(createDocument([rootContainer, outsideShape]));

    editor = createEditor(container as unknown as HTMLElement, {
      document: initialDoc,
      nestingMode: "containers-only",
    });

    editor.select(outsideShape.id);

    const mockSvg = editor.svg as unknown as MockDomNode;
    // Drag from (640, 120) to (200, 200) inside root container (dx = -440, dy = +80)
    dispatchPointer(mockSvg, "pointerdown", { x: 640, y: 120 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 200, y: 200 });
    dispatchPointer(mockSvg, "pointerup", { x: 200, y: 200 });

    const doc = editor.getDocument();
    const reparented = doc.shapes[outsideShape.id];
    expect(reparented?.parentId).toBe(rootContainer.id);
  });

  it("draws a new root board from scratch, normalizes it, and nests subsequent child shape inside it", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([]),
      nestingMode: "containers-only",
    });

    // Wire up the Studio document normalization hook
    const unsub = editor.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      const cur = editor!.getDocument();
      const normalized = normalizeStudioDocument(cur);
      if (normalized !== cur) {
        editor!.setDocument(normalized, { preserveHistory: true });
      }
    });

    const mockSvg = editor.svg as unknown as MockDomNode;

    // 1. Draw a new root board from (50, 50) to (500, 400)
    editor.setTool(TOOLS.drawRect);
    dispatchPointer(mockSvg, "pointerdown", { x: 50, y: 50 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 500, y: 400 });
    dispatchPointer(mockSvg, "pointerup", { x: 500, y: 400 });

    const docAfterBoard = editor.getDocument();
    const boardShape = Object.values(docAfterBoard.shapes)[0];
    expect(boardShape).toBeDefined();
    expect(boardShape?.parentId).toBe(ROOT_ID);
    expect(boardShape?.meta.isContainer).toBe(true);

    // 2. Draw a child shape inside this new board from (100, 100) to (200, 150)
    editor.setTool(TOOLS.drawRect);
    dispatchPointer(mockSvg, "pointerdown", { x: 100, y: 100 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 200, y: 150 });
    dispatchPointer(mockSvg, "pointerup", { x: 200, y: 150 });

    const docAfterChild = editor.getDocument();
    const shapes = Object.values(docAfterChild.shapes);
    expect(shapes).toHaveLength(2);

    const child = shapes.find((s) => s.id !== boardShape?.id);
    expect(child).toBeDefined();
    // Child shape must be parented to the new board!
    expect(child?.parentId).toBe(boardShape?.id);
    expect(child?.boundingBox.x).toBe(50); // 100 - 50 = 50
    expect(child?.boundingBox.y).toBe(50); // 100 - 50 = 50
    expect(child?.boundingBox.width).toBe(100);
    expect(child?.boundingBox.height).toBe(50);

    unsub();
  });

  it("nests shape drawn inside a nested Hero Section (N=2) into the Hero Section, not the Landing Page", () => {
    // Outer Landing Page (Level 1)
    const landingPage = createRect(
      parseShapeId("landing-page"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "web" },
        },
      },
    );

    // Nested Hero Section (Level 2)
    const heroSection = createRect(
      parseShapeId("hero-section"),
      { x: 50, y: 100, width: 900, height: 400 },
      {
        parentId: landingPage.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "web", id: "hero" } },
        },
      },
    );

    const initialDoc = normalizeStudioDocument(createDocument([landingPage, heroSection]));
    expect(initialDoc.shapes[heroSection.id]?.meta.isContainer).toBe(true);

    editor = createEditor(container as unknown as HTMLElement, {
      document: initialDoc,
      nestingMode: "containers-only",
    });

    const mockSvg = editor.svg as unknown as MockDomNode;

    // Draw text inside Hero Section at world (100, 150)
    editor.setTool(TOOLS.drawText);
    dispatchPointer(mockSvg, "pointerdown", { x: 100, y: 150 }, 0);
    dispatchPointer(mockSvg, "pointerup", { x: 100, y: 150 });

    const doc = editor.getDocument();
    const shapes = Object.values(doc.shapes);
    const textShape = shapes.find((s) => s.id !== landingPage.id && s.id !== heroSection.id);

    expect(textShape).toBeDefined();
    // CRITICAL: Must be parented to hero-section (Level 2), NOT landing-page (Level 1)!
    expect(textShape?.parentId).toBe(heroSection.id);
    // Relative coordinates inside hero-section: (100 - 50 = 50, 150 - 100 = 50)
    expect(textShape?.boundingBox.x).toBe(50);
    expect(textShape?.boundingBox.y).toBe(50);
  });

  it("supports N-level deep nesting (N=3: Button inside Card inside Hero Section inside Landing Page)", () => {
    const landingPage = createRect(
      parseShapeId("landing-page-n3"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "web" },
        },
      },
    );

    const heroSection = createRect(
      parseShapeId("hero-n3"),
      { x: 50, y: 100, width: 1000, height: 600 },
      {
        parentId: landingPage.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "web", id: "hero" } },
        },
      },
    );

    const cardShape = createRect(
      parseShapeId("card-n3"),
      { x: 40, y: 80, width: 400, height: 300 },
      {
        parentId: heroSection.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "web", id: "card" } },
        },
      },
    );

    const initialDoc = normalizeStudioDocument(
      createDocument([landingPage, heroSection, cardShape]),
    );
    expect(initialDoc.shapes[cardShape.id]?.meta.isContainer).toBe(true);

    editor = createEditor(container as unknown as HTMLElement, {
      document: initialDoc,
      nestingMode: "containers-only",
    });

    const mockSvg = editor.svg as unknown as MockDomNode;

    // Card world coordinates: Landing (0, 0) + Hero (50, 100) + Card (40, 80) = World (90, 180)
    // Draw button inside Card from world (120, 220) to (200, 260)
    editor.setTool(TOOLS.drawRect);
    dispatchPointer(mockSvg, "pointerdown", { x: 120, y: 220 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 200, y: 260 });
    dispatchPointer(mockSvg, "pointerup", { x: 200, y: 260 });

    const doc = editor.getDocument();
    const shapes = Object.values(doc.shapes);
    const newBtn = shapes.find(
      (s) => s.id !== landingPage.id && s.id !== heroSection.id && s.id !== cardShape.id,
    );

    expect(newBtn).toBeDefined();
    // Must be parented to card-n3 (Level 3)!
    expect(newBtn?.parentId).toBe(cardShape.id);
    // Relative to card: (120 - 90 = 30, 220 - 180 = 40)
    expect(newBtn?.boundingBox.x).toBe(30);
    expect(newBtn?.boundingBox.y).toBe(40);
  });

  it("reparents a dragged shape into a nested section (Level 2)", () => {
    const landingPage = createRect(
      parseShapeId("landing-reparent"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "web" },
        },
      },
    );

    const heroSection = createRect(
      parseShapeId("hero-drop-target"),
      { x: 50, y: 100, width: 800, height: 400 },
      {
        parentId: landingPage.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "web", id: "hero" } },
        },
      },
    );

    // Shape placed on Landing Page, outside Hero Section
    const looseShape = createRect(
      parseShapeId("loose-shape"),
      { x: 900, y: 100, width: 100, height: 50 },
      { parentId: landingPage.id },
    );

    const initialDoc = normalizeStudioDocument(
      createDocument([landingPage, heroSection, looseShape]),
    );

    editor = createEditor(container as unknown as HTMLElement, {
      document: initialDoc,
      nestingMode: "containers-only",
    });

    editor.select(looseShape.id);

    const mockSvg = editor.svg as unknown as MockDomNode;
    // Drag from looseShape center (950, 125) to inside heroSection center (450, 300)
    dispatchPointer(mockSvg, "pointerdown", { x: 950, y: 125 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 450, y: 300 });
    dispatchPointer(mockSvg, "pointerup", { x: 450, y: 300 });

    const doc = editor.getDocument();
    const reparented = doc.shapes[looseShape.id];
    // Must be reparented into hero-drop-target!
    expect(reparented?.parentId).toBe(heroSection.id);
  });

  it("ignores nested containers when platform profile is NONE / Agnostic", () => {
    // Root container without platform
    const rootContainer = createRect(
      parseShapeId("root-agnostic"),
      { x: 0, y: 0, width: 1000, height: 800 },
      { parentId: ROOT_ID },
    );

    // Nested rect inside rootContainer
    const nestedRect = createRect(
      parseShapeId("nested-agnostic-rect"),
      { x: 50, y: 50, width: 400, height: 300 },
      { parentId: rootContainer.id },
    );

    const initialDoc = normalizeStudioDocument(createDocument([rootContainer, nestedRect]));
    // In Platform Agnostic mode, nestedRect is NOT a container
    expect(initialDoc.shapes[nestedRect.id]?.meta.isContainer).toBeUndefined();

    editor = createEditor(container as unknown as HTMLElement, {
      document: initialDoc,
      nestingMode: "containers-only",
    });

    const mockSvg = editor.svg as unknown as MockDomNode;

    // Draw inside nestedRect from (100, 100) to (200, 150)
    editor.setTool(TOOLS.drawRect);
    dispatchPointer(mockSvg, "pointerdown", { x: 100, y: 100 }, 0);
    dispatchPointer(mockSvg, "pointermove", { x: 200, y: 150 });
    dispatchPointer(mockSvg, "pointerup", { x: 200, y: 150 });

    const doc = editor.getDocument();
    const shapes = Object.values(doc.shapes);
    const newShape = shapes.find((s) => s.id !== rootContainer.id && s.id !== nestedRect.id);

    expect(newShape).toBeDefined();
    // In Platform Agnostic mode, nesting into nestedRect is bypassed; parents to rootContainer
    expect(newShape?.parentId).toBe(rootContainer.id);
  });
});
