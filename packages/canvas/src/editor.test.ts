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
  listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName;
  }

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
    const mockWin = {
      addEventListener: () => {},
      removeEventListener: () => {},
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
});
