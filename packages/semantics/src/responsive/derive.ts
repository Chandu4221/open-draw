import type { ShapeId, ShapeRecord, Snapshot } from '@open-draw/schema';

export interface DeriveOptions {
  readonly width: number;
  readonly breakpointThreshold?: number; // default 768px
  readonly padding?: number; // default 16px
  readonly gap?: number; // default 16px
}

export interface DerivedShapeLayout {
  readonly id: ShapeId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isReflowed: boolean;
}

export interface DerivedScene {
  readonly targetWidth: number;
  readonly isStacked: boolean;
  readonly layouts: ReadonlyMap<ShapeId, DerivedShapeLayout>;
  readonly shapes: ReadonlyArray<ShapeRecord>;
  readonly durationMs: number;
}

function getNum(val: unknown, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

/**
 * Pure function that computes responsive layout derivation at a target content width per Phase 3 §3.
 * - Multi-column sections collapse into vertical stacks below the breakpoint threshold.
 * - Translates and reflows nested shapes deterministically.
 * - Canvas never knows this function exists.
 */
export function derive(
  scene: Snapshot,
  options: DeriveOptions
): DerivedScene {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const targetWidth = options.width;
  const threshold = options.breakpointThreshold ?? 768;
  const padding = options.padding ?? 16;
  const gap = options.gap ?? 16;
  const shouldStack = targetWidth < threshold;

  const layouts = new Map<ShapeId, DerivedShapeLayout>();
  const derivedShapes: ShapeRecord[] = [];

  // Group direct children by parentId
  const childrenByParent = new Map<ShapeId, ShapeRecord[]>();
  for (const s of scene.shapes) {
    const parentId = (s.meta?.parent ?? s.meta?.parentId) as string | undefined;
    if (parentId) {
      const list = childrenByParent.get(parentId) ?? [];
      list.push(s);
      childrenByParent.set(parentId, list);
    }
  }

  // Identify container sections or pages
  for (const shape of scene.shapes) {
    const parentId = (shape.meta?.parent ?? shape.meta?.parentId) as string | undefined;
    if (parentId) continue; // child shapes handled through parent reflow

    const origW = getNum(shape.props.width, 1200);
    const origH = getNum(shape.props.height, 800);
    const containerW = Math.min(origW, targetWidth);

    layouts.set(shape.id, {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: containerW,
      height: origH,
      isReflowed: containerW !== origW,
    });

    derivedShapes.push({
      ...shape,
      props: { ...shape.props, width: containerW, height: origH },
    });

    // Process section's immediate children (e.g. columns, cards)
    const directChildren = childrenByParent.get(shape.id) ?? [];
    if (directChildren.length === 0) continue;

    // Check if direct children are side-by-side columns that should stack
    const areColumns = directChildren.some((c) => {
      const sem = (c.meta.semantic ?? {}) as Record<string, unknown>;
      return sem.type === 'column' || sem.type === 'card';
    });

    if (shouldStack && areColumns && directChildren.length > 1) {
      // Sort in reading order (left to right, top to bottom)
      const sortedChildren = [...directChildren].sort((a, b) => a.y - b.y || a.x - b.x);
      let currentY = shape.y + padding;
      const contentWidth = Math.max(100, containerW - padding * 2);

      for (const child of sortedChildren) {
        const origChildH = getNum(child.props.height, 200);
        const deltaX = (shape.x + padding) - child.x;
        const deltaY = currentY - child.y;

        layouts.set(child.id, {
          id: child.id,
          x: shape.x + padding,
          y: currentY,
          width: contentWidth,
          height: origChildH,
          isReflowed: true,
        });

        derivedShapes.push({
          ...child,
          x: shape.x + padding,
          y: currentY,
          props: { ...child.props, width: contentWidth, height: origChildH },
        });

        // Reflow nested descendants of this child
        const descendants = childrenByParent.get(child.id) ?? [];
        for (const desc of descendants) {
          const descW = getNum(desc.props.width, 100);
          const descH = getNum(desc.props.height, 40);
          layouts.set(desc.id, {
            id: desc.id,
            x: desc.x + deltaX,
            y: desc.y + deltaY,
            width: Math.min(descW, contentWidth),
            height: descH,
            isReflowed: true,
          });

          derivedShapes.push({
            ...desc,
            x: desc.x + deltaX,
            y: desc.y + deltaY,
            props: { ...desc.props, width: Math.min(descW, contentWidth) },
          });
        }

        currentY += origChildH + gap;
      }
    } else {
      // Unstacked desktop pass: keep original relative offsets
      for (const child of directChildren) {
        const w = getNum(child.props.width, 200);
        const h = getNum(child.props.height, 100);
        layouts.set(child.id, {
          id: child.id,
          x: child.x,
          y: child.y,
          width: w,
          height: h,
          isReflowed: false,
        });
        derivedShapes.push(child);

        const descendants = childrenByParent.get(child.id) ?? [];
        for (const desc of descendants) {
          const dw = getNum(desc.props.width, 100);
          const dh = getNum(desc.props.height, 40);
          layouts.set(desc.id, {
            id: desc.id,
            x: desc.x,
            y: desc.y,
            width: dw,
            height: dh,
            isReflowed: false,
          });
          derivedShapes.push(desc);
        }
      }
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return {
    targetWidth,
    isStacked: shouldStack,
    layouts,
    shapes: Object.freeze(derivedShapes),
    durationMs: Math.max(0.01, endTime - startTime),
  };
}
