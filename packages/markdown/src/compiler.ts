import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { getPlatformProfile, getStyleProfile, SEMANTIC_TYPES } from '@open-draw/semantics';

export interface CompileOptions {
  readonly title?: string;
  readonly legend?: boolean;
  readonly designDirection?: boolean;
  readonly platform?: string;
}

function getShapeBounds(shape: ShapeRecord): { x: number; y: number; width: number; height: number } {
  const x = Math.round(shape.x);
  const y = Math.round(shape.y);
  const width = Math.round(Number(shape.props['width']) || 0);
  const height = Math.round(Number(shape.props['height']) || 0);
  return { x, y, width, height };
}

function getSemanticMeta(shape: ShapeRecord): { type: string; name: string } {
  const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
  const type = (semantic.type as string) || shape.type;
  const name = (semantic.name as string) || '';
  return { type, name };
}

/**
 * Compiles an OpenDraw scene into a byte-stable, deterministic markdown specification.
 */
export function compile(scene: Snapshot | readonly ShapeRecord[] | unknown, options: CompileOptions = {}): string {
  const shapes: readonly ShapeRecord[] = Array.isArray(scene)
    ? (scene as readonly ShapeRecord[])
    : scene && typeof scene === 'object' && Array.isArray((scene as Snapshot).shapes)
      ? (scene as Snapshot).shapes
      : [];

  const title = options.title || 'OpenDraw Specification';
  const lines: string[] = [];

  // Header & Format Identifier
  lines.push(`# ${title}`);
  lines.push('');
  lines.push('<!-- open-draw-spec:v1 -->');
  lines.push('');

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

  // Section 1: Screen Structure
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

      const { type, name } = getSemanticMeta(s);
      const bounds = getShapeBounds(s);
      const indent = '  '.repeat(depth);
      const textProp = typeof s.props['text'] === 'string' ? ` text: "${s.props['text'].replace(/"/g, '\\"')}"` : '';
      const namePart = name ? ` "${name}"` : '';

      lines.push(`${indent}- **[${type}]** f(${s.id})${namePart} (${bounds.width}×${bounds.height} at ${bounds.x},${bounds.y})${textProp}`);

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

    // Cycle fallback: any shapes not visited through roots
    if (visited.size < shapes.length) {
      for (const s of sortShapes([...shapes])) {
        if (!visited.has(s.id)) {
          renderNode(s, 0);
        }
      }
    }

    lines.push('');
  }

  // Section 2: Design Direction (if requested)
  if (options.designDirection) {
    lines.push('## Design Direction');
    lines.push('');
    lines.push(`- **Target Platform:** \`${platformKey}\``);
    lines.push(`- **Visual Style:** \`${styleKey}\``);
    lines.push('');

    const style = getStyleProfile(styleKey);
    if (style) {
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
      lines.push('| Semantic Type | Platform Component | Container | Default Role | Notes |');
      lines.push('| :--- | :--- | :--- | :--- | :--- |');
      for (const [typeId, comp] of Object.entries(platform.mappings).sort(([a], [b]) => a.localeCompare(b))) {
        const def = SEMANTIC_TYPES[typeId];
        const container = comp.containerType ? `\`${comp.containerType}\`` : '—';
        const notes = comp.notes ? comp.notes : '—';
        lines.push(`| \`${typeId}\` | \`<${comp.componentName} />\` | ${container} | \`${def?.defaultRole || 'none'}\` | ${notes} |`);
      }
      lines.push('');
    }
  }

  // Section 3: Element Legend (if requested)
  if (options.legend) {
    lines.push('## Element Legend');
    lines.push('');
    lines.push('| ID | Type | Name | Parent | Bounds |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');

    const sortedById = [...shapes].sort((a, b) => a.id.localeCompare(b.id));
    for (const s of sortedById) {
      const { type, name } = getSemanticMeta(s);
      const bounds = getShapeBounds(s);
      const parentId = (s.meta?.parent ?? s.meta?.parentId) as string | undefined;
      const parentRef = parentId ? `f(${parentId})` : '—';
      const nameCell = name ? `\`${name}\`` : '—';
      lines.push(`| f(${s.id}) | \`${type}\` | ${nameCell} | ${parentRef} | ${bounds.width}×${bounds.height} at ${bounds.x},${bounds.y} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
