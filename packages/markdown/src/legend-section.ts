import type { ShapeRecord } from '@open-draw/schema';

function getShapeBounds(shape: ShapeRecord): { x: number; y: number; width: number; height: number } {
  const x = Math.round(shape.x);
  const y = Math.round(shape.y);
  const width = Math.round(Number(shape.props['width']) || 0);
  const height = Math.round(Number(shape.props['height']) || 0);
  return { x, y, width, height };
}

function getSemanticMeta(shape: ShapeRecord): { rawType?: string; type: string; name: string; isUntagged: boolean } {
  const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
  const rawType = typeof semantic.type === 'string' && semantic.type.trim() ? semantic.type.trim() : undefined;
  const name = (semantic.name as string) || '';
  const isUntagged = !rawType;
  const type = rawType || shape.type;
  return { rawType, type, name, isUntagged };
}

export function renderLegendSection(shapes: readonly ShapeRecord[]): string[] {
  const lines: string[] = [];
  if (shapes.length === 0) return lines;

  const shapeIdSet = new Set(shapes.map((s) => s.id));

  lines.push('## Element Legend');
  lines.push('');
  lines.push('| ID | Type | Name | Parent | Bounds |');
  lines.push('| :--- | :--- | :--- | :--- | :--- |');

  const sortedById = [...shapes].sort((a, b) => a.id.localeCompare(b.id));
  for (const s of sortedById) {
    const { type, name, isUntagged } = getSemanticMeta(s);
    const bounds = getShapeBounds(s);
    const parentId = (s.meta?.parent ?? s.meta?.parentId) as string | undefined;
    const parentRef = parentId && shapeIdSet.has(parentId) ? `f(${parentId})` : '—';
    const nameCell = name ? `\`${name}\`` : '—';
    const typeCell = isUntagged ? `${s.type} *untagged*` : `\`${type}\``;
    lines.push(`| f(${s.id}) | ${typeCell} | ${nameCell} | ${parentRef} | ${bounds.width}×${bounds.height} at ${bounds.x},${bounds.y} |`);
  }
  lines.push('');

  return lines;
}
