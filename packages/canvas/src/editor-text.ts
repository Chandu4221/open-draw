// Inline text editing overlay for standalone editor (R-004, R-008, R-010, R-016).
// Mounts a floating HTML textarea over the canvas container at shape bounds.
import type { ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, type Document } from "@open-draw/document";
import type { Camera } from "./camera";

export interface InlineTextEditorOptions {
  readonly container: HTMLElement;
  readonly doc: Document;
  readonly shapeId: ShapeId;
  readonly camera: Camera;
  readonly onCommit: (shapeId: ShapeId, content: string | null) => void;
  readonly onCancel?: (() => void) | undefined;
}

export function mountInlineTextEditor(options: InlineTextEditorOptions): () => void {
  const { container, doc, shapeId, camera, onCommit, onCancel } = options;
  const shape = doc.shapes[shapeId];
  if (shape === undefined) return () => {};

  const box = absoluteBoundingBox(doc, shape);
  const screenX = (box.x - camera.x) * camera.zoom;
  const screenY = (box.y - camera.y) * camera.zoom;
  const screenW = Math.max(80, box.width * camera.zoom);
  const screenH = Math.max(30, box.height * camera.zoom);

  const textarea = document.createElement("textarea");
  textarea.className = "od-inline-text-editor";
  textarea.value = shape.content ?? "";
  textarea.style.cssText = `position:absolute;left:${screenX}px;top:${screenY}px;width:${screenW}px;height:${screenH}px;z-index:100;font-family:sans-serif;font-size:${Math.max(12, Math.round(14 * camera.zoom))}px;text-align:center;resize:none;outline:2px solid var(--od-accent,#2563eb);border:none;background:rgba(255,255,255,0.95);padding:4px;box-sizing:border-box;`;

  container.appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
  } catch {
    // Unsupported in test or headless DOM environments
  }

  let active = true;

  function finish(commit: boolean): void {
    if (!active) return;
    active = false;
    cleanup();
    if (commit) {
      const trimmed = textarea.value.trim();
      onCommit(shapeId, trimmed.length > 0 ? trimmed : null);
    } else {
      onCancel?.();
    }
    if (container.contains(textarea)) {
      container.removeChild(textarea);
    }
  }

  function onBlur(): void {
    finish(true);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  }

  function cleanup(): void {
    textarea.removeEventListener("blur", onBlur);
    textarea.removeEventListener("keydown", onKeyDown);
  }

  textarea.addEventListener("blur", onBlur);
  textarea.addEventListener("keydown", onKeyDown);

  return () => finish(false);
}
