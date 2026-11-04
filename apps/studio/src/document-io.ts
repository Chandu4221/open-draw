import { parseDocument, serializeDocument, type Document } from "@open-draw/document";
import { exportMarkdown } from "@open-draw/export-markdown";
import { documentToSvgWithLegend, type LegendItem } from "@open-draw/renderer-svg";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import {
  type CreativityLevel,
  CREATIVITY_LEVEL_DEFINITIONS,
  DEFAULT_CREATIVITY_LEVEL,
} from "@open-draw/contracts";

export function extractDocumentLegendItems(doc: Document): readonly LegendItem[] {
  const seen = new Set<string>();
  const items: LegendItem[] = [];
  for (const shape of Object.values(doc.shapes)) {
    if (shape.meta.semantic !== undefined) {
      const tag = shape.meta.semantic.id;
      if (!seen.has(tag)) {
        seen.add(tag);
        const rootPlatform = resolveRootPlatform(doc, shape.id);
        const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
        const label = resolveShapeDisplayName(shape, profile);
        items.push({ tag, label });
      }
    }
  }
  return items;
}

export function exportDocumentSvg(doc: Document, includeLegend: boolean): void {
  const legendItems = includeLegend ? extractDocumentLegendItems(doc) : [];
  const svg = documentToSvgWithLegend(doc, { legendItems });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-diagram.svg";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDocumentPng(
  doc: Document,
  includeLegend: boolean,
  onError?: (err: unknown) => void,
): void {
  const legendItems = includeLegend ? extractDocumentLegendItems(doc) : [];
  const svg = documentToSvgWithLegend(doc, { legendItems });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create canvas 2D context");
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          onError?.(new Error("Unable to generate PNG blob from canvas"));
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "opendraw-diagram.png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    } catch (err) {
      URL.revokeObjectURL(url);
      onError?.(err);
    }
  };
  img.onerror = (err) => {
    URL.revokeObjectURL(url);
    onError?.(err);
  };
  img.src = url;
}

export function generateExportJson(
  doc: Document,
  creativityLevel: CreativityLevel = DEFAULT_CREATIVITY_LEVEL,
): string {
  const raw = serializeDocument(doc);
  const parsed = JSON.parse(raw) as {
    schema: { version: number };
    shapes: Record<string, unknown>;
  };
  const def = CREATIVITY_LEVEL_DEFINITIONS[creativityLevel];
  const withGuidance = {
    schema: parsed.schema,
    aiGuidance: {
      creativityLevel: def.level,
      name: def.name,
      description: def.description,
      directive: def.promptDirective,
    },
    shapes: parsed.shapes,
  };
  return JSON.stringify(withGuidance, null, 2);
}

export function generateExportMarkdown(
  doc: Document,
  creativityLevel: CreativityLevel = DEFAULT_CREATIVITY_LEVEL,
): string {
  return exportMarkdown(doc, { creativityLevel });
}

export function exportDocumentJson(doc: Document, creativityLevel?: CreativityLevel): void {
  const json = generateExportJson(doc, creativityLevel);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-document.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDocumentMarkdown(doc: Document, creativityLevel?: CreativityLevel): void {
  const md = generateExportMarkdown(doc, creativityLevel);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-document.md";
  a.click();
  URL.revokeObjectURL(url);
}

export function promptLoadDocumentJson(
  onLoaded: (doc: Document) => void,
  onError: (err: unknown) => void,
): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const loaded = parseDocument(text);
      onLoaded(loaded);
    } catch (err) {
      onError(err);
    }
  };
  input.click();
}
