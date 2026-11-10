// Pure spatial snap solver and alignment guide calculations (R-002, R-005, R-008, R-010, ADR-0011).
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { type Document, subtreeOf } from "@open-draw/document";
import type { HandleId } from "./handles";
import { HANDLES } from "./handles";
import { resizeBox } from "./geometry";
import { querySpatialIndexBox, type SpatialIndex } from "./spatial/spatial-index";

export const SNAP_AXES = {
  x: "x",
  y: "y",
} as const;
export type SnapAxis = (typeof SNAP_AXES)[keyof typeof SNAP_AXES];

export const SNAP_EDGES = {
  start: "start",
  center: "center",
  end: "end",
} as const;
export type SnapEdge = (typeof SNAP_EDGES)[keyof typeof SNAP_EDGES];

export const DEFAULT_SNAP_THRESHOLD_PX = 5;

export interface SnapTarget {
  readonly id?: ShapeId | undefined;
  readonly box: BoundingBox;
}

export interface SnapGuide {
  readonly axis: SnapAxis;
  readonly coordinate: number;
  readonly start: number;
  readonly end: number;
}

export interface SnapResult {
  readonly snappedBox: BoundingBox;
  readonly dx: number;
  readonly dy: number;
  readonly guides: readonly SnapGuide[];
}

export interface SnapOptions {
  readonly thresholdPx?: number | undefined;
  readonly zoom?: number | undefined;
  readonly excludeIds?: ReadonlySet<ShapeId> | undefined;
  readonly disabled?: boolean | undefined;
}

export interface SnapEdgeConstraints {
  readonly x?: readonly SnapEdge[] | undefined;
  readonly y?: readonly SnapEdge[] | undefined;
}

export const ALL_SNAP_EDGES: readonly SnapEdge[] = [
  SNAP_EDGES.start,
  SNAP_EDGES.center,
  SNAP_EDGES.end,
];

export const HANDLE_SNAP_EDGES: Record<HandleId, SnapEdgeConstraints> = {
  [HANDLES.nw]: { x: [SNAP_EDGES.start], y: [SNAP_EDGES.start] },
  [HANDLES.n]: { y: [SNAP_EDGES.start] },
  [HANDLES.ne]: { x: [SNAP_EDGES.end], y: [SNAP_EDGES.start] },
  [HANDLES.e]: { x: [SNAP_EDGES.end] },
  [HANDLES.se]: { x: [SNAP_EDGES.end], y: [SNAP_EDGES.end] },
  [HANDLES.s]: { y: [SNAP_EDGES.end] },
  [HANDLES.sw]: { x: [SNAP_EDGES.start], y: [SNAP_EDGES.end] },
  [HANDLES.w]: { x: [SNAP_EDGES.start] },
};

function getBoxCoord(box: BoundingBox, edge: SnapEdge, axis: SnapAxis): number {
  const isX = axis === SNAP_AXES.x;
  const pos = isX ? box.x : box.y;
  const size = isX ? box.width : box.height;
  return edge === SNAP_EDGES.start ? pos : edge === SNAP_EDGES.center ? pos + size / 2 : pos + size;
}

interface AxisSnapMatch {
  readonly diff: number;
  readonly coordinate: number;
  readonly targetBoxes: readonly BoundingBox[];
}

