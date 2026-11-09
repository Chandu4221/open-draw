// Standalone editor behavior tests (R-015: describe = subject, it = behavior).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { COMMANDS, createDocument, createRect } from "@open-draw/document";
import { createEditor, type Editor } from "./editor";
import { TOOLS } from "./tools";

class MockDomNode {
  readonly tagName: string;
  readonly style: Record<string, string> = {};
  readonly attributes: Record<string, string> = {};
  readonly children: MockDomNode[] = [];
  innerHTML = "";
  value = "";
  className = "";
  listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  focus(): void {}
  select(): void {}

  get outerHTML(): string {
    return `<${this.tagName}>${this.innerHTML}</${this.tagName}>`;
  }

  setAttribute(name: string, val: string): void {
    this.attributes[name] = val;
  }

  getAttribute(name: string): string | undefined {
    return this.attributes[name];
  }

  appendChild(child: MockDomNode): void {
    this.children.push(child);
  }

  removeChild(child: MockDomNode): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
  }

  contains(child: MockDomNode): boolean {
    return this.children.includes(child);
  }

  querySelector<T extends MockDomNode>(selector: string): T | null {
    const className = selector.replace(/^\./, "");
    for (const child of this.children) {
      if (child.attributes["class"] === className || child.className === className) {
        return child as unknown as T;
      }
      const found = child.querySelector<T>(selector);
      if (found !== null) return found;
    }
    return null;
  }

  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    return { left: 0, top: 0, width: 800, height: 600 };
  }

  addEventListener(event: string, fn: (...args: unknown[]) => void): void {
    this.listeners[event] = this.listeners[event] ?? [];
    this.listeners[event]!.push(fn);
  }

  removeEventListener(event: string, fn: (...args: unknown[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]!.filter((f) => f !== fn);
    }
  }

  setPointerCapture(): void {}
}

