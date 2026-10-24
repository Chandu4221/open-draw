import type { ShapeRecord } from '@open-draw/schema';
import { getPlatformProfile, getStyleProfile, SEMANTIC_TYPES } from '@open-draw/semantics';

function getSemanticMeta(shape: ShapeRecord): { rawType?: string; type: string; name: string; isUntagged: boolean } {
  const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
  const rawType = typeof semantic.type === 'string' && semantic.type.trim() ? semantic.type.trim() : undefined;
  const name = (semantic.name as string) || '';
  const isUntagged = !rawType;
  const type = rawType || shape.type;
  return { rawType, type, name, isUntagged };
}

export function renderDesignDirectionSection(
  platformKey: string,
  styleKey: string,
  shapes: readonly ShapeRecord[]
): string[] {
  const lines: string[] = [];
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

  return lines;
}