function solveAxisSnap(
  candidateBox: BoundingBox,
  axis: SnapAxis,
  allowedCandidateEdges: readonly SnapEdge[],
  targets: readonly SnapTarget[],
  thresholdWorld: number,
  excludeIds?: ReadonlySet<ShapeId> | undefined,
): AxisSnapMatch | null {
  if (allowedCandidateEdges.length === 0 || targets.length === 0) return null;

  let minAbsDiff = Infinity;
  let bestDiff = 0;
  let bestTargetCoord = 0;
  let bestTargetBoxes: BoundingBox[] = [];

  for (const target of targets) {
    if (target.id !== undefined && excludeIds?.has(target.id)) continue;

    for (const candEdge of allowedCandidateEdges) {
      const candVal = getBoxCoord(candidateBox, candEdge, axis);

      for (const targetEdge of ALL_SNAP_EDGES) {
        const targetVal = getBoxCoord(target.box, targetEdge, axis);
        const diff = targetVal - candVal;
        const absDiff = Math.abs(diff);

        if (absDiff <= thresholdWorld) {
          if (absDiff < minAbsDiff - 1e-6) {
            minAbsDiff = absDiff;
            bestDiff = diff;
            bestTargetCoord = targetVal;
            bestTargetBoxes = [target.box];
          } else if (
            Math.abs(absDiff - minAbsDiff) <= 1e-6 &&
            Math.abs(targetVal - bestTargetCoord) <= 1e-6
          ) {
            bestTargetBoxes.push(target.box);
          }
        }
      }
    }
  }

  if (bestTargetBoxes.length === 0) return null;

  return { diff: bestDiff, coordinate: bestTargetCoord, targetBoxes: bestTargetBoxes };
}

function createAxisGuide(
  axis: SnapAxis,
  match: AxisSnapMatch,
  candStart: number,
  candSize: number,
): SnapGuide {
  let min = candStart;
  let max = candStart + candSize;
  for (const b of match.targetBoxes) {
    const isX = axis === SNAP_AXES.x;
    const pos = isX ? b.y : b.x;
    const size = isX ? b.height : b.width;
    min = Math.min(min, pos);
    max = Math.max(max, pos + size);
  }
  return { axis, coordinate: match.coordinate, start: min, end: max };
}

export function computeSnap(
  candidateBox: BoundingBox,
  targets: readonly SnapTarget[],
  options?: SnapOptions | undefined,
  constraints?: SnapEdgeConstraints | undefined,
): SnapResult {
  if (options?.disabled || targets.length === 0) {
    return { snappedBox: candidateBox, dx: 0, dy: 0, guides: [] };
  }

  const zoom = options?.zoom && options.zoom > 0 ? options.zoom : 1;
  const thresholdPx = options?.thresholdPx ?? DEFAULT_SNAP_THRESHOLD_PX;
  const thresholdWorld = thresholdPx / zoom;

  const allowedX = constraints?.x ?? ALL_SNAP_EDGES;
  const allowedY = constraints?.y ?? ALL_SNAP_EDGES;

  const matchX = solveAxisSnap(
    candidateBox,
    SNAP_AXES.x,
    allowedX,
    targets,
    thresholdWorld,
    options?.excludeIds,
  );
  const matchY = solveAxisSnap(
    candidateBox,
    SNAP_AXES.y,
    allowedY,
    targets,
    thresholdWorld,
    options?.excludeIds,
  );

  const dx = matchX !== null ? matchX.diff : 0;
  const dy = matchY !== null ? matchY.diff : 0;
  const guides: SnapGuide[] = [];

  if (matchX !== null) {
    guides.push(createAxisGuide(SNAP_AXES.x, matchX, candidateBox.y + dy, candidateBox.height));
  }
  if (matchY !== null) {
    guides.push(createAxisGuide(SNAP_AXES.y, matchY, candidateBox.x + dx, candidateBox.width));
  }

  return {
    snappedBox: {
      x: candidateBox.x + dx,
      y: candidateBox.y + dy,
      width: candidateBox.width,
      height: candidateBox.height,
    },
    dx,
    dy,
    guides,
  };
}

export function computeHandleSnap(
  candidateBox: BoundingBox,
  handle: HandleId,
  targets: readonly SnapTarget[],
  options?: SnapOptions | undefined,
): SnapResult {
  const constraints = HANDLE_SNAP_EDGES[handle];
  return computeSnap(candidateBox, targets, options, constraints);
}

