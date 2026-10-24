import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { getPlatformProfile, getStyleProfile, SEMANTIC_TYPES } from '@open-draw/semantics';
import { renderResponsiveSection } from './responsive-section.js';

export interface CompileOptions {
  readonly title?: string;
  readonly legend?: boolean;
  readonly designDirection?: boolean;
  readonly responsive?: boolean;
  readonly directive?: 'strict-fidelity' | 'creative-allowed';
  readonly scope?: 'auto' | 'component' | 'page';
  readonly platform?: string;
}

function getShapeBounds(shape: ShapeRecord): { x: number; y: number; width: number; height: number } {
  const x = Math.round(shape.x);
  const y = Math.round(shape.y);
  const width = Math.round(Number(shape.props['width']) || 0);
  const height = Math.round(Number(shape.props['height']) || 0);
  return { x, y, width, height };
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
  const shapes: readonly ShapeRecord[] = Array.isArray(scene)
    ? (scene as readonly ShapeRecord[])
    : scene && typeof scene === 'object' && Array.isArray((scene as Snapshot).shapes)
      ? (scene as Snapshot).shapes
      : [];

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
  const hasPageRoot = shapes.some(s => {
    const meta = getSemanticMeta(s);
    return meta.type === 'page' && !(s.meta?.parent || s.meta?.parentId);
  });
  const resolvedScope = options.scope && options.scope !== 'auto'
    ? options.scope
    : (hasPageRoot ? 'page' : 'component');

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
  const untaggedShapes = shapes.filter(s => getSemanticMeta(s).isUntagged);
  if (untaggedShapes.length > 0) {
    const untaggedList = [...untaggedShapes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(s => `f(${s.id})`)
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
    lines.push('## Design Direction');
    lines.push('');
    lines.push(`- **Target Platform:** \`${platformKey}\``);
    lines.push(`- **Visual Style:** \`${styleKey}\``);
    lines.push('');

    const style = getStyleProfile(styleKey);
    if (style) {
      if (style.notes) {
        lines.push(`> **Style Guidance:** ${style.notes}`);
        lines.push('');
      }

      lines.push('### Style Tokens');
      lines.push('');
      lines.push('| Category | Token | Value |');
      lines.push('| :--- | :--- | :--- |');

      if (style.palette) {
        for (const [k, v] of Object.entries(style.palette).sort(([a], [b]) => a.localeCompare(b))) {
          lines.push(`| Palette | \`${k}\` | \`${v}\` |`);
        }
      }

      if (style.borders) {
        lines.push(`| Borders | \`width\` | \`${style.borders.width}px\` |`);
        lines.push(`| Borders | \`radius\` | \`${style.borders.radius}px\` |`);
        lines.push(`| Borders | \`style\` | \`${style.borders.style}\` |`);
      }

      if (style.shadows) {
        lines.push(`| Shadows | \`offset\` | \`${style.shadows.x}px ${style.shadows.y}px\` |`);
        lines.push(`| Shadows | \`blur\` | \`${style.shadows.blur}px\` |`);
        lines.push(`| Shadows | \`color\` | \`${style.shadows.color}\` |`);
      }

      if (style.typography) {
        lines.push(`| Typography | \`headingFont\` | \`${style.typography.headingFont}\` |`);
        lines.push(`| Typography | \`bodyFont\` | \`${style.typography.bodyFont}\` |`);
        lines.push(`| Typography | \`baseSize\` | \`${style.typography.baseSize}px\` |`);
      }
      lines.push('');
    }

    const platform = getPlatformProfile(platformKey);
    if (platform && platform.mappings) {
      lines.push('### Platform Component Mappings');
      lines.push('');

      // Filter mappings strictly to semantic types present in scene per Phase 5 §6.1.1
      const sceneSemanticTypes = new Set<string>();
      for (const s of shapes) {
        const { rawType } = getSemanticMeta(s);
        if (rawType && platform.mappings[rawType]) {
          sceneSemanticTypes.add(rawType);
        }
      }

      if (sceneSemanticTypes.size > 0) {
        lines.push('| Semantic Type | Platform Component | Container | Default Role | Notes |');
        lines.push('| :--- | :--- | :--- | :--- | :--- |');
        for (const typeId of [...sceneSemanticTypes].sort((a, b) => a.localeCompare(b))) {
          const comp = platform.mappings[typeId];
          if (!comp) continue;
          const def = SEMANTIC_TYPES[typeId];
          const container = comp.containerType ? `\`${comp.containerType}\`` : '—';
          const notes = comp.notes ? comp.notes : '—';
          lines.push(`| \`${typeId}\` | \`<${comp.componentName} />\` | ${container} | \`${def?.defaultRole || 'none'}\` | ${notes} |`);
        }
      } else {
        lines.push('*No mapped semantic components present in scene.*');
      }
      lines.push('');
    }
  }

  // Section 4: Element Legend (Single canonical home for Bounds & Name per Phase 5 §6.1.2)
  if (options.legend && shapes.length > 0) {
    lines.push('## Element Legend');
    lines.push('');
    lines.push('| ID | Type | Name | Parent | Bounds |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');

    const sortedById = [...shapes].sort((a, b) => a.id.localeCompare(b.id));
    for (const s of sortedById) {
      const { type, name, isUntagged } = getSemanticMeta(s);
      const bounds = getShapeBounds(s);
      const parentId = (s.meta?.parent ?? s.meta?.parentId) as string | undefined;
      const parentRef = parentId ? `f(${parentId})` : '—';
      const nameCell = name ? `\`${name}\`` : '—';
      const typeCell = isUntagged ? `${s.type} *untagged*` : `\`${type}\``;
      lines.push(`| f(${s.id}) | ${typeCell} | ${nameCell} | ${parentRef} | ${bounds.width}×${bounds.height} at ${bounds.x},${bounds.y} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
