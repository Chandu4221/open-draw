// Structured Markdown semantic projection exporter (Milestone 11A B1-B3, B5).
// Pure Document → string projection, zero side effects (R-008, R-016).
// Consumes walkSemanticTree to guarantee 100% hierarchy parity with the canvas (ADR-0004).
// Byte-stable by construction: deterministic sort orders, zero timestamps (R-041).
import { ROOT_ID } from "@open-draw/contracts";
import type { Document } from "@open-draw/document";
import { walkSemanticTree } from "@open-draw/semantics";
import { compileAiDirectives } from "./ai-directives";
import { escapeCodeSpan, escapeMarkdownText } from "./escape-markdown";
import { formatLegend, formatTreeRow } from "./format-tree";
import type { MarkdownExportOptions } from "./types";

export { escapeCodeSpan, escapeMarkdownText };
export type { MarkdownExportOptions };

/**
 * Pure function exporting an OpenDraw document to human-readable, AI-ready Markdown.
 * Deterministic and byte-stable (R-016, R-025, R-041).
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

  if (options?.creativityLevel !== undefined || options?.includeAiDirectives === true) {
    const directives = compileAiDirectives(doc, options);
    if (directives.length > 0) {
      lines.push("## AI Implementation Guidance");
      lines.push("");
      for (const directive of directives) {
        lines.push(directive);
      }
      lines.push("");
    }
  }

  if (nodes.length === 0) {
    if (includeHeader) {
      lines.push("*(Empty canvas)*");
      lines.push("");
    }
    return lines.join("\n");
  }

  for (const node of nodes) {
    lines.push(formatTreeRow(node));
  }

  if (options?.includeLegend === true) {
    const legendBlock = formatLegend(nodes);
    if (legendBlock !== "") {
      lines.push("");
      lines.push(legendBlock);
    }
  }

  // Ensure trailing newline
  if (lines[lines.length - 1] !== "") {
    lines.push("");
  }

  return lines.join("\n");
}
