import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { getPlatformProfile } from '@open-draw/semantics';
import { renderResponsiveSection } from './responsive-section.js';
import { renderDesignDirectionSection } from './design-direction-section.js';
import { renderLegendSection } from './legend-section.js';

export interface CompileOptions {
  readonly title?: string;
  readonly legend?: boolean;
  readonly designDirection?: boolean;
  readonly responsive?: boolean;
  readonly directive?: 'strict-fidelity' | 'creative-allowed';
  readonly scope?: 'auto' | 'component' | 'page';
  readonly platform?: string;
  readonly shapeIds?: readonly string[];
}

interface SemanticMeta {
  readonly rawType?: string;
  readonly type: string;
  readonly name: string;
  readonly isUntagged: boolean;
}

function getSemanticMeta(shape: ShapeRecord): SemanticMeta {
  const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
  const rawType = typeof semantic.type === 'string' && semantic.type.trim() ? semantic.type.trim() : undefined;
  const name = (semantic.name as string) || '';
  const isUntagged = !rawType;
  const type = rawType || shape.type;
  return { rawType, type, name, isUntagged };
}

/**
 * Compiles an OpenDraw scene into a byte-stable, deterministic markdown specification (Format v1.1).
 */
export function compile(scene: Snapshot | readonly ShapeRecord[] | unknown, options: CompileOptions = {}): string {
  const allShapes: readonly ShapeRecord[] = Array.isArray(scene)
    ? (scene as readonly ShapeRecord[])
    : scene && typeof scene === 'object' && Array.isArray((scene as Snapshot).shapes)
      ? (scene as Snapshot).shapes
      : [];

  const shapeIdSet = options.shapeIds ? new Set(options.shapeIds) : null;
  const shapes: readonly ShapeRecord[] = shapeIdSet
    ? allShapes.filter((s) => shapeIdSet.has(s.id))
    : allShapes;

  const title = options.title || 'OpenDraw Specification';
  const lines: string[] = [];

  // Header & Format Identifier v1.1 per Phase 5 §6.1.8
  lines.push(`# ${title}`);
  lines.push('');
  lines.push('<!-- open-draw-spec:v1.1 -->');
  lines.push('');

  // Consumption Directives per Phase 5 §6.1.6
  const directive = options.directive ?? 'strict-fidelity';
  if (directive === 'creative-allowed') {
    lines.push('> **Consumption Directive: creative-allowed**');
    lines.push('> Preserve every f(id) identity, semantic type, role, and structure exactly. Styling and additive content extension are permitted within the Design Direction.');
  } else {
    lines.push('> **Consumption Directive: strict-fidelity**');
    lines.push('> Build EXACTLY the elements specified. Do not add, remove, or restyle beyond the Design Direction. Do not invent unspecified content.');
  }
  lines.push('');

  // Scope Declaration (Scope: component vs Scope: page)
  let resolvedScope = options.scope;
  if (!resolvedScope || resolvedScope === 'auto') {
    if (shapeIdSet) {
      const containsPage = shapes.some((s) => getSemanticMeta(s).type === 'page');
      resolvedScope = containsPage ? 'page' : 'component';
    } else {
      const hasPageRoot = shapes.some((s) => {
        const meta = getSemanticMeta(s);
        return meta.type === 'page' && !(s.meta?.parent || s.meta?.parentId);
      });
      resolvedScope = hasPageRoot ? 'page' : 'component';
    }
  }

  if (resolvedScope === 'page') {
    lines.push('> **Scope: page** — this scene contains a `page`-typed root; build a complete page.');
  } else {
    lines.push('> **Scope: component** — This spec describes a standalone component, not a page.');
    lines.push('> Deliver only the component itself. No page chrome, no header/navigation,');
    lines.push("> no document-level styling beyond this component's tokens.");
  }
  lines.push('');

  // Bounds Semantics Declaration per Phase 5 §6.1.3
  lines.push('> **Bounds semantics:** Bounds are content-size in scene coordinate space. Absolute positions are spatial suggestions, not layout mandates; consuming agents adapt to target platform layout systems.');
  lines.push('');

  // Untagged Elements Warning per Phase 5 §6.1.5 (Q-008)
  const untaggedShapes = shapes.filter((s) => getSemanticMeta(s).isUntagged);
  if (untaggedShapes.length > 0) {
    const untaggedList = [...untaggedShapes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => `f(${s.id})`)
      .join(', ');
    lines.push(`> ⚠ **Untagged Elements:** Shapes ${untaggedList} have no semantic type. Assign semantic types in OpenDraw Studio before final handoff.`);
    lines.push('');
  }

  // Extract scene meta
  const sceneMeta = (!Array.isArray(scene) && scene && typeof scene === 'object')
    ? ((scene as Snapshot).meta ?? {})
    : {};
  const platformKey = options.platform || (sceneMeta.platform as string) || 'web';
  const styleKey = (sceneMeta.style as string) || 'neubrutalism';

  // Build hierarchy
  const shapeMap = new Map<string, ShapeRecord>();
  for (const s of shapes) shapeMap.set(s.id, s);

  const childrenByParent = new Map<string, ShapeRecord[]>();
  const rootShapes: ShapeRecord[] = [];

  for (const s of shapes) {
    const parentId = (s.meta?.parent ?? s.meta?.parentId) as string | undefined;
    if (parentId && shapeMap.has(parentId)) {
      const list = childrenByParent.get(parentId) ?? [];
      list.push(s);
      childrenByParent.set(parentId, list);
    } else {
      rootShapes.push(s);
    }
  }

  // Deterministic sorting (top-to-bottom, left-to-right, then ID)
  const sortShapes = (list: ShapeRecord[]): ShapeRecord[] =>
    [...list].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

  const sortedRoots = sortShapes(rootShapes);

  // Section 1: Screen Structure (Pure tree + content per Phase 5 §6.1.2)
  lines.push('## Screen Structure');
  lines.push('');

  if (shapes.length === 0) {
    lines.push('*Empty canvas — no shapes present.*');
    lines.push('');
  } else {
    const visited = new Set<string>();
    const renderNode = (s: ShapeRecord, depth: number): void => {
      if (visited.has(s.id)) return;
      visited.add(s.id);

      const { type, isUntagged } = getSemanticMeta(s);
      const indent = '  '.repeat(depth);
      const textProp = typeof s.props['text'] === 'string' && s.props['text']
        ? ` text: "${s.props['text'].replace(/"/g, '\\"')}"`
        : '';
      const typeBadge = isUntagged ? `untagged:${s.type}` : type;

      lines.push(`${indent}- **[${typeBadge}]** f(${s.id})${textProp}`);

      const children = childrenByParent.get(s.id);
      if (children && children.length > 0) {
        for (const child of sortShapes(children)) {
          renderNode(child, depth + 1);
        }
      }
    };

    for (const root of sortedRoots) {
      renderNode(root, 0);
    }

    if (visited.size < shapes.length) {
      for (const s of sortShapes([...shapes])) {
        if (!visited.has(s.id)) {
          renderNode(s, 0);
        }
      }
    }

    lines.push('');
  }

  // Section 2: Responsive Behavior per Phase 5 §6.1.4 (on by default)
  if (options.responsive !== false && shapes.length > 0) {
    const snapshot: Snapshot = {
      version: 1,
      shapes: [...shapes],
      meta: sceneMeta,
    };
    const platform = getPlatformProfile(platformKey);
    const respLines = renderResponsiveSection(snapshot, platform, shapes);
    for (const l of respLines) lines.push(l);
  }

  // Section 3: Design Direction (if requested)
  if (options.designDirection) {
    const dirLines = renderDesignDirectionSection(platformKey, styleKey, shapes);
    for (const l of dirLines) lines.push(l);
  }

  // Section 4: Element Legend (Single canonical home for Bounds & Name per Phase 5 §6.1.2)
  if (options.legend && shapes.length > 0) {
    const legLines = renderLegendSection(shapes);
    for (const l of legLines) lines.push(l);
  }

  return lines.join('\n');
}
