import { describe, expect, it } from "vitest";
import packageJson from "../package.json" with { type: "json" };

// Import directly from the built distribution artifacts to verify the bundle is self-contained.
import {
  CANVAS_VERSION,
  COMMANDS,
  createCanvas,
  createDocument,
  createEditor,
  createRect,
  parseDocument,
  parseShapeId,
  ROOT_ID,
  serializeDocument,
  type Shape,
} from "../dist/index.js";

class MockDomNode {
  tagName: string;
  readonly style: Record<string, string> = {};
  attributes: Record<string, string> = {};
  children: MockDomNode[] = [];
  listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  innerHTML = "";
  clientWidth = 800;
  clientHeight = 600;
  capturedPointers: Set<number> = new Set();

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  setPointerCapture(id: number): void {
    this.capturedPointers.add(id);
  }

  hasPointerCapture(id: number): boolean {
    return this.capturedPointers.has(id);
  }

  releasePointerCapture(id: number): void {
    this.capturedPointers.delete(id);
  }

  focus(): void {}
  select(): void {}

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
    return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight };
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

  dispatch(event: string, arg: unknown): void {
    for (const fn of this.listeners[event] ?? []) {
      fn(arg);
    }
  }
}

describe("Downstream Package Packaging & Surface (ADR-0008, R-002, R-004)", () => {
  it("strictly enforces zero runtime dependencies in package.json (R-002)", () => {
    expect(packageJson.dependencies).toEqual({});
  });

  it("exports package entry points pointing to built dist artifacts (ADR-0008 D5)", () => {
    expect(packageJson.main).toBe("./dist/index.cjs");
    expect(packageJson.module).toBe("./dist/index.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports).toEqual({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/index.cjs",
        default: "./dist/index.js",
      },
    });
  });

  it("verifies built bundle exports and runs headless canvas workflow (ADR-0008 D1)", () => {
    expect(CANVAS_VERSION).toBe("0.9.0");

    const canvas = createCanvas();
    const rectId = parseShapeId("rect-smoke-1");
    const rect = createRect(
      rectId,
      { x: 20, y: 30, width: 120, height: 80 },
      { parentId: ROOT_ID, fill: "#e0e7ff" },
    );
    const doc = createDocument([rect]);

    // Spatial indexing & hit test works in built bundle
    const hit = canvas.pickShape(doc, { x: 50, y: 50 });
    expect(hit).toBe(rectId);

    // Serialization & parsing works in built bundle
    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);
    expect(parsed.shapes[rectId]?.boundingBox).toEqual({ x: 20, y: 30, width: 120, height: 80 });
  });

  it("verifies built bundle initializes Editor, inserts rect, and serializes document (ADR-0008 D1, R-016)", () => {
    const origDoc = (globalThis as unknown as { document?: unknown }).document;
    const origWin = (globalThis as unknown as { window?: unknown }).window;

    (globalThis as unknown as { document: unknown }).document = {
      createElementNS: (_ns: string, tag: string) => new MockDomNode(tag),
      createElement: (tag: string) => new MockDomNode(tag),
      body: new MockDomNode("body"),
      activeElement: null,
    };
    (globalThis as unknown as { window: unknown }).window = {
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    try {
      const container = new MockDomNode("div");
      const editor = createEditor(container as unknown as HTMLElement);

      // Insert rectangle via editor transaction
      const rectId = parseShapeId("editor-rect-1");
      const rect: Shape = createRect(
        rectId,
        { x: 100, y: 100, width: 200, height: 150 },
        { parentId: ROOT_ID, fill: "#3b82f6" },
      );
      editor.execute([
        {
          type: COMMANDS.createShape,
          shape: rect,
        },
      ]);

      // Selection & document state
      expect(editor.getDocument().shapes[rectId]).toBeDefined();
      expect(editor.getDocument().shapes[rectId]?.boundingBox).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      });

      // SVG export and JSON serialization
      const json = editor.toJson();
      expect(json).toContain('"editor-rect-1"');
      expect(json).toContain('"kind": "rect"');

      const svg = editor.toSvg();
      expect(svg).toContain("<svg");
      expect(svg).toContain("<rect");

      editor.destroy();
    } finally {
      if (origDoc !== undefined) {
        (globalThis as unknown as { document: unknown }).document = origDoc;
      } else {
        delete (globalThis as unknown as { document?: unknown }).document;
      }
      if (origWin !== undefined) {
        (globalThis as unknown as { window: unknown }).window = origWin;
      } else {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
    }
  });
});
