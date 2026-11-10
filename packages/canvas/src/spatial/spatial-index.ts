// Pure 2D STR (Sort-Tile-Recursive) R-Tree spatial index (R-002, R-008, R-010, R-016, ADR-0011).
// Provides O(log N + K) broad-phase spatial point and box queries over document bounding boxes.
import { ROOT_ID, type BoundingBox, type Point, type ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, shapeListInOrder, type Document } from "@open-draw/document";

export const SPATIAL_NODE_CAPACITY = 16;

export interface SpatialIndexItem {
  readonly id: ShapeId;
  readonly box: BoundingBox;
  readonly zIndex: number;
}

export interface SpatialBoundingBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface SpatialLeafNode {
  readonly isLeaf: true;
  readonly box: SpatialBoundingBox;
  readonly items: readonly SpatialIndexItem[];
}

export interface SpatialInternalNode {
  readonly isLeaf: false;
  readonly box: SpatialBoundingBox;
  readonly children: readonly SpatialNode[];
}

export type SpatialNode = SpatialLeafNode | SpatialInternalNode;

export interface SpatialIndex {
  readonly root: SpatialNode | null;
  readonly count: number;
}

export function toSpatialBox(box: BoundingBox): SpatialBoundingBox {
  return { minX: box.x, minY: box.y, maxX: box.x + box.width, maxY: box.y + box.height };
}

export function spatialBoxesIntersect(a: SpatialBoundingBox, b: SpatialBoundingBox): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

export function pointInSpatialBox(box: SpatialBoundingBox, p: Point, tolerance = 0): boolean {
  return (
    p.x >= box.minX - tolerance &&
    p.x < box.maxX + tolerance &&
    p.y >= box.minY - tolerance &&
    p.y < box.maxY + tolerance
  );
}

export function computeEnclosingSpatialBox(
  boxes: readonly SpatialBoundingBox[],
): SpatialBoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i]!;
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return boxes.length === 0 ? { minX: 0, minY: 0, maxX: 0, maxY: 0 } : { minX, minY, maxX, maxY };
}

function computeEnclosingFromItems(items: readonly SpatialIndexItem[]): SpatialBoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < items.length; i += 1) {
    const b = items[i]!.box;
    const right = b.x + b.width;
    const bottom = b.y + b.height;
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }
  return items.length === 0 ? { minX: 0, minY: 0, maxX: 0, maxY: 0 } : { minX, minY, maxX, maxY };
}

function computeEnclosingFromNodes(nodes: readonly SpatialNode[]): SpatialBoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < nodes.length; i += 1) {
    const b = nodes[i]!.box;
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return nodes.length === 0 ? { minX: 0, minY: 0, maxX: 0, maxY: 0 } : { minX, minY, maxX, maxY };
}

/**
 * Creates a packed 2D R-Tree from items using the Sort-Tile-Recursive (STR) algorithm.
 */
export function createSpatialIndex(
  items: readonly SpatialIndexItem[],
  nodeCapacity = SPATIAL_NODE_CAPACITY,
): SpatialIndex {
  if (items.length === 0) {
    return { root: null, count: 0 };
  }
  if (items.length <= nodeCapacity) {
    const box = computeEnclosingFromItems(items);
    return {
      root: { isLeaf: true, box, items: [...items] },
      count: items.length,
    };
  }

  // 1. Build leaf level
  const totalLeafNodes = Math.ceil(items.length / nodeCapacity);
  const slicesCount = Math.ceil(Math.sqrt(totalLeafNodes));
  const itemsPerSlice = slicesCount * nodeCapacity;

  const sortedByX = [...items].sort((a, b) => {
    const ax = a.box.x + a.box.width / 2;
    const bx = b.box.x + b.box.width / 2;
    return ax - bx;
  });

  const leafNodes: SpatialLeafNode[] = [];
  for (let s = 0; s < sortedByX.length; s += itemsPerSlice) {
    const slice = sortedByX.slice(s, s + itemsPerSlice);
    slice.sort((a, b) => {
      const ay = a.box.y + a.box.height / 2;
      const by = b.box.y + b.box.height / 2;
      return ay - by;
    });

    for (let c = 0; c < slice.length; c += nodeCapacity) {
      const chunk = slice.slice(c, c + nodeCapacity);
      const box = computeEnclosingFromItems(chunk);
      leafNodes.push({ isLeaf: true, box, items: chunk });
    }
  }

  // 2. Build internal levels recursively
  let currentLevel: SpatialNode[] = leafNodes;
  while (currentLevel.length > 1) {
    if (currentLevel.length <= nodeCapacity) {
      const rootBox = computeEnclosingFromNodes(currentLevel);
      return {
        root: { isLeaf: false, box: rootBox, children: currentLevel },
        count: items.length,
      };
    }

    const totalParentNodes = Math.ceil(currentLevel.length / nodeCapacity);
    const parentSlicesCount = Math.ceil(Math.sqrt(totalParentNodes));
    const nodesPerSlice = parentSlicesCount * nodeCapacity;

    currentLevel.sort((a, b) => {
      const ax = (a.box.minX + a.box.maxX) / 2;
      const bx = (b.box.minX + b.box.maxX) / 2;
      return ax - bx;
    });

    const nextLevel: SpatialInternalNode[] = [];
    for (let s = 0; s < currentLevel.length; s += nodesPerSlice) {
      const slice = currentLevel.slice(s, s + nodesPerSlice);
      slice.sort((a, b) => {
        const ay = (a.box.minY + a.box.maxY) / 2;
        const by = (b.box.minY + b.box.maxY) / 2;
        return ay - by;
      });

      for (let c = 0; c < slice.length; c += nodeCapacity) {
        const chunk = slice.slice(c, c + nodeCapacity);
        const box = computeEnclosingFromNodes(chunk);
        nextLevel.push({ isLeaf: false, box, children: chunk });
      }
    }
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0] ?? null,
    count: items.length,
  };
}

