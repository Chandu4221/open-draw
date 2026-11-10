import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROLLER_EVENTS, createEditor, TOOLS, type Editor } from "@open-draw/canvas";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import { COMMANDS, createDocument, createRect } from "@open-draw/document";

class MockDomNode {
  readonly tagName: string;
  readonly style: Record<string, string> = {};
  readonly attributes: Record<string, string> = {};
  readonly children: MockDomNode[] = [];
  innerHTML = "";
  listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  setAttribute(name: string, val: string): void {
    this.attributes[name] = val;
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
      if (child.attributes["class"] === className) return child as unknown as T;
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

describe("StudioShell editor event synchronization", () => {
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
    const mockWin = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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
    (globalThis as unknown as { document: unknown }).document = originalDocument;
    (globalThis as unknown as { window: unknown }).window = originalWindow;
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
});
