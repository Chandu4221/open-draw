// Pure tree row and on-demand legend formatting (Milestone 11A B1-B3, B5).
// Pure Document -> string projections, zero side effects (R-008, R-016).
// Formats exact parent-relative bounding boxes and chip IDs (R-025, R-041, R-042).
import { type BoundingBox, type DeviceType, DEVICE_TYPES } from "@open-draw/canvas";
import type { Shape } from "@open-draw/canvas";
import { SEMANTIC_CONFLICTS, type SemanticTreeNode } from "@open-draw/semantics";
import { formatChipId } from "./chip-id";
import { escapeMarkdownText } from "./escape-markdown";

function assertFinite(n: number, context: string): number {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid non-finite number in ${context}: ${n}`);
  }
  return n;
}

/**
 * Formats a parent-relative bounding box to 2-decimal pinned format: [x:0.00 y:0.00 w:0.00 h:0.00].
 */
export function formatBoundingBox(box: BoundingBox, context = "boundingBox"): string {
  const x = assertFinite(box.x, `${context}.x`).toFixed(2);
  const y = assertFinite(box.y, `${context}.y`).toFixed(2);
  const width = assertFinite(box.width, `${context}.width`).toFixed(2);
  const height = assertFinite(box.height, `${context}.height`).toFixed(2);
  return `[x:${x} y:${y} w:${width} h:${height}]`;
}

function resolveSemanticDisplayName(node: SemanticTreeNode): string | undefined {
  if (node.semantic !== undefined) {
    return node.semantic.displayName;
  }
  const tag = node.shape.meta.semantic;
  if (tag === undefined) {
    return undefined;
  }
  return tag.id;
}

function formatSemanticDetails(node: SemanticTreeNode): string {
  const displayName = resolveSemanticDisplayName(node);
  if (displayName === undefined) {
    return "";
  }

  const parts: string[] = [escapeMarkdownText(displayName)];
  const properties = node.shape.meta.semantic?.properties;
  if (properties !== undefined) {
    const entries = Object.entries(properties);
    if (entries.length > 0) {
      entries.sort(([a], [b]) => a.localeCompare(b));
      for (const [key, value] of entries) {
        parts.push(`${escapeMarkdownText(key)}: ${escapeMarkdownText(String(value))}`);
      }
    }
  }

  return ` (${parts.join(", ")})`;
}

function resolveHumanLabel(shape: Shape, node: SemanticTreeNode): string {
  if (shape.label !== undefined && shape.label !== "") {
    return escapeMarkdownText(shape.label);
  }
  if (shape.content !== undefined && shape.content !== "") {
    return escapeMarkdownText(shape.content);
  }
  const semanticDisplayName = resolveSemanticDisplayName(node);
  if (semanticDisplayName !== undefined && node.semantic !== undefined) {
    return escapeMarkdownText(semanticDisplayName);
  }
  return escapeMarkdownText(node.displayName);
}

function formatHiddenOn(hiddenOn: readonly DeviceType[] | undefined): string {
  if (hiddenOn === undefined || hiddenOn.length === 0) {
    return "";
  }
  const sorted = [...hiddenOn].map((d) => DEVICE_TYPES[d] ?? d).sort((a, b) => a.localeCompare(b));
  return ` _(hidden on ${sorted.map(escapeMarkdownText).join(", ")})_`;
}

function formatConflict(node: SemanticTreeNode): string {
  if (!node.conflict || node.conflict.status !== SEMANTIC_CONFLICTS.conflicted) {
    return "";
  }
  const reason = escapeMarkdownText(node.conflict.reason ?? "conflicted semantic tag");
  return ` ⚠️ _[CONFLICT: ${reason}]_`;
}

/**
 * Formats a single tree row with indentation, chip ID, label/semantic, kind, and box (B1-B3).
 */
export function formatTreeRow(node: SemanticTreeNode): string {
  const indent = "  ".repeat(node.depth);
  const chipId = formatChipId(node.shape.id);
  const box = formatBoundingBox(node.shape.boundingBox, `shape ${node.shape.id}`);
  const hiddenStr = formatHiddenOn(node.shape.meta.hiddenOn);
  const conflictStr = formatConflict(node);

  if (node.shape.meta.semantic === undefined) {
    const hasExplicitLabel =
      (node.shape.label !== undefined && node.shape.label !== "") ||
      (node.shape.content !== undefined && node.shape.content !== "");
    const labelPrefix = hasExplicitLabel ? `${resolveHumanLabel(node.shape, node)} ` : "";
    return `${indent}- ${chipId} — ${labelPrefix}(untagged ${node.shape.kind}) ${box}${hiddenStr}${conflictStr}`;
  }

  const label = resolveHumanLabel(node.shape, node);
  const semanticDetails = formatSemanticDetails(node);
  const kind = node.shape.kind;

  return `${indent}- ${chipId} — ${label}${semanticDetails} — ${kind} ${box}${hiddenStr}${conflictStr}`;
}

/**
 * Formats the on-demand chip-keyed legend section (B5).
 */
export function formatLegend(nodes: readonly SemanticTreeNode[]): string {
  if (nodes.length === 0) {
    return "";
  }

  const lines: string[] = ["## Legend", ""];

  for (const node of nodes) {
    const chipId = formatChipId(node.shape.id);
    if (node.shape.meta.semantic === undefined) {
      const hasExplicitLabel =
        (node.shape.label !== undefined && node.shape.label !== "") ||
        (node.shape.content !== undefined && node.shape.content !== "");
      const labelPrefix = hasExplicitLabel ? `${resolveHumanLabel(node.shape, node)} ` : "";
      lines.push(`- ${chipId} — ${labelPrefix}(untagged ${node.shape.kind})`);
    } else {
      const label = resolveHumanLabel(node.shape, node);
      const semanticDetails = formatSemanticDetails(node);
      lines.push(`- ${chipId} — ${label}${semanticDetails}`);
    }
  }

  return lines.join("\n");
}
