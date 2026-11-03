import { parseDocument, serializeDocument, type Document } from "@open-draw/document";
import { exportMarkdown } from "@open-draw/export-markdown";

export function exportDocumentJson(doc: Document): void {
  const json = serializeDocument(doc);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-document.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDocumentMarkdown(doc: Document): void {
  const md = exportMarkdown(doc);
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
