import { CanvasEditor } from '@open-draw/canvas';
import { inferType, validateSemantics } from '@open-draw/semantics';
import type { ShapeRecord } from '@open-draw/schema';
import { PlaygroundTagPanel } from '../../../../apps/studio/src/playground-tag-panel.js';
import { PlaygroundCompileModal } from '../../../../apps/studio/src/playground-compile-modal.js';

const container = document.getElementById('canvas-container') as HTMLElement;
const editor = new CanvasEditor();
editor.mount(container);
const tagPanel = new PlaygroundTagPanel(editor, document.body);
const compileModal = new PlaygroundCompileModal(editor);

// Expose debug handle in dev
(window as unknown as {
  __od_debug__: {
    editor: CanvasEditor;
    telemetry: unknown;
    CanvasEditor: typeof CanvasEditor;
    semantics: { inferType: typeof inferType; validateSemantics: typeof validateSemantics };
    setChipMode: (mode: 'always' | 'hover' | 'off') => void;
    tagPanel: PlaygroundTagPanel;
    compileModal: PlaygroundCompileModal;
  };
}).__od_debug__ = {
  editor,
  telemetry: editor.telemetry,
  CanvasEditor,
  semantics: {
    inferType,
    validateSemantics,
  },
  setChipMode: (mode: 'always' | 'hover' | 'off') => {
    chipMode = mode;
    updateChips();
  },
  tagPanel,
  compileModal,
};

let chipMode: 'always' | 'hover' | 'off' = 'off';

function renderChip(shape: ShapeRecord): void {
  const slot = editor.getOverlaySlot(shape.id);
  if (!slot) return;

  const existing = slot.querySelector('.od-semantic-chip');
  if (existing) existing.remove();

  if (chipMode === 'off') return;

  const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
  const type = (semantic.type as string) || shape.type;
  const name = (semantic.name as string) || '';
  const labelText = `#${shape.id} ${name || type}`;

  const isSelected = editor.isSelected(shape.id);
  const parentId = (shape.meta?.parent ?? shape.meta?.parentId) as string | undefined;
  const isParentOfSelected = parentId ? editor.selection.some((id) => {
    const s = editor.store.getShape(id);
    return s && (s.meta.parent === shape.id || s.meta.parentId === shape.id);
  }) : false;

  const shouldShow = chipMode === 'always' || isSelected || isParentOfSelected;
  if (!shouldShow) return;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'od-semantic-chip od-chip-visible');
  g.setAttribute('data-shape-id', shape.id);
  g.setAttribute('data-semantic-type', type);
  g.setAttribute('aria-hidden', 'true');
  g.setAttribute('style', 'pointer-events: none; opacity: 1;');

  const textWidth = Math.max(50, labelText.length * 7 + 8);
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '-20');
  rect.setAttribute('width', String(textWidth));
  rect.setAttribute('height', '18');
  rect.setAttribute('rx', '3');
  rect.setAttribute('ry', '3');
  rect.setAttribute('fill', '#0f172a');
  rect.setAttribute('pointer-events', 'none');

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '4');
  text.setAttribute('y', '-7');
  text.setAttribute('fill', '#f8fafc');
  text.setAttribute('font-size', '10');
  text.setAttribute('font-family', 'monospace');
  text.setAttribute('pointer-events', 'none');
  text.textContent = labelText;

  g.appendChild(rect);
  g.appendChild(text);
  slot.appendChild(g);
}

function updateChips(): void {
  for (const shape of editor.store.listShapes()) {
    renderChip(shape);
  }
}

// 1. Wire creation-time smart defaults inference listener per Phase 3 §2
editor.store.listen((diff) => {
  if (diff.created.size > 0) {
    for (const id of diff.created) {
      const shape = editor.store.getShape(id);
      if (shape) {
        const inferred = inferType(shape, editor.getSnapshot());
        if (inferred && inferred.tier === 'strong') {
          editor.store.updateShape(id, {
            meta: {
              ...shape.meta,
              semantic: {
                ...((shape.meta.semantic as Record<string, unknown>) ?? {}),
                type: inferred.type,
                inferredType: inferred.type,
              },
            },
          });
          editor.store.mergeLastHistoryEntry();
        }
      }
    }
  }
  updateChips();
});

editor.selectionManager.subscribe(() => {
  updateChips();
});

if (new URLSearchParams(window.location.search).get('perf') === '1') {
  editor.telemetry.enable(container);
}

document.getElementById('btn-pan')?.addEventListener('click', () => {
  editor.pan(100, 100);
});
document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 1.5);
});
document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 0.75);
});
document.getElementById('btn-reset')?.addEventListener('click', () => {
  editor.setCamera({ x: 0, y: 0, zoom: 1 });
});