describe("createEditor", () => {
  let container: MockDomNode;
  let editor: Editor | null = null;
  let originalDocument: unknown;
  let originalWindow: unknown;

  beforeEach(() => {
    originalDocument = (globalThis as unknown as { document?: unknown }).document;
    originalWindow = (globalThis as unknown as { window?: unknown }).window;

    const mockDoc = {
      createElementNS: (_ns: string, tag: string) => new MockDomNode(tag),
      createElement: (tag: string) => new MockDomNode(tag),
      body: new MockDomNode("body"),
    };
    const windowListeners: Record<string, ((event: unknown) => void)[]> = {};
    const mockWin = {
      addEventListener: (evt: string, fn: (event: unknown) => void) => {
        windowListeners[evt] = windowListeners[evt] ?? [];
        windowListeners[evt]!.push(fn);
      },
      removeEventListener: (evt: string, fn: (event: unknown) => void) => {
        if (windowListeners[evt]) {
          windowListeners[evt] = windowListeners[evt]!.filter((f) => f !== fn);
        }
      },
      dispatch: (evt: string, arg: unknown) => {
        for (const fn of windowListeners[evt] ?? []) {
          fn(arg);
        }
      },
    };

    (globalThis as unknown as { document: unknown }).document = mockDoc;
    (globalThis as unknown as { window: unknown }).window = mockWin;

    container = new MockDomNode("div");
  });

  afterEach(() => {
    if (editor !== null) {
      editor.destroy();
      editor = null;
    }
    (globalThis as unknown as { document?: unknown }).document = originalDocument;
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  });

  it("mounts into container and creates an SVG element", () => {
    editor = createEditor(container as unknown as HTMLElement);
    expect(editor.container).toBe(container as unknown as HTMLElement);
    expect(editor.svg.tagName.toLowerCase()).toBe("svg");
    expect(container.contains(editor.svg as unknown as MockDomNode)).toBe(true);
    expect(editor.getDocument().schema.version).toBe(1);
    expect(editor.getTool()).toBe(TOOLS.select);
  });

  it("executes commands, records history, and updates document", () => {
    editor = createEditor(container as unknown as HTMLElement);
    const rect = createRect(parseShapeId("rect-1"), { x: 10, y: 10, width: 100, height: 100 });
    editor.execute({ type: COMMANDS.createShape, shape: rect });

    expect(editor.getDocument().shapes[parseShapeId("rect-1")]).toBeDefined();

    // Undo removes the shape
    const undid = editor.undo();
    expect(undid).toBe(true);
    expect(editor.getDocument().shapes[parseShapeId("rect-1")]).toBeUndefined();

    // Redo restores the shape
    const redid = editor.redo();
    expect(redid).toBe(true);
    expect(editor.getDocument().shapes[parseShapeId("rect-1")]).toBeDefined();
  });

  it("supports tool switching", () => {
    editor = createEditor(container as unknown as HTMLElement);
    expect(editor.getTool()).toBe(TOOLS.select);

    editor.setTool(TOOLS.drawRect);
    expect(editor.getTool()).toBe(TOOLS.drawRect);

    editor.setTool(TOOLS.drawEllipse);
    expect(editor.getTool()).toBe(TOOLS.drawEllipse);
  });

  it("supports selection management", () => {
    const rect = createRect(parseShapeId("rect-1"), { x: 0, y: 0, width: 50, height: 50 });
    const doc = createDocument([rect]);
    editor = createEditor(container as unknown as HTMLElement, { document: doc });

    expect(editor.getSelection()).toHaveLength(0);

    editor.select(rect.id);
    expect(editor.getSelection()).toContain(rect.id);

    editor.clearSelection();
    expect(editor.getSelection()).toHaveLength(0);
  });

  it("controls camera navigation and zoom", () => {
    editor = createEditor(container as unknown as HTMLElement);
    expect(editor.getCamera().zoom).toBe(1);

    editor.setCamera({ x: 100, y: 50, zoom: 2 });
    expect(editor.getCamera()).toEqual({ x: 100, y: 50, zoom: 2 });

    editor.resetZoom();
    expect(editor.getCamera().zoom).toBe(1);
    expect(editor.getCamera().x).toBe(0);
  });

  it("serializes to JSON and SVG output", () => {
    const rect = createRect(parseShapeId("r-1"), { x: 10, y: 10, width: 80, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    const json = editor.toJson();
    expect(json).toContain("r-1");

    const svg = editor.toSvg();
    expect(svg).toContain("<svg");
  });

  it("loads document from JSON string and clears selection", () => {
    editor = createEditor(container as unknown as HTMLElement);
    const rect = createRect(parseShapeId("r-new"), { x: 20, y: 20, width: 60, height: 60 });
    const json = JSON.stringify({
      schema: { version: 1 },
      shapes: { [rect.id]: rect },
    });

    editor.loadJson(json);
    expect(editor.getDocument().shapes[parseShapeId("r-new")]).toBeDefined();
    expect(editor.getSelection()).toHaveLength(0);
  });

  it("destroys cleanly and removes svg from container", () => {
    editor = createEditor(container as unknown as HTMLElement);
    expect(container.contains(editor.svg as unknown as MockDomNode)).toBe(true);

    editor.destroy();
    expect(container.contains(editor.svg as unknown as MockDomNode)).toBe(false);
    editor = null;
  });

  it("round-trips toJson() into loadJson() without double-encoding error (C1)", () => {
    const rect = createRect(parseShapeId("rect-roundtrip"), {
      x: 15,
      y: 25,
      width: 100,
      height: 80,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    const json = editor.toJson();
    // Must be valid JSON object string, not a JSON-stringified string
    expect(json.startsWith("{")).toBe(true);
    expect(() => editor!.loadJson(json)).not.toThrow();
    expect(editor.getDocument().shapes[rect.id]).toBeDefined();
  });

  it("tracks canUndo and canRedo state accurately (H4)", () => {
    editor = createEditor(container as unknown as HTMLElement);
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(false);

    const rect = createRect(parseShapeId("rect-history"), {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
    editor.execute({ type: COMMANDS.createShape, shape: rect });
    expect(editor.canUndo()).toBe(true);
    expect(editor.canRedo()).toBe(false);

    editor.undo();
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(true);

    editor.redo();
    expect(editor.canUndo()).toBe(true);
    expect(editor.canRedo()).toBe(false);
  });

  it("emits toolChanged event on setTool (H4)", () => {
    editor = createEditor(container as unknown as HTMLElement);
    let fired = false;
    editor.subscribe("toolChanged", () => {
      fired = true;
    });

    editor.setTool(TOOLS.drawRect);
    expect(fired).toBe(true);
  });

  it("exports standalone SVG without editor overlays or viewports (M2)", () => {
    const rect = createRect(parseShapeId("r-export"), {
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    const svg = editor.toSvg();
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="80 80 240 190"');
    expect(svg).not.toContain("od-scene-viewport");
    expect(svg).not.toContain("od-overlay-scene");
  });

  it("sets accessible role, tabindex, and label on SVG element (M8)", () => {
    editor = createEditor(container as unknown as HTMLElement);
    const mockSvg = editor.svg as unknown as MockDomNode;
    expect(mockSvg.getAttribute("tabindex")).toBe("0");
    expect(mockSvg.getAttribute("role")).toBe("region");
    expect(mockSvg.getAttribute("aria-label")).toBe("Drawing canvas");
  });

  it("reconciles selection when selected shapes are deleted (C2)", () => {
    const rect = createRect(parseShapeId("rect-del"), { x: 0, y: 0, width: 40, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);
    expect(editor.getSelection()).toEqual([rect.id]);

    editor.execute({ type: COMMANDS.deleteShape, id: rect.id });
    expect(editor.getSelection()).toHaveLength(0);
  });

  it("uses customRenderers option in document rendering and SVG export (H7)", () => {
    const rect = createRect(parseShapeId("rect-custom"), { x: 10, y: 10, width: 60, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
      customRenderers: {
        rect: (_shape, box) => `<path d="M ${box.x} ${box.y} Z" class="custom-rendered-rect" />`,
      },
    });

    const exportedSvg = editor.toSvg();
    expect(exportedSvg).toContain('class="custom-rendered-rect"');
  });

  it("deletes nested parent and child via keyboard without throwing shapeNotFound (C2)", () => {
    const parent = createRect(parseShapeId("parent-1"), { x: 0, y: 0, width: 200, height: 200 });
    const child = createRect(
      parseShapeId("child-1"),
      { x: 10, y: 10, width: 50, height: 50 },
      { parent: parent.id },
    );
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([parent, child]),
    });

    editor.selectMany([parent.id, child.id]);
    expect(editor.getSelection()).toEqual([parent.id, child.id]);

    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;
    let prevented = false;
    mockWin.dispatch("keydown", {
      code: "Backspace",
      key: "Backspace",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {
        prevented = true;
      },
    });

    expect(prevented).toBe(true);
    expect(editor.getDocument().shapes[parent.id]).toBeUndefined();
    expect(editor.getDocument().shapes[child.id]).toBeUndefined();
    expect(editor.getSelection()).toHaveLength(0);
  });

  it("preserves native copy event when selection is empty (M1)", () => {
    editor = createEditor(container as unknown as HTMLElement);
    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;
    let prevented = false;
    mockWin.dispatch("keydown", {
      code: "KeyC",
      key: "c",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {
        prevented = true;
      },
    });

    expect(prevented).toBe(false);
  });

  it("preserves selection during middle-click pan gesture (H3)", () => {
    const rect = createRect(parseShapeId("rect-pan"), { x: 50, y: 50, width: 100, height: 100 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);
    expect(editor.getSelection()).toEqual([rect.id]);

    const mockSvg = editor.svg as unknown as MockDomNode;
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    expect(downFn).toBeDefined();

    // Middle button click (button === 1) starts pan, should NOT clear selection
    downFn!({
      button: 1,
      clientX: 200,
      clientY: 200,
      pointerId: 1,
      preventDefault: () => {},
    });

    expect(editor.getSelection()).toEqual([rect.id]);
  });

  it("preserves undo/redo history on setDocument and loadJson when preserveHistory is enabled (P1-3)", () => {
    editor = createEditor(container as unknown as HTMLElement);
    const rect1 = createRect(parseShapeId("rect-hist-1"), { x: 0, y: 0, width: 50, height: 50 });
    editor.execute({ type: COMMANDS.createShape, shape: rect1 });
    expect(editor.canUndo()).toBe(true);

    const rect2 = createRect(parseShapeId("rect-hist-2"), { x: 60, y: 0, width: 50, height: 50 });
    const nextDoc = createDocument([rect1, rect2]);

    editor.setDocument(nextDoc, { preserveHistory: true });
    expect(editor.canUndo()).toBe(true);

    const json = JSON.stringify({
      schema: { version: 1 },
      shapes: { [rect1.id]: rect1, [rect2.id]: rect2 },
    });
    editor.loadJson(json, { preserveHistory: true });
    expect(editor.canUndo()).toBe(true);
  });

  it("isolates shape ID sequences across independent editor instances (P0-4)", () => {
    const containerA = new MockDomNode("div");
    const containerB = new MockDomNode("div");
    const shapeA = createRect(parseShapeId("seed-a"), { x: 0, y: 0, width: 20, height: 20 });
    const shapeB = createRect(parseShapeId("seed-b"), { x: 0, y: 0, width: 20, height: 20 });
    const edA = createEditor(containerA as unknown as HTMLElement, {
      document: createDocument([shapeA]),
    });
    const edB = createEditor(containerB as unknown as HTMLElement, {
      document: createDocument([shapeB]),
    });

    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;

    // Duplicate in editor A
    edA.select(shapeA.id);
    mockWin.dispatch("keydown", {
      code: "KeyD",
      key: "d",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {},
    });

    // Check duplicate shape ID in editor A
    const idsA = Object.keys(edA.getDocument().shapes).filter((id) => id !== "seed-a");
    expect(idsA).toHaveLength(1);

    // Actions in editor A must not advance or affect editor B's independent ID generator
    edB.select(shapeB.id);
    mockWin.dispatch("keydown", {
      code: "KeyD",
      key: "d",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {},
    });

    const idsB = Object.keys(edB.getDocument().shapes).filter((id) => id !== "seed-b");
    expect(idsB).toHaveLength(1);
    // Editor B starts from its own independent sequence (same base ID as edA started with)
    expect(idsB[0]).toBe(idsA[0]);

    edA.destroy();
    edB.destroy();
  });

  it("handles copy and paste shortcuts for selected shapes (P0-1)", () => {
    const rect = createRect(parseShapeId("rect-cp"), { x: 10, y: 10, width: 60, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;

    let copyPrevented = false;
    mockWin.dispatch("keydown", {
      code: "KeyC",
      key: "c",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {
        copyPrevented = true;
      },
    });
    expect(copyPrevented).toBe(true);

    let pastePrevented = false;
    mockWin.dispatch("keydown", {
      code: "KeyV",
      key: "v",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {
        pastePrevented = true;
      },
    });
    expect(pastePrevented).toBe(true);

    const allShapes = Object.values(editor.getDocument().shapes);
    expect(allShapes).toHaveLength(2);
    const pasted = allShapes.find((s) => s.id !== rect.id)!;
    expect(pasted).toBeDefined();
    expect(pasted.boundingBox.x).toBe(30);
    expect(pasted.boundingBox.y).toBe(30);
    expect(editor.getSelection()).toEqual([pasted.id]);
  });

  it("serializes payload to system clipboard on copy (P1-2)", async () => {
    let writtenText = "";
    const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          writeText: async (text: string) => {
            writtenText = text;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      const rect = createRect(parseShapeId("rect-sys-cp"), { x: 10, y: 10, width: 60, height: 40 });
      editor = createEditor(container as unknown as HTMLElement, {
        document: createDocument([rect]),
      });
      editor.select(rect.id);

      const mockWin = (
        globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
      ).window;

      mockWin.dispatch("keydown", {
        code: "KeyC",
        key: "c",
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: () => {},
      });

      expect(writtenText).toContain("open-draw/clipboard");
      expect(writtenText).toContain("rect-sys-cp");
    } finally {
      if (origDescriptor) {
        Object.defineProperty(globalThis, "navigator", origDescriptor);
      } else {
        delete (globalThis as unknown as { navigator?: unknown }).navigator;
      }
    }
  });

  it("updates text content and supports text editing API (P0-2)", () => {
    const rect = createRect(parseShapeId("rect-txt"), { x: 0, y: 0, width: 100, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    (editor as unknown as { setTextContent: (id: string, text: string) => void }).setTextContent(
      rect.id,
      "New Heading",
    );
    expect(editor.getDocument().shapes[rect.id]?.content).toBe("New Heading");
    expect(editor.canUndo()).toBe(true);

    editor.undo();
    expect(editor.getDocument().shapes[rect.id]?.content).toBeUndefined();
  });

  it("provides style and responsive layer ordering APIs (P1-1)", () => {
    const rect = createRect(parseShapeId("rect-style"), { x: 0, y: 0, width: 100, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    (
      editor as unknown as {
        setShapeStyle: (
          id: string,
          style: { fill?: string; stroke?: string; strokeWidth?: number },
        ) => void;
      }
    ).setShapeStyle(rect.id, { fill: "#ff0000", stroke: "#000000", strokeWidth: 2 });
    const styled = editor.getDocument().shapes[rect.id]!;
    expect(styled.fill).toBe("#ff0000");
    expect(styled.stroke).toBe("#000000");
    expect(styled.strokeWidth).toBe(2);

    (
      editor as unknown as {
        setShapeOrder: (id: string, deviceType: string, order: number | null) => void;
      }
    ).setShapeOrder(rect.id, "mobile", 3);
    const ordered = editor.getDocument().shapes[rect.id]!;
    expect(ordered.meta.order["mobile"]).toBe(3);
  });

  it("emits machineChanged when interaction state changes (P1-2)", () => {
    editor = createEditor(container as unknown as HTMLElement);
    let count = 0;
    editor.subscribe("machineChanged" as unknown as "toolChanged", () => {
      count += 1;
    });

    editor.canvas.dispatch({
      type: "pointerDown",
      screenPoint: { x: 10, y: 10 },
      worldPoint: { x: 10, y: 10 },
      hit: null,
      handle: null,
      selectedShapeId: null,
      tool: TOOLS.select,
      panRequested: true,
    });
    expect(count).toBe(1);
  });

  it("resizes multiple selected shapes proportionately from collective bounds (P0-3)", () => {
    const rect1 = createRect(parseShapeId("multi-1"), { x: 0, y: 0, width: 100, height: 100 });
    const rect2 = createRect(parseShapeId("multi-2"), { x: 100, y: 0, width: 100, height: 100 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect1, rect2]),
    });

    editor.selectMany([rect1.id, rect2.id]);
    expect(editor.getSelection()).toHaveLength(2);

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    const upFn = mockSvg.listeners["pointerup"]?.[0];
    expect(downFn).toBeDefined();
    expect(moveFn).toBeDefined();
    expect(upFn).toBeDefined();

    // Collective bounding box is (0, 0, 200, 100). Southeast handle is at (200, 100).
    downFn!({ button: 0, clientX: 200, clientY: 100, pointerId: 1, preventDefault: () => {} });
    // Drag SE handle to (400, 200) -> scale 2x
    moveFn!({ clientX: 400, clientY: 200, pointerId: 1, preventDefault: () => {} });
    upFn!({ clientX: 400, clientY: 200, pointerId: 1, preventDefault: () => {} });

    const doc = editor.getDocument();
    const updated1 = doc.shapes[rect1.id]!;
    const updated2 = doc.shapes[rect2.id]!;

    expect(updated1.boundingBox.width).toBe(200);
    expect(updated1.boundingBox.height).toBe(200);
    expect(updated2.boundingBox.x).toBe(200);
    expect(updated2.boundingBox.width).toBe(200);
    expect(updated2.boundingBox.height).toBe(200);
  });

  it("suppresses drag gesture when pointer movement is below 3px threshold (P1-4)", () => {
    const rect = createRect(parseShapeId("rect-thresh"), { x: 20, y: 20, width: 50, height: 50 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    const upFn = mockSvg.listeners["pointerup"]?.[0];
    expect(downFn).toBeDefined();
    expect(moveFn).toBeDefined();
    expect(upFn).toBeDefined();

    // Point on shape at (30, 30)
    downFn!({ button: 0, clientX: 30, clientY: 30, pointerId: 1, preventDefault: () => {} });
    // Move by only 1px (below DRAG_THRESHOLD_PX = 3)
    moveFn!({ clientX: 31, clientY: 31, pointerId: 1, preventDefault: () => {} });
    upFn!({ clientX: 31, clientY: 31, pointerId: 1, preventDefault: () => {} });

    // Shape was not moved
    const shape = editor.getDocument().shapes[rect.id]!;
    expect(shape.boundingBox.x).toBe(20);
    expect(shape.boundingBox.y).toBe(20);
    expect(editor.canUndo()).toBe(false);
  });

  it("adds to existing selection on Shift+marquee gesture (P1-4)", () => {
    const rect1 = createRect(parseShapeId("rect-m-1"), { x: 10, y: 10, width: 40, height: 40 });
    const rect2 = createRect(parseShapeId("rect-m-2"), { x: 100, y: 100, width: 40, height: 40 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect1, rect2]),
    });
    editor.select(rect1.id);
    expect(editor.getSelection()).toEqual([rect1.id]);

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    const upFn = mockSvg.listeners["pointerup"]?.[0];
    expect(downFn).toBeDefined();
    expect(moveFn).toBeDefined();
    expect(upFn).toBeDefined();

    downFn!({
      button: 0,
      clientX: 80,
      clientY: 80,
      shiftKey: true,
      pointerId: 1,
      preventDefault: () => {},
    });
    moveFn!({ clientX: 160, clientY: 160, shiftKey: true, pointerId: 1, preventDefault: () => {} });
    upFn!({ clientX: 160, clientY: 160, shiftKey: true, pointerId: 1, preventDefault: () => {} });

    const selected = editor.getSelection();
    expect(selected).toContain(rect1.id);
    expect(selected).toContain(rect2.id);
    expect(selected).toHaveLength(2);
  });

  it("drills down selection on double-click without mounting inline textarea overlay", () => {
    const parentRect = createRect(parseShapeId("rect-parent"), {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    });
    const childRect = createRect(
      parseShapeId("rect-child"),
      { x: 20, y: 20, width: 80, height: 80 },
      { parentId: parentRect.id },
    );
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([parentRect, childRect]),
    });

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const pointerDownFn = mockSvg.listeners["pointerdown"]?.[0];
    const dblFn = mockSvg.listeners["dblclick"]?.[0];
    expect(pointerDownFn).toBeDefined();
    expect(dblFn).toBeDefined();

    // 1. Single click on child selects parent container
    pointerDownFn!({
      button: 0,
      clientX: 30,
      clientY: 30,
      detail: 1,
      preventDefault: () => {},
    });
    expect(editor.getSelection()).toEqual([parentRect.id]);

    // 2. Double-click drills down into child shape and does NOT mount textarea overlay
    pointerDownFn!({
      button: 0,
      clientX: 30,
      clientY: 30,
      detail: 2,
      preventDefault: () => {},
    });
    dblFn!({ button: 0, clientX: 30, clientY: 30, preventDefault: () => {} });

    expect(editor.getSelection()).toEqual([childRect.id]);
    expect(container.querySelector(".od-inline-text-editor")).toBeNull();

    // 3. Text content is set programmatically or via inspector via setTextContent
    editor.setTextContent(childRect.id, "Updated Text");
    expect(editor.getDocument().shapes[childRect.id]?.content).toBe("Updated Text");
    expect(editor.canUndo()).toBe(true);
  });

  it("allows interceptPointerDown to consume pointer events before default selection", () => {
    let intercepted = false;
    const rect = createRect(parseShapeId("rect-intercept"), {
      x: 50,
      y: 50,
      width: 120,
      height: 60,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
      interceptPointerDown: () => {
        intercepted = true;
        return true;
      },
    });

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    expect(downFn).toBeDefined();

    downFn!({ button: 0, clientX: 70, clientY: 70, pointerId: 1, preventDefault: () => {} });

    expect(intercepted).toBe(true);
    expect(editor.getSelection()).toHaveLength(0);
  });

  it("parents newly drawn shapes to enclosing container and supports N levels of nested parenting", () => {
    // Level 1: root container (0, 0, 800, 600)
    const rootContainer = createRect(parseShapeId("c-root"), {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });
    // Level 2: nested container (100, 100, 400, 400) inside rootContainer => world (100, 100, 400, 400)
    const nestedContainer = createRect(
      parseShapeId("c-nested"),
      { x: 100, y: 100, width: 400, height: 400 },
      { parent: rootContainer.id },
    );
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rootContainer, nestedContainer]),
    });

    // 1. Draw a text shape inside nestedContainer at world (150, 150)
    editor.setTool(TOOLS.drawText);
    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const upFn = mockSvg.listeners["pointerup"]?.[0];
    expect(downFn).toBeDefined();
    expect(upFn).toBeDefined();

    downFn!({ button: 0, clientX: 150, clientY: 150, pointerId: 1, preventDefault: () => {} });
    upFn!({ button: 0, clientX: 150, clientY: 150, pointerId: 1, preventDefault: () => {} });

    // The newly drawn text shape should be a child of nestedContainer (Level 2), NOT rootContainer or ROOT_ID!
    const docAfterText = editor.getDocument();
    const textShape = Object.values(docAfterText.shapes).find((s) => s.kind === "text");
    expect(textShape).toBeDefined();
    expect(textShape!.parentId).toBe(nestedContainer.id);
    // Local coordinates should be relative to nestedContainer: world (150, 150) - nestedContainer world (100, 100) = (50, 50)
    expect(textShape!.boundingBox.x).toBe(50);
    expect(textShape!.boundingBox.y).toBe(50);

    // 2. Draw another rectangle inside rootContainer but outside nestedContainer at world (600, 200)
    editor.setTool(TOOLS.drawRect);
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    downFn!({ button: 0, clientX: 600, clientY: 200, pointerId: 2, preventDefault: () => {} });
    moveFn!({ button: 0, clientX: 700, clientY: 300, pointerId: 2, preventDefault: () => {} });
    upFn!({ button: 0, clientX: 700, clientY: 300, pointerId: 2, preventDefault: () => {} });

    const docAfterRect = editor.getDocument();
    const newRect = Object.values(docAfterRect.shapes).find(
      (s) => s.id !== rootContainer.id && s.id !== nestedContainer.id && s.kind === "rect",
    );
    expect(newRect).toBeDefined();
    expect(newRect!.parentId).toBe(rootContainer.id);
    expect(newRect!.boundingBox.x).toBe(600);
    expect(newRect!.boundingBox.y).toBe(200);
    expect(newRect!.boundingBox.width).toBe(100);
    expect(newRect!.boundingBox.height).toBe(100);
  });

  it("reparents dragged shape into nested container at level N when dragged over it", () => {
    // Level 1: root container (0, 0, 800, 600)
    const rootContainer = createRect(parseShapeId("drag-root"), {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });
    // Level 2: nested container (100, 100, 400, 400) inside drag-root => world (100, 100, 400, 400)
    const nestedContainer = createRect(
      parseShapeId("drag-nested"),
      { x: 100, y: 100, width: 400, height: 400 },
      { parent: rootContainer.id },
    );
    // Free shape outside on ROOT_ID at world (900, 100, 60, 40)
    const freeShape = createRect(parseShapeId("drag-free"), {
      x: 900,
      y: 100,
      width: 60,
      height: 40,
    });

    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rootContainer, nestedContainer, freeShape]),
    });

    editor.select(freeShape.id);

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    const upFn = mockSvg.listeners["pointerup"]?.[0];

    // Drag freeShape center from (930, 120) to (200, 200) inside nestedContainer
    // dx = 200 - 930 = -730, dy = 200 - 120 = 80
    // freeShape top-left was 900, 100 -> new top-left is (170, 180) in world
    downFn!({ button: 0, clientX: 930, clientY: 120, pointerId: 1, preventDefault: () => {} });
    moveFn!({ button: 0, clientX: 200, clientY: 200, pointerId: 1, preventDefault: () => {} });
    upFn!({ button: 0, clientX: 200, clientY: 200, pointerId: 1, preventDefault: () => {} });

    const docAfterDrag = editor.getDocument();
    const dragged = docAfterDrag.shapes[freeShape.id]!;
    expect(dragged.parentId).toBe(nestedContainer.id);
    // nestedContainer world origin is (100, 100). Local bounding box should be (170 - 100, 180 - 100) = (70, 80)
    expect(dragged.boundingBox.x).toBe(70);
    expect(dragged.boundingBox.y).toBe(80);
    expect(dragged.boundingBox.width).toBe(60);
    expect(dragged.boundingBox.height).toBe(40);
  });
});