export interface PointerSnapContext {
  readonly mode: "move" | "resize" | "draw";
  readonly rawWorld: Point;
  readonly originalBox: BoundingBox | null;
  readonly startWorld: Point;
  readonly handleId: HandleId | null;
  readonly movingShapeIds: readonly ShapeId[];
  readonly doc: Document;
  readonly spatialIndex: SpatialIndex;
  readonly viewportBox: BoundingBox;
  readonly zoom: number;
  readonly disabled?: boolean | undefined;
  readonly thresholdPx?: number | undefined;
}

export function resolvePointerSnap(ctx: PointerSnapContext): {
  readonly snappedWorld: Point;
  readonly guides: readonly SnapGuide[];
} {
  if (ctx.disabled) {
    return { snappedWorld: ctx.rawWorld, guides: [] };
  }

  const excludeIds = new Set<ShapeId>(ctx.movingShapeIds);
  for (const id of ctx.movingShapeIds) {
    for (const s of subtreeOf(ctx.doc, id)) {
      excludeIds.add(s.id);
    }
  }

  const targets = querySpatialIndexBox(ctx.spatialIndex, ctx.viewportBox);
  const snapOpts: SnapOptions = {
    thresholdPx: ctx.thresholdPx,
    zoom: ctx.zoom,
    excludeIds,
  };

  if (ctx.mode === "move" && ctx.originalBox !== null) {
    const dx = ctx.rawWorld.x - ctx.startWorld.x;
    const dy = ctx.rawWorld.y - ctx.startWorld.y;
    const candidateBox: BoundingBox = {
      x: ctx.originalBox.x + dx,
      y: ctx.originalBox.y + dy,
      width: ctx.originalBox.width,
      height: ctx.originalBox.height,
    };
    const res = computeSnap(candidateBox, targets, snapOpts);
    return {
      snappedWorld: { x: ctx.rawWorld.x + res.dx, y: ctx.rawWorld.y + res.dy },
      guides: res.guides,
    };
  }

  if (ctx.mode === "resize" && ctx.originalBox !== null && ctx.handleId !== null) {
    const candidateBox = resizeBox(ctx.originalBox, ctx.handleId, ctx.rawWorld);
    const res = computeHandleSnap(candidateBox, ctx.handleId, targets, snapOpts);
    return {
      snappedWorld: { x: ctx.rawWorld.x + res.dx, y: ctx.rawWorld.y + res.dy },
      guides: res.guides,
    };
  }

  if (ctx.mode === "draw") {
    const candidateBox: BoundingBox = {
      x: ctx.rawWorld.x,
      y: ctx.rawWorld.y,
      width: 0,
      height: 0,
    };
    const res = computeSnap(candidateBox, targets, snapOpts, {
      x: [SNAP_EDGES.start],
      y: [SNAP_EDGES.start],
    });
    return {
      snappedWorld: { x: ctx.rawWorld.x + res.dx, y: ctx.rawWorld.y + res.dy },
      guides: res.guides,
    };
  }

  return { snappedWorld: ctx.rawWorld, guides: [] };
}

export function snapGuidesToSvg(guides: readonly SnapGuide[], zoom: number): string {
  if (guides.length === 0) return "";
  const effectiveZoom = zoom > 0 ? zoom : 1;
  const strokeWidth = (1 / effectiveZoom).toFixed(2);
  const dashArray = `${(3 / effectiveZoom).toFixed(2)} ${(3 / effectiveZoom).toFixed(2)}`;

  return guides
    .map((g) => {
      if (g.axis === SNAP_AXES.x) {
        return `<line x1="${g.coordinate}" y1="${g.start}" x2="${g.coordinate}" y2="${g.end}" stroke="var(--od-snap-guide, #ff007a)" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" />`;
      }
      return `<line x1="${g.start}" y1="${g.coordinate}" x2="${g.end}" y2="${g.coordinate}" stroke="var(--od-snap-guide, #ff007a)" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" />`;
    })
    .join("");
}
