import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  CAPABILITIES,
  parseCustomShapeKind,
  parseShapeId,
  type BoundingBox,
  type Point,
} from "@open-draw/contracts";
import { createDocument } from "@open-draw/document";
import { createEditor, type Editor } from "./editor";
import {
  createDefaultCustomShape,
  validateCustomShapeExtension,
  type CustomShapeExtension,
} from "./extension";

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

describe("CustomShapeExtension (ADR-0003, R-006, R-008)", () => {
  let container: MockDomNode;
  let editor: Editor | null = null;
  let origDoc: unknown;
  let origWin: unknown;

  beforeEach(() => {
    origDoc = (globalThis as unknown as { document?: unknown }).document;
    origWin = (globalThis as unknown as { window?: unknown }).window;

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

    container = new MockDomNode("div");
  });

  afterEach(() => {
    editor?.destroy();
    editor = null;
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
  });

  const starKind = parseCustomShapeKind("vendor:star");
  const starExtension: CustomShapeExtension = {
    kind: starKind,
    label: "Vendor Star",
    capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
    defaultDimensions: { width: 80, height: 80 },
    hitTest: (box: BoundingBox, _shape, point: Point) => {
      // Custom diamond/star hit-test: center check
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const dx = Math.abs(point.x - cx) / (box.width / 2);
      const dy = Math.abs(point.y - cy) / (box.height / 2);
      return dx + dy <= 1.0;
    },
    render: (_shape, box) =>
      `<polygon class="custom-star" points="${box.x + box.width / 2},${box.y} ${box.x + box.width},${box.y + box.height} ${box.x},${box.y + box.height}" fill="#ffd700" />`,
  };

  it("validates custom shape extension contract and rejects malformed registrations (R-006)", () => {
    expect(() => validateCustomShapeExtension(starExtension)).not.toThrow();

    // Invalid non-namespaced kind
    expect(() =>
      validateCustomShapeExtension({
        ...starExtension,
        kind: "invalid-kind" as unknown as typeof starKind,
      }),
    ).toThrow(/invalidRegistration/);

    // Empty label
    expect(() =>
      validateCustomShapeExtension({
        ...starExtension,
        label: "   ",
      }),
    ).toThrow(/invalidRegistration/);

    // Invalid capability
    expect(() =>
      validateCustomShapeExtension({
        ...starExtension,
        capabilities: ["unknown-cap" as unknown as typeof CAPABILITIES.movable],
      }),
    ).toThrow(/invalidCapability/);

    // Missing render function
    expect(() =>
      validateCustomShapeExtension({
        ...starExtension,
        render: null as unknown as typeof starExtension.render,
      }),
    ).toThrow(/invalidRegistration/);
  });

  it("creates default custom shape with valid envelope and meta defaults", () => {
    const shapeId = parseShapeId("star-1");
    const shape = createDefaultCustomShape(
      starExtension,
      shapeId,
      { x: 10, y: 20, width: 80, height: 80 },
      { fill: "#ffd700" },
    );

    expect(shape.id).toBe(shapeId);
    expect(shape.kind).toBe("vendor:star");
    expect(shape.boundingBox).toEqual({ x: 10, y: 20, width: 80, height: 80 });
    expect(shape.fill).toBe("#ffd700");
    expect(shape.parentId).toBe("canvas:root");
    expect(shape.meta.order).toEqual({});
  });

  it("registers custom shapes via options and editor method, upgrading fallback renderers dynamically", () => {
    const starShape = createDefaultCustomShape(starExtension, parseShapeId("star-unreg"), {
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });

    // 1. Mount editor WITHOUT starExtension registered initially
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument([starShape]),
    });

    const docScene = (editor.svg as unknown as MockDomNode).querySelector(".od-document-scene");
    expect(docScene).not.toBeNull();
    // Initially renders fallback placeholder per ADR-0003 D3
    expect(docScene!.innerHTML).toContain("[vendor:star]");
    expect(docScene!.innerHTML).not.toContain("custom-star");

    // 2. Dynamically register starExtension
    editor.registerCustomShape(starExtension);

    // Shape re-renders immediately using custom renderer
    expect(docScene!.innerHTML).toContain("custom-star");
    expect(docScene!.innerHTML).not.toContain("[vendor:star]");
    expect(editor.getCustomShape("vendor:star")).toBe(starExtension);
    expect(editor.getCustomShapes()).toHaveLength(1);

    // 3. SVG export includes custom renderer output
    const svgExport = editor.toSvg();
    expect(svgExport).toContain("custom-star");
  });

  it("supports insertCustomShape API executing transaction and selecting created shape", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      customShapes: [starExtension],
    });

    const inserted = editor.insertCustomShape(
      starKind,
      { x: 50, y: 50, width: 100, height: 100 },
      { label: "My Star", fill: "#ff0000" },
    );

    expect(inserted).toBeDefined();
    expect(inserted.kind).toBe("vendor:star");
    expect(inserted.label).toBe("My Star");
    expect(inserted.fill).toBe("#ff0000");

    const doc = editor.getDocument();
    expect(doc.shapes[inserted.id]).toBeDefined();
    expect(editor.getSelection()).toEqual([inserted.id]);

    // Undo reverts insertion
    expect(editor.canUndo()).toBe(true);
    editor.undo();
    expect(editor.getDocument().shapes[inserted.id]).toBeUndefined();
  });

  it("participates in custom geometric hit testing during pointer click selection", () => {
    editor = createEditor(container as unknown as HTMLElement, {
      customShapes: [starExtension],
    });

    const star = editor.insertCustomShape(starKind, { x: 100, y: 100, width: 100, height: 100 });
    editor.clearSelection();
    expect(editor.getSelection()).toHaveLength(0);

    const mockSvg = editor.svg as unknown as MockDomNode;

    // Click on corner (105, 105) -> inside bounding box (100..200) but outside diamond star hitTest
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 105,
      clientY: 105,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointerup", {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 105,
      clientY: 105,
    });
    expect(editor.getSelection()).not.toContain(star.id);

    // Click near center (150, 150) -> inside diamond star hitTest
    mockSvg.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 150,
      clientY: 150,
      preventDefault: () => {},
    });
    mockSvg.dispatch("pointerup", {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 150,
      clientY: 150,
    });
    expect(editor.getSelection()).toContain(star.id);
  });

  it("scales custom shape registration and rendering safely across 2x boundaries (2x Safety)", () => {
    // 250 shapes nominal, 500 limit, 1,000 shapes (2x Safety)
    const shapes1000 = Array.from({ length: 1000 }, (_, i) =>
      createDefaultCustomShape(starExtension, parseShapeId(`star-scale-${i}`), {
        x: (i % 40) * 20,
        y: Math.floor(i / 40) * 20,
        width: 15,
        height: 15,
      }),
    );

    const start = Date.now();
    editor = createEditor(container as unknown as HTMLElement, {
      document: createDocument(shapes1000),
      customShapes: [starExtension],
    });

    const mountDuration = Date.now() - start;
    expect(mountDuration).toBeLessThan(1000);
    expect(Object.keys(editor.getDocument().shapes)).toHaveLength(1000);

    // Verify SVG export with 1,000 custom shapes
    const svg = editor.toSvg();
    expect(svg.length).toBeGreaterThan(10000);
    expect(svg).toContain("custom-star");
  });
});
