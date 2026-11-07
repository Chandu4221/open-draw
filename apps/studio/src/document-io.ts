import { parseDocument, type Document, type Shape } from "@open-draw/document";
import { exportJson, exportMarkdown } from "@open-draw/export-markdown";
import { documentToSvgWithLegend, type LegendItem } from "@open-draw/renderer-svg";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import { type CreativityLevel, DEFAULT_CREATIVITY_LEVEL } from "@open-draw/contracts";

export interface SvgExportOptions {
  readonly includeLegend?: boolean | undefined;
  readonly includeAnnotations?: boolean | undefined;
}

export interface MarkdownExportIoOptions {
  readonly creativityLevel?: CreativityLevel | undefined;
  readonly includeLegend?: boolean | undefined;
  readonly includeAsciiSketch?: boolean | undefined;
}

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

export function generateExportSvg(doc: Document, options?: SvgExportOptions | boolean): string {
  const includeLegend = typeof options === "boolean" ? options : (options?.includeLegend ?? false);
  const includeAnnotations =
    typeof options === "boolean" ? true : (options?.includeAnnotations ?? true);

  const resolveDisplayName = (shape: Shape): string => {
    const rootPlatform = resolveRootPlatform(doc, shape.id);
    const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
    return resolveShapeDisplayName(shape, profile);
  };

  return documentToSvgWithLegend(doc, {
    includeLegend,
    includeAnnotations,
    resolveDisplayName,
  });
}

export function exportDocumentSvg(doc: Document, options?: SvgExportOptions | boolean): void {
  const svg = generateExportSvg(doc, options);
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
  options?: SvgExportOptions | boolean,
  onError?: (err: unknown) => void,
): void {
  const svg = generateExportSvg(doc, options);
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

export async function copyDocumentPng(
  doc: Document,
  options?: SvgExportOptions | boolean,
): Promise<void> {
  const svg = generateExportSvg(doc, options);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Unable to create canvas 2D context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            reject(new Error("Unable to generate PNG blob"));
            return;
          }
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, "image/png");
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export function generateExportJson(
  doc: Document,
  creativityLevel: CreativityLevel = DEFAULT_CREATIVITY_LEVEL,
): string {
  return exportJson(doc, { creativityLevel });
}

export function generateExportMarkdown(
  doc: Document,
  options?: MarkdownExportIoOptions | CreativityLevel,
): string {
  const creativityLevel =
    typeof options === "number" ? options : (options?.creativityLevel ?? DEFAULT_CREATIVITY_LEVEL);
  const includeLegend = typeof options === "object" ? options.includeLegend : false;
  const includeAsciiSketch = typeof options === "object" ? options.includeAsciiSketch : undefined;

  return exportMarkdown(doc, { creativityLevel, includeLegend, includeAsciiSketch });
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

export function exportDocumentMarkdown(
  doc: Document,
  options?: MarkdownExportIoOptions | CreativityLevel,
): void {
  const md = generateExportMarkdown(doc, options);
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
