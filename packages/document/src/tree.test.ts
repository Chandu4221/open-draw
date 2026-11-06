import { describe, expect, it } from "vitest";
import { ROOT_ID, type ShapeId } from "@open-draw/contracts";
import type { Document } from "./document";
import type { Shape } from "./shape";
import {
  absoluteBoundingBox,
  ancestorsOf,
  buildChildIndex,
  childrenOf,
  shapeListInOrder,
  subtreeOf,
} from "./tree";

function makeDummyShape(id: string, parentId: string, x = 0, y = 0): Shape {
  return {
    id: id as ShapeId,
    kind: "rect",
    parentId: parentId as ShapeId,
    boundingBox: { x, y, width: 100, height: 100 },
    meta: { order: {} },
  };
}

function makeDoc(shapes: Shape[]): Document {
  const map: Record<ShapeId, Shape> = {};
  for (const s of shapes) {
    map[s.id] = s;
  }
  return {
    schema: { version: 1 },
    shapes: map,
  };
}

describe("tree operations", () => {
  it("builds an O(1) child index matching parent-to-children relationships", () => {
    const s1 = makeDummyShape("p1", ROOT_ID);
    const s2 = makeDummyShape("c1", "p1");
    const s3 = makeDummyShape("c2", "p1");
    const s4 = makeDummyShape("gc1", "c1");
    const doc = makeDoc([s1, s2, s3, s4]);

    const index = buildChildIndex(doc);
    expect(index.get(ROOT_ID)).toEqual([s1]);
    expect(index.get("p1" as ShapeId)).toEqual([s2, s3]);
    expect(index.get("c1" as ShapeId)).toEqual([s4]);
    expect(index.get("c2" as ShapeId)).toBeUndefined();
  });

  it("returns children with or without a precomputed child index", () => {
    const s1 = makeDummyShape("p1", ROOT_ID);
    const s2 = makeDummyShape("c1", "p1");
    const s3 = makeDummyShape("c2", "p1");
    const doc = makeDoc([s1, s2, s3]);

    const withoutIndex = childrenOf(doc, "p1" as ShapeId);
    const index = buildChildIndex(doc);
    const withIndex = childrenOf(doc, "p1" as ShapeId, index);

    expect(withoutIndex).toEqual([s2, s3]);
    expect(withIndex).toEqual([s2, s3]);
  });

  it("returns breadth-first descendants using cursor queue without array shifts", () => {
    const s1 = makeDummyShape("root", ROOT_ID);
    const c1 = makeDummyShape("c1", "root");
    const c2 = makeDummyShape("c2", "root");
    const gc1 = makeDummyShape("gc1", "c1");
    const doc = makeDoc([s1, c1, c2, gc1]);

    const subtree = subtreeOf(doc, "root" as ShapeId);
    expect(subtree.map((s) => s.id)).toEqual(["root", "c1", "c2", "gc1"]);
  });

  it("performs depth-first pre-order walk using child index", () => {
    const p1 = makeDummyShape("p1", ROOT_ID);
    const c1 = makeDummyShape("c1", "p1");
    const gc1 = makeDummyShape("gc1", "c1");
    const c2 = makeDummyShape("c2", "p1");
    const p2 = makeDummyShape("p2", ROOT_ID);
    const doc = makeDoc([p1, c1, gc1, c2, p2]);

    const ordered = shapeListInOrder(doc);
    expect(ordered.map((s) => s.id)).toEqual(["p1", "c1", "gc1", "c2", "p2"]);
  });

  it("walks ancestors up to the root", () => {
    const p1 = makeDummyShape("p1", ROOT_ID);
    const c1 = makeDummyShape("c1", "p1");
    const gc1 = makeDummyShape("gc1", "c1");
    const doc = makeDoc([p1, c1, gc1]);

    const ancestors = ancestorsOf(doc, gc1);
    expect(ancestors.map((s) => s.id)).toEqual(["c1", "p1"]);
  });

  it("computes absolute page-space bounding box through ancestor hierarchy", () => {
    const p1 = makeDummyShape("p1", ROOT_ID, 50, 100);
    const c1 = makeDummyShape("c1", "p1", 20, 30);
    const doc = makeDoc([p1, c1]);

    const box = absoluteBoundingBox(doc, c1);
    expect(box).toEqual({ x: 70, y: 130, width: 100, height: 100 });
  });

  it("handles large hierarchies in linear time without call-stack or quadratic slowdown", () => {
    const shapes: Shape[] = [];
    const root = makeDummyShape("r", ROOT_ID);
    shapes.push(root);

    // 1000 siblings under root
    for (let i = 0; i < 1000; i += 1) {
      shapes.push(makeDummyShape(`s_${i}`, "r"));
    }
    const doc = makeDoc(shapes);

    const start = Date.now();
    const ordered = shapeListInOrder(doc);
    const duration = Date.now() - start;

    expect(ordered.length).toBe(1001);
    expect(duration).toBeLessThan(1000);
  });
});