/**
 * Queries the spatial index for items containing or within tolerance of a world point.
 * Results are sorted by zIndex descending (topmost first).
 */
export function querySpatialIndexPoint(
  index: SpatialIndex,
  point: Point,
  tolerance = 0,
): readonly SpatialIndexItem[] {
  if (index.root === null) return [];
  const results: SpatialIndexItem[] = [];
  const stack: SpatialNode[] = [index.root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!pointInSpatialBox(node.box, point, tolerance)) {
      continue;
    }
    if (node.isLeaf) {
      for (const item of node.items) {
        const itemBox = toSpatialBox(item.box);
        if (pointInSpatialBox(itemBox, point, tolerance)) {
          results.push(item);
        }
      }
    } else {
      for (let i = 0; i < node.children.length; i += 1) {
        stack.push(node.children[i]!);
      }
    }
  }

  results.sort((a, b) => b.zIndex - a.zIndex);
  return results;
}

/**
 * Queries the spatial index for items intersecting a bounding box.
 */
export function querySpatialIndexBox(
  index: SpatialIndex,
  box: BoundingBox,
): readonly SpatialIndexItem[] {
  if (index.root === null) return [];
  const targetSpatialBox = toSpatialBox(box);
  const results: SpatialIndexItem[] = [];
  const stack: SpatialNode[] = [index.root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!spatialBoxesIntersect(node.box, targetSpatialBox)) {
      continue;
    }
    if (node.isLeaf) {
      for (const item of node.items) {
        if (spatialBoxesIntersect(toSpatialBox(item.box), targetSpatialBox)) {
          results.push(item);
        }
      }
    } else {
      for (let i = 0; i < node.children.length; i += 1) {
        stack.push(node.children[i]!);
      }
    }
  }

  results.sort((a, b) => b.zIndex - a.zIndex);
  return results;
}

/**
 * Derives a spatial index from the canonical Document model.
 */
export function buildSpatialIndexFromDocument(
  doc: Document,
  nodeCapacity = SPATIAL_NODE_CAPACITY,
): SpatialIndex {
  const ordered = shapeListInOrder(doc);
  const items: SpatialIndexItem[] = [];
  const absOffsets = new Map<ShapeId, { x: number; y: number }>();

  for (let index = 0; index < ordered.length; index += 1) {
    const shape = ordered[index]!;
    let absX = shape.boundingBox.x;
    let absY = shape.boundingBox.y;
    if (shape.parentId !== ROOT_ID) {
      const parentOffset = absOffsets.get(shape.parentId);
      if (parentOffset !== undefined) {
        absX += parentOffset.x;
        absY += parentOffset.y;
      } else {
        const absBox = absoluteBoundingBox(doc, shape);
        absX = absBox.x;
        absY = absBox.y;
      }
    }
    absOffsets.set(shape.id, { x: absX, y: absY });
    items.push({
      id: shape.id,
      box: { x: absX, y: absY, width: shape.boundingBox.width, height: shape.boundingBox.height },
      zIndex: index,
    });
  }
  return createSpatialIndex(items, nodeCapacity);
}
