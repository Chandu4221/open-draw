// Structured Markdown semantic projection exporter (ADR-0005 D1, D2).
// Pure Document → string projection, zero side effects (R-008, R-016).
// Consumes walkSemanticTree to guarantee 100% hierarchy parity with the canvas (ADR-0004).
// Strictly NO geometry, NO coordinates, NO bounding boxes (ADR-0005 D2).
// Byte-stable by construction: deterministic sort orders, zero timestamps (R-041).
import {
  type DeviceType,
  type ExportOptions,
  type ShapeId,
  DEVICE_TYPES,
  ROOT_ID,
  SEMANTIC_CONFLICTS,
  SHAPE_KINDS,
} from "@open-draw/contracts";
import type { Document, Shape } from "@open-draw/document";
import {
  resolveRootPlatform,
  resolveRootStyle,
  walkSemanticTree,
  type SemanticTreeNode,
} from "@open-draw/semantics";

export interface MarkdownExportOptions extends ExportOptions {
  readonly rootId?: ShapeId;
  readonly deviceType?: DeviceType;
}

/**
 * Safely escapes user-derived strings for structured Markdown export (R-008, R-016).
 * Neutralizes newlines, Markdown formatting syntax, and raw HTML tags.
 */
export function escapeMarkdownText(text: string): string {
  if (text === "") {
    return "";
  }
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([`*_#[\]()<>~|])/g, "\\$1")
    .trim();
}

function formatProperties(properties: Readonly<Record<string, string | number | boolean>>): string {
  const entries = Object.entries(properties);
  if (entries.length === 0) {
    return "";
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const formatted = entries
    .map(([key, value]) => `${escapeMarkdownText(key)}: ${escapeMarkdownText(String(value))}`)
    .join(", ");
  return ` (${formatted})`;
}

function formatHiddenOn(hiddenOn: readonly DeviceType[] | undefined): string {
  if (hiddenOn === undefined || hiddenOn.length === 0) {
    return "";
  }
  const sorted = [...hiddenOn].map((d) => DEVICE_TYPES[d] ?? d).sort((a, b) => a.localeCompare(b));
  return ` _(hidden on ${sorted.join(", ")})_`;
}

function formatConflict(node: SemanticTreeNode): string {
  if (node.conflict?.status !== SEMANTIC_CONFLICTS.conflicted) {
    return "";
  }
  const reason = node.conflict.reason ?? "conflicted semantic tag";
  return ` ⚠️ _[CONFLICT: ${reason}]_`;
}

function formatRootMeta(doc: Document, shape: Shape): string {
  const platform = resolveRootPlatform(doc, shape.id);
  const explicitStyle = shape.meta.style;
  const tags: string[] = [];
  if (platform !== undefined) {
    tags.push(`Platform: ${platform}`);
    const effectiveStyle = explicitStyle ?? resolveRootStyle(doc, shape.id);
    tags.push(`Style: ${effectiveStyle}`);
  } else if (explicitStyle !== undefined) {
    tags.push(`Style: ${explicitStyle}`);
  }
  return tags.length > 0 ? ` (${tags.join(", ")})` : "";
}

function renderNode(doc: Document, node: SemanticTreeNode): string {
  const safeDisplayName = escapeMarkdownText(node.displayName);

  // Depth 0 = immediate child of ROOT_ID (Root shape on canvas)
  if (node.depth === 0) {
    const metaStr = formatRootMeta(doc, node.shape);
    const hiddenStr = formatHiddenOn(node.shape.meta.hiddenOn);
    const conflictStr = formatConflict(node);
    return `## ${safeDisplayName}${metaStr}${hiddenStr}${conflictStr}`;
  }

  // Nested container section
  if (node.shape.kind === SHAPE_KINDS.section) {
    const headingLevel = Math.min(node.depth + 2, 6);
    const hashes = "#".repeat(headingLevel);
    const hiddenStr = formatHiddenOn(node.shape.meta.hiddenOn);
    const conflictStr = formatConflict(node);
    return `${hashes} ${safeDisplayName}${hiddenStr}${conflictStr}`;
  }

  // Leaf content shapes
  const indent = "  ".repeat(Math.max(0, node.depth - 1));
  const semanticTag =
    node.shape.meta.semantic !== undefined ? ` — \`${node.shape.meta.semantic.id}\`` : "";
  const properties =
    node.shape.meta.semantic?.properties !== undefined
      ? formatProperties(node.shape.meta.semantic.properties)
      : "";
  const hiddenStr = formatHiddenOn(node.shape.meta.hiddenOn);
  const conflictStr = formatConflict(node);

  return `${indent}- **${safeDisplayName}**${semanticTag}${properties}${hiddenStr}${conflictStr}`;
}

/**
 * Pure function exporting an OpenDraw document to human-readable, AI-ready Markdown.
 * Deterministic and byte-stable (R-016, R-041).
 */
export function exportMarkdown(doc: Document, options?: MarkdownExportOptions): string {
  const rootId = options?.rootId ?? ROOT_ID;
  const nodes = walkSemanticTree(doc, rootId, undefined, options?.deviceType);

  const lines: string[] = [];
  const includeHeader = options?.includeHeader ?? true;

  if (includeHeader) {
    lines.push("# OpenDraw Document");
    lines.push("");
  }

  if (nodes.length === 0) {
    if (includeHeader) {
      lines.push("*(Empty canvas)*");
      lines.push("");
    }
    return lines.join("\n");
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const line = renderNode(doc, node);

    // Add extra newline before headings for clean Markdown spacing
    if (node.depth === 0) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      lines.push(line);
      lines.push("");
    } else if (node.shape.kind === SHAPE_KINDS.section) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      lines.push(line);
      lines.push("");
    } else {
      lines.push(line);
    }
  }

  // Ensure trailing newline
  if (lines[lines.length - 1] !== "") {
    lines.push("");
  }

  return lines.join("\n");
}
