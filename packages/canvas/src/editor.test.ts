// Standalone editor behavior tests (R-015: describe = subject, it = behavior).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import { COMMANDS, createDocument, createRect } from "@open-draw/document";
import { createEditor, type Editor } from "./editor";
import { CONTROLLER_EVENTS } from "./events";
import { STATES } from "./states";
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

  capturedPointers: Set<number> = new Set();

  setPointerCapture(id: number): void {
    this.capturedPointers.add(id);
  }

  hasPointerCapture(id: number): boolean {
    return this.capturedPointers.has(id);
  }

  releasePointerCapture(id: number): void {
    this.capturedPointers.delete(id);
  }

  dispatch(event: string, arg: unknown): void {
    for (const fn of this.listeners[event] ?? []) {
      fn(arg);
    }
  }
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
      activeElement: null as unknown,
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
    // Level 1: root container (0, 0, 800, 600) with platform metadata (R-024, R-026)
    const rootContainer = createRect(
      parseShapeId("c-root"),
      {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      { meta: { order: {}, platform: "web" } },
    );
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
    // Level 1: root container (0, 0, 800, 600) with platform metadata (R-024, R-026)
    const rootContainer = createRect(
      parseShapeId("drag-root"),
      {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
      { meta: { order: {}, platform: "web" } },
    );
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

  it("does not reparent shape when dragged over another rectangle on a platform-agnostic canvas (R-004, R-024, R-026)", () => {
    // Both shapes are on ROOT_ID with no platform metadata
    const baseRect = createRect(parseShapeId("base-rect"), {
      x: 0,
      y: 0,
      width: 500,
      height: 500,
    });
    const movingShape = createRect(parseShapeId("moving-rect"), {
      x: 600,
      y: 100,
      width: 60,
      height: 40,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([baseRect, movingShape]),
    });
    editor.select(movingShape.id);

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    const upFn = mockSvg.listeners["pointerup"]?.[0];

    // Drag movingShape over baseRect at world (200, 200)
    downFn!({ button: 0, clientX: 630, clientY: 120, pointerId: 1, preventDefault: () => {} });
    moveFn!({ button: 0, clientX: 200, clientY: 200, pointerId: 1, preventDefault: () => {} });
    upFn!({ button: 0, clientX: 200, clientY: 200, pointerId: 1, preventDefault: () => {} });

    const docAfterDrag = editor.getDocument();
    const dragged = docAfterDrag.shapes[movingShape.id]!;
    // On platform-agnostic canvas, default parenting is OFF: stays on ROOT_ID
    expect(dragged.parentId).toBe(ROOT_ID);
  });

  it("resets machine state to idle on pointercancel (B1)", () => {
    const shape = createRect(parseShapeId("rect-cancel"), {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([shape]),
    });
    editor.select(shape.id);

    const mockSvg = editor.svg as unknown as {
      listeners: Record<string, ((evt: unknown) => void)[]>;
    };
    const downFn = mockSvg.listeners["pointerdown"]?.[0];
    const moveFn = mockSvg.listeners["pointermove"]?.[0];
    const cancelFn = mockSvg.listeners["pointercancel"]?.[0];

    downFn!({ button: 0, clientX: 20, clientY: 20, pointerId: 1, preventDefault: () => {} });
    moveFn!({ button: 0, clientX: 50, clientY: 50, pointerId: 1, preventDefault: () => {} });

    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    cancelFn!({});

    expect(editor.canvas.getMachineState().stateId).toBe(STATES.idle);
    expect(editor.getDocument().shapes[shape.id]!.boundingBox.x).toBe(10);
  });

  it("isolates keyboard shortcuts so focused editor handles delete without deleting in other editors", () => {
    const shape1 = createRect(parseShapeId("rect-ed1"), { x: 10, y: 10, width: 50, height: 50 });
    const shape2 = createRect(parseShapeId("rect-ed2"), { x: 100, y: 100, width: 50, height: 50 });

    const container1 = new MockDomNode("div");
    const container2 = new MockDomNode("div");

    const editor1 = createEditor(container1 as unknown as HTMLElement, {
      document: createDocument([shape1]),
    });
    const editor2 = createEditor(container2 as unknown as HTMLElement, {
      document: createDocument([shape2]),
    });

    editor1.select(shape1.id);
    editor2.select(shape2.id);

    // Set focus to editor 2 SVG
    (globalThis as unknown as { document: { activeElement: unknown } }).document.activeElement =
      editor2.svg;

    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;

    mockWin.dispatch("keydown", {
      code: "Delete",
      key: "Delete",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: () => {},
    });

    // Editor 2 was focused: shape2 deleted
    expect(editor2.getDocument().shapes[shape2.id]).toBeUndefined();
    // Editor 1 was NOT focused: shape1 MUST be preserved
    expect(editor1.getDocument().shapes[shape1.id]).toBeDefined();

    editor1.destroy();
    editor2.destroy();
  });

  it("stops emitting events after editor is destroyed", () => {
    const shape = createRect(parseShapeId("rect-dest"), { x: 10, y: 10, width: 50, height: 50 });
    const ed = createEditor(container as unknown as HTMLElement, {
      document: createDocument([shape]),
    });

    let calls = 0;
    ed.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      calls += 1;
    });

    ed.destroy();

    // After destroy, operations should not fire subscribers
    ed.execute([{ type: COMMANDS.deleteShape, id: shape.id }]);
    ed.canvas.emit(CONTROLLER_EVENTS.documentChanged);

    expect(calls).toBe(0);
  });

  it("updates cursor style according to active tool and handle hover", () => {
    editor = createEditor(container as unknown as HTMLElement);
    expect(editor.svg.style.cursor).toBe("default");

    editor.setTool(TOOLS.drawRect);
    expect(editor.svg.style.cursor).toBe("crosshair");

    editor.setTool(TOOLS.drawText);
    expect(editor.svg.style.cursor).toBe("text");

    editor.setTool(TOOLS.select);
    expect(editor.svg.style.cursor).toBe("default");
  });

  it("culls off-screen shapes from the rendered DOM while preserving visible and selected shapes", () => {
    const visibleShape = createRect(parseShapeId("rect-vis"), {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    });
    const offScreenShape = createRect(parseShapeId("rect-offscreen"), {
      x: 5000,
      y: 5000,
      width: 100,
      height: 100,
    });

    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([visibleShape, offScreenShape]),
    });

    const docScene = (editor.svg as unknown as MockDomNode).querySelector(".od-document-scene");
    expect(docScene).not.toBeNull();
    expect(docScene!.innerHTML).toContain('x="10"');
    expect(docScene!.innerHTML).not.toContain('x="5000"');

    // Moving camera to (5000, 5000) brings offScreenShape into view and culls visibleShape
    editor.setCamera({ x: 5000, y: 5000, zoom: 1 });
    expect(docScene!.innerHTML).not.toContain('x="10"');
    expect(docScene!.innerHTML).toContain('x="5000"');

    // Pan back to origin
    editor.setCamera({ x: 0, y: 0, zoom: 1 });
    expect(docScene!.innerHTML).toContain('x="10"');
    expect(docScene!.innerHTML).not.toContain('x="5000"');

    // Selecting an off-screen shape preserves it in the rendered DOM
    editor.select(offScreenShape.id);
    expect(docScene!.innerHTML).toContain('x="10"');
    expect(docScene!.innerHTML).toContain('x="5000"');
  });

  it("handles multi-touch pinch-to-zoom and two-finger pan gestures", () => {
    editor = createEditor(container as unknown as HTMLElement);
    const mockSvg = editor.svg as unknown as MockDomNode;
    expect(editor.getCamera().zoom).toBe(1);

    // Touch 1 down at (100, 100), Touch 2 down at (200, 100) -> distance 100, center (150, 100)
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
      preventDefault: () => {},
    });

    // Expand distance to 200 (2x zoom) centered at (150, 100)
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      pointerType: "touch",
      clientX: 50,
      clientY: 100,
    });
    mockSvg.dispatch("pointermove", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 250,
      clientY: 100,
    });

    expect(editor.getCamera().zoom).toBeCloseTo(2);

    // Lift both touches
    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      pointerType: "touch",
      clientX: 50,
      clientY: 100,
    });
    mockSvg.dispatch("pointerup", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 250,
      clientY: 100,
    });

    expect(editor.canvas.getMachineState().stateId).toBe(STATES.idle);
  });

  it("cancels single-pointer drawing gesture when a second touch pointer lands", () => {
    editor = createEditor(container as unknown as HTMLElement);
    editor.setTool(TOOLS.drawRect);

    const mockSvg = editor.svg as unknown as MockDomNode;

    // Start drawing with finger 1
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      pointerType: "touch",
      clientX: 50,
      clientY: 50,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      pointerType: "touch",
      clientX: 150,
      clientY: 150,
    });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.drawingShape);

    // Second finger touches down -> cancels drawing gesture
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.idle);

    // Lift fingers
    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      pointerType: "touch",
      clientX: 150,
      clientY: 150,
    });
    mockSvg.dispatch("pointerup", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 200,
    });

    // No shape was created
    expect(Object.keys(editor.getDocument().shapes)).toHaveLength(0);
  });

  it("resets active dragging gesture and releases pointer capture on lostpointercapture", () => {
    const rect = createRect(parseShapeId("rect-lpc"), { x: 10, y: 10, width: 100, height: 100 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    const mockSvg = editor.svg as unknown as MockDomNode;

    // Drag shape
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 20,
      preventDefault: () => {},
    });
    expect(mockSvg.hasPointerCapture(1)).toBe(true);

    mockSvg.dispatch("pointermove", { pointerId: 1, clientX: 60, clientY: 60 });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    // Lost pointer capture event occurs
    mockSvg.dispatch("lostpointercapture", { pointerId: 1 });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.idle);
    expect(mockSvg.hasPointerCapture(1)).toBe(false);

    // Shape position remains unchanged at (10, 10)
    expect(editor.getDocument().shapes[rect.id]!.boundingBox.x).toBe(10);
  });

  it("aborts in-flight gesture on window blur", () => {
    const rect = createRect(parseShapeId("rect-blur"), { x: 10, y: 10, width: 100, height: 100 });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 20,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointermove", { pointerId: 1, clientX: 50, clientY: 50 });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;
    mockWin.dispatch("blur", {});

    expect(editor.canvas.getMachineState().stateId).toBe(STATES.idle);
    expect(editor.getDocument().shapes[rect.id]!.boundingBox.x).toBe(10);
  });

  it("snaps moving shape to nearby target shape and renders alignment guides in overlay scene", () => {
    const target = createRect(parseShapeId("rect-target"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    const moving = createRect(parseShapeId("rect-moving"), {
      x: 300,
      y: 300,
      width: 80,
      height: 80,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([target, moving]),
    });
    editor.select(moving.id);

    const mockSvg = editor.svg as unknown as MockDomNode;
    // Pointer down on moving shape at (310, 310)
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 310,
      clientY: 310,
      preventDefault: () => {},
    });

    // Move by (-198, 0) to (112, 310) -> candidate left is at 300 - 198 = 102 (within 2px of target left at 100)
    mockSvg.dispatch("pointermove", { pointerId: 1, clientX: 112, clientY: 310 });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    // Overlays should include the vertical snap guide at x="100"
    const overlayScene = mockSvg.querySelector<MockDomNode>(".od-overlay-scene");
    expect(overlayScene).not.toBeNull();
    expect(overlayScene!.innerHTML).toContain('<line x1="100"');
    expect(overlayScene!.innerHTML).toContain('stroke="var(--od-snap-guide, #ff007a)"');

    // Release pointer
    mockSvg.dispatch("pointerup", { pointerId: 1, clientX: 112, clientY: 310 });

    // Committed shape X coordinate must be snapped exactly to 100 (not 102)
    const docAfterMove = editor.getDocument();
    expect(docAfterMove.shapes[moving.id]!.boundingBox.x).toBe(100);
  });

  it("bypasses snapping when altKey is pressed during drag", () => {
    const target = createRect(parseShapeId("rect-target-alt"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    const moving = createRect(parseShapeId("rect-moving-alt"), {
      x: 300,
      y: 300,
      width: 80,
      height: 80,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([target, moving]),
    });
    editor.select(moving.id);

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 310,
      clientY: 310,
      preventDefault: () => {},
    });

    // Move to (112, 310) with altKey: true
    mockSvg.dispatch("pointermove", { pointerId: 1, clientX: 112, clientY: 310, altKey: true });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    const overlayScene = mockSvg.querySelector<MockDomNode>(".od-overlay-scene");
    expect(overlayScene!.innerHTML).not.toContain('stroke="var(--od-snap-guide, #ff007a)"');

    mockSvg.dispatch("pointerup", { pointerId: 1, clientX: 112, clientY: 310, altKey: true });

    // Committed shape X coordinate remains unconstrained at 102
    const docAfterMove = editor.getDocument();
    expect(docAfterMove.shapes[moving.id]!.boundingBox.x).toBe(102);
  });

  it("reads system clipboard on paste when external payload was copied after local copy (P1.1)", async () => {
    let clipboardText = "";
    const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          writeText: async (text: string) => {
            clipboardText = text;
          },
          readText: async () => clipboardText,
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      const shapeLocal = createRect(parseShapeId("rect-local"), {
        x: 10,
        y: 10,
        width: 50,
        height: 50,
      });
      editor = createEditor(container as unknown as HTMLElement, {
        document: createDocument([shapeLocal]),
      });
      editor.select(shapeLocal.id);

      const mockWin = (
        globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
      ).window;

      // 1. Copy locally
      mockWin.dispatch("keydown", {
        code: "KeyC",
        key: "c",
        ctrlKey: true,
        preventDefault: () => {},
      });
      expect(clipboardText).toContain("rect-local");

      // 2. External app modifies system clipboard with different payload
      const externalPayload = JSON.stringify({
        type: "open-draw/clipboard",
        version: 1,
        copyId: "external-source-id",
        shapes: [
          {
            id: "rect-external",
            kind: "rect",
            parentId: "canvas:root",
            boundingBox: { x: 200, y: 200, width: 80, height: 80 },
            meta: {},
          },
        ],
        topLevelIds: ["rect-external"],
      });
      clipboardText = externalPayload;

      // 3. Paste via Ctrl+V
      mockWin.dispatch("keydown", {
        code: "KeyV",
        key: "v",
        ctrlKey: true,
        preventDefault: () => {},
      });

      // Wait a microtask tick for async navigator.clipboard.readText()
      await new Promise((r) => setTimeout(r, 10));

      const doc = editor.getDocument();
      const shapes = Object.values(doc.shapes);
      const externalPasted = shapes.find((s) => s.boundingBox.x === 220 && s.boundingBox.y === 220);
      expect(externalPasted).toBeDefined();
    } finally {
      if (origDescriptor) {
        Object.defineProperty(globalThis, "navigator", origDescriptor);
      } else {
        delete (globalThis as unknown as { navigator?: unknown }).navigator;
      }
    }
  });

  it("isolates active mouse drag gesture from secondary touch pointer events (P1.2)", () => {
    const rect = createRect(parseShapeId("rect-drag-isolated"), {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    const mockSvg = editor.svg as unknown as MockDomNode;

    // 1. Primary mouse pointer (pointerId: 1) starts drag
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 60,
      clientY: 60,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 70,
      clientY: 70,
    });
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    // 2. Secondary touch pointer (pointerId: 2) contacts screen
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
      clientX: 500,
      clientY: 500,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointermove", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 550,
      clientY: 550,
    });
    mockSvg.dispatch("pointerup", {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
      clientX: 550,
      clientY: 550,
    });

    // Active drag must still be running for pointerId: 1
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.draggingShape);

    // 3. Primary mouse pointer moves and completes
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 120,
      clientY: 120,
    });
    mockSvg.dispatch("pointerup", {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 120,
      clientY: 120,
    });

    // Machine should return to idle and shape moved by delta (60px)
    expect(editor.canvas.getMachineState().stateId).toBe(STATES.idle);
    const moved = editor.getDocument().shapes[rect.id]!;
    expect(moved.boundingBox.x).toBe(110);
    expect(moved.boundingBox.y).toBe(110);
  });

  it("enforces paste limits and 2x scale safety boundaries (P1.3 & 2x Safety)", async () => {
    let clipboardText = "";
    const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          readText: async () => clipboardText,
          writeText: async (t: string) => {
            clipboardText = t;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      editor = createEditor(container as unknown as HTMLElement);
      const mockWin = (
        globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
      ).window;

      // Test A: Out-of-bounds coordinates (1e300) are rejected
      clipboardText = JSON.stringify({
        type: "open-draw/clipboard",
        version: 1,
        shapes: [
          {
            id: "rect-huge",
            kind: "rect",
            parentId: "canvas:root",
            boundingBox: { x: 1e300, y: 1e300, width: 100, height: 100 },
          },
        ],
        topLevelIds: ["rect-huge"],
      });

      mockWin.dispatch("keydown", {
        code: "KeyV",
        key: "v",
        ctrlKey: true,
        preventDefault: () => {},
      });
      await new Promise((r) => setTimeout(r, 10));
      expect(Object.keys(editor.getDocument().shapes).length).toBe(0);

      // Test B: Nominal load (250 shapes) - accepted
      const shapes250 = Array.from({ length: 250 }, (_, i) => ({
        id: `rect-p250-${i}`,
        kind: "rect",
        parentId: "canvas:root",
        boundingBox: { x: (i % 20) * 10, y: Math.floor(i / 20) * 10, width: 8, height: 8 },
      }));
      clipboardText = JSON.stringify({
        type: "open-draw/clipboard",
        version: 1,
        shapes: shapes250,
        topLevelIds: shapes250.map((s) => s.id),
      });

      mockWin.dispatch("keydown", {
        code: "KeyV",
        key: "v",
        ctrlKey: true,
        preventDefault: () => {},
      });
      await new Promise((r) => setTimeout(r, 10));
      expect(Object.keys(editor.getDocument().shapes).length).toBe(250);

      // Test C: 2x Scale Safety Limit (1,000 shapes vs limit of 500)
      // 1,000 shapes payload must be rejected / capped at MAX_PASTE_SHAPE_COUNT without freezing
      const shapes1000 = Array.from({ length: 1000 }, (_, i) => ({
        id: `rect-p1000-${i}`,
        kind: "rect",
        parentId: "canvas:root",
        boundingBox: {
          x: 100 + (i % 30) * 10,
          y: 100 + Math.floor(i / 30) * 10,
          width: 8,
          height: 8,
        },
      }));
      clipboardText = JSON.stringify({
        type: "open-draw/clipboard",
        version: 1,
        shapes: shapes1000,
        topLevelIds: shapes1000.map((s) => s.id),
      });

      mockWin.dispatch("keydown", {
        code: "KeyV",
        key: "v",
        ctrlKey: true,
        preventDefault: () => {},
      });
      await new Promise((r) => setTimeout(r, 10));
      // Excessive 1,000 shape paste should not be applied (stays at previous 250 shapes)
      expect(Object.keys(editor.getDocument().shapes).length).toBe(250);
    } finally {
      if (origDescriptor) {
        Object.defineProperty(globalThis, "navigator", origDescriptor);
      } else {
        delete (globalThis as unknown as { navigator?: unknown }).navigator;
      }
    }
  });

  it("pastes full OpenDraw document JSON directly into canvas (R-006, R-016)", async () => {
    let clipboardText = "";
    const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          readText: async () => clipboardText,
          writeText: async (t: string) => {
            clipboardText = t;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      editor = createEditor(container as unknown as HTMLElement);
      const mockWin = (
        globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
      ).window;

      // Full OpenDraw document payload with schema, shapes dictionary, shapeOrder
      clipboardText = JSON.stringify({
        schema: { version: 1 },
        semantics: { version: 1 },
        shapeOrder: ["s-7a05", "s-7a06", "s-7a07", "s-7a08"],
        shapes: {
          "s-7a05": {
            id: "s-7a05",
            chipId: "#s-7a05",
            kind: "ellipse",
            parentId: "canvas:root",
            boundingBox: { x: 358.29, y: 78.06, width: 339.35, height: 329.45 },
            meta: { semantic: null },
          },
          "s-7a06": {
            id: "s-7a06",
            chipId: "#s-7a06",
            kind: "ellipse",
            parentId: "canvas:root",
            boundingBox: { x: 807, y: 130.15, width: 234.68, height: 318.75 },
            meta: { semantic: null },
          },
          "s-7a07": {
            id: "s-7a07",
            chipId: "#s-7a07",
            kind: "ellipse",
            parentId: "canvas:root",
            boundingBox: { x: 247.95, y: 267.04, width: 310.84, height: 241.02 },
            meta: { semantic: null },
          },
          "s-7a08": {
            id: "s-7a08",
            chipId: "#s-7a08",
            kind: "rect",
            parentId: "canvas:root",
            boundingBox: { x: 598.96, y: 407.51, width: 466.38, height: 191.98 },
            meta: { semantic: null },
          },
        },
      });

      mockWin.dispatch("keydown", {
        code: "KeyV",
        key: "v",
        ctrlKey: true,
        preventDefault: () => {},
      });
      await new Promise((r) => setTimeout(r, 10));

      const shapes = Object.values(editor.getDocument().shapes);
      expect(shapes).toHaveLength(4);
      const ellipses = shapes.filter((s) => s.kind === "ellipse");
      const rects = shapes.filter((s) => s.kind === "rect");
      expect(ellipses).toHaveLength(3);
      expect(rects).toHaveLength(1);
      expect(editor.getSelection()).toHaveLength(4);
    } finally {
      if (origDescriptor) {
        Object.defineProperty(globalThis, "navigator", origDescriptor);
      } else {
        delete (globalThis as unknown as { navigator?: unknown }).navigator;
      }
    }
  });

  it("recalculates viewport visibility and renders shapes when container resizes via ResizeObserver", () => {
    let observerCallback: ResizeObserverCallback | null = null;
    let disconnected = false;

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        observerCallback = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {
        disconnected = true;
      }
    }

    const origRO = globalThis.ResizeObserver;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockResizeObserver;

    try {
      const rect = createRect(parseShapeId("rect-ro"), {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });

      // Initially zero dimensions (hidden container)
      const mockContainer = {
        ...container,
        clientWidth: 0,
        clientHeight: 0,
        appendChild: () => {},
        contains: () => true,
        removeChild: () => {},
      };

      editor = createEditor(mockContainer as unknown as HTMLElement, {
        document: createDocument([rect]),
      });

      expect(observerCallback).not.toBeNull();
      const initialDocScene = (editor.svg as unknown as MockDomNode).querySelector(
        ".od-document-scene",
      );
      expect(initialDocScene?.innerHTML).toBe("");

      // Trigger ResizeObserver transition to visible (800x600)
      (mockContainer as { clientWidth: number; clientHeight: number }).clientWidth = 800;
      (mockContainer as { clientWidth: number; clientHeight: number }).clientHeight = 600;

      observerCallback!(
        [
          {
            contentRect: {
              width: 800,
              height: 600,
              x: 0,
              y: 0,
              top: 0,
              bottom: 600,
              left: 0,
              right: 800,
            },
            target: mockContainer as unknown as Element,
          } as unknown as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );

      // Verify shape was rendered into document scene
      const docScene = (editor.svg as unknown as MockDomNode).querySelector(".od-document-scene");
      expect(docScene).not.toBeNull();
      expect(docScene!.innerHTML).toContain('x="100"');

      // Verify observer disconnect on destroy
      editor.destroy();
      expect(disconnected).toBe(true);
    } finally {
      if (origRO) {
        globalThis.ResizeObserver = origRO;
      } else {
        delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
      }
    }
  });

  it("handles 50 rapid sequential resize cycles safely (2x Safety)", () => {
    let observerCallback: ResizeObserverCallback | null = null;

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        observerCallback = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    const origRO = globalThis.ResizeObserver;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockResizeObserver;

    try {
      const rect = createRect(parseShapeId("rect-rapid"), {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      });

      editor = createEditor(container as unknown as HTMLElement, {
        document: createDocument([rect]),
      });

      expect(observerCallback).not.toBeNull();

      // 50 rapid resize trigger cycles with alternating dimensions
      for (let i = 0; i < 50; i++) {
        const w = 400 + (i % 10) * 50;
        const h = 300 + (i % 10) * 40;
        observerCallback!(
          [
            {
              contentRect: {
                width: w,
                height: h,
                x: 0,
                y: 0,
                top: 0,
                bottom: h,
                left: 0,
                right: w,
              },
              target: container as unknown as Element,
            } as unknown as ResizeObserverEntry,
          ],
          {} as ResizeObserver,
        );
      }

      // Assert editor remains functional and responsive
      expect(editor.getDocument().shapes[rect.id]).toBeDefined();
      const docScene = (editor.svg as unknown as MockDomNode).querySelector(".od-document-scene");
      expect(docScene).not.toBeNull();
      expect(docScene!.innerHTML).toContain('x="50"');
    } finally {
      if (origRO) {
        globalThis.ResizeObserver = origRO;
      } else {
        delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
      }
    }
  });

  it("commits zero transactions when pointer drag is below the 3px threshold", () => {
    const rect = createRect(parseShapeId("rect-subthresh"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    // Move only 1px (below 3px threshold)
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 151,
      clientY: 150,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 151,
      clientY: 150,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(0);
    expect(editor.canUndo()).toBe(false);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.x).toBe(100);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.y).toBe(100);
  });

  it("commits zero transactions and preserves original position when Escape cancels mid-drag", () => {
    const rect = createRect(parseShapeId("rect-esc-drag"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    // Drag 50px (exceeds threshold)
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    // Escape pressed mid-drag
    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;
    mockWin.dispatch("keydown", {
      code: "Escape",
      key: "Escape",
      preventDefault: () => {},
    });

    // Pointer up after escape
    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(0);
    expect(editor.canUndo()).toBe(false);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.x).toBe(100);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.y).toBe(100);
  });

  it("commits zero transactions and resets tool when Escape cancels mid-draw", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([]),
    });
    editor.setTool(TOOLS.drawRect);

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 50,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    const mockWin = (
      globalThis as unknown as { window: { dispatch: (evt: string, arg: unknown) => void } }
    ).window;
    mockWin.dispatch("keydown", {
      code: "Escape",
      key: "Escape",
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(0);
    expect(editor.canUndo()).toBe(false);
    expect(Object.keys(editor.getDocument().shapes)).toHaveLength(0);
    expect(editor.getTool()).toBe(TOOLS.select);
  });

  it("commits zero transactions and preserves document on pointercancel mid-drag", () => {
    const rect = createRect(parseShapeId("rect-cancel-drag"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointercancel", {
      pointerId: 1,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(0);
    expect(editor.canUndo()).toBe(false);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.x).toBe(100);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.y).toBe(100);
  });

  it("commits zero transactions and preserves document on lostpointercapture mid-drag", () => {
    const rect = createRect(parseShapeId("rect-lostcap-drag"), {
      x: 50,
      y: 50,
      width: 80,
      height: 80,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 80,
      clientY: 80,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 160,
      clientY: 160,
      preventDefault: () => {},
    });

    mockSvg.dispatch("lostpointercapture", {
      pointerId: 1,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 160,
      clientY: 160,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(0);
    expect(editor.canUndo()).toBe(false);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.x).toBe(50);
  });

  it("moves multi-selected shapes together with exactly 1 transaction and prevents mutual reparenting", () => {
    const parentContainer = createRect(parseShapeId("container-a"), {
      x: 0,
      y: 0,
      width: 400,
      height: 400,
    });
    const siblingShape = createRect(parseShapeId("shape-b"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([parentContainer, siblingShape]),
      nestingMode: "containers-only",
    });

    editor.selectMany([parentContainer.id, siblingShape.id]);

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(1);
    expect(editor.canUndo()).toBe(true);

    const doc = editor.getDocument();
    expect(doc.shapes[parentContainer.id]?.boundingBox.x).toBe(50);
    expect(doc.shapes[parentContainer.id]?.boundingBox.y).toBe(50);
    expect(doc.shapes[parentContainer.id]?.parentId).toBe(ROOT_ID);

    // siblingShape must NOT be reparented into parentContainer because both were dragged together
    expect(doc.shapes[siblingShape.id]?.boundingBox.x).toBe(150);
    expect(doc.shapes[siblingShape.id]?.boundingBox.y).toBe(150);
    expect(doc.shapes[siblingShape.id]?.parentId).toBe(ROOT_ID);

    editor.undo();
    const undoneDoc = editor.getDocument();
    expect(undoneDoc.shapes[parentContainer.id]?.boundingBox.x).toBe(0);
    expect(undoneDoc.shapes[siblingShape.id]?.boundingBox.x).toBe(100);
  });

  it("commits zero transactions when resize completes with unchanged dimensions", () => {
    const rect = createRect(parseShapeId("rect-resize-noop"), {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([rect]),
    });
    editor.select(rect.id);

    let historyChangeCount = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyChangeCount++;
    });

    const mockSvg = editor.svg as unknown as MockDomNode;
    // Click SE handle at (200, 200)
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    // Move away then back to exact origin (200, 200)
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 220,
      clientY: 220,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    mockSvg.dispatch("pointerup", {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
      preventDefault: () => {},
    });

    expect(historyChangeCount).toBe(0);
    expect(editor.canUndo()).toBe(false);
    expect(editor.getDocument().shapes[rect.id]?.boundingBox.width).toBe(100);
  });

  it("maintains strict history and inverse command integrity across 25 mixed operations with 25 undos and 25 redos", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([]),
    });

    let historyEvents = 0;
    editor.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyEvents++;
    });

    for (let i = 0; i < 25; i++) {
      const shape = createRect(parseShapeId(`seq-shape-${i}`), {
        x: i * 10,
        y: i * 10,
        width: 50,
        height: 50,
      });
      editor.execute([{ type: COMMANDS.createShape, shape }]);
    }

    expect(historyEvents).toBe(25);
    expect(Object.keys(editor.getDocument().shapes)).toHaveLength(25);

    for (let i = 0; i < 25; i++) {
      expect(editor.canUndo()).toBe(true);
      const ok = editor.undo();
      expect(ok).toBe(true);
    }
    expect(editor.canUndo()).toBe(false);
    expect(Object.keys(editor.getDocument().shapes)).toHaveLength(0);

    for (let i = 0; i < 25; i++) {
      expect(editor.canRedo()).toBe(true);
      const ok = editor.redo();
      expect(ok).toBe(true);
    }
    expect(editor.canRedo()).toBe(false);
    expect(Object.keys(editor.getDocument().shapes)).toHaveLength(25);
  });
});
