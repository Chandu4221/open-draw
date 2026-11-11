import {
  CAPABILITIES,
  createDocument,
  createEditor,
  createRect,
  parseCustomShapeKind,
  parseShapeId,
  type CustomShapeExtension,
  type Editor,
} from "@open-draw/canvas";

declare global {
  interface Window {
    __editorPrimary?: Editor;
    __editorSecondary?: Editor;
    __customStarExtension?: CustomShapeExtension;
  }
}

const primaryContainer = document.getElementById("editor-primary");
const secondaryContainer = document.getElementById("editor-secondary");

if (primaryContainer && secondaryContainer) {
  const starKind = parseCustomShapeKind("vendor:star");
  const starExtension: CustomShapeExtension = {
    kind: starKind,
    label: "Vendor Star",
    capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
    hitTest: (box, _shape, point) => {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const dx = Math.abs(point.x - cx) / (box.width / 2);
      const dy = Math.abs(point.y - cy) / (box.height / 2);
      return dx + dy <= 1.0;
    },
    render: (_shape, box) =>
      `<polygon class="custom-star" points="${box.x + box.width / 2},${box.y} ${box.x + box.width},${box.y + box.height} ${box.x},${box.y + box.height}" fill="#ffd700" />`,
  };

  window.__customStarExtension = starExtension;

  const primaryEditor = createEditor(primaryContainer, {
    document: createDocument([
      createRect(parseShapeId("rect-init"), { x: 50, y: 50, width: 120, height: 80 }),
    ]),
  });
  window.__editorPrimary = primaryEditor;

  const secondaryEditor = createEditor(secondaryContainer, {
    document: createDocument([
      createRect(parseShapeId("rect-sec"), { x: 80, y: 80, width: 100, height: 60 }),
    ]),
  });
  window.__editorSecondary = secondaryEditor;
}
