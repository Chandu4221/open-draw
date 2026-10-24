import { CanvasEditor } from '@open-draw/canvas';
import { inferType, validateSemantics } from '@open-draw/semantics';
import { PlaygroundTagPanel } from '../../../../apps/studio/src/playground-tag-panel.js';
import { PlaygroundCompileModal } from '../../../../apps/studio/src/playground-compile-modal.js';
import { StudioInspector } from '../../../../apps/studio/src/inspector/inspector.js';
import { ChipController, type ChipMode } from '../../../../apps/studio/src/chips.js';

const container = document.getElementById('canvas-container') as HTMLElement;
const editor = new CanvasEditor();
editor.mount(container);

const tagPanel = new PlaygroundTagPanel(editor, document.body);
const tagPanelEl = document.getElementById('tag-panel');
if (tagPanelEl) tagPanelEl.style.right = '300px';
const chips = new ChipController(editor);
chips.setMode('off');
const inspector = new StudioInspector(editor, document.body);
const compileModal = new PlaygroundCompileModal(editor, () => inspector.docSettings.getState());

// Expose debug handle in dev
(window as unknown as {
  __od_debug__: {
    editor: CanvasEditor;
    telemetry: unknown;
    CanvasEditor: typeof CanvasEditor;
    semantics: { inferType: typeof inferType; validateSemantics: typeof validateSemantics };
    setChipMode: (mode: ChipMode) => void;
    tagPanel: PlaygroundTagPanel;
    compileModal: PlaygroundCompileModal;
    inspector: StudioInspector;
    chips: ChipController;
  };
}).__od_debug__ = {
  editor,
  telemetry: editor.telemetry,
  CanvasEditor,
  semantics: {
    inferType,
    validateSemantics,
  },
  setChipMode: (mode: ChipMode) => chips.setMode(mode),
  tagPanel,
  compileModal,
  inspector,
  chips,
};

// Wire creation-time smart defaults inference listener
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
