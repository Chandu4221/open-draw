import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { derive } from '@open-draw/semantics';
import type { PlatformProfile } from '@open-draw/semantics';

interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function getOriginalBounds(s: ShapeRecord): Bounds {
  const x = Math.round(s.x);
  const y = Math.round(s.y);
  const width = Math.round(Number(s.props['width']) || 0);
  const height = Math.round(Number(s.props['height']) || 0);
  return { x, y, width, height };
}

/**
 * Pure projection of responsive layout derivation from derive() into markdown.
 * Deterministic and fixture-pinned per Phase 5 §6.1.4.
 */
export function renderResponsiveSection(
  snapshot: Snapshot,
  platform: PlatformProfile | undefined,
  shapes: readonly ShapeRecord[]
): string[] {
  if (shapes.length === 0) return [];

  const lines: string[] = [];
  lines.push('## Responsive Behavior');
  lines.push('');

  const breakpoints = platform?.breakpoints && platform.breakpoints.length > 0
    ? platform.breakpoints
    : [{ id: 'mobile', label: 'Mobile (< 768px)', width: 580 }];

  const shapeMap = new Map<string, ShapeRecord>();
  for (const s of shapes) shapeMap.set(s.id, s);

  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

  for (const bp of breakpoints) {
    lines.push(`### Breakpoint: ${bp.label} (${bp.width}px)`);
    lines.push('');

    const derived = derive(snapshot, { width: bp.width });
    const reflowedLines: string[] = [];

    for (const s of sortedShapes) {
      const layout = derived.layouts.get(s.id);
      if (layout && layout.isReflowed) {
        const orig = getOriginalBounds(s);
        const semantic = (s.meta?.semantic ?? {}) as Record<string, unknown>;
        const type = (semantic.type as string) || `untagged:${s.type}`;

        const isVerticallyStacked = Math.abs(layout.y - orig.y) > 20 && Math.abs(layout.x - orig.x) > 0;
        const verb = isVerticallyStacked ? 'stacks vertically' : 'reflows';

        reflowedLines.push(`- **[${type}]** f(${s.id}) ${verb} (${layout.width}×${layout.height} at ${layout.x},${layout.y})`);
      }
    }

    if (reflowedLines.length > 0) {
      for (const line of reflowedLines) {
        lines.push(line);
      }
    } else {
      lines.push('*Natural layout flow preserved — no element reflows required.*');
    }
    lines.push('');
  }

  return lines;
}
