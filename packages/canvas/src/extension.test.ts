import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  CAPABILITIES,
  parseCustomShapeKind,
  parseShapeId,
  type BoundingBox,
  type Point,
} from "@open-draw/contracts";
import {
  COMMANDS,
  createDocument,
  createPage,
  isCustomShape,
  parseDocument,
  type CustomShape,
} from "@open-draw/document";
import { CanvasError } from "./errors";
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

  it("survives full round-trip: in-session create -> document JSON -> parse -> fresh editor reload -> edit -> re-serialize", () => {
    const customStarKind = parseCustomShapeKind("vendor:star-roundtrip");
    const roundtripExtension: CustomShapeExtension = {
      kind: customStarKind,
      label: "Roundtrip Star",
      capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
      defaultDimensions: { width: 80, height: 80 },
      render: (shape, box) => {
        const star = shape as CustomShape;
        const pts = (star.customData?.points as number) ?? 5;
        return `<polygon class="roundtrip-star" data-points="${pts}" points="${box.x},${box.y} ${box.x + box.width},${box.y + box.height}" fill="#ffd700" />`;
      },
      serialize: (shape) => {
        const star = shape as CustomShape;
        return { ...(star.customData ?? {}) };
      },
      deserialize: (data, base) => {
        return {
          ...base,
          customData: {
            points: data.points ?? 5,
            variant: data.variant ?? "default",
          },
        } as CustomShape;
      },
    };

    const container1 = new MockDomNode("div");
    const editor1 = createEditor(container1 as unknown as HTMLElement, {
      customShapes: [roundtripExtension],
    });

    const star1 = editor1.insertCustomShape(
      customStarKind,
      { x: 50, y: 60, width: 100, height: 100 },
      { fill: "#ffb703", points: 8, variant: "gold" },
    );

    expect(star1).toBeDefined();
    expect(isCustomShape(star1)).toBe(true);
    expect((star1 as CustomShape).customData?.points).toBe(8);

    // 2. Export to document JSON
    const json = editor1.toJson();
    expect(json).toContain("vendor:star-roundtrip");
    expect(json).toContain('"points": 8');
    expect(json).toContain('"variant": "gold"');

    // 3. Mount a completely fresh editor 2 and load the JSON
    const container2 = new MockDomNode("div");
    const editor2 = createEditor(container2 as unknown as HTMLElement, {
      customShapes: [roundtripExtension],
    });
    editor2.loadJson(json);

    const reloadedDoc = editor2.getDocument();
    const reloadedStar = reloadedDoc.shapes[star1.id] as CustomShape;
    expect(reloadedStar).toBeDefined();
    expect(reloadedStar.kind).toBe("vendor:star-roundtrip");
    expect(reloadedStar.customData?.points).toBe(8);
    expect(reloadedStar.customData?.variant).toBe("gold");

    // Renders correctly in new editor
    const scene2 = (editor2.svg as unknown as MockDomNode).querySelector(".od-document-scene");
    expect(scene2?.innerHTML).toContain('class="roundtrip-star"');
    expect(scene2?.innerHTML).toContain('data-points="8"');

    // 4. Edit shape in fresh editor (resize)
    editor2.execute([
      {
        type: COMMANDS.setShapeBoundingBox,
        id: star1.id,
        boundingBox: { x: 70, y: 80, width: 120, height: 120 },
      },
    ]);

    const editedDoc = editor2.getDocument();
    expect(editedDoc.shapes[star1.id]?.boundingBox).toEqual({
      x: 70,
      y: 80,
      width: 120,
      height: 120,
    });
    expect((editedDoc.shapes[star1.id] as CustomShape).customData?.points).toBe(8);

    // Undo restores position while preserving customData
    editor2.undo();
    expect(editor2.getDocument().shapes[star1.id]?.boundingBox).toEqual({
      x: 50,
      y: 60,
      width: 100,
      height: 100,
    });

    // 5. Re-serialize from editor 2
    const reSerializedJson = editor2.toJson();
    expect(reSerializedJson).toContain('"points": 8');
    expect(reSerializedJson).toContain('"variant": "gold"');

    editor1.destroy();
    editor2.destroy();
  });

  it("fails loudly when custom shape data is invalid or missing required fields (R-006)", () => {
    const strictKind = parseCustomShapeKind("vendor:strict-widget");
    const strictExtension: CustomShapeExtension = {
      kind: strictKind,
      label: "Strict Widget",
      capabilities: [CAPABILITIES.movable],
      render: () => "<rect />",
      validate: (shape) => {
        const custom = isCustomShape(shape) ? shape.customData : undefined;
        if (!custom || typeof custom.token !== "string" || custom.token.trim() === "") {
          throw new CanvasError(
            "invalidRegistration",
            `strict-widget missing required token property: ${shape.id}`,
          );
        }
      },
    };

    const container1 = new MockDomNode("div");
    const editorInstance = createEditor(container1 as unknown as HTMLElement, {
      customShapes: [strictExtension],
    });

    // 1. insertCustomShape fails loudly if required customData is missing
    expect(() => {
      editorInstance.insertCustomShape(
        strictKind,
        { x: 10, y: 10, width: 50, height: 50 },
        { label: "Bad Widget" },
      );
    }).toThrow(/strict-widget missing required token property/);

    // 2. loadJson fails loudly when serialized JSON lacks required fields
    const invalidJson = JSON.stringify({
      schema: { version: 1 },
      shapes: {
        "strict-1": {
          id: "strict-1",
          kind: "vendor:strict-widget",
          parentId: "canvas:root",
          boundingBox: { x: 10, y: 10, width: 50, height: 50 },
          meta: { order: {} },
        },
      },
    });

    expect(() => {
      editorInstance.loadJson(invalidJson);
    }).toThrow(/strict-widget missing required token property/);

    // 3. createEditor fails loudly on initialization if document contains invalid custom shape
    expect(() => {
      createEditor(new MockDomNode("div") as unknown as HTMLElement, {
        document: parseDocument(invalidJson),
        customShapes: [strictExtension],
      });
    }).toThrow(/strict-widget missing required token property/);

    // 4. registerCustomShape fails loudly if active document already contains invalid custom shape
    const cleanEditor = createEditor(new MockDomNode("div") as unknown as HTMLElement, {
      document: parseDocument(invalidJson),
    });
    expect(() => {
      cleanEditor.registerCustomShape(strictExtension);
    }).toThrow(/strict-widget missing required token property/);

    editorInstance.destroy();
    cleanEditor.destroy();
  });

  it("skips document re-hydration and avoids force render when registering an extension with zero instances in document (Issue 3)", () => {
    const pageId = parseShapeId("page-1");
    const doc = createDocument([createPage(pageId, { x: 0, y: 0, width: 800, height: 600 })]);
    const testEditor = createEditor(container as unknown as HTMLElement, { document: doc });
    const docScene = container.querySelector(".od-document-scene") as unknown as MockDomNode;
    expect(docScene).not.toBeNull();
    docScene.innerHTML = "SENTINEL_SCENE";

    testEditor.registerCustomShape(starExtension);

    expect(docScene.innerHTML).toBe("SENTINEL_SCENE");
    testEditor.destroy();
  });

  it("uses fast path for toJson when no custom shape serializers exist (Issue 8)", () => {
    const pageId = parseShapeId("page-1");
    const doc = createDocument([createPage(pageId, { x: 0, y: 0, width: 800, height: 600 })]);
    const testEditor = createEditor(container as unknown as HTMLElement, { document: doc });
    expect(JSON.parse(testEditor.toJson())).toEqual(JSON.parse(JSON.stringify(doc)));
    testEditor.destroy();
  });
});
